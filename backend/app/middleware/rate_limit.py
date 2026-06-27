"""Rate limiting middleware para proteger contra abuso y DoS."""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from collections import defaultdict
import asyncio

logger = logging.getLogger(__name__)

# Almacenar intentos en memoria (en producción usaría Redis)
# {ip: [(timestamp, endpoint), ...]}
REQUEST_TRACKER = defaultdict(list)
CLEANUP_INTERVAL = 300  # Limpiar cada 5 minutos


class RateLimiter:
    """Rate limiter por IP y endpoint."""
    
    def __init__(self, requests_per_minute: int = 60, burst_size: int = 10):
        """
        Args:
            requests_per_minute: Máximo de requests por minuto por IP
            burst_size: Máximo de requests simultáneos permitidos
        """
        self.requests_per_minute = requests_per_minute
        self.burst_size = burst_size
        self.last_cleanup = datetime.now(timezone.utc)
    
    def _cleanup_old_requests(self):
        """Eliminar requests más viejos de 1 minuto."""
        now = datetime.now(timezone.utc)
        
        # Limpiar cada 5 minutos
        if (now - self.last_cleanup).total_seconds() < CLEANUP_INTERVAL:
            return
        
        self.last_cleanup = now
        cutoff = now - timedelta(minutes=1)
        
        ips_to_remove = []
        for ip, requests in REQUEST_TRACKER.items():
            # Eliminar requests viejos
            REQUEST_TRACKER[ip] = [
                (ts, ep) for ts, ep in requests 
                if ts > cutoff
            ]
            # Si no hay requests, eliminar la IP
            if not REQUEST_TRACKER[ip]:
                ips_to_remove.append(ip)
        
        for ip in ips_to_remove:
            del REQUEST_TRACKER[ip]
    
    def is_rate_limited(self, client_ip: str, endpoint: str) -> tuple[bool, Optional[int]]:
        """
        Verifica si el cliente está rate-limitado.
        
        Args:
            client_ip: IP del cliente
            endpoint: Ruta del endpoint (ej: POST /api/checkout/create-preference)
        
        Returns:
            (is_limited, retry_after_seconds)
        """
        self._cleanup_old_requests()
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(minutes=1)
        
        # Obtener requests en el último minuto para esta IP
        requests = REQUEST_TRACKER[client_ip]
        recent = [(ts, ep) for ts, ep in requests if ts > cutoff]
        
        # Endpoints críticos tienen límites más bajos
        critical_endpoints = [
            "/api/checkout/create-preference",
            "/api/customers",
            "/api/orders",
            "/mercadopago",
            "/webhook",
            "/customers",
        ]
        
        is_critical = any(ep in endpoint for ep in critical_endpoints)
        limit = 10 if is_critical else self.requests_per_minute
        
        # Contar requests recientes
        count = len(recent)
        
        if count >= limit:
            # Calcular cuántos segundos hasta que se puede reintentar
            oldest = min((ts for ts, _ in recent), default=now)
            retry_after = int((oldest + timedelta(minutes=1) - now).total_seconds()) + 1
            return True, retry_after
        
        # Agregar este request
        REQUEST_TRACKER[client_ip].append((now, endpoint))
        
        return False, None


# Instancia global
_rate_limiter = RateLimiter(requests_per_minute=60, burst_size=10)


def get_rate_limiter() -> RateLimiter:
    """Obtener la instancia global de rate limiter."""
    return _rate_limiter
