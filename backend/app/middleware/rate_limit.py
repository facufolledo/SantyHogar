"""Rate Limiting Middleware con mejor control por endpoint."""
import time
import logging
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger(__name__)

# En-memory rate limiter (en producción, usar Redis)
# Estructura: {(ip, endpoint): [(timestamp1, timestamp2, ...)]}
_rate_limit_store: Dict[Tuple[str, str], list] = {}

# Configuración de limits por tipo de endpoint
RATE_LIMITS = {
    "/admin/users/create": (5, 3600),  # 5 requests por hora
    "/auth": (10, 3600),  # 10 requests por hora
    "/checkout": (20, 3600),  # 20 requests por hora
    "/webhook": (100, 60),  # 100 requests por minuto
    "default": (100, 60),  # 100 requests por minuto (default)
}

CLEANUP_INTERVAL = 3600  # Limpiar cada hora
_last_cleanup = time.time()


def _cleanup_expired():
    """Limpiar timestamps expirados."""
    global _last_cleanup
    now = time.time()
    
    if now - _last_cleanup < CLEANUP_INTERVAL:
        return
    
    _last_cleanup = now
    keys_to_delete = []
    
    for key, timestamps in _rate_limit_store.items():
        # Remover timestamps más viejos que 1 hora
        _rate_limit_store[key] = [ts for ts in timestamps if now - ts < 3600]
        if not _rate_limit_store[key]:
            keys_to_delete.append(key)
    
    for key in keys_to_delete:
        del _rate_limit_store[key]
    
    logger.debug(f"Rate limiter cleanup: removieron {len(keys_to_delete)} claves")


def _get_rate_limit(endpoint: str) -> Tuple[int, int]:
    """Obtener limit (count, window) para un endpoint."""
    for pattern, limit in RATE_LIMITS.items():
        if endpoint.startswith(pattern):
            return limit
    return RATE_LIMITS["default"]


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting por IP y endpoint."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # Skip para health checks y docs
        if request.url.path in {"/health", "/docs", "/openapi.json", "/redoc"}:
            return await call_next(request)
        
        # Obtener IP del cliente
        client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        if not client_ip and request.client:
            client_ip = request.client.host
        if not client_ip:
            client_ip = "unknown"
        
        # Determinar endpoint base
        endpoint = request.url.path.split("?")[0]
        
        # Cleanup periódico
        _cleanup_expired()
        
        # Obtener configuración de rate limit
        max_requests, window_seconds = _get_rate_limit(endpoint)
        
        # Clave para el store
        key = (client_ip, endpoint)
        now = time.time()
        
        # Obtener timestamps previos
        timestamps = _rate_limit_store.get(key, [])
        
        # Remover timestamps fuera de la ventana
        valid_timestamps = [ts for ts in timestamps if now - ts < window_seconds]
        
        # Verificar límite
        if len(valid_timestamps) >= max_requests:
            logger.warning(
                f"Rate limit exceeded: {client_ip} on {endpoint} "
                f"({len(valid_timestamps)}/{max_requests} in {window_seconds}s)"
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Demasiadas solicitudes. Máximo {max_requests} por {window_seconds}s",
            )
        
        # Agregar timestamp actual
        valid_timestamps.append(now)
        _rate_limit_store[key] = valid_timestamps
        
        # Continuar con la request
        response = await call_next(request)
        
        # Agregar headers informativos
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Window"] = str(window_seconds)
        response.headers["X-RateLimit-Remaining"] = str(max(0, max_requests - len(valid_timestamps)))
        
        return response
