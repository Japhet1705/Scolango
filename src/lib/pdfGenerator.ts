/**
 * SCOLANGO — Génération PDF côté serveur (Puppeteer)
 * Endpoint : POST /api/bulletins/pdf
 */

export interface BulletinPdfData {
  eleve: {
    nom: string; prenom: string; matricule: string;
    classeNom: string; sexe: string;
    heuresAbsence?: number; heuresRetard?: number;
    nbAvertissements?: number; nbBlames?: number;
  };
  examen: { nom: string; periode: string; };
  ecole: {
    nom: string; adresse: string; ville?: string; pays?: string;
    boitePostale?: string; devise: string;
    logoBlob?: string;
    signatureDirecteurBlob?: string;
    cachetOfficielBlob?: string;
    // Tutelles du cycle concerné
    ministere?: string;
    directionRegionale?: string;
    inspectionEnseignement?: string;
  };
  details: {
    mNom: string; coef: number;
    notesVal: number[]; moyMatiere: number;
    rangMatiere?: number;
  }[];
  moyenne: number;
  rang: number;
  totalEleves: number;
  appreciation: string;
}

export function buildBulletinHtml(data: BulletinPdfData): string {
  const getMention = (m: number) => {
    if (m >= 16) return { label: 'Très Bien',    color: '#10b981' };
    if (m >= 14) return { label: 'Bien',          color: '#3b82f6' };
    if (m >= 12) return { label: 'Assez Bien',    color: '#6366f1' };
    if (m >= 10) return { label: 'Passable',      color: '#f59e0b' };
    return        { label: 'Insuffisant',         color: '#ef4444' };
  };
  const mention = getMention(data.moyenne);

  const logoHtml = data.ecole.logoBlob
    ? `<img src="${data.ecole.logoBlob}" alt="Logo" style="height:64px;object-fit:contain;" />`
    : `<div style="width:64px;height:64px;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#94a3b8">Logo</div>`;

  const rows = data.details.map(d => `
    <tr>
      <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0">${d.mNom}</td>
      <td style="text-align:center;padding:5px;border-bottom:1px solid #e2e8f0">${d.coef}</td>
      <td style="text-align:center;padding:5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b">${d.notesVal.join(' / ') || '—'}</td>
      <td style="text-align:center;padding:5px;border-bottom:1px solid #e2e8f0;font-weight:700;color:${d.moyMatiere >= 10 ? '#166534' : '#991b1b'}">${d.moyMatiere.toFixed(2)}</td>
      <td style="text-align:center;padding:5px;border-bottom:1px solid #e2e8f0;color:#64748b">${d.rangMatiere ?? '—'}</td>
    </tr>`).join('');

  const disciplineHtml = (
    data.eleve.heuresAbsence != null || data.eleve.nbAvertissements != null
  ) ? `
    <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px">
      <tr style="background:#f1f5f9">
        <th style="padding:6px 8px;text-align:left;font-size:10px;color:#64748b">Absences (h)</th>
        <th style="padding:6px 8px;text-align:left;font-size:10px;color:#64748b">Retards (h)</th>
        <th style="padding:6px 8px;text-align:left;font-size:10px;color:#64748b">Avertissements</th>
        <th style="padding:6px 8px;text-align:left;font-size:10px;color:#64748b">Blâmes</th>
      </tr>
      <tr>
        <td style="padding:6px 8px;border:1px solid #e2e8f0;font-weight:700;color:${(data.eleve.heuresAbsence??0)>10?'#dc2626':'#1e293b'}">${data.eleve.heuresAbsence ?? 0}h</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0">${data.eleve.heuresRetard ?? 0}h</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0">${data.eleve.nbAvertissements ?? 0}</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0">${data.eleve.nbBlames ?? 0}</td>
      </tr>
    </table>` : '';

  const signatureHtml = data.ecole.signatureDirecteurBlob
    ? `<img src="${data.ecole.signatureDirecteurBlob}" alt="Signature" style="height:40px;object-fit:contain;margin-bottom:4px;" />`
    : `<div style="height:40px"></div>`;

  const cachetHtml = data.ecole.cachetOfficielBlob
    ? `<img src="${data.ecole.cachetOfficielBlob}" alt="Cachet" style="height:56px;object-fit:contain;position:absolute;top:8px;right:8px;opacity:0.8;" />`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8">
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:Arial,sans-serif; font-size:12px; color:#1e293b; background:white; padding:20px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }
  .tutelles { font-size:9px; color:#64748b; line-height:1.6; }
  .school-name { font-size:16px; font-weight:700; color:#ea580c; }
  .school-sub  { font-size:10px; color:#64748b; }
  .title-band  { background:#1e293b; color:white; text-align:center; padding:8px; font-size:13px; font-weight:700; margin-bottom:10px; }
  .eleve-box   { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; margin-bottom:12px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; font-size:10px; }
  .eleve-box strong { color:#ea580c; }
  table        { width:100%; border-collapse:collapse; margin-bottom:12px; }
  thead tr     { background:#1e293b; color:white; }
  thead th     { padding:7px 8px; font-size:10px; }
  td           { font-size:11px; }
  .summary     { display:flex; justify-content:space-between; background:#1e293b; color:white; border-radius:8px; padding:12px 18px; margin-bottom:12px; }
  .summary .big { font-size:22px; font-weight:700; color:#f97316; }
  .appre-box   { border:1px solid #e2e8f0; border-radius:8px; padding:10px; margin-bottom:14px; }
  .appre-label { font-size:9px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:3px; }
  .appre-text  { font-size:11px; color:#334155; font-style:italic; }
  .sig-grid    { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .sig-box     { border:1px dashed #cbd5e1; border-radius:8px; padding:14px; text-align:center; position:relative; min-height:80px; }
  .sig-label   { font-size:9px; color:#94a3b8; }
  .footer      { border-top:1px solid #e2e8f0; margin-top:12px; padding-top:8px; font-size:9px; color:#94a3b8; display:flex; justify-content:space-between; }
</style></head>
<body>
  <div class="header">
    <div class="tutelles">
      ${data.ecole.ministere ? `<div><b>Ministère :</b> ${data.ecole.ministere}</div>` : ''}
      ${data.ecole.directionRegionale ? `<div><b>Direction :</b> ${data.ecole.directionRegionale}</div>` : ''}
      ${data.ecole.inspectionEnseignement ? `<div><b>Inspection :</b> ${data.ecole.inspectionEnseignement}</div>` : ''}
    </div>
    <div style="text-align:center">
      ${logoHtml}
      <div class="school-name">${data.ecole.nom}</div>
      <div class="school-sub">${data.ecole.adresse}${data.ecole.ville ? ', ' + data.ecole.ville : ''}${data.ecole.pays ? ' — ' + data.ecole.pays : ''}</div>
      ${data.ecole.boitePostale ? `<div class="school-sub">BP ${data.ecole.boitePostale}</div>` : ''}
    </div>
    <div style="text-align:right;font-size:10px;color:#64748b">
      <div style="font-weight:700">${data.examen.nom}</div>
      <div>Année : ${data.examen.periode}</div>
    </div>
  </div>

  <div class="title-band">BULLETIN DE NOTES OFFICIEL</div>

  <div class="eleve-box">
    <span><strong>Élève :</strong> ${data.eleve.prenom} ${data.eleve.nom}</span>
    <span><strong>Matricule :</strong> ${data.eleve.matricule}</span>
    <span><strong>Classe :</strong> ${data.eleve.classeNom}</span>
    <span><strong>Sexe :</strong> ${data.eleve.sexe === 'M' ? 'Masculin' : 'Féminin'}</span>
    <span><strong>Rang :</strong> ${data.rang}${data.rang===1?'er':'ème'} / ${data.totalEleves}</span>
    <span><strong>Mention :</strong> <span style="color:${mention.color};font-weight:700">${mention.label}</span></span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:left">Matière</th>
        <th>Coef.</th>
        <th>Notes obtenues</th>
        <th>Moy. matière</th>
        <th>Rang/mat.</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="summary">
    <div><div style="font-size:10px;opacity:.7">Moyenne générale</div><div class="big">${data.moyenne.toFixed(2)}/20</div></div>
    <div style="text-align:center"><div style="font-size:10px;opacity:.7">Mention</div><div style="font-size:15px;font-weight:700;color:${mention.color}">${mention.label}</div></div>
    <div style="text-align:right"><div style="font-size:10px;opacity:.7">Classement</div><div style="font-size:18px;font-weight:700">${data.rang} / ${data.totalEleves}</div></div>
  </div>

  ${disciplineHtml}

  <div class="appre-box">
    <div class="appre-label">Appréciation du conseil de classe</div>
    <div class="appre-text">${data.appreciation || 'Appréciation non renseignée.'}</div>
  </div>

  <div class="sig-grid">
    <div class="sig-box">
      ${signatureHtml}
      <div class="sig-label">Le Chef d'Établissement</div>
      ${cachetHtml}
    </div>
    <div class="sig-box">
      <div style="height:40px"></div>
      <div class="sig-label">Lu et approuvé — Parent / Tuteur légal</div>
    </div>
  </div>

  <div class="footer">
    <span>Document officiel généré par Scolango • ${new Date().toLocaleDateString('fr-FR')}</span>
    <span>${data.ecole.devise ? 'Devise : ' + data.ecole.devise : ''}</span>
  </div>
</body></html>`;
}

export async function generatePdfBuffer(data: BulletinPdfData): Promise<Buffer> {
  const puppeteer = await import('puppeteer').catch(() => null);
  if (!puppeteer) throw new Error('Puppeteer non installé. Exécutez : npm install puppeteer');
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(buildBulletinHtml(data), { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format:'A4', printBackground:true, margin:{top:'10mm',bottom:'10mm',left:'10mm',right:'10mm'} });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

// ─── Reçu de caisse PDF ───────────────────────────────────────────────────────

export interface RecuPdfData {
  recuNumero: string;
  datePaiement: string;
  montant: number;
  type: string;
  modePaiement: string;
  notes?: string;
  eleve: { nom: string; prenom: string; matricule: string; classeNom: string; parentNom?: string };
  caissier: { nom: string; prenom: string };
  ecole: {
    nom: string; adresse: string; ville?: string; boitePostale?: string;
    logoBlob?: string; cachetOfficielBlob?: string;
    telEtablissement?: string; emailEtablissement?: string;
  };
}

export function buildRecuHtml(data: RecuPdfData): string {
  const logoHtml = data.ecole.logoBlob
    ? `<img src="${data.ecole.logoBlob}" alt="Logo" style="height:50px;object-fit:contain;" />`
    : '';

  const cachetHtml = data.ecole.cachetOfficielBlob
    ? `<img src="${data.ecole.cachetOfficielBlob}" alt="Cachet" style="height:52px;object-fit:contain;position:absolute;right:8px;bottom:8px;opacity:0.75;" />`
    : '';

  const designation: Record<string, string> = {
    inscription: "Frais d'inscription académique",
    scolarite:   'Frais de scolarité',
    tranche1:    'Scolarité — Tranche 1',
    tranche2:    'Scolarité — Tranche 2',
    tranche3:    'Scolarité — Tranche 3',
    autre:       'Versement divers',
  };

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:12px;color:#1e293b;background:white;padding:24px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #ea580c;padding-bottom:12px;margin-bottom:14px}
  .school-name{font-size:15px;font-weight:700;color:#ea580c}
  .school-sub{font-size:10px;color:#64748b;margin-top:2px}
  .badge{background:#ea580c;color:white;font-size:9px;font-weight:700;padding:3px 8px;border-radius:4px;text-transform:uppercase}
  .recu-num{font-size:13px;font-weight:700;font-family:monospace;color:#1e293b;margin-top:4px}
  .eleve-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;margin-bottom:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:10px}
  .eleve-box strong{color:#ea580c}
  table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:11px}
  thead tr{background:#1e293b;color:white}
  thead th{padding:7px 8px;text-align:left}
  tbody td{padding:8px;border-bottom:1px solid #e2e8f0}
  .total-box{background:#1e293b;color:white;border-radius:8px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
  .total-amount{font-size:20px;font-weight:700;color:#f97316}
  .sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
  .sig-box{border:1px dashed #cbd5e1;border-radius:8px;padding:12px;text-align:center;min-height:70px;position:relative}
  .sig-label{font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:700}
  .footer{border-top:1px solid #e2e8f0;margin-top:12px;padding-top:8px;font-size:9px;color:#94a3b8;display:flex;justify-content:space-between}
</style></head>
<body>
  <div class="header">
    <div style="display:flex;align-items:center;gap:12px">
      ${logoHtml}
      <div>
        <div class="school-name">${data.ecole.nom}</div>
        <div class="school-sub">${data.ecole.adresse}${data.ecole.ville ? ', ' + data.ecole.ville : ''}</div>
        ${data.ecole.boitePostale ? `<div class="school-sub">BP ${data.ecole.boitePostale}</div>` : ''}
        ${data.ecole.telEtablissement ? `<div class="school-sub">Tél: ${data.ecole.telEtablissement}</div>` : ''}
      </div>
    </div>
    <div style="text-align:right">
      <div class="badge">Reçu Officiel de Caisse</div>
      <div class="recu-num">${data.recuNumero}</div>
      <div style="font-size:10px;color:#64748b;margin-top:4px">Date : ${data.datePaiement}</div>
    </div>
  </div>

  <div class="eleve-box">
    <span><strong>Élève :</strong> ${data.eleve.prenom} ${data.eleve.nom}</span>
    <span><strong>Matricule :</strong> ${data.eleve.matricule}</span>
    <span><strong>Classe :</strong> ${data.eleve.classeNom}</span>
    ${data.eleve.parentNom ? `<span><strong>Parent/Tuteur :</strong> ${data.eleve.parentNom}</span>` : ''}
    <span><strong>Caissier :</strong> ${data.caissier.prenom} ${data.caissier.nom}</span>
    <span><strong>Mode :</strong> ${data.modePaiement}</span>
  </div>

  <table>
    <thead><tr><th>Désignation</th><th>Catégorie</th><th style="text-align:right">Montant versé (FCFA)</th></tr></thead>
    <tbody>
      <tr>
        <td style="font-weight:700">${designation[data.type] ?? data.type}</td>
        <td style="color:#64748b">${data.type}</td>
        <td style="text-align:right;font-weight:700;font-family:monospace">${data.montant.toLocaleString('fr-FR')}</td>
      </tr>
    </tbody>
  </table>

  <div class="total-box">
    <div>
      <div style="font-size:10px;opacity:.7;text-transform:uppercase">Règlement par</div>
      <div style="font-weight:700">${data.modePaiement}</div>
      ${data.notes ? `<div style="font-size:9px;color:#94a3b8;margin-top:2px">${data.notes}</div>` : ''}
    </div>
    <div style="text-align:right">
      <div style="font-size:10px;opacity:.7;text-transform:uppercase">Net versé</div>
      <div class="total-amount">${data.montant.toLocaleString('fr-FR')} FCFA</div>
    </div>
  </div>

  <div class="sig-grid">
    <div class="sig-box">
      <div style="height:42px"></div>
      <div class="sig-label">Le Caissier / Agent Comptable</div>
      <div style="font-size:10px;color:#334155;margin-top:4px">${data.caissier.prenom} ${data.caissier.nom}</div>
      ${cachetHtml}
    </div>
    <div class="sig-box">
      <div style="height:42px"></div>
      <div class="sig-label">Signature du parent / tuteur légal</div>
      <div style="font-size:9px;color:#94a3b8;margin-top:4px">Lu et approuvé</div>
    </div>
  </div>

  <div class="footer">
    <span>Document généré par Scolango • ${new Date().toLocaleDateString('fr-FR')}</span>
    <span>Reçu original — Conservez ce document</span>
  </div>
</body></html>`;
}

export async function generateRecuPdfBuffer(data: RecuPdfData): Promise<Buffer> {
  const puppeteer = await import('puppeteer').catch(() => null);
  if (!puppeteer) throw new Error('Puppeteer non installé.');
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(buildRecuHtml(data), { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A5', printBackground: true,
      margin: { top:'8mm', bottom:'8mm', left:'8mm', right:'8mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

// ─── Fiche d'appel vierge ─────────────────────────────────────────────────────
export interface FicheAppelData {
  classeNom: string;
  date: string;
  eleves: { matricule: string; nom: string; prenom: string }[];
  ecoleNom: string;
}

export function buildFicheAppelHtml(data: FicheAppelData): string {
  const rows = data.eleves.map((el, i) => `
    <tr>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;font-size:11px;color:#64748b">${i+1}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;font-size:10px;font-family:monospace">${el.matricule}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;font-size:11px;font-weight:600">${el.nom} ${el.prenom}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;width:60px"></td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;width:60px"></td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;width:80px"></td>
    </tr>`).join('');
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
  <style>* { box-sizing:border-box; margin:0; padding:0; } body { font-family:Arial,sans-serif; padding:20px; color:#1e293b; }
  h1 { font-size:16px; text-align:center; margin-bottom:4px; color:#ea580c; } .sub { font-size:11px; text-align:center; color:#64748b; margin-bottom:16px; }
  table { width:100%; border-collapse:collapse; } th { background:#1e293b; color:white; padding:8px; font-size:11px; text-align:left; }
  .footer { margin-top:20px; display:flex; justify-content:flex-end; } .sig { border:1px dashed #cbd5e1; padding:16px 50px; border-radius:8px; font-size:10px; color:#94a3b8; text-align:center; }
  </style></head><body>
  <h1>${data.ecoleNom}</h1>
  <div class="sub"><strong>FICHE D'APPEL</strong> &nbsp;|&nbsp; Classe : ${data.classeNom} &nbsp;|&nbsp; Date : ${data.date} &nbsp;|&nbsp; Enseignant : ___________________________</div>
  <table>
    <thead><tr><th style="width:36px;text-align:center">N°</th><th style="width:100px">Matricule</th><th>Nom &amp; Prénom</th><th style="text-align:center">Présent</th><th style="text-align:center">Absent</th><th style="text-align:center">Retard</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer"><div class="sig"><div style="margin-bottom:30px">Signature de l'enseignant</div><div>${data.date}</div></div></div>
  <div style="margin-top:10px;font-size:9px;color:#cbd5e1;text-align:center">Document généré par Scolango</div>
  </body></html>`;
}

export async function generateFicheAppelBuffer(data: FicheAppelData): Promise<Buffer> {
  const puppeteer = await import('puppeteer').catch(() => null);
  if (!puppeteer) throw new Error('Puppeteer non installé.');
  const browser = await puppeteer.default.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
  try {
    const page = await browser.newPage();
    await page.setContent(buildFicheAppelHtml(data), { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top:'15mm', bottom:'15mm', left:'15mm', right:'15mm' } });
    return Buffer.from(pdf);
  } finally { await browser.close(); }
}

// ─── Grille de notes vierge ───────────────────────────────────────────────────
export interface GrilleNotesData {
  classeNom: string;
  matiereNom: string;
  periodeNom: string;
  eleves: { matricule: string; nom: string; prenom: string }[];
  ecoleNom: string;
}

export function buildGrilleNotesHtml(data: GrilleNotesData): string {
  const rows = data.eleves.map((el, i) => `
    <tr>
      <td style="padding:5px 8px;border:1px solid #e2e8f0;text-align:center;font-size:10px">${i+1}</td>
      <td style="padding:5px 8px;border:1px solid #e2e8f0;font-size:11px;font-weight:600">${el.nom} ${el.prenom}</td>
      <td style="border:1px solid #e2e8f0;width:55px"></td>
      <td style="border:1px solid #e2e8f0;width:55px"></td>
      <td style="border:1px solid #e2e8f0;width:55px"></td>
      <td style="border:1px solid #e2e8f0;width:65px"></td>
      <td style="border:1px solid #e2e8f0;width:70px;background:#f8fafc"></td>
    </tr>`).join('');
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
  <style>* { box-sizing:border-box; margin:0; padding:0; } body { font-family:Arial,sans-serif; padding:20px; color:#1e293b; }
  h1 { font-size:15px; text-align:center; margin-bottom:4px; color:#ea580c; } .sub { font-size:11px; text-align:center; color:#64748b; margin-bottom:14px; }
  table { width:100%; border-collapse:collapse; } th { background:#1e293b; color:white; padding:7px; font-size:10px; text-align:center; }
  </style></head><body>
  <h1>${data.ecoleNom}</h1>
  <div class="sub"><strong>GRILLE DE NOTES</strong> &nbsp;|&nbsp; Matière : ${data.matiereNom} &nbsp;|&nbsp; Classe : ${data.classeNom} &nbsp;|&nbsp; Période : ${data.periodeNom}</div>
  <table>
    <thead><tr><th style="width:36px">N°</th><th style="text-align:left;padding-left:8px">Élève</th><th>Interro 1<br>/20</th><th>Interro 2<br>/20</th><th>Devoir<br>/20</th><th>Compo<br>/20</th><th>Moy.<br>/20</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div style="margin-top:14px;font-size:10px;color:#94a3b8;text-align:right">${data.ecoleNom} — ${new Date().toLocaleDateString('fr-FR')}</div>
  </body></html>`;
}

export async function generateGrilleNotesBuffer(data: GrilleNotesData): Promise<Buffer> {
  const puppeteer = await import('puppeteer').catch(() => null);
  if (!puppeteer) throw new Error('Puppeteer non installé.');
  const browser = await puppeteer.default.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
  try {
    const page = await browser.newPage();
    await page.setContent(buildGrilleNotesHtml(data), { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top:'15mm', bottom:'15mm', left:'15mm', right:'15mm' } });
    return Buffer.from(pdf);
  } finally { await browser.close(); }
}
