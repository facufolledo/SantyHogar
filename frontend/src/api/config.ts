/**
 * URL base del backend (sin barra final).
 * - Absoluta: `http://localhost:8000`
 * - Relativa (recomendado en dev con proxy Vite): `/api` → mismo host que el front, Vite reenvía a :8000
 */
export function getApiBase(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || '';
  return raw.replace(/\/$/, '');
}

export function isApiConfigured(): boolean {
  return Boolean(getApiBase());
}

/** Solo en `true`: POST /orders y redirección a Mercado Pago. Por defecto checkout local (sin MP). */
export function isMpCheckoutEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_MP_CHECKOUT === 'true';
}
