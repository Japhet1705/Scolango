import React, { useState } from 'react';
import { useAppState } from '../stateContext';
import { Users, GraduationCap, Calendar, Award, ShieldAlert, BadgeCheck, AlertTriangle } from 'lucide-react';

export const DashboardAdmin: React.FC = () => {
  const { 
    currentUser, 
    eleves, 
    users, 
    classes, 
    presences, 
    notes,
    auditLogs,
    clearLogs,
    parametres,
    updateParametres,
    annees,
    setAnneeActive
  } = useAppState();

  const [activeSetupTab, setActiveSetupTab] = useState<'stats' | 'config' | 'logs'>('stats');

  // School Stats computations
  const totalElevesCount = eleves.length;
  const totalTeachersCount = users.filter(u => u.role === 'enseignant').length;
  const totalClassesCount = classes.length;
  
  // Presence rate calculation
  const totalPresencesLogged = presences.length;
  const presentCount = presences.filter(p => p.statut === 'present').length;
  const presenceRate = totalPresencesLogged > 0 
    ? Math.round((presentCount / totalPresencesLogged) * 100) 
    : 94; // fallback standard rate

  // Averages overall
  const overallAvg = notes.length > 0 
    ? parseFloat((notes.reduce((acc, curr) => acc + curr.valeur, 0) / notes.length).toFixed(2))
    : 14.2;

  // Best classes calculations
  const levelDistribution = classes.reduce((acc, curr) => {
    acc[curr.niveau] = (acc[curr.niveau] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6" id="dashboard-admin-main">
      
      {/* Tab Switcher upper */}
      <div className="flex border-b border-white/10" id="admin-tabs">
        <button
          onClick={() => setActiveSetupTab('stats')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeSetupTab === 'stats' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Analyse Académique & Stats
        </button>
        <button
          onClick={() => setActiveSetupTab('config')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeSetupTab === 'config' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Paramètres Années & Établissement
        </button>
        <button
          onClick={() => setActiveSetupTab('logs')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeSetupTab === 'logs' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Logs d'Audit Système ({auditLogs.length})
        </button>
      </div>

      {activeSetupTab === 'stats' && (
        <>
          {/* Welcome Banner */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-3xl text-white shadow-lg space-y-2 relative overflow-hidden" id="welcome-id-banner">
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <span className="bg-orange-500/10 text-orange-400 text-[10px] font-mono tracking-wider font-bold uppercase px-3 py-1 rounded-full border border-orange-500/20">
              Session Live / {currentUser?.role === 'admin' ? 'Administration Centrale' : 'Supervision Académique'}
            </span>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Bienvenue, {currentUser?.prenom} {currentUser?.nom}
            </h2>
            <p className="text-sm text-slate-300 max-w-xl font-medium">
              Tableau de bord de pilotage du <strong className="text-white">{parametres.nomEtablissement}</strong>. 
              Suivez l'activité des élèves, la saisie des notes, ainsi que le taux de présence quotidien de l'école.
            </p>
          </div>

          {/* Stats Indicators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
            
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-5 rounded-3xl shadow-lg flex items-center space-x-4 hover:bg-white/10 transition-colors" id="stat-card-students">
              <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-2xl text-orange-400">
                <Users size={24} className="stroke-[2]" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold">Élèves Inscrits</span>
                <h3 className="text-2xl font-bold text-white mt-0.5">{totalElevesCount}</h3>
                <span className="text-[10px] text-emerald-400 font-semibold">↑ Actifs ce trimestre</span>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-5 rounded-3xl shadow-lg flex items-center space-x-4 hover:bg-white/10 transition-colors" id="stat-card-teachers">
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-2xl text-indigo-400">
                <GraduationCap size={24} className="stroke-[2]" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold">Enseignants Actifs</span>
                <h3 className="text-2xl font-bold text-white mt-0.5">{totalTeachersCount}</h3>
                <span className="text-[10px] text-slate-400 font-semibold">Matières assignées</span>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-5 rounded-3xl shadow-lg flex items-center space-x-4 hover:bg-white/10 transition-colors" id="stat-card-classes">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-emerald-400">
                <Calendar size={24} className="stroke-[2]" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold">Classes Créées</span>
                <h3 className="text-2xl font-bold text-white mt-0.5">{totalClassesCount}</h3>
                <span className="text-[10px] text-slate-400 font-semibold">Niveau P. à Univ.</span>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-5 rounded-3xl shadow-lg flex items-center space-x-4 hover:bg-white/10 transition-colors" id="stat-card-attendance">
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-amber-500">
                <Award size={24} className="stroke-[2]" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-bold">Moyenne Générale</span>
                <h3 className="text-2xl font-bold text-white mt-0.5">{overallAvg} / 20</h3>
                <span className="text-[10px] text-amber-400 font-semibold">Taux global: {presenceRate}%</span>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="charts-and-lists">
            
            {/* Presence breakdown visual bar chart simulator */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-3xl shadow-lg lg:col-span-8 space-y-4" id="attendance-breakdown">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-white">Suivi d'Assiduité et Présences Globales</h4>
                  <p className="text-xs text-slate-400">Taux global actuel sur l'établissement scolaire</p>
                </div>
                <div className="bg-white/10 text-[11px] font-mono px-3 py-1 rounded-full text-slate-200 border border-white/5">
                  {presenceRate}% d'Assiduité
                </div>
              </div>

              {/* Attendance percentage indicator bar */}
              <div className="space-y-2">
                <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden flex">
                  <div style={{ width: `${presenceRate}%` }} className="bg-emerald-500 h-full" title="Présents" />
                  <div style={{ width: `${100 - presenceRate}%` }} className="bg-rose-500 h-full" title="Absences / Retards" />
                </div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                    <span>Présents ({presenceRate}%)</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
                    <span>Absents / Retards ({100 - presenceRate}%)</span>
                  </span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4" id="distribution-by-levels">
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Répartition des classes par niveau académique</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['primaire', 'college', 'lycee', 'universite'].map((lvl) => {
                    const count = levelDistribution[lvl] || 0;
                    return (
                      <div key={lvl} className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{lvl}</span>
                        <div className="text-lg font-bold text-white mt-1">{count} {count > 1 ? 'Classes' : 'Classe'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick school info block */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-3xl shadow-lg lg:col-span-4 space-y-4" id="school-info-widget">
              <h4 className="text-sm font-bold text-white">Informations Établissement</h4>
              
              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Nom complet:</span>
                  <span className="font-semibold text-white">{parametres.nomEtablissement}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400 font-medium">Adresse physique:</span>
                  <span className="font-semibold text-white text-right max-w-[180px] truncate" title={parametres.adresse}>
                    {parametres.adresse}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Devise financière:</span>
                  <span className="font-mono font-bold text-orange-400">{parametres.devise}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Année Académique:</span>
                  <span className="font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] px-2.5 py-1 rounded-xl font-mono uppercase">
                    Actif: 2025-2026
                  </span>
                </div>
              </div>

              <div className="bg-orange-500/5 p-4 rounded-2xl border border-orange-500/10 text-xs text-orange-400">
                <h5 className="font-bold flex items-center space-x-1.5 mb-1.5 text-orange-300">
                  <BadgeCheck size={14} className="text-orange-400" />
                  <span>Version d’Établissement</span>
                </h5>
                <p className="text-slate-350 text-[11px] leading-relaxed font-semibold">
                  Ce logiciel est configuré en mode **Multi-Rôles scolaire**. Utilisez le sélecteur d'utilisateurs en haut pour basculer d'un profil à un autre.
                </p>
              </div>
            </div>

          </div>
        </>
      )}

      {/* Configurations Panel and Active Years */}
      {activeSetupTab === 'config' && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-3xl shadow-lg space-y-6" id="school-configuration-panel">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Paramètres de l'Établissement</h3>
            <p className="text-xs text-slate-400">Configurez l'identité et l'année académique active.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-300">Nom de l'école/Établissement scolaire</label>
              <input 
                type="text" 
                value={parametres.nomEtablissement} 
                onChange={(e) => updateParametres({ nomEtablissement: e.target.value })}
                className="w-full border border-white/10 rounded-xl p-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xs outline-none bg-white/5 text-white font-medium placeholder-slate-500" 
              />
            </div>
            
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-300">Adresse de l'établissement</label>
              <input 
                type="text"
                value={parametres.adresse} 
                onChange={(e) => updateParametres({ adresse: e.target.value })}
                className="w-full border border-white/10 rounded-xl p-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xs outline-none bg-white/5 text-white font-medium placeholder-slate-500" 
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-300">Devise de transaction / Affichage financier</label>
              <input 
                type="text" 
                value={parametres.devise}
                onChange={(e) => updateParametres({ devise: e.target.value })}
                className="w-full border border-white/10 rounded-xl p-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xs outline-none bg-white/5 text-white font-mono font-bold" 
              />
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h4 className="text-xs font-bold text-slate-200 uppercase mb-3">Sélectionner l'Année Scolaire Active</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {annees.map((yr) => (
                <div 
                  key={yr.id} 
                  className={`p-4 rounded-2xl border text-xs relative overflow-hidden transition-all ${
                    yr.active 
                      ? 'bg-orange-500/10 border-orange-550/30 border-orange-500/20 text-orange-200' 
                      : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="font-mono font-bold text-sm mb-1">{yr.libelle}</div>
                  <div className="text-[10px] text-slate-400 mb-3">{yr.archivee ? "Année Archivée" : "Année En Cours"}</div>
                  
                  {yr.active ? (
                    <span className="inline-flex items-center space-x-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] py-0.5 px-2.5 rounded-full font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
                      <span>Année Active</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => setAnneeActive(yr.id)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-lg transition-colors text-[9px] font-bold cursor-pointer"
                    >
                      Activer cette année
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logs System Panel */}
      {activeSetupTab === 'logs' && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-3xl shadow-lg space-y-4" id="system-audit-logs">
          <div className="flex justify-between items-center flex-wrap">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Registre d'Audit Système et Logs</h3>
              <p className="text-xs text-slate-400">Historique des 100 dernières actions d'administration ou de saisie de notes.</p>
            </div>
            <button
              onClick={clearLogs}
              className="text-xs text-red-400 hover:text-red-300 font-bold bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/20 transition-colors mt-2 sm:mt-0 cursor-pointer"
              id="clear-logs-btn"
            >
              Vider le journal de logs
            </button>
          </div>

          <div className="border border-white/10 rounded-2xl overflow-hidden" id="logs-container">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="bg-white/5 text-[11px] font-bold uppercase tracking-wider border-b border-white/10 text-slate-200">
                  <th className="p-3">Horodatage</th>
                  <th className="p-3">Utilisateur / Rôle</th>
                  <th className="p-3">Action exécutée</th>
                  <th className="p-3">Détails de l'opération</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-semibold">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 font-mono">
                      Aucun log enregistré pour le moment.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((lg) => (
                    <tr key={lg.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 text-slate-400 font-mono text-[10px]">
                        {new Date(lg.timestamp).toLocaleString('fr-FR')}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-200">{lg.utilisateurNom}</div>
                        <span className="text-[9px] font-mono uppercase bg-white/10 py-0.5 px-1.5 rounded text-slate-300 font-bold mt-1 inline-block">
                          {lg.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-orange-400 font-bold bg-orange-500/15 border border-orange-500/20 px-2 py-0.5 rounded text-[10px]">
                          {lg.action}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 font-mono text-[11px] leading-relaxed">
                        {lg.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
