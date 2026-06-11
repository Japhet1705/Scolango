import React, { useState } from 'react';
import { useAppState } from '../stateContext';
import { School, Wifi, WifiOff, RefreshCw, RefreshCwOff, User as UserIcon, LogOut, ChevronDown, CheckCircle } from 'lucide-react';

export const Header: React.FC = () => {
  const [isDark, setIsDark] = React.useState(() => {
    // Default dark (app is dark by default)
    if (typeof document !== 'undefined') {
      return !document.documentElement.classList.contains('light');
    }
    return true;
  });

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.remove('light');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.style.colorScheme = 'light';
      document.documentElement.style.setProperty('--bg-main', '#f8fafc');
    }
  };
  const { 
    currentUser, 
    setCurrentUser, 
    users, 
    offlineMode, 
    setOfflineMode, 
    syncQueue, 
    triggerManualSync,
    parametres
  } = useAppState();

  const [isOpenSwitcher, setIsOpenSwitcher] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  const handleToggleOffline = () => {
    setOfflineMode(!offlineMode);
  };

  const handleSyncClick = () => {
    if (offlineMode) return;
    triggerManualSync();
    setShowSyncSuccess(true);
    setTimeout(() => setShowSyncSuccess(false), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('scolango_jwt');
    setCurrentUser(null);
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
  };

  const selectUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
    }
    setIsOpenSwitcher(false);
  };

  return (
    <header className="backdrop-blur-md bg-black/20 border-b border-white/10 text-white sticky top-0 z-50 px-4 py-3 md:px-6 flex flex-wrap items-center justify-between" id="erp-header">
      {/* School Brand */}
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg shadow-orange-500/20 p-2 text-white" id="brand-logo-container">
          <School size={20} className="stroke-[2]" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight" id="school-title">
            {parametres.nomEtablissement}
          </h1>
          <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
            {parametres.adresse.split(',')[0]} | Année Active: 2025-2026
          </p>
        </div>
      </div>

      {/* Quick Role & User Switcher for demonstration */}
      <div className="flex items-center space-x-4 mt-2 sm:mt-0">
        
        {/* Connection status and Sync status */}
        <div className="flex items-center space-x-2 bg-white/5 p-1.5 px-2.5 rounded-xl text-xs border border-white/10">
          <button 
            onClick={handleToggleOffline} 
            className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg cursor-pointer transition-colors ${
              offlineMode 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
            title="Cliquez pour simuler une coupure de connexion"
            id="toggle-offline-btn"
          >
            {offlineMode ? (
              <>
                <WifiOff size={13} />
                <span>Hors-Ligne</span>
              </>
            ) : (
              <>
                <Wifi size={13} />
                <span>En Ligne</span>
              </>
            )}
          </button>

          {syncQueue.length > 0 && (
            <button
              onClick={handleSyncClick}
              disabled={offlineMode}
              className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-colors ${
                offlineMode 
                  ? 'text-slate-500 cursor-not-allowed' 
                  : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 cursor-pointer animate-pulse'
              }`}
              title="Synchroniser les données avec le serveur"
              id="sync-queue-btn"
            >
              <RefreshCw size={13} className={offlineMode ? "" : "animate-spin"} />
              <span className="font-mono font-bold text-[11px]">{syncQueue.length}</span>
            </button>
          )}

          {showSyncSuccess && (
            <span className="flex items-center space-x-1 text-emerald-400 text-[10px] font-medium" id="sync-success-msg">
              <CheckCircle size={11} />
              <span>Données synchronisées !</span>
            </span>
          )}
        </div>

        {/* Demo User Portal switcher dropdown */}
        <div className="relative">
          <button 
            type="button"
            onClick={() => setIsOpenSwitcher(!isOpenSwitcher)}
            className="flex items-center space-x-2 bg-white/5 border border-white/10 text-slate-200 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors text-xs font-semibold cursor-pointer"
            id="user-profile-menu-button"
          >
            <UserIcon size={14} className="text-orange-500" />
            <span className="max-w-[120px] truncate font-medium">
              {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Choix Profil'}
            </span>
            <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase">
              {currentUser ? currentUser.role : 'aucun'}
            </span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>

          {isOpenSwitcher && (
            <div className="absolute right-0 mt-2 w-72 backdrop-blur-xl bg-[#090b11]/95 border border-white/10 rounded-2xl shadow-2xl py-2 z-50 text-slate-300 transform origin-top-right text-xs" id="switcher-dropdown">
              <div className="px-3 py-2 border-b border-white/10 text-slate-400 font-bold text-[10px] uppercase font-mono tracking-wider">
                Simuler un rôle Scolango (Aperçu Live)
              </div>
              <div className="max-h-64 overflow-y-auto">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => selectUser(u.id)}
                    className={`w-full text-left px-3 py-2 hover:bg-white/5 hover:text-white transition-colors flex items-center justify-between border-b border-white/5 ${
                      currentUser?.id === u.id ? 'bg-white/10 text-white' : ''
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[12px]">{u.prenom} {u.nom}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Tél: {u.phone || 'Non renseigné'}</div>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-bold ${
                      u.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      u.role === 'directeur' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                      u.role === 'secretaire' ? 'bg-yellow-500/10 text-yellow-550 border border-yellow-500/20' :
                      u.role === 'enseignant' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      u.role === 'eleve' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      u.role === 'comptable' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                      'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}>
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-white/10 flex justify-end">
                <button 
                  onClick={handleLogout} 
                  className="w-full text-center px-2 py-1.5 text-[10px] text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <LogOut size={11} />
                  <span>Se déconnecter de la session</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
