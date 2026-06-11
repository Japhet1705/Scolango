/**
 * SCOLANGO — Script de seed PostgreSQL
 * Lance avec : npx tsx src/api/seed.ts
 * Peuple la base avec les données de démonstration depuis initialData.ts
 */
import bcrypt from "bcryptjs";
import { db } from "../lib/db";
import {
  initialUsers, initialClasses, initialMatieres, initialEleves,
  initialNotes, initialExamens, initialPresences, initialCreneaux,
  initialAnnees, initialParametres, initialFraisScolaires, initialPaiements
} from "../initialData";

const DEMO_PASSWORD = "demo1234";
const ECOLE_ID = 'ecole-avenir';

async function main() {
  console.log("🌱 Début du seed PostgreSQL Scolango...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // ─── Nettoyer dans l'ordre des dépendances ──────────────────────────────────
  await db.paiement.deleteMany();
  await db.fraisScolaires.deleteMany();
  await db.auditLog.deleteMany();
  await db.note.deleteMany();
  await db.presence.deleteMany();
  await db.creaneauHoraire.deleteMany();
  await db.matiere.deleteMany();
  await db.eleve.deleteMany();
  await db.classe.deleteMany();
  await db.examen.deleteMany();
  await db.anneeScolaire.deleteMany();
  await db.user.deleteMany();
  await db.parametresEcole.deleteMany();
  await db.ecole.deleteMany();

  // ─── École / multitenant ───────────────────────────────────────────────────────
  console.log("  → École de démonstration...");
  await db.ecole.create({
    data: {
      id: ECOLE_ID,
      nom: 'Lycée Avenir',
      slug: 'avenir',
      adresse: 'Cocody, Boulevard de l\'Université, Abidjan, Côte d\'Ivoire',
      email: 'contact@avenir.ci',
      telephone: '+225 27 22 22 22',
    },
  });

  // ─── Utilisateurs ────────────────────────────────────────────────────────────
  console.log("  → Utilisateurs...");
  for (const u of initialUsers) {
    await db.user.create({
      data: {
        id:           u.id,
        email:        u.email,
        phone:        u.phone,
        nom:          u.nom,
        prenom:       u.prenom,
        role:         u.role as any,
        adresse:      u.adresse,
        active:       u.active,
        specialty:    u.specialty,
        passwordHash: u.passwordHash ?? passwordHash,
        ecoleId:      ECOLE_ID,
      },
    });
  }

  // ─── Années scolaires ─────────────────────────────────────────────────────────
  console.log("  → Années scolaires...");
  for (const a of initialAnnees) {
    await db.anneeScolaire.create({ data: { ...a, ecoleId: ECOLE_ID } });
  }

  // ─── Paramètres ───────────────────────────────────────────────────────────────
  console.log("  → Paramètres...");
  await db.parametresEcole.create({
    data: {
      nomEtablissement:      initialParametres.nomEtablissement,
      adresse:               initialParametres.adresse,
      devise:                initialParametres.devise,
      themePrincipal:        initialParametres.themePrincipal,
      activeAnneeScolaireId: initialParametres.activeAnneeScolaireId,
      statutEtablissement:   initialParametres.statutEtablissement,
      emailEtablissement:    initialParametres.emailEtablissement,
      telEtablissement:      initialParametres.telEtablissement,
      smtpHost:              initialParametres.smtpHost,
      smtpUser:              initialParametres.smtpUser,
      smsGateway:            initialParametres.smsGateway,
      decoupageAcademique:   initialParametres.decoupageAcademique,
      dateLimiteSaisie:      initialParametres.dateLimiteSaisie,
      ecoleId:               ECOLE_ID,
    },
  });

  // ─── Classes ──────────────────────────────────────────────────────────────────
  console.log("  → Classes...");
  for (const c of initialClasses) {
    await db.classe.create({ data: { id: c.id, nom: c.nom, niveau: c.niveau as any, profPrincipalId: c.profPrincipalId, ecoleId: ECOLE_ID } });
  }

  // ─── Examens ──────────────────────────────────────────────────────────────────
  console.log("  → Examens...");
  for (const e of initialExamens) {
    await db.examen.create({ data: { ...e, ecoleId: ECOLE_ID } });
  }

  // ─── Matières ─────────────────────────────────────────────────────────────────
  console.log("  → Matières...");
  for (const m of initialMatieres) {
    await db.matiere.create({ data: { id: m.id, nom: m.nom, coefficient: m.coefficient, classeId: m.classeId, enseignantId: m.enseignantId, ecoleId: ECOLE_ID } });
  }

  // ─── Élèves ───────────────────────────────────────────────────────────────────
  console.log("  → Élèves...");
  for (const el of initialEleves) {
    await db.eleve.create({
      data: {
        id: el.id, matricule: el.matricule, nom: el.nom, prenom: el.prenom,
        sexe: el.sexe, dateNaissance: el.dateNaissance, adresse: el.adresse,
        telephone: el.telephone, parentId: el.parentId, parentNom: el.parentNom,
        parentContact: el.parentContact, classeId: el.classeId,
        statut: el.statut ?? "actif",
        ecoleId: ECOLE_ID,
      },
    });
  }

  // ─── Notes ────────────────────────────────────────────────────────────────────
  console.log("  → Notes...");
  for (const n of initialNotes) {
    await db.note.create({ data: { id: n.id, eleveId: n.eleveId, matiereId: n.matiereId, classeId: n.classeId, examenId: n.examenId, type: n.type as any, valeur: n.valeur, dateSaisie: n.dateSaisie, ecoleId: ECOLE_ID } });
  }

  // ─── Présences ────────────────────────────────────────────────────────────────
  console.log("  → Présences...");
  for (const p of initialPresences) {
    await db.presence.create({ data: { id: p.id, eleveId: p.eleveId, classeId: p.classeId, date: p.date, statut: p.statut as any, motif: p.motif, justifie: p.justifie } });
  }

  // ─── Créneaux ─────────────────────────────────────────────────────────────────
  console.log("  → Créneaux horaires...");
  for (const cr of initialCreneaux) {
    await db.creaneauHoraire.create({ data: { id: cr.id, classeId: cr.classeId, jour: cr.jour as any, heureDebut: cr.heureDebut, heureFin: cr.heureFin, matiereId: cr.matiereId, enseignantId: cr.enseignantId, salle: cr.salle } });
  }

  // ─── Frais scolaires ──────────────────────────────────────────────────────────
  console.log("  → Frais scolaires...");
  for (const f of initialFraisScolaires) {
    await db.fraisScolaires.create({ data: f });
  }

  // ─── Paiements ────────────────────────────────────────────────────────────────
  console.log("  → Paiements...");
  for (const pay of initialPaiements) {
    await db.paiement.create({
      data: {
        id: pay.id, eleveId: pay.eleveId, montant: pay.montant,
        type: pay.type as any, datePaiement: new Date(pay.datePaiement),
        modePaiement: pay.modePaiement as any, recuNumero: pay.recuNumero,
        caissierId: pay.caissierId, notes: pay.notes,
      },
    });
  }

  console.log("\n✅ Seed terminé avec succès !");
  console.log(`   Mot de passe démo : "${DEMO_PASSWORD}"`);
  console.log("   Tous les comptes utilisateurs ont été créés.\n");
}

main()
  .catch(e => { console.error("❌ Erreur seed:", e); process.exit(1); })
  .finally(() => db.$disconnect());
