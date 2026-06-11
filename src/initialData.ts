import { User, Classe, Matiere, Eleve, Note, Examen, Presence, CreneauHoraire, AnneeScolaire, ParametresEcole, AuditLog, FraisScolaires, Paiement, Cycle } from './types';

export const initialAnnees: AnneeScolaire[] = [
  { id: 'annee-1', libelle: '2025-2026', active: true, archivee: false },
  { id: 'annee-2', libelle: '2024-2025', active: false, archivee: true }
];


export const initialCycles: Cycle[] = [
  {
    id: 'cycle-college',
    code: 'college',
    libelle: 'Premier Cycle Secondaire (Collège)',
    ministere: "Ministère de l'Éducation Nationale",
    directionRegionale: 'DREN Abidjan 1',
    inspectionEnseignement: 'IEP Cocody',
  },
  {
    id: 'cycle-lycee-moderne',
    code: 'lycee_moderne',
    libelle: 'Second Cycle Secondaire Moderne (Lycée)',
    ministere: "Ministère de l'Éducation Nationale",
    directionRegionale: 'DREN Abidjan 1',
    inspectionEnseignement: 'IES Cocody',
  },
  {
    id: 'cycle-lycee-tech',
    code: 'lycee_technique',
    libelle: 'Enseignement Technique et Professionnel',
    ministere: "Ministère de la Formation Professionnelle",
    directionRegionale: 'DET Abidjan',
    inspectionEnseignement: 'IEFPT Abidjan',
  },
];

export const initialParametres: ParametresEcole = {
  nomEtablissement: "Lycée Scientifique d'Abidjan",
  boitePostale: 'BP 1234',
  ville: 'Abidjan',
  pays: "Côte d'Ivoire",
  adresse: "Cocody, Boulevard de l'Université",
  devise: 'XOF',
  themePrincipal: 'orange',
  activeAnneeScolaireId: 'annee-1',
  logoUrl: '',
  logoBlob: '',
  signatureDirecteurBlob: '',
  cachetOfficielBlob: '',
  statutEtablissement: 'public',
  emailEtablissement: 'info@lycee-scientifique-abidjan.ci',
  telEtablissement: '+225 27 22 44 55',
  smtpHost: '',
  smtpUser: '',
  smsGateway: '',
  decoupageAcademique: 'trimestre',
  dateLimiteSaisie: '2026-05-30',
};

