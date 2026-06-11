/**
 * SCOLANGO — Génération PDF bulletins via Puppeteer
 * POST /api/bulletins/pdf  → Génère et retourne un PDF
 */
import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, requireRole, AuthRequest } from "./auth";

export const bulletinsRouter = Router();

// ─── Schéma de validation ────────────────────────────────────────────────────
const PdfRequestSchema = z.object({
  eleveId:     z.string().min(1),
  examenId:    z.string().min(1),
  // Données précalculées côté client pour ne pas recharger tout depuis BDD
  eleveNom:    z.string().max(100),
  classeNom:   z.string().max(80),
  examenNom:   z.string().max(80),
  annee:       z.string().max(20),
  moyenne:     z.number().min(0).max(20),
  rang:        z.number().min(1).optional(),
  totalEleves: z.number().min(1).optional(),
  appreciation: z.string().max(500).optional(),
  matieres: z.array(z.object({
    nom:        z.string().max(80),
    coefficient: z.number(),
    moyenne:    z.number().min(0).max(20),
    notes:      z.array(z.number()),
  })).max(30),
  etablissement: z.object({
    nom:     z.string().max(150),
    adresse: z.string().max(200),
    devise:  z.string().max(20),
  }),
});

type PdfRequest = z.infer<typeof PdfRequestSchema>;

