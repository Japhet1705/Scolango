import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { authRouter } from "./src/api/auth.ts";

// ─── Env ────────────────────────────────────────────────────────────────────
dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback to .env

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === "production";
const DEMO_MODE = process.env.DEMO_MODE !== "false"; // true by default in dev
const API_KEY = process.env.GEMINI_API_KEY;

// ─── Express app ────────────────────────────────────────────────────────────
const app = express();

// ─── Security middleware ─────────────────────────────────────────────────────
// Helmet adds secure HTTP headers
app.use(
  helmet({
    // In dev mode relax CSP so Vite HMR works
    contentSecurityPolicy: IS_PROD ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS — allow same-origin + configured APP_URL only
const allowedOrigins = [
  `http://localhost:${PORT}`,
  `http://127.0.0.1:${PORT}`,
  "http://localhost:5173",
  process.env.APP_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || !IS_PROD) {
        return cb(null, true);
      }
      if (allowedOrigins.some((o) => origin.startsWith(o))) {
        return cb(null, true);
      }
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// JSON body with size limit (protect against payload attacks)
app.use(express.json({ limit: "50kb" }));

// ─── Rate limiting ───────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,                   // max 60 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes. Veuillez réessayer dans 15 minutes." },
});

// Stricter limit for AI endpoints (they are expensive)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,             // max 10 AI calls per minute per IP
  message: { error: "Limite IA atteinte. Veuillez patienter une minute." },
});

// ─── JWT Auth middleware ─────────────────────────────────────────────────────
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "scolango-dev-secret-change-in-production";

interface JwtPayload {
  userId: string;
  role: string;
  email: string;
}

function verifyToken(req: express.Request): JwtPayload | null {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * RBAC middleware — protège une route selon les rôles autorisés.
 * En mode démo (DEMO_MODE=true) les vérifications sont allégées.
 */
function requireRole(allowedRoles: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // En mode démo, on laisse passer pour faciliter les tests
    if (DEMO_MODE) return next();

    const payload = verifyToken(req);
    if (!payload) {
      return res.status(401).json({ error: "Non authentifié. Token JWT requis." });
    }
    if (!allowedRoles.includes(payload.role)) {
      return res.status(403).json({
        error: `Accès refusé. Rôles autorisés : ${allowedRoles.join(", ")}. Votre rôle : ${payload.role}.`,
      });
    }
    (req as any).user = payload;
    return next();
  };
}

// POST /api/auth/login — Authentification et génération JWT
app.post("/api/auth/login", apiLimiter, async (req, res) => {
  const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1).max(128),
  });
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }

  // En mode démo : accepter le mot de passe "demo1234"
  if (DEMO_MODE && parsed.data.password === "demo1234") {
    const token = jwt.sign(
      { userId: "demo", role: "admin", email: parsed.data.email },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? "8h" }
    );
    return res.json({ token, message: "Mode démo — token généré." });
  }

  // Production : vérifier contre la BDD Prisma
  // TODO: const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // if (!user || !await bcrypt.compare(parsed.data.password, user.passwordHash)) {
  //   return res.status(401).json({ error: "Identifiants incorrects." });
  // }
  // const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "8h" });
  // return res.json({ token });

  return res.status(501).json({ error: "Authentification Prisma non encore activée. Activez la BDD PostgreSQL." });
});

// Register auth router
app.use("/api/auth", authRouter);
app.use("/api", apiLimiter);

// ─── Gemini AI client ────────────────────────────────────────────────────────
let ai: GoogleGenAI | null = null;

if (API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: { "User-Agent": "scolango/1.0" },
      },
    });
    console.log("✅ Gemini AI initialisé.");
  } catch (error) {
    console.error("❌ Échec d'initialisation Gemini:", error);
  }
} else {
  console.warn(
    "⚠️  GEMINI_API_KEY non trouvée. Le module IA fonctionnera en mode simulation."
  );
}

// ─── Input validation schemas (Zod) ─────────────────────────────────────────
const AppreciationSchema = z.object({
  studentName: z.string().min(2).max(100),
  average: z.number().min(0).max(20),
  subjectDetails: z.array(
    z.object({
      mNom: z.string().max(60),
      coef: z.number().min(0).max(20),
      moyMatiere: z.number().min(0).max(20),
    })
  ).max(20),
});

const AssistantMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        text: z.string().max(2000),
      })
    )
    .max(20)
    .optional(),
});

// ─── AI endpoints ────────────────────────────────────────────────────────────

