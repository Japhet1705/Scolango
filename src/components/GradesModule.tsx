import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppState } from '../stateContext';
import { TypeNote } from '../types';
import {
  Award, ClipboardList, TrendingUp, Trash2, BarChart2,
  ListOrdered, AlertTriangle, CheckCircle, ChevronDown, Lock
} from 'lucide-react';

// ─── Types de notes disponibles selon le cahier des charges ──────────────────
const TYPE_NOTES: { id: TypeNote; label: string; short: string; unique: boolean }[] = [
  { id: 'interro1',    label: 'Interrogation 1',            short: 'I1',   unique: true  },
  { id: 'interro2',    label: 'Interrogation 2',            short: 'I2',   unique: true  },
  { id: 'devoir',      label: 'Devoir',                     short: 'DV',   unique: false },
  { id: 'composition', label: 'Composition trimestrielle',  short: 'COMP', unique: true  },
];

type SubTab = 'saisie' | 'moyennes' | 'classement' | 'annuel';

export const GradesModule: React.FC = () => {
  const {
    currentUser, eleves, classes, matieres, notes,
    addNote, deleteNote, deleteNotesByFilter,
    examens, getMoyenneEleve, getMoyenneAnnuelle,
    getClassements, getRangParMatiere, parametres,
    updateEleve,
  } = useAppState();

  const [subTab, setSubTab] = useState<SubTab>('saisie');

  // ── Sélecteurs ─────────────────────────────────────────────────────────────
  const [selectedClass,   setSelectedClass]   = useState(classes[0]?.id ?? '');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [selectedExam,    setSelectedExam]    = useState(examens[0]?.id ?? '');

  const isTeacher = currentUser?.role === 'enseignant';
  const canGrade  = ['admin', 'directeur', 'secretaire', 'enseignant', 'censeur'].includes(currentUser?.role ?? '');

  // Matières filtrées par classe (+ filtre enseignant si rôle teacher)
  const classMatieres = useMemo(() => {
    const base = matieres.filter(m => m.classeId === selectedClass);
    return isTeacher ? base.filter(m => m.enseignantId === currentUser?.id) : base;
  }, [matieres, selectedClass, isTeacher, currentUser?.id]);

  // Sync matière sélectionnée quand la classe change
  useEffect(() => {
    if (classMatieres.length > 0 && !classMatieres.some(m => m.id === selectedMatiere)) {
      setSelectedMatiere(classMatieres[0].id);
    }
  }, [classMatieres, selectedMatiere]);

  // Élèves actifs dans la classe
  const classStudents = useMemo(() =>
    eleves.filter(e => e.classeId === selectedClass && (e.statut ?? 'actif') === 'actif'),
    [eleves, selectedClass]
  );

  // Vérifier verrouillage date limite
  const isLocked = useMemo(() => {
    const limite = parametres?.dateLimiteSaisie;
    if (!limite) return false;
    return new Date().toISOString().split('T')[0] > limite;
  }, [parametres]);

  // ── Grille de saisie multi-colonnes ──────────────────────────────────────
  // tempGrades[eleveId][typeNote] = valeur string
  const [tempGrades, setTempGrades] = useState<Record<string, Record<string, string>>>({});
  const [submitErr,  setSubmitErr]  = useState('');
  const [submitOk,   setSubmitOk]   = useState('');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleGradeChange = (eleveId: string, type: TypeNote, val: string) => {
    const num = parseFloat(val);
    if (val !== '' && !isNaN(num) && (num < 0 || num > 20)) return;
    setTempGrades(prev => ({
      ...prev,
      [eleveId]: { ...(prev[eleveId] ?? {}), [type]: val },
    }));
  };

  // Navigation clavier : Enter → ligne suivante, Tab → colonne suivante
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    eleveId: string, typeIdx: number, eleveIdx: number
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextEleveId = classStudents[eleveIdx + 1]?.id;
      if (nextEleveId) {
        const key = `${nextEleveId}_${TYPE_NOTES[typeIdx].id}`;
        inputRefs.current[key]?.focus();
      }
    }
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErr(''); setSubmitOk('');
    if (!selectedMatiere) { setSubmitErr('Sélectionnez une matière.'); return; }

    const allEntries: { eleveId: string; type: TypeNote; val: number }[] = [];
    Object.entries(tempGrades).forEach(([eleveId, types]) => {
      Object.entries(types).forEach(([type, val]) => {
        const num = parseFloat(val);
        if (val !== '' && !isNaN(num)) allEntries.push({ eleveId, type: type as TypeNote, val: num });
      });
    });

    if (!allEntries.length) { setSubmitErr('Aucune note saisie.'); return; }

    const errors: string[] = [];
    let saved = 0;
    allEntries.forEach(({ eleveId, type, val }) => {
      const r = addNote({
        eleveId, matiereId: selectedMatiere, classeId: selectedClass,
        examenId: selectedExam, type, valeur: val,
        dateSaisie: new Date().toISOString().split('T')[0],
      });
      if (r.success) saved++;
      else { const st = eleves.find(x => x.id === eleveId); errors.push(`${st?.nom ?? eleveId}: ${r.error}`); }
    });

    setTempGrades({});
    if (errors.length) setSubmitErr(errors.slice(0, 3).join(' · ') + (errors.length > 3 ? ` +${errors.length-3}` : ''));
    if (saved)         { setSubmitOk(`✓ ${saved} note(s) enregistrée(s).`); setTimeout(() => setSubmitOk(''), 4000); }
  };

  // ── Suppression en lot ─────────────────────────────────────────────────────
  const [deleteFilter, setDeleteFilter] = useState({ matiereId: '', examenId: '', type: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleDeleteBatch = () => {
    const count = notes.filter(n => {
      if (n.classeId !== selectedClass) return false;
      if (deleteFilter.matiereId && n.matiereId !== deleteFilter.matiereId) return false;
      if (deleteFilter.examenId  && n.examenId  !== deleteFilter.examenId)  return false;
      if (deleteFilter.type      && n.type      !== deleteFilter.type)      return false;
      return true;
    }).length;
    if (!count) { setSubmitErr('Aucune note ne correspond à ce filtre.'); return; }
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    deleteNotesByFilter({ classeId: selectedClass, ...deleteFilter });
    setDeleteConfirm(false);
    setSubmitOk(`✓ ${count} note(s) supprimée(s).`);
    setTimeout(() => setSubmitOk(''), 4000);
  };

  // ── Saisie discipline ─────────────────────────────────────────────────────
  const [discEleveId, setDiscEleveId] = useState('');
  const [discForm, setDiscForm] = useState({ heuresAbsence: 0, heuresRetard: 0, nbAvertissements: 0, nbBlames: 0 });
  const [discOk, setDiscOk] = useState('');

  const handleSaveDisc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discEleveId) return;
    updateEleve(discEleveId, discForm);
    const el = eleves.find(x => x.id === discEleveId);
    setDiscOk(`✓ Données disciplinaires mises à jour pour ${el?.prenom} ${el?.nom}.`);
    setTimeout(() => setDiscOk(''), 4000);
    setDiscEleveId('');
    setDiscForm({ heuresAbsence: 0, heuresRetard: 0, nbAvertissements: 0, nbBlames: 0 });
  };

  // ── Calculs tableau des moyennes ──────────────────────────────────────────
  const rankings = useMemo(() => getClassements(selectedClass, selectedExam), [selectedClass, selectedExam, notes]);

  const moyennesTable = useMemo(() => {
    return classStudents.map(st => {
      const res = getMoyenneEleve(st.id, selectedExam);
      return { st, ...res };
    }).sort((a, b) => b.moyenne - a.moyenne);
  }, [classStudents, selectedExam, notes]);

  const rangMatiereMap = useMemo(() => {
    if (!selectedMatiere) return {};
    return getRangParMatiere(selectedClass, selectedMatiere, selectedExam);
  }, [selectedClass, selectedMatiere, selectedExam, notes]);

  const annuelTable = useMemo(() => {
    return classStudents.map(st => ({
      st,
      moy: getMoyenneAnnuelle(st.id),
    })).sort((a, b) => b.moy - a.moy);
  }, [classStudents, notes, examens]);

  const getMention = (m: number) => {
    if (m >= 16) return { label: 'Très Bien',  color: 'text-emerald-400' };
    if (m >= 14) return { label: 'Bien',        color: 'text-blue-400'   };
    if (m >= 12) return { label: 'Assez Bien',  color: 'text-indigo-400' };
    if (m >= 10) return { label: 'Passable',    color: 'text-amber-400'  };
    return        { label: 'Insuffisant',       color: 'text-rose-400'   };
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-white/10 pb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <Award size={16} className="text-orange-400" />
            <span>Évaluations & Notes</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Saisie, moyennes, classements, discipline.</p>
        </div>
        {isLocked && (
          <div className="flex items-center space-x-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold px-3 py-1.5 rounded-xl">
            <Lock size={11} />
            <span>Saisie verrouillée (date limite dépassée)</span>
          </div>
        )}
      </div>

      {/* Sélecteurs globaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white/5 border border-white/10 rounded-2xl p-3">
        {[
          { label:'Classe', val:selectedClass, set:setSelectedClass,
            opts: classes.map(c => ({ v:c.id, l:c.nom })) },
          { label:'Matière', val:selectedMatiere, set:setSelectedMatiere,
            opts: classMatieres.map(m => ({ v:m.id, l:`${m.nom} (coef ${m.coefficient})` })) },
          { label:'Période', val:selectedExam, set:setSelectedExam,
            opts: examens.map(ex => ({ v:ex.id, l:ex.nom })) },
        ].map(s => (
          <div key={s.label} className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase">{s.label}</label>
            <select value={s.val} onChange={e => s.set(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
              {s.opts.map(o => <option key={o.v} value={o.v} className="bg-slate-900">{o.l}</option>)}
            </select>
          </div>
        ))}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 uppercase">Sous-module</label>
          <select value={subTab} onChange={e => setSubTab(e.target.value as SubTab)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
            <option value="saisie"     className="bg-slate-900">Saisie des notes</option>
            <option value="moyennes"   className="bg-slate-900">Liste des moyennes</option>
            <option value="classement" className="bg-slate-900">Classement de classe</option>
            <option value="annuel"     className="bg-slate-900">Moyenne annuelle</option>
          </select>
        </div>
      </div>

      {/* ════ SAISIE ════════════════════════════════════════════════════════════ */}
      {subTab === 'saisie' && (
        <div className="space-y-4">
          {/* Grille tableur multi-colonnes */}
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest flex items-center space-x-1.5">
                  <ClipboardList size={13} />
                  <span>Grille de Saisie — {classes.find(c=>c.id===selectedClass)?.nom}</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Naviguez avec <kbd className="bg-white/10 px-1 rounded text-[9px]">Entrée</kbd> pour descendre, <kbd className="bg-white/10 px-1 rounded text-[9px]">Tab</kbd> pour avancer.</p>
              </div>
              {!canGrade && (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">🔒 Lecture seule</span>
              )}
            </div>

            {classStudents.length === 0 ? (
              <div className="p-10 text-center text-slate-500 italic text-xs">Aucun élève actif dans cette classe.</div>
            ) : (
              <form onSubmit={handleBulkSubmit}>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-black/30 text-slate-400 text-left">
                        <th className="p-3 font-semibold w-24">Matr.</th>
                        <th className="p-3 font-semibold min-w-[140px]">Élève</th>
                        {/* Notes existantes */}
                        {TYPE_NOTES.map(t => (
                          <th key={`ex-${t.id}`} className="p-2 text-center font-semibold text-[10px] min-w-[70px]">
                            {t.short}<br/><span className="text-slate-600">existant</span>
                          </th>
                        ))}
                        {/* Colonnes de saisie — une par type */}
                        {canGrade && !isLocked && TYPE_NOTES.map(t => (
                          <th key={`new-${t.id}`} className="p-2 text-center font-semibold text-[10px] min-w-[72px] bg-orange-500/5 border-l border-orange-500/10">
                            <span className="text-orange-300">{t.short}</span><br/>
                            <span className="text-slate-600">saisir</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {classStudents.map((st, eleveIdx) => {
                        // Notes existantes de cet élève pour cette matière/période
                        const stNotes = notes.filter(n => n.eleveId === st.id && n.matiereId === selectedMatiere && n.examenId === selectedExam);
                        return (
                          <tr key={st.id} className={`hover:bg-white/3 transition-colors ${eleveIdx % 2 === 0 ? '' : 'bg-white/1'}`}>
                            <td className="p-2 font-mono text-slate-500 text-[10px]">{st.matricule}</td>
                            <td className="p-2 font-bold text-white">{st.nom} {st.prenom}</td>
                            {/* Notes existantes par type */}
                            {TYPE_NOTES.map(t => {
                              const existing = stNotes.filter(n => n.type === t.id);
                              return (
                                <td key={`ex-${t.id}`} className="p-1 text-center">
                                  {existing.length === 0 ? (
                                    <span className="text-slate-600 text-[10px]">—</span>
                                  ) : (
                                    <div className="flex flex-wrap gap-0.5 justify-center">
                                      {existing.map(n => (
                                        <span key={n.id} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${n.valeur >= 10 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                                          {n.valeur}
                                          {canGrade && (
                                            <button type="button" onClick={() => deleteNote(n.id)}
                                              className="text-slate-500 hover:text-rose-400 cursor-pointer leading-none">×</button>
                                          )}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                            {/* Inputs de saisie */}
                            {canGrade && !isLocked && TYPE_NOTES.map((t, typeIdx) => (
                              <td key={`new-${t.id}`} className="p-1 bg-orange-500/3 border-l border-orange-500/10">
                                <input
                                  ref={el => { inputRefs.current[`${st.id}_${t.id}`] = el; }}
                                  type="number" step="0.25" min="0" max="20"
                                  placeholder="—"
                                  value={tempGrades[st.id]?.[t.id] ?? ''}
                                  onChange={e => handleGradeChange(st.id, t.id, e.target.value)}
                                  onKeyDown={e => handleKeyDown(e, st.id, typeIdx, eleveIdx)}
                                  className="w-16 bg-white/5 border border-white/10 rounded-lg px-1 py-1 text-center font-mono text-xs text-white outline-none focus:ring-1 focus:ring-orange-500 focus:bg-orange-500/10"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {canGrade && !isLocked && (
                  <div className="p-4 border-t border-white/10 space-y-2">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 text-[10px] text-amber-300">
                      ⚠ I1, I2 et COMP : 1 seule note par élève/période (remplacement si existant) · DV : max 3 devoirs/période
                    </div>
                    {submitErr && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] p-2 rounded-xl" role="alert">⚠ {submitErr}</div>}
                    {submitOk  && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] p-2 rounded-xl">{submitOk}</div>}
                    <div className="flex justify-end">
                      <button type="submit"
                        className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-orange-500/20">
                        <ClipboardList size={13} />
                        <span>Enregistrer la session</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Saisie absences & sanctions disciplinaires */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
              <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest flex items-center space-x-1.5">
                <AlertTriangle size={13} />
                <span>Saisie Absences & Sanctions Disciplinaires</span>
              </h3>
              <p className="text-[10px] text-slate-400">Ces données sont injectées automatiquement en bas du bulletin officiel.</p>
              <form onSubmit={handleSaveDisc} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Élève</label>
                  <select value={discEleveId} onChange={e => {
                    setDiscEleveId(e.target.value);
                    const el = eleves.find(x => x.id === e.target.value);
                    if (el) setDiscForm({
                      heuresAbsence: el.heuresAbsence ?? 0, heuresRetard: el.heuresRetard ?? 0,
                      nbAvertissements: el.nbAvertissements ?? 0, nbBlames: el.nbBlames ?? 0,
                    });
                  }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
                    <option value="" className="bg-slate-900">— Sélectionner —</option>
                    {classStudents.map(el => <option key={el.id} value={el.id} className="bg-slate-900">{el.prenom} {el.nom}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Heures d\'absence', key: 'heuresAbsence' },
                    { label: 'Heures de retard',  key: 'heuresRetard'  },
                    { label: 'Avertissements',     key: 'nbAvertissements' },
                    { label: 'Blâmes',             key: 'nbBlames'     },
                  ].map(f => (
                    <div key={f.key} className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400">{f.label}</label>
                      <input type="number" min={0} value={(discForm as any)[f.key]}
                        onChange={e => setDiscForm(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none focus:ring-1 focus:ring-orange-500" />
                    </div>
                  ))}
                </div>
                {discOk && <div className="text-emerald-400 text-[11px]">{discOk}</div>}
                <button type="submit" disabled={!discEleveId}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold text-xs py-2 rounded-xl cursor-pointer">
                  Enregistrer
                </button>
              </form>
            </div>

            {/* Suppression en lot */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4">
              <h3 className="text-[11px] font-bold text-rose-400 uppercase tracking-widest flex items-center space-x-1.5">
                <Trash2 size={13} />
                <span>Suppression de Notes en Lot</span>
              </h3>
              <p className="text-[10px] text-slate-400">Vider intégralement les notes d'une évaluation précise en cas d'erreur massive de saisie.</p>
              <div className="space-y-3">
                {[
                  { label:'Matière', val:deleteFilter.matiereId, set:(v:string) => setDeleteFilter(p=>({...p,matiereId:v})),
                    opts:[{v:'',l:'Toutes les matières'}, ...classMatieres.map(m=>({v:m.id,l:m.nom}))] },
                  { label:'Période', val:deleteFilter.examenId, set:(v:string) => setDeleteFilter(p=>({...p,examenId:v})),
                    opts:[{v:'',l:'Toutes les périodes'}, ...examens.map(ex=>({v:ex.id,l:ex.nom}))] },
                  { label:'Type de note', val:deleteFilter.type, set:(v:string) => setDeleteFilter(p=>({...p,type:v})),
                    opts:[{v:'',l:'Tous les types'}, ...TYPE_NOTES.map(t=>({v:t.id,l:t.label}))] },
                ].map(s => (
                  <div key={s.label} className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">{s.label}</label>
                    <select value={s.val} onChange={e => s.set(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none">
                      {s.opts.map(o => <option key={o.v} value={o.v} className="bg-slate-900">{o.l}</option>)}
                    </select>
                  </div>
                ))}
                {submitErr && <div className="text-rose-400 text-[11px]">{submitErr}</div>}
                {submitOk  && <div className="text-emerald-400 text-[11px]">{submitOk}</div>}
                {deleteConfirm && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-[10px] text-rose-300 font-medium">
                    ⚠ Confirmez-vous la suppression irréversible de ces notes ?
                  </div>
                )}
                <button type="button" onClick={handleDeleteBatch}
                  className={`w-full font-bold text-xs py-2 rounded-xl cursor-pointer flex items-center justify-center space-x-1.5 ${
                    deleteConfirm ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                  }`}>
                  <Trash2 size={12} />
                  <span>{deleteConfirm ? 'Confirmer la suppression' : 'Supprimer les notes filtrées'}</span>
                </button>
                {deleteConfirm && (
                  <button type="button" onClick={() => setDeleteConfirm(false)}
                    className="w-full text-[10px] text-slate-400 hover:text-white cursor-pointer">Annuler</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ LISTE DES MOYENNES ════════════════════════════════════════════════ */}
      {subTab === 'moyennes' && (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest flex items-center space-x-1.5">
              <BarChart2 size={13} />
              <span>Moyennes par Matière — {classes.find(c=>c.id===selectedClass)?.nom} · {examens.find(e=>e.id===selectedExam)?.nom}</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-black/30 text-slate-400 text-left">
                  <th className="p-3 font-semibold">Élève</th>
                  <th className="p-3 text-center font-semibold">Moy. gén.</th>
                  {classMatieres.map(m => (
                    <th key={m.id} className="p-2 text-center font-semibold text-[10px] min-w-[70px]">
                      {m.nom}<br/><span className="text-slate-600">coef {m.coefficient}</span>
                    </th>
                  ))}
                  <th className="p-3 text-center font-semibold">Mention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {moyennesTable.map(({ st, moyenne, details }, idx) => {
                  const { label, color } = getMention(moyenne);
                  return (
                    <tr key={st.id} className="hover:bg-white/3">
                      <td className="p-3">
                        <div className="font-bold text-white">{st.nom} {st.prenom}</div>
                        <div className="text-[9px] text-slate-500 font-mono">{st.matricule}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-bold font-mono text-sm ${moyenne >= 10 ? 'text-emerald-400' : 'text-rose-400'}`}>{moyenne}</span>
                        <div className="text-[9px] text-slate-500">rang {idx + 1}</div>
                      </td>
                      {classMatieres.map(m => {
                        const det = details.find(d => d.mNom === m.nom);
                        const rang = rangMatiereMap[st.id];
                        return (
                          <td key={m.id} className="p-2 text-center">
                            {det && det.notesVal.length > 0 ? (
                              <div>
                                <span className={`font-mono font-bold text-[11px] ${det.moyMatiere >= 10 ? 'text-emerald-400' : 'text-rose-400'}`}>{det.moyMatiere}</span>
                                <div className="text-[8px] text-slate-600">{det.notesVal.join('/')}</div>
                                {rang && m.id === selectedMatiere && (
                                  <div className="text-[8px] text-orange-400 font-mono">rang {rang}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600 text-[10px]">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-bold ${color}`}>{label}</span>
                      </td>
                    </tr>
                  );
                })}
                {moyennesTable.length === 0 && (
                  <tr><td colSpan={classMatieres.length + 3} className="py-10 text-center text-slate-500 italic">Aucune note saisie pour cette période.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════ CLASSEMENT ════════════════════════════════════════════════════════ */}
      {subTab === 'classement' && (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest flex items-center space-x-1.5">
              <ListOrdered size={13} />
              <span>Tableau d'Honneur — {classes.find(c=>c.id===selectedClass)?.nom} · {examens.find(e=>e.id===selectedExam)?.nom}</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-black/30 text-slate-400 text-left">
                  <th className="p-3 font-semibold w-16 text-center">Rang</th>
                  <th className="p-3 font-semibold">Élève</th>
                  <th className="p-3 text-center font-semibold">Sexe</th>
                  <th className="p-3 text-center font-semibold">Moyenne</th>
                  <th className="p-3 text-center font-semibold">Mention</th>
                  <th className="p-3 text-center font-semibold">Abs. (h)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rankings.map((rk, idx) => {
                  const el = eleves.find(e => e.id === rk.eleveId);
                  const { label, color } = getMention(rk.moyenne);
                  const rankStyle = idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : idx === 1 ? 'bg-slate-500/20 text-slate-300 border border-slate-500/20'
                    : idx === 2 ? 'bg-orange-700/20 text-orange-300 border border-orange-700/20'
                    : 'bg-white/5 text-slate-400 border border-white/10';
                  return (
                    <tr key={rk.eleveId} className={`hover:bg-white/3 ${idx < 3 ? 'bg-white/2' : ''}`}>
                      <td className="p-3 text-center">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] mx-auto ${rankStyle}`}>
                          {rk.rang}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white">{rk.nomComplet}</td>
                      <td className="p-3 text-center font-mono text-slate-400">{el?.sexe ?? '—'}</td>
                      <td className="p-3 text-center font-bold font-mono text-lg">
                        <span className={rk.moyenne >= 10 ? 'text-emerald-400' : 'text-rose-400'}>{rk.moyenne}</span>
                        <span className="text-slate-600 text-[10px]">/20</span>
                      </td>
                      <td className="p-3 text-center"><span className={`font-bold text-[11px] ${color}`}>{label}</span></td>
                      <td className="p-3 text-center font-mono text-slate-400">{el?.heuresAbsence ?? 0}h</td>
                    </tr>
                  );
                })}
                {rankings.length === 0 && (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-500 italic">Aucune note disponible pour calculer le classement.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════ MOYENNE ANNUELLE ══════════════════════════════════════════════════ */}
      {subTab === 'annuel' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest flex items-center space-x-1.5">
                <TrendingUp size={13} />
                <span>Moyennes Annuelles — {classes.find(c=>c.id===selectedClass)?.nom}</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Calculé sur {examens.length} période(s) : {examens.map(e => e.nom).join(', ')}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-black/30 text-slate-400 text-left">
                    <th className="p-3 font-semibold w-12 text-center">Rang</th>
                    <th className="p-3 font-semibold">Élève</th>
                    {examens.map(ex => <th key={ex.id} className="p-3 text-center font-semibold text-[10px]">{ex.nom}</th>)}
                    <th className="p-3 text-center font-semibold">Moy. annuelle</th>
                    <th className="p-3 text-center font-semibold">Décision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {annuelTable.map(({ st, moy }, idx) => {
                    const decision = moy >= 10 ? { label:'Admis', color:'text-emerald-400' }
                      : moy >= 7 ? { label:'Redoublant', color:'text-amber-400' }
                      : { label:'Exclu', color:'text-rose-400' };
                    return (
                      <tr key={st.id} className="hover:bg-white/3">
                        <td className="p-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                        <td className="p-3 font-bold text-white">{st.nom} {st.prenom}</td>
                        {examens.map(ex => {
                          const m = getMoyenneEleve(st.id, ex.id).moyenne;
                          return (
                            <td key={ex.id} className="p-3 text-center font-mono">
                              <span className={m > 0 ? (m >= 10 ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-600'}>
                                {m > 0 ? m : '—'}
                              </span>
                            </td>
                          );
                        })}
                        <td className="p-3 text-center">
                          <span className={`font-bold text-sm font-mono ${moy >= 10 ? 'text-emerald-400' : moy >= 7 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {moy > 0 ? moy : '—'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-[10px] font-bold ${decision.color}`}>{moy > 0 ? decision.label : '—'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 text-[10px] text-blue-300">
            Règles de passage : Admis ≥ 10/20 · Redoublant entre 7 et 9.99 · Exclu &lt; 7/20
          </div>
        </div>
      )}
    </div>
  );
};
