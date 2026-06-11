import React, { useState } from 'react';
import { useAppState } from '../stateContext';
import { Presence, StatutPresence } from '../types';
import { Calendar, UserCheck, AlertTriangle, FileSpreadsheet, Plus, HelpCircle } from 'lucide-react';

export const PresencesModule: React.FC = () => {
  const { 
    currentUser, 
    classes, 
    eleves, 
    presences, 
    enregistrerAppel 
  } = useAppState();

  const [selectedClass, setSelectedClass] = useState('classe-tles');
  const [appelDate, setAppelDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  
  // Interactive Roll call state: mapper of { [eleveId]: { status, motif } }
  const [rollCallState, setRollCallState] = useState<Record<string, { status: StatutPresence; motif: string }>>({});
  const [appelSuccess, setAppelSuccess] = useState('');

  // Tabs for sub actions
  const [activePresenceTab, setActivePresenceTab] = useState<'appeler' | 'historique' | 'statistiques'>('appeler');

  // Verify can register attendance
  const isEligibleToCall = ['admin', 'enseignant', 'secretaire'].includes(currentUser?.role || '');

  // Students in selected class
  const classStudents = eleves.filter(e => e.classeId === selectedClass);

  const initializeRollCall = () => {
    const fresh: Record<string, { status: StatutPresence; motif: string }> = {};
    classStudents.forEach(st => {
      // Find matches if already registered for class on same date
      const matched = presences.find(p => p.eleveId === st.id && p.date === appelDate);
      fresh[st.id] = {
        status: matched ? matched.statut : 'present',
        motif: matched?.motif || ''
      };
    });
    setRollCallState(fresh);
  };

  // Run on mount or selection change
  React.useEffect(() => {
    initializeRollCall();
  }, [selectedClass, appelDate, eleves, presences]);

  const handleStatusChange = (studentId: string, status: StatutPresence) => {
    setRollCallState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleMotifChange = (studentId: string, motif: string) => {
    setRollCallState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], motif }
    }));
  };

  const submitRollCall = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = classStudents.map(st => {
      const state = rollCallState[st.id] || { status: 'present', motif: '' };
      return {
        eleveId: st.id,
        status: state.status,
        motif: state.motif ? state.motif : undefined,
        date: appelDate,
        classeId: selectedClass
      };
    });

    enregistrerAppel(payload);
    setAppelSuccess(`✓ Appel enregistré pour le ${appelDate}.`);
    setTimeout(() => setAppelSuccess(''), 4000);
    setActivePresenceTab('historique');
  };

  // Statistics computations
  const totalAssiduits = presences.length;
  const absentsCount = presences.filter(p => p.statut === 'absent').length;
  const retardsCount = presences.filter(p => p.statut === 'retard').length;
  const presentsCount = presences.filter(p => p.statut === 'present').length;
  
  const absRate = totalAssiduits > 0 ? Math.round((absentsCount / totalAssiduits) * 100) : 6;
  const justifiedCount = presences.filter(p => p.statut === 'absent' && p.justifie).length;
  const justifiedRate = absentsCount > 0 ? Math.round((justifiedCount / absentsCount) * 100) : 100;

  // History logs filtered
  const filteredPresenceHistory = presences.filter(p => p.classeId === selectedClass);

  return (
    <div className="space-y-6" id="presences-module-main">
      
      {/* Upper sub tabs */}
      <div className="flex border-b border-white/10" id="presences-tabs">
        <button
          onClick={() => setActivePresenceTab('appeler')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activePresenceTab === 'appeler' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Faire l'appel de classe
        </button>
        <button
          onClick={() => setActivePresenceTab('historique')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activePresenceTab === 'historique' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Consulter l'historique d'appel
        </button>
        <button
          onClick={() => setActivePresenceTab('statistiques')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activePresenceTab === 'statistiques' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Analyses & Taux d’Absences
        </button>
      </div>

      {activePresenceTab === 'appeler' && (
        <div className="space-y-4" id="roll-call-panel">
          
          {/* Settings picker bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 backdrop-blur-xl bg-white/5 p-4 border border-white/10 rounded-3xl shadow-lg">
            <div className="space-y-1 text-xs font-semibold">
              <span className="text-slate-400">Sélectionner la classe d'appel :</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border border-white/10 bg-black/45 text-slate-205 text-white p-2.5 rounded-xl outline-none font-bold"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">{c.nom} ({c.niveau})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 text-xs font-semibold">
              <span className="text-slate-400">Date de l'appel :</span>
              <input
                type="date"
                value={appelDate}
                onChange={(e) => setAppelDate(e.target.value)}
                className="w-full border border-white/10 bg-black/45 text-slate-200 p-2 rounded-xl outline-none font-mono font-bold"
              />
            </div>
          </div>

          {/* Roll Call main UI */}
          <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-lg p-5 space-y-4" id="students-roll-list">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 flex-wrap">
              <div>
                <h3 className="text-sm font-bold text-white uppercase flex items-center space-x-1.5">
                  <UserCheck size={16} className="text-orange-400" />
                  <span>Registre présences - {classes.find(c => c.id === selectedClass)?.nom}</span>
                </h3>
                <p className="text-[11px] text-slate-400">Marquez les présences de chaque élève pour le cours du jour.</p>
              </div>
              {!isEligibleToCall && (
                <span className="bg-amber-500/10 text-[10px] text-amber-400 px-3 py-1 rounded-full border border-amber-500/20 font-bold">
                  🔒 Consulter uniquement
                </span>
              )}
            </div>

            {classStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                Aucun élève inscrit dans cette classe.
              </div>
            ) : (
              <form onSubmit={submitRollCall} className="space-y-4">
                <div className="divide-y divide-white/10">
                  {classStudents.map(st => {
                    const state = rollCallState[st.id] || { status: 'present', motif: '' };
                    return (
                      <div key={st.id} className="py-3.5 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                          <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold uppercase border border-white/10">
                            {st.prenom.slice(0, 1)}{st.nom.slice(0, 1)}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white">{st.nom} {st.prenom}</div>
                            <div className="text-[10px] text-slate-400 font-mono font-medium">Matricule: {st.matricule}</div>
                          </div>
                        </div>

                        {/* Interactive Toggle pill elements */}
                        <div className="flex items-center space-x-4 flex-wrap gap-2">
                          <div className="flex bg-black/45 p-1 rounded-xl border border-white/10">
                            <button
                              type="button"
                              disabled={!isEligibleToCall}
                              onClick={() => handleStatusChange(st.id, 'present')}
                              className={`px-3 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                                state.status === 'present' 
                                  ? 'bg-emerald-500 text-white shadow-lg' 
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Présent
                            </button>
                            <button
                              type="button"
                              disabled={!isEligibleToCall}
                              onClick={() => handleStatusChange(st.id, 'absent')}
                              className={`px-3 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                                state.status === 'absent' 
                                  ? 'bg-rose-500 text-white shadow-lg' 
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              disabled={!isEligibleToCall}
                              onClick={() => handleStatusChange(st.id, 'retard')}
                              className={`px-3 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                                state.status === 'retard' 
                                  ? 'bg-amber-500 text-white shadow-lg' 
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Retard
                            </button>
                          </div>

                          {/* Reason motif input if late or absent */}
                          {state.status !== 'present' && (
                            <input
                              type="text"
                              disabled={!isEligibleToCall}
                              placeholder="Motif / Justificatif..."
                              value={state.motif}
                              onChange={(e) => handleMotifChange(st.id, e.target.value)}
                              className="border border-white/10 rounded-xl px-2.5 py-1 text-xs outline-none w-48 font-medium bg-white/5 text-white"
                            />
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

                {isEligibleToCall && (
                  <div className="flex justify-end pt-2 border-t border-white/10">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-all"
                    >
                      Enregistrer l’appel d’établissement
                    </button>
                  </div>
                )}
              </form>
            )}

          </div>

        </div>
      )}

      {activePresenceTab === 'historique' && (
        <div className="backdrop-blur-xl bg-white/5 p-5 rounded-3xl border border-white/10 shadow-lg space-y-4" id="presence-history-panel">
          <div>
            <h3 className="text-sm font-bold text-white uppercase">Historique d'Appel de la Classe</h3>
            <p className="text-xs text-slate-400">Consultez l'historique complet des présences enregistrées.</p>
          </div>

          <div className="border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="bg-black/25 text-[10px] font-bold text-slate-400 uppercase border-b border-white/10">
                  <th className="p-3">Date</th>
                  <th className="p-3">Élève</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Justification officielle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-semibold text-slate-200">
                {filteredPresenceHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 font-mono">
                      Aucun registre enregistré pour cette classe.
                    </td>
                  </tr>
                ) : (
                  filteredPresenceHistory.map((pr) => {
                    const st = eleves.find(el => el.id === pr.eleveId);
                    return (
                      <tr key={pr.id} className="hover:bg-white/5">
                        <td className="p-3 font-mono text-[11px] text-slate-450">{pr.date}</td>
                        <td className="p-3 font-bold text-white">{st ? `${st.nom} ${st.prenom}` : 'Élève inconnu'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                            pr.statut === 'present' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-550/10' :
                            pr.statut === 'absent' ? 'bg-rose-500/15 text-rose-400 border border-rose-550/10' :
                            'bg-amber-500/15 text-amber-400 border border-amber-550/10'
                          }`}>
                            {pr.statut}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-405 italic">
                          {pr.motif ? (
                            <span className="text-amber-450 flex items-center space-x-1">
                              <span>✓ Justifié:</span>
                              <strong>{pr.motif}</strong>
                            </span>
                          ) : (
                            <span className="text-slate-500">Non justifié</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activePresenceTab === 'statistiques' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="presence-analytics">
          
          <div className="backdrop-blur-xl bg-white/5 p-5 rounded-3xl border border-white/10 shadow-lg space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Taux d'Absences d'Établissement</span>
            <div className="text-3xl font-bold font-mono text-white">{absRate}%</div>
            <p className="text-[11px] text-slate-400 font-medium">Pourcentage des heures non assistées sur le registre.</p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 p-5 rounded-3xl border border-white/10 shadow-lg space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Taux d'Absences Justifiées</span>
            <div className="text-3xl font-bold font-mono text-amber-550 text-orange-400">{justifiedRate}%</div>
            <p className="text-[11px] text-slate-400 font-medium">Absences excusées par fournitures médicales ou parentales.</p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 p-5 rounded-3xl border border-white/10 shadow-lg space-y-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Registres d’Appels Complétés</span>
            <div className="text-3xl font-bold font-mono text-emerald-400">{totalAssiduits}</div>
            <p className="text-[11px] text-slate-400 font-medium">Lignes d'assiduité globales compilées à ce jour.</p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 p-5 rounded-3xl border border-white/10 shadow-lg md:col-span-2 lg:col-span-3 space-y-3">
            <h4 className="font-bold text-xs text-white uppercase flex items-center space-x-1">
              <AlertTriangle size={15} className="text-rose-455 text-rose-500" />
              <span>Alerte Absences répétées (Drogue, Maladies, Décrochage)</span>
            </h4>
            <div className="text-xs text-slate-400 mb-4 font-semibold">Élèves enregistrant plus de 1 absence non légitimée necessitant convocation de parent.</div>

            <div className="divide-y divide-white/10 font-semibold">
              {eleves.map(el => {
                const totalAbs = presences.filter(p => p.eleveId === el.id && p.statut === 'absent').length;
                if (totalAbs === 0) return null;
                const cls = classes.find(c => c.id === el.classeId);
                return (
                  <div key={el.id} className="py-2.5 flex justify-between items-center text-slate-205">
                    <div>
                      <div className="font-bold text-white">{el.nom} {el.prenom} ({cls?.nom})</div>
                      <div className="text-[10px] text-slate-400 font-medium">Parent à contacter: {el.parentNom} - {el.parentContact}</div>
                    </div>
                    <span className="bg-rose-500/15 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-xl border border-rose-500/10">
                      {totalAbs} Absences
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