// POST /api/gemini/appreciations — Generate a student report card comment
app.post("/api/gemini/appreciations", aiLimiter, requireRole(["admin","directeur","secretaire","enseignant","censeur"]), async (req, res) => {
  const parsed = AppreciationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Données invalides.",
      details: parsed.error.flatten(),
    });
  }

  const { studentName, average, subjectDetails } = parsed.data;

  const prompt = `Génère une appréciation trimestrielle scolaire professionnelle en français pour l'élève suivant :
Nom : ${studentName}
Moyenne Générale : ${average}/20
Détails des notes par matière :
${subjectDetails.map((s) => `- ${s.mNom} (coef ${s.coef}) : ${s.moyMatiere}/20`).join("\n")}

Instructions :
- Rédige un avis constructif, professionnel et encourageant (3 à 4 phrases).
- Adapte le ton à la moyenne : félicitant si ≥14, encourageant si 10-13.99, bienveillant mais direct si <10.
- Utilise un style typique d'un conseil de classe de lycée africain francophone.
- NE génère PAS de code, seulement le texte de l'appréciation.`;

  if (!ai) {
    // Fallback local si pas de clé IA
    const niveau = average >= 14 ? "excellent" : average >= 12 ? "bien" : average >= 10 ? "satisfaisant" : average >= 7 ? "insuffisant" : "en_difficulte";
    const fallbackJson = {
      appreciation: average >= 14
        ? `Excellent trimestre pour ${studentName} avec ${average}/20. L'élève fait preuve d'une grande rigueur et d'une excellente maîtrise des compétences. Félicitations du conseil de classe.`
        : average >= 10
        ? `Résultats satisfaisants pour ${studentName} avec ${average}/20. L'élève fait preuve de sérieux et de régularité. Des efforts supplémentaires permettront d'atteindre l'excellence.`
        : `Trimestre difficile pour ${studentName} avec ${average}/20. Les résultats demeurent insuffisants. Le conseil encourage vivement un travail plus régulier et sollicite un soutien parental actif.`,
      conseil: average >= 10
        ? "Continuez sur cette lancée et préparez les prochaines évaluations avec le même sérieux."
        : "Un travail journalier régulier et des révisions méthodiques sont indispensables pour progresser.",
      niveau,
    };
    return res.json(fallbackJson);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    const rawText = response.text ?? "";
    // Parse structured JSON output
    try {
      const clean = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      return res.json(parsed);
    } catch {
      // Fallback: wrap plain text in expected structure
      return res.json({
        appreciation: rawText,
        conseil: "",
        niveau: average >= 10 ? "satisfaisant" : "insuffisant",
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("Gemini /appreciations error:", message);
    return res
      .status(500)
      .json({ error: "Erreur de communication avec l'API IA.", message });
  }
});

// POST /api/gemini/assistant — Conversational AI assistant
app.post("/api/gemini/assistant", aiLimiter, requireRole(["admin","directeur","secretaire","enseignant","censeur","eleve","parent","comptable"]), async (req, res) => {
  const parsed = AssistantMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Données invalides.",
      details: parsed.error.flatten(),
    });
  }

  const { message, history } = parsed.data;

  const systemInstruction = `Tu es l'assistant pédagogique intégré à Scolango, un système d'information scolaire pour les établissements d'Afrique subsaharienne francophone.
Tu aides les administrateurs, directeurs, enseignants, élèves et parents à :
- Résoudre des exercices et expliquer des cours (niveau collège, lycée, supérieur).
- Générer des plannings scolaires ou des leçons types en français.
- Formuler des appréciations de bulletins de notes.
- Encourager et conseiller des élèves en difficulté.

Règles absolues :
- Réponds UNIQUEMENT en français standard.
- Sois bref, structuré et professionnel (utilise des listes à puces si pertinent).
- N'invente JAMAIS de données scolaires réelles sur des élèves spécifiques.
- Si une demande sort du cadre pédagogique/scolaire, décline poliment.`;

  if (!ai) {
    return res.json({
      text: `[Mode hors-ligne] Je suis l'assistant pédagogique Scolango. La clé API IA n'est pas configurée sur ce serveur. Votre question était : "${message.substring(0, 100)}...". Contactez votre administrateur système pour activer le module IA.`,
    });
  }

  try {
    const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({ role: h.role, parts: [{ text: h.text }] });
      }
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents,
      config: { systemInstruction },
    });

    return res.json({ text: response.text });
  } catch (err: unknown) {
    const message2 = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("Gemini /assistant error:", message2);
    return res
      .status(500)
      .json({ error: "Erreur du module IA.", message: message2 });
  }
});


// ─── Zod schema for synthese ─────────────────────────────────────────────────
const SyntheseSchema = z.object({
  classeNom:    z.string().max(80),
  periode:      z.string().max(80),
  totalEleves:  z.number().min(1).max(500),
  moyenneClasse:z.number().min(0).max(20),
  tauxReussite: z.number().min(0).max(100),
  meilleureMatiere: z.string().max(60).optional(),
  matiereEnDifficulte: z.string().max(60).optional(),
  admis:        z.number().min(0),
  redoublants:  z.number().min(0),
  exclus:       z.number().min(0),
});

