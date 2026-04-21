"""Supabase client singleton."""
from typing import Optional

from supabase import Client, create_client

from app.config import get_config
from app.exceptions import DatabaseError

_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """Cliente Supabase configurado con variables de entorno.

    Requiere ``supabase-py`` 2.28+ (compatible con ``httpx`` 0.26+). Versiones viejas
    de ``gotrue`` + ``httpx`` rompían con ``Client.__init__() got an unexpected keyword argument 'proxy'``.
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
            raise DatabaseError(str(e)) from e
    return _client


def reset_supabase_client() -> None:
    """Liberar cliente (tests o recarga de configuración)."""
    global _client
    _client = None
