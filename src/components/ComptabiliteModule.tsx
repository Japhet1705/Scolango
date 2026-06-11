import React, { useState } from 'react';
import { useAppState } from '../stateContext';
import { 
  CreditCard, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Printer, 
  User, 
  Search, 
  Filter, 
  Check, 
  X, 
  FileText, 
  Settings, 
  Clock, 
  BarChart3, 
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { Paiement, Eleve } from '../types';

export const ComptabiliteModule: React.FC = () => {
  const {
    eleves, classes, fraisScolaires, updateFraisScolaires,
    paiements, addPaiement, deletePaiement,
    currentUser, parametres, users,
  } = useAppState();

  // Helper permission for administrative and accounting roles (RBAC)
  const isComptableOrAdmin = currentUser?.role === 'comptable' || 
                             currentUser?.role === 'admin' || 
                             currentUser?.role === 'directeur' || 
                             currentUser?.role === 'secretaire';

  // Selected filters/states
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'students' | 'transactions' | 'impayes' | 'config'>('students');

  // Form states - Registration Payment
  const [showAddPayment, setShowAddPayment] = useState<boolean>(false);
  const [payEleveId, setPayEleveId] = useState<string>('');
  const [payMontant, setPayMontant] = useState<number>(0);
  const [payType, setPayType] = useState<'inscription' | 'scolarite' | 'autre'>('scolarite');
  const [payMode, setPayMode] = useState<'Wave' | 'Orange Money' | 'MTN' | 'Espèces' | 'Chèque' | 'Virement'>('Wave');
  const [payNotes, setPayNotes] = useState<string>('');

  // Form states - Fee Config
  const [editingFSClasseId, setEditingFSClasseId] = useState<string>('');
  const [fsScolarite, setFsScolarite] = useState<number>(120000);
  const [fsInscription, setFsInscription] = useState<number>(30000);

  // Receipt printed mode state
  const [printingPaiement, setPrintingPaiement] = useState<Paiement | null>(null);

  // Helper calculations
  const getStudentCosts = (student: Eleve) => {
    const config = fraisScolaires.find(f => f.classeId === student.classeId);
    return {
      inscription: config?.montantInscription ?? 30000,
      scolarite: config?.montantScolarite ?? 120000,
    };
  };

  const getStudentPayments = (studentId: string) => {
    const studentPays = paiements.filter(p => p.eleveId === studentId);
    const paidInscription = studentPays.filter(p => p.type === 'inscription').reduce((a, b) => a + b.montant, 0);
    const paidScolarite = studentPays.filter(p => p.type === 'scolarite').reduce((a, b) => a + b.montant, 0);
    const paidAutre = studentPays.filter(p => p.type === 'autre').reduce((a, b) => a + b.montant, 0);
    return {
      list: studentPays,
      inscription: paidInscription,
      scolarite: paidScolarite,
      autre: paidAutre,
      total: paidInscription + paidScolarite + paidAutre
    };
  };

  // Overall lists & stats
  const studentsWithStatus = eleves.map(student => {
    const costs = getStudentCosts(student);
    const pays = getStudentPayments(student.id);
    const classDetail = classes.find(c => c.id === student.classeId);

    const inscriptionComplete = pays.inscription >= costs.inscription;
    const scolariteComplete = pays.scolarite >= costs.scolarite;
    
    let status: 'solde' | 'partiel' | 'non_paye' = 'non_paye';
    if (inscriptionComplete && scolariteComplete) {
      status = 'solde';
    } else if (pays.total > 0) {
      status = 'partiel';
    }

    return {
      student,
      classDetail,
      costs,
      pays,
      status,
      inscriptionComplete,
      scolariteComplete
    };
  });

  // Filtered lists
  const filteredStudents = studentsWithStatus.filter(item => {
    const matchesClass = selectedClassId === 'all' || item.student.classeId === selectedClassId;
    const matchesSearch = 
      item.student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student.matricule.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const filteredPaiements = paiements.filter(p => {
    const student = eleves.find(e => e.id === p.eleveId);
    if (!student) return false;
    const matchesSearch = 
      student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.recuNumero.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClassId === 'all' || student.classeId === selectedClassId;
    return matchesSearch && matchesClass;
  });

  // Global accounting numbers
  const totalInscrits = eleves.length;
  const totalExpectation = studentsWithStatus.reduce((sum, item) => sum + item.costs.inscription + item.costs.scolarite, 0);
  const totalCollected = paiements.reduce((sum, p) => sum + p.montant, 0);
  const totalRestant = totalExpectation - totalCollected;
  const collectedPercentage = totalExpectation > 0 ? Math.round((totalCollected / totalExpectation) * 100) : 0;

  // Mode breakdown
  const paymentModesList: ('Wave' | 'Orange Money' | 'MTN' | 'Espèces' | 'Chèque' | 'Virement')[] = [
    'Wave', 'Orange Money', 'MTN', 'Espèces', 'Chèque', 'Virement'
  ];
  const modeBreakdown = paymentModesList.map(m => {
    const total = paiements.filter(p => p.modePaiement === m).reduce((sum, p) => sum + p.montant, 0);
    return { name: m, amount: total };
  });

  // Actions
  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payEleveId || payMontant <= 0) return;

    addPaiement({
      eleveId: payEleveId,
      montant: payMontant,
      type: payType,
      datePaiement: new Date().toISOString().substring(0, 10),
      modePaiement: payMode,
      caissierId: currentUser?.id || 'offline-caissier',
      notes: payNotes
    });

    setPayMontant(0);
    setPayNotes('');
    setShowAddPayment(false);
  };

  const handleOpenPaymentForStudent = (studentId: string) => {
    setPayEleveId(studentId);
    // Suggest expected outstanding sum
    const stItem = studentsWithStatus.find(s => s.student.id === studentId);
    if (stItem) {
      const remainingScolarite = Math.max(0, stItem.costs.scolarite - stItem.pays.scolarite);
      const remainingInscription = Math.max(0, stItem.costs.inscription - stItem.pays.inscription);
      
      if (remainingInscription > 0) {
        setPayType('inscription');
        setPayMontant(remainingInscription);
      } else {
        setPayType('scolarite');
        setPayMontant(remainingScolarite);
      }
    }
    setShowAddPayment(true);
  };

  const handleSaveClassCosts = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFSClasseId) return;

    updateFraisScolaires({
      classeId: editingFSClasseId,
      montantScolarite: fsScolarite,
      montantInscription: fsInscription
    });

    setEditingFSClasseId('');
  };

  const startEditCosts = (classeId: string) => {
    setEditingFSClasseId(classeId);
    const existing = fraisScolaires.find(f => f.classeId === classeId);
    setFsScolarite(existing?.montantScolarite ?? 120000);
    setFsInscription(existing?.montantInscription ?? 30000);
  };

  return (
    <div className="space-y-6" id="accounting-manager-main">
      
      {/* Module Title Banner */}
      <div className="flex justify-between items-center border-b border-white/10 pb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center space-x-2">
            <CreditCard size={18} className="text-orange-400 animate-pulse" />
            <span>Comptabilité & Frais Scolaires</span>
          </h2>
          <p className="text-xs text-slate-400">
            Enregistrez les paiements élèves, configurez les barèmes d'inscriptions et pilotez les versements caisse.
          </p>
        </div>
        <div className="flex space-x-2">
          {isComptableOrAdmin && (
            <button
              onClick={() => {
                if (eleves.length > 0) {
                  handleOpenPaymentForStudent(eleves[0].id);
                } else {
                  setShowAddPayment(true);
                }
              }}
              className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-all flex items-center space-x-1.5"
              id="btn-register-payment"
            >
              <Plus size={14} className="stroke-[2.5]" />
              <span>Enregistrer un Paiement</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="accounting-stats-grid">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-5 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <span className="text-[10px] text-orange-400 font-mono tracking-widest uppercase font-bold">TOTAL PRÉVU</span>
          <h3 className="text-xl font-extrabold text-white mt-1">{totalExpectation.toLocaleString('fr-FR')} <span className="text-[10px]">XOF</span></h3>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">{totalInscrits} élèves inscrits actifs</p>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-5 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase font-bold">CAISSE PERÇUE</span>
          <h3 className="text-xl font-extrabold text-emerald-400 mt-1">{totalCollected.toLocaleString('fr-FR')} <span className="text-[10px]">XOF</span></h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-lg">{collectedPercentage}% de recouvrement</span>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-5 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <span className="text-[10px] text-rose-400 font-mono tracking-widest uppercase font-bold">IMPAYÉS RESTANTS</span>
          <h3 className="text-xl font-extrabold text-rose-400 mt-1">{totalRestant.toLocaleString('fr-FR')} <span className="text-[10px]">XOF</span></h3>
          <p className="text-[10px] text-slate-400 mt-1">Échéancier en cours</p>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-5 rounded-3xl shadow-lg" id="collect-progress-card">
          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400 mb-1">
            <span>Taux global</span>
            <span>{collectedPercentage}%</span>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-emerald-500 rounded-full" style={{ width: `${collectedPercentage}%` }}></div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-[9px] font-mono text-slate-300 font-bold">
            <div className="p-1.5 bg-white/5 rounded-lg border border-white/5 text-center">
              <span>Inscription réglée</span>
              <p className="text-orange-400 mt-0.5">{paiements.filter(p=>p.type==='inscription').reduce((sum, p)=>sum+p.montant,0).toLocaleString('fr-FR')} FCFA</p>
            </div>
            <div className="p-1.5 bg-white/5 rounded-lg border border-white/5 text-center">
              <span>Scolarité réglée</span>
              <p className="text-emerald-400 mt-0.5">{paiements.filter(p=>p.type==='scolarite').reduce((sum, p)=>sum+p.montant,0).toLocaleString('fr-FR')} FCFA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-white/10" id="accounting-sub-tabs">
        <button
          onClick={() => setActiveSubTab('students')}
          className={`px-5 py-2.5 text-xs font-semibold uppercase flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'students' 
              ? 'border-orange-500 text-white bg-white/5 rounded-t-xl' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <User size={14} />
          <span>Élèves & États Financiers</span>
        </button>
        <button
          onClick={() => setActiveSubTab('transactions')}
          className={`px-5 py-2.5 text-xs font-semibold uppercase flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'transactions' 
              ? 'border-orange-500 text-white bg-white/5 rounded-t-xl' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Clock size={14} />
          <span>Journal de Caisse ({paiements.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('impayes')}
          className={`px-5 py-2.5 text-xs font-semibold uppercase flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'impayes'
              ? 'border-rose-500 text-white bg-white/5 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownRight size={14} />
          <span>Rapport Impayés</span>
        </button>
        <button
          onClick={() => setActiveSubTab('config')}
          className={`px-5 py-2.5 text-xs font-semibold uppercase flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'config' 
              ? 'border-orange-500 text-white bg-white/5 rounded-t-xl' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Settings size={14} />
          <span>Tarifs</span>
        </button>
      </div>

      {/* Filters selectors */}
      {activeSubTab !== 'config' && (
        <div className="backdrop-blur-xl bg-white/5 p-4 rounded-3xl border border-white/10 flex flex-wrap gap-4 items-center shadow-lg" id="accounting-selectors">
          <div className="space-y-1 text-xs font-semibold">
            <span className="text-slate-400">Filtrer par Classe :</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="border border-white/10 bg-black/45 text-white p-2 rounded-xl text-xs font-bold outline-none"
            >
              <option value="all" className="bg-slate-900 text-slate-205">Toutes les classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">{c.nom} ({c.niveau})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 text-xs font-semibold flex-1 min-w-[200px]">
            <span className="text-slate-400">Recherche (Élève, Reçu, Matricule) :</span>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: Jean-Luc, REC-2025... "
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-white/10 bg-black/45 text-white rounded-xl text-xs font-bold outline-none placeholder-slate-500 focus:border-orange-500/50 transition-all"
              />
              <Search className="absolute left-2.5 top-2.5 text-slate-500" size={14} />
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE SUB TAB CONTENT: STUDENTS */}
      {activeSubTab === 'students' && (
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-lg p-6 space-y-4" id="accounting-students-grid">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" id="accounting-students-table">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold">
                  <th className="pb-3 pl-2">Matricule</th>
                  <th className="pb-3">Élève</th>
                  <th className="pb-3">Classe</th>
                  <th className="pb-3 text-right">Inscription (Payé/Tarif)</th>
                  <th className="pb-3 text-right">Scolarité (Payé/Tarif)</th>
                  <th className="pb-3 text-right">Versement Total</th>
                  <th className="pb-3 text-center">Statut</th>
                  <th className="pb-3 text-right pr-2">Actions comptables</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                      Aucun élève ne correspond à votre filtre de comptabilité.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(({ student, classDetail, costs, pays, status, inscriptionComplete, scolariteComplete }) => {
                    const remaining = (costs.inscription + costs.scolarite) - pays.total;
                    
                    return (
                      <tr key={student.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 pl-2 font-mono font-bold text-slate-400">{student.matricule}</td>
                        <td className="py-3.5">
                          <div className="font-extrabold text-white text-xs">{student.prenom} {student.nom}</div>
                          {student.parentNom && (
                            <div className="text-[10px] text-slate-400">Par: {student.parentNom} • {student.parentContact}</div>
                          )}
                        </td>
                        <td className="py-3.5 font-bold">
                          <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-slate-300">
                            {classDetail?.nom || 'Sans classe'}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-bold">
                          <span className={inscriptionComplete ? 'text-emerald-400' : 'text-slate-400'}>
                            {pays.inscription.toLocaleString('fr-FR')}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]"> / {costs.inscription.toLocaleString('fr-FR')}</span>
                        </td>
                        <td className="py-3.5 text-right font-bold">
                          <span className={scolariteComplete ? 'text-emerald-400' : 'text-slate-400'}>
                            {pays.scolarite.toLocaleString('fr-FR')}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]"> / {costs.scolarite.toLocaleString('fr-FR')}</span>
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold text-orange-400">
                          {pays.total.toLocaleString('fr-FR')} FCFA
                          {remaining > 0 && (
                            <div className="text-[9px] text-rose-400">Reste: {remaining.toLocaleString('fr-FR')} FCFA</div>
                          )}
                        </td>
                        <td className="py-3.5 text-center">
                          {status === 'solde' && (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase inline-flex items-center space-x-1">
                              <Check size={10} />
                              <span>Soldé</span>
                            </span>
                          )}
                          {status === 'partiel' && (
                            <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase inline-flex items-center space-x-1">
                              <Clock size={10} />
                              <span>Partiel</span>
                            </span>
                          )}
                          {status === 'non_paye' && (
                            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase inline-flex items-center space-x-1">
                              <X size={10} />
                              <span>Non Payé</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <div className="flex items-center justify-end space-x-1.5">
                            {isComptableOrAdmin && status !== 'solde' && (
                              <button
                                onClick={() => handleOpenPaymentForStudent(student.id)}
                                className="px-2 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-bold text-[10px] transition-all cursor-pointer flex items-center space-x-0.5"
                                title="Enregistrer un nouveau paiement pour cet élève"
                              >
                                <Plus size={10} />
                                <span>Payer</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                // Show all receipts details component/drawer
                                setActiveSubTab('transactions');
                                setSearchTerm(student.nom);
                              }}
                              className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center space-x-0.5"
                              title="Historique des paiements de cet élève"
                            >
                              <FileText size={10} />
                              <span>Détails</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ACTIVE SUB TAB CONTENT: TRANSACTIONS JOURNAL */}
      {activeSubTab === 'transactions' && (
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-lg p-6 space-y-4" id="accounting-journal-tab">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <h3 className="font-extrabold text-xs text-white uppercase font-mono tracking-wider">
              Enregistrements de paiements de scolarité
            </h3>
            <span className="text-[10px] font-bold bg-white/5 text-slate-400 px-2.5 py-1 border border-white/10 rounded-lg">
              {filteredPaiements.length} versements enregistrés
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" id="accounting-journal-table">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold">
                  <th className="pb-3 pl-2">N° Reçu</th>
                  <th className="pb-3">Élève bénéficiaire</th>
                  <th className="pb-3">Date de Versement</th>
                  <th className="pb-3">Catégorie</th>
                  <th className="pb-3">Mode</th>
                  <th className="pb-3 text-right">Montant Perçu</th>
                  <th className="pb-3">Remarques / Caisse</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPaiements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                      Aucune transaction trouvée sur ce journal ou aucun reçu correspondant.
                    </td>
                  </tr>
                ) : (
                  filteredPaiements.map((p) => {
                    const student = eleves.find(e => e.id === p.eleveId);
                    const classDetail = classes.find(c => c.id === student?.classeId);
                    
                    return (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 pl-2 font-mono font-bold text-orange-400">{p.recuNumero}</td>
                        <td className="py-3.5">
                          {student ? (
                            <div>
                              <span className="font-extrabold text-white text-xs">{student.prenom} {student.nom}</span>
                              <span className="text-[10px] text-slate-400 block">{classDetail?.nom} • {student.matricule}</span>
                            </div>
                          ) : (
                            <span className="text-red-400 font-semibold text-xs">[Élève Supprimé]</span>
                          )}
                        </td>
                        <td className="py-3.5 font-mono text-slate-300 font-semibold">{p.datePaiement}</td>
                        <td className="py-3.5 capitalize font-medium">
                          {p.type === 'inscription' && (
                            <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-lg font-bold">
                              Frais Inscription
                            </span>
                          )}
                          {p.type === 'scolarite' && (
                            <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-bold">
                              Frais Scolarité
                            </span>
                          )}
                          {p.type === 'autre' && (
                            <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-lg font-bold">
                              Autre versement
                            </span>
                          )}
                        </td>
                        <td className="py-3.5">
                          <span className="bg-white/5 border border-white/5 px-2 py-1 rounded-md text-slate-300 text-[10px] font-mono">
                            {p.modePaiement}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-mono font-extrabold text-emerald-400">
                          {p.montant.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="py-3.5 text-slate-400 italic text-[11px] max-w-[200px] truncate" title={p.notes}>
                          {p.notes || "Versement standard caisse"}
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setPrintingPaiement(p)}
                              className="p-1 px-2 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:opacity-90 transition-all font-bold text-[10.5px] cursor-pointer flex items-center space-x-1"
                              title="Imprimer / Télécharger un reçu fiscal académique"
                            >
                              <Printer size={11} />
                              <span>Reçu</span>
                            </button>
                            {isComptableOrAdmin && (
                              <button
                                onClick={() => {
                                  if (confirm("Voulez-vous vraiment annuler ce versement de caisse ? Cette opération auditera le système.")) {
                                    deletePaiement(p.id);
                                  }
                                }}
                                className="p-1 hover:bg-rose-500/10 hover:text-rose-500 text-slate-500 border border-transparent hover:border-rose-500/20 rounded-lg transition-all cursor-pointer"
                                title="Annuler ce paiement"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ACTIVE SUB TAB CONTENT: CONFIG COSTS GRID */}
      {activeSubTab === 'config' && (
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-lg p-6 space-y-6" id="accounting-config-tab">
          
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <div>
              <h3 className="font-extrabold text-xs text-white uppercase font-mono tracking-wider flex items-center space-x-1">
                <Settings size={14} className="text-orange-400" />
                <span>Paramétrage des coûts d'inscription par niveau d'élèves</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Définissez les frais obligatoires par classe. Ces paramètres ajustent dynamiquement les totaux à encaisser par élève.
              </p>
            </div>
          </div>

          {editingFSClasseId && (
            <form onSubmit={handleSaveClassCosts} className="p-5 border border-orange-500/20 bg-orange-500/5 rounded-2xl animate-fade-in space-y-4" id="form-edit-costs">
              <div className="text-xs text-orange-400 font-mono font-bold uppercase flex items-center space-x-1.5">
                <Sparkles size={14} />
                <span>Modification du tarif de scolarité pour : {classes.find(c => c.id === editingFSClasseId)?.nom}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-xs font-semibold">
                  <label className="text-slate-300">Frais d'Inscription (Mandatoires au matricule) :</label>
                  <input
                    type="number"
                    value={fsInscription}
                    onChange={(e) => setFsInscription(parseInt(e.target.value) || 0)}
                    className="w-full border border-white/10 p-2.5 rounded-xl bg-black/45 text-white font-mono font-bold outline-none"
                  />
                </div>
                <div className="space-y-1 text-xs font-semibold">
                  <label className="text-slate-300">Frais Annuels de Scolarité :</label>
                  <input
                    type="number"
                    value={fsScolarite}
                    onChange={(e) => setFsScolarite(parseInt(e.target.value) || 0)}
                    className="w-full border border-white/10 p-2.5 rounded-xl bg-black/45 text-white font-mono font-bold outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => setEditingFSClasseId('')}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 transition-all cursor-pointer font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-xl text-white transition-all shadow-lg cursor-pointer font-bold"
                >
                  Valider le Barème
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="config-barreaux-grid">
            {classes.map((cls) => {
              const currentConfig = fraisScolaires.find(f => f.classeId === cls.id);
              const totalCost = (currentConfig?.montantInscription ?? 30000) + (currentConfig?.montantScolarite ?? 120000);
              
              return (
                <div key={cls.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 hover:border-orange-500/30 transition-all flex flex-col justify-between" id={`frais-config-card-${cls.id}`}>
                  <div className="space-y-1.5">
                    <span className="text-[10px] bg-white/10 text-orange-400 font-bold px-2.5 py-0.5 rounded-xl uppercase">
                      Niveau {cls.niveau}
                    </span>
                    <h4 className="text-sm font-extrabold text-white">{cls.nom}</h4>
                  </div>

                  <div className="divide-y divide-white/5 text-xs font-semibold">
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Droit d'inscription</span>
                      <span className="text-white font-mono">{(currentConfig?.montantInscription ?? 30000).toLocaleString('fr-FR')} XOF</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Scolarité d'étude</span>
                      <span className="text-white font-mono">{(currentConfig?.montantScolarite ?? 120000).toLocaleString('fr-FR')} XOF</span>
                    </div>
                    <div className="py-2.5 flex justify-between text-orange-400 font-bold text-xs">
                      <span>Total Annuel</span>
                      <span className="font-mono">{totalCost.toLocaleString('fr-FR')} XOF</span>
                    </div>
                  </div>

                  {isComptableOrAdmin && (
                    <button
                      onClick={() => startEditCosts(cls.id)}
                      className="w-full mt-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/20 text-slate-300 font-bold text-[10.5px] rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <span>Modifier Barème</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ═══ ONGLET RAPPORT IMPAYÉS ═══════════════════════════════════════════ */}
      {activeSubTab === 'impayes' && (() => {
        // Calcul des impayés par classe
        const impayesParClasse = classes.map(cls => {
          const elevesCls = studentsWithStatus.filter(s => s.student.classeId === cls.id);
          const nonSoldes = elevesCls.filter(s => s.status !== 'solde');
          const manqueTotal = nonSoldes.reduce((acc, s) => {
            const restInscr = Math.max(0, s.costs.inscription - s.pays.inscription);
            const restScol  = Math.max(0, s.costs.scolarite  - s.pays.scolarite);
            return acc + restInscr + restScol;
          }, 0);
          const totalPrevu = elevesCls.reduce((acc, s) => acc + s.costs.inscription + s.costs.scolarite, 0);
          const totalEncaisse = elevesCls.reduce((acc, s) => acc + s.pays.total, 0);
          return { cls, nonSoldes, manqueTotal, totalPrevu, totalEncaisse, tauxRecouvrement: totalPrevu > 0 ? Math.round(totalEncaisse / totalPrevu * 100) : 0 };
        }).filter(x => x.nonSoldes.length > 0 || x.cls);

        const grandManque = impayesParClasse.reduce((s, x) => s + x.manqueTotal, 0);
        const grandPrevu  = impayesParClasse.reduce((s, x) => s + x.totalPrevu, 0);
        const grandEncaisse = impayesParClasse.reduce((s, x) => s + x.totalEncaisse, 0);

        const elevesFiltres = studentsWithStatus
          .filter(s => {
            const matchCls = selectedClassId === 'all' || s.student.classeId === selectedClassId;
            const matchQ   = !searchTerm || s.student.nom.toLowerCase().includes(searchTerm.toLowerCase()) || s.student.prenom.toLowerCase().includes(searchTerm.toLowerCase());
            return matchCls && matchQ && s.status !== 'solde';
          })
          .sort((a, b) => {
            const remA = Math.max(0, a.costs.scolarite + a.costs.inscription - a.pays.total);
            const remB = Math.max(0, b.costs.scolarite + b.costs.inscription - b.pays.total);
            return remB - remA;
          });

        return (
          <div className="space-y-4">
            {/* KPIs Impayés */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-rose-400">{grandManque.toLocaleString('fr-FR')}</div>
                <div className="text-[10px] text-rose-300 uppercase font-mono mt-1">FCFA manque à gagner</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{studentsWithStatus.filter(s => s.status !== 'solde').length}</div>
                <div className="text-[10px] text-slate-400 uppercase font-mono mt-1">élèves non soldés</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">{studentsWithStatus.filter(s => s.status === 'partiel').length}</div>
                <div className="text-[10px] text-slate-400 uppercase font-mono mt-1">paiements partiels</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">{grandPrevu > 0 ? Math.round(grandEncaisse / grandPrevu * 100) : 0}%</div>
                <div className="text-[10px] text-slate-400 uppercase font-mono mt-1">taux de recouvrement global</div>
              </div>
            </div>

            {/* Récapitulatif par classe */}
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-[11px] font-bold text-rose-400 uppercase tracking-widest">Synthèse par Classe — Manque à Gagner</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-black/30 text-slate-400 text-left">
                      <th className="p-3 font-semibold">Classe</th>
                      <th className="p-3 text-center font-semibold">Élèves inscrits</th>
                      <th className="p-3 text-center font-semibold">Non soldés</th>
                      <th className="p-3 text-right font-semibold">Prévu (FCFA)</th>
                      <th className="p-3 text-right font-semibold">Encaissé (FCFA)</th>
                      <th className="p-3 text-right font-semibold text-rose-400">Manque (FCFA)</th>
                      <th className="p-3 text-center font-semibold">Recouvrement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {impayesParClasse.map(({ cls, nonSoldes, manqueTotal, totalPrevu, totalEncaisse, tauxRecouvrement }) => (
                      <tr key={cls.id} className="hover:bg-white/3">
                        <td className="p-3 font-bold text-white">{cls.nom}</td>
                        <td className="p-3 text-center font-mono">{studentsWithStatus.filter(s => s.student.classeId === cls.id).length}</td>
                        <td className="p-3 text-center">
                          <span className={`font-bold font-mono ${nonSoldes.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{nonSoldes.length}</span>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-300">{totalPrevu.toLocaleString('fr-FR')}</td>
                        <td className="p-3 text-right font-mono text-emerald-400">{totalEncaisse.toLocaleString('fr-FR')}</td>
                        <td className="p-3 text-right font-mono font-bold text-rose-400">{manqueTotal.toLocaleString('fr-FR')}</td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div style={{ width: `${tauxRecouvrement}%` }} className="h-full bg-emerald-500 rounded-full" />
                            </div>
                            <span className="text-[10px] font-mono text-slate-300 w-8 text-right">{tauxRecouvrement}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {/* Ligne totaux */}
                    <tr className="border-t-2 border-white/20 bg-white/5 font-bold">
                      <td className="p-3 text-orange-400 uppercase text-[10px]">TOTAL GLOBAL</td>
                      <td className="p-3 text-center font-mono text-white">{studentsWithStatus.length}</td>
                      <td className="p-3 text-center font-mono text-rose-400">{studentsWithStatus.filter(s => s.status !== 'solde').length}</td>
                      <td className="p-3 text-right font-mono text-slate-200">{grandPrevu.toLocaleString('fr-FR')}</td>
                      <td className="p-3 text-right font-mono text-emerald-400">{grandEncaisse.toLocaleString('fr-FR')}</td>
                      <td className="p-3 text-right font-mono text-rose-400 text-sm">{grandManque.toLocaleString('fr-FR')}</td>
                      <td className="p-3 text-center font-mono text-slate-300">{grandPrevu > 0 ? Math.round(grandEncaisse / grandPrevu * 100) : 0}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Liste détaillée des élèves non soldés */}
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-[11px] font-bold text-rose-400 uppercase tracking-widest">
                  Liste des Élèves Non Soldés ({elevesFiltres.length})
                </h3>
                <span className="text-[10px] text-slate-400">Triés par montant restant décroissant</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-black/30 text-slate-400 text-left">
                      <th className="p-3 font-semibold">Élève</th>
                      <th className="p-3 font-semibold">Classe</th>
                      <th className="p-3 font-semibold">Parent / Contact</th>
                      <th className="p-3 text-right font-semibold">Reste Inscr.</th>
                      <th className="p-3 text-right font-semibold">Reste Scol.</th>
                      <th className="p-3 text-right font-semibold text-rose-400">Total Dû</th>
                      <th className="p-3 text-center font-semibold">Statut</th>
                      <th className="p-3 text-center font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {elevesFiltres.length === 0 && (
                      <tr><td colSpan={8} className="py-10 text-center text-slate-500 italic">Aucun impayé trouvé avec ces filtres.</td></tr>
                    )}
                    {elevesFiltres.map(({ student, classDetail, costs, pays, status }) => {
                      const restInscr = Math.max(0, costs.inscription - pays.inscription);
                      const restScol  = Math.max(0, costs.scolarite  - pays.scolarite);
                      const totalDu   = restInscr + restScol;
                      return (
                        <tr key={student.id} className="hover:bg-white/3">
                          <td className="p-3">
                            <div className="font-bold text-white">{student.prenom} {student.nom}</div>
                            <div className="text-[9px] text-slate-500 font-mono">{student.matricule}</div>
                          </td>
                          <td className="p-3 text-slate-300">{classDetail?.nom ?? '—'}</td>
                          <td className="p-3 text-slate-400 text-[10px]">
                            {student.parentNom ?? '—'}<br/>
                            <span className="font-mono">{student.parentContact ?? ''}</span>
                          </td>
                          <td className="p-3 text-right font-mono text-[11px]">
                            <span className={restInscr > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                              {restInscr > 0 ? restInscr.toLocaleString('fr-FR') : '✓'}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-[11px]">
                            <span className={restScol > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                              {restScol > 0 ? restScol.toLocaleString('fr-FR') : '✓'}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-400 text-sm">
                            {totalDu.toLocaleString('fr-FR')} FCFA
                          </td>
                          <td className="p-3 text-center">
                            {status === 'partiel' ? (
                              <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-full">Partiel</span>
                            ) : (
                              <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-bold px-2 py-0.5 rounded-full">Non payé</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleOpenPaymentForStudent(student.id)}
                              className="text-[9px] bg-orange-500 hover:bg-orange-600 text-white font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                            >
                              Encaisser
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DIALOG POPUP MODAL: REGISTER TRANSACTION FORM */}
      {showAddPayment && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[100] backdrop-blur-md p-4 animate-fade-in" id="add-payment-modal-overlay">
          <div className="backdrop-blur-xl bg-[#090b11] border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setShowAddPayment(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer bg-white/5 rounded-full p-1 border border-white/5 transition-all"
            >
              <X size={16} />
            </button>

            <div className="font-extrabold text-sm text-orange-400 flex items-center space-x-2 uppercase font-mono tracking-wider border-b border-white/10 pb-3 mb-4">
              <CreditCard size={16} />
              <span>Saisir un versement caisse (Reçu Scolarité)</span>
            </div>

            <form onSubmit={handleRegisterPayment} className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Élève bénéficiaire :</label>
                <select 
                  value={payEleveId} 
                  onChange={(e) => {
                    const id = e.target.value;
                    setPayEleveId(id);
                    const stItem = studentsWithStatus.find(s => s.student.id === id);
                    if (stItem) {
                      const remScol = Math.max(0, stItem.costs.scolarite - stItem.pays.scolarite);
                      const remIns = Math.max(0, stItem.costs.inscription - stItem.pays.inscription);
                      if (remIns > 0) {
                        setPayType('inscription');
                        setPayMontant(remIns);
                      } else {
                        setPayType('scolarite');
                        setPayMontant(remScol);
                      }
                    }
                  }} 
                  className="w-full border border-white/10 p-2.5 rounded-xl bg-black/45 text-white font-bold outline-none"
                  required
                >
                  <option value="" className="bg-slate-900 text-slate-400">Sélectionner un élève</option>
                  {eleves.map(el => {
                    const cls = classes.find(c => c.id === el.classeId);
                    return <option key={el.id} value={el.id} className="bg-slate-900 text-slate-200">{el.nom} {el.prenom} ({cls?.nom || ''} • {el.matricule})</option>;
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Catégorie du paiement :</label>
                  <select 
                    value={payType} 
                    onChange={(e) => {
                      const type = e.target.value as any;
                      setPayType(type);
                      // Autofill suggested amount
                      const stItem = studentsWithStatus.find(s => s.student.id === payEleveId);
                      if (stItem) {
                        if (type === 'inscription') {
                          setPayMontant(Math.max(0, stItem.costs.inscription - stItem.pays.inscription));
                        } else if (type === 'scolarite') {
                          setPayMontant(Math.max(0, stItem.costs.scolarite - stItem.pays.scolarite));
                        }
                      }
                    }} 
                    className="w-full border border-white/10 p-2.5 rounded-xl bg-black/45 text-white font-bold outline-none"
                  >
                    <option value="inscription" className="bg-slate-900 text-slate-200">Droits d'Inscription</option>
                    <option value="scolarite" className="bg-slate-900 text-slate-200">Scolarité d'étude</option>
                    <option value="autre" className="bg-slate-900 text-slate-200">Autre versement additionnel</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Mode d'encaissement :</label>
                  <select 
                    value={payMode} 
                    onChange={(e) => setPayMode(e.target.value as any)} 
                    className="w-full border border-white/10 p-2.5 rounded-xl bg-black/45 text-white font-bold outline-none"
                  >
                    <option value="Wave" className="bg-slate-900 text-slate-200">Wave Mobile</option>
                    <option value="Orange Money" className="bg-slate-900 text-slate-200">Orange Money</option>
                    <option value="MTN" className="bg-slate-900 text-slate-200">MTN Mobile Money</option>
                    <option value="Espèces" className="bg-slate-900 text-slate-200">Caisse Espèces</option>
                    <option value="Chèque" className="bg-slate-900 text-slate-200">Remise Chèque</option>
                    <option value="Virement" className="bg-slate-900 text-slate-200">Virement Bancaire</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Montant versé (XOF) :</label>
                <input 
                  type="number" 
                  value={payMontant} 
                  onChange={(e) => setPayMontant(parseInt(e.target.value) || 0)} 
                  className="w-full border border-white/10 p-2.5 rounded-xl bg-black/45 text-white font-mono font-bold outline-none text-sm" 
                  placeholder="Entrez le montant en francs CFA"
                  required 
                  min={100}
                />
                {payEleveId && (
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {(() => {
                      const stItem = studentsWithStatus.find(s => s.student.id === payEleveId);
                      if (!stItem) return null;
                      return (
                        <span>
                          Dossier de l'élève: Inscription payée ({stItem.pays.inscription} FCFA / {stItem.costs.inscription} FCFA) 
                          • Scolarité payée ({stItem.pays.scolarite} FCFA / {stItem.costs.scolarite} FCFA)
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Remarques (Visible sur le reçu fiscal) :</label>
                <textarea 
                  value={payNotes} 
                  onChange={(e) => setPayNotes(e.target.value)} 
                  className="w-full border border-white/10 p-2.5 rounded-xl bg-black/45 text-white outline-none min-h-[60px]" 
                  placeholder="Ex: Premier acompte scolarité payé par l'oncle tuteur"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddPayment(false)}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer flex items-center space-x-1"
                >
                  <span>Confirmer l'Encaissement</span>
                  <ArrowDownRight size={14} />
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DIALOG POPUP MODAL: RECEIPT GRAPHIC AND DETAILS */}
      {printingPaiement && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[110] backdrop-blur-md p-4 animate-fade-in" id="receipt-print-dialog">
          <div className="backdrop-blur-xl bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative flex flex-col justify-between" id="receipt-paper-box">
            
            <button 
              onClick={() => setPrintingPaiement(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer bg-white/5 rounded-full p-1 border border-white/5 transition-all no-print"
            >
              <X size={16} />
            </button>

            {/* Receipt Content Area for printing */}
            <div className="bg-white text-slate-900 p-6 rounded-2xl space-y-6 text-xs scale-[0.98] transition-transform shadow-inner font-sans border-t-8 border-orange-500" id="receipt-print-area">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b pb-4 flex-wrap">
                <div>
                  <h1 className="text-sm font-black uppercase tracking-tight text-slate-900 flex items-center space-x-1 text-left">
                    <span className="text-orange-500">{parametres?.nomEtablissement?.toUpperCase() || 'SCOLANGO'}</span>
                  </h1>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-none mt-0.5 font-bold">{parametres?.nomEtablissement || 'Établissement'}</p>
                  <p className="text-[8px] text-slate-400 mt-1">{parametres?.adresse}{parametres?.ville ? ', ' + parametres.ville : ''}</p>
                </div>
                <div className="text-right">
                  <span className="bg-orange-500 text-white font-mono px-2 py-0.5 rounded text-[8px] font-bold uppercase">REÇU OFFICIEL</span>
                  <p className="text-[10px] font-mono font-bold mt-1.5 text-slate-800">{printingPaiement.recuNumero}</p>
                  <p className="text-[8px] text-slate-500">Date: {printingPaiement.datePaiement}</p>
                </div>
              </div>

              {/* Student info */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 grid grid-cols-2 gap-3 text-[10px]">
                <div>
                  <p className="text-slate-400 uppercase tracking-wide font-bold text-[8px]">Élève Bénéficiaire</p>
                  <p className="font-extrabold text-slate-800 mt-0.5">
                    {(() => {
                      const st = eleves.find(e => e.id === printingPaiement.eleveId);
                      return st ? `${st.prenom} ${st.nom}` : '[Élève inconnu]';
                    })()}
                  </p>
                  <p className="text-slate-500 font-mono text-[9px] mt-0.5">
                    Matricule: {(() => {
                      const st = eleves.find(e => e.id === printingPaiement.eleveId);
                      return st?.matricule ?? 'N/A';
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase tracking-wide font-bold text-[8px]">Classe Courante</p>
                  <p className="font-extrabold text-slate-805 mt-0.5">
                    {(() => {
                      const st = eleves.find(e => e.id === printingPaiement.eleveId);
                      const cls = classes.find(c => c.id === st?.classeId);
                      return cls ? `${cls.nom} (${cls.niveau})` : 'NC';
                    })()}
                  </p>
                  <p className="text-slate-500 text-[9px] mt-0.5">Année Scolaire Active</p>
                </div>
              </div>

              {/* Transaction billing line */}
              <div className="space-y-2">
                <table className="w-full text-left font-semibold">
                  <thead>
                    <tr className="border-b text-[8px] text-slate-400 font-extrabold uppercase">
                      <th className="pb-1 text-left">Désignation</th>
                      <th className="pb-1">Catégorie</th>
                      <th className="pb-1 text-right">Montant Payé</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b text-[9.5px]">
                      <td className="py-2.5 font-bold text-slate-800">
                        {printingPaiement.type === 'inscription' ? "Frais d'inscription académique" : 
                         printingPaiement.type === 'scolarite' ? "Deuxième acompte scolarité annuelle" : 
                         "Autre soute additionnelle"}
                      </td>
                      <td className="py-2.5 text-slate-500 capitalize">
                        {printingPaiement.type}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-800">
                        {printingPaiement.montant.toLocaleString('fr-FR')} XOF
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total & pay mode */}
              <div className="flex justify-between items-center bg-slate-900 text-white p-3.5 rounded-xl font-bold font-mono">
                <div>
                  <p className="text-[7.5px] uppercase text-orange-400 tracking-wider font-extrabold">RÈGLEMENT PAR {printingPaiement.modePaiement}</p>
                  <p className="text-[8px] font-normal text-slate-400 mt-0.5 max-w-[200px] truncate">{printingPaiement.notes || "Sans observation"}</p>
                </div>
                <div className="text-right">
                  <span className="text-[7px] text-slate-300 block uppercase tracking-wide">NET VERSÉ</span>
                  <span className="text-sm font-black text-white">{printingPaiement.montant.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[8px] pt-4 whitespace-pre-wrap">
                <div>
                  <p className="text-slate-400 font-extrabold uppercase text-[7.5px]">Signature Caissier Scolango</p>
                  <p className="font-extrabold text-slate-700 mt-2 italic flex items-center space-x-1">
                    <span>Valide en Caisse Scolango 🖋️</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-extrabold uppercase text-[7.5px]">Cachet et Visa Scolaire</p>
                  <span className="inline-block border-2 border-red-500/50 text-red-500/60 font-black tracking-widest px-1.5 py-0.5 rounded text-[7px] uppercase mt-1 rotate-[-2deg]">
                    PAYÉ LYCÉE SCP
                  </span>
                </div>
              </div>

              <div className="text-center text-[7.5px] text-slate-400 border-t pt-2 mt-4 font-mono">
                Généré par Scolango • Caissier : {users.find(u=>u.id===printingPaiement?.caissierId)?.prenom} {users.find(u=>u.id===printingPaiement?.caissierId)?.nom}
              </div>
            </div>

            <div className="mt-4 flex space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setPrintingPaiement(null)}
                className="w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-semibold rounded-xl text-center cursor-pointer transition-all"
              >
                Fermer l'Aperçu
              </button>
              <button
                type="button"
                onClick={() => { window.print(); }}
                className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 font-bold text-white rounded-xl text-center cursor-pointer shadow-lg transition-all"
              >
                Imprimer (Navigateur)
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!printingPaiement) return;
                  const st = eleves.find(e => e.id === printingPaiement.eleveId);
                  const cls = classes.find(c => c.id === st?.classeId);
                  const caissier = users.find(u => u.id === printingPaiement.caissierId);
                  try {
                    const res = await fetch('/api/receipts/pdf', {
                      method: 'POST', headers: {'Content-Type':'application/json'},
                      body: JSON.stringify({
                        recuNumero: printingPaiement.recuNumero,
                        datePaiement: printingPaiement.datePaiement,
                        montant: printingPaiement.montant,
                        type: printingPaiement.type,
                        modePaiement: printingPaiement.modePaiement,
                        notes: printingPaiement.notes,
                        eleve: { nom: st?.nom??'', prenom: st?.prenom??'', matricule: st?.matricule??'', classeNom: cls?.nom??'', parentNom: st?.parentNom },
                        caissier: { nom: caissier?.nom??'', prenom: caissier?.prenom??'' },
                        ecole: { nom: parametres?.nomEtablissement??'', adresse: parametres?.adresse??'', ville: parametres?.ville, boitePostale: parametres?.boitePostale, logoBlob: parametres?.logoBlob, cachetOfficielBlob: parametres?.cachetOfficielBlob, telEtablissement: parametres?.telEtablissement, emailEtablissement: parametres?.emailEtablissement },
                      }),
                    });
                    if (!res.ok) { alert('Puppeteer non disponible — utilisez Imprimer Navigateur.'); return; }
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `${printingPaiement.recuNumero}.pdf`; a.click();
                    URL.revokeObjectURL(url);
                  } catch { alert('Serveur PDF non disponible. Utilisez Imprimer Navigateur.'); }
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded-xl text-center cursor-pointer transition-all text-[11px]"
              >
                ⬇ Télécharger PDF
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
