import React, { useState, useRef } from 'react';
import { useAppState } from '../stateContext';
import {
  Settings, Upload, Check, Building, Users, Sliders,
  Plus, Trash2, Edit3, Eye, EyeOff, ChevronDown, ChevronRight,
  BookOpen, Calendar, CreditCard, Shield, AlertTriangle, CheckCircle,
  FileText, Stamp, PenTool
} from 'lucide-react';
import { Cycle } from '../types';

// ─── Composant upload d'image ─────────────────────────────────────────────────
const ImageUploader: React.FC<{
  label: string; hint: string; icon: React.ReactNode;
  value: string; onChange: (b64: string) => void;
}> = ({ label, hint, icon, value, onChange }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(value);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const b64 = e.target?.result as string;
      setPreview(b64);
      onChange(b64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
        {icon}
        <span>{label}</span>
      </label>
      <div
        className="border border-dashed border-white/20 rounded-2xl p-4 text-center cursor-pointer hover:border-orange-500/40 transition-all bg-white/2"
        onClick={() => ref.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        <input ref={ref} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
        {preview ? (
          <div className="space-y-2">
            <img src={preview} alt={label} className="max-h-16 mx-auto object-contain rounded-lg" />
            <span className="text-[10px] text-emerald-400 font-mono">Image chargée ✓</span>
          </div>
        ) : (
          <div className="space-y-1">
            <Upload size={20} className="mx-auto text-slate-500" />
            <p className="text-[10px] text-slate-400">{hint}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Composant champ formulaire ───────────────────────────────────────────────
const Field: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string;
}> = ({ label, value, onChange, placeholder, required, type = 'text' }) => (
  <div className="space-y-1">
    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
      {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500 font-mono placeholder-slate-600"
    />
  </div>
);

export const ParametresModule: React.FC = () => {
  const {
    currentUser, users, parametres, updateParametres, logAction,
    classes, annees, addAnneeScolaire, setAnneeActive,
    fraisScolaires, updateFraisScolaires,
    addUser, deleteUser, updateUser,
    cycles, addCycle, updateCycle, deleteCycle,
  } = useAppState();

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'directeur';

  // ─── Sub-tab ──────────────────────────────────────────────────────────────
  type Tab = 'etablissement' | 'academique' | 'comptes';
  const [tab, setTab] = useState<Tab>('etablissement');

  // ─── Onglet Établissement ─────────────────────────────────────────────────
  const [nom,            setNom]            = useState(parametres?.nomEtablissement || '');
  const [bp,             setBp]             = useState(parametres?.boitePostale || '');
  const [ville,          setVille]          = useState(parametres?.ville || '');
  const [pays,           setPays]           = useState(parametres?.pays || '');
  const [adresse,        setAdresse]        = useState(parametres?.adresse || '');
  const [tel,            setTel]            = useState(parametres?.telEtablissement || '');
  const [email,          setEmail]          = useState(parametres?.emailEtablissement || '');
  const [statut,         setStatut]         = useState<'public'|'prive'>(parametres?.statutEtablissement || 'public');
  const [devise,         setDevise]         = useState(parametres?.devise || 'XOF');
  const [logoBlob,       setLogoBlob]       = useState(parametres?.logoBlob || '');
  const [signatureBlob,  setSignatureBlob]  = useState(parametres?.signatureDirecteurBlob || '');
  const [cachetBlob,     setCachetBlob]     = useState(parametres?.cachetOfficielBlob || '');
  const [theme,          setTheme]          = useState(parametres?.themePrincipal || 'orange');
  const [saveSuccess,    setSaveSuccess]    = useState(false);

  // Cycle CRUD
  const [editCycleId,   setEditCycleId]   = useState<string | null>(null);
  const [cycleForm,     setCycleForm]     = useState<Partial<Cycle>>({});
  const [showCycleForm, setShowCycleForm] = useState(false);

  const handleSaveEtablissement = () => {
    updateParametres({
      nomEtablissement: nom, boitePostale: bp, ville, pays, adresse,
      telEtablissement: tel, emailEtablissement: email,
      statutEtablissement: statut, devise,
      logoBlob, signatureDirecteurBlob: signatureBlob, cachetOfficielBlob: cachetBlob,
      themePrincipal: theme,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
    logAction('Configuration', `Paramètres établissement "${nom}" enregistrés.`);
  };

  const openCycleEdit = (c: Cycle) => {
    setEditCycleId(c.id);
    setCycleForm({ ...c });
    setShowCycleForm(true);
  };

  const handleSaveCycle = () => {
    if (!cycleForm.libelle || !cycleForm.code) return;
    if (editCycleId) {
      updateCycle(editCycleId, cycleForm);
    } else {
      addCycle(cycleForm as Omit<Cycle,'id'>);
    }
    setShowCycleForm(false);
    setEditCycleId(null);
    setCycleForm({});
  };

  // ─── Onglet Académique ────────────────────────────────────────────────────
  const [decoupage,   setDecoupage]   = useState<'trimestre'|'semestre'>(parametres?.decoupageAcademique || 'trimestre');
  const [dateLimite,  setDateLimite]  = useState(parametres?.dateLimiteSaisie || '');
  const [smtpHost,    setSmtpHost]    = useState(parametres?.smtpHost || '');
  const [smtpUser,    setSmtpUser]    = useState(parametres?.smtpUser || '');
  const [smsGateway,  setSmsGateway]  = useState(parametres?.smsGateway || '');
  const [newAnnee,    setNewAnnee]    = useState('');
  const [acadSaved,   setAcadSaved]   = useState(false);

  const handleSaveAcademique = () => {
    updateParametres({ decoupageAcademique: decoupage, dateLimiteSaisie: dateLimite, smtpHost, smtpUser, smsGateway });
    setAcadSaved(true);
    setTimeout(() => setAcadSaved(false), 3000);
  };

  // ─── Onglet Comptes ───────────────────────────────────────────────────────
  const [userForm,      setUserForm]      = useState({ email:'', nom:'', prenom:'', role:'enseignant' as any, phone:'', specialty:'' });
  const [userError,     setUserError]     = useState('');
  const [userSuccess,   setUserSuccess]   = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string,boolean>>({});

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(''); setUserSuccess('');
    if (!userForm.email || !userForm.nom || !userForm.prenom) {
      setUserError('Email, Nom et Prénom sont obligatoires.');
      return;
    }
    const result = addUser({ ...userForm, active: true, specialty: userForm.role === 'enseignant' ? userForm.specialty || 'Enseignement' : undefined });
    if (!result.success) { setUserError(result.error ?? 'Erreur.'); return; }
    setUserSuccess(`Compte ${userForm.role.toUpperCase()} créé pour ${userForm.prenom} ${userForm.nom}.`);
    setTimeout(() => setUserSuccess(''), 5000);
    setUserForm({ email:'', nom:'', prenom:'', role:'enseignant', phone:'', specialty:'' });
  };

  const THEMES = [
    { id:'orange', label:'Orange', bg:'#f97316' }, { id:'blue',   label:'Bleu',     bg:'#3b82f6' },
    { id:'emerald',label:'Émeraude',bg:'#10b981' }, { id:'purple',label:'Violet',   bg:'#6366f1' },
    { id:'rose',   label:'Corail',  bg:'#f43f5e' },
  ];

  const ROLES_LABELS: Record<string,string> = {
    admin:'Administrateur', directeur:'Directeur', censeur:'Censeur',
    surveillant:'Surveillant', secretaire:'Secrétaire', enseignant:'Enseignant',
    comptable:'Comptable', eleve:'Élève', parent:'Parent/Tuteur',
  };

  const CYCLE_CODES = [
    { code:'primaire', label:'Primaire' },
    { code:'college', label:'Collège (1er cycle secondaire)' },
    { code:'lycee_moderne', label:'Lycée Moderne (2ème cycle)' },
    { code:'lycee_technique', label:'Lycée Technique / Professionnel' },
    { code:'universite', label:'Enseignement Supérieur' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-white/10 pb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <Settings size={16} className="text-orange-400" />
            <span>Configuration de l'Établissement</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Identité légale, cycles, années scolaires, comptes utilisateurs.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 space-x-1 overflow-x-auto">
        {([
          { id:'etablissement', label:'Établissement & Médias', icon: Building },
          { id:'academique',    label:'Académique & Communication', icon: BookOpen },
          { id:'comptes',       label:'Comptes & Accès (RBAC)', icon: Shield },
        ] as {id:Tab; label:string; icon:any}[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center space-x-1.5 px-4 py-2 text-[11px] font-semibold uppercase border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              tab === t.id ? 'border-orange-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
            }`}>
            <t.icon size={12} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ════ ONGLET 1 — ÉTABLISSEMENT ═════════════════════════════════════════ */}
      {tab === 'etablissement' && (
        <div className="space-y-5">
          {/* Infos générales */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest font-mono flex items-center space-x-1.5">
              <Building size={13} />
              <span>1 — Identité Légale de l'Établissement</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Field label="Nom officiel de l'établissement" required value={nom} onChange={setNom} placeholder="ex: Lycée Classique d'Abidjan" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Statut</label>
                <select value={statut} onChange={e => setStatut(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                  <option value="public" className="bg-slate-900">Public</option>
                  <option value="prive" className="bg-slate-900">Privé</option>
                </select>
              </div>
              <Field label="Devise" value={devise} onChange={setDevise} placeholder="XOF" />
              <Field label="Boîte Postale" value={bp} onChange={setBp} placeholder="BP 1234" />
              <Field label="Ville" value={ville} onChange={setVille} placeholder="Abidjan" />
              <Field label="Pays" value={pays} onChange={setPays} placeholder="Côte d'Ivoire" />
              <Field label="Adresse (rue/quartier)" value={adresse} onChange={setAdresse} placeholder="Cocody, Bd de l'Université" />
              <Field label="Téléphone" value={tel} onChange={setTel} placeholder="+225 27 22 00 00" />
              <Field label="Email institutionnel" value={email} onChange={setEmail} type="email" placeholder="direction@ecole.ci" />
            </div>
          </div>

          {/* Documents officiels */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest font-mono flex items-center space-x-1.5">
              <FileText size={13} />
              <span>2 — Documents Officiels (Bulletins & Cartes)</span>
            </h3>
            <p className="text-[10px] text-slate-400">Ces images seront automatiquement injectées sur les bulletins PDF et les cartes scolaires.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ImageUploader label="Logo de l'établissement" hint="PNG ou JPG, fond blanc recommandé"
                icon={<Building size={12} />} value={logoBlob} onChange={setLogoBlob} />
              <ImageUploader label="Signature du Directeur" hint="Signature scannée sur fond blanc"
                icon={<PenTool size={12} />} value={signatureBlob} onChange={setSignatureBlob} />
              <ImageUploader label="Cachet / Tampon officiel" hint="Tampon humide scanné"
                icon={<Stamp size={12} />} value={cachetBlob} onChange={setCachetBlob} />
            </div>
          </div>

          {/* Thème couleur */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest font-mono flex items-center space-x-1.5">
              <Sliders size={13} />
              <span>3 — Charte Graphique (Couleur de l'Interface)</span>
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {THEMES.map(t => {
                const isActive = (parametres?.themePrincipal || 'orange') === t.id;
                return (
                  <div key={t.id} onClick={() => { setTheme(t.id); updateParametres({ themePrincipal: t.id }); }}
                    className={`border rounded-2xl p-4 text-center cursor-pointer transition-all relative ${isActive ? 'border-orange-500 bg-white/5' : 'border-white/10 hover:bg-white/5'}`}>
                    {isActive && <Check size={10} className="absolute top-1.5 right-1.5 text-orange-400" />}
                    <div className="w-7 h-7 rounded-full mx-auto mb-2 shadow-md" style={{ backgroundColor: t.bg }} />
                    <span className="text-[10px] font-bold text-slate-200">{t.label}</span>
                    {isActive && <div className="text-[8px] text-orange-400 font-mono mt-0.5">Actif</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cycles d'enseignement */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest font-mono flex items-center space-x-1.5">
                <BookOpen size={13} />
                <span>4 — Cycles d'Enseignement & Tutelles Administratives</span>
              </h3>
              {isAdmin && (
                <button onClick={() => { setShowCycleForm(true); setEditCycleId(null); setCycleForm({}); }}
                  className="flex items-center space-x-1 text-[10px] bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1.5 rounded-xl font-bold cursor-pointer hover:bg-orange-500/20">
                  <Plus size={11} />
                  <span>Ajouter cycle</span>
                </button>
              )}
            </div>

            {showCycleForm && (
              <div className="bg-black/30 border border-orange-500/20 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-orange-300">{editCycleId ? 'Modifier' : 'Nouveau'} cycle</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Type de cycle *</label>
                    <select value={cycleForm.code || ''} onChange={e => setCycleForm(p => ({ ...p, code: e.target.value as any }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                      <option value="" className="bg-slate-900">— Sélectionner —</option>
                      {CYCLE_CODES.map(c => <option key={c.code} value={c.code} className="bg-slate-900">{c.label}</option>)}
                    </select>
                  </div>
                  <Field label="Libellé personnalisé *" value={cycleForm.libelle || ''} onChange={v => setCycleForm(p => ({ ...p, libelle: v }))} placeholder="ex: Lycée Moderne Scientifique" />
                  <Field label="Ministère de tutelle" value={cycleForm.ministere || ''} onChange={v => setCycleForm(p => ({ ...p, ministere: v }))} placeholder="Ministère de l'Éducation..." />
                  <Field label="Direction Régionale" value={cycleForm.directionRegionale || ''} onChange={v => setCycleForm(p => ({ ...p, directionRegionale: v }))} placeholder="DREN Abidjan 1" />
                  <div className="md:col-span-2">
                    <Field label="Inspection de l'enseignement" value={cycleForm.inspectionEnseignement || ''} onChange={v => setCycleForm(p => ({ ...p, inspectionEnseignement: v }))} placeholder="IES Cocody" />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button onClick={() => { setShowCycleForm(false); setCycleForm({}); setEditCycleId(null); }}
                    className="text-[11px] px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 cursor-pointer hover:bg-white/10">Annuler</button>
                  <button onClick={handleSaveCycle}
                    className="text-[11px] px-4 py-1.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold cursor-pointer">Enregistrer</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {cycles.length === 0 && <p className="text-xs text-slate-500 italic text-center py-4">Aucun cycle configuré.</p>}
              {cycles.map(c => (
                <div key={c.id} className="bg-black/20 border border-white/5 rounded-2xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-white">{c.libelle}</span>
                      <span className="ml-2 text-[9px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono uppercase">{c.code}</span>
                    </div>
                    {isAdmin && (
                      <div className="flex space-x-1">
                        <button onClick={() => openCycleEdit(c)} className="p-1 text-slate-400 hover:text-orange-400 cursor-pointer"><Edit3 size={12} /></button>
                        <button onClick={() => deleteCycle(c.id)} className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"><Trash2 size={12} /></button>
                      </div>
                    )}
                  </div>
                  {(c.ministere || c.directionRegionale || c.inspectionEnseignement) && (
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-1 text-[10px] text-slate-400 font-mono">
                      {c.ministere && <span>📋 {c.ministere}</span>}
                      {c.directionRegionale && <span>🏛 {c.directionRegionale}</span>}
                      {c.inspectionEnseignement && <span>🔍 {c.inspectionEnseignement}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bouton save */}
          <div className="flex justify-end">
            <button onClick={handleSaveEtablissement}
              className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-6 py-3 rounded-xl cursor-pointer transition-all shadow-lg shadow-orange-500/20">
              {saveSuccess ? <CheckCircle size={14} /> : <Check size={14} />}
              <span>{saveSuccess ? 'Enregistré !' : 'Enregistrer les paramètres'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ════ ONGLET 2 — ACADÉMIQUE ════════════════════════════════════════════ */}
      {tab === 'academique' && (
        <div className="space-y-5">
          {/* Découpage + verrouillage */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest font-mono flex items-center space-x-1.5">
              <Calendar size={13} />
              <span>1 — Périodes Scolaires & Verrouillage des Saisies</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Découpage académique</label>
                <select value={decoupage} onChange={e => setDecoupage(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                  <option value="trimestre" className="bg-slate-900">Trimestriel (3 périodes)</option>
                  <option value="semestre" className="bg-slate-900">Semestriel (2 périodes)</option>
                </select>
              </div>
              <Field label="Date limite globale de saisie" value={dateLimite} onChange={setDateLimite} type="date" />
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[10px] text-amber-300 font-medium">
              <AlertTriangle size={11} className="inline mr-1" />
              Après la date limite, toute saisie de notes sera bloquée pour les enseignants. Les administrateurs peuvent toujours intervenir.
            </div>
          </div>

          {/* Années scolaires */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest font-mono flex items-center space-x-1.5">
              <Calendar size={13} />
              <span>2 — Années Scolaires</span>
            </h3>
            <div className="flex space-x-2">
              <input value={newAnnee} onChange={e => setNewAnnee(e.target.value)} placeholder="ex: 2026-2027"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500 font-mono" />
              <button onClick={() => { if (newAnnee.trim()) { addAnneeScolaire(newAnnee.trim()); setNewAnnee(''); } }}
                className="flex items-center space-x-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer">
                <Plus size={12} /><span>Créer</span>
              </button>
            </div>
            <div className="space-y-2">
              {annees.map(a => (
                <div key={a.id} className={`flex justify-between items-center p-3 rounded-2xl border ${a.active ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-white/2'}`}>
                  <div>
                    <span className="text-xs font-bold text-white font-mono">{a.libelle}</span>
                    <span className={`ml-2 text-[9px] px-2 py-0.5 rounded-full font-bold ${a.active ? 'bg-emerald-500/20 text-emerald-400' : a.archivee ? 'bg-slate-700 text-slate-400' : 'bg-white/10 text-slate-300'}`}>
                      {a.active ? 'En cours' : a.archivee ? 'Archivée' : 'Inactive'}
                    </span>
                  </div>
                  {!a.active && (
                    <button onClick={() => setAnneeActive(a.id)}
                      className="text-[10px] text-orange-400 border border-orange-500/20 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1 rounded-lg font-bold cursor-pointer">
                      Activer
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tarifs */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest font-mono flex items-center space-x-1.5">
              <CreditCard size={13} />
              <span>3 — Grille Tarifaire (Frais par Classe)</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-left">
                    <th className="pb-2 font-semibold">Classe</th>
                    <th className="pb-2 font-semibold">Inscription (FCFA)</th>
                    <th className="pb-2 font-semibold">Scolarité annuelle (FCFA)</th>
                    <th className="pb-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map(cls => {
                    const fs = fraisScolaires.find(f => f.classeId === cls.id);
                    const [ins, setIns] = [fs?.montantInscription ?? 0, (v: string) => updateFraisScolaires({ classeId: cls.id, montantInscription: Number(v), montantScolarite: fs?.montantScolarite ?? 0 })];
                    const [sco, setSco] = [fs?.montantScolarite ?? 0, (v: string) => updateFraisScolaires({ classeId: cls.id, montantInscription: fs?.montantInscription ?? 0, montantScolarite: Number(v) })];
                    return (
                      <tr key={cls.id} className="border-b border-white/5">
                        <td className="py-2 font-bold text-white">{cls.nom}</td>
                        <td className="py-2">
                          <input type="number" defaultValue={ins} onBlur={e => setIns(e.target.value)} min={0}
                            className="w-28 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs font-mono outline-none focus:ring-1 focus:ring-orange-500" />
                        </td>
                        <td className="py-2">
                          <input type="number" defaultValue={sco} onBlur={e => setSco(e.target.value)} min={0}
                            className="w-28 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs font-mono outline-none focus:ring-1 focus:ring-orange-500" />
                        </td>
                        <td className="py-2">
                          <span className="text-[9px] text-emerald-400 font-mono">{fs ? 'Configuré ✓' : '—'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SMTP/SMS */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest font-mono">4 — Passerelles de Communication (SMTP / SMS)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Serveur SMTP" value={smtpHost} onChange={setSmtpHost} placeholder="smtp.votredomaine.ci" />
              <Field label="Email SMTP (expéditeur)" value={smtpUser} onChange={setSmtpUser} type="email" placeholder="notifs@ecole.ci" />
              <div className="md:col-span-2">
                <Field label="Gateway SMS (URL API ou nom opérateur)" value={smsGateway} onChange={setSmsGateway} placeholder="https://sms.orange.ci/api/..." />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSaveAcademique}
              className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-6 py-3 rounded-xl cursor-pointer transition-all">
              {acadSaved ? <CheckCircle size={14} /> : <Check size={14} />}
              <span>{acadSaved ? 'Enregistré !' : 'Enregistrer'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ════ ONGLET 3 — COMPTES (RBAC) ════════════════════════════════════════ */}
      {tab === 'comptes' && (
        <div className="space-y-5">
          {/* Création compte */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest font-mono flex items-center space-x-1.5">
              <Plus size={13} />
              <span>Créer un Compte Utilisateur</span>
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Prénom *" value={userForm.prenom} onChange={v => setUserForm(p=>({...p,prenom:v}))} placeholder="Konan" />
                <Field label="Nom *" value={userForm.nom} onChange={v => setUserForm(p=>({...p,nom:v}))} placeholder="DIALLO" />
                <Field label="Email *" value={userForm.email} onChange={v => setUserForm(p=>({...p,email:v}))} type="email" placeholder="k.diallo@ecole.ci" />
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Rôle *</label>
                  <select value={userForm.role} onChange={e => setUserForm(p=>({...p,role:e.target.value as any}))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                    {Object.entries(ROLES_LABELS).map(([k,v]) => <option key={k} value={k} className="bg-slate-900">{v}</option>)}
                  </select>
                </div>
                <Field label="Téléphone" value={userForm.phone} onChange={v => setUserForm(p=>({...p,phone:v}))} placeholder="+225 07 00 00 00" />
                {userForm.role === 'enseignant' && (
                  <Field label="Spécialité" value={userForm.specialty} onChange={v => setUserForm(p=>({...p,specialty:v}))} placeholder="Mathématiques" />
                )}
              </div>
              {userError && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] p-3 rounded-xl" role="alert">⚠ {userError}</div>}
              {userSuccess && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] p-3 rounded-xl">✓ {userSuccess}</div>}
              <div className="flex justify-end">
                <button type="submit" className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer">
                  <Plus size={13} /><span>Créer le compte</span>
                </button>
              </div>
            </form>
          </div>

          {/* Liste utilisateurs */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-3">
            <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest font-mono flex items-center space-x-1.5">
              <Users size={13} />
              <span>Comptes Actifs ({users.filter(u=>u.active).length})</span>
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {users.map(u => (
                <div key={u.id} className={`flex items-center justify-between p-3 rounded-2xl border ${u.active ? 'border-white/10 bg-white/3' : 'border-white/5 bg-white/1 opacity-50'}`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-200">
                      {u.prenom[0]}{u.nom[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{u.prenom} {u.nom}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono uppercase">
                      {ROLES_LABELS[u.role] || u.role}
                    </span>
                    {isAdmin && u.id !== currentUser?.id && (
                      <div className="flex space-x-1">
                        <button onClick={() => updateUser(u.id, { active: !u.active })}
                          className={`p-1.5 rounded-lg cursor-pointer text-xs ${u.active ? 'text-amber-400 hover:bg-amber-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                          title={u.active ? 'Désactiver' : 'Réactiver'}>
                          {u.active ? <EyeOff size={11} /> : <Eye size={11} />}
                        </button>
                        <button onClick={() => { if (confirm(`Supprimer ${u.prenom} ${u.nom} ?`)) deleteUser(u.id); }}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"><Trash2 size={11} /></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
