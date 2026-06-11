import React, { useState } from 'react';
import { useAppState } from '../stateContext';
import { User } from '../types';
import { api, ApiError } from '../lib/api';
import { motion } from 'motion/react';
import {
  LogIn, Mail, Lock, Eye, EyeOff, Sparkles, ShieldAlert,
  UserCheck, Building, GraduationCap, Users2, CalendarDays, CreditCard
} from 'lucide-react';

// ─── Mot de passe démo (non-sécurisé, uniquement pour la démonstration) ─────
// En production chaque compte aura un vrai hash bcrypt via l'API
const DEMO_PASSWORD = 'demo1234';

export const LoginPage: React.FC = () => {
  const { users, setCurrentUser, logAction } = useAppState();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMess, setErrorMess]   = useState('');
  const [isLoading, setIsLoading]   = useState(false);

  // Profils démo : seulement visibles si DEMO_MODE est activé
  // En production (DEMO_MODE=false), cette section est masquée
  const isDemoMode = ((import.meta as any).env?.VITE_DEMO_MODE ?? 'true') !== 'false';
  const demoProfiles = isDemoMode ? users.filter(u => u.active).slice(0, 6) : [];

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMess('');
    setIsLoading(true);

    // Petite pause pour éviter le bruteforce visuel et simuler un vrai appel API
    await new Promise(r => setTimeout(r, 400));

    if (!email.trim() || !password.trim()) {
      setErrorMess('Veuillez saisir votre email et votre mot de passe.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await api.post<{ token: string; user: User }>('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      localStorage.setItem('scolango_jwt', result.token);
      setCurrentUser(result.user);
      logAction('Connexion', `${result.user.prenom} ${result.user.nom} (${result.user.role}) connecté.`);
      setIsLoading(false);
      return;
    } catch (err) {
      if (isDemoMode && err instanceof ApiError && err.status === 0) {
        const matchedUser = users.find(
          u => u.email.toLowerCase() === email.trim().toLowerCase() && u.active
        );
        if (matchedUser && (password === DEMO_PASSWORD || password === matchedUser.email)) {
          setCurrentUser(matchedUser);
          logAction('Connexion Démo', `${matchedUser.prenom} ${matchedUser.nom} (${matchedUser.role}) connecté en mode démo.`);
          setIsLoading(false);
          return;
        }
      }
      setErrorMess(err instanceof ApiError ? err.message : 'Erreur serveur. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (user: User) => {
    setEmail(user.email);
    setPassword(DEMO_PASSWORD);
    setErrorMess('');
    setTimeout(() => {
      setCurrentUser(user);
      logAction('Connexion Démo', `Connexion rapide : ${user.prenom} ${user.nom} (${user.role}).`);
    }, 350);
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, React.ReactNode> = {
      admin:      <UserCheck    className="text-rose-400"   size={18} />,
      comptable:  <CreditCard   className="text-orange-400" size={18} />,
      directeur:  <Building     className="text-orange-400" size={18} />,
      secretaire: <CalendarDays className="text-yellow-400" size={18} />,
      enseignant: <GraduationCap className="text-teal-400"  size={18} />,
    };
    return icons[role] ?? <Users2 className="text-blue-400" size={18} />;
  };

  const getRoleBadgeStyle = (role: string): string => {
    const styles: Record<string, string> = {
      admin:      'bg-red-500/10    text-red-400    border border-red-500/20',
      comptable:  'bg-orange-500/10 text-orange-400 border border-orange-500/20',
      directeur:  'bg-orange-500/10 text-orange-400 border border-orange-500/20',
      secretaire: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      enseignant: 'bg-teal-500/10   text-teal-400   border border-teal-500/20',
    };
    return styles[role] ?? 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  };

  return (
    <div
      className="min-h-screen bg-[#05070a] text-slate-200 font-sans flex flex-col justify-center items-center p-4 relative overflow-hidden"
      id="auth-portal-fullscreen"
      role="main"
    >
      {/* Arrière-plan décoratif */}
      <div className="absolute top-[-150px] left-[-150px] w-[500px] h-[500px] bg-orange-600/15 rounded-full blur-[140px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" aria-hidden="true" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 z-10" id="auth-box-grid">

        {/* Colonne branding */}
        <div className="md:col-span-5 flex flex-col justify-center text-center md:text-left space-y-4 px-2" id="auth-left-brand-column">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center font-bold text-white italic text-xl" aria-hidden="true">S</div>
            <h1 className="font-bold tracking-tight text-2xl text-white">Scolan<span className="text-orange-500">go</span></h1>
          </div>
          <div>
            <h2 className="text-xl font-light text-slate-300">Portail Académique & Administratif</h2>
            <p className="text-slate-400 font-mono text-[9px] uppercase tracking-[3px] mt-1 font-bold">Système d'Information Scolaire</p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Accédez en toute sécurité aux bulletins officiels, à la planification des cours, aux registres d'assiduité et à l'assistant IA pédagogique.
          </p>
          <div className="hidden md:flex flex-col gap-2 pt-2">
            <div className="backdrop-blur-md bg-white/5 border border-white/10 p-2 px-3 rounded-2xl flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-300">Données sécurisées</span>
            </div>
            <div className="backdrop-blur-md bg-white/5 border border-white/10 p-2 px-3 rounded-2xl flex items-center space-x-2">
              <span className="text-orange-400 text-xs" aria-hidden="true">🤖</span>
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-300">Assistant IA Gemini intégré</span>
            </div>
          </div>
        </div>

        {/* Colonne formulaire */}
        <div className="md:col-span-7 flex flex-col space-y-4" id="auth-right-panel-column">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6"
            id="login-frosted-card"
          >
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-lg font-bold text-white tracking-tight">Authentification</h3>
                <span className="text-[10px] uppercase font-mono text-slate-400">Connexion sécurisée</span>
              </div>
              <p className="text-xs text-slate-400">Renseignez vos identifiants pour accéder à votre espace.</p>
            </div>

            {/* Message d'erreur accessible */}
            {errorMess && (
              <div
                className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-2xl flex items-start space-x-2"
                role="alert"
                aria-live="assertive"
                id="login-error-alert"
              >
                <ShieldAlert size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                <span className="font-medium text-[11px] leading-relaxed">{errorMess}</span>
              </div>
            )}

            {/* Formulaire */}
            <form onSubmit={handleManualLogin} className="space-y-4" noValidate>
              <div className="space-y-1 text-xs">
                <label htmlFor="login-email-input" className="font-bold text-slate-300 flex items-center space-x-1.5">
                  <Mail size={13} className="text-orange-500" aria-hidden="true" />
                  <span>Adresse email</span>
                </label>
                <input
                  id="login-email-input"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="ex: admin@etablissement.ci"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 pl-3 text-xs outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium text-white placeholder-slate-500 transition-all font-mono"
                  aria-describedby={errorMess ? 'login-error-alert' : undefined}
                />
              </div>

              <div className="space-y-1 text-xs">
                <label htmlFor="login-password-input" className="font-bold text-slate-300 flex items-center space-x-1.5">
                  <Lock size={13} className="text-orange-500" aria-hidden="true" />
                  <span>Mot de passe</span>
                </label>
                <div className="relative">
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 pl-3 pr-10 text-xs outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium text-white placeholder-slate-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-60 font-bold hover:shadow-lg hover:shadow-orange-500/20 text-white transition-all px-4 py-3 rounded-xl flex items-center justify-center space-x-2 cursor-pointer mt-2 shadow-xl"
                id="login-submit-button"
              >
                {isLoading ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <LogIn size={15} className="stroke-[2.5]" aria-hidden="true" />
                )}
                <span className="text-xs uppercase tracking-wider">
                  {isLoading ? 'Vérification...' : 'Se connecter'}
                </span>
              </button>

              {isDemoMode && (
                <p className="text-[10px] text-center text-slate-500 font-mono">
                  Mode démo — mot de passe universel : <span className="text-slate-300 font-bold">{DEMO_PASSWORD}</span>
                </p>
              )}
            </form>

            {/* Accès démo rapide */}
            {isDemoMode && demoProfiles.length > 0 && (
              <div className="border-t border-white/10 pt-4" id="demo-roles-footer">
                <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-3">
                  <Sparkles size={11} className="text-orange-500" aria-hidden="true" />
                  <span>Accès démo instantané</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2" id="demo-shortcuts-grid" role="list" aria-label="Profils de démonstration">
                  {demoProfiles.map(user => {
                    const initiales = `${user.prenom[0]}${user.nom[0]}`;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleQuickLogin(user)}
                        className="flex flex-col items-center justify-center p-2 rounded-xl backdrop-blur-md bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all text-center cursor-pointer"
                        title={`Connexion rapide : ${user.prenom} ${user.nom} (${user.role})`}
                        aria-label={`Se connecter comme ${user.prenom} ${user.nom}, rôle ${user.role}`}
                        role="listitem"
                      >
                        <div
                          className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white mb-1.5"
                          aria-hidden="true"
                        >
                          {initiales}
                        </div>
                        <span className="text-[9px] font-bold text-white truncate max-w-full block">{user.prenom}</span>
                        <span className={`text-[8px] px-1 py-0.5 rounded-md font-mono mt-1 ${getRoleBadgeStyle(user.role)}`}>
                          {user.role}
                        </span>
                        {/* Icône rôle décorative */}
                        <span aria-hidden="true" className="mt-1">{getRoleIcon(user.role)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <p className="absolute bottom-4 text-center text-[10px] text-slate-500 font-mono z-10">
        © {new Date().getFullYear()} Scolango — Système d'Information Scolaire
      </p>
    </div>
  );
};