export const initialUsers: User[] = [
  {
    id: 'user-admin',
    email: 'admin@avenir.ci',
    phone: '+225 0707123456',
    nom: 'Koffi',
    prenom: 'Armand',
    role: 'admin',
    adresse: 'Cocody, Abidjan',
    active: true,
    passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LNetzKAhkhr'
  },
  {
    id: 'user-dir',
    email: 'directeur@avenir.ci',
    phone: '+225 0505112233',
    nom: 'Traoré',
    prenom: 'Bakary',
    role: 'directeur',
    adresse: 'Marcory, Abidjan',
    active: true,
    passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LNetzKAhkhr'
  },
  {
    id: 'user-sec',
    email: 'secretaire@avenir.ci',
    phone: '+225 0101556677',
    nom: 'Camara',
    prenom: 'Fatoumata',
    role: 'secretaire',
    adresse: 'Yopougon, Abidjan',
    active: true,
    passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LNetzKAhkhr'
  },
  {
    id: 'user-comptable',
    email: 'comptable@avenir.ci',
    phone: '+225 0707445566',
    nom: 'Kouadio',
    prenom: 'Jean-Noël',
    role: 'comptable',
    adresse: 'Plateau, Abidjan',
    active: true,
    passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LNetzKAhkhr'
  },
  {
    id: 'user-teacher-math',
    email: 'math.diallo@avenir.ci',
    phone: '+225 0708990011',
    nom: 'Diallo',
    prenom: 'Mamadou',
    role: 'enseignant',
    adresse: 'Angré, Abidjan',
    active: true,
    specialty: 'Mathématiques & Sciences',
    passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LNetzKAhkhr'
  },
  {
    id: 'user-teacher-fr',
    email: 'fr.kone@avenir.ci',
    phone: '+225 0709223344',
    nom: 'Koné',
    prenom: 'Mariam',
    role: 'enseignant',
    adresse: 'Riviera 3, Abidjan',
    active: true,
    specialty: 'Français, Littérature & Histoire',
    passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LNetzKAhkhr'
  },
  {
    id: 'user-teacher-phys',
    email: 'phys.bamba@avenir.ci',
    phone: '+225 0508445566',
    nom: 'Bamba',
    prenom: 'Seydou',
    role: 'enseignant',
    adresse: 'Plateau, Abidjan',
    active: true,
    specialty: 'Physique-Chimie',
    passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LNetzKAhkhr'
  },
  {
    id: 'user-parent-1',
    email: 'parent.kouassi@gmail.com',
    phone: '+225 0102030405',
    nom: 'Kouassi',
    prenom: 'Mathieu',
    role: 'parent',
    adresse: 'Bingerville, Abidjan',
    active: true,
    passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LNetzKAhkhr'
  },
  {
    id: 'user-parent-2',
    email: 'parent.diop@gmail.com',
    phone: '+225 0506070809',
    nom: 'Diop',
    prenom: 'Ousmane',
    role: 'parent',
    adresse: 'Koumassi, Abidjan',
    active: true,
    passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LNetzKAhkhr'
  },
  {
    id: 'user-student-1',
    email: 'luc.kouassi@avenir.ci',
    phone: '+225 0103112244',
    nom: 'Kouassi',
    prenom: 'Jean-Luc',
    role: 'eleve',
    adresse: 'Bingerville, Abidjan',
    active: true,
    passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LNetzKAhkhr'
  },
  {
    id: 'user-student-2',
    email: 'amina.diop@avenir.ci',
    phone: '+225 0502112233',
    nom: 'Diop',
    prenom: 'Amina',
    role: 'eleve',
    adresse: 'Koumassi, Abidjan',
    active: true,
    passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LNetzKAhkhr'
  }
];

export const initialClasses: Classe[] = [
  { id: 'classe-6a', nom: '6ème A', niveau: 'college', cycleId: 'cycle-college', profPrincipalId: 'user-teacher-fr' },
  { id: 'classe-3a', nom: '3ème Frontière', niveau: 'college', profPrincipalId: 'user-teacher-math' },
  { id: 'classe-tles', nom: 'Terminale C1', niveau: 'lycee', profPrincipalId: 'user-teacher-phys' },
  { id: 'classe-l1', nom: 'Licence 1 Math-Info', niveau: 'universite', profPrincipalId: 'user-teacher-math' }
];

export const initialExamens: Examen[] = [
  { id: 'exam-t1', nom: 'Trimestre 1', periode: '2025-2026', dateDebut: '2025-09-15', dateFin: '2025-12-18', actif: true },
  { id: 'exam-t2', nom: 'Trimestre 2', periode: '2025-2026', dateDebut: '2026-01-05', dateFin: '2026-03-27', actif: false },
  { id: 'exam-t3', nom: 'Trimestre 3', periode: '2025-2026', dateDebut: '2026-04-06', dateFin: '2026-06-19', actif: false }
];

export const initialMatieres: Matiere[] = [
  // Terminale C1
  { id: 'mat-math-tle', nom: 'Mathématiques', coefficient: 5, classeId: 'classe-tles', enseignantId: 'user-teacher-math' },
  { id: 'mat-phys-tle', nom: 'Physique-Chimie', coefficient: 5, classeId: 'classe-tles', enseignantId: 'user-teacher-phys' },
  { id: 'mat-fr-tle', nom: 'Français & Littérature', coefficient: 2, classeId: 'classe-tles', enseignantId: 'user-teacher-fr' },
  { id: 'mat-ang-tle', nom: 'Anglais', coefficient: 2, classeId: 'classe-tles', enseignantId: 'user-teacher-fr' },

  // 6ème A
  { id: 'mat-math-6', nom: 'Mathématiques', coefficient: 3, classeId: 'classe-6a', enseignantId: 'user-teacher-math' },
  { id: 'mat-fr-6', nom: 'Français', coefficient: 4, classeId: 'classe-6a', enseignantId: 'user-teacher-fr' },
  { id: 'mat-hist-6', nom: 'Histoire-Géographie', coefficient: 2, classeId: 'classe-6a', enseignantId: 'user-teacher-fr' }
];

