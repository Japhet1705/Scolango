/**
 * SCOLANGO — Routes d'authentification
 * POST /api/auth/login    → Connexion, retourne JWT
 * POST /api/auth/logout   → Invalide le token
 * GET  /api/auth/me       → Profil utilisateur courant
 */
import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../lib/db";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-prod";
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "8h";

// ─── Schéma de validation ────────────────────────────────────────────────────
const LoginSchema = z.object({
  email:    z.string().email("Email invalide."),
  password: z.string().min(4, "Mot de passe trop court."),
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────
authRouter.post("/login", async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Données invalides.", details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  try {
    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (!user || !user.active) {
      // Même délai que si le hash existe pour éviter timing attacks
      await bcrypt.hash("dummy", 10);
      return res.status(401).json({ error: "Identifiants incorrects ou compte désactivé." });
    }

    const passwordHash = user.passwordHash;
    if (!passwordHash) {
      return res.status(401).json({ error: "Compte non configuré. Contactez l'administrateur." });
    }

    const isValid = await bcrypt.compare(password, passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Mot de passe incorrect." });
    }

    // Génération du token JWT
    const payload = {
      userId: user.id,
      email:  user.email,
      role:   user.role,
      nom:    user.nom,
      prenom: user.prenom,
      ecoleId: user.ecoleId,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES } as jwt.SignOptions);

    // Cookie HTTP-only pour plus de sécurité (optionnel, utile si SPA + même domaine)
    res.cookie("scolango_token", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:   8 * 60 * 60 * 1000, // 8h
    });

    // On retourne aussi le token dans le body pour les clients SPA
    const { passwordHash: _h, ...safeUser } = user;
    return res.json({ token, user: safeUser });

  } catch (err) {
    console.error("Auth login error:", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

// ─── POST /api/auth/logout ───────────────────────────────────────────────────
authRouter.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("scolango_token");
  return res.json({ ok: true });
});

// ─── Middleware d'authentification ───────────────────────────────────────────
export interface AuthRequest extends Request {
  user?: { userId: string; email: string; role: string; nom: string; prenom: string; ecoleId?: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.scolango_token;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : cookieToken;

  if (!token) {
    return res.status(401).json({ error: "Token manquant. Veuillez vous connecter." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthRequest["user"];
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: () => void) => {
    if (!req.user) return res.status(401).json({ error: "Non authentifié." });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Accès refusé. Rôle requis : ${roles.join(", ")}.` });
    }
    next();
  };
}

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
authRouter.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });
    const { passwordHash: _h, ...safeUser } = user;
    return res.json(safeUser);
  } catch (err) {
    console.error("Auth me error:", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});