// POST /api/gemini/synthese — Analytical synthesis for the director
app.post("/api/gemini/synthese", aiLimiter, requireRole(["admin","directeur"]), async (req, res) => {
  const parsed = SyntheseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Données invalides.", details: parsed.error.flatten() });
  }

  const d = parsed.data;
  const prompt = `Tu es conseiller pédagogique pour un lycée africain francophone. Génère une synthèse analytique JSON (sans markdown) pour le directeur :

Classe : ${d.classeNom} — Période : ${d.periode}
Effectif : ${d.totalEleves} élèves | Admis : ${d.admis} | Redoublants : ${d.redoublants} | Exclus : ${d.exclus}
Moyenne de classe : ${d.moyenneClasse}/20 | Taux de réussite : ${d.tauxReussite}%
${d.meilleureMatiere ? `Meilleure matière : ${d.meilleureMatiere}` : ""}
${d.matiereEnDifficulte ? `Matière difficile : ${d.matiereEnDifficulte}` : ""}

Réponds UNIQUEMENT avec ce JSON :
{
  "bilan": "Bilan global de la classe en 2-3 phrases formelles",
  "pointsForts": ["point fort 1", "point fort 2"],
  "pointsAmeliorer": ["axe d'amélioration 1", "axe d'amélioration 2"],
  "recommandations": "Recommandations concrètes pour le directeur et le corps enseignant (3-4 phrases)",
  "appreciation_generale": "Très Satisfaisant|Satisfaisant|Passable|Insuffisant"
}`;

  if (!ai) {
    return res.json({
      bilan: `La classe ${d.classeNom} présente une moyenne de ${d.moyenneClasse}/20 avec un taux de réussite de ${d.tauxReussite}%. Sur ${d.totalEleves} élèves, ${d.admis} sont admis.`,
      pointsForts: ["Assiduité globalement satisfaisante", "Progression par rapport à la période précédente"],
      pointsAmeliorer: ["Renforcement des matières scientifiques", "Soutien ciblé pour les élèves en difficulté"],
      recommandations: "Le conseil recommande la mise en place de cours de soutien ciblés et une communication renforcée avec les parents des élèves en difficulté.",
      appreciation_generale: d.moyenneClasse >= 12 ? "Satisfaisant" : d.moyenneClasse >= 10 ? "Passable" : "Insuffisant",
    });
  }

  try {
    const response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt });
    const rawText = response.text ?? "";
    try {
      const clean = rawText.replace(/```json|```/g, "").trim();
      return res.json(JSON.parse(clean));
    } catch {
      return res.json({ bilan: rawText, pointsForts: [], pointsAmeliorer: [], recommandations: "", appreciation_generale: "Passable" });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("Gemini /synthese error:", msg);
    return res.status(500).json({ error: "Erreur module IA.", message: msg });
  }
});


// ─── Fiche d'appel vierge ────────────────────────────────────────────────────
const FicheAppelSchema = z.object({
  classeNom: z.string().max(80),
  date:      z.string().max(20),
  ecoleNom:  z.string().max(150),
  eleves:    z.array(z.object({
    matricule: z.string().max(30),
    nom:       z.string().max(100),
    prenom:    z.string().max(100),
  })).max(100),
});

app.post("/api/impressions/fiche-appel",
  apiLimiter,
  requireRole(["admin","directeur","secretaire","censeur","surveillant","enseignant"]),
  async (req, res) => {
    const parsed = FicheAppelSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Données invalides.", details: parsed.error.flatten() });
    try {
      const pdf = await generateFicheAppelBuffer(parsed.data as FicheAppelData);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Appel_${parsed.data.classeNom}_${parsed.data.date.replace(/\//g,"-")}.pdf"`);
      return res.send(pdf);
    } catch (err: unknown) {
      return res.status(500).json({ error: "Erreur PDF.", message: err instanceof Error ? err.message : String(err) });
    }
  }
);

// ─── Grille de notes vierge ───────────────────────────────────────────────────
const GrilleNotesSchema = z.object({
  classeNom:  z.string().max(80),
  matiereNom: z.string().max(80),
  periodeNom: z.string().max(80),
  ecoleNom:   z.string().max(150),
  eleves:     z.array(z.object({
    matricule: z.string().max(30),
    nom:       z.string().max(100),
    prenom:    z.string().max(100),
  })).max(100),
});

app.post("/api/impressions/grille-notes",
  apiLimiter,
  requireRole(["admin","directeur","secretaire","censeur","enseignant"]),
  async (req, res) => {
    const parsed = GrilleNotesSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Données invalides.", details: parsed.error.flatten() });
    try {
      const pdf = await generateGrilleNotesBuffer(parsed.data as GrilleNotesData);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Grille_${parsed.data.matiereNom}_${parsed.data.classeNom}.pdf"`);
      return res.send(pdf);
    } catch (err: unknown) {
      return res.status(500).json({ error: "Erreur PDF.", message: err instanceof Error ? err.message : String(err) });
    }
  }
);

// GET /api/health — Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "scolango",
    version: "1.0.0",
    aiMode: ai ? "gemini-2.0-flash" : "offline-simulation",
    demoMode: DEMO_MODE,
    time: new Date().toISOString(),
  });
});

