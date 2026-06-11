import React, { useState } from 'react';
import { useAppState } from '../stateContext';
import { CalendarRange, Plus, Trash2, ShieldCheck, Clock, Layers } from 'lucide-react';

export const ScheduleModule: React.FC = () => {
  const { 
    currentUser, 
    creneaux, 
    classes, 
    matieres, 
    users, 
    addCreneau, 
    deleteCreneau 
  } = useAppState();

  const [selectedClassId, setSelectedClassId] = useState('classe-tles');
  const [selectedTeacherId, setSelectedTeacherId] = useState('all');

  // Form input states
  const [showAddForm, setShowAddForm] = useState(false);
  const [conflictError, setConflictError] = useState<string>('');
  const [formJour, setFormJour] = useState<'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi'>('Lundi');
  const [formHeureDebut, setFormHeureDebut] = useState('08:00');
  const [formHeureFin, setFormHeureFin] = useState('10:00');
  const [formMatiereId, setFormMatiereId] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formSalle, setFormSalle] = useState('Salle A1');

  const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const TIME_SLOTS = [
    { start: '08:00', end: '10:00', label: '08h00 - 10h00' },
    { start: '10:15', end: '12:15', label: '10h15 - 12h15' },
    { start: '14:00', end: '16:00', label: '14h00 - 16h00' },
    { start: '16:15', end: '18:15', label: '16h15 - 18h15' }
  ];

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError('');

    if (!formMatiereId || !formTeacherId) {
      setConflictError("Veuillez choisir une matière et un enseignant.");
      return;
    }

    const result = addCreneau({
      classeId: selectedClassId,
      jour: formJour,
      heureDebut: formHeureDebut,
      heureFin: formHeureFin,
      matiereId: formMatiereId,
      enseignantId: formTeacherId,
      salle: formSalle,
    });

    if (!result.success) {
      setConflictError(result.error ?? 'Conflit de planification détecté.');
      return;
    }

    setFormSalle('Salle A1');
    setShowAddForm(false);
  };

  const isEligibleToSchedule = currentUser?.role === 'admin' || currentUser?.role === 'secretaire';

  // Filter schedules based on selection
  let displayedCreneaux = creneaux.filter(cr => cr.classeId === selectedClassId);
  if (currentUser?.role === 'enseignant') {
    // Teachers check their own timetable
    displayedCreneaux = creneaux.filter(cr => cr.enseignantId === currentUser.id);
  } else if (selectedTeacherId !== 'all') {
    displayedCreneaux = creneaux.filter(cr => cr.enseignantId === selectedTeacherId);
  }

  // Teacher lookup map for easy access
  const teachers = users.filter(u => u.role === 'enseignant');

  return (
    <div className="space-y-6" id="schedule-module-main">
      
      {/* Module Title Banner */}
      <div className="flex justify-between items-center border-b border-white/10 pb-3 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <CalendarRange size={18} className="text-orange-400" />
            <span>Planification & Emplois du Temps</span>
          </h2>
          <p className="text-xs text-slate-400">
            {currentUser?.role === 'enseignant' 
              ? 'Consultez votre planning personnel d’enseignement.' 
              : 'Gérez et éditez les plannings de cours par classe d’élèves.'}
          </p>
        </div>

        {isEligibleToSchedule && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-all flex items-center space-x-1.5"
            id="toggle-schedule-form"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Nouveau créneau cours</span>
          </button>
        )}
      </div>

      {/* Filters selectors */}
      <div className="backdrop-blur-xl bg-white/5 p-4 rounded-3xl border border-white/10 flex flex-wrap gap-4 items-center shadow-lg" id="schedule-selectors">
        {currentUser?.role !== 'enseignant' ? (
          <>
            <div className="space-y-1 text-xs font-semibold">
              <span className="text-slate-400">Voir par Classe :</span>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedTeacherId('all');
                }}
                className="border border-white/10 bg-black/45 text-white p-2 rounded-xl text-xs font-bold outline-none"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">{c.nom} ({c.niveau})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 text-xs font-semibold">
              <span className="text-slate-400">Filtrer par Enseignant :</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => {
                  setSelectedTeacherId(e.target.value);
                }}
                className="border border-white/10 bg-black/45 text-white p-2 rounded-xl text-xs font-bold outline-none"
              >
                <option value="all" className="bg-slate-900 text-slate-200">Filtre des professeurs (Tous)</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">Prof: {t.nom} {t.prenom}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div className="text-xs text-orange-400 font-semibold flex items-center space-x-2 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20" id="teacher-alert-schedule">
            <ShieldCheck size={14} />
            <span>Aperçu de votre planning - Matières & classes assignées</span>
          </div>
        )}
      </div>

      {/* Add Slot form drawer */}
      {showAddForm && (
        <form onSubmit={handleAddSlot} className="backdrop-blur-xl bg-white/5 p-5 rounded-3xl border border-white/10 shadow-lg space-y-4" id="add-schedule-drawer">
          <div className="font-extrabold text-xs text-orange-400 flex items-center space-x-1.5 uppercase font-mono">
            <Clock size={15} />
            <span>AJOUTER UN CRÉNEAU HORAIRE À L’EMPLOI DU TEMPS</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
            
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Jour de la semaine</label>
              <select value={formJour} onChange={(e) => setFormJour(e.target.value as any)} className="w-full border border-white/10 p-2 rounded-xl bg-black/45 text-white font-bold outline-none">
                {DAYS.map(d => <option key={d} value={d} className="bg-slate-900 text-slate-200">{d}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Heure de début</label>
              <select value={formHeureDebut} onChange={(e) => setFormHeureDebut(e.target.value)} className="w-full border border-white/10 p-2 rounded-xl bg-black/45 text-white font-mono font-bold outline-none">
                {TIME_SLOTS.map(t => <option key={t.start} value={t.start} className="bg-slate-900 text-slate-200">{t.start}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Heure de fin</label>
              <select value={formHeureFin} onChange={(e) => setFormHeureFin(e.target.value)} className="w-full border border-white/10 p-2 rounded-xl bg-black/45 text-white font-mono font-bold outline-none">
                {TIME_SLOTS.map(t => <option key={t.end} value={t.end} className="bg-slate-900 text-slate-200">{t.end}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Matière de cours</label>
              <select 
                value={formMatiereId} 
                onChange={(e) => setFormMatiereId(e.target.value)} 
                required 
                className="w-full border border-white/10 p-2 rounded-xl bg-black/45 text-white font-bold outline-none"
              >
                <option value="" className="bg-slate-900 text-slate-400">Sélectionner</option>
                {matieres.filter(m => m.classeId === selectedClassId).map(m => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">{m.nom}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Professeur en Charge</label>
              <select 
                value={formTeacherId} 
                onChange={(e) => setFormTeacherId(e.target.value)} 
                required 
                className="w-full border border-white/10 p-2 rounded-xl bg-black/45 text-white font-bold outline-none"
              >
                <option value="" className="bg-slate-900 text-slate-400">Sélectionner</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">{t.prenom} {t.nom}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Salle de cours</label>
              <input type="text" value={formSalle} onChange={(e) => setFormSalle(e.target.value)} className="w-full border border-white/10 p-2 rounded-xl bg-black/45 text-white font-bold outline-none" placeholder="Labo, Salle A, etc." />
            </div>

            <div className="flex items-end justify-end">
              <button type="submit" className="w-full py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg flex items-center justify-center cursor-pointer">
                Enregistrer
              </button>
            </div>

          </div>
        </form>
      )}

      {/* Visual schedule calendar grids */}
      <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-lg overflow-hidden p-6 space-y-4" id="timetable-dashboard-visual-grid">
        <h3 className="font-bold text-xs text-white uppercase flex items-center space-x-1 border-b border-white/10 pb-2 mb-4">
          <Layers size={14} className="text-orange-400" />
          <span>Grille Calendaire de Cours Hebdomadaire</span>
        </h3>

        {/* Dynamic Days header and Slots structure mapping */}
        <div className="hidden lg:grid grid-cols-7 gap-3 text-center text-xs font-bold text-white border-b border-white/10 pb-3" id="timetable-desktop-header">
          <div className="p-2 border border-white/10 rounded-xl bg-white/10 font-mono text-slate-300">Heures de cours</div>
          {DAYS.map(day => (
            <div key={day} className="p-2 border border-white/10 rounded-xl bg-white/5 text-slate-200 font-semibold">{day}</div>
          ))}
        </div>

        {/* Time slots mapping */}
        <div className="space-y-3" id="calendar-body">
          {TIME_SLOTS.map(slot => (
            <div key={slot.start} className="grid grid-cols-1 lg:grid-cols-7 gap-3 items-center min-h-[80px]" id={`slot-row-${slot.start}`}>
              
              {/* Slot time display */}
              <div className="p-3 bg-black/60 border border-white/10 text-white rounded-2xl text-center text-xs font-mono font-bold flex flex-col justify-center shadow-lg h-full justify-items-center">
                <span>{slot.label}</span>
              </div>

              {/* Day cells */}
              {DAYS.map(day => {
                // Find matching schedule
                const matchedCell = displayedCreneaux.find(
                  cr => cr.jour === day && cr.heureDebut === slot.start
                );

                if (matchedCell) {
                  const subject = matieres.find(m => m.id === matchedCell.matiereId);
                  const teacher = users.find(u => u.id === matchedCell.enseignantId);
                  const targetClass = classes.find(c => c.id === matchedCell.classeId);

                  return (
                    <div 
                      key={day} 
                      className="backdrop-blur-md bg-white/10 text-white p-3 rounded-2xl border border-white/20 flex flex-col justify-between items-center text-center relative group shadow-md hover:bg-white/15 hover:shadow-lg transition-all h-full cursor-pointer justify-items-center"
                    >
                      <div className="text-center">
                        <div className="font-extrabold text-xs text-white">{subject?.nom || 'Matière'}</div>
                        <div className="text-[10px] text-slate-300">Coef: {subject?.coefficient}</div>
                        <div className="text-[10px] text-orange-300 font-bold">Prof: {teacher?.nom}</div>
                        <div className="text-[9px] text-teal-300 uppercase font-bold tracking-wider">{matchedCell.salle || 'Salle NC'}</div>
                        {currentUser?.role === 'enseignant' && (
                          <div className="text-[10px] bg-white/10 text-slate-200 mt-1 font-mono font-bold rounded-lg px-2 py-0.5 border border-white/10">{targetClass?.nom}</div>
                        )}
                      </div>

                      {/* Delete option for creators */}
                      {isEligibleToSchedule && (
                        <button
                          onClick={() => deleteCreneau(matchedCell.id)}
                          className="absolute top-1.5 right-1.5 text-rose-400 hover:text-rose-350 p-1 rounded-lg bg-black/60 border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                          title="Supprimer ce cours"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  );
                }

                // Empty empty slot indicators
                return (
                  <div 
                    key={day} 
                    className="border border-dashed border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5 rounded-2xl h-full min-h-[60px] flex items-center justify-center text-[10px] text-slate-500 hover:text-orange-400 font-bold transition-all cursor-pointer"
                    title="Aucun cours planifié"
                  >
                    Libre
                  </div>
                );
              })}

            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
