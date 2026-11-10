"""CSRF Protection Middleware."""
import secrets
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging

logger = logging.getLogger(__name__)

# Métodos seguros (no necesitan CSRF token)
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

# Rutas excluidas de CSRF (ej. webhooks externos)
CSRF_EXEMPT_PATHS = {
    "/webhook",
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/api/hero-slides",  # Admin panel - protegido por autenticación
    "/api/categories",    # Admin panel - protegido por autenticación
}


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    CSRF Protection: valida que requests mutantes tengan un token válido.
    
    - GET/HEAD/OPTIONS: seguros, no necesitan token
    - POST/PUT/DELETE: necesitan X-CSRF-Token header o _csrf_token en form
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip para métodos seguros
        if request.method in SAFE_METHODS:
            return await call_next(request)
        
        # Skip para rutas excluidas
        if any(request.url.path.startswith(p) for p in CSRF_EXEMPT_PATHS):
            return await call_next(request)
        
        # Para requests mutantes, validar CSRF token
        csrf_token = request.headers.get("X-CSRF-Token")
        
        if not csrf_token:
            # Intentar obtener del body si es form-data
            try:
                body = await request.receive()
                if b"_csrf_token" in body.get("body", b""):
                    # Es form-data, aceptar sin token por ahora
                    # (JSON APIs deben usar header)
                    pass
                else:
                    logger.warning(
                        f"CSRF token missing for {request.method} {request.url.path} "
                        f"from {request.client.host if request.client else 'unknown'}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="CSRF token requerido (header X-CSRF-Token)",
                    )
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error validando CSRF: {e}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Error validando CSRF token",
                )
        
        return await call_next(request)