export const initialEleves: Eleve[] = [
  {
    id: 'eleve-1',
    matricule: 'MAT-25-001',
    nom: 'Kouassi',
    prenom: 'Jean-Luc',
    sexe: 'M',
    dateNaissance: '2008-05-12',
    adresse: 'Bingerville, Cité Rose, Abidjan',
    telephone: '+225 0103112244',
    parentId: 'user-parent-1',
    parentNom: 'Kouassi Mathieu',
    parentContact: '+225 0102030405',
    classeId: 'classe-tles'
  },
  {
    id: 'eleve-2',
    matricule: 'MAT-25-002',
    nom: 'Diop',
    prenom: 'Amina',
    sexe: 'F',
    dateNaissance: '2009-11-20',
    adresse: 'Koumassi, Remblais, Abidjan',
    telephone: '+225 0502112233',
    parentId: 'user-parent-2',
    parentNom: 'Diop Ousmane',
    parentContact: '+225 0506070809',
    classeId: 'classe-tles'
  },
  {
    id: 'eleve-3',
    matricule: 'MAT-25-003',
    nom: 'Gnon',
    prenom: 'Emilie',
    sexe: 'F',
    dateNaissance: '2013-02-14',
    adresse: 'Yopougon Sogefiha, Abidjan',
    telephone: '+225 0702445588',
    parentNom: 'Gnon Charles',
    parentContact: '+225 0505115511',
    classeId: 'classe-6a'
  },
  {
    id: 'eleve-4',
    matricule: 'MAT-25-004',
    nom: 'Touré',
    prenom: 'Abdoulaye',
    sexe: 'M',
    dateNaissance: '2008-09-08',
    adresse: 'Adjamé, 220 Logements, Abidjan',
    telephone: '+225 0701223344',
    parentNom: 'Touré Moussa',
    parentContact: '+225 0404040404',
    classeId: 'classe-tles'
  },
  {
    id: 'eleve-5',
    matricule: 'MAT-25-005',
    nom: 'Yao',
    prenom: 'Aude Estelle',
    sexe: 'F',
    dateNaissance: '2014-07-28',
    adresse: 'Cocody Riviera Palmeraie, Abidjan',
    parentNom: 'Yao Sylvain',
    parentContact: '+225 0707777777',
    classeId: 'classe-6a'
  }
];

