import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppState } from '../stateContext';
import { Bot, Send, Sparkles, User, AlertCircle, FileText, TrendingUp, Loader2 } from 'lucide-react';

interface Msg {
  id: string;
  role: 'user' | 'model';
  text: string;
}

// ─── Synthèse directeur ────────────────────────────────────────────────────────
interface SyntheseResult {
  bilan: string;
  pointsForts: string[];
  pointsAmeliorer: string[];
  recommandations: string;
  appreciation_generale: string;
}

const SyntheseDirecteur: React.FC = () => {
  const { classes, eleves, notes, examens, matieres, getMoyenneEleve, getMoyenneAnnuelle } = useAppState();

  const [selectedClass, setSelectedClass] = useState(classes[0]?.id ?? '');
  const [selectedExam,  setSelectedExam]  = useState(examens[0]?.id  ?? '');
  const [loading,       setLoading]       = useState(false);
  const [result,        setResult]        = useState<SyntheseResult | null>(null);
  const [error,         setError]         = useState('');

  const stats = useMemo(() => {
    const classStudents = eleves.filter(e => e.classeId === selectedClass && (e.statut ?? 'actif') === 'actif');
    if (!classStudents.length) return null;
    const moyennes = classStudents.map(s => getMoyenneEleve(s.id, selectedExam).moyenne).filter(m => m > 0);
    const moyClasse = moyennes.length > 0 ? parseFloat((moyennes.reduce((a,b)=>a+b,0)/moyennes.length).toFixed(2)) : 0;
    const admis = moyennes.filter(m => m >= 10).length;
    const redoublants = moyennes.filter(m => m >= 7 && m < 10).length;
    const exclus = moyennes.filter(m => m < 7).length;
    const tauxReussite = moyennes.length > 0 ? Math.round(admis / moyennes.length * 100) : 0;

    // Meilleure matière et matière en difficulté
    const classMatieres = matieres.filter(m => m.classeId === selectedClass);
    const matStats = classMatieres.map(m => {
      const mn = notes.filter(n => n.matiereId === m.id && n.examenId === selectedExam).map(n => n.valeur);
      const avg = mn.length > 0 ? mn.reduce((a,b)=>a+b,0)/mn.length : 0;
      return { nom: m.nom, avg };
    }).filter(m => m.avg > 0).sort((a,b) => b.avg - a.avg);

    return {
      totalEleves: classStudents.length,
      moyenneClasse: moyClasse,
      tauxReussite,
      admis,
      redoublants,
      exclus,
      meilleureMatiere: matStats[0]?.nom ?? '',
      matiereEnDifficulte: matStats[matStats.length - 1]?.nom ?? '',
    };
  }, [selectedClass, selectedExam, eleves, notes, matieres]);

  const handleGenerate = async () => {
    if (!stats) return;
    setLoading(true); setError(''); setResult(null);
    const cls  = classes.find(c => c.id === selectedClass);
    const exam = examens.find(e => e.id === selectedExam);

    try {
      const res = await fetch('/api/gemini/synthese', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classeNom:    cls?.nom ?? '',
          periode:      exam?.nom ?? '',
          ...stats,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  const appColor = (a: string) =>
    a === 'Très Satisfaisant' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    : a === 'Satisfaisant'    ? 'text-blue-400    bg-blue-500/10    border-blue-500/20'
    : a === 'Passable'        ? 'text-amber-400   bg-amber-500/10   border-amber-500/20'
    :                           'text-rose-400    bg-rose-500/10    border-rose-500/20';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Classe</label>
          <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setResult(null); }}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
            {classes.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.nom}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Période</label>
          <select value={selectedExam} onChange={e => { setSelectedExam(e.target.value); setResult(null); }}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500">
            {examens.map(ex => <option key={ex.id} value={ex.id} className="bg-slate-900">{ex.nom}</option>)}
          </select>
        </div>
      </div>

      {/* Aperçu des stats */}
      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { l:'Élèves',    v: stats.totalEleves,             c:'text-white'      },
            { l:'Moy. cls.', v: stats.moyenneClasse+'/20',     c:'text-orange-400' },
            { l:'Réussite',  v: stats.tauxReussite+'%',        c:'text-emerald-400'},
            { l:'Admis',     v: stats.admis,                   c:'text-emerald-400'},
            { l:'Redoub.',   v: stats.redoublants,             c:'text-amber-400'  },
            { l:'Exclus',    v: stats.exclus,                  c:'text-rose-400'   },
          ].map(k => (
            <div key={k.l} className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
              <div className={`text-sm font-bold font-mono ${k.c}`}>{k.v}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{k.l}</div>
            </div>
          ))}
        </div>
      )}

      <button onClick={handleGenerate} disabled={loading || !stats}
        className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/20">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
        <span>{loading ? 'Génération en cours…' : 'Générer la Synthèse IA du Conseil de Classe'}</span>
      </button>

      {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] p-3 rounded-xl">⚠ {error}</div>}

      {result && (
        <div className="space-y-3 animate-fade-in">
          {/* Appréciation générale */}
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wide">Synthèse générée par Gemini 2.0 Flash</h4>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${appColor(result.appreciation_generale)}`}>
              {result.appreciation_generale}
            </span>
          </div>

          {/* Bilan */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-[10px] font-bold text-orange-400 uppercase mb-2">Bilan global</div>
            <p className="text-xs text-slate-200 leading-relaxed">{result.bilan}</p>
          </div>

          {/* Points forts / axes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
              <div className="text-[10px] font-bold text-emerald-400 uppercase mb-2">✓ Points forts</div>
              <ul className="space-y-1">
                {result.pointsForts.map((p,i) => <li key={i} className="text-xs text-slate-200 flex items-start space-x-1.5"><span className="text-emerald-400 mt-0.5">·</span><span>{p}</span></li>)}
              </ul>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
              <div className="text-[10px] font-bold text-amber-400 uppercase mb-2">⚠ Axes d'amélioration</div>
              <ul className="space-y-1">
                {result.pointsAmeliorer.map((p,i) => <li key={i} className="text-xs text-slate-200 flex items-start space-x-1.5"><span className="text-amber-400 mt-0.5">·</span><span>{p}</span></li>)}
              </ul>
            </div>
          </div>

          {/* Recommandations */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
            <div className="text-[10px] font-bold text-blue-400 uppercase mb-2">📋 Recommandations pour la Direction</div>
            <p className="text-xs text-slate-200 leading-relaxed">{result.recommandations}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Module principal ─────────────────────────────────────────────────────────
type AiTab = 'chat' | 'synthese';

export const AiAssistantModule: React.FC = () => {
  const { currentUser } = useAppState();

  const [tab,        setTab]        = useState<AiTab>('chat');
  const [messages,   setMessages]   = useState<Msg[]>([{
    id: 'initial', role: 'model',
    text: `Bonjour ! Je suis l'**Assistant Pédagogique IA** de Scolango, propulsé par **Gemini 2.0 Flash**.\n\nJe peux vous aider avec :\n📚 Aide aux devoirs (sciences, maths, français, physique-chimie)\n📝 Rédaction d'appréciations de bulletins\n🎯 Conseils pédagogiques et idées de cours\n📋 Questions sur la gestion scolaire\n\nSélectionnez une suggestion ou posez votre question.`,
  }]);
  const [prompt,   setPrompt]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isDirecteur = ['admin', 'directeur'].includes(currentUser?.role ?? '');

  const SUGGESTIONS = [
    "Rédige 3 appréciations encourageantes pour élèves en difficulté scolaire 📝",
    "Explique le théorème de Pythagore avec un exemple concret niveau 4ème 📐",
    "Propose un plan de cours sur la photosynthèse pour une classe de 6ème 🌱",
    "Donne-moi 5 conseils pour motiver des élèves en manque de confiance 💡",
  ];

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(1).map(m => ({ role: m.role, text: m.text })),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages(prev => [...prev, { id: `m-${Date.now()}`, role: 'model', text: data.text ?? 'Pas de réponse.' }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`, role: 'model',
        text: `[Hors-ligne] Impossible de joindre le serveur IA. Vérifiez votre connexion et la clé GEMINI_API_KEY dans la configuration.`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header + tabs */}
      <div className="flex justify-between items-start border-b border-white/10 pb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <Bot size={16} className="text-orange-400" />
            <span>Assistant IA — Gemini 2.0 Flash</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Aide pédagogique, appréciations, synthèses de conseil de classe.</p>
        </div>
        <div className="flex space-x-1">
          {(['chat', 'synthese'] as AiTab[]).map(t => (
            (t === 'synthese' && !isDirecteur) ? null :
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                tab === t ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}>
              {t === 'chat' ? <><Bot size={11}/><span>Chat pédagogique</span></> : <><TrendingUp size={11}/><span>Synthèse Directeur</span></>}
            </button>
          ))}
        </div>
      </div>

      {/* ════ CHAT ════════════════════════════════════════════════════════════ */}
      {tab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Suggestions */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-200 border-b border-white/10 pb-2">
                <Sparkles size={13} className="text-orange-400" />
                <span>SUGGESTIONS</span>
              </div>
              <div className="space-y-2">
                {SUGGESTIONS.map((s,i) => (
                  <button key={i} onClick={() => sendMessage(s)} disabled={loading}
                    className="w-full text-left p-3 rounded-xl border border-white/5 bg-white/3 hover:bg-white/10 text-[11px] text-slate-200 transition-colors cursor-pointer leading-relaxed disabled:opacity-50">
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-orange-500/5 border border-orange-500/10 rounded-3xl p-4 space-y-2 text-[10px]">
              <div className="flex items-center space-x-1.5 text-orange-300 font-bold">
                <AlertCircle size={12} /><span>Détection automatique</span>
              </div>
              <p className="text-slate-400 leading-relaxed">Si un élève a une moyenne &lt; 10/20, l'IA peut générer des conseils pédagogiques personnalisés. Utilisez la fonctionnalité Appréciations dans le module Bulletins.</p>
            </div>
          </div>

          {/* Chat interface */}
          <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-3xl flex flex-col h-[580px] overflow-hidden">
            {/* Header */}
            <div className="bg-black/30 px-4 py-3 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center space-x-2.5">
                <div className="bg-gradient-to-br from-orange-500 to-red-600 p-1.5 rounded-lg">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white">Compagnon Pédagogique IA</div>
                  <div className="text-[9px] text-slate-400 font-mono">Gemini 2.0 Flash</div>
                </div>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">EN LIGNE</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/10">
              {messages.map(m => {
                const isModel = m.role === 'model';
                return (
                  <div key={m.id} className={`flex gap-2.5 max-w-[88%] ${isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isModel ? 'bg-orange-500/15 text-orange-400' : 'bg-white/10 text-slate-300'}`}>
                      {isModel ? <Bot size={12} /> : <User size={12} />}
                    </div>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed font-medium whitespace-pre-line ${
                      isModel ? 'bg-white/8 border border-white/10 text-slate-200' : 'bg-orange-500/10 border border-orange-500/20 text-orange-100'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className="flex gap-2.5 max-w-[60%] mr-auto">
                  <div className="w-6 h-6 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center">
                    <Bot size={12} />
                  </div>
                  <div className="bg-white/8 border border-white/10 px-4 py-2.5 rounded-2xl flex items-center space-x-1.5">
                    {[0,75,150].map(d => <span key={d} style={{ animationDelay:`${d}ms` }} className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce block" />)}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={e => { e.preventDefault(); sendMessage(prompt); }}
              className="border-t border-white/10 p-3 flex items-center space-x-2 bg-black/30">
              <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="Posez votre question pédagogique…" required
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500 placeholder-slate-500" />
              <button type="submit" disabled={loading || !prompt.trim()}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white p-2 rounded-xl cursor-pointer">
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ════ SYNTHÈSE DIRECTEUR ══════════════════════════════════════════════ */}
      {tab === 'synthese' && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <div className="flex items-center space-x-2 mb-5 border-b border-white/10 pb-3">
            <FileText size={14} className="text-orange-400" />
            <h3 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">
              Synthèse Analytique du Conseil de Classe — Réservé Direction
            </h3>
          </div>
          <SyntheseDirecteur />
        </div>
      )}
    </div>
  );
};
