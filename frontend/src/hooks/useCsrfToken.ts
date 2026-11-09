/**
 * Hook para generar y gestionar tokens CSRF.
 * Genera un token único y lo almacena en sessionStorage.
 * Debe usarse en requests POST/PUT/DELETE.
 */

export function useCsrfToken() {
  const STORAGE_KEY = 'csrf_token';
  
  /**
   * Obtener o generar token CSRF.
   * El token se genera una sola vez por sesión.
   */
  function getOrGenerateToken(): string {
    let token = sessionStorage.getItem(STORAGE_KEY);
    
    if (!token) {
      // Generar token aleatorio (32 caracteres hex)
      token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      sessionStorage.setItem(STORAGE_KEY, token);
    }
    
    return token;
  }
  
  /**
   * Obtener headers con CSRF token para requests mutantes.
   */
  function getHeaders(): HeadersInit {
    return {
      'X-CSRF-Token': getOrGenerateToken(),
    };
  }
  
  /**
   * Limpiar token (logout, etc.)
   */
  function clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  
  return {
    getToken: getOrGenerateToken,
    getHeaders,
    clear,
  };
}
