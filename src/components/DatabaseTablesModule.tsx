import React, { useState } from 'react';
import { useAppState } from '../stateContext';
import { User, Classe, Matiere, Eleve, Role } from '../types';
import { Plus, Edit3, Trash2, Search, Download, UserPlus, FileSpreadsheet, AlertCircle } from 'lucide-react';

export const DatabaseTablesModule: React.FC = () => {
  const { 
    currentUser, 
    users, 
    addUser, 
    updateUser, 
    deleteUser,
    classes, 
    addClasse, 
    deleteClasse,
    matieres, 
    addMatiere, 
    deleteMatiere,
    eleves, 
    addEleve, 
    updateEleve, 
    deleteEleve
  } = useAppState();

  const [activeSubTab, setActiveSubTab] = useState<'eleves' | 'staff' | 'classes'>('eleves');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  // Form states
  const [showForm, setShowForm] = useState(false);
  
  // Add Eleve state variables
  const [evNom, setEvNom] = useState('');
  const [evPrenom, setEvPrenom] = useState('');
  const [evSexe, setEvSexe] = useState<'M' | 'F'>('F');
  const [evBirth, setEvBirth] = useState('2010-01-01');
  const [evAdresse, setEvAdresse] = useState('');
  const [evTel, setEvTel] = useState('');
  const [evParentNom, setEvParentNom] = useState('');
  const [evParentContact, setEvParentContact] = useState('');
  const [evClasseId, setEvClasseId] = useState('');

  // Add Staff state variables
  const [stNom, setStNom] = useState('');
  const [stPrenom, setStPrenom] = useState('');
  const [stEmail, setStEmail] = useState('');
  const [stPhone, setStPhone] = useState('');
  const [stRole, setStRole] = useState<Role>('enseignant');
  const [stSpecialty, setStSpecialty] = useState('');
  const [stAdresse, setStAdresse] = useState('');

  // Add Classe/Matiere state variables
  const [clNom, setClNom] = useState('');
  const [clNiveau, setClNiveau] = useState<'primaire' | 'college' | 'lycee' | 'universite'>('lycee');
  const [clProfId, setClProfId] = useState('');

  const [matNom, setMatNom] = useState('');
  const [matCoef, setMatCoef] = useState(2);
  const [matClasseId, setMatClasseId] = useState('');
  const [matProfId, setMatProfId] = useState('');

  // Handle student submit
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evNom || !evPrenom || !evClasseId) {
      alert("Veuillez remplir le nom, prénom et affecter une classe.");
      return;
    }
    
    addEleve({
      nom: evNom,
      prenom: evPrenom,
      sexe: evSexe,
      dateNaissance: evBirth,
      adresse: evAdresse || "Abidjan, Côte-d'Ivoire",
      telephone: evTel,
      parentNom: evParentNom,
      parentContact: evParentContact,
      classeId: evClasseId
    });

    // Reset
    setEvNom('');
    setEvPrenom('');
    setEvTel('');
    setEvParentNom('');
    setEvParentContact('');
    setShowForm(false);
  };

  // Handle staff submit
  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stNom || !stPrenom || !stEmail) {
      alert("Veuillez saisir le nom, le prénom et un email valide.");
      return;
    }

    addUser({
      nom: stNom,
      prenom: stPrenom,
      email: stEmail,
      phone: stPhone,
      role: stRole,
      adresse: stAdresse,
      active: true,
      specialty: stRole === 'enseignant' ? stSpecialty : undefined
    });

    setStNom('');
    setStPrenom('');
    setStEmail('');
    setStPhone('');
    setStSpecialty('');
    setStAdresse('');
    setShowForm(false);
  };

  const handleAddClasseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clNom) return;

    addClasse({
      nom: clNom,
      niveau: clNiveau,
      profPrincipalId: clProfId || undefined
    });

    setClNom('');
    setShowForm(false);
  };

  const handleAddMatiereSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matNom || !matClasseId) return;

    addMatiere({
      nom: matNom,
      coefficient: Number(matCoef),
      classeId: matClasseId,
      enseignantId: matProfId || undefined
    });

    setMatNom('');
    setMatCoef(2);
    setShowForm(false);
  };

  // CSV Exporter helper
  const exportStudentsToCSV = () => {
    const headers = "Matricule,Nom,Prenom,Sexe,Date Naissance,Classe,Parent,Contact\n";
    const dataRows = eleves.map(e => {
      const cls = classes.find(c => c.id === e.classeId)?.nom || "Inconnue";
      return `"${e.matricule}","${e.nom}","${e.prenom}","${e.sexe}","${e.dateNaissance}","${cls}","${e.parentNom || ''}","${e.parentContact || ''}"`;
    }).join("\n");

    const fullBlob = new Blob([headers + dataRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(fullBlob);
    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", url);
    downloadLink.setAttribute("download", `liste_eleves_${Date.now()}.csv`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Teachers listing
  const teachers = users.filter(u => u.role === 'enseignant');

  return (
    <div className="space-y-6" id="db-tables-module-main">
      
      {/* Upper sub navigation header */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3" id="db-subnav">
        <div className="flex space-x-2">
          <button
            onClick={() => { setActiveSubTab('eleves'); setShowForm(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all border cursor-pointer ${
              activeSubTab === 'eleves' 
                ? 'bg-orange-500 border-orange-500/20 text-white shadow-lg' 
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
            id="tab-students"
          >
            Registre des Élèves ({eleves.length})
          </button>
          <button
            onClick={() => { setActiveSubTab('staff'); setShowForm(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all border cursor-pointer ${
              activeSubTab === 'staff' 
                ? 'bg-orange-500 border-orange-500/20 text-white shadow-lg' 
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
            id="tab-staff"
          >
            Membres du Staff ({users.length})
          </button>
          <button
            onClick={() => { setActiveSubTab('classes'); setShowForm(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all border cursor-pointer ${
              activeSubTab === 'classes' 
                ? 'bg-orange-500 border-orange-500/20 text-white shadow-lg' 
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
            id="tab-classes"
          >
            Classes & Matières
          </button>
        </div>

        {/* Call-to-action */}
        <div className="flex space-x-2 mt-2 md:mt-0">
          {activeSubTab === 'eleves' && (
            <button
              onClick={exportStudentsToCSV}
              className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl hover:bg-emerald-500/20 transition-colors flex items-center space-x-1.5 cursor-pointer"
              title="Générer un fichier d'élèves Excel / CSV réels"
              id="export-students-btn"
            >
              <FileSpreadsheet size={14} />
              <span>Exporter CSV</span>
            </button>
          )}
          
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-lg"
            id="add-entry-btn"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Nouveau...</span>
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS PANEL */}
      <div className="backdrop-blur-xl bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-wrap gap-3 items-center" id="search-filter-panel">
        <div className="relative flex-1 min-w-[200px]" id="search-bar-container">
          <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'eleves' ? "Rechercher par nom, prénom ou matricule..." :
              activeSubTab === 'staff' ? "Rechercher un membre du personnel..." :
              "Rechercher une classe ou matière..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-orange-500 uppercase font-mono text-white outline-none"
          />
        </div>

        {activeSubTab === 'eleves' && (
          <div className="flex items-center space-x-2 text-xs font-medium" id="class-filter-container">
            <span className="text-slate-400">Filtrer par Classe:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="border border-white/10 bg-black/45 text-slate-200 rounded-xl p-2 text-xs outline-none font-bold"
            >
              <option value="all">Toutes les classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.nom} ({c.niveau})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* FORMS DRAWER */}
      {showForm && (
        <div className="bg-slate-50 p-5 rounded-2xl border border-blue-100/60 shadow-inner" id="forms-drawer-container">
          {activeSubTab === 'eleves' && (
            <form onSubmit={handleAddStudentSubmit} className="space-y-4">
              <div className="flex items-center space-x-2 text-blue-800 font-bold text-xs mb-2">
                <UserPlus size={16} />
                <span>FORMULAIRE D'INSCRIPTION ÉLÈVE</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-600">Nom de famille <span className="text-rose-500">*</span></label>
                  <input type="text" required value={evNom} onChange={(e) => setEvNom(e.target.value)} className="w-full border border-slate-200 rounded p-2 text-xs outline-none bg-white font-bold" />
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-600">Prénoms <span className="text-rose-500">*</span></label>
                  <input type="text" required value={evPrenom} onChange={(e) => setEvPrenom(e.target.value)} className="w-full border border-slate-200 rounded p-2 text-xs outline-none bg-white font-bold" />
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-600">Sexe / Genre</label>
                  <select value={evSexe} onChange={(e) => setEvSexe(e.target.value as 'M' | 'F')} className="w-full border border-slate-200 rounded p-2 text-xs outline-none bg-white font-bold">
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-600">Date de naissance</label>
                  <input type="date" value={evBirth} onChange={(e) => setEvBirth(e.target.value)} className="w-full border border-slate-200 rounded p-2 text-xs outline-none bg-white font-mono font-bold" />
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-600">Affectation Classe <span className="text-rose-500">*</span></label>
                  <select required value={evClasseId} onChange={(e) => setEvClasseId(e.target.value)} className="w-full border border-slate-200 rounded p-2 text-xs outline-none bg-white font-bold">
                    <option value="">-- Sélectionner une classe --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-600">Adresse de domicile</label>
                  <input type="text" value={evAdresse} onChange={(e) => setEvAdresse(e.target.value)} placeholder="Abidjan Cocody" className="w-full border border-slate-200 rounded p-2 text-xs outline-none bg-white" />
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-600">Nom Parent / Tuteur</label>
                  <input type="text" value={evParentNom} onChange={(e) => setEvParentNom(e.target.value)} placeholder="Tuteur légal" className="w-full border border-slate-200 rounded p-2 text-xs outline-none bg-white" />
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-600">Téléphone Parent</label>
                  <input type="text" value={evParentContact} onChange={(e) => setEvParentContact(e.target.value)} placeholder="+225 0102030405" className="w-full border border-slate-200 rounded p-2 text-xs outline-none bg-white" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded text-xs font-semibold cursor-pointer">Annuler</button>
                <button type="submit" className="px-3.5 py-1.5 bg-blue-600 text-white rounded text-xs font-bold cursor-pointer hover:bg-blue-700">Enregistrer l'inscription</button>
              </div>
            </form>
          )}

          {activeSubTab === 'staff' && (
            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
              <div className="flex items-center space-x-2 text-blue-850 font-bold text-xs mb-2">
                <UserPlus size={16} />
                <span>RECRUTEMENT MEMBRE DU PERSONNEL / STAFF</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-600">Nom de famille <span className="text-rose-500">*</span></label>
                  <input type="text" required value={stNom} onChange={(e) => setStNom(e.target.value)} className="w-full border border-slate-200 rounded p-2 text-xs outline-none bg-white font-semibold" />
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-600">Prénoms <span className="text-rose-500">*</span></label>
                  <input type="text" required value={stPrenom} onChange={(e) => setStPrenom(e.target.value)} className="w-full border border-slate-200 rounded p-2 text-xs outline-none bg-white font-semibold" />
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-600">Adresse Email <span className="text-rose-500">*</span></label>
                  <input type="email" required value={stEmail} onChange={(e) => setStEmail(e.target.value)} className="w-full border border-slate-200 rounded p-2 text-xs outline-none bg-white font-semibold" />
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-600">Téléphone de contact</label>
                  <input type="text" value={stPhone} onChange={(e) => setStPhone(e.target.value)} className="w-full border border-slate-200 rounded p-2 text-xs outline-none bg-white font-mono" />
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-600">Rôle / Habilitation système <span className="text-rose-500">*</span></label>
                  <select value={stRole} onChange={(e) => setStRole(e.target.value as Role)} className="w-full border border-slate-200 rounded p-2 text-xs outline-none bg-white font-semibold">
                    <option value="enseignant">Enseignant</option>
                    <option value="directeur">Directeur</option>
                    <option value="secretaire">Secrétaire</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>
                {stRole === 'enseignant' && (
                  <div className="space-y-1 text-xs text-blue-800">
                    <label className="font-bold">Matière de Spécialité</label>
                    <input type="text" required value={stSpecialty} onChange={(e) => setStSpecialty(e.target.value)} placeholder="ex: Mathématiques C" className="w-full border border-slate-200 rounded p-2 text-xs outline-none bg-blue-50/50" />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded text-xs font-semibold cursor-pointer">Annuler</button>
                <button type="submit" className="px-3.5 py-1.5 bg-blue-600 text-white rounded text-xs font-bold cursor-pointer hover:bg-blue-700">Enregistrer Staff</button>
              </div>
            </form>
          )}

          {activeSubTab === 'classes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="classes-matiere-grid-form">
              {/* Add Class Area */}
              <form onSubmit={handleAddClasseSubmit} className="space-y-4 bg-white p-4 rounded-xl border border-slate-200/50">
                <div className="font-bold text-xs text-slate-800 uppercase">Création d'une Classe</div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold">Intitulé de la classe (ex: Terminale C2)</label>
                  <input type="text" required value={clNom} onChange={(e) => setClNom(e.target.value)} className="w-full border border-slate-200 rounded p-2 text-xs" />
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold">Niveau académique de repère</label>
                  <select value={clNiveau} onChange={(e) => setClNiveau(e.target.value as any)} className="w-full border border-slate-200 rounded p-2 text-xs">
                    <option value="primaire">Primaire</option>
                    <option value="college">Collège</option>
                    <option value="lycee">Lycée</option>
                    <option value="universite">Université</option>
                  </select>
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold">Professeur Principal d’encadrement</label>
                  <select value={clProfId} onChange={(e) => setClProfId(e.target.value)} className="w-full border border-slate-200 rounded p-2 text-xs">
                    <option value="">-- Aucun --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.nom} {t.prenom}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded text-xs font-bold cursor-pointer">Ajouter la Classe</button>
              </form>

              {/* Add Matiere Area */}
              <form onSubmit={handleAddMatiereSubmit} className="space-y-4 bg-white p-4 rounded-xl border border-slate-200/50">
                <div className="font-bold text-xs text-slate-800 uppercase">Création d'une Matière</div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold">Intitulé de la matière (ex: Philosophie)</label>
                  <input type="text" required value={matNom} onChange={(e) => setMatNom(e.target.value)} className="w-full border border-slate-200 rounded p-2 text-xs" />
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold">Coefficient d'importance</label>
                  <input type="number" required min="1" max="10" value={matCoef} onChange={(e) => setMatCoef(Number(e.target.value))} className="w-full border border-slate-200 rounded p-2 text-xs" />
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold">Affectée à la Classe</label>
                  <select required value={matClasseId} onChange={(e) => setMatClasseId(e.target.value)} className="w-full border border-slate-200 rounded p-2 text-xs">
                    <option value="">-- Choisir une classe --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold">Professeur Enseignant affecté</label>
                  <select value={matProfId} onChange={(e) => setMatProfId(e.target.value)} className="w-full border border-slate-200 rounded p-2 text-xs">
                    <option value="">-- Aucun --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.nom} {t.prenom}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-bold cursor-pointer">Ajouter la Matière</button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* DATABASE TABLES DATA VIEW */}
      <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-lg overflow-hidden" id="tables-container">
        
        {/* STUDENT TABLES */}
        {activeSubTab === 'eleves' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="bg-black/25 text-[10px] uppercase font-bold text-slate-400 border-b border-white/10">
                  <th className="p-3">Matricule</th>
                  <th className="p-3">Élève (Nom & Prénoms)</th>
                  <th className="p-3">Sexe</th>
                  <th className="p-3">Date Naissance</th>
                  <th className="p-3">Classe</th>
                  <th className="p-3">Tuteur légal</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-semibold text-slate-200">
                {eleves
                  .filter(e => {
                    const fullName = `${e.nom} ${e.prenom}`.toLowerCase();
                    const query = searchQuery.toLowerCase();
                    const filterClassMatch = classFilter === 'all' || e.classeId === classFilter;
                    return (fullName.includes(query) || e.matricule.toLowerCase().includes(query)) && filterClassMatch;
                  })
                  .map((e) => {
                    const currentClass = classes.find(c => c.id === e.classeId);
                    return (
                      <tr key={e.id} className="hover:bg-white/5">
                        <td className="p-3 text-orange-400 font-mono text-[11px] font-bold">{e.matricule}</td>
                        <td className="p-3 text-white">{e.nom} {e.prenom}</td>
                        <td className="p-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            e.sexe === 'M' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {e.sexe}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-300">{e.dateNaissance}</td>
                        <td className="p-3">
                          <span className="font-bold bg-white/10 text-slate-300 py-0.5 px-2 rounded">
                            {currentClass ? currentClass.nom : 'Non affecté'}
                          </span>
                        </td>
                        <td className="p-3">{e.parentNom || 'N/A'}</td>
                        <td className="p-3 font-mono text-slate-400">{e.parentContact || 'N/A'}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => deleteEleve(e.id)}
                            className="p-1.5 text-rose-500 hover:text-white hover:bg-rose-500 rounded transition-colors duration-200 cursor-pointer inline-flex"
                            title="Desinscrire cet élève"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {/* STAFF TABLES */}
        {activeSubTab === 'staff' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="bg-black/25 text-[10px] uppercase font-bold text-slate-400 border-b border-white/10">
                  <th className="p-3">Nom complet</th>
                  <th className="p-3">Rôle système</th>
                  <th className="p-3">Spécialité Enseignement</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Téléphone</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-semibold text-slate-200">
                {users
                  .filter(u => {
                    const fullName = `${u.nom} ${u.prenom}`.toLowerCase();
                    return fullName.includes(searchQuery.toLowerCase()) || u.role.includes(searchQuery.toLowerCase());
                  })
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-white/5">
                      <td className="p-3 text-white font-bold">{u.nom} {u.prenom}</td>
                      <td className="p-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-bold ${
                          u.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          u.role === 'directeur' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                          u.role === 'secretaire' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          u.role === 'enseignant' ? 'bg-teal-500/20 text-teal-400 border border-teal-550/30' :
                          u.role === 'eleve' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-teal-300 font-medium italic">{u.specialty || 'N/A'}</td>
                      <td className="p-3 font-mono text-slate-300">{u.email}</td>
                      <td className="p-3 font-mono text-slate-400">{u.phone || 'Non renseigné'}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="p-1.5 text-rose-500 hover:text-white hover:bg-rose-500 rounded transition-colors duration-200 cursor-pointer inline-flex"
                          title="Supprimer définitivement"
                          disabled={u.role === 'admin'} 
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CLASSES AND MATIERES */}
        {activeSubTab === 'classes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x divide-white/10">
            {/* Classes List */}
            <div className="p-4 space-y-3">
              <h4 className="font-bold text-xs text-slate-200 uppercase border-b border-white/10 pb-2 mb-2">Classes et Enseignants Responsables</h4>
              <div className="space-y-2">
                {classes.map(c => {
                  const prof = users.find(u => u.id === c.profPrincipalId);
                  return (
                    <div key={c.id} className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/10">
                      <div>
                        <div className="font-bold text-white text-xs">{c.nom}</div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Niveau : {c.niveau}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-bold text-slate-350">
                          {prof ? `${prof.prenom} ${prof.nom}` : 'Sans Principal'}
                        </div>
                        <button
                          onClick={() => deleteClasse(c.id)}
                          className="text-[10px] text-rose-455 text-rose-350 font-bold hover:text-rose-350 cursor-pointer mt-1"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Matiere List */}
            <div className="p-4 space-y-3">
              <h4 className="font-bold text-xs text-slate-200 uppercase border-b border-white/10 pb-2 mb-2">Matières Enseignées et Coefficients</h4>
              <div className="space-y-2">
                {matieres.map(m => {
                  const cls = classes.find(c => c.id === m.classeId)?.nom || "Inconnu";
                  const prof = users.find(u => u.id === m.enseignantId);
                  return (
                    <div key={m.id} className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/10">
                      <div>
                        <div className="font-bold text-white text-xs">{m.nom}</div>
                        <span className="text-[9px] font-mono bg-orange-500/10 text-orange-400 font-bold px-1.5 py-0.2 rounded mr-1 border border-orange-500/20">
                          COEF {m.coefficient}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">Classe: {cls}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-medium text-slate-300">
                          {prof ? `Prof: ${prof.nom}` : 'Non assigné'}
                        </div>
                        <button
                          onClick={() => deleteMatiere(m.id)}
                          className="text-[10px] text-rose-455 text-rose-350 font-bold hover:text-rose-350 cursor-pointer mt-1"
                        >
                          Retirer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
