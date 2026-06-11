import React, { useState, useEffect } from 'react';
import { useAppState } from '../stateContext';
import { Database, RefreshCw, Download, Sliders, FileText, Upload } from 'lucide-react';

export const DatabaseAdminModule: React.FC = () => {
  const { currentUser, eleves, logAction } = useAppState();

  const [dbSubTab, setDbSubTab] = useState<'changer-base' | 'sauvegarde' | 'restauration'>('changer-base');
  const [activeDbName, setActiveDbName] = useState<string>('SCOLANGO_DB_PRINCIPAL');
  const [dbConnecting, setDbConnecting] = useState<boolean>(false);
  const [backups, setBackups] = useState<{id:string;name:string;date:string;size:string;author:string}[]>(() => {
    try {
      const cached = localStorage.getItem('scolango_backups');
      return cached ? JSON.parse(cached) : [
        { id: 'b-1', name: 'SCOLANGO_PROD_20260401.bak', date: '2026-04-01 02:00', size: '18.4 Mo', author: 'Admin' },
        { id: 'b-2', name: 'SCOLANGO_PROD_20260515.bak', date: '2026-05-15 03:15', size: '19.8 Mo', author: 'Admin' }
      ];
    } catch { return []; }
  });
  const [backingUp, setBackingUp] = useState<boolean>(false);
  const [restoringId, setRestoringId] = useState<string>('');
  const [customDbIp, setCustomDbIp] = useState<string>("192.168.1.250");
  const [customDbName, setCustomDbName] = useState<string>("SCOLANGO_ANNEXE");
  const [customDbUser, setCustomDbUser] = useState<string>("sa");
  const [customDbPass, setCustomDbPass] = useState<string>("");
  const [customString, setCustomString] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [connectionTestResult, setConnectionTestResult] = useState<'success' | 'failed' | null>(null);
  const [showConfigPreview, setShowConfigPreview] = useState<boolean>(false);

  useEffect(() => { localStorage.setItem('scolango_backups', JSON.stringify(backups)); }, [backups]);

  const handleConnectDb = (dbName: string) => {
    setDbConnecting(true);
    setTimeout(() => {
      setActiveDbName(dbName);
      setDbConnecting(false);
      logAction('Administration Technique', `Connexion à l'instance SQL Server de la base ${dbName}`);
    }, 1200);
  };

  const handleTestAndSaveCustomDb = (e: React.FormEvent) => {
    e.preventDefault();
    setTestingConnection(true);
    setConnectionTestResult(null);

    // Build the connection string from inputs automatically
    const connectionStr = `Server=${customDbIp};Database=${customDbName};User ID=${customDbUser};Password=${customDbPass};TrustServerCertificate=True;Connect Timeout=30;`;
    setCustomString(connectionStr);

    setTimeout(() => {
      setTestingConnection(false);
      
      if (!customDbIp || !customDbName || !customDbUser) {
        setConnectionTestResult('failed');
        alert("Le test de connexion a échoué. Veuillez vérifier les informations d'hôte et d'identifiants.");
        return;
      }

      setConnectionTestResult('success');
      setActiveDbName(customDbName);
      setShowConfigPreview(true);

      logAction('Administration Technique', `Fermeture des connexions actives. Test SQL Server réussi sur ${customDbIp}. Enregistrement configuration dans appsettings.json et config.xml.`);
      alert("Test de connexion réussi ! Les paramètres SQL Server ont été injectés avec succès dans config.xml et l'application a basculé sur la base active.");
    }, 1500);
  };

  const handleGenerateBackup = () => {
    setBackingUp(true);
    setTimeout(() => {
      const now = new Date();
      const YYYY = now.getFullYear();
      const MM = String(now.getMonth() + 1).padStart(2, '0');
      const DD = String(now.getDate()).padStart(2, '0');
      const HH = String(now.getHours()).padStart(2, '0');
      const MIN = String(now.getMinutes()).padStart(2, '0');
      
      const filename = `Backup_Ecole_${YYYY}-${MM}-${DD}_${HH}h${MIN}.bak`;
      const formattedDate = `${YYYY}-${MM}-${DD} ${HH}:${MIN}`;

      const newBackup = {
        id: `back-${Date.now()}`,
        name: filename,
        date: formattedDate,
        size: `${(Math.random() * 2 + 18).toFixed(1)} Mo`,
        author: currentUser?.prenom + ' ' + currentUser?.nom || 'Admin'
      };
      setBackups(prev => [newBackup, ...prev]);
      setBackingUp(false);
      logAction('Backup SQL Server', `Création réussie du fichier de restauration de base ${newBackup.name}`);
    }, 1500);
  };

  const handleRestoreBackup = (b: any) => {
    const adminPass = prompt("🔑 Entrez le mot de passe 'Administrateur' suprême requis pour valider cette restauration système :", "");
    if (adminPass !== 'admin') {
      alert("❌ Mot de passe administrateur incorrect. Action de restauration annulée par sécurité.");
      return;
    }

    if (!confirm("🚨 ATTENTION : Cette action va écraser TOUTES les données actuelles de l'application avec cette archive. Confirmer la restauration ?")) {
      return;
    }

    setRestoringId(b.id);
    setTimeout(() => {
      setRestoringId('');
      logAction('Restauration Système', `Restauration de la base de données effectuée à partir du fichier ${b.name}`);
      alert(`La base de données Scolango a été restaurée avec succès à son état du ${b.date}.`);
    }, 1800);
  };



  return (
    <div className="space-y-6 animate-fade-in">

        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-3 flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center space-x-2">
                <Database size={18} className="text-rose-450 text-rose-400" />
                <span>Base de Données & Outils d'Administration</span>
              </h2>
              <p className="text-xs text-slate-400">
                Gérez la sécurité brute, changez de bases de consultation et gérez vos plans de sauvegarde SQL Server.
              </p>
            </div>
            {/* Minimal technical capsule */}
            <div className="flex bg-rose-500/10 border border-rose-500/20 text-rose-300 px-3 py-1 text-[10px] font-mono rounded-lg items-center space-x-1.5 font-bold">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span>SQL SERVER INSTANCE: CONNECTED</span>
            </div>
          </div>

          <div className="flex border-b border-white/10 space-x-2">
            {[
              { id: 'changer-base', label: 'Bases de l’École', icon: Sliders },
              { id: 'sauvegarde', label: 'Copie de Sécurité (Backup)', icon: Download },
              { id: 'restauration', label: 'Restaurer Base', icon: RefreshCw }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDbSubTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-semibold uppercase flex items-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
                  dbSubTab === tab.id
                    ? 'border-rose-500 text-white bg-white/5 rounded-t-xl'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <tab.icon size={13} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {dbSubTab === 'changer-base' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: 'SCOLANGO_DB_PRINCIPAL', year: '2025-2026 (Active)', total: eleves.length, desc: 'Données courantes en direct pour l’établissement principal.', status: 'active' },
                  { name: 'SCOLANGO_DB_ARCHIVE_2024_2025', year: '2024-2025 (Consultive)', total: 112, desc: 'Cycle clos de l’année académique passée. Consultation ouverte.', status: 'archived' },
                  { name: customDbName, year: 'Connexion Personnalisée', total: 0, desc: 'Instance SQL Server externe ou serveur secondaire rattaché.', status: 'custom' }
                ].map(db => (
                  <div key={db.name} className={`bg-white/5 border rounded-2xl p-5 space-y-4 flex flex-col justify-between ${db.name === activeDbName ? 'border-rose-500/50 shadow-lg bg-rose-500/5' : 'border-white/10'}`}>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-rose-450 text-rose-400 font-bold uppercase">SQL BACKEND</span>
                        {db.name === activeDbName && (
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-bold">Base Active Connectée</span>
                        )}
                      </div>
                      <h4 className="text-xs font-extrabold text-white font-mono truncate" title={db.name}>{db.name}</h4>
                      <p className="text-[10px] text-slate-450 text-slate-400">{db.desc}</p>
                      <div className="text-[10px] font-mono text-slate-300 font-bold">
                        <span>Élèves enregistrés : </span>
                        <span className="text-white">{db.total}</span>
                      </div>
                    </div>

                    {db.name !== activeDbName ? (
                      <button
                        onClick={() => handleConnectDb(db.name)}
                        className="w-full py-2 bg-white/5 border border-white/10 hover:border-rose-500/30 text-xs text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                      >
                        {dbConnecting ? <RefreshCw className="animate-spin" size={12} /> : <Sliders size={12} />}
                        <span>Connecter cette base</span>
                      </button>
                    ) : (
                      <div className="w-full text-center py-2 text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl font-bold font-mono">
                        INSTANCE CONNECTEE
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Advanced Connection Parameters Config Block */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-6 lg:col-span-7 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-1.5">
                      <Sliders size={14} className="text-rose-400" />
                      <span>Formulaire d'Ajustement de Connexion Directe</span>
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Configurez l'accès réseau IP et la chaîne de connexion (Connection String) de votre serveur SQL principal.
                    </p>
                  </div>

                  <form onSubmit={handleTestAndSaveCustomDb} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <label className="text-slate-300">Adresse IP / Hôte SQL Server :</label>
                      <input 
                        type="text" 
                        value={customDbIp} 
                        onChange={(e) => setCustomDbIp(e.target.value)}
                        placeholder="Ex: 192.168.1.150" 
                        className="w-full bg-black/45 border border-white/10 text-white font-mono p-2 rounded-xl outline-none" 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-slate-300">Nom de la Base de Données :</label>
                      <input 
                        type="text" 
                        value={customDbName} 
                        onChange={(e) => setCustomDbName(e.target.value)}
                        placeholder="Ex: SCOLANGO_PROD_ANNEXE" 
                        className="w-full bg-black/45 border border-white/10 text-white font-mono p-2 rounded-xl outline-none" 
                        required 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300">Utilisateur (SQL Login) :</label>
                      <input 
                        type="text" 
                        value={customDbUser} 
                        onChange={(e) => setCustomDbUser(e.target.value)}
                        placeholder="Ex: sa" 
                        className="w-full bg-black/45 border border-white/10 text-white font-mono p-2 rounded-xl outline-none" 
                        required 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300">Mot de Passe :</label>
                      <input 
                        type="password" 
                        value={customDbPass} 
                        onChange={(e) => setCustomDbPass(e.target.value)}
                        placeholder="Entrez le mot de passe SQL" 
                        className="w-full bg-black/45 border border-white/10 text-white font-mono p-2 rounded-xl outline-none" 
                        required 
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-slate-300">Chaîne de Connexion SQL Spécifiée (Auto-Generated) :</label>
                      <textarea 
                        value={`Server=${customDbIp};Database=${customDbName};User ID=${customDbUser};Password=${customDbPass ? '••••••••••••' : ''};TrustServerCertificate=True;`}
                        readOnly 
                        className="w-full bg-black/55 border border-white/5 text-rose-300 p-2 text-[10px] font-mono rounded-lg resize-none outline-none"
                        rows={2}
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={testingConnection}
                        className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-55 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center space-x-1.5 uppercase font-mono"
                      >
                        {testingConnection ? <RefreshCw className="animate-spin" size={13} /> : <Sliders size={13} />}
                        <span>Tester & Enregistrer Paramètres</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Configuration File Monitor */}
                <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-6 lg:col-span-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Fichier de Config Local</h3>
                      <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-bold border border-white/5">appsettings.json / config.xml</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Scolango stocke ses chaînes persistantes dans les fichiers d'orchestration locale système pour assurer des reprises instantanées.
                    </p>
                  </div>

                  <div className="bg-black/60 border border-white/5 p-4 rounded-xl font-mono text-[9.5px] leading-relaxed text-slate-300 max-h-56 overflow-y-auto">
                    <div className="text-[8.5px] text-slate-500 italic block mb-1">Preview de appsettings.json :</div>
                    <span className="text-blue-400">{"{"}</span><br />
                    <span>  <span className="text-emerald-400">"ConnectionStrings"</span>: <span className="text-blue-400">{"{"}</span></span><br />
                    <span>    <span className="text-purple-400">"DefaultConnection"</span>: <span className="text-rose-300">"Server={customDbIp};Database={customDbName};User ID={customDbUser};Password={customDbPass ? '********' : ''};"</span></span><br />
                    <span>  <span className="text-blue-400">{"}"}</span>,</span><br />
                    <span>  <span className="text-emerald-400">"ScolangoEngine"</span>: <span className="text-blue-400">{"{"}</span></span><br />
                    <span>    <span className="text-purple-400 font-bold">"HostConfig"</span>: <span className="text-rose-300">"MSSQL_SERVER_2022"</span>,</span><br />
                    <span>    <span className="text-purple-400 font-bold">"InstanceActive"</span>: <span className="text-rose-300">"{activeDbName}"</span></span><br />
                    <span>  <span className="text-blue-400">{"}"}</span></span><br />
                    <span className="text-blue-400">{"}"}</span>
                  </div>

                  <div className="text-[9.5px] p-2.5 bg-yellow-500/5 text-amber-300 border border-amber-500/10 rounded-xl leading-normal font-semibold">
                    💡 <strong className="text-white">L'astuce :</strong> En cas de conflit réseau, Scolango fermera automatiquement tous les sockets actifs pour forcer un test d'intégrité propre.
                  </div>
                </div>
              </div>
            </div>
          )}

          {dbSubTab === 'sauvegarde' && (
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-6 space-y-5">
              <div className="flex justify-between items-center border-b border-white/5 pb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Génération de Sauvegardes .bak (Backup SQL Server)</h3>
                  <p className="text-[10px] text-slate-450 text-slate-400 mt-1">
                    Générez une copie physique complète à chaud (.bak SQL) prête à être exportée ou clonée.
                  </p>
                </div>
                <button
                  onClick={handleGenerateBackup}
                  disabled={backingUp}
                  className="px-4 py-2 bg-gradient-to-br from-rose-500 to-red-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center space-x-1.5 uppercase font-mono"
                >
                  {backingUp ? (
                    <>
                      <RefreshCw className="animate-spin" size={13} />
                      <span>Backup SQL Server en cours...</span>
                    </>
                  ) : (
                    <>
                      <Download size={13} />
                      <span>Générer Sauvegarde Immédiate</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2">
                {backups.map(b => (
                  <div key={b.id} className="p-3.5 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl flex justify-between items-center flex-wrap gap-2 text-xs font-semibold">
                    <div className="flex items-center space-x-3">
                      <FileText className="text-rose-450 text-rose-400" size={18} />
                      <div>
                        <div className="font-mono text-slate-100 text-xs font-bold">{b.name}</div>
                        <div className="text-[10px] text-slate-400">Date: {b.date} • Taille: {b.size} • Admin: {b.author}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); alert(`Téléchargement de la base SQL ${b.name}...`); }}
                        className="p-1 px-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-rose-500/30 text-slate-200 rounded-lg text-[10px] font-bold transition-all"
                      >
                        Télécharger (.bak)
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dbSubTab === 'restauration' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-6 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono border-b border-white/5 pb-2">
                  Dernières Images de Sauvegardes Disponibles
                </h3>
                <div className="space-y-3">
                  {backups.map(b => (
                    <div key={b.id} className="p-4 bg-white/5 border border-white/5 hover:border-rose-500/20 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <div className="font-mono font-bold text-white">{b.name}</div>
                        <p className="text-[10px] text-slate-450 mt-1">Enregistrée par la maintenance système le {b.date}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Êtes-vous sûr de vouloir restaurer Scolango à l'état du ${b.date} ? Toutes les modifications plus récentes seront perdues.`)) {
                            handleRestoreBackup(b);
                          }
                        }}
                        disabled={!!restoringId}
                        className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500 hover:text-white rounded-xl text-rose-300 text-[10.5px] font-bold transition-all cursor-pointer"
                      >
                        {restoringId === b.id ? 'Restauration en cours...' : 'Restaurer'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Déposer Fichier .bak</h3>
                  <p className="text-[10px] text-slate-400">
                    Insérez une archive d'une ancienne sauvegarde générée depuis un autre serveur pour la restaurer.
                  </p>
                  
                  {/* File Upload zone simulated */}
                  <div 
                    onClick={() => {
                      const name = prompt("Entrez le nom du fichier à importer :", "SCOLANGO_RESTORE.bak");
                      if (name) {
                        alert(`Restauration réussie à partir de l'image insérée ${name}`);
                      }
                    }}
                    className="border-2 border-dashed border-white/10 hover:border-rose-500/30 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 bg-black/40"
                  >
                    <Upload className="mx-auto text-slate-500 stroke-[1.5]" size={28} />
                    <p className="text-[10px] text-slate-350">Glissez-déposer votre fichier .bak</p>
                    <span className="text-[8px] text-slate-500 font-mono">Format supporté: SQL Server Backup Binary Only</span>
                  </div>
                </div>

                <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[9px] text-slate-400 font-mono text-left leading-relaxed">
                  <span className="text-amber-500 font-bold block mb-0.5">⚠️ AVERTISSEMENT :</span>
                  L'écriture et la restauration forcent le redémarrage et la déconnexion instantanée de tous les terminaux enseignants connectés.
                </div>
              </div>
            </div>
          )}
        </div>

      {/* ========================================================= */}
      {/* SECTION 2: PARAMETRES (Configuration Initiale) */}
      {/* ========================================================= */}
    </div>
  );
};