export const initialNotes: Note[] = [
  // Jean-Luc Kouassi (eleve-1)
  { id: 'note-1', eleveId: 'eleve-1', matiereId: 'mat-math-tle', classeId: 'classe-tles', examenId: 'exam-t1', type: 'devoir', valeur: 15.5, dateSaisie: '2025-10-10' },
  { id: 'note-2', eleveId: 'eleve-1', matiereId: 'mat-math-tle', classeId: 'classe-tles', examenId: 'exam-t1', type: 'composition', valeur: 14.0, dateSaisie: '2025-11-15' },
  { id: 'note-3', eleveId: 'eleve-1', matiereId: 'mat-phys-tle', classeId: 'classe-tles', examenId: 'exam-t1', type: 'devoir', valeur: 17.0, dateSaisie: '2025-10-12' },
  { id: 'note-4', eleveId: 'eleve-1', matiereId: 'mat-phys-tle', classeId: 'classe-tles', examenId: 'exam-t1', type: 'composition', valeur: 16.5, dateSaisie: '2025-11-18' },
  { id: 'note-5', eleveId: 'eleve-1', matiereId: 'mat-fr-tle', classeId: 'classe-tles', examenId: 'exam-t1', type: 'devoir', valeur: 11.0, dateSaisie: '2025-10-05' },
  { id: 'note-6', eleveId: 'eleve-1', matiereId: 'mat-fr-tle', classeId: 'classe-tles', examenId: 'exam-t1', type: 'composition', valeur: 13.0, dateSaisie: '2025-11-20' },

  // Amina Diop (eleve-2)
  { id: 'note-7', eleveId: 'eleve-2', matiereId: 'mat-math-tle', classeId: 'classe-tles', examenId: 'exam-t1', type: 'devoir', valeur: 18.0, dateSaisie: '2025-10-10' },
  { id: 'note-8', eleveId: 'eleve-2', matiereId: 'mat-math-tle', classeId: 'classe-tles', examenId: 'exam-t1', type: 'composition', valeur: 19.5, dateSaisie: '2025-11-15' },
  { id: 'note-9', eleveId: 'eleve-2', matiereId: 'mat-phys-tle', classeId: 'classe-tles', examenId: 'exam-t1', type: 'devoir', valeur: 15.0, dateSaisie: '2025-10-12' },
  { id: 'note-10', eleveId: 'eleve-2', matiereId: 'mat-phys-tle', classeId: 'classe-tles', examenId: 'exam-t1', type: 'composition', valeur: 16.0, dateSaisie: '2025-11-18' },
  { id: 'note-11', eleveId: 'eleve-2', matiereId: 'mat-fr-tle', classeId: 'classe-tles', examenId: 'exam-t1', type: 'devoir', valeur: 14.5, dateSaisie: '2025-10-05' },
  { id: 'note-12', eleveId: 'eleve-2', matiereId: 'mat-fr-tle', classeId: 'classe-tles', examenId: 'exam-t1', type: 'composition', valeur: 15.0, dateSaisie: '2025-11-20' },

  // Abdoulaye Touré (eleve-4)
  { id: 'note-13', eleveId: 'eleve-4', matiereId: 'mat-math-tle', classeId: 'classe-tles', examenId: 'exam-t1', type: 'devoir', valeur: 8.5, dateSaisie: '2025-10-10' },
  { id: 'note-14', eleveId: 'eleve-4', matiereId: 'mat-math-tle', classeId: 'classe-tles', examenId: 'exam-t1', type: 'composition', valeur: 9.0, dateSaisie: '2025-11-15' },
  { id: 'note-15', eleveId: 'eleve-4', matiereId: 'mat-phys-tle', classeId: 'classe-tles', examenId: 'exam-t1', type: 'devoir', valeur: 10.0, dateSaisie: '2025-10-12' },
  { id: 'note-16', eleveId: 'eleve-4', matiereId: 'mat-phys-tle', classeId: 'classe-tles', examenId: 'exam-t1', type: 'composition', valeur: 11.5, dateSaisie: '2025-11-18' },

  // 6ème élèves (Émilie, Aude)
  { id: 'note-17', eleveId: 'eleve-3', matiereId: 'mat-fr-6', classeId: 'classe-6a', examenId: 'exam-t1', type: 'devoir', valeur: 16.0, dateSaisie: '2025-10-10' },
  { id: 'note-18', eleveId: 'eleve-3', matiereId: 'mat-fr-6', classeId: 'classe-6a', examenId: 'exam-t1', type: 'composition', valeur: 15.5, dateSaisie: '2025-11-15' },
  { id: 'note-19', eleveId: 'eleve-3', matiereId: 'mat-math-6', classeId: 'classe-6a', examenId: 'exam-t1', type: 'devoir', valeur: 12.0, dateSaisie: '2025-10-15' },
  
  { id: 'note-20', eleveId: 'eleve-5', matiereId: 'mat-fr-6', classeId: 'classe-6a', examenId: 'exam-t1', type: 'devoir', valeur: 10.5, dateSaisie: '2025-10-10' },
  { id: 'note-21', eleveId: 'eleve-5', matiereId: 'mat-fr-6', classeId: 'classe-6a', examenId: 'exam-t1', type: 'composition', valeur: 12.0, dateSaisie: '2025-11-15' },
  { id: 'note-22', eleveId: 'eleve-5', matiereId: 'mat-math-6', classeId: 'classe-6a', examenId: 'exam-t1', type: 'devoir', valeur: 14.0, dateSaisie: '2025-10-15' }
];

