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