// ─── Vite / Static serving ───────────────────────────────────────────────────

// ─── Reçu de caisse PDF endpoint ─────────────────────────────────────────────
const RecuPdfSchema = z.object({
  recuNumero:    z.string().max(30),
  datePaiement:  z.string().max(20),
  montant:       z.number().min(0),
  type:          z.string().max(30),
  modePaiement:  z.string().max(30),
  notes:         z.string().max(200).optional(),
  eleve: z.object({
    nom:      z.string().max(100),
    prenom:   z.string().max(100),
    matricule:z.string().max(30),
    classeNom:z.string().max(80),
    parentNom:z.string().max(100).optional(),
  }),
  caissier: z.object({ nom: z.string().max(100), prenom: z.string().max(100) }),
  ecole: z.object({
    nom:                z.string().max(150),
    adresse:            z.string().max(200),
    ville:              z.string().max(80).optional(),
    boitePostale:       z.string().max(20).optional(),
    logoBlob:           z.string().optional(),
    cachetOfficielBlob: z.string().optional(),
    telEtablissement:   z.string().max(30).optional(),
    emailEtablissement: z.string().max(80).optional(),
  }),
});

app.post("/api/receipts/pdf", apiLimiter, async (req, res) => {
  const parsed = RecuPdfSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Données reçu invalides.", details: parsed.error.flatten() });
  }
  try {
    const pdfBuffer = await generateRecuPdfBuffer(parsed.data as RecuPdfData);
    const filename = `Recu_${parsed.data.recuNumero}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("Receipt PDF error:", message);
    return res.status(500).json({ error: "Échec de génération du reçu PDF.", message });
  }
});

async function startServer() {
  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA fallback — always serve index.html for unknown routes
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Scolango server → http://0.0.0.0:${PORT}`);
    console.log(`   Mode : ${IS_PROD ? "production" : "développement"}`);
    console.log(`   IA   : ${ai ? "Gemini 2.0 Flash" : "simulation locale"}`);
    console.log(`   Démo : ${DEMO_MODE ? "activé" : "désactivé"}\n`);
  });
}

startServer();

// ─── PDF bulletin endpoint ───────────────────────────────────────────────────
import { generatePdfBuffer, BulletinPdfData, generateRecuPdfBuffer, RecuPdfData,
  generateFicheAppelBuffer, FicheAppelData, generateGrilleNotesBuffer, GrilleNotesData } from "./src/lib/pdfGenerator.js";

const BulletinPdfSchema = z.object({
  eleve: z.object({
    nom: z.string().max(100),
    prenom: z.string().max(100),
    matricule: z.string().max(30),
    classeNom: z.string().max(80),
    sexe: z.string().max(1),
  }),
  examen: z.object({ nom: z.string().max(80), periode: z.string().max(20) }),
  ecole: z.object({ nom: z.string().max(150), adresse: z.string().max(200), devise: z.string().max(10) }),
  details: z.array(z.object({
    mNom: z.string().max(60),
    coef: z.number().min(0).max(20),
    notesVal: z.array(z.number().min(0).max(20)).max(30),
    moyMatiere: z.number().min(0).max(20),
  })).max(25),
  moyenne: z.number().min(0).max(20),
  rang: z.number().min(1),
  totalEleves: z.number().min(1),
  appreciation: z.string().max(1000),
});

app.post("/api/bulletins/pdf", apiLimiter, requireRole(["admin","directeur","secretaire","censeur"]), async (req, res) => {
  const parsed = BulletinPdfSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Données de bulletin invalides.", details: parsed.error.flatten() });
  }

  try {
    const pdfBuffer = await generatePdfBuffer(parsed.data as BulletinPdfData);
    const filename = `Bulletin_${parsed.data.eleve.nom}_${parsed.data.examen.nom.replace(/\s+/g, '_')}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("PDF generation error:", message);
    return res.status(500).json({ error: "Échec de génération PDF.", message });
  }
});