export const initialPresences: Presence[] = [
  // Terminale absences
  { id: 'pres-1', eleveId: 'eleve-1', classeId: 'classe-tles', date: '2026-05-18', statut: 'present', justifie: false },
  { id: 'pres-2', eleveId: 'eleve-2', classeId: 'classe-tles', date: '2026-05-18', statut: 'present', justifie: false },
  { id: 'pres-3', eleveId: 'eleve-4', classeId: 'classe-tles', date: '2026-05-18', statut: 'absent', motif: 'Panne de transport', justifie: true },

  { id: 'pres-4', eleveId: 'eleve-1', classeId: 'classe-tles', date: '2026-05-19', statut: 'present', justifie: false },
  { id: 'pres-5', eleveId: 'eleve-2', classeId: 'classe-tles', date: '2026-05-19', statut: 'retard', motif: 'Embouteillage', justifie: false },
  { id: 'pres-6', eleveId: 'eleve-4', classeId: 'classe-tles', date: '2026-05-19', statut: 'present', justifie: false },

  { id: 'pres-7', eleveId: 'eleve-1', classeId: 'classe-tles', date: '2026-05-20', statut: 'present', justifie: false },
  { id: 'pres-8', eleveId: 'eleve-2', classeId: 'classe-tles', date: '2026-05-20', statut: 'present', justifie: false },
  { id: 'pres-9', eleveId: 'eleve-4', classeId: 'classe-tles', date: '2026-05-20', statut: 'present', justifie: false },

  // 6ème absences
  { id: 'pres-10', eleveId: 'eleve-3', classeId: 'classe-6a', date: '2026-05-20', statut: 'present', justifie: false },
  { id: 'pres-11', eleveId: 'eleve-5', classeId: 'classe-6a', date: '2026-05-20', statut: 'absent', motif: 'Avertissement médical', justifie: true }
];

export const initialCreneaux: CreneauHoraire[] = [
  // Terminale C1 Emploi du Temps
  { id: 'dt-1', classeId: 'classe-tles', jour: 'Lundi', heureDebut: '08:00', heureFin: '10:00', matiereId: 'mat-math-tle', enseignantId: 'user-teacher-math', salle: 'Salle A1' },
  { id: 'dt-2', classeId: 'classe-tles', jour: 'Lundi', heureDebut: '10:15', heureFin: '12:15', matiereId: 'mat-phys-tle', enseignantId: 'user-teacher-phys', salle: 'Salle Labo 1' },
  { id: 'dt-3', classeId: 'classe-tles', jour: 'Mardi', heureDebut: '08:00', heureFin: '10:00', matiereId: 'mat-fr-tle', enseignantId: 'user-teacher-fr', salle: 'Salle A1' },
  { id: 'dt-4', classeId: 'classe-tles', jour: 'Mercredi', heureDebut: '08:00', heureFin: '12:00', matiereId: 'mat-math-tle', enseignantId: 'user-teacher-math', salle: 'Salle A1' },
  { id: 'dt-5', classeId: 'classe-tles', jour: 'Jeudi', heureDebut: '08:00', heureFin: '10:00', matiereId: 'mat-phys-tle', enseignantId: 'user-teacher-phys', salle: 'Salle Labo 1' },
  { id: 'dt-6', classeId: 'classe-tles', jour: 'Jeudi', heureDebut: '10:15', heureFin: '12:15', matiereId: 'mat-ang-tle', enseignantId: 'user-teacher-fr', salle: 'Salle A1' },
  { id: 'dt-7', classeId: 'classe-tles', jour: 'Vendredi', heureDebut: '14:00', heureFin: '16:00', matiereId: 'mat-fr-tle', enseignantId: 'user-teacher-fr', salle: 'Salle A1' },

  // 6ème A Emploi du Temps
  { id: 'dt-8', classeId: 'classe-6a', jour: 'Lundi', heureDebut: '08:00', heureFin: '10:00', matiereId: 'mat-fr-6', enseignantId: 'user-teacher-fr', salle: 'Salle B4' },
  { id: 'dt-9', classeId: 'classe-6a', jour: 'Lundi', heureDebut: '10:15', heureFin: '12:15', matiereId: 'mat-math-6', enseignantId: 'user-teacher-math', salle: 'Salle B4' },
  { id: 'dt-10', classeId: 'classe-6a', jour: 'Mardi', heureDebut: '10:15', heureFin: '12:15', matiereId: 'mat-hist-6', enseignantId: 'user-teacher-fr', salle: 'Salle B4' },
  { id: 'dt-11', classeId: 'classe-6a', jour: 'Jeudi', heureDebut: '08:00', heureFin: '10:00', matiereId: 'mat-fr-6', enseignantId: 'user-teacher-fr', salle: 'Salle B4' },
  { id: 'dt-12', classeId: 'classe-6a', jour: 'Vendredi', heureDebut: '08:00', heureFin: '10:00', matiereId: 'mat-math-6', enseignantId: 'user-teacher-math', salle: 'Salle B4' }
];

