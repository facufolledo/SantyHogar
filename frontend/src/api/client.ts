import { getApiBase } from './config';

/** Si el backend no responde (colgado en Supabase, etc.), cortamos para no dejar la UI en carga infinita. */
const FETCH_TIMEOUT_MS = 25_000;

/**
 * Generar un token CSRF único para cada sesión.
 * Se genera la primera vez y se mantiene para toda la sesión del usuario.
 */
function getCsrfToken(): string {
  const STORAGE_KEY = 'csrf_token';
  let token = sessionStorage.getItem(STORAGE_KEY);
  
  if (!token) {
    // Generar token aleatorio seguro (32 caracteres hex)
    token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    sessionStorage.setItem(STORAGE_KEY, token);
  }
  
  return token;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const base = getApiBase();
  if (!base) {
    throw new ApiError('VITE_API_URL no está configurada', 0);
  }
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  // Agregar CSRF token a requests mutantes
  const method = (init?.method || 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...init?.headers,
  };
  
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    (headers as Record<string, string>)['X-CSRF-Token'] = getCsrfToken();
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers,
    });
  } catch (err: unknown) {
    const aborted =
      err instanceof Error &&
      (err.name === 'AbortError' || err.name === 'TimeoutError');
    if (aborted) {
      throw new ApiError(
        `El servidor no respondió en ${FETCH_TIMEOUT_MS / 1000}s. Revisá que uvicorn esté en marcha y que ${base} sea la URL correcta.`,
        0
      );
    }
    const msg =
      err instanceof Error ? err.message : 'Error de red al contactar el API.';
    throw new ApiError(
      `No se pudo conectar con ${base}. ¿Está el backend levantado? (${msg})`,
      0
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const detail =
      typeof data === 'object' && data !== null && 'detail' in data
        ? String((data as { detail: unknown }).detail)
        : res.statusText;
    let msg = detail || `HTTP ${res.status}`;
    if (
      res.status === 404 &&
      (msg === 'Not Found' || msg === 'HTTP 404') &&
      import.meta.env.DEV
    ) {
      msg += `. Comprobá que el backend tenga la ruta (p. ej. /docs) y que VITE_API_URL apunte al API (${url}). Si usás proxy, probá VITE_API_URL=/api`;
    }
    throw new ApiError(msg, res.status, data);
  }
  return data as T;
}
