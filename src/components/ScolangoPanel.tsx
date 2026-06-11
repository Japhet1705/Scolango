/**
 * SCOLANGO — ScolangoPanel
 *
 * Orchestrateur léger : chaque onglet majeur est maintenant
 * un module indépendant. Ce fichier se contente de router.
 *
 * Ancienne taille : 2750 lignes
 * Nouvelle taille  : ~60 lignes
 */
import React from 'react';
import { useAppState } from '../stateContext';
import { GradesModule }        from './GradesModule';
import { PresencesModule }     from './PresencesModule';
import { BulletinsModule }     from './BulletinsModule';
import { ScheduleModule }      from './ScheduleModule';
import { DashboardAdmin }      from './DashboardAdmin';
import { GestionModule }       from './GestionModule';
import { ParametresModule }    from './ParametresModule';
import { DatabaseAdminModule } from './DatabaseAdminModule';
import { FinAnneeModule }      from './FinAnneeModule';
import { ComptabiliteModule }  from './ComptabiliteModule';
import { DatabaseTablesModule} from './DatabaseTablesModule';
import { StatistiquesModule }  from './StatistiquesModule';
import { EditionModule }       from './EditionModule';
import { AlertTriangle }       from 'lucide-react';

interface ScolangoPanelProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const ScolangoPanel: React.FC<ScolangoPanelProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser } = useAppState();

  // Composant par défaut si onglet inconnu
  const NotFound = () => (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl text-center space-y-3" role="alert">
      <AlertTriangle className="text-orange-500 mx-auto" size={36} aria-hidden="true" />
      <p className="text-slate-300 text-sm font-medium">Module non trouvé : <code className="text-orange-400">{activeTab}</code></p>
    </div>
  );

  const tabMap: Record<string, React.ReactNode> = {
    'accueil':        <DashboardAdmin />,
    'gestion':        <GestionModule setActiveTab={setActiveTab} />,
    'evaluations':    <GradesModule />,
    'appel':          <PresencesModule />,
    'bulletins':      <BulletinsModule />,
    'planning':       <ScheduleModule />,
    'parametres':     <ParametresModule />,
    'base-de-donnees': <DatabaseAdminModule />,
    'fin-annee':      <FinAnneeModule />,
    'comptabilite':   <ComptabiliteModule />,
    'tables':         <DatabaseTablesModule />,
    'statistiques':   <StatistiquesModule />,
    'edition':        <EditionModule />,
    'editions':       <EditionModule />,
  };

  return (
    <div className="animate-fade-in">
      {tabMap[activeTab] ?? <NotFound />}
    </div>
  );
};
