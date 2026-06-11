import React, { useState } from 'react';
import { useAppState } from '../stateContext';
import { FileText, Printer, ChevronRight, Bot, Sparkles, Check, CheckCircle2, Download } from 'lucide-react';
import { api, ApiError } from '../lib/api';

export const BulletinsModule: React.FC = () => {
  const { 
    classes, eleves, examens,
    getMoyenneEleve, getClassements, getRangParMatiere,
    parametres, cycles,
  } = useAppState();

  const [selectedClassId, setSelectedClassId] = useState('classe-tles');
  const [selectedExamId, setSelectedExamId] = useState('exam-t1');
  const [selectedEleveId, setSelectedEleveId] = useState('eleve-1');

  // AI loading and appreciation state variables
  const [aiAppreciation, setAiAppreciation] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [teacherAppreciationInput, setTeacherAppreciationInput] = useState('Excellent travail d’ensemble. Poursuivez ainsi.');

  // Group elements
  const activeClass = classes.find(c => c.id === selectedClassId);
  const classStudents = eleves.filter(e => e.classeId === selectedClassId);
  const activeStudent = eleves.find(e => e.id === selectedEleveId);

  // Computations
  const classRecords = getClassements(selectedClassId, selectedExamId);
  const studentRankObj = classRecords.find(r => r.eleveId === selectedEleveId);
  const studentGradesOverview = getMoyenneEleve(selectedEleveId, selectedExamId);

  // Trigger Gemini API appreciation generator
  const handleGenerateAiAppreciation = async () => {
    if (!activeStudent) return;
    setIsLoadingAi(true);
    setAiAppreciation('');

    try {
      const response = await fetch("/api/gemini/appreciations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: `${activeStudent.prenom} ${activeStudent.nom}`,
          average: studentGradesOverview.moyenne,
          subjectDetails: studentGradesOverview.details.map(d => ({
            mNom: d.mNom,
            coef: d.coef,
            moyMatiere: d.moyMatiere
          }))
        }),
      });

      if (!response.ok) throw new Error("Erreur serveur d'IA");
      const data = await response.json();
      let appr = '';
      if (data.appreciation) {
        appr = data.appreciation;
        if (data.conseil) appr += '\n\n' + data.conseil;
      } else {
        appr = data.text ?? 'Résultats satisfaisants.';
      }
      setAiAppreciation(appr);
      setTeacherAppreciationInput(appr);
    } catch (err: unknown) {
      console.error(err);
      // Fallback
      setAiAppreciation(`[Aperçu Local] Très bon trimestre pour ${activeStudent.prenom}. Les résultats sont réguliers et encourageants.`);
      setTeacherAppreciationInput(`Très bon trimestre pour ${activeStudent.prenom}. Les résultats sont réguliers et encourageants.`);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const handleDownloadPdf = async () => {
    if (!activeStudent || !activeClass) return;
    setIsPdfLoading(true);
    setPdfError('');

    const classements = getClassements(selectedClassId, selectedExamId);
    const rang = classements.find(r => r.eleveId === selectedEleveId)?.rang;
    const examNom = examens.find(e => e.id === selectedExamId)?.nom ?? 'Examen';

    const classeCycle = cycles?.find(cy => cy.id === activeClass.cycleId);
    const payload = {
      eleve: {
        nom:      activeStudent.nom,
        prenom:   activeStudent.prenom,
        matricule:activeStudent.matricule,
        classeNom:activeClass.nom,
        sexe:     activeStudent.sexe,
        heuresAbsence:    activeStudent.heuresAbsence    ?? 0,
        heuresRetard:     activeStudent.heuresRetard     ?? 0,
        nbAvertissements: activeStudent.nbAvertissements ?? 0,
        nbBlames:         activeStudent.nbBlames         ?? 0,
      },
      examen: {
        nom:     examNom,
        periode: parametres?.activeAnneeScolaireId || '2025-2026',
      },
      ecole: {
        nom:                    parametres?.nomEtablissement    ?? '',
        adresse:                parametres?.adresse             ?? '',
        ville:                  parametres?.ville,
        pays:                   parametres?.pays,
        boitePostale:           parametres?.boitePostale,
        devise:                 parametres?.devise              ?? 'XOF',
        logoBlob:               parametres?.logoBlob,
        signatureDirecteurBlob: parametres?.signatureDirecteurBlob,
        cachetOfficielBlob:     parametres?.cachetOfficielBlob,
        ministere:              classeCycle?.ministere,
        directionRegionale:     classeCycle?.directionRegionale,
        inspectionEnseignement: classeCycle?.inspectionEnseignement,
      },
      details: studentGradesOverview.details.map(d => ({
        mNom:       d.mNom,
        coef:       d.coef,
        notesVal:   d.notesVal,
        moyMatiere: d.moyMatiere,
        rangMatiere: undefined as number | undefined,
      })),
      moyenne:      studentGradesOverview.moyenne,
      rang:         rang ?? 0,
      totalEleves:  classStudents.length,
      appreciation: teacherAppreciationInput,
    };

    try {
      const blob = await api.downloadPdf('/api/bulletins/pdf', payload);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulletin_${activeStudent.nom}_${examNom.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof Error ? (err instanceof Error ? err.message : String(err)) : 'Erreur inconnue.';
      if (msg.includes('501') || msg.includes('non disponible')) {
        setPdfError('Module PDF serveur non disponible — impression navigateur utilisée.');
        window.print();
      } else {
        setPdfError(`Erreur PDF : ${msg}`);
      }
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Switch student helper
  const selectDifferentStudent = (id: string) => {
    setSelectedEleveId(id);
    setAiAppreciation('');
  };

  return (
    <div className="space-y-6" id="bulletins-module-main">
      
      {/* Settings Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 backdrop-blur-xl bg-white/5 border border-white/10 p-5 rounded-3xl shadow-lg" id="bulletins-selector-bar">
        <div className="space-y-1 text-xs font-semibold">
          <span className="text-slate-400">Choisir une classe :</span>
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              // Auto select first student on class shift
              const firstSt = eleves.find(st => st.classeId === e.target.value);
              if (firstSt) setSelectedEleveId(firstSt.id);
            }}
            className="w-full border border-white/10 bg-black/45 text-slate-200 p-2.5 rounded-xl outline-none font-bold"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id} className="bg-slate-900 border-none">{c.nom} ({c.niveau})</option>
            ))}
          </select>
        </div>

        <div className="space-y-1 text-xs font-semibold">
          <span className="text-slate-400">Période du Bulletin :</span>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full border border-white/10 bg-black/45 text-slate-200 p-2.5 rounded-xl outline-none font-bold"
          >
            {examens.map(ex => (
              <option key={ex.id} value={ex.id} className="bg-slate-900 border-none">{ex.nom}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1 text-xs font-semibold">
          <span className="text-slate-400">Sélectionner l’élève :</span>
          <select
            value={selectedEleveId}
            onChange={(e) => selectDifferentStudent(e.target.value)}
            className="w-full border border-white/10 bg-black/45 text-orange-400 p-2.5 rounded-xl outline-none font-bold"
          >
            {classStudents.map(st => (
              <option key={st.id} value={st.id} className="bg-slate-900 border-none text-slate-200">{st.nom} {st.prenom}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="bulletins-body-pane">
        
        {/* Class Students Sidebar selection quick list */}
        <div className="lg:col-span-3 space-y-2 max-h-[600px] overflow-y-auto pr-1" id="students-sidebar-picker">
          <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest border-b border-white/10 pb-2 mb-2">Liste des élèves</h4>
          {classStudents.map(st => {
            const isSelected = st.id === selectedEleveId;
            const res = getMoyenneEleve(st.id, selectedExamId);
            return (
              <button
                key={st.id}
                onClick={() => selectDifferentStudent(st.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                  isSelected 
                    ? 'bg-orange-500 border-orange-500/25 text-white shadow-md shadow-orange-950/15' 
                    : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">{st.nom} {st.prenom}</div>
                  <div className={`text-[9px] font-mono ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                    Mat: {st.matricule}
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isSelected 
                    ? 'bg-black/20 text-white' 
                    : res.moyenne >= 10 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {res.moyenne}/20
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Report card bulletin sheet printable visual area */}
        {activeStudent ? (
          <div className="lg:col-span-9 space-y-6" id="bulletin-document-container">
            
            {/* Top triggers */}
            <div className="flex justify-between items-center flex-wrap gap-2" id="document-actions">
              <span className="text-[11px] text-amber-600 font-bold bg-amber-50 px-3 py-1.5 rounded-full border border-amber-250 animate-pulse flex items-center space-x-1.5">
                <Sparkles size={11} />
                <span>Prêt pour émission du bulletin final</span>
              </span>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleGenerateAiAppreciation}
                  disabled={isLoadingAi}
                  className="px-3 py-2 bg-blue-950/20 text-blue-700 hover:bg-blue-950/30 font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer border border-blue-950/10"
                  id="gemini-appraisal"
                >
                  <Bot size={14} className={isLoadingAi ? "animate-spin" : ""} />
                  <span>{isLoadingAi ? "Analyse IA..." : "Suggérer appréciation par l'IA"}</span>
                </button>
                
                <button
                  onClick={handleDownloadPdf}
                  disabled={isPdfLoading}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-slate-950/10"
                  id="print-bulletin-btn"
                >
                  {isPdfLoading ? <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Download size={14} />}
                  <span>Imprimer bulletin</span>
                </button>
              </div>
            </div>

            {/* Simulated actual document */}
            <div className="bg-white border border-slate-300 p-8 rounded-xl shadow-md text-slate-800 space-y-6 print-container" id="printable-sheet-document">
              
              {/* Document Header school details */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 flex-wrap gap-4 text-xs">
                <div className="flex items-center space-x-3">
                  {parametres.logoBlob ? (
                    <img src={parametres.logoBlob} alt="School Logo" className="w-14 h-14 object-contain rounded-md" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-14 h-14 bg-orange-100 border border-orange-250 text-orange-600 rounded-lg flex items-center justify-center font-extrabold text-xs font-mono select-none">
                      Scolango
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-sm tracking-tight">{parametres.nomEtablissement.toUpperCase()}</h3>
                    <p className="text-[10px] text-slate-500 font-mono tracking-wider">{parametres.adresse}</p>
                    <p className="text-[10px] text-slate-500 font-medium font-semibold">République de Côte d'Ivoire | Union - Discipline - Travail</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="border-2 border-slate-900 p-2 font-mono font-bold bg-slate-50 inline-block">
                    BULLETIN TRIMESTRIEL
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono mt-1 font-bold">ANNÉE SCOLAIRE: 2025-2026</div>
                </div>
              </div>

              {/* Student identification metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg text-xs" id="identity-block">
                <div className="space-y-1">
                  <div>Nom & Prénoms: <strong className="text-slate-950 font-extrabold">{activeStudent.nom.toUpperCase()} {activeStudent.prenom}</strong></div>
                  <div>Matricule: <strong className="font-mono">{activeStudent.matricule}</strong></div>
                  <div>Né(e) le: <strong className="font-mono">{activeStudent.dateNaissance}</strong></div>
                  <div>Sexe: <strong>{activeStudent.sexe === 'M' ? 'Masculin' : 'Féminin'}</strong></div>
                </div>
                <div className="space-y-1 text-left md:text-right">
                  <div>Classe d'évaluation: <strong>{activeClass?.nom}</strong></div>
                  <div>Niveau: <span className="uppercase font-mono font-bold text-[10px] bg-slate-200 px-1 rounded">{activeClass?.niveau}</span></div>
                  <div>Période évaluée: <strong className="text-blue-800">{examens.find(ex => ex.id === selectedExamId)?.nom}</strong></div>
                  <div>Échelon de Rang: <strong className="bg-yellow-100 text-yellow-904 px-1.5 py-0.2 rounded">{studentRankObj?.rang || 1} / {classStudents.length} {studentRankObj?.rang === 1 ? '🥇' : '🥈'}</strong></div>
                </div>
              </div>

              {/* Grades Table List */}
              <div className="overflow-x-auto text-xs" id="grades-table-document">
                <table className="w-full text-left text-slate-800 border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[10px] uppercase font-bold text-slate-700">
                      <th className="p-2.5 border border-slate-301 border-slate-300">Intitulé de la matière de cours</th>
                      <th className="p-2.5 border border-slate-301 border-slate-300 text-center">Coef</th>
                      <th className="p-2.5 border border-slate-301 border-slate-300 text-center">Moyenne matière (/20)</th>
                      <th className="p-2.5 border border-slate-301 border-slate-300 text-center">Note Pondérée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {studentGradesOverview.details.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400 italic">Aucune note enregistrée</td>
                      </tr>
                    ) : (
                      studentGradesOverview.details.map((det, index) => {
                        return (
                          <tr key={index} className="hover:bg-slate-50/20">
                            <td className="p-2.5 border border-slate-300 font-bold text-slate-900">{det.mNom}</td>
                            <td className="p-2.5 border border-slate-300 text-center font-mono font-semibold">{det.coef}</td>
                            <td className={`p-2.5 border border-slate-300 text-center font-bold font-mono ${
                              det.moyMatiere >= 10 ? 'text-emerald-700' : 'text-rose-700'
                            }`}>{det.moyMatiere}/20</td>
                            <td className="p-2.5 border border-slate-300 text-center font-mono font-bold">
                              {(det.moyMatiere * det.coef).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* Total footer */}
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t border-slate-300">
                      <td className="p-2.5 border border-slate-300 text-right" colSpan={3}>MOYENNE GÉNÉRALE :</td>
                      <td className={`p-2.5 border border-slate-300 text-center font-mono text-sm ${
                        studentGradesOverview.moyenne >= 10 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                      }`}>
                        {studentGradesOverview.moyenne}/20
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Appraisal area from Council & Teachers */}
              <div className="border border-slate-300 rounded-lg p-5 bg-slate-100/30 text-xs text-slate-800 space-y-3" id="comments-box">
                <div className="flex items-center space-x-1 font-bold text-slate-900">
                  <span>Appréciation Générale du Conseil de Classe</span>
                  {aiAppreciation && (
                    <span className="text-[10px] text-blue-800 bg-blue-100 px-1.5 rounded flex items-center space-x-0.5 ml-2 font-semibold">
                      <Bot size={10} />
                      <span>Rédigé par IA</span>
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <textarea
                    value={teacherAppreciationInput}
                    onChange={(e) => setTeacherAppreciationInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 outline-none p-3 rounded-lg text-xs leading-relaxed font-medium"
                    rows={3}
                  />
                  <p className="text-[10px] text-slate-400">Cette appréciation sera enregistrée de manière définitive et figurera sur le bulletin imprimé officiel.</p>
                </div>
              </div>

              {/* Signature margins block */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold pt-6 text-slate-500" id="signature-margins">
                <div>
                  Le Professeur Principal
                  <p className="text-[10px] text-slate-400 mt-10">Signature & Cachet</p>
                </div>
                <div className="text-left md:text-right">
                  Le Directeur des Études
                  <p className="text-[10px] text-slate-400 mt-10">M. Bakary Traoré</p>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="lg:col-span-9 p-8 border border-dashed rounded-2xl flex items-center justify-center text-slate-400 text-xs italic">
            Aucun élève sélectionné.
          </div>
        )}

      </div>

    </div>
  );
};
