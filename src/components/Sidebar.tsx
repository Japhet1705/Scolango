import React from 'react';
import { useAppState } from '../stateContext';
import { Printer, 
  Database,
  Settings,
  Briefcase,
  Award,
  BarChart3,
  CalendarDays,
  Bot,
  UserCheck,
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser } = useAppState();

  if (!currentUser) return null;

  const role = currentUser.role;

  // Configure menu items based on exact requested architecture of Scolango
  const menuItems = [
    { id: 'base-de-donnees', label: '1. BASE DE DONNÉE', icon: Database, roles: ['admin', 'directeur'] },
    { id: 'parametres', label: '2. PARAMÈTRES', icon: Settings, roles: ['admin', 'directeur', 'comptable'] },
    { id: 'gestion', label: '3. GESTION QUOTIDIENNE', icon: Briefcase, roles: ['admin', 'directeur', 'secretaire', 'enseignant', 'comptable'] },
    { id: 'evaluations', label: '4. EVALUATION & NOTES', icon: Award, roles: ['admin', 'directeur', 'secretaire', 'enseignant', 'eleve', 'parent', 'comptable'] },
    { id: 'statistiques', label: '5. STATISTIQUES', icon: BarChart3, roles: ['admin', 'directeur', 'secretaire', 'enseignant'] },
    { id: 'editions', label: '6. ÉDITION & IMPRESSION', icon: Printer, roles: ['admin', 'directeur', 'secretaire', 'censeur', 'surveillant', 'enseignant'] },
    { id: 'fin-annee', label: '7. FIN D\'ANNÉE / CLÔTURE', icon: CalendarDays, roles: ['admin', 'directeur'] },
    { id: 'comptabilite', label: '8. COMPTABILITÉ & FRAIS', icon: CreditCard, roles: ['admin', 'directeur', 'comptable'] },
    { id: 'assistant', label: 'COMPAGNON IA SCOLAIRE', icon: Bot, roles: ['admin', 'directeur', 'enseignant', 'eleve', 'parent', 'comptable'] }
  ];

  return (
    <aside className="w-full md:w-64 backdrop-blur-xl bg-white/5 border-r border-white/10 text-slate-200 shrink-0 flex flex-col justify-between z-10" id="erp-sidebar">
      {/* Upper Navigation Links */}
      <div className="p-4" id="sidebar-navigation">
        <div className="mb-4 px-3 py-2 justify-between flex items-center bg-white/5 rounded-xl border border-white/10" id="role-display-box">
          <div className="flex items-center space-x-2">
            <UserCheck size={14} className="text-orange-500" />
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-300">
              Espace {role === 'admin' ? 'Administrateur' : 
                     role === 'directeur' ? 'Directeur' : 
                     role === 'secretaire' ? 'Secrétaire' : 
                     role === 'enseignant' ? 'Enseignant' : 
                     role === 'comptable' ? 'Comptable' :
                     role === 'eleve' ? 'Élève' : 'Tuteur / Parent'}
            </span>
          </div>
        </div>

        <nav className="space-y-1.5" id="nav-menu">
          {menuItems.map((item) => {
            const isAllowed = item.roles.includes(role);
            if (!isAllowed) return null;

            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 border ${
                  isActive
                    ? 'bg-white/10 text-white border-white/10 shadow-lg'
                    : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
                }`}
                id={`sidebar-tab-${item.id}`}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={16} className={`stroke-[2] ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding credits */}
      <div className="p-4 border-t border-white/10 bg-white/5 text-center" id="sidebar-footer">
        <p className="text-[10px] text-slate-500 font-mono">Scolango v2.4.0</p>
        <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Lycée Scientifique d'Abidjan</p>
      </div>
    </aside>
  );
};
