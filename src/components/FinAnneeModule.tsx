import React, { useState } from 'react';
import { useAppState } from '../stateContext';
import { CalendarDays, Play, CheckCircle, AlertCircle, ArrowRight, Users, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

export const FinAnneeModule: React.FC = () => {
  const {
    eleves, notes, classes, annees,
    addAnneeScolaire, executerClotureAnnee
  } = useAppState();

  const [closingYear, setClosingYear] = useState(false);
  const [yearClosedSuccessfully, setYearClosedSuccessfully] = useState(false);
  const [closedSummary, setClosedSummary] = useState<{
    total: number; admis: number; redoublants: number; exclus: number;
    ancienYear: string; nouvelYear: string;
  } | null>(null);
  const [nouvelAnnee, setNouvelAnnee] = useState('2026-2027');
  const [confirmStep, setConfirmStep] = useState(false);

  const activeYear = annees.find(a => a.active);

  const handleExecuteYearClosure = () => {
    setClosingYear(true);
    // Délai pour feedback visuel
    setTimeout(() => {
      const result = executerClotureAnnee(nouvelAnnee);
      setClosedSummary({
        ...result,
        ancienYear: activeYear?.libelle ?? '—',
        nouvelYear: nouvelAnnee,
      });
      setClosingYear(false);
      setYearClosedSuccessfully(true);
      setConfirmStep(false);
    }, 2200);
  };

  // Statistiques prévisionnelles (avant clôture)
  const preview = (() => {
    if (eleves.length === 0) return null;
    let admis = 0, redoublants = 0, exclus = 0;
    eleves.forEach(el => {
      const stNotes = notes.filter(n => n.eleveId === el.id);
      const avg = stNotes.length > 0
        ? stNotes.reduce((s, n) => s + n.valeur, 0) / stNotes.length
        : 10;
      if (avg >= 10) admis++;
      else if (avg >= 7) redoublants++;
      else exclus++;
    });
    return { admis, redoublants, exclus };
  })();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center border-b border-white/10 pb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <CalendarDays size={18} className="text-rose-400 animate-pulse" />
            <span>Clôture Académique & Passage de Classes</span>
          </h2>
          <p className="text-xs text-slate-400">
            Exécutez l'algorithme de promotion pour archiver l'année, transférer les élèves et repartir sur une nouvelle année.
          </p>
        </div>
      </div>

      {yearClosedSuccessfully && closedSummary ? (
        // ── Résultats ────────────────────────────────────────────────────────
        <div className="backdrop-blur-xl bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8 text-center space-y-5 animate-fade-in">
          <CheckCircle className="mx-auto text-emerald-400" size={48} />
          <div>
            <h3 className="text-white font-bold text-lg">Clôture {closedSummary.ancienYear} exécutée !</h3>
            <p className="text-xs text-slate-400 mt-1">
              Les élèves admis ont été transférés dans les classes de niveau supérieur.
              Les notes et présences ont été archivées. L'année {closedSummary.nouvelYear} est désormais active.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
              <TrendingUp className="text-emerald-400 mx-auto mb-1" size={20} />
              <div className="text-2xl font-bold text-emerald-400">{closedSummary.admis}</div>
              <div className="text-[10px] text-emerald-300 uppercase font-mono">Admis & promus</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
              <AlertCircle className="text-amber-400 mx-auto mb-1" size={20} />
              <div className="text-2xl font-bold text-amber-400">{closedSummary.redoublants}</div>
              <div className="text-[10px] text-amber-300 uppercase font-mono">Redoublants</div>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
              <TrendingDown className="text-rose-400 mx-auto mb-1" size={20} />
              <div className="text-2xl font-bold text-rose-400">{closedSummary.exclus}</div>
              <div className="text-[10px] text-rose-300 uppercase font-mono">Exclus</div>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-3 text-sm text-slate-300">
            <span className="font-mono text-slate-400">{closedSummary.ancienYear}</span>
            <ArrowRight size={16} className="text-orange-400" />
            <span className="font-bold text-orange-400">{closedSummary.nouvelYear} (active)</span>
          </div>
        </div>
      ) : (
        <>
          {/* ── Statistiques prévisionnelles ── */}
          {preview && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center space-x-3">
                <Users size={22} className="text-slate-400" />
                <div>
                  <div className="text-xl font-bold text-white">{eleves.length}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Total inscrits</div>
                </div>
              </div>
              <div className="backdrop-blur-xl bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-5 flex items-center space-x-3">
                <TrendingUp size={22} className="text-emerald-400" />
                <div>
                  <div className="text-xl font-bold text-emerald-400">{preview.admis}</div>
                  <div className="text-[10px] text-emerald-300 uppercase font-mono">Admis (≥10)</div>
                </div>
              </div>
              <div className="backdrop-blur-xl bg-amber-500/5 border border-amber-500/20 rounded-3xl p-5 flex items-center space-x-3">
                <AlertCircle size={22} className="text-amber-400" />
                <div>
                  <div className="text-xl font-bold text-amber-400">{preview.redoublants}</div>
                  <div className="text-[10px] text-amber-300 uppercase font-mono">Redoublants (7–9.99)</div>
                </div>
              </div>
              <div className="backdrop-blur-xl bg-rose-500/5 border border-rose-500/20 rounded-3xl p-5 flex items-center space-x-3">
                <TrendingDown size={22} className="text-rose-400" />
                <div>
                  <div className="text-xl font-bold text-rose-400">{preview.exclus}</div>
                  <div className="text-[10px] text-rose-300 uppercase font-mono">Exclus (&lt;7)</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Configuration et lancement ── */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
              Configuration de la clôture
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Année en cours (à archiver)</label>
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm font-mono text-slate-400">
                  {activeYear?.libelle ?? 'Aucune année active'}
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="nouvelle-annee" className="text-xs font-bold text-slate-300">
                  Nouvelle année à créer et activer
                </label>
                <input
                  id="nouvelle-annee"
                  type="text"
                  value={nouvelAnnee}
                  onChange={e => setNouvelAnnee(e.target.value)}
                  placeholder="ex: 2026-2027"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm font-mono text-white outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Avertissement */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-1">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                <AlertTriangle size={14} />
                <span>Action irréversible — lisez attentivement</span>
              </div>
              <ul className="text-[11px] text-amber-300 space-y-1 list-disc list-inside">
                <li>Toutes les <strong>notes et présences</strong> de l'année en cours seront archivées (supprimées de l'interface active)</li>
                <li>Les élèves <strong>admis (≥10)</strong> seront automatiquement transférés dans les classes de niveau supérieur</li>
                <li>Les élèves <strong>redoublants (7–9.99)</strong> restent dans leur classe actuelle</li>
                <li>L'année <strong>{nouvelAnnee || '…'}</strong> sera créée et définie comme année active</li>
              </ul>
            </div>

            {!confirmStep ? (
              <button
                onClick={() => setConfirmStep(true)}
                disabled={!nouvelAnnee.trim() || !activeYear}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs uppercase px-5 py-3 rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition-all"
              >
                <Play size={14} />
                <span>Préparer la clôture de {activeYear?.libelle ?? '—'}</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-center">
                  <p className="text-rose-300 font-bold text-sm">Confirmer la clôture définitive ?</p>
                  <p className="text-rose-400/80 text-xs mt-1">
                    Cette action archivera <strong>{eleves.length} élèves</strong>, <strong>{notes.length} notes</strong> et créera l'année <strong>{nouvelAnnee}</strong>.
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setConfirmStep(false)}
                    className="flex-1 bg-white/5 border border-white/10 text-slate-300 font-bold text-xs uppercase px-5 py-3 rounded-xl cursor-pointer hover:bg-white/10"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleExecuteYearClosure}
                    disabled={closingYear}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold text-xs uppercase px-5 py-3 rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    {closingYear ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        <span>Traitement en cours…</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        <span>OUI — Exécuter la clôture</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
