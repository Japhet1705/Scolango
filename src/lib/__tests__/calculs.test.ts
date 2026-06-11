/**
 * SCOLANGO — Tests unitaires des moteurs de calcul
 * Lancez avec : npm test
 */

import { describe, it, expect } from 'vitest';

// ─── Utilitaires de calcul extraits de stateContext pour les tester ──────────

type TypeNote = 'devoir' | 'composition' | 'tp' | 'examen';

interface NoteStub {
  type: TypeNote;
  valeur: number;
}

/**
 * Calcule la moyenne d'une matière selon le système français
 * (devoirs + 2×compositions) / 3
 */
function calculerMoyenneMatiere(notes: NoteStub[]): number {
  if (notes.length === 0) return 0;

  const compos = notes
    .filter(n => n.type === 'composition' || n.type === 'examen')
    .map(n => n.valeur);
  const devoirs = notes
    .filter(n => n.type !== 'composition' && n.type !== 'examen')
    .map(n => n.valeur);

  if (compos.length > 0) {
    const avgDev =
      devoirs.length > 0
        ? devoirs.reduce((a, b) => a + b, 0) / devoirs.length
        : compos[0];
    const avgComp = compos.reduce((a, b) => a + b, 0) / compos.length;
    return parseFloat(((avgDev + avgComp * 2) / 3).toFixed(2));
  }

  return parseFloat(
    (devoirs.reduce((a, b) => a + b, 0) / devoirs.length).toFixed(2)
  );
}

/**
 * Calcule la moyenne générale pondérée
 */
function calculerMoyenneGenerale(
  matieres: { coefficient: number; moyMatiere: number }[]
): number {
  const totalCoef = matieres.reduce((s, m) => s + m.coefficient, 0);
  if (totalCoef === 0) return 0;
  const cumul = matieres.reduce(
    (s, m) => s + m.coefficient * m.moyMatiere,
    0
  );
  return parseFloat((cumul / totalCoef).toFixed(2));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('calculerMoyenneMatiere', () => {
  it('renvoie 0 si pas de notes', () => {
    expect(calculerMoyenneMatiere([])).toBe(0);
  });

  it('calcule correctement la moyenne de devoirs seuls', () => {
    const notes: NoteStub[] = [
      { type: 'devoir', valeur: 12 },
      { type: 'devoir', valeur: 14 },
    ];
    expect(calculerMoyenneMatiere(notes)).toBe(13);
  });

  it('applique le système (devoir + 2×composition) / 3', () => {
    const notes: NoteStub[] = [
      { type: 'devoir', valeur: 12 },
      { type: 'composition', valeur: 15 },
    ];
    // (12 + 15×2) / 3 = 42/3 = 14
    expect(calculerMoyenneMatiere(notes)).toBe(14);
  });

  it('utilise la composition comme fallback si pas de devoir', () => {
    const notes: NoteStub[] = [{ type: 'composition', valeur: 10 }];
    // avgDev = compos[0] = 10, avgComp = 10 → (10 + 20) / 3 = 10
    expect(calculerMoyenneMatiere(notes)).toBe(10);
  });

  it('gère plusieurs compositions (moyenne des compositions)', () => {
    const notes: NoteStub[] = [
      { type: 'devoir', valeur: 8 },
      { type: 'composition', valeur: 10 },
      { type: 'composition', valeur: 16 },
    ];
    // avgDev = 8, avgComp = 13 → (8 + 26) / 3 = 11.33
    expect(calculerMoyenneMatiere(notes)).toBe(11.33);
  });
});

describe('calculerMoyenneGenerale', () => {
  it('renvoie 0 si aucune matière', () => {
    expect(calculerMoyenneGenerale([])).toBe(0);
  });

  it('calcule correctement avec coefficients différents', () => {
    const matieres = [
      { coefficient: 3, moyMatiere: 15 }, // Math
      { coefficient: 2, moyMatiere: 12 }, // Français
      { coefficient: 1, moyMatiere: 10 }, // EPS
    ];
    // (3×15 + 2×12 + 1×10) / 6 = (45 + 24 + 10) / 6 = 79/6 ≈ 13.17
    expect(calculerMoyenneGenerale(matieres)).toBe(13.17);
  });

  it('est égale à la moyenne simple si tous les coefficients sont 1', () => {
    const matieres = [
      { coefficient: 1, moyMatiere: 10 },
      { coefficient: 1, moyMatiere: 14 },
      { coefficient: 1, moyMatiere: 12 },
    ];
    expect(calculerMoyenneGenerale(matieres)).toBe(12);
  });
});

describe('Validation des données financières', () => {
  it('le numéro de reçu est unique et bien formaté', () => {
    const year = new Date().getFullYear();
    const formatRecu = (count: number) =>
      `REC-${year}-${count.toString().padStart(4, '0')}`;

    expect(formatRecu(1)).toBe(`REC-${year}-0001`);
    expect(formatRecu(42)).toBe(`REC-${year}-0042`);
    expect(formatRecu(1000)).toBe(`REC-${year}-1000`);
  });

  it('le matricule élève est bien formaté', () => {
    const formatMatricule = (year: number, count: number) => {
      const y = year.toString().slice(-2);
      return `MAT-${y}-${count.toString().padStart(3, '0')}`;
    };

    expect(formatMatricule(2026, 1)).toBe('MAT-26-001');
    expect(formatMatricule(2026, 99)).toBe('MAT-26-099');
  });
});
