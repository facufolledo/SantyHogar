/** URL base del backend (sin barra final). Ej: http://localhost:8000 */
export function getApiBase(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  return (raw || '').replace(/\/$/, '');
}

export function isApiConfigured(): boolean {
  return Boolean(getApiBase());
}

/** Solo en `true`: POST /orders y redirección a Mercado Pago. Por defecto checkout local (sin MP). */
export function isMpCheckoutEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_MP_CHECKOUT === 'true';
}
