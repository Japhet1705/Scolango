/**
 * SCOLANGO — Client API centralisé
 *
 * Toutes les communications avec le serveur passent ici.
 * Remplace les appels fetch dispersés dans les composants.
 *
 * En cas d'erreur réseau, lance une ScolangoApiError avec
 * le message structuré du serveur.
 *
 * Usage :
 *   import { api } from '@/lib/apiClient';
 *   const result = await api.users.list();
 */

export class ScolangoApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint: string
  ) {
    super(message);
    this.name = 'ScolangoApiError';
  }
}

const BASE = '/api';
const TIMEOUT_MS = 15_000;

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}`;
      try {
        const data = await response.json();
        errorMessage = data.error ?? data.message ?? errorMessage;
      } catch {
        // ignore JSON parse error
      }
      throw new ScolangoApiError(errorMessage, response.status, path);
    }

    return response.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof ScolangoApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ScolangoApiError('Délai dépassé — vérifiez votre connexion.', 408, path);
    }
    throw new ScolangoApiError(
      err instanceof Error ? (err instanceof Error ? err.message : String(err)) : 'Erreur réseau inconnue.',
      0,
      path
    );
  }
}

// ─── Endpoints IA ────────────────────────────────────────────────────────────

interface AppreciationPayload {
  studentName: string;
  average: number;
  subjectDetails: { mNom: string; coef: number; moyMatiere: number }[];
}

interface AssistantPayload {
  message: string;
  history?: { role: 'user' | 'model'; text: string }[];
}

interface TextResponse { text: string }

export const api = {
  /** Vérification que le serveur répond */
  health: () => request<{ status: string; aiMode: string }>('GET', '/health'),

  ai: {
    /** Générer une appréciation de bulletin */
    appreciation: (payload: AppreciationPayload) =>
      request<TextResponse>('POST', '/gemini/appreciations', payload),

    /** Assistant pédagogique conversationnel */
    chat: (payload: AssistantPayload) =>
      request<TextResponse>('POST', '/gemini/assistant', payload),
  },

  // ─── Ces endpoints seront actifs une fois la BDD Postgres branchée ───────
  // Ils sont définis ici pour que les composants puissent déjà les importer.

  bulletins: {
    /** Générer le PDF d'un bulletin via Puppeteer (server-side) */
    generatePdf: (payload: unknown) =>
      request<Blob>('POST', '/bulletins/pdf', payload),
  },

  receipts: {
    /** Générer le reçu de caisse PDF via Puppeteer (server-side) */
    generatePdf: (payload: unknown) =>
      request<Blob>('POST', '/receipts/pdf', payload),
  },
};
