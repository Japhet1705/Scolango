// ─────────────────────────────────────────────────────────────
//  SCOLANGO — Types TypeScript centralisés
// ─────────────────────────────────────────────────────────────

export type Role =
  | 'admin'
  | 'directeur'
  | 'censeur'
  | 'surveillant'
  | 'secretaire'
  | 'enseignant'
  | 'eleve'
  | 'parent'
  | 'comptable';

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  phone?: string;
  photo?: string;
  adresse?: string;
  active: boolean;
  specialty?: string;
  passwordHash?: string;
}

// ─── Cycle d'enseignement (entité CRUD) ──────────────────────
export interface Cycle {
  id: string;
  code: 'primaire' | 'college' | 'lycee_moderne' | 'lycee_technique' | 'universite';
  libelle: string; // ex: "Collège", "Lycée Moderne Scientifique"
  // Tutelles administratives spécifiques à ce cycle
  ministere?: string;
  directionRegionale?: string;
  inspectionEnseignement?: string;
}

export interface Classe {
  id: string;
  nom: string;
  cycleId: string; // lié à un Cycle
  niveau: 'primaire' | 'college' | 'lycee' | 'universite'; // gardé pour compatibilité
  profPrincipalId?: string;
}

export interface Matiere {
  id: string;
  nom: string;
  coefficient: number;
  classeId: string;
  enseignantId?: string;
}

export interface Eleve {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  sexe: 'M' | 'F';
  dateNaissance: string;
  adresse: string;
  telephone?: string;
  parentId?: string;
  parentNom?: string;
  parentContact?: string;
  classeId: string;
  photo?: string;
  remise?: number;
  statut?: 'actif' | 'abandon' | 'exclu';
  motifAbandon?: string;
  // Données disciplinaires cumulées par période
  heuresAbsence?: number;
  heuresRetard?: number;
  nbAvertissements?: number;
  nbBlames?: number;
}

export type TypeNote = 'interro1' | 'interro2' | 'devoir' | 'composition';

export interface Note {
  id: string;
  eleveId: string;
  matiereId: string;
  classeId: string;
  examenId: string;
  type: TypeNote;
  valeur: number;
  dateSaisie: string;
  signaleParParent?: boolean;
}

export interface Examen {
  id: string;
  nom: string;
  anneeScolaireId: string;
  ordre: number; // 1, 2, 3 pour trier les périodes
  dateDebut: string;
  dateFin: string;
  dateLimiteSaisie?: string; // verrouillage spécifique à cette période
  actif: boolean;
  verrouille?: boolean;
}

export type StatutPresence = 'present' | 'absent' | 'retard';

export interface Presence {
  id: string;
  eleveId: string;
  classeId: string;
  date: string;
  statut: StatutPresence;
  motif?: string;
  justifie: boolean;
}

export interface CreneauHoraire {
  id: string;
  classeId: string;
  jour: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';
  heureDebut: string;
  heureFin: string;
  matiereId: string;
  enseignantId: string;
  salle?: string;
}

export interface AnneeScolaire {
  id: string;
  libelle: string;
  active: boolean;
  archivee: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  utilisateurNom: string;
  role: Role;
  action: string;
  details: string;
}

export interface ParametresEcole {
  nomEtablissement: string;
  // Identité légale structurée
  boitePostale?: string;
  ville?: string;
  pays?: string;
  // Médias officiels
  logoUrl?: string;
  logoBlob?: string;           // Base64 data URL
  signatureDirecteurBlob?: string; // Signature numérique scannée
  cachetOfficielBlob?: string;     // Tampon officiel scanné
  // Contact
  adresse: string;
  devise: string;
  themePrincipal: string;
  activeAnneeScolaireId: string;
  statutEtablissement?: 'public' | 'prive';
  emailEtablissement?: string;
  telEtablissement?: string;
  // Communication
  smtpHost?: string;
  smtpUser?: string;
  smsGateway?: string;
  // Académique
  decoupageAcademique?: 'trimestre' | 'semestre';
  dateLimiteSaisie?: string;
}

export interface FraisScolaires {
  id: string;
  classeId: string;
  montantInscription: number;
  montantScolarite: number; // total annuel
  // Optionnel : tranches de paiement
  tranche1?: number;
  tranche2?: number;
  tranche3?: number;
}

export interface Paiement {
  id: string;
  eleveId: string;
  montant: number;
  type: 'inscription' | 'scolarite' | 'tranche1' | 'tranche2' | 'tranche3' | 'autre';
  datePaiement: string;
  modePaiement: 'Wave' | 'Orange Money' | 'MTN' | 'Espèces' | 'Chèque' | 'Virement';
  recuNumero: string;
  caissierId: string;
  notes?: string;
}

// ─── Sync & Chat ─────────────────────────────────────────────
export interface SyncQueueItem {
  action: 'ADD' | 'UPDATE' | 'DELETE' | 'ADD_BULK';
  path: string;
  data: unknown;
  timestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// ─── Calculs ─────────────────────────────────────────────────
export interface MoyenneResult {
  moyenne: number;
  totalCredits: number;
  details: MatiereDetail[];
}

export interface MatiereDetail {
  mNom: string;
  coef: number;
  notesVal: number[];
  moyMatiere: number;
  rang?: number;
}

export interface ClassementItem {
  eleveId: string;
  nomComplet: string;
  moyenne: number;
  rang: number;
}
