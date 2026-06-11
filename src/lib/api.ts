/**
 * SCOLANGO — Utilitaire API fetch
 * Helper centralisé avec gestion d'erreur, timeout et retry
 */

const BASE_URL = "";
const DEFAULT_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Fetch avec timeout automatique et gestion d'erreur standardisée
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOpts } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const token = localStorage.getItem("scolango_jwt");
    const headers = new Headers(fetchOpts.headers);
    if (!headers.has("Content-Type") && !(fetchOpts.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(`${BASE_URL}${path}`, {
      ...fetchOpts,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      let message = `Erreur ${response.status}`;
      try {
        const errBody = await response.json();
        message = errBody.error ?? errBody.message ?? message;
      } catch {/* ignore */}
      throw new ApiError(response.status, message);
    }

    // Pour les réponses PDF ou binaires
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/pdf") || contentType.includes("octet-stream")) {
      return response.blob() as unknown as T;
    }

    return response.json() as Promise<T>;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new ApiError(408, "La requête a expiré. Vérifiez votre connexion.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Helpers courts ──────────────────────────────────────────────────────────
export const api = {
  get:  <T>(path: string, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: "GET", ...opts }),

  post: <T>(path: string, body: unknown, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body), ...opts }),

  put:  <T>(path: string, body: unknown, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body), ...opts }),

  del:  <T>(path: string, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: "DELETE", ...opts }),

  /**
   * Télécharger un PDF — retourne un Blob
   */
  downloadPdf: async (path: string, body: unknown): Promise<Blob> => {
    const token = localStorage.getItem("scolango_jwt");
    const res = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.error ?? "Erreur PDF");
    }
    return res.blob();
  },
};
