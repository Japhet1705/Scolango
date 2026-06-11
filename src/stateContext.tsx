import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User, Classe, Matiere, Eleve, Note, Examen, Presence,
  CreneauHoraire, AnneeScolaire, ParametresEcole, AuditLog,
  Role, FraisScolaires, Paiement, SyncQueueItem, MoyenneResult, ClassementItem, Cycle
} from './types';
import {
  initialUsers, initialClasses, initialMatieres, initialEleves,
  initialNotes, initialExamens, initialPresences, initialCreneaux,
  initialAnnees, initialParametres, initialAuditLogs,
  initialFraisScolaires, initialPaiements, initialCycles
} from './initialData';
import { api } from './lib/api';

// ─── Context interface ───────────────────────────────────────────────────────
interface StateContextProps {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => { success: boolean; error?: string };
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  classes: Classe[];
  addClasse: (classe: Omit<Classe, 'id'>) => void;
  updateClasse: (id: string, updates: Partial<Classe>) => void;
  cycles: Cycle[];
  addCycle: (cycle: Omit<Cycle, 'id'>) => void;
  updateCycle: (id: string, updates: Partial<Cycle>) => void;
  deleteCycle: (id: string) => void;
  deleteClasse: (id: string) => void;
  matieres: Matiere[];
  addMatiere: (matiere: Omit<Matiere, 'id'>) => void;
  updateMatiere: (id: string, updates: Partial<Matiere>) => void;
  deleteMatiere: (id: string) => void;
  eleves: Eleve[];
  addEleve: (eleve: Omit<Eleve, 'id' | 'matricule'>) => void;
  updateEleve: (id: string, updates: Partial<Eleve>) => void;
  changeEleveClasse: (id: string, newClasseId: string) => void;
  deleteEleve: (id: string) => void;
  notes: Note[];
  addNote: (note: Omit<Note, 'id'>) => { success: boolean; error?: string };
  updateNote: (id: string, newVal: number) => void;
  deleteNote: (id: string) => void;
  deleteNotesByFilter: (filter: { classeId?: string; matiereId?: string; examenId?: string; type?: string }) => void;
  examens: Examen[];
  addExamen: (exam: Omit<Examen, 'id'>) => void;
  toggleExamenActif: (id: string) => void;
  presences: Presence[];
  enregistrerAppel: (appelData: { eleveId: string; status: StatutPresenceInput; motif?: string; date: string; classeId: string }[]) => void;
  creneaux: CreneauHoraire[];
  addCreneau: (creneau: Omit<CreneauHoraire, 'id'>) => { success: boolean; error?: string };
  deleteCreneau: (id: string) => void;
  annees: AnneeScolaire[];
  addAnneeScolaire: (libelle: string) => void;
  setAnneeActive: (id: string) => void;
  parametres: ParametresEcole;
  updateParametres: (updates: Partial<ParametresEcole>) => void;
  auditLogs: AuditLog[];
  logAction: (action: string, details: string) => void;
  clearLogs: () => void;
  fraisScolaires: FraisScolaires[];
  updateFraisScolaires: (fsData: { classeId: string; montantScolarite: number; montantInscription: number }) => void;
  paiements: Paiement[];
  addPaiement: (paiement: Omit<Paiement, 'id' | 'recuNumero'>) => void;
  deletePaiement: (id: string) => void;
  offlineMode: boolean;
  setOfflineMode: (offline: boolean) => void;
  syncQueue: SyncQueueItem[];
  triggerManualSync: () => void;
  // Helpers de calcul
  getMoyenneEleve: (eleveId: string, examId: string) => MoyenneResult;
  getMoyenneAnnuelle: (eleveId: string) => number;
  getClassements: (classeId: string, examId: string) => ClassementItem[];
  getRangParMatiere: (classeId: string, matiereId: string, examId: string) => Record<string, number>;
  // Helper pour récupérer les classes d'un enseignant dynamiquement
  getClassesEnseignant: (enseignantId: string) => Classe[];
  // Helpers comptabilité
  getSoldeEleve: (eleveId: string) => { totalDu: number; totalPaye: number; reste: number; statut: 'solde' | 'partiel' | 'non_paye' };
  getManqueGlobal: () => { total: number; parClasse: { classeId: string; manque: number }[] };
  // Clôture d'année scolaire complète
  executerClotureAnnee: (nouvelleAnneeLibelle: string) => { admis: number; redoublants: number; exclus: number; total: number };
}

type StatutPresenceInput = 'present' | 'absent' | 'retard';

// ─── localStorage keys ───────────────────────────────────────────────────────
const LS = {
  currentUser:     'scolango_current_user',
  users:           'scolango_users',
  classes:         'scolango_classes',
  matieres:        'scolango_matieres',
  eleves:          'scolango_eleves',
  notes:           'scolango_notes',
  examens:         'scolango_examens',
  presences:       'scolango_presences',
  creneaux:        'scolango_creneaux',
  annees:          'scolango_annees',
  parametres:      'scolango_parametres',
  auditLogs:       'scolango_audit_logs',
  fraisScolaires:  'scolango_frais_scolaires',
  paiements:       'scolango_paiements',
  syncQueue:       'scolango_sync_queue',
  cycles:          'scolango_cycles',
  recuCounter:     'scolango_recu_counter',
  eleveCounter:    'scolango_eleve_counter',
} as const;

