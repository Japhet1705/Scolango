import React, { useState, useMemo } from 'react';
import { useAppState } from '../stateContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { BarChart2, TrendingUp, Users, BookOpen, Award, CreditCard } from 'lucide-react';

// ─── Couleurs de graphiques ───────────────────────────────────────────────────
const COLORS = {
  orange: '#f97316', blue: '#3b82f6', emerald: '#10b981',
  rose: '#f43f5e', violet: '#6366f1', amber: '#f59e0b',
  teal: '#14b8a6', pink: '#ec4899',
};
const PIE_COLORS = [COLORS.orange, COLORS.blue, COLORS.emerald, COLORS.rose, COLORS.violet, COLORS.amber, COLORS.teal];

// ─── Tooltip personnalisé ─────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-white/20 rounded-xl p-3 text-xs shadow-xl">
      <p className="font-bold text-white mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-mono">
          {p.name} : <span className="font-bold">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

type StatTab = 'performance' | 'classes' | 'sexe' | 'finances';

export const StatistiquesModule: React.FC = () => {
  const {
    eleves, classes, matieres, notes, examens,
    paiements, fraisScolaires,
    getMoyenneEleve, getMoyenneAnnuelle,
    getSoldeEleve,
  } = useAppState();

  const [tab, setTab] = useState<StatTab>('performance');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // ── 1. DONNÉES : Courbe de performance inter-périodes ────────────────────────
  const performanceData = useMemo(() => {
    const classesToShow = selectedClass === 'all' ? classes : classes.filter(c => c.id === selectedClass);
    return examens.map(ex => {
      const point: Record<string, number | string> = { periode: ex.nom };
      classesToShow.forEach(cls => {
        const classStudents = eleves.filter(e => e.classeId === cls.id && (e.statut ?? 'actif') === 'actif');
        const moyennes = classStudents
          .map(s => getMoyenneEleve(s.id, ex.id).moyenne)
          .filter(m => m > 0);
        point[cls.nom] = moyennes.length > 0
          ? parseFloat((moyennes.reduce((a, b) => a + b, 0) / moyennes.length).toFixed(2))
          : 0;
      });
      return point;
    });
  }, [examens, classes, eleves, selectedClass, notes]);

  // ── 2. DONNÉES : Moyennes & taux de réussite par classe ─────────────────────
  const classeStats = useMemo(() => {
    return classes.map(cls => {
      const classStudents = eleves.filter(e => e.classeId === cls.id && (e.statut ?? 'actif') === 'actif');
      if (!classStudents.length) return { cls, moyenne: 0, tauxReussite: 0, nb: 0, admis: 0 };
      const moyennes = classStudents.map(s => getMoyenneAnnuelle(s.id)).filter(m => m > 0);
      const moyenne = moyennes.length > 0
        ? parseFloat((moyennes.reduce((a, b) => a + b, 0) / moyennes.length).toFixed(2))
        : 0;
      const admis = moyennes.filter(m => m >= 10).length;
      const tauxReussite = moyennes.length > 0 ? Math.round(admis / moyennes.length * 100) : 0;
      return { cls, moyenne, tauxReussite, nb: classStudents.length, admis };
    });
  }, [classes, eleves, notes, examens]);

  // ── 3. DONNÉES : Analyse par sexe ────────────────────────────────────────────
  const sexeStats = useMemo(() => {
    const classesToShow = selectedClass === 'all'
      ? eleves.filter(e => (e.statut ?? 'actif') === 'actif')
      : eleves.filter(e => e.classeId === selectedClass && (e.statut ?? 'actif') === 'actif');

    const garcons = classesToShow.filter(e => e.sexe === 'M');
    const filles  = classesToShow.filter(e => e.sexe === 'F');

    const moyGarcons = garcons.map(s => getMoyenneAnnuelle(s.id)).filter(m => m > 0);
    const moyFilles  = filles.map(s => getMoyenneAnnuelle(s.id)).filter(m => m > 0);

    const avgG = moyGarcons.length > 0 ? parseFloat((moyGarcons.reduce((a,b)=>a+b,0)/moyGarcons.length).toFixed(2)) : 0;
    const avgF = moyFilles.length  > 0 ? parseFloat((moyFilles.reduce((a,b)=>a+b,0)/moyFilles.length).toFixed(2))   : 0;

    const tauxG = moyGarcons.length > 0 ? Math.round(moyGarcons.filter(m=>m>=10).length/moyGarcons.length*100) : 0;
    const tauxF = moyFilles.length  > 0 ? Math.round(moyFilles.filter(m=>m>=10).length/moyFilles.length*100)   : 0;

    // Distribution par tranche de note
    const tranches = ['<7', '7–9.99', '10–11.99', '12–13.99', '14–15.99', '≥16'];
    const tranchesData = tranches.map(t => {
      const inRange = (m: number) => {
        if (t === '<7')      return m < 7;
        if (t === '7–9.99')  return m >= 7  && m < 10;
        if (t === '10–11.99')return m >= 10 && m < 12;
        if (t === '12–13.99')return m >= 12 && m < 14;
        if (t === '14–15.99')return m >= 14 && m < 16;
        return m >= 16;
      };
      return {
        tranche: t,
        Garçons: moyGarcons.filter(inRange).length,
        Filles:  moyFilles.filter(inRange).length,
      };
    });

    // Données par classe pour le radar
    const radarData = classes.map(cls => {
      const cG = garcons.filter(e => e.classeId === cls.id).map(s => getMoyenneAnnuelle(s.id)).filter(m=>m>0);
      const cF = filles.filter(e => e.classeId === cls.id).map(s => getMoyenneAnnuelle(s.id)).filter(m=>m>0);
      return {
        classe: cls.nom,
        Garçons: cG.length > 0 ? parseFloat((cG.reduce((a,b)=>a+b,0)/cG.length).toFixed(2)) : 0,
        Filles:  cF.length > 0 ? parseFloat((cF.reduce((a,b)=>a+b,0)/cF.length).toFixed(2)) : 0,
      };
    });

    // Répartition effectif
    const pieData = [
      { name: 'Garçons', value: garcons.length },
      { name: 'Filles',  value: filles.length  },
    ];

    return { garcons, filles, avgG, avgF, tauxG, tauxF, tranchesData, radarData, pieData };
  }, [eleves, classes, notes, examens, selectedClass]);

  // ── 4. DONNÉES : Finances ─────────────────────────────────────────────────────
  const financeStats = useMemo(() => {
    const byClasse = classes.map(cls => {
      const elevesCls = eleves.filter(e => e.classeId === cls.id);
      const config    = fraisScolaires.find(f => f.classeId === cls.id);
      const totalDu   = elevesCls.reduce((s) => s + (config?.montantInscription ?? 0) + (config?.montantScolarite ?? 0), 0);
      const totalPaye = paiements.filter(p => elevesCls.some(e => e.id === p.eleveId)).reduce((s, p) => s + p.montant, 0);
      return {
        classe: cls.nom,
        Prévu:     totalDu,
        Encaissé:  totalPaye,
        Manque:    Math.max(0, totalDu - totalPaye),
        taux:      totalDu > 0 ? Math.round(totalPaye / totalDu * 100) : 0,
      };
    });

    // Répartition par mode de paiement
    const modes = ['Wave', 'Orange Money', 'MTN', 'Espèces', 'Chèque', 'Virement'];
    const modeData = modes.map(m => ({
      name: m,
      value: paiements.filter(p => p.modePaiement === m).reduce((s, p) => s + p.montant, 0),
    })).filter(d => d.value > 0);

    // Évolution mensuelle des encaissements
    const byMonth: Record<string, number> = {};
    paiements.forEach(p => {
      const month = p.datePaiement.substring(0, 7); // YYYY-MM
      byMonth[month] = (byMonth[month] ?? 0) + p.montant;
    });
    const monthlyData = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, montant]) => ({ mois: month, Encaissements: montant }));

    const totalEncaisse = paiements.reduce((s, p) => s + p.montant, 0);
    const totalPrevu    = byClasse.reduce((s, x) => s + x.Prévu, 0);

    return { byClasse, modeData, monthlyData, totalEncaisse, totalPrevu };
  }, [classes, eleves, fraisScolaires, paiements]);

  // ── Couleurs des classes pour les courbes ────────────────────────────────────
  const classColors = [
    COLORS.orange, COLORS.blue, COLORS.emerald, COLORS.rose,
    COLORS.violet, COLORS.amber, COLORS.teal, COLORS.pink,
  ];
  const classesToShow = selectedClass === 'all' ? classes : classes.filter(c => c.id === selectedClass);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-white/10 pb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <BarChart2 size={16} className="text-orange-400" />
            <span>Statistiques & Tableaux de Bord</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Analyses pédagogiques et financières pour les rapports de direction et rapports ministériels.</p>
        </div>
        <select
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="all" className="bg-slate-900">Toutes les classes</option>
          {classes.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.nom}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 space-x-1 overflow-x-auto">
        {([
          { id:'performance', label:'Courbes de Performance',    icon: TrendingUp  },
          { id:'classes',     label:'Statistiques par Classe',   icon: BookOpen    },
          { id:'sexe',        label:'Analyse par Sexe',          icon: Users       },
          { id:'finances',    label:'Tableau de Bord Financier', icon: CreditCard  },
        ] as { id: StatTab; label: string; icon: any }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center space-x-1.5 px-4 py-2 text-[11px] font-semibold uppercase border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              tab === t.id ? 'border-orange-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
            }`}>
            <t.icon size={12} /><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ════ COURBES DE PERFORMANCE ════════════════════════════════════════════ */}
      {tab === 'performance' && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:'Total élèves', val: eleves.filter(e=>(e.statut??'actif')==='actif').length, color:'text-white' },
              { label:'Sessions d\'examen', val: examens.length, color:'text-blue-400' },
              { label:'Notes saisies', val: notes.length, color:'text-orange-400' },
              { label:'Moy. globale', val: (() => {
                const all = eleves.filter(e=>(e.statut??'actif')==='actif').map(s => getMoyenneAnnuelle(s.id)).filter(m=>m>0);
                return all.length > 0 ? (all.reduce((a,b)=>a+b,0)/all.length).toFixed(2)+'/20' : '—';
              })(), color:'text-emerald-400' },
            ].map(k => (
              <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <div className={`text-xl font-bold ${k.color}`}>{k.val}</div>
                <div className="text-[10px] text-slate-400 mt-1">{k.label}</div>
              </div>
            ))}
          </div>

          {/* Courbe évolution par période */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest mb-4">
              Évolution des Moyennes par Période
            </h3>
            {performanceData.length < 2 ? (
              <div className="h-48 flex items-center justify-center text-slate-500 text-xs italic">
                Au moins 2 périodes avec des notes sont nécessaires pour afficher la courbe.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={performanceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="periode" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis domain={[0, 20]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  {classesToShow.map((cls, i) => (
                    <Line
                      key={cls.id}
                      type="monotone"
                      dataKey={cls.nom}
                      stroke={classColors[i % classColors.length]}
                      strokeWidth={2}
                      dot={{ r: 4, fill: classColors[i % classColors.length] }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Barres : taux de réussite par classe */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest mb-4">
              Taux de Réussite par Classe (élèves ≥ 10/20)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={classeStats.map(s => ({ classe: s.cls.nom, 'Taux (%)': s.tauxReussite, 'Moyenne': s.moyenne }))}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="classe" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis yAxisId="left" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} unit="%" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 20]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Bar yAxisId="left" dataKey="Taux (%)" fill={COLORS.emerald} radius={[4,4,0,0]} />
                <Bar yAxisId="right" dataKey="Moyenne" fill={COLORS.orange} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ════ STATISTIQUES PAR CLASSE ════════════════════════════════════════════ */}
      {tab === 'classes' && (
        <div className="space-y-5">
          {/* Tableau complet */}
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">
                Résultats par Classe — Vue Synthétique
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-black/30 text-slate-400 text-left">
                    <th className="p-3 font-semibold">Classe</th>
                    <th className="p-3 text-center font-semibold">Effectif</th>
                    <th className="p-3 text-center font-semibold">Moy. générale</th>
                    <th className="p-3 text-center font-semibold">Admis (≥10)</th>
                    <th className="p-3 text-center font-semibold">Taux réussite</th>
                    <th className="p-3 font-semibold">Barre</th>
                    <th className="p-3 text-center font-semibold">Niveau</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {classeStats.map(({ cls, moyenne, tauxReussite, nb, admis }) => (
                    <tr key={cls.id} className="hover:bg-white/3">
                      <td className="p-3 font-bold text-white">{cls.nom}</td>
                      <td className="p-3 text-center font-mono text-slate-300">{nb}</td>
                      <td className="p-3 text-center">
                        <span className={`font-bold font-mono text-sm ${moyenne >= 10 ? 'text-emerald-400' : moyenne >= 7 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {moyenne > 0 ? moyenne : '—'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-400">{admis}</td>
                      <td className="p-3 text-center font-bold font-mono">
                        <span className={tauxReussite >= 75 ? 'text-emerald-400' : tauxReussite >= 50 ? 'text-amber-400' : 'text-rose-400'}>
                          {tauxReussite}%
                        </span>
                      </td>
                      <td className="p-3 w-32">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${tauxReussite}%` }}
                            className={`h-full rounded-full ${tauxReussite >= 75 ? 'bg-emerald-500' : tauxReussite >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          />
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded font-mono uppercase">
                          {cls.niveau}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Graphique : Moyenne par classe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest mb-4">
                Moyenne Générale par Classe
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={classeStats.map(s => ({ classe: s.cls.nom, Moyenne: s.moyenne }))}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="classe" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis domain={[0, 20]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Moyenne" radius={[4,4,0,0]}>
                    {classeStats.map((_, i) => (
                      <Cell key={i} fill={classColors[i % classColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Matières : moyennes globales */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest mb-4">
                Moyennes par Matière (toutes classes)
              </h3>
              {(() => {
                const matData = matieres.map(m => {
                  const mn = notes.filter(n => n.matiereId === m.id).map(n => n.valeur);
                  const avg = mn.length > 0 ? parseFloat((mn.reduce((a,b)=>a+b,0)/mn.length).toFixed(2)) : 0;
                  return { matiere: m.nom.length > 10 ? m.nom.substring(0, 10)+'…' : m.nom, Moyenne: avg };
                }).filter(d => d.Moyenne > 0);
                return (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={matData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" domain={[0, 20]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis type="category" dataKey="matiere" tick={{ fill: '#94a3b8', fontSize: 9 }} width={70} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Moyenne" fill={COLORS.blue} radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ════ ANALYSE PAR SEXE ═══════════════════════════════════════════════════ */}
      {tab === 'sexe' && (
        <div className="space-y-5">
          {/* KPIs Garçons vs Filles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:'Garçons', val: sexeStats.garcons.length, color:'text-blue-400', bg:'bg-blue-500/5 border-blue-500/20' },
              { label:'Filles',  val: sexeStats.filles.length,  color:'text-pink-400', bg:'bg-pink-500/5 border-pink-500/20'  },
              { label:'Moy. Garçons', val: sexeStats.avgG > 0 ? sexeStats.avgG+'/20' : '—', color:'text-blue-300', bg:'bg-blue-500/5 border-blue-500/20' },
              { label:'Moy. Filles',  val: sexeStats.avgF > 0 ? sexeStats.avgF+'/20' : '—', color:'text-pink-300', bg:'bg-pink-500/5 border-pink-500/20'  },
            ].map(k => (
              <div key={k.label} className={`border rounded-2xl p-4 text-center ${k.bg}`}>
                <div className={`text-xl font-bold ${k.color}`}>{k.val}</div>
                <div className="text-[10px] text-slate-400 mt-1">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Répartition effectif */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest mb-3">
                Répartition de l'Effectif
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={sexeStats.pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                    labelLine={{ stroke: '#94a3b8' }}>
                    <Cell fill={COLORS.blue} />
                    <Cell fill={COLORS.pink} />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-around text-[10px] font-mono mt-2">
                <span className="text-blue-400 font-bold">
                  Taux réussite G : {sexeStats.tauxG}%
                </span>
                <span className="text-pink-400 font-bold">
                  Taux réussite F : {sexeStats.tauxF}%
                </span>
              </div>
            </div>

            {/* Distribution par tranche */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:col-span-2">
              <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest mb-3">
                Distribution des Notes par Tranche
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sexeStats.tranchesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="tranche" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  <Bar dataKey="Garçons" fill={COLORS.blue}  radius={[3,3,0,0]} />
                  <Bar dataKey="Filles"  fill={COLORS.pink}  radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar comparatif par classe */}
          {sexeStats.radarData.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest mb-3">
                Comparaison Garçons / Filles par Classe — (Rapport Ministériel)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={sexeStats.radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="classe" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 20]} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <Radar name="Garçons" dataKey="Garçons" stroke={COLORS.blue}  fill={COLORS.blue}  fillOpacity={0.2} strokeWidth={2} />
                  <Radar name="Filles"  dataKey="Filles"  stroke={COLORS.pink}  fill={COLORS.pink}  fillOpacity={0.2} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-[10px] text-blue-300">
                Ce graphique radar est directement exportable pour les rapports ministériels annuels sur la parité scolaire.
              </div>
            </div>
          )}

          {/* Tableau récap rapport ministériel */}
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">
                Tableau de Parité — Format Rapport Ministériel
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-black/30 text-slate-400 text-left">
                    <th className="p-3">Classe</th>
                    <th className="p-3 text-center">Eff. Garçons</th>
                    <th className="p-3 text-center">Eff. Filles</th>
                    <th className="p-3 text-center">Moy. G</th>
                    <th className="p-3 text-center">Moy. F</th>
                    <th className="p-3 text-center">Taux G ≥10</th>
                    <th className="p-3 text-center">Taux F ≥10</th>
                    <th className="p-3 text-center">Indice parité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {classes.map(cls => {
                    const cG = eleves.filter(e => e.classeId === cls.id && e.sexe === 'M' && (e.statut??'actif')==='actif');
                    const cF = eleves.filter(e => e.classeId === cls.id && e.sexe === 'F' && (e.statut??'actif')==='actif');
                    const moyG = cG.map(s=>getMoyenneAnnuelle(s.id)).filter(m=>m>0);
                    const moyF = cF.map(s=>getMoyenneAnnuelle(s.id)).filter(m=>m>0);
                    const avgG2 = moyG.length > 0 ? parseFloat((moyG.reduce((a,b)=>a+b,0)/moyG.length).toFixed(2)) : 0;
                    const avgF2 = moyF.length > 0 ? parseFloat((moyF.reduce((a,b)=>a+b,0)/moyF.length).toFixed(2)) : 0;
                    const tauxG2 = moyG.length > 0 ? Math.round(moyG.filter(m=>m>=10).length/moyG.length*100) : 0;
                    const tauxF2 = moyF.length > 0 ? Math.round(moyF.filter(m=>m>=10).length/moyF.length*100) : 0;
                    // Indice de parité = taux réussite filles / taux réussite garçons
                    const ip = tauxG2 > 0 ? (tauxF2 / tauxG2).toFixed(2) : '—';
                    const ipNum = tauxG2 > 0 ? tauxF2 / tauxG2 : 0;
                    return (
                      <tr key={cls.id} className="hover:bg-white/3">
                        <td className="p-3 font-bold text-white">{cls.nom}</td>
                        <td className="p-3 text-center text-blue-400 font-mono">{cG.length}</td>
                        <td className="p-3 text-center text-pink-400 font-mono">{cF.length}</td>
                        <td className="p-3 text-center font-mono text-blue-300">{avgG2 > 0 ? avgG2 : '—'}</td>
                        <td className="p-3 text-center font-mono text-pink-300">{avgF2 > 0 ? avgF2 : '—'}</td>
                        <td className="p-3 text-center font-mono text-blue-400">{tauxG2 > 0 ? tauxG2+'%' : '—'}</td>
                        <td className="p-3 text-center font-mono text-pink-400">{tauxF2 > 0 ? tauxF2+'%' : '—'}</td>
                        <td className="p-3 text-center">
                          <span className={`font-bold font-mono text-[11px] ${ipNum >= 1 ? 'text-emerald-400' : ipNum >= 0.8 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {ip}
                          </span>
                          <div className="text-[8px] text-slate-600">{ipNum >= 1 ? 'Parité atteinte' : ipNum >= 0.8 ? 'Proche parité' : 'Déficit filles'}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════ TABLEAU DE BORD FINANCIER ══════════════════════════════════════════ */}
      {tab === 'finances' && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:'Total prévu',    val: financeStats.totalPrevu.toLocaleString('fr-FR')+' FCFA',    color:'text-white'    },
              { label:'Total encaissé', val: financeStats.totalEncaisse.toLocaleString('fr-FR')+' FCFA', color:'text-emerald-400' },
              { label:'Manque global',  val: Math.max(0, financeStats.totalPrevu - financeStats.totalEncaisse).toLocaleString('fr-FR')+' FCFA', color:'text-rose-400' },
              { label:'Recouvrement',   val: financeStats.totalPrevu > 0 ? Math.round(financeStats.totalEncaisse/financeStats.totalPrevu*100)+'%' : '0%', color:'text-orange-400' },
            ].map(k => (
              <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <div className={`text-lg font-bold ${k.color}`}>{k.val}</div>
                <div className="text-[10px] text-slate-400 mt-1">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Encaissements par classe */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest mb-4">
                Encaissements vs Prévisions par Classe
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={financeStats.byClasse} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="classe" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} tickFormatter={v => (v/1000)+'k'} />
                  <Tooltip content={<CustomTooltip />} formatter={(v: any) => v.toLocaleString('fr-FR') + ' FCFA'} />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                  <Bar dataKey="Prévu"    fill="rgba(148,163,184,0.3)" radius={[3,3,0,0]} />
                  <Bar dataKey="Encaissé" fill={COLORS.emerald}        radius={[3,3,0,0]} />
                  <Bar dataKey="Manque"   fill={COLORS.rose}           radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Répartition modes de paiement */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest mb-4">
                Répartition par Mode de Paiement
              </h3>
              {financeStats.modeData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-500 text-xs italic">Aucun paiement enregistré.</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={financeStats.modeData} cx="50%" cy="50%" outerRadius={85}
                      dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                      labelLine={{ stroke: '#94a3b8', strokeWidth: 0.5 }}>
                      {financeStats.modeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} formatter={(v: any) => v.toLocaleString('fr-FR') + ' FCFA'} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Évolution mensuelle */}
          {financeStats.monthlyData.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest mb-4">
                Évolution Mensuelle des Encaissements
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={financeStats.monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="mois" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => (v/1000)+'k'} />
                  <Tooltip content={<CustomTooltip />} formatter={(v: any) => v.toLocaleString('fr-FR') + ' FCFA'} />
                  <Line type="monotone" dataKey="Encaissements" stroke={COLORS.emerald}
                    strokeWidth={2} dot={{ r: 4, fill: COLORS.emerald }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tableau taux recouvrement */}
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">Taux de Recouvrement par Classe</h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-black/30 text-slate-400 text-left">
                  <th className="p-3">Classe</th>
                  <th className="p-3 text-right">Prévu</th>
                  <th className="p-3 text-right">Encaissé</th>
                  <th className="p-3 text-right">Manque</th>
                  <th className="p-3">Recouvrement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {financeStats.byClasse.map(row => (
                  <tr key={row.classe} className="hover:bg-white/3">
                    <td className="p-3 font-bold text-white">{row.classe}</td>
                    <td className="p-3 text-right font-mono text-slate-300">{row.Prévu.toLocaleString('fr-FR')}</td>
                    <td className="p-3 text-right font-mono text-emerald-400">{row.Encaissé.toLocaleString('fr-FR')}</td>
                    <td className="p-3 text-right font-mono text-rose-400">{row.Manque.toLocaleString('fr-FR')}</td>
                    <td className="p-3 w-36">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div style={{ width: `${row.taux}%` }}
                            className={`h-full rounded-full ${row.taux >= 80 ? 'bg-emerald-500' : row.taux >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                        </div>
                        <span className="text-[10px] font-mono text-slate-300 w-8 text-right">{row.taux}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
