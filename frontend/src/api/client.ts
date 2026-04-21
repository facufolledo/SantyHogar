import { getApiBase } from './config';

/** Si el backend no responde (colgado en Supabase, etc.), cortamos para no dejar la UI en carga infinita. */
const FETCH_TIMEOUT_MS = 25_000;

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

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
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
    throw new ApiError(detail || `HTTP ${res.status}`, res.status, data);
  }
  return data as T;
}