export const initialAuditLogs: AuditLog[] = [
  { id: 'log-1', timestamp: '2026-05-23T08:30:00Z', utilisateurNom: 'Bakary Traoré', role: 'directeur', action: 'Activation Trimestre', details: 'Activation du Trimestre 1 de l\'année 2025-2026' },
  { id: 'log-2', timestamp: '2026-05-23T09:15:00Z', utilisateurNom: 'Mamadou Diallo', role: 'enseignant', action: 'Saisie Notes', details: 'Saisie de 5 notes en Mathématiques pour la classe Terminale C1' },
  { id: 'log-3', timestamp: '2026-05-23T10:00:00Z', utilisateurNom: 'Fatoumata Camara', role: 'secretaire', action: 'Inscription Élève', details: 'Inscription de l\'élève Emilie Gnon affectée à la classe 6ème A' }
];

export const initialFraisScolaires: FraisScolaires[] = [
  { id: 'frais-6a', classeId: 'classe-6a', montantScolarite: 150000, montantInscription: 35000 },
  { id: 'frais-3a', classeId: 'classe-3a', montantScolarite: 180000, montantInscription: 40000 },
  { id: 'frais-tle', classeId: 'classe-tles', montantScolarite: 220000, montantInscription: 50000 },
  { id: 'frais-l1', classeId: 'classe-l1', montantScolarite: 350000, montantInscription: 75000 }
];

export const initialPaiements: Paiement[] = [
  {
    id: 'pay-1',
    eleveId: 'eleve-1',
    montant: 50000,
    type: 'inscription',
    datePaiement: '2025-09-05',
    modePaiement: 'Wave',
    recuNumero: 'REC-2025-001',
    caissierId: 'user-comptable'
  },
  {
    id: 'pay-2',
    eleveId: 'eleve-1',
    montant: 120000,
    type: 'scolarite',
    datePaiement: '2025-11-10',
    modePaiement: 'Espèces',
    recuNumero: 'REC-2025-005',
    caissierId: 'user-comptable',
    notes: 'Premier acompte scolarité'
  },
  {
    id: 'pay-3',
    eleveId: 'eleve-2',
    montant: 50000,
    type: 'inscription',
    datePaiement: '2025-09-04',
    modePaiement: 'MTN',
    recuNumero: 'REC-2025-002',
    caissierId: 'user-comptable'
  },
  {
    id: 'pay-4',
    eleveId: 'eleve-2',
    montant: 220000,
    type: 'scolarite',
    datePaiement: '2025-09-04',
    modePaiement: 'MTN',
    recuNumero: 'REC-2025-003',
    caissierId: 'user-comptable',
    notes: 'Paiement intégral de la scolarité'
  },
  {
    id: 'pay-5',
    eleveId: 'eleve-3',
    montant: 35000,
    type: 'inscription',
    datePaiement: '2025-09-10',
    modePaiement: 'Orange Money',
    recuNumero: 'REC-2025-004',
    caissierId: 'user-comptable'
  }
];
