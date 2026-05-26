"""Dependencias de autenticación para proteger endpoints."""
import logging
from typing import Annotated, Optional

from fastapi import Depends, HTTPException, Request, status

from app.config import get_config

logger = logging.getLogger(__name__)


async def get_current_user(request: Request) -> dict:
    """Extrae y verifica el usuario del token Bearer de Supabase.
    
    Verifica el JWT contra Supabase Auth para obtener el usuario actual.
    Lanza 401 si no hay token o es inválido.
    """
    auth_header = request.headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido",
        )
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        import httpx
        config = get_config()
        
        # Verificar token contra Supabase Auth
        async with httpx.AsyncClient(verify=False) as client:
            response = await client.get(
                f"{config.supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": config.supabase_key,
                },
                timeout=10,
            )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o expirado",
            )
        
        user_data = response.json()
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error verificando token: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error al verificar autenticación",
        )


async def require_admin(user: Annotated[dict, Depends(get_current_user)]) -> dict:
    """Verifica que el usuario autenticado tenga rol admin.
    
    Lanza 403 si el usuario no es admin.
    """
    user_metadata = user.get("user_metadata", {})
    role = user_metadata.get("role", "")
    
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: se requiere rol de administrador",
        )
    
    return user
