import React, { useState, useRef, useMemo } from 'react';
import { useAppState } from '../stateContext';
import { Eleve } from '../types';
import * as XLSX from 'xlsx';
import {
  Users, Search, Plus, Trash2, Edit3, UserMinus, UserCheck,
  FileSpreadsheet, UserPlus, BookOpen, GraduationCap,
  ArrowRightLeft, Tag, CreditCard, CheckCircle, AlertCircle,
  Upload, Printer, BarChart2, Star
} from 'lucide-react';
import { ComptabiliteModule } from './ComptabiliteModule';

// ─── Helper : champ de formulaire ─────────────────────────────────────────────
const F: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string;
}> = ({ label, value, onChange, placeholder, required, type = 'text' }) => (
  <div className="space-y-1">
    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
      {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} required={required}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500 placeholder-slate-600" />
  </div>
);

// ─── Badge statut élève ───────────────────────────────────────────────────────
const StatutBadge: React.FC<{ statut?: string }> = ({ statut }) => {
  if (statut === 'abandon') return <span className="bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">Abandon</span>;
  if (statut === 'exclu')   return <span className="bg-rose-500/15 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">Exclu</span>;
  return <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">Actif</span>;
};

// ─── Tabs helper ──────────────────────────────────────────────────────────────
type MainTab = 'eleves' | 'pedagogie' | 'effectif' | 'tresorerie';
type EleveTab = 'list' | 'add' | 'import' | 'abandon' | 'remises' | 'cartes' | 'transfert';