// ─── Générateur HTML → PDF ────────────────────────────────────────────────────
function buildBulletinHtml(data: PdfRequest): string {
  const getMention = (avg: number) => {
    if (avg >= 16) return { label: 'Très Bien', color: '#059669' };
    if (avg >= 14) return { label: 'Bien', color: '#0d9488' };
    if (avg >= 12) return { label: 'Assez Bien', color: '#0284c7' };
    if (avg >= 10) return { label: 'Passable', color: '#ca8a04' };
    return { label: 'Insuffisant', color: '#dc2626' };
  };

  const mention = getMention(data.moyenne);
  const lignesMatieres = data.matieres.map(m => {
    const notesCells = m.notes.slice(0, 4).map(v =>
      `<td style="text-align:center;font-size:11px;padding:5px 4px;border:1px solid #e2e8f0;">${v.toFixed(2)}</td>`
    ).join('');
    const moyColor = m.moyenne >= 10 ? '#065f46' : '#991b1b';
    const moyBg    = m.moyenne >= 10 ? '#d1fae5' : '#fee2e2';
    return `
      <tr>
        <td style="padding:6px 10px;font-size:11.5px;font-weight:600;border:1px solid #e2e8f0;">${m.nom}</td>
        <td style="text-align:center;font-size:11px;padding:5px 4px;border:1px solid #e2e8f0;">${m.coefficient}</td>
        ${notesCells}
        <td style="text-align:center;font-size:12px;font-weight:700;padding:5px 8px;border:1px solid #e2e8f0;background:${moyBg};color:${moyColor};">${m.moyenne.toFixed(2)}</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Bulletin — ${data.eleveNom}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Arial', sans-serif; font-size: 12px; color: #1e293b; background: white; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #ea580c; padding-bottom: 16px; margin-bottom: 18px; }
    .school-name { font-size: 18px; font-weight: 800; color: #ea580c; }
    .school-sub  { font-size: 10px; color: #64748b; margin-top: 2px; }
    .doc-title   { font-size: 14px; font-weight: 700; text-align: right; }
    .doc-period  { font-size: 10px; color: #64748b; text-align: right; }
    .student-box { background: #fff7ed; border: 1.5px solid #fed7aa; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: flex; gap: 40px; }
    .student-box .field { font-size: 10px; color: #64748b; margin-bottom: 2px; }
    .student-box .value { font-size: 13px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead tr { background: #1e293b; color: white; }
    thead th { padding: 7px 8px; font-size: 10.5px; text-align: center; border: 1px solid #334155; }
    thead th:first-child { text-align: left; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .summary-box { display: flex; gap: 12px; margin-bottom: 16px; }
    .summary-card { flex: 1; border-radius: 8px; padding: 10px 14px; border: 1.5px solid; }
    .appreciation-box { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
    .appreciation-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
    .appreciation-text  { font-size: 11.5px; line-height: 1.6; color: #1e293b; font-style: italic; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
    .signature-area { display: flex; justify-content: space-between; margin-top: 24px; }
    .sig-box { text-align: center; font-size: 10px; color: #64748b; }
    .sig-line { border-top: 1px solid #94a3b8; margin-top: 40px; width: 140px; }
  </style>
</head>
<body>
  <!-- En-tête établissement -->
  <div class="header">
    <div>
      <div class="school-name">${data.etablissement.nom}</div>
      <div class="school-sub">${data.etablissement.adresse}</div>
      <div class="school-sub">Année scolaire : ${data.annee}</div>
    </div>
    <div>
      <div class="doc-title">BULLETIN DE NOTES</div>
      <div class="doc-period">${data.examenNom} — ${data.classeNom}</div>
      <div style="font-size:9px;color:#94a3b8;margin-top:4px;">Édité le ${new Date().toLocaleDateString('fr-FR')}</div>
    </div>
  </div>

  <!-- Infos élève -->
  <div class="student-box">
    <div>
      <div class="field">Nom & Prénom</div>
      <div class="value">${data.eleveNom}</div>
    </div>
    <div>
      <div class="field">Classe</div>
      <div class="value">${data.classeNom}</div>
    </div>
    ${data.rang ? `<div><div class="field">Rang</div><div class="value">${data.rang}${data.totalEleves ? ` / ${data.totalEleves}` : ''}</div></div>` : ''}
  </div>

  <!-- Tableau des notes -->
  <table>
    <thead>
      <tr>
        <th style="width:30%;text-align:left;">Matière</th>
        <th style="width:6%;">Coef.</th>
        <th>Note 1</th>
        <th>Note 2</th>
        <th>Note 3</th>
        <th>Compo.</th>
        <th style="width:10%;">Moy.</th>
      </tr>
    </thead>
    <tbody>
      ${lignesMatieres}
    </tbody>
  </table>

  <!-- Résumé -->
  <div class="summary-box">
    <div class="summary-card" style="border-color:${mention.color}20;background:${mention.color}10;">
      <div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;">Moyenne Générale</div>
      <div style="font-size:26px;font-weight:900;color:${mention.color};">${data.moyenne.toFixed(2)}<span style="font-size:14px;">/20</span></div>
    </div>
    <div class="summary-card" style="border-color:#3b82f620;background:#eff6ff;">
      <div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;">Mention</div>
      <div style="font-size:18px;font-weight:800;color:${mention.color};">${mention.label}</div>
    </div>
    ${data.rang ? `
    <div class="summary-card" style="border-color:#8b5cf620;background:#f5f3ff;">
      <div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;">Classement</div>
      <div style="font-size:22px;font-weight:800;color:#7c3aed;">${data.rang}${data.totalEleves ? `<span style="font-size:12px;font-weight:400;"> / ${data.totalEleves}</span>` : ''}</div>
    </div>` : ''}
  </div>

  <!-- Appréciation -->
  <div class="appreciation-box">
    <div class="appreciation-label">Appréciation du Conseil de Classe</div>
    <div class="appreciation-text">${data.appreciation || 'Résultats satisfaisants. L\'élève est encouragé à maintenir ses efforts.'}</div>
  </div>

  <!-- Signatures -->
  <div class="signature-area">
    <div class="sig-box"><div class="sig-line"></div>Signature de l'Enseignant(e) Principal(e)</div>
    <div class="sig-box"><div class="sig-line"></div>Cachet et Signature de la Direction</div>
    <div class="sig-box"><div class="sig-line"></div>Signature du Parent / Tuteur</div>
  </div>

  <!-- Pied de page -->
  <div class="footer" style="margin-top:20px;">
    <span>${data.etablissement.nom} — ${data.annee}</span>
    <span>Document officiel — Généré par Scolango</span>
  </div>
</body>
</html>`;
}

// ─── POST /api/bulletins/pdf ──────────────────────────────────────────────────
bulletinsRouter.post(
  "/pdf",
  requireAuth,
  requireRole(["admin", "directeur", "secretaire", "enseignant"]),
  async (req: AuthRequest, res: Response) => {
    const parsed = PdfRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Données invalides.", details: parsed.error.flatten() });
    }

    let browser;
    try {
      // Import dynamique pour Puppeteer (optionnel si non installé)
      const puppeteer = await import("puppeteer").catch(() => null);

      if (!puppeteer) {
        return res.status(501).json({
          error: "Module PDF non disponible. Installez puppeteer avec: npm install puppeteer",
        });
      }

      browser = await puppeteer.default.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });

      const page = await browser.newPage();
      const html = buildBulletinHtml(parsed.data);
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdf = await page.pdf({
        format: "A4",
        margin: { top: "15mm", right: "12mm", bottom: "15mm", left: "12mm" },
        printBackground: true,
      });

      const fileName = `bulletin_${parsed.data.eleveNom.replace(/\s+/g, "_")}_${parsed.data.examenNom.replace(/\s+/g, "_")}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Length", pdf.length);
      return res.send(Buffer.from(pdf));

    } catch (err) {
      console.error("PDF generation error:", err);
      return res.status(500).json({ error: "Erreur lors de la génération du PDF." });
    } finally {
      if (browser) await browser.close().catch(console.error);
    }
  }
);
