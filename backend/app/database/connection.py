"""Supabase client singleton."""
from __future__ import annotations

from typing import Optional
from urllib.parse import urlparse

from supabase import Client, create_client

from app.config import get_config
from app.exceptions import DatabaseError

_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """Cliente Supabase configurado con variables de entorno.

    Nota: si ves ``Client.__init__() got an unexpected keyword argument 'proxy'``,
    tenés una combinación incompatible entre ``gotrue`` y ``httpx``.
    """
    global _client
    if _client is None:
        cfg = get_config()
        url = cfg.supabase_url.rstrip("/")
        key = (cfg.supabase_key or "").strip()

        try:
            # En desarrollo, deshabilitar SSL verification en httpx
            if cfg.debug:
                import httpx
                import ssl
                
                # Crear contexto SSL sin verificación
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
                
                # Monkey patch httpx para no verificar SSL
                original_client_init = httpx.Client.__init__
                def patched_init(self, *args, **kwargs):
                    kwargs['verify'] = False
                    original_client_init(self, *args, **kwargs)
                httpx.Client.__init__ = patched_init
            
            _client = create_client(url, key)
        except Exception as e:
            err = str(e).lower()
            if "invalid api key" in err:
                raise DatabaseError(
                    "Clave de Supabase inválida. Revisá SUPABASE_URL y SUPABASE_KEY en backend/.env "
                    "(Project Settings → API)."
                ) from e
            if "getaddrinfo failed" in err or "name or service not known" in err:
                host = urlparse(url).hostname or "<host>"
                raise DatabaseError(
                    "No se pudo resolver el host de Supabase (error DNS: getaddrinfo failed). "
                    f"Host: {host}. Revisá que SUPABASE_URL sea el Project URL correcto "
                    "y que tu DNS/Internet esté funcionando."
                ) from e
            raise DatabaseError(str(e)) from e
    return _client


def reset_supabase_client() -> None:
    """Liberar cliente (tests o recarga de configuración)."""
    global _client
    _client = None
