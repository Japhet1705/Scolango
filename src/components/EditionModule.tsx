import React, { useState } from 'react';
import { useAppState } from '../stateContext';
import { Printer, Download, Users, BookOpen, Phone, Star, Loader2 } from 'lucide-react';

type DocType = 'fiche-appel' | 'grille-notes' | 'contacts-parents' | 'cartes';

export const EditionModule: React.FC = () => {
  const { classes, eleves, matieres, examens, parametres } = useAppState();

  const [docType,       setDocType]       = useState<DocType>('fiche-appel');
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id ?? '');
  const [selectedMat,   setSelectedMat]   = useState('');
  const [selectedExam,  setSelectedExam]  = useState(examens[0]?.id ?? '');
  const [loading,       setLoading]       = useState(false);
  const [success,       setSuccess]       = useState('');
  const [error,         setError]         = useState('');

  const classMatieres  = matieres.filter(m => m.classeId === selectedClass);
  const classStudents  = eleves
    .filter(e => e.classeId === selectedClass && (e.statut ?? 'actif') === 'actif')
    .sort((a, b) => a.nom.localeCompare(b.nom));
  const selectedClassName = classes.find(c => c.id === selectedClass)?.nom ?? '';

  const downloadPdf = async (endpoint: string, body: object, filename: string) => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setSuccess(`✓ ${filename} téléchargé avec succès.`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('501') || msg.includes('non installé')) {
        setError('Puppeteer non disponible — le PDF sera généré via l\'impression navigateur.');
        window.print();
      } else {
        setError(`Erreur : ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    setError(''); setSuccess('');
    const today = new Date().toLocaleDateString('fr-FR');
    const ecoleNom = parametres?.nomEtablissement ?? 'Scolango';
    const elevesList = classStudents.map(e => ({ matricule: e.matricule, nom: e.nom, prenom: e.prenom }));

    if (docType === 'fiche-appel') {
      downloadPdf('/api/impressions/fiche-appel', {
        classeNom: selectedClassName, date: today, ecoleNom, eleves: elevesList,
      }, `Appel_${selectedClassName}_${today.replace(/\//g, '-')}.pdf`);
    }
    else if (docType === 'grille-notes') {
      const mat = matieres.find(m => m.id === selectedMat);
      if (!mat) { setError('Sélectionnez une matière.'); return; }
      const ex = examens.find(e => e.id === selectedExam);
      downloadPdf('/api/impressions/grille-notes', {
        classeNom: selectedClassName, matiereNom: mat.nom,
        periodeNom: ex?.nom ?? '', ecoleNom, eleves: elevesList,
      }, `Grille_${mat.nom}_${selectedClassName}.pdf`);
    }
    else if (docType === 'contacts-parents') {
      // Impression navigateur (pas besoin de Puppeteer)
      const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
      <style>body{font-family:Arial;padding:20px;color:#1e293b}h1{font-size:16px;color:#ea580c;text-align:center}
      .sub{font-size:11px;text-align:center;color:#64748b;margin-bottom:14px}
      table{width:100%;border-collapse:collapse}th{background:#1e293b;color:white;padding:8px;font-size:11px;text-align:left}
      td{padding:7px 8px;border-bottom:1px solid #e2e8f0;font-size:11px}tr:nth-child(even)td{background:#f8fafc}</style>
      </head><body>
      <h1>${ecoleNom} — Répertoire des Contacts Parents</h1>
      <div class="sub">Classe : ${selectedClassName} &nbsp;|&nbsp; ${today} &nbsp;|&nbsp; ${classStudents.length} élèves</div>
      <table>
        <thead><tr><th>N°</th><th>Élève</th><th>Matricule</th><th>Parent / Tuteur</th><th>Téléphone</th></tr></thead>
        <tbody>${classStudents.map((el, i) => `
          <tr><td>${i+1}</td><td><strong>${el.nom} ${el.prenom}</strong></td>
          <td style="font-family:monospace">${el.matricule}</td>
          <td>${el.parentNom ?? '—'}</td>
          <td style="font-family:monospace">${el.parentContact ?? '—'}</td></tr>
        `).join('')}</tbody>
      </table>
      <div style="margin-top:16px;font-size:9px;color:#94a3b8;text-align:center">Confidentiel — Scolango © ${new Date().getFullYear()}</div>
      </body></html>`;
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
      setSuccess('✓ Répertoire ouvert dans un nouvel onglet.');
      setTimeout(() => setSuccess(''), 4000);
    }
  };

  const DOC_TYPES: { id: DocType; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'fiche-appel',       label: 'Fiche d\'Appel Vierge',        icon: Users,    desc: 'Liste des élèves avec colonnes présence / absence / retard' },
    { id: 'grille-notes',      label: 'Grille de Notes Vierge',       icon: BookOpen, desc: 'Tableau I1 / I2 / Devoir / Compo vierge pour l\'enseignant' },
    { id: 'contacts-parents',  label: 'Répertoire Contacts Parents',  icon: Phone,    desc: 'Liste des contacts d\'urgence par classe (impression navigateur)' },
    { id: 'cartes',            label: 'Cartes Scolaires',             icon: Star,     desc: 'Disponible dans Gestion → Élèves → Cartes Scolaires' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="border-b border-white/10 pb-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center space-x-2">
          <Printer size={16} className="text-orange-400" />
          <span>Édition & Documents Administratifs</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Fiches d'appel, grilles vierges, répertoires contacts parents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Type de document */}
        <div className="lg:col-span-4 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type de document</p>
          {DOC_TYPES.map(t => (
            <button key={t.id} onClick={() => { setDocType(t.id); setError(''); setSuccess(''); }}
              className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                docType === t.id ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 bg-white/5 hover:bg-white/8'
              }`}>
              <div className="flex items-center space-x-3">
                <t.icon size={16} className={docType === t.id ? 'text-orange-400' : 'text-slate-400'} />
                <div>
                  <div className="text-xs font-bold text-white">{t.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{t.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Configuration + bouton */}
        <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
          {docType === 'cartes' ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Star size={40} className="text-orange-400" />
              <p className="text-sm font-bold text-white text-center">Cartes Scolaires</p>
              <p className="text-xs text-slate-400 text-center max-w-xs leading-relaxed">
                La génération des cartes est disponible dans le module<br/>
                <span className="text-orange-400 font-bold">Gestion → Élèves → Cartes Scolaires</span>
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest border-b border-white/10 pb-2">
                Configuration — {DOC_TYPES.find(t => t.id === docType)?.label}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase">Classe *</label>
                  <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                    {classes.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.nom}</option>)}
                  </select>
                </div>

                {docType === 'grille-notes' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase">Matière *</label>
                      <select value={selectedMat} onChange={e => setSelectedMat(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                        <option value="" className="bg-slate-900">— Sélectionner —</option>
                        {classMatieres.map(m => <option key={m.id} value={m.id} className="bg-slate-900">{m.nom} (coef {m.coefficient})</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase">Période</label>
                      <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                        {examens.map(ex => <option key={ex.id} value={ex.id} className="bg-slate-900">{ex.nom}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Aperçu élèves */}
              <div className="bg-black/20 border border-white/5 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                  {classStudents.length} élève{classStudents.length > 1 ? 's' : ''} — {selectedClassName}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1 max-h-28 overflow-y-auto">
                  {classStudents.slice(0, 21).map(el => (
                    <span key={el.id} className="text-[10px] text-slate-400 font-mono truncate">{el.nom} {el.prenom}</span>
                  ))}
                  {classStudents.length > 21 && <span className="text-[10px] text-slate-500 italic">+{classStudents.length - 21} autres</span>}
                </div>
              </div>

              {error   && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] p-3 rounded-xl" role="alert">⚠ {error}</div>}
              {success && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] p-3 rounded-xl">{success}</div>}

              <button onClick={handleGenerate} disabled={loading || classStudents.length === 0}
                className="w-full flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl cursor-pointer transition-all shadow-lg shadow-orange-500/20">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>{loading ? 'Génération en cours…' : 'Générer et Télécharger'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