export const GestionModule: React.FC<{ setActiveTab?: (t: string) => void }> = ({ setActiveTab }) => {
  const {
    currentUser, eleves, classes, matieres, users, parametres,
    addEleve, updateEleve, deleteEleve, changeEleveClasse,
    addMatiere, updateMatiere, deleteMatiere,
    addClasse, updateClasse, deleteClasse,
    logAction,
  } = useAppState();

  const [mainTab,  setMainTab]  = useState<MainTab>('eleves');
  const [eleveTab, setEleveTab] = useState<EleveTab>('list');

  // ── Filtres liste ──────────────────────────────────────────────────────────
  const [search,       setSearch]       = useState('');
  const [classeFilter, setClasseFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState<'tous' | 'actif' | 'abandon' | 'exclu'>('actif');

  const filteredEleves = useMemo(() => eleves.filter(e => {
    if (classeFilter !== 'all' && e.classeId !== classeFilter) return false;
    if (statutFilter !== 'tous' && (e.statut ?? 'actif') !== statutFilter) return false;
    const q = search.toLowerCase();
    return !q || e.nom.toLowerCase().includes(q) || e.prenom.toLowerCase().includes(q) || e.matricule.toLowerCase().includes(q);
  }), [eleves, classeFilter, statutFilter, search]);

  // ── Form inscription ───────────────────────────────────────────────────────
  const [fn,   setFn]   = useState({ nom:'', prenom:'', sexe:'F' as 'M'|'F', dob:'', adresse:'', parentNom:'', parentTel:'', classeId:'', photo:'' });
  const [fErr, setFErr] = useState('');

  const handleAddEleve = (e: React.FormEvent) => {
    e.preventDefault(); setFErr('');
    if (!fn.nom || !fn.prenom || !fn.classeId) { setFErr('Nom, Prénom et Classe sont obligatoires.'); return; }
    addEleve({ nom: fn.nom.toUpperCase(), prenom: fn.prenom, sexe: fn.sexe, dateNaissance: fn.dob, adresse: fn.adresse, parentNom: fn.parentNom, parentContact: fn.parentTel, classeId: fn.classeId });
    setFn({ nom:'', prenom:'', sexe:'F', dob:'', adresse:'', parentNom:'', parentTel:'', classeId:'', photo:'' });
    setEleveTab('list');
  };

  // ── Abandon / Exclusion ────────────────────────────────────────────────────
  const [abandonId,     setAbandonId]     = useState('');
  const [abandonMotif,  setAbandonMotif]  = useState('Déménagement familial');
  const [abandonType,   setAbandonType]   = useState<'abandon' | 'exclu'>('abandon');

  const handleSaveAbandon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!abandonId) return;
    updateEleve(abandonId, { statut: abandonType, motifAbandon: abandonMotif });
    const el = eleves.find(s => s.id === abandonId);
    logAction(abandonType === 'exclu' ? 'Exclusion' : 'Abandon', `${el?.prenom} ${el?.nom} — ${abandonMotif}`);
    setAbandonId('');
  };

  // ── Remises ────────────────────────────────────────────────────────────────
  const [remiseId,     setRemiseId]     = useState('');
  const [remiseMontant,setRemiseMontant]= useState(15000);
  const [remiseMotif,  setRemiseMotif]  = useState('Bourse sociale');

  const handleSaveRemise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remiseId) return;
    updateEleve(remiseId, { remise: remiseMontant });
    const el = eleves.find(s => s.id === remiseId);
    logAction('Remise', `${remiseMontant} FCFA appliqués à ${el?.prenom} ${el?.nom} — ${remiseMotif}`);
    setRemiseId('');
  };

  // ── Transfert ──────────────────────────────────────────────────────────────
  const [transferEleve,     setTransferEleve]     = useState<Eleve | null>(null);
  const [transferClasseId,  setTransferClasseId]  = useState('');

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferEleve || !transferClasseId) return;
    changeEleveClasse(transferEleve.id, transferClasseId);
    setTransferEleve(null);
  };

  // ── Import Excel ───────────────────────────────────────────────────────────
  const fileRef = useRef<HTMLInputElement>(null);
  const [xlsStudents, setXlsStudents] = useState<{id:string;nom:string;prenom:string;sexe:string;dob:string;parent:string;classe:string}[]>([]);
  const [xlsFileName, setXlsFileName] = useState('');
  const [xlsError,    setXlsError]    = useState('');

  const parseExcel = (file: File) => {
    setXlsError(''); setXlsFileName(file.name);
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const wb = XLSX.read(evt.target?.result, { type:'binary', cellDates:true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header:1, defval:'' }) as unknown[][];
        const parsed = rows.slice(1)
          .filter(r => r[0] && String(r[0]).trim())
          .map((r, i) => {
            const dob = r[3];
            let dobStr = '2010-01-01';
            if (dob instanceof Date) dobStr = dob.toISOString().split('T')[0];
            else if (typeof dob === 'string' && /\d{4}-\d{2}-\d{2}/.test(dob)) dobStr = dob;
            else if (typeof dob === 'number') {
              const d = XLSX.SSF.parse_date_code(dob);
              dobStr = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
            }
            const sx = String(r[2]||'M').trim().toUpperCase();
            return { id:`xls-${i}`, nom:String(r[0]||'').trim().toUpperCase(), prenom:String(r[1]||'').trim(),
              sexe: sx==='F'||sx==='FILLE'?'F':'M', dob:dobStr, parent:String(r[5]||'').trim(), classe:String(r[4]||'').trim() };
          });
        if (!parsed.length) { setXlsError('Aucune donnée trouvée après la ligne d\'en-tête.'); return; }
        setXlsStudents(parsed);
      } catch (err) {
        setXlsError(`Erreur : ${err instanceof Error ? err.message : 'Fichier invalide.'}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleXlsImport = () => {
    xlsStudents.forEach(s => {
      const cls = classes.find(c => c.nom.toLowerCase().includes(s.classe.toLowerCase())) ?? classes[0];
      addEleve({ nom:s.nom, prenom:s.prenom, sexe:s.sexe as 'M'|'F', dateNaissance:s.dob, adresse:'', parentNom:s.parent, parentContact:'', classeId:cls?.id??'' });
    });
    logAction('Import Excel', `${xlsStudents.length} élèves importés.`);
    setXlsStudents([]); setEleveTab('list');
  };

  // ── Cartes scolaires ───────────────────────────────────────────────────────
  const [carteEleveId, setCarteEleveId] = useState('');
  const carteEleve = eleves.find(e => e.id === carteEleveId);

  // ── Pédagogie : Matière ────────────────────────────────────────────────────
  const [matForm,    setMatForm]    = useState({ nom:'', coefficient:2, classeId:'', enseignantId:'' });
  const [matErr,     setMatErr]     = useState('');
  const [matSuccess, setMatSuccess] = useState('');

  const handleAddMatiere = (e: React.FormEvent) => {
    e.preventDefault(); setMatErr(''); setMatSuccess('');
    if (!matForm.nom.trim()) { setMatErr('Le nom de la matière est requis.'); return; }
    if (!matForm.classeId)   { setMatErr('Sélectionnez une classe.'); return; }
    addMatiere({ nom:matForm.nom, coefficient:Number(matForm.coefficient), classeId:matForm.classeId, enseignantId:matForm.enseignantId||undefined });
    setMatSuccess(`Matière "${matForm.nom}" ajoutée.`);
    setMatForm(p => ({ ...p, nom:'', coefficient:2, enseignantId:'' }));
    setTimeout(() => setMatSuccess(''), 3000);
  };

  // ── Pédagogie : Classe ────────────────────────────────────────────────────
  const [classeForm,    setClasseForm]    = useState({ nom:'', cycleId:'', profPrincipalId:'' });
  const [classeErr,     setClasseErr]     = useState('');
  const [classeSuccess, setClasseSuccess] = useState('');
  const [editClasseId,  setEditClasseId]  = useState<string|null>(null);
  const { cycles } = useAppState();

  const handleSaveClasse = (e: React.FormEvent) => {
    e.preventDefault(); setClasseErr(''); setClasseSuccess('');
    if (!classeForm.nom.trim()) { setClasseErr('Le nom est requis.'); return; }
    if (editClasseId) {
      updateClasse(editClasseId, { nom:classeForm.nom, cycleId:classeForm.cycleId, profPrincipalId:classeForm.profPrincipalId||undefined });
      setClasseSuccess('Classe mise à jour.');
      setEditClasseId(null);
    } else {
      const cycle = cycles.find(c => c.id === classeForm.cycleId);
      addClasse({ nom:classeForm.nom, cycleId:classeForm.cycleId,
        niveau: (cycle?.code==='college' ? 'college' : cycle?.code?.startsWith('lycee') ? 'lycee' : cycle?.code==='primaire' ? 'primaire' : 'universite') as any,
        profPrincipalId:classeForm.profPrincipalId||undefined });
      setClasseSuccess(`Classe "${classeForm.nom}" créée.`);
    }
    setClasseForm({ nom:'', cycleId:'', profPrincipalId:'' });
    setTimeout(() => setClasseSuccess(''), 3000);
  };

  // ── Effectif ───────────────────────────────────────────────────────────────
  const effectifStats = useMemo(() => classes.map(cls => {
    const inClass = eleves.filter(e => e.classeId === cls.id);
    const actifs  = inClass.filter(e => (e.statut ?? 'actif') === 'actif');
    const garcons = actifs.filter(e => e.sexe === 'M').length;
    const filles  = actifs.filter(e => e.sexe === 'F').length;
    const abandons = inClass.filter(e => e.statut === 'abandon').length;
    const exclus  = inClass.filter(e => e.statut === 'exclu').length;
    return { cls, garcons, filles, total: garcons + filles, abandons, exclus };
  }), [eleves, classes]);

  const totalGarcons = effectifStats.reduce((s,x) => s + x.garcons, 0);
  const totalFilles  = effectifStats.reduce((s,x) => s + x.filles, 0);
  const totalActifs  = effectifStats.reduce((s,x) => s + x.total, 0);

  const teachers = users.filter(u => u.role === 'enseignant');

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-white/10 pb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <GraduationCap size={16} className="text-orange-400" />
            <span>Gestion Administrative & Pédagogique</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Élèves, classes, matières, enseignants, effectifs.</p>
        </div>
      </div>

      {/* Main tabs */}
      <div className="flex border-b border-white/10 space-x-1 overflow-x-auto">
        {([
          { id:'eleves',    label:'Élèves',          icon: Users },
          { id:'pedagogie', label:'Pédagogie',        icon: BookOpen },
          { id:'effectif',  label:'Effectif & Stats', icon: BarChart2 },
          { id:'tresorerie',label:'Trésorerie',       icon: CreditCard },
        ] as {id:MainTab;label:string;icon:any}[]).map(t => (
          <button key={t.id} onClick={() => setMainTab(t.id)}
            className={`flex items-center space-x-1.5 px-4 py-2 text-[11px] font-semibold uppercase border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              mainTab === t.id ? 'border-orange-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
            }`}>
            <t.icon size={12} /><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ════ ÉLÈVES ══════════════════════════════════════════════════════════ */}
      {mainTab === 'eleves' && (
        <div className="space-y-4">
          {/* Sub-nav élèves */}
          <div className="flex flex-wrap gap-1.5">
            {([
              { id:'list',     label:'Liste',          icon: Users },
              { id:'add',      label:'Inscrire',        icon: UserPlus },
              { id:'import',   label:'Import Excel',    icon: FileSpreadsheet },
              { id:'transfert',label:'Transfert',       icon: ArrowRightLeft },
              { id:'abandon',  label:'Abandon / Exclusion', icon: UserMinus },
              { id:'remises',  label:'Remises',         icon: Tag },
              { id:'cartes',   label:'Cartes scolaires',icon: Star },
            ] as {id:EleveTab;label:string;icon:any}[]).map(t => (
              <button key={t.id} onClick={() => setEleveTab(t.id)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                  eleveTab === t.id ? 'bg-orange-500 border-orange-500 text-white shadow' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}>
                <t.icon size={11} /><span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* ── LIST ─────────────────────────────────────────────────────── */}
          {eleveTab === 'list' && (
            <div className="space-y-3">
              {/* Filtres */}
              <div className="flex flex-wrap gap-3 bg-white/5 border border-white/10 rounded-2xl p-3">
                <div className="relative flex-1 min-w-[180px]">
                  <Search size={13} className="absolute left-2.5 top-2.5 text-slate-500" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, prénom, matricule…"
                    className="w-full pl-8 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-orange-500" />
                </div>
                <select value={classeFilter} onChange={e => setClasseFilter(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none">
                  <option value="all">Toutes les classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
                <select value={statutFilter} onChange={e => setStatutFilter(e.target.value as any)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none">
                  <option value="tous">Tous statuts</option>
                  <option value="actif">Actifs</option>
                  <option value="abandon">Abandons</option>
                  <option value="exclu">Exclus</option>
                </select>
                <span className="text-[10px] text-slate-400 self-center font-mono">{filteredEleves.length} résultat(s)</span>
              </div>

              {/* Table */}
              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="text-left p-3 font-semibold">Matricule</th>
                      <th className="text-left p-3 font-semibold">Élève</th>
                      <th className="text-left p-3 font-semibold">Sexe</th>
                      <th className="text-left p-3 font-semibold">Naissance</th>
                      <th className="text-left p-3 font-semibold">Parent / Tuteur</th>
                      <th className="text-left p-3 font-semibold">Classe</th>
                      <th className="text-left p-3 font-semibold">Statut</th>
                      <th className="text-right p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredEleves.length === 0 && (
                      <tr><td colSpan={8} className="py-10 text-center text-slate-500 italic text-xs">Aucun élève trouvé.</td></tr>
                    )}
                    {filteredEleves.map(el => {
                      const cls = classes.find(c => c.id === el.classeId);
                      const isInactif = el.statut && el.statut !== 'actif';
                      return (
                        <tr key={el.id} className={`hover:bg-white/3 transition-colors ${isInactif ? 'opacity-60' : ''}`}>
                          <td className="p-3 font-mono text-slate-400 text-[10px]">{el.matricule}</td>
                          <td className="p-3">
                            <div className="font-bold text-white">{el.prenom} {el.nom}</div>
                            {el.remise && el.remise > 0 && <span className="text-[9px] text-orange-400 font-mono">Remise: {el.remise.toLocaleString()} FCFA</span>}
                          </td>
                          <td className="p-3 font-mono">{el.sexe}</td>
                          <td className="p-3 font-mono text-slate-300">{el.dateNaissance || '—'}</td>
                          <td className="p-3 text-slate-300">{el.parentNom || '—'}<br/><span className="text-[10px] font-mono text-slate-500">{el.parentContact || ''}</span></td>
                          <td className="p-3">
                            <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold">{cls?.nom ?? '—'}</span>
                          </td>
                          <td className="p-3"><StatutBadge statut={el.statut} /></td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button onClick={() => { setTransferEleve(el); setTransferClasseId(''); setEleveTab('transfert'); }}
                                className="p-1.5 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg cursor-pointer transition-all" title="Transférer"><ArrowRightLeft size={12} /></button>
                              {isInactif ? (
                                <button onClick={() => { updateEleve(el.id, { statut:'actif', motifAbandon:undefined }); logAction('Réactivation', `${el.prenom} ${el.nom} réactivé.`); }}
                                  className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg cursor-pointer" title="Réactiver"><UserCheck size={12} /></button>
                              ) : null}
                              <button onClick={() => { if (confirm(`Supprimer définitivement ${el.prenom} ${el.nom} ?`)) deleteEleve(el.id); }}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── INSCRIRE ─────────────────────────────────────────────────── */}
          {eleveTab === 'add' && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest mb-4">Formulaire d'inscription</h3>
              <form onSubmit={handleAddEleve} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <F label="Nom de famille" required value={fn.nom} onChange={v => setFn(p=>({...p,nom:v}))} placeholder="DIALLO" />
                  <F label="Prénom(s)" required value={fn.prenom} onChange={v => setFn(p=>({...p,prenom:v}))} placeholder="Aminata" />
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Sexe *</label>
                    <select value={fn.sexe} onChange={e => setFn(p=>({...p,sexe:e.target.value as 'M'|'F'}))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                      <option value="F" className="bg-slate-900">Féminin</option>
                      <option value="M" className="bg-slate-900">Masculin</option>
                    </select>
                  </div>
                  <F label="Date de naissance" value={fn.dob} onChange={v => setFn(p=>({...p,dob:v}))} type="date" />
                  <F label="Adresse" value={fn.adresse} onChange={v => setFn(p=>({...p,adresse:v}))} placeholder="Quartier, ville" />
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Classe *</label>
                    <select value={fn.classeId} onChange={e => setFn(p=>({...p,classeId:e.target.value}))} required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                      <option value="" className="bg-slate-900">— Sélectionner —</option>
                      {classes.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.nom}</option>)}
                    </select>
                  </div>
                  <F label="Nom du parent / tuteur" value={fn.parentNom} onChange={v => setFn(p=>({...p,parentNom:v}))} placeholder="Diallo Ibrahim" />
                  <F label="Contact parent (tél)" value={fn.parentTel} onChange={v => setFn(p=>({...p,parentTel:v}))} placeholder="+225 07 00 00 00" />
                </div>
                {fErr && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] p-3 rounded-xl">{fErr}</div>}
                <div className="flex justify-end">
                  <button type="submit" className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer">
                    <UserPlus size={13} /><span>Inscrire l'élève</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── IMPORT EXCEL ─────────────────────────────────────────────── */}
          {eleveTab === 'import' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-[10px] text-amber-300">
                <strong>Format attendu :</strong> Colonne A = Nom · B = Prénom · C = Sexe (M/F) · D = Date naissance (AAAA-MM-JJ) · E = Classe · F = Parent (optionnel)
              </div>
              {!xlsStudents.length ? (
                <div
                  onClick={() => document.getElementById('xls-input')?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) parseExcel(f); }}
                  className="border-2 border-dashed border-white/15 hover:border-orange-500/40 rounded-3xl p-12 text-center cursor-pointer transition-all">
                  <input id="xls-input" type="file" accept=".xlsx,.xls,.csv" className="hidden" ref={fileRef}
                    onChange={e => { const f=e.target.files?.[0]; if(f) parseExcel(f); e.target.value=''; }} />
                  <FileSpreadsheet size={36} className="mx-auto text-slate-500 mb-3" />
                  <p className="text-xs font-bold text-slate-200">Cliquer ou Glisser un fichier Excel (.xlsx / .xls)</p>
                  <p className="text-[10px] text-slate-400 mt-1">Lecture locale — vos données ne quittent pas le navigateur</p>
                  {xlsError && <p className="text-rose-400 text-[10px] mt-3 font-medium">{xlsError}</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">{xlsStudents.length} élèves détectés dans <span className="text-orange-400 font-mono">{xlsFileName}</span></span>
                    <button onClick={() => setXlsStudents([])} className="text-[10px] text-slate-400 hover:text-white cursor-pointer">Annuler</button>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto max-h-60 overflow-y-auto">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-slate-900">
                        <tr className="border-b border-white/10 text-slate-400">
                          <th className="p-2 text-left">Nom</th><th className="p-2 text-left">Prénom</th>
                          <th className="p-2">Sexe</th><th className="p-2">Naissance</th>
                          <th className="p-2">Classe détectée</th><th className="p-2">Parent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {xlsStudents.map(s => (
                          <tr key={s.id}>
                            <td className="p-2 font-bold text-white">{s.nom}</td>
                            <td className="p-2 text-slate-200">{s.prenom}</td>
                            <td className="p-2 text-center font-mono">{s.sexe}</td>
                            <td className="p-2 font-mono text-slate-400">{s.dob}</td>
                            <td className="p-2 text-orange-300 font-mono">{s.classe||'—'}</td>
                            <td className="p-2 text-slate-400">{s.parent||'—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={handleXlsImport}
                      className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer">
                      <CheckCircle size={13} />
                      <span>Valider et importer {xlsStudents.length} élève{xlsStudents.length>1?'s':''}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TRANSFERT ────────────────────────────────────────────────── */}
          {eleveTab === 'transfert' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">Changement de classe</h3>
                <form onSubmit={handleTransfer} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Élève à transférer *</label>
                    <select value={transferEleve?.id ?? ''} onChange={e => { const el=eleves.find(x=>x.id===e.target.value); setTransferEleve(el??null); }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                      <option value="" className="bg-slate-900">— Sélectionner —</option>
                      {eleves.filter(e=>(e.statut??'actif')==='actif').map(el => <option key={el.id} value={el.id} className="bg-slate-900">{el.prenom} {el.nom} ({classes.find(c=>c.id===el.classeId)?.nom})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Nouvelle classe *</label>
                    <select value={transferClasseId} onChange={e => setTransferClasseId(e.target.value)} required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                      <option value="" className="bg-slate-900">— Sélectionner —</option>
                      {classes.filter(c => c.id !== transferEleve?.classeId).map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.nom}</option>)}
                    </select>
                  </div>
                  {transferEleve && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-[10px] text-orange-300">
                      {transferEleve.prenom} {transferEleve.nom} sera transféré(e) de <strong>{classes.find(c=>c.id===transferEleve.classeId)?.nom}</strong> vers la classe choisie.
                    </div>
                  )}
                  <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer flex items-center justify-center space-x-1.5">
                    <ArrowRightLeft size={13} /><span>Confirmer le transfert</span>
                  </button>
                </form>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-2">
                <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-3">Transferts récents (audit)</h3>
                <p className="text-[10px] text-slate-500 italic">Consultez le registre d'audit pour l'historique complet des transferts.</p>
              </div>
            </div>
          )}

          {/* ── ABANDON / EXCLUSION ──────────────────────────────────────── */}
          {eleveTab === 'abandon' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">Enregistrer un Abandon ou une Exclusion</h3>
                <form onSubmit={handleSaveAbandon} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Élève concerné *</label>
                    <select value={abandonId} onChange={e => setAbandonId(e.target.value)} required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                      <option value="" className="bg-slate-900">— Sélectionner —</option>
                      {eleves.filter(e => (e.statut??'actif')==='actif').map(el => <option key={el.id} value={el.id} className="bg-slate-900">{el.prenom} {el.nom} ({el.matricule})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Type de départ</label>
                    <select value={abandonType} onChange={e => setAbandonType(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                      <option value="abandon" className="bg-slate-900">Abandon volontaire</option>
                      <option value="exclu" className="bg-slate-900">Exclusion disciplinaire</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Motif *</label>
                    <select value={abandonMotif} onChange={e => setAbandonMotif(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                      <option className="bg-slate-900">Déménagement familial</option>
                      <option className="bg-slate-900">Maladie / Raison de santé</option>
                      <option className="bg-slate-900">Démission pédagogique</option>
                      <option className="bg-slate-900">Exclusion disciplinaire</option>
                      <option className="bg-slate-900">Retrait pour motif financier</option>
                      <option className="bg-slate-900">Orientation vers un autre établissement</option>
                    </select>
                  </div>
                  <button type="submit"
                    className={`w-full font-bold text-white text-xs py-2.5 rounded-xl cursor-pointer flex items-center justify-center space-x-1.5 ${abandonType==='exclu' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                    <UserMinus size={13} />
                    <span>{abandonType === 'exclu' ? 'Confirmer l\'exclusion' : 'Enregistrer l\'abandon'}</span>
                  </button>
                </form>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-3">
                <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Élèves inactifs</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {eleves.filter(e => e.statut && e.statut !== 'actif').length === 0 && (
                    <p className="text-[10px] text-slate-500 italic">Aucun élève inactif.</p>
                  )}
                  {eleves.filter(e => e.statut && e.statut !== 'actif').map(el => (
                    <div key={el.id} className="flex justify-between items-center p-3 bg-white/3 border border-white/5 rounded-xl">
                      <div>
                        <div className="text-xs font-bold text-white">{el.prenom} {el.nom}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">{el.motifAbandon}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <StatutBadge statut={el.statut} />
                        <button onClick={() => { updateEleve(el.id, { statut:'actif', motifAbandon:undefined }); logAction('Réactivation', `${el.prenom} ${el.nom} réactivé.`); }}
                          className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded cursor-pointer" title="Réactiver"><UserCheck size={11} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── REMISES ──────────────────────────────────────────────────── */}
          {eleveTab === 'remises' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">Appliquer une remise</h3>
                <form onSubmit={handleSaveRemise} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Élève bénéficiaire *</label>
                    <select value={remiseId} onChange={e => setRemiseId(e.target.value)} required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                      <option value="" className="bg-slate-900">— Sélectionner —</option>
                      {eleves.filter(e => (e.statut??'actif')==='actif').map(el => <option key={el.id} value={el.id} className="bg-slate-900">{el.prenom} {el.nom} ({el.matricule})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Montant de la remise (FCFA)</label>
                    <input type="number" min={0} value={remiseMontant} onChange={e => setRemiseMontant(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500 font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Motif</label>
                    <select value={remiseMotif} onChange={e => setRemiseMotif(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                      <option className="bg-slate-900">Bourse sociale</option>
                      <option className="bg-slate-900">3ème enfant d'une fratrie</option>
                      <option className="bg-slate-900">Enfant du personnel</option>
                      <option className="bg-slate-900">Excellence académique</option>
                      <option className="bg-slate-900">Décision de direction</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer flex items-center justify-center space-x-1.5">
                    <Tag size={13} /><span>Enregistrer la remise</span>
                  </button>
                </form>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-3">
                <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Remises actives</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {eleves.filter(e => (e.remise ?? 0) > 0).length === 0 && <p className="text-[10px] text-slate-500 italic">Aucune remise enregistrée.</p>}
                  {eleves.filter(e => (e.remise ?? 0) > 0).map(el => (
                    <div key={el.id} className="flex justify-between items-center p-3 bg-orange-500/5 border border-orange-500/15 rounded-xl">
                      <div>
                        <div className="text-xs font-bold text-white">{el.prenom} {el.nom}</div>
                        <div className="text-[9px] font-mono text-orange-400">{(el.remise??0).toLocaleString()} FCFA de remise</div>
                      </div>
                      <button onClick={() => { updateEleve(el.id, { remise:0 }); logAction('Annulation Remise', `Remise retirée pour ${el.prenom} ${el.nom}.`); }}
                        className="text-[9px] text-rose-400 hover:underline cursor-pointer">Annuler</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CARTES SCOLAIRES ─────────────────────────────────────────── */}
          {eleveTab === 'cartes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">Générer une Carte Scolaire</h3>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Sélectionner l'élève</label>
                  <select value={carteEleveId} onChange={e => setCarteEleveId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                    <option value="" className="bg-slate-900">— Sélectionner —</option>
                    {eleves.filter(e=>(e.statut??'actif')==='actif').map(el => <option key={el.id} value={el.id} className="bg-slate-900">{el.prenom} {el.nom} ({el.matricule})</option>)}
                  </select>
                </div>
                {carteEleve && (
                  <div className="flex justify-center">
                    {/* Badge carte scolaire */}
                    <div className="w-[300px] bg-gradient-to-br from-slate-900 to-slate-800 border-t-4 border-orange-500 rounded-2xl p-4 shadow-2xl relative overflow-hidden" id="carte-print-area">
                      <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-[10px] font-black text-white uppercase tracking-widest">{parametres?.nomEtablissement || 'Scolango'}</div>
                          <div className="text-[7px] text-slate-400">{parametres?.ville}</div>
                        </div>
                        <span className="bg-orange-500 text-white text-[7px] font-bold px-2 py-0.5 rounded uppercase">Carte scolaire</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-14 h-14 bg-slate-700 border border-white/10 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                          {carteEleve.prenom[0]}{carteEleve.nom[0]}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{carteEleve.prenom} {carteEleve.nom}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">Classe: {classes.find(c=>c.id===carteEleve.classeId)?.nom}</div>
                          <div className="text-[8px] text-orange-400 font-mono">{carteEleve.matricule}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-end border-t border-white/10 pt-2">
                        <div className="text-[7px] text-slate-500 font-mono">Expire: 06/{new Date().getFullYear()}</div>
                        {/* Barcode simulé */}
                        <div className="flex h-5 items-end space-x-0.5">
                          {[4,3,5,2,4,3,2,5,3,4,2,3].map((h,i) => (
                            <div key={i} style={{height:`${h*4}px`}} className="w-0.5 bg-slate-300" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {carteEleve && (
                  <button onClick={() => window.print()}
                    className="w-full flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer">
                    <Printer size={13} /><span>Imprimer la carte</span>
                  </button>
                )}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-3">
                <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Impression en lot</h3>
                <p className="text-[10px] text-slate-400">Sélectionnez une classe pour générer les cartes en masse (fonctionnalité PDF Puppeteer disponible après déploiement serveur).</p>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none">
                  <option value="" className="bg-slate-900">— Choisir une classe —</option>
                  {classes.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.nom}</option>)}
                </select>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-[10px] text-blue-300">
                  La génération PDF avec QR Code est disponible via le module Impression (Puppeteer côté serveur).
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════ PÉDAGOGIE ════════════════════════════════════════════════════════ */}
      {mainTab === 'pedagogie' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Catalogue matières */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-3">
            <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">1. Matières & Coefficients</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {matieres.length === 0 && <p className="text-[10px] text-slate-500 italic">Aucune matière créée.</p>}
              {matieres.map(m => {
                const cls = classes.find(c => c.id === m.classeId);
                const prf = users.find(u => u.id === m.enseignantId);
                return (
                  <div key={m.id} className="p-3 bg-black/20 border border-white/5 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-bold text-white">{m.nom}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                          Coef <span className="text-orange-400 font-bold">{m.coefficient}</span> · {cls?.nom ?? '?'}
                        </div>
                        {prf && <div className="text-[9px] text-slate-500">{prf.prenom} {prf.nom}</div>}
                      </div>
                      <button onClick={() => { if(confirm(`Supprimer "${m.nom}" ?`)) deleteMatiere(m.id); }}
                        className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"><Trash2 size={11} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Créer matière */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
            <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">2. Créer & Affecter une Matière</h3>
            <form onSubmit={handleAddMatiere} className="space-y-3">
              <F label="Nom de la matière *" value={matForm.nom} onChange={v => setMatForm(p=>({...p,nom:v}))} placeholder="Mathématiques, SVT…" />
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Coefficient</label>
                <select value={matForm.coefficient} onChange={e => setMatForm(p=>({...p,coefficient:Number(e.target.value)}))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n} className="bg-slate-900">Coefficient {n}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Classe cible *</label>
                <select value={matForm.classeId} onChange={e => setMatForm(p=>({...p,classeId:e.target.value}))} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                  <option value="" className="bg-slate-900">— Sélectionner —</option>
                  {classes.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.nom}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Enseignant assigné</label>
                <select value={matForm.enseignantId} onChange={e => setMatForm(p=>({...p,enseignantId:e.target.value}))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                  <option value="" className="bg-slate-900">— Aucun —</option>
                  {teachers.map(t => <option key={t.id} value={t.id} className="bg-slate-900">{t.prenom} {t.nom} ({t.specialty||'Généraliste'})</option>)}
                </select>
              </div>
              {matErr     && <div className="text-rose-400 text-[11px] bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl">{matErr}</div>}
              {matSuccess && <div className="text-emerald-400 text-[11px] bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">✓ {matSuccess}</div>}
              <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer">
                Ajouter la matière
              </button>
            </form>
          </div>

          {/* Classes + Titulaires */}
          <div className="space-y-4">
            {/* Gestion des classes */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-3">
              <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">3. Classes & Titulaires</h3>
              <form onSubmit={handleSaveClasse} className="space-y-3">
                <F label={editClasseId ? 'Nouveau nom' : 'Nom de la classe *'} value={classeForm.nom} onChange={v => setClasseForm(p=>({...p,nom:v}))} placeholder="6ème A, Terminale S…" />
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Cycle</label>
                  <select value={classeForm.cycleId} onChange={e => setClasseForm(p=>({...p,cycleId:e.target.value}))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                    <option value="" className="bg-slate-900">— Sélectionner —</option>
                    {cycles.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.libelle}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Professeur principal (titulaire)</label>
                  <select value={classeForm.profPrincipalId} onChange={e => setClasseForm(p=>({...p,profPrincipalId:e.target.value}))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                    <option value="" className="bg-slate-900">— Aucun —</option>
                    {teachers.map(t => <option key={t.id} value={t.id} className="bg-slate-900">{t.prenom} {t.nom}</option>)}
                  </select>
                </div>
                {classeErr     && <div className="text-rose-400 text-[11px]">{classeErr}</div>}
                {classeSuccess && <div className="text-emerald-400 text-[11px]">✓ {classeSuccess}</div>}
                <div className="flex space-x-2">
                  <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2 rounded-xl cursor-pointer">
                    {editClasseId ? 'Modifier' : 'Créer la classe'}
                  </button>
                  {editClasseId && (
                    <button type="button" onClick={() => { setEditClasseId(null); setClasseForm({nom:'',cycleId:'',profPrincipalId:''}); }}
                      className="px-3 bg-white/5 border border-white/10 text-slate-400 text-xs rounded-xl cursor-pointer">Annuler</button>
                  )}
                </div>
              </form>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {classes.map(c => {
                  const prof = users.find(u => u.id === c.profPrincipalId);
                  return (
                    <div key={c.id} className="flex justify-between items-center p-2.5 bg-black/20 border border-white/5 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-white">{c.nom}</span>
                        {prof && <span className="text-[9px] text-slate-400 ml-2 font-mono">Titulaire: {prof.prenom} {prof.nom}</span>}
                      </div>
                      <div className="flex space-x-1">
                        <button onClick={() => { setEditClasseId(c.id); setClasseForm({ nom:c.nom, cycleId:c.cycleId??'', profPrincipalId:c.profPrincipalId??'' }); }}
                          className="p-1 text-slate-400 hover:text-orange-400 cursor-pointer"><Edit3 size={11} /></button>
                        <button onClick={() => { if(confirm(`Supprimer la classe ${c.nom} ?`)) deleteClasse(c.id); }}
                          className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"><Trash2 size={11} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Corps enseignant */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-3">
              <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">4. Corps Enseignant</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {teachers.length === 0 && <p className="text-[10px] text-slate-500 italic">Aucun enseignant créé. Utilisez le module Paramètres → Comptes.</p>}
                {teachers.map(t => (
                  <div key={t.id} className="flex items-center space-x-3 p-2.5 bg-black/20 border border-white/5 rounded-xl">
                    <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold text-white">{t.prenom[0]}{t.nom[0]}</div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white">{t.prenom} {t.nom}</div>
                      <div className="text-[9px] text-slate-400">{t.specialty ?? 'Généraliste'} · {t.phone ?? '—'}</div>
                    </div>
                    <span className="text-[8px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-mono uppercase">PROF</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ EFFECTIF & STATISTIQUES ══════════════════════════════════════════ */}
      {mainTab === 'effectif' && (
        <div className="space-y-4">
          {/* KPIs globaux */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:'Total élèves actifs', val:totalActifs, color:'text-white' },
              { label:'Garçons', val:totalGarcons, color:'text-blue-400' },
              { label:'Filles', val:totalFilles, color:'text-pink-400' },
              { label:'Taux féminisation', val:`${totalActifs > 0 ? Math.round(totalFilles/totalActifs*100) : 0}%`, color:'text-orange-400' },
            ].map(k => (
              <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <div className={`text-2xl font-bold ${k.color}`}>{k.val}</div>
                <div className="text-[10px] text-slate-400 mt-1 font-medium">{k.label}</div>
              </div>
            ))}
          </div>

          {/* Tableau par classe */}
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-left">
                  <th className="p-3 font-semibold">Classe</th>
                  <th className="p-3 font-semibold text-center">Garçons</th>
                  <th className="p-3 font-semibold text-center">Filles</th>
                  <th className="p-3 font-semibold text-center">Total actifs</th>
                  <th className="p-3 font-semibold text-center">Abandons</th>
                  <th className="p-3 font-semibold text-center">Exclus</th>
                  <th className="p-3 font-semibold text-center">% Filles</th>
                  <th className="p-3 font-semibold">Titulaire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {effectifStats.map(({ cls, garcons, filles, total, abandons, exclus }) => {
                  const prof = users.find(u => u.id === cls.profPrincipalId);
                  const pctF = total > 0 ? Math.round(filles/total*100) : 0;
                  return (
                    <tr key={cls.id} className="hover:bg-white/3">
                      <td className="p-3 font-bold text-white">{cls.nom}</td>
                      <td className="p-3 text-center text-blue-400 font-mono font-bold">{garcons}</td>
                      <td className="p-3 text-center text-pink-400 font-mono font-bold">{filles}</td>
                      <td className="p-3 text-center text-white font-bold">{total}</td>
                      <td className="p-3 text-center text-amber-400 font-mono">{abandons}</td>
                      <td className="p-3 text-center text-rose-400 font-mono">{exclus}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div style={{ width:`${pctF}%` }} className="h-full bg-pink-400 rounded-full" />
                          </div>
                          <span className="text-[10px] text-slate-300 font-mono">{pctF}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-400 text-[10px]">{prof ? `${prof.prenom} ${prof.nom}` : '—'}</td>
                    </tr>
                  );
                })}
                {/* Ligne totaux */}
                <tr className="border-t-2 border-white/20 bg-white/5">
                  <td className="p-3 font-bold text-orange-400 uppercase text-[10px]">TOTAL</td>
                  <td className="p-3 text-center font-bold text-blue-400 font-mono">{totalGarcons}</td>
                  <td className="p-3 text-center font-bold text-pink-400 font-mono">{totalFilles}</td>
                  <td className="p-3 text-center font-bold text-white font-mono">{totalActifs}</td>
                  <td className="p-3 text-center text-amber-400 font-mono">{effectifStats.reduce((s,x)=>s+x.abandons,0)}</td>
                  <td className="p-3 text-center text-rose-400 font-mono">{effectifStats.reduce((s,x)=>s+x.exclus,0)}</td>
                  <td className="p-3 text-center text-[10px] text-slate-300 font-mono">
                    {totalActifs > 0 ? Math.round(totalFilles/totalActifs*100) : 0}%
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════ TRÉSORERIE ═══════════════════════════════════════════════════════ */}
      {mainTab === 'tresorerie' && <ComptabiliteModule />}
    </div>
  );
};