function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ─── Context creation ────────────────────────────────────────────────────────
const StateContext = createContext<StateContextProps | undefined>(undefined);

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [currentUser, _setCurrentUser] = useState<User | null>(() =>
    loadLS(LS.currentUser, null)
  );
  const [users, setUsers] = useState<User[]>(() =>
    loadLS(LS.users, initialUsers)
  );
  const [cycles, setCycles] = useState<Cycle[]>(() =>
    loadLS(LS.cycles, initialCycles)
  );
  const [classes, setClasses] = useState<Classe[]>(() =>
    loadLS(LS.classes, initialClasses)
  );
  const [matieres, setMatieres] = useState<Matiere[]>(() =>
    loadLS(LS.matieres, initialMatieres)
  );
  const [eleves, setEleves] = useState<Eleve[]>(() =>
    loadLS(LS.eleves, initialEleves)
  );
  const [notes, setNotes] = useState<Note[]>(() =>
    loadLS(LS.notes, initialNotes)
  );
  const [examens, setExamens] = useState<Examen[]>(() =>
    loadLS(LS.examens, initialExamens)
  );
  const [presences, setPresences] = useState<Presence[]>(() =>
    loadLS(LS.presences, initialPresences)
  );
  const [creneaux, setCreneaux] = useState<CreneauHoraire[]>(() =>
    loadLS(LS.creneaux, initialCreneaux)
  );
  const [annees, setAnnees] = useState<AnneeScolaire[]>(() =>
    loadLS(LS.annees, initialAnnees)
  );
  const [parametres, setParametres] = useState<ParametresEcole>(() =>
    loadLS(LS.parametres, initialParametres)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadLS(LS.auditLogs, initialAuditLogs)
  );
  const [fraisScolaires, setFraisScolaires] = useState<FraisScolaires[]>(() =>
    loadLS(LS.fraisScolaires, initialFraisScolaires)
  );
  const [paiements, setPaiements] = useState<Paiement[]>(() =>
    loadLS(LS.paiements, initialPaiements)
  );
  const [offlineMode, setOfflineModeState] = useState(false);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() =>
    loadLS(LS.syncQueue, [])
  );
  // Compteurs persistants pour numéros uniques (résistent aux suppressions)
  const [recuCounter, setRecuCounter] = useState<number>(() =>
    loadLS<number>(LS.recuCounter, 0)
  );
  const [eleveCounter, setEleveCounter] = useState<number>(() =>
    loadLS<number>(LS.eleveCounter, 0)
  );

  // ─── Persist to localStorage ──────────────────────────────────────────────
  useEffect(() => { localStorage.setItem(LS.currentUser,    JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem(LS.users,          JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem(LS.cycles,         JSON.stringify(cycles)); }, [cycles]);
  useEffect(() => { localStorage.setItem(LS.classes,        JSON.stringify(classes)); }, [classes]);
  useEffect(() => { localStorage.setItem(LS.matieres,       JSON.stringify(matieres)); }, [matieres]);
  useEffect(() => { localStorage.setItem(LS.eleves,         JSON.stringify(eleves)); }, [eleves]);
  useEffect(() => { localStorage.setItem(LS.notes,          JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem(LS.examens,        JSON.stringify(examens)); }, [examens]);
  useEffect(() => { localStorage.setItem(LS.presences,      JSON.stringify(presences)); }, [presences]);
  useEffect(() => { localStorage.setItem(LS.creneaux,       JSON.stringify(creneaux)); }, [creneaux]);
  useEffect(() => { localStorage.setItem(LS.annees,         JSON.stringify(annees)); }, [annees]);
  useEffect(() => { localStorage.setItem(LS.parametres,     JSON.stringify(parametres)); }, [parametres]);
  useEffect(() => { localStorage.setItem(LS.auditLogs,      JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem(LS.fraisScolaires, JSON.stringify(fraisScolaires)); }, [fraisScolaires]);
  useEffect(() => { localStorage.setItem(LS.paiements,      JSON.stringify(paiements)); }, [paiements]);
  useEffect(() => { localStorage.setItem(LS.syncQueue,      JSON.stringify(syncQueue)); }, [syncQueue]);
  useEffect(() => { localStorage.setItem(LS.recuCounter,    JSON.stringify(recuCounter)); }, [recuCounter]);
  useEffect(() => { localStorage.setItem(LS.eleveCounter,   JSON.stringify(eleveCounter)); }, [eleveCounter]);

  useEffect(() => {
    const token = localStorage.getItem('scolango_jwt');
    if (!token) return;

    let cancelled = false;
    api.get<User>('/api/auth/me')
      .then((user) => {
        if (!cancelled) _setCurrentUser(user);
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem('scolango_jwt');
          _setCurrentUser(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const setCurrentUser = (user: User | null) => {
    _setCurrentUser(user);
  };

  // ─── Offline / Sync ───────────────────────────────────────────────────────
  const currentUserName = currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Système';
  const currentUserRole: Role = currentUser?.role ?? 'admin';

  const logAction = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      utilisateurNom: currentUserName,
      role: currentUserRole,
      action,
      details,
    };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 200));
  };

  const queueOfflineAction = (action: SyncQueueItem['action'], path: string, data: unknown) => {
    const item: SyncQueueItem = { action, path, data, timestamp: new Date().toISOString() };
    setSyncQueue(prev => [...prev, item]);
  };

  const triggerManualSync = () => {
    if (offlineMode) return;
    logAction('Synchronisation', `Envoi de ${syncQueue.length} opérations hors-ligne.`);
    setSyncQueue([]);
  };

  const setOfflineMode = (offline: boolean) => {
    setOfflineModeState(offline);
    if (!offline && syncQueue.length > 0) triggerManualSync();
  };

  const clearLogs = () => setAuditLogs([]);

  // ─── Users CRUD ───────────────────────────────────────────────────────────
  const addUser = (userData: Omit<User, 'id'>): { success: boolean; error?: string } => {
    // Vérification unicité email (insensible à la casse)
    const emailLower = userData.email.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === emailLower)) {
      return { success: false, error: `Un compte avec l'email "${userData.email}" existe déjà.` };
    }
    const id = `user-${Date.now()}`;
    const newUser: User = { ...userData, id, email: userData.email.trim().toLowerCase() };
    if (offlineMode) queueOfflineAction('ADD', 'users', newUser);
    setUsers(prev => [...prev, newUser]);
    logAction('Création Utilisateur', `Compte ${userData.prenom} ${userData.nom} (${userData.role}) créé.`);
    return { success: true };
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    if (offlineMode) queueOfflineAction('UPDATE', `users/${id}`, updates);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    const target = users.find(u => u.id === id);
    logAction('Mise à jour Utilisateur', `Modification de ${target?.prenom} ${target?.nom}.`);
  };

  const deleteUser = (id: string) => {
    if (offlineMode) queueOfflineAction('DELETE', `users/${id}`, null);
    const target = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    logAction('Suppression Utilisateur', `Suppression de ${target?.prenom} ${target?.nom}.`);
  };

  // ─── Cycles CRUD ──────────────────────────────────────────────────────────
  const addCycle = (cycleData: Omit<Cycle, 'id'>) => {
    const id = `cycle-${Date.now()}`;
    setCycles((prev: Cycle[]) => [...prev, { ...cycleData, id }]);
    logAction('Création Cycle', `Cycle "${cycleData.libelle}" créé.`);
  };

  const updateCycle = (id: string, updates: Partial<Cycle>) => {
    setCycles((prev: Cycle[]) => prev.map((c: Cycle) => c.id === id ? { ...c, ...updates } : c));
    const target = cycles.find(c => c.id === id);
    logAction('Mise à jour Cycle', `Cycle "${target?.libelle}" modifié.`);
  };

  const deleteCycle = (id: string) => {
    const target = cycles.find((c: Cycle) => c.id === id);
    setCycles((prev: Cycle[]) => prev.filter((c: Cycle) => c.id !== id));
    logAction('Suppression Cycle', `Cycle "${target?.libelle}" supprimé.`);
  };

  // ─── Classes CRUD ─────────────────────────────────────────────────────────
  const addClasse = (classData: Omit<Classe, 'id'>) => {
    const id = `classe-${Date.now()}`;
    const newClasse: Classe = { ...classData, id };
    if (offlineMode) queueOfflineAction('ADD', 'classes', newClasse);
    setClasses(prev => [...prev, newClasse]);
    logAction('Création Classe', `Classe ${classData.nom} (${classData.niveau}) créée.`);
  };

  const updateClasse = (id: string, updates: Partial<Classe>) => {
    if (offlineMode) queueOfflineAction('UPDATE', `classes/${id}`, updates);
    setClasses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    const target = classes.find(c => c.id === id);
    logAction('Mise à jour Classe', `Modification de la classe ${target?.nom}.`);
  };

  const deleteClasse = (id: string) => {
    if (offlineMode) queueOfflineAction('DELETE', `classes/${id}`, null);
    const target = classes.find(c => c.id === id);
    setClasses(prev => prev.filter(c => c.id !== id));
    logAction('Suppression Classe', `Suppression de la classe ${target?.nom}.`);
  };

  // ─── Matieres CRUD ────────────────────────────────────────────────────────
  const addMatiere = (matiereData: Omit<Matiere, 'id'>) => {
    const id = `mat-${Date.now()}`;
    const newMatiere: Matiere = { ...matiereData, id };
    if (offlineMode) queueOfflineAction('ADD', 'matieres', newMatiere);
    setMatieres(prev => [...prev, newMatiere]);
    logAction('Création Matière', `Matière ${matiereData.nom} (coef ${matiereData.coefficient}) ajoutée.`);
  };

  const updateMatiere = (id: string, updates: Partial<Matiere>) => {
    if (offlineMode) queueOfflineAction('UPDATE', `matieres/${id}`, updates);
    setMatieres(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    const target = matieres.find(m => m.id === id);
    logAction('Mise à jour Matière', `Modification de la matière ${target?.nom}.`);
  };

  const deleteMatiere = (id: string) => {
    if (offlineMode) queueOfflineAction('DELETE', `matieres/${id}`, null);
    const target = matieres.find(m => m.id === id);
    setMatieres(prev => prev.filter(m => m.id !== id));
    logAction('Suppression Matière', `Suppression de la matière ${target?.nom}.`);
  };

  // ─── Eleves CRUD ──────────────────────────────────────────────────────────
  const addEleve = (eleveData: Omit<Eleve, 'id' | 'matricule'>) => {
    const id = `eleve-${Date.now()}`;
    const year = new Date().getFullYear().toString().slice(-2);
    const nextCount = eleveCounter + 1;
    setEleveCounter(nextCount);
    const matricule = `MAT-${year}-${nextCount.toString().padStart(3, '0')}`;
    const newEleve: Eleve = { ...eleveData, id, matricule };
    if (offlineMode) queueOfflineAction('ADD', 'eleves', newEleve);
    setEleves(prev => [...prev, newEleve]);
    logAction('Inscription Élève', `Inscription de ${eleveData.prenom} ${eleveData.nom} — ${matricule}.`);
  };

  const updateEleve = (id: string, updates: Partial<Eleve>) => {
    if (offlineMode) queueOfflineAction('UPDATE', `eleves/${id}`, updates);
    setEleves(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    const target = eleves.find(e => e.id === id);
    logAction('Mise à jour Élève', `Modification de la fiche de ${target?.prenom} ${target?.nom}.`);
  };

  const changeEleveClasse = (id: string, newClasseId: string) => {
    setEleves(prev => prev.map(e => e.id === id ? { ...e, classeId: newClasseId } : e));
    const student = eleves.find(e => e.id === id);
    const cls = classes.find(c => c.id === newClasseId);
    logAction('Transfert Élève', `${student?.prenom} ${student?.nom} transféré vers ${cls?.nom}.`);
  };

  const deleteEleve = (id: string) => {
    if (offlineMode) queueOfflineAction('DELETE', `eleves/${id}`, null);
    const target = eleves.find(e => e.id === id);
    setEleves(prev => prev.filter(e => e.id !== id));
    logAction('Désinscription Élève', `Suppression de l'élève ${target?.prenom} ${target?.nom}.`);
  };

  // ─── Notes CRUD ───────────────────────────────────────────────────────────
  // Règles métier :
  //  • composition / examen : max 1 par (élève, matière, examen) → remplace si existant
  //  • devoir / tp          : max 3 par (élève, matière, examen) → bloque au-delà
  const addNote = (noteData: Omit<Note, 'id'>): { success: boolean; error?: string } => {
    const isUnique = noteData.type === 'composition' || noteData.type === 'examen';
    const existing = notes.filter(
      n => n.eleveId === noteData.eleveId
        && n.matiereId === noteData.matiereId
        && n.examenId === noteData.examenId
        && n.type === noteData.type
    );

    if (isUnique && existing.length > 0) {
      // Remplacer silencieusement — une seule composition par période
      const id = existing[0].id;
      setNotes(prev => prev.map(n => n.id === id ? { ...n, valeur: noteData.valeur } : n));
      const s = eleves.find(el => el.id === noteData.eleveId);
      const m = matieres.find(mat => mat.id === noteData.matiereId);
      logAction('Remplacement Note', `${noteData.type} de ${s?.prenom} ${s?.nom} en ${m?.nom} mise à jour : ${noteData.valeur}/20.`);
      return { success: true };
    }

    if (!isUnique && existing.length >= 3) {
      return { success: false, error: `Maximum 3 ${noteData.type}s par période pour cette matière. Supprimez une note existante avant d'en ajouter une nouvelle.` };
    }

    const id = `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newNote: Note = { ...noteData, id };
    if (offlineMode) queueOfflineAction('ADD', 'notes', newNote);
    setNotes(prev => [...prev, newNote]);
    const s = eleves.find(el => el.id === noteData.eleveId);
    const m = matieres.find(mat => mat.id === noteData.matiereId);
    logAction('Saisie Note', `${noteData.valeur}/20 (${noteData.type}) en ${m?.nom} pour ${s?.prenom} ${s?.nom}.`);
    return { success: true };
  };

  const updateNote = (id: string, newVal: number) => {
    if (offlineMode) queueOfflineAction('UPDATE', `notes/${id}`, { valeur: newVal });
    setNotes(prev => prev.map(n => n.id === id ? { ...n, valeur: newVal } : n));
    const note = notes.find(n => n.id === id);
    const s = eleves.find(el => el.id === note?.eleveId);
    logAction('Modification Note', `Note de ${s?.prenom} ${s?.nom} modifiée à ${newVal}/20.`);
  };

  const deleteNote = (id: string) => {
    if (offlineMode) queueOfflineAction('DELETE', `notes/${id}`, null);
    const note = notes.find(n => n.id === id);
    const s = eleves.find(el => el.id === note?.eleveId);
    setNotes(prev => prev.filter(n => n.id !== id));
    logAction('Suppression Note', `Note de ${s?.prenom} ${s?.nom} supprimée.`);
  };

  // ─── Examens ──────────────────────────────────────────────────────────────
  const addExamen = (examData: Omit<Examen, 'id'>) => {
    const id = `exam-${Date.now()}`;
    setExamens(prev => [...prev, { ...examData, id }]);
    logAction('Création Examen', `Session ${examData.nom} planifiée.`);
  };

  const toggleExamenActif = (id: string) => {
    setExamens(prev => prev.map(ex => ex.id === id ? { ...ex, actif: !ex.actif } : ex));
    const target = examens.find(ex => ex.id === id);
    logAction('Statut Examen', `Session ${target?.nom} basculée.`);
  };

  // ─── Presences ────────────────────────────────────────────────────────────
  const enregistrerAppel = (appelData: { eleveId: string; status: StatutPresenceInput; motif?: string; date: string; classeId: string }[]) => {
    const processed: Presence[] = appelData.map(a => ({
      id: `pres-${Date.now()}-${a.eleveId}`,
      eleveId: a.eleveId,
      classeId: a.classeId,
      date: a.date,
      statut: a.status,
      motif: a.motif,
      justifie: !!a.motif,
    }));

    if (offlineMode) queueOfflineAction('ADD_BULK', 'presences', processed);

    setPresences(prev => {
      const studentIds = appelData.map(a => a.eleveId);
      const targetDate = appelData[0]?.date ?? '';
      const cleanPrev = prev.filter(p => !(p.date === targetDate && studentIds.includes(p.eleveId)));
      return [...cleanPrev, ...processed];
    });

    const cls = classes.find(c => c.id === appelData[0]?.classeId);
    logAction('Appel Enregistré', `Présences pour ${cls?.nom} le ${appelData[0]?.date}.`);
  };

  // ─── Creneaux ─────────────────────────────────────────────────────────────
  const addCreneau = (creneauData: Omit<CreneauHoraire, 'id'>): { success: boolean; error?: string } => {
    // Conflit 1 : la classe est déjà occupée ce créneau
    const classeConflict = creneaux.find(
      c => c.classeId === creneauData.classeId
        && c.jour === creneauData.jour
        && c.heureDebut === creneauData.heureDebut
    );
    if (classeConflict) {
      const m = matieres.find(x => x.id === classeConflict.matiereId);
      return { success: false, error: `La classe est déjà occupée à ce créneau (${m?.nom || 'autre matière'}).` };
    }
    // Conflit 2 : l'enseignant est déjà en cours ailleurs à la même heure
    const teacherConflict = creneaux.find(
      c => c.enseignantId === creneauData.enseignantId
        && c.jour === creneauData.jour
        && c.heureDebut === creneauData.heureDebut
    );
    if (teacherConflict) {
      const cls2 = classes.find(x => x.id === teacherConflict.classeId);
      return { success: false, error: `Cet enseignant est déjà assigné à ${cls2?.nom || 'une autre classe'} à ce même créneau.` };
    }
    const id = `dt-${Date.now()}`;
    setCreneaux(prev => [...prev, { ...creneauData, id }]);
    const cls = classes.find(c => c.id === creneauData.classeId);
    const mat = matieres.find(m => m.id === creneauData.matiereId);
    logAction('Planification', `Créneau ${mat?.nom} pour ${cls?.nom} (${creneauData.jour} ${creneauData.heureDebut}).`);
    return { success: true };
  };

  const deleteCreneau = (id: string) => {
    const target = creneaux.find(dt => dt.id === id);
    const cls = classes.find(c => c.id === target?.classeId);
    setCreneaux(prev => prev.filter(dt => dt.id !== id));
    logAction('Retrait Planning', `Créneau supprimé pour ${cls?.nom}.`);
  };

  // ─── Années scolaires ─────────────────────────────────────────────────────
  const addAnneeScolaire = (libelle: string) => {
    const id = `annee-${Date.now()}`;
    setAnnees(prev => [...prev, { id, libelle, active: false, archivee: false }]);
    logAction('Année Scolaire', `Année ${libelle} créée.`);
  };

  const setAnneeActive = (id: string) => {
    setAnnees(prev => prev.map(a =>
      a.id === id
        ? { ...a, active: true, archivee: false }
        : { ...a, active: false, archivee: true }
    ));
    setParametres(prev => ({ ...prev, activeAnneeScolaireId: id }));
    const target = annees.find(a => a.id === id);
    logAction('Année Active', `Année ${target?.libelle} définie comme active.`);
  };

  // ─── Paramètres ───────────────────────────────────────────────────────────
  const updateParametres = (updates: Partial<ParametresEcole>) => {
    setParametres(prev => ({ ...prev, ...updates }));
    logAction('Configuration', 'Paramètres de l\'établissement mis à jour.');
  };

  // ─── Frais scolaires ──────────────────────────────────────────────────────
  const updateFraisScolaires = (fsData: { classeId: string; montantScolarite: number; montantInscription: number }) => {
    setFraisScolaires(prev => {
      const exists = prev.find(f => f.classeId === fsData.classeId);
      if (exists) return prev.map(f => f.classeId === fsData.classeId ? { ...f, ...fsData } : f);
      return [...prev, { id: `frais-${Date.now()}`, ...fsData }];
    });
    const cls = classes.find(c => c.id === fsData.classeId);
    logAction('Frais Scolaires', `Frais mis à jour pour ${cls?.nom}.`);
  };

  // ─── Paiements ────────────────────────────────────────────────────────────
  const addPaiement = (payData: Omit<Paiement, 'id' | 'recuNumero'>) => {
    const id = `pay-${Date.now()}`;
    const nextRecu = recuCounter + 1;
    setRecuCounter(nextRecu);
    const recuNumero = `REC-${new Date().getFullYear()}-${nextRecu.toString().padStart(4, '0')}`;
    const newPaiement: Paiement = { ...payData, id, recuNumero };
    setPaiements(prev => [newPaiement, ...prev]);
    const st = eleves.find(e => e.id === payData.eleveId);
    logAction('Paiement', `Reçu ${recuNumero} — ${payData.montant} FCFA pour ${st?.prenom} ${st?.nom}.`);
  };

  const deletePaiement = (id: string) => {
    const p = paiements.find(x => x.id === id);
    const st = eleves.find(e => e.id === p?.eleveId);
    setPaiements(prev => prev.filter(x => x.id !== id));
    logAction('Annulation Paiement', `Reçu ${p?.recuNumero} annulé pour ${st?.prenom} ${st?.nom}.`);
  };

  // ─── Suppression en lot ───────────────────────────────────────────────────
  const deleteNotesByFilter = (filter: { classeId?: string; matiereId?: string; examenId?: string; type?: string }) => {
    setNotes(prev => {
      const removed = prev.filter(n => {
        if (filter.classeId  && n.classeId  !== filter.classeId)  return false;
        if (filter.matiereId && n.matiereId !== filter.matiereId) return false;
        if (filter.examenId  && n.examenId  !== filter.examenId)  return false;
        if (filter.type      && n.type      !== filter.type)      return false;
        return true;
      });
      const kept = prev.filter(n => !removed.includes(n));
      const count = prev.length - kept.length;
      logAction('Suppression Notes', `${count} note(s) supprimée(s) en lot.`);
      return kept;
    });
  };

  // ─── Calculs ──────────────────────────────────────────────────────────────
  const getMoyenneEleve = (eleveId: string, examId: string): MoyenneResult => {
    const student = eleves.find(e => e.id === eleveId);
    if (!student) return { moyenne: 0, totalCredits: 0, details: [] };

    const classMatieres = matieres.filter(m => m.classeId === student.classeId);
    const studentNotes = notes.filter(n => n.eleveId === eleveId && n.examenId === examId);

    let cumulPoints = 0;
    let totalCoef = 0;

    const details = classMatieres.map(m => {
      const subjectNotes = studentNotes.filter(n => n.matiereId === m.id);
      const notesVal = subjectNotes.map(n => n.valeur);

      let moyMatiere = 0;
      if (notesVal.length > 0) {
        const compos = subjectNotes.filter(n => n.type === 'composition' || n.type === 'examen').map(n => n.valeur);
        const devoirs = subjectNotes.filter(n => n.type !== 'composition' && n.type !== 'examen').map(n => n.valeur);

        if (compos.length > 0) {
          const avgDev = devoirs.length > 0
            ? devoirs.reduce((a, b) => a + b, 0) / devoirs.length
            : compos[0];
          const avgComp = compos.reduce((a, b) => a + b, 0) / compos.length;
          // Système français : (devoir + 2×composition) / 3
          moyMatiere = (avgDev + avgComp * 2) / 3;
        } else {
          moyMatiere = devoirs.reduce((a, b) => a + b, 0) / devoirs.length;
        }
      }

      cumulPoints += moyMatiere * m.coefficient;
      totalCoef += m.coefficient;

      return {
        mNom: m.nom,
        coef: m.coefficient,
        notesVal,
        moyMatiere: parseFloat(moyMatiere.toFixed(2)),
      };
    });

    return {
      moyenne: totalCoef > 0 ? parseFloat((cumulPoints / totalCoef).toFixed(2)) : 0,
      totalCredits: totalCoef,
      details,
    };
  };

  const getClassements = (classeId: string, examId: string): ClassementItem[] => {
    const classStudents = eleves.filter(e => e.classeId === classeId);
    const scored = classStudents.map(s => ({
      eleveId: s.id,
      nomComplet: `${s.nom} ${s.prenom}`,
      moyenne: getMoyenneEleve(s.id, examId).moyenne,
    }));
    scored.sort((a, b) => b.moyenne - a.moyenne);
    return scored.map((item, idx) => ({ ...item, rang: idx + 1 }));
  };

  /**
   * Calcule la moyenne annuelle = moyenne des moyennes de toutes les périodes
   */
  const getMoyenneAnnuelle = (eleveId: string): number => {
    const periodeIds = examens.map(e => e.id);
    if (!periodeIds.length) return 0;
    const moyennes = periodeIds
      .map(examId => getMoyenneEleve(eleveId, examId).moyenne)
      .filter(m => m > 0);
    if (!moyennes.length) return 0;
    return parseFloat((moyennes.reduce((a, b) => a + b, 0) / moyennes.length).toFixed(2));
  };

  /**
   * Pour une matière et une période, retourne un map { eleveId → rang }
   */
  const getRangParMatiere = (classeId: string, matiereId: string, examId: string): Record<string, number> => {
    const students = eleves.filter(e => e.classeId === classeId);
    const scored = students.map(s => {
      const sn = notes.filter(n => n.eleveId === s.id && n.matiereId === matiereId && n.examenId === examId);
      const compos = sn.filter(n => n.type === 'composition' || n.type === 'examen').map(n => n.valeur);
      const devoirs = sn.filter(n => n.type !== 'composition' && n.type !== 'examen').map(n => n.valeur);
      let moy = 0;
      if (sn.length > 0) {
        if (compos.length > 0) {
          const avgD = devoirs.length > 0 ? devoirs.reduce((a,b)=>a+b,0)/devoirs.length : compos[0];
          moy = (avgD + compos.reduce((a,b)=>a+b,0)/compos.length * 2) / 3;
        } else if (devoirs.length > 0) {
          moy = devoirs.reduce((a,b)=>a+b,0)/devoirs.length;
        }
      }
      return { eleveId: s.id, moy };
    });
    scored.sort((a, b) => b.moy - a.moy);
    const rankMap: Record<string, number> = {};
    scored.forEach((item, idx) => { rankMap[item.eleveId] = idx + 1; });
    return rankMap;
  };

  /**
   * Clôture l'année scolaire :
   * 1. Calcule admis/redoublants/exclus sur la moyenne pondérée
   * 2. Transfère les élèves admis vers la classe de niveau supérieur
   * 3. Archive toutes les notes de l'année
   * 4. Crée et active la nouvelle année scolaire
   */
  const executerClotureAnnee = (nouvelleAnneeLibelle: string): { admis: number; redoublants: number; exclus: number; total: number } => {
    const NIVEAUX_PROGRESSION: Record<string, string> = {
      primaire: 'college',
      college: 'lycee',
      lycee: 'universite',
      universite: 'universite',
    };

    let admis = 0, redoublants = 0, exclus = 0;

    // Calculer les résultats et préparer les transferts
    const transfers: { eleveId: string; newClasseId: string }[] = [];
    eleves.forEach(el => {
      // Utiliser la vraie moyenne pondérée sur toutes les notes de l'élève
      const studentNotes = notes.filter(n => n.eleveId === el.id);
      let moyenne = 0;

      if (studentNotes.length > 0) {
        const classMats = matieres.filter(m => m.classeId === el.classeId);
        let cumulPts = 0, totalCoef = 0;
        classMats.forEach(m => {
          const mn = studentNotes.filter(n => n.matiereId === m.id);
          if (mn.length === 0) return;
          const compos = mn.filter(n => n.type === 'composition' || n.type === 'examen').map(n => n.valeur);
          const devoirs = mn.filter(n => n.type !== 'composition' && n.type !== 'examen').map(n => n.valeur);
          let moy = 0;
          if (compos.length > 0) {
            const avgD = devoirs.length > 0 ? devoirs.reduce((a,b)=>a+b,0)/devoirs.length : compos[0];
            moy = (avgD + (compos.reduce((a,b)=>a+b,0)/compos.length)*2)/3;
          } else {
            moy = devoirs.reduce((a,b)=>a+b,0)/devoirs.length;
          }
          cumulPts += moy * m.coefficient;
          totalCoef += m.coefficient;
        });
        moyenne = totalCoef > 0 ? cumulPts / totalCoef : 0;
      } else {
        moyenne = 10; // Pas de notes = traité comme admis (cas inscription tardive)
      }

      if (moyenne >= 10) {
        admis++;
        // Trouver la classe de niveau supérieur dans la même école
        const currentClasse = classes.find(c => c.id === el.classeId);
        if (currentClasse) {
          const niveauSuiv = NIVEAUX_PROGRESSION[currentClasse.niveau] || currentClasse.niveau;
          const classePromo = classes.find(c => c.niveau === niveauSuiv && c.id !== el.classeId) || currentClasse;
          if (classePromo.id !== el.classeId) {
            transfers.push({ eleveId: el.id, newClasseId: classePromo.id });
          }
        }
      } else if (moyenne >= 7) {
        redoublants++;
        // Les redoublants restent dans leur classe
      } else {
        exclus++;
        // Exclus : moyenne < 7/20
        transfers.push({ eleveId: el.id, newClasseId: el.classeId }); // reste mais sera marqué
      }
    });

    // Appliquer les transferts d'élèves admis
    if (transfers.length > 0) {
      setEleves(prev => prev.map(e => {
        const t = transfers.find(x => x.eleveId === e.id);
        return t ? { ...e, classeId: t.newClasseId } : e;
      }));
    }

    // Archiver toutes les notes de l'année (supprimer)
    setNotes([]);

    // Archiver les présences
    setPresences([]);

    // Créer et activer la nouvelle année
    const newId = `annee-${Date.now()}`;
    setAnnees(prev => [
      ...prev.map(a => ({ ...a, active: false, archivee: true })),
      { id: newId, libelle: nouvelleAnneeLibelle, active: true, archivee: false }
    ]);
    setParametres(prev => ({ ...prev, activeAnneeScolaireId: newId }));

    logAction(
      'Clôture Année',
      `Clôture exécutée → ${admis} admis, ${redoublants} redoublants, ${exclus} exclus. Nouvelle année : ${nouvelleAnneeLibelle}.`
    );

    return { admis, redoublants, exclus, total: eleves.length };
  };

  /**
   * Calcule le solde financier d'un élève
   */
  const getSoldeEleve = (eleveId: string) => {
    const eleve = eleves.find(e => e.id === eleveId);
    const config = fraisScolaires.find(f => f.classeId === eleve?.classeId);
    const totalDu = (config?.montantInscription ?? 0) + (config?.montantScolarite ?? 0);
    const totalPaye = paiements.filter(p => p.eleveId === eleveId).reduce((s, p) => s + p.montant, 0);
    const reste = Math.max(0, totalDu - totalPaye);
    const statut = reste === 0 && totalDu > 0 ? 'solde'
      : totalPaye > 0 ? 'partiel'
      : 'non_paye';
    return { totalDu, totalPaye, reste, statut } as const;
  };

  /**
   * Calcule le manque à gagner global et par classe
   */
  const getManqueGlobal = () => {
    const parClasse = classes.map(cls => {
      const elevesCls = eleves.filter(e => e.classeId === cls.id);
      const manque = elevesCls.reduce((acc, el) => {
        const { reste } = getSoldeEleve(el.id);
        return acc + reste;
      }, 0);
      return { classeId: cls.id, manque };
    });
    const total = parClasse.reduce((s, x) => s + x.manque, 0);
    return { total, parClasse };
  };

  /**
   * Retourne les classes où un enseignant est affecté à au moins une matière
   * ou est professeur principal. Plus d'IDs hardcodés.
   */
  const getClassesEnseignant = (enseignantId: string): Classe[] => {
    const classIdsFromMatieres = matieres
      .filter(m => m.enseignantId === enseignantId)
      .map(m => m.classeId);
    const classIdsFromPrincipal = classes
      .filter(c => c.profPrincipalId === enseignantId)
      .map(c => c.id);
    const uniqueIds = [...new Set([...classIdsFromMatieres, ...classIdsFromPrincipal])];
    return classes.filter(c => uniqueIds.includes(c.id));
  };

  // ─── Provider ─────────────────────────────────────────────────────────────
  return (
    <StateContext.Provider value={{
      currentUser, setCurrentUser,
      users, addUser, updateUser, deleteUser,
      cycles, addCycle, updateCycle, deleteCycle,
      classes, addClasse, updateClasse, deleteClasse,
      matieres, addMatiere, updateMatiere, deleteMatiere,
      eleves, addEleve, updateEleve, changeEleveClasse, deleteEleve,
      notes, addNote, updateNote, deleteNote,
      examens, addExamen, toggleExamenActif,
      presences, enregistrerAppel,
      creneaux, addCreneau, deleteCreneau,
      annees, addAnneeScolaire, setAnneeActive,
      parametres, updateParametres,
      auditLogs, logAction, clearLogs,
      fraisScolaires, updateFraisScolaires,
      paiements, addPaiement, deletePaiement,
      offlineMode, setOfflineMode,
      syncQueue, triggerManualSync,
      getMoyenneEleve, getMoyenneAnnuelle, getClassements, getRangParMatiere, getClassesEnseignant, executerClotureAnnee,
      getSoldeEleve, getManqueGlobal,
      deleteNotesByFilter,
    }}>
      {children}
    </StateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(StateContext);
  if (!context) throw new Error('useAppState doit être utilisé à l\'intérieur de StateProvider');
  return context;
};
