import React, { useState } from 'react';
import { StateProvider, useAppState } from './stateContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardAdmin } from './components/DashboardAdmin';
import { AiAssistantModule } from './components/AiAssistantModule';
import { LoginPage } from './components/LoginPage';
import { ScolangoPanel } from './components/ScolangoPanel';
import { ComptabiliteModule } from './components/ComptabiliteModule';
import {
  Book, Award, FileCheck2, AlertTriangle, CheckCircle
} from 'lucide-react';

// ─── Dashboard par rôle ──────────────────────────────────────────────────────
function DashboardSwitch() {
  const { currentUser, eleves, classes, notes, presences, getClassesEnseignant } = useAppState();

  if (!currentUser) {
    return (
      <div
        className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl text-center font-semibold max-w-md mx-auto my-12 text-slate-300 shadow-2xl"
        role="alert"
        id="session-timeout-view"
      >
        <AlertTriangle className="text-orange-500 mx-auto mb-4" size={40} aria-hidden="true" />
        <p className="text-sm">Session expirée.</p>
        <p className="text-xs text-slate-400 mt-2 font-normal">Veuillez vous reconnecter.</p>
      </div>
    );
  }

  // Admin / Directeur / Secrétaire → dashboard analytique
  if (['admin', 'directeur', 'secretaire'].includes(currentUser.role)) {
    return <DashboardAdmin />;
  }

  // Comptable → module comptabilité
  if (currentUser.role === 'comptable') {
    return <ComptabiliteModule />;
  }

  // Enseignant → ses classes dynamiquement
  if (currentUser.role === 'enseignant') {
    // ✅ Calcul dynamique via relation matière.enseignantId et classe.profPrincipalId
    const teachingClasses = getClassesEnseignant(currentUser.id);

    return (
      <div className="space-y-6" id="teacher-dashboard">
        {/* Bannière */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-3xl text-white shadow-lg space-y-2 relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
          <span className="bg-teal-500/10 text-teal-300 text-[10px] uppercase px-2.5 py-1 rounded-xl font-mono font-bold tracking-wider border border-teal-500/20">
            Espace Enseignant
          </span>
          <h2 className="text-xl md:text-2xl font-bold">
            Portail Pédagogique — Bonjour M/Mme {currentUser.nom}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl font-medium">
            Suivez les classes dont vous êtes en charge, saisissez les notes et utilisez l'assistant IA pour générer les bulletins.
          </p>
        </div>

        {/* Grille des classes */}
        {teachingClasses.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-3xl text-center text-slate-400 text-sm">
            Aucune classe ne vous est encore attribuée. Contactez l'administrateur.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" id="teacher-grid">
            {teachingClasses.map(cls => {
              const studentCount = eleves.filter(e => e.classeId === cls.id).length;
              const absCount = presences.filter(p => p.classeId === cls.id && p.statut === 'absent').length;
              return (
                <div key={cls.id} className="backdrop-blur-xl bg-white/5 border border-white/10 p-5 rounded-3xl shadow-lg space-y-3">
                  <div className="bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-bold px-2.5 py-1 rounded-xl inline-block uppercase">
                    {cls.nom}
                  </div>
                  <div className="text-sm text-slate-200 font-bold">{studentCount} élève{studentCount > 1 ? 's' : ''}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {absCount} absence{absCount !== 1 ? 's' : ''} enregistrée{absCount !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions rapides */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-5 rounded-3xl shadow-lg" id="teacher-quick-actions">
          <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wide mb-3 flex items-center space-x-2">
            <CheckCircle size={14} className="text-teal-400" aria-hidden="true" />
            <span>Actions pédagogiques prioritaires</span>
          </h4>
          <div className="space-y-2 text-xs text-slate-300 font-medium">
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center flex-wrap gap-2">
              <span>Faire l'appel du jour pour vos classes</span>
              <span className="text-[10px] text-teal-300 bg-teal-500/10 border border-teal-500/20 font-bold px-2.5 py-0.5 rounded-full uppercase">Recommandé</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center flex-wrap gap-2">
              <span>Compléter les notes du trimestre actif</span>
              <span className="text-[10px] text-slate-400 bg-white/10 border border-white/10 font-bold px-2.5 py-0.5 rounded-full uppercase">En attente</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Élève / Parent → tableau de bord personnel
  // Cherche l'élève lié au compte (parent → enfant via parentId, élève → son propre compte)
  const linkedEleve = currentUser.role === 'parent'
    ? eleves.find(e => e.parentId === currentUser.id) ?? eleves[0]
    : eleves.find(e => e.parentId === currentUser.id) ?? eleves.find(e => e.id.includes('eleve')) ?? eleves[0];

  const targetClass = classes.find(c => c.id === linkedEleve?.classeId);
  const studentNotes = notes.filter(n => n.eleveId === linkedEleve?.id);
  const studentAbs = presences.filter(p => p.eleveId === linkedEleve?.id && p.statut === 'absent').length;
  const averageValue = studentNotes.length > 0
    ? parseFloat((studentNotes.reduce((sum, item) => sum + item.valeur, 0) / studentNotes.length).toFixed(2))
    : 0;

  return (
    <div className="space-y-6" id="student-portal-wrapper">
      {/* Bannière */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-3xl text-white shadow-lg space-y-2 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <span className="bg-orange-500/10 text-orange-400 text-[10px] uppercase font-mono px-2.5 py-1 rounded-xl font-bold tracking-widest border border-orange-500/20">
          {currentUser.role === 'parent' ? 'Espace Parent / Suivi Tuteur' : 'Espace Élève'}
        </span>
        <h2 className="text-xl md:text-2xl font-bold">
          {currentUser.role === 'parent'
            ? `Suivi scolaire de ${linkedEleve?.prenom ?? '—'}`
            : `Bonjour, ${currentUser.prenom}`}
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-xl font-medium">
          Consultez l'historique des bulletins, le planning des cours et les alertes d'absences.
        </p>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="student-portal-metric-cards">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-5 rounded-3xl shadow-lg flex items-center space-x-4">
          <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-2xl text-orange-400" aria-hidden="true">
            <Award size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold">Moyenne générale</span>
            <h4 className="text-xl font-bold text-white">{averageValue > 0 ? `${averageValue}/20` : '—'}</h4>
            <span className={`text-[10px] font-bold ${averageValue >= 10 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {averageValue === 0 ? 'Aucune note' : averageValue >= 10 ? 'Admis' : 'Insuffisant'}
            </span>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-5 rounded-3xl shadow-lg flex items-center space-x-4">
          <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl text-rose-400" aria-hidden="true">
            <AlertTriangle size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold">Absences</span>
            <h4 className="text-xl font-bold text-white">{studentAbs}</h4>
            <span className="text-[10px] text-slate-500 font-medium">Ce trimestre</span>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-5 rounded-3xl shadow-lg flex items-center space-x-4">
          <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-2xl text-blue-400" aria-hidden="true">
            <Book size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold">Classe</span>
            <h4 className="text-lg font-bold text-white">{targetClass?.nom ?? '—'}</h4>
            <span className="text-[10px] text-slate-500 capitalize font-medium">{targetClass?.niveau ?? ''}</span>
          </div>
        </div>
      </div>

      {/* Relevé de notes */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-3xl shadow-lg space-y-4" id="student-grades-list">
        <h4 className="font-bold text-xs text-slate-200 uppercase flex items-center space-x-2 border-b border-white/10 pb-2">
          <FileCheck2 size={16} className="text-orange-400" aria-hidden="true" />
          <span>Relevé des notes</span>
        </h4>
        {studentNotes.length === 0 ? (
          <p className="p-4 text-center text-slate-400 text-xs italic">Aucune note enregistrée.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {studentNotes.map((n) => (
              <div key={n.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-200 capitalize">{n.type}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">{n.dateSaisie}</div>
                </div>
                <span className={`text-sm font-mono font-bold px-2.5 py-1 rounded-xl border ${
                  n.valeur >= 10
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {n.valeur}/20
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shell principal de l'application ────────────────────────────────────────
function MainAppShell() {
  const { currentUser, parametres } = useAppState();

  const [activeTab, setActiveTab] = useState(() => {
    const role = currentUser?.role;
    if (role === 'eleve' || role === 'parent') return 'evaluations';
    if (role === 'enseignant') return 'evaluations';
    if (role === 'comptable') return 'comptabilite';
    return 'gestion';
  });

  if (!currentUser) {
    return <LoginPage />;
  }

  // Thème couleur dynamique depuis les paramètres
  const theme = parametres?.themePrincipal || 'orange';
  const themeMap: Record<string, [string, string, string]> = {
    blue:    ['#3b82f6', '#2563eb', '#60a5fa'],
    emerald: ['#10b981', '#059669', '#34d399'],
    purple:  ['#6366f1', '#4f46e5', '#818cf8'],
    indigo:  ['#6366f1', '#4f46e5', '#818cf8'],
    violet:  ['#6366f1', '#4f46e5', '#818cf8'],
    rose:    ['#f43f5e', '#e11d48', '#fb7185'],
    orange:  ['#f97316', '#ea580c', '#fb923c'],
  };
  const [brandColor, brandHover, brandText] = themeMap[theme] ?? themeMap.orange;

  const themeVariables = {
    '--brand-color':      brandColor,
    '--brand-color-hover': brandHover,
    '--brand-color-text': brandText,
  } as React.CSSProperties;

  return (
    <div style={themeVariables} className="min-h-screen bg-[#05070a] text-slate-200 font-sans flex flex-col relative overflow-hidden" id="erp-app-shell">
      <div className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />

      <Header />

      <div className="flex-1 flex flex-col md:flex-row z-10" id="main-frame-holder">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main
          className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all duration-300 overflow-x-hidden"
          id="router-panel-area"
          role="main"
        >
          {activeTab === 'assistant' ? (
            <AiAssistantModule />
          ) : activeTab === 'comptabilite' ? (
            <ComptabiliteModule />
          ) : activeTab === 'accueil' ? (
            <DashboardSwitch />
          ) : (
            <ScolangoPanel activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StateProvider>
      <MainAppShell />
    </StateProvider>
  );
}
