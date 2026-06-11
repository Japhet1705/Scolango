import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Nom du module affiché dans le message d'erreur */
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary global — attrape toutes les erreurs React non gérées.
 * Affiche un écran de secours propre à la place du crash.
 *
 * Usage :
 *   <ErrorBoundary moduleName="Module Notes">
 *     <GradesModule />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // En production, envoyer à un service de monitoring (Sentry, etc.)
    console.error(`[ErrorBoundary] ${this.props.moduleName ?? 'App'}:`, error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="backdrop-blur-xl bg-white/5 border border-rose-500/20 p-8 rounded-3xl text-center max-w-lg mx-auto my-12 space-y-4"
        role="alert"
        aria-live="assertive"
      >
        <AlertTriangle className="text-rose-400 mx-auto" size={40} aria-hidden="true" />
        <div>
          <h2 className="text-white font-bold text-base mb-1">
            Une erreur s'est produite
            {this.props.moduleName && ` dans ${this.props.moduleName}`}
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            {this.state.error?.message ?? 'Erreur inattendue.'}
          </p>
        </div>
        <button
          onClick={this.handleReset}
          className="flex items-center space-x-2 mx-auto bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
        >
          <RefreshCw size={13} aria-hidden="true" />
          <span>Réessayer</span>
        </button>
      </div>
    );
  }
}
