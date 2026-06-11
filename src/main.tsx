import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Élément #root introuvable dans index.html');

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary moduleName="Application Scolango">
      <App />
    </ErrorBoundary>
  </StrictMode>
);
