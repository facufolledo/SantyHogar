"""Middleware de rate limiting para FastAPI."""
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.middleware.rate_limit import get_rate_limiter
from app.config import get_config

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware que limita la tasa de requests por IP."""
    
    async def dispatch(self, request: Request, call_next):
        # Obtener IP del cliente
        client_ip = request.client.host if request.client else "unknown"
        
        # Obtener endpoint
        endpoint = f"{request.method} {request.url.path}"
        
        # Verificar rate limit
        rate_limiter = get_rate_limiter()
        is_limited, retry_after = rate_limiter.is_rate_limited(client_ip, endpoint)
        
        if is_limited:
            logger.warning(
                f"Rate limit exceeded for {client_ip} on {endpoint}. "
                f"Retry after {retry_after}s"
            )
            
            # Obtener origen del cliente para CORS
            origin = request.headers.get("origin", "")
            cfg = get_config()
            allowed_origins = cfg.frontend_url.split(',') if ',' in cfg.frontend_url else [cfg.frontend_url]
            
            # Headers CORS
            cors_headers = {"Retry-After": str(retry_after)}
            if origin in allowed_origins or "*" in allowed_origins:
                cors_headers["Access-Control-Allow-Origin"] = origin or allowed_origins[0]
                cors_headers["Access-Control-Allow-Credentials"] = "true"
            
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Demasiadas peticiones. Intenta más tarde.",
                    "retry_after": retry_after,
                },
                headers=cors_headers,
            )
        
        # Permitir el request
        response = await call_next(request)
        return response
