"""Rutas para gestión de usuarios admin."""
from typing import Annotated, List

import requests
import urllib3
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from app.auth import require_admin
from app.config import get_config

# Deshabilitar advertencias de SSL (solo para desarrollo)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

router = APIRouter(prefix="/admin/users", tags=["admin-users"])


class CreateAdminRequest(BaseModel):
    """Request para crear un usuario admin."""
    email: EmailStr
    password: str
    name: str
    master_password: str  # Contraseña maestra para autorizar la creación


class AdminUserResponse(BaseModel):
    """Response con datos de un usuario admin."""
    id: str
    email: str
    name: str
    created_at: str


@router.get("", response_model=List[AdminUserResponse])
async def list_admin_users(
    _admin: Annotated[dict, Depends(require_admin)],
):
    """
    Lista todos los usuarios con rol admin.
    
    NOTA: Este endpoint requiere configurar SUPABASE_KEY con la service_role_key en .env
    para acceder a la API de administración de Supabase.
    """
    try:
        config = get_config()
        
        # Usar la API REST de Supabase para consultar auth.users
        headers = {
            "apikey": config.supabase_key,
            "Authorization": f"Bearer {config.supabase_key}",
        }
        
        # Consultar la API de admin de Supabase
        url = f"{config.supabase_url}/auth/v1/admin/users"
        
        response = requests.get(
            url,
            headers=headers,
            timeout=10,
            verify=False  # Deshabilitar verificación SSL (solo para desarrollo)
        )
        
        if response.status_code == 403:
            raise HTTPException(
                status_code=500,
                detail="No tienes permisos para listar usuarios. Verifica que SUPABASE_KEY sea la service_role_key"
            )
        
        response.raise_for_status()
        data = response.json()
        
        # Filtrar solo admins
        admins = []
        users = data.get('users', []) if isinstance(data, dict) else data
        
        for user in users:
            user_metadata = user.get('user_metadata', {})
            role = user_metadata.get('role')
            
            if role == 'admin':
                admins.append(AdminUserResponse(
                    id=user['id'],
                    email=user.get('email', ''),
                    name=user_metadata.get('name', 'Sin nombre'),
                    created_at=user.get('created_at', ''),
                ))
        
        return admins
        
    except HTTPException:
        raise
    except requests.exceptions.RequestException as e:
        print(f"ERROR: RequestException: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al comunicarse con Supabase: {str(e)}")
    except Exception as e:
        print(f"ERROR: Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al listar usuarios admin: {str(e)}")


@router.post("", response_model=AdminUserResponse)
async def create_admin_user(
    request: CreateAdminRequest,
    _admin: Annotated[dict, Depends(require_admin)],
):
    """Crea un nuevo usuario con rol admin."""
    try:
        config = get_config()
        
        # Verificar contraseña maestra
        if not config.admin_master_password:
            raise HTTPException(
                status_code=500,
                detail="La contraseña maestra no está configurada. Configura ADMIN_MASTER_PASSWORD en backend/.env"
            )
        
        if request.master_password != config.admin_master_password:
            raise HTTPException(
                status_code=403,
                detail="Contraseña maestra incorrecta"
            )
        
        # Validar contraseña del nuevo admin
        if len(request.password) < 6:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
        
        headers = {
            "apikey": config.supabase_key,
            "Authorization": f"Bearer {config.supabase_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "email": request.email,
            "password": request.password,
            "email_confirm": True,
            "user_metadata": {
                "name": request.name,
                "role": "admin",
            }
        }
        
        response = requests.post(
            f"{config.supabase_url}/auth/v1/admin/users",
            headers=headers,
            json=payload,
            timeout=10,
            verify=False  # Deshabilitar verificación SSL (solo para desarrollo)
        )
        
        if response.status_code == 403:
            raise HTTPException(
                status_code=500,
                detail="No tienes permisos para crear usuarios. Necesitas configurar SUPABASE_KEY con la service_role_key en backend/.env"
            )
        
        if response.status_code == 422:
            error_data = response.json()
            if 'already registered' in str(error_data).lower():
                raise HTTPException(status_code=400, detail="Este email ya está registrado")
        
        response.raise_for_status()
        user_data = response.json()
        
        return AdminUserResponse(
            id=user_data['id'],
            email=user_data.get('email', ''),
            name=request.name,
            created_at=user_data.get('created_at', ''),
        )
        
    except HTTPException:
        raise
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error al comunicarse con Supabase: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear usuario admin: {str(e)}")


@router.delete("/{user_id}")
async def delete_admin_user(
    user_id: str,
    _admin: Annotated[dict, Depends(require_admin)],
):
    """Elimina un usuario admin."""
    try:
        config = get_config()
        
        headers = {
            "apikey": config.supabase_key,
            "Authorization": f"Bearer {config.supabase_key}",
        }
        
        response = requests.delete(
            f"{config.supabase_url}/auth/v1/admin/users/{user_id}",
            headers=headers,
            timeout=10,
            verify=False  # Deshabilitar verificación SSL (solo para desarrollo)
        )
        
        if response.status_code == 403:
            raise HTTPException(
                status_code=500,
                detail="No tienes permisos para eliminar usuarios. Necesitas configurar SUPABASE_KEY con la service_role_key en backend/.env"
            )
        
        response.raise_for_status()
        
        return {"message": "Usuario eliminado correctamente"}
        
    except HTTPException:
        raise
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error al comunicarse con Supabase: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar usuario: {str(e)}")

