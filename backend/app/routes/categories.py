"""API endpoints para CRUD de categorías dinámicas."""
import logging
import uuid
from typing import List
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Query
from uuid import UUID

from app.database.connection import get_supabase_client
from app.models.schemas import (
    CategoryResponse,
    CreateCategoryRequest,
    UpdateCategoryRequest,
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/categories", tags=["Categories"])


def generate_slug(name: str) -> str:
    """Genera un slug a partir del nombre de la categoría."""
    return name.lower().replace(" ", "-").replace("_", "-")


# ────────────────────────────────────────────────────────────────────────
# GET /api/categories - Listar todas las categorías activas
# ────────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[CategoryResponse])
async def list_categories(
    active_only: bool = Query(True, description="Solo categorías activas"),
):
    """
    Obtiene todas las categorías (activas o todas).
    
    Parámetros:
    - active_only: Si True, solo retorna categorías con activo=True
    
    Retorna: Lista de categorías ordenadas por orden
    """
    try:
        client = get_supabase_client()
        
        if active_only:
            query = client.table("categorias")\
                .select("*")\
                .eq("activo", True)\
                .order("orden")
        else:
            query = client.table("categorias")\
                .select("*")\
                .order("orden")
        
        response = query.execute()
        
        if not response.data:
            return []
        
        # Formatear respuesta
        categories = []
        for cat in response.data:
            categories.append(CategoryResponse(
                id=UUID(cat["id_categoria"]),
                name=cat["nombre"],
                slug=cat["slug"],
                description=cat.get("descripcion"),
                color=cat.get("color"),
                icon=cat.get("icono"),
                order=cat.get("orden", 0),
                active=cat.get("activo", True),
                createdAt=cat["fecha_creacion"],
                updatedAt=cat["fecha_actualizacion"],
            ))
        
        return categories
        
    except Exception as e:
        logger.error(f"Error listing categories: {e}")
        raise HTTPException(status_code=500, detail="Error al listar categorías")


# ────────────────────────────────────────────────────────────────────────
# POST /api/categories - Crear nueva categoría
# ────────────────────────────────────────────────────────────────────────

@router.post("", response_model=CategoryResponse, status_code=201)
async def create_category(request: CreateCategoryRequest):
    """
    Crea una nueva categoría.
    
    Body:
    - name: Nombre de la categoría (requerido)
    - description: Descripción (opcional)
    - color: Color hex como #RRGGBB (opcional)
    - icon: Nombre del icono (opcional)
    - order: Orden de aparición (default: 0)
    
    Retorna: Categoría creada con ID
    """
    try:
        client = get_supabase_client()
        
        # Generar slug
        slug = generate_slug(request.name)
        
        # Verificar que no exista categoría con mismo nombre o slug
        existing = client.table("categorias")\
            .select("id_categoria")\
            .eq("nombre", request.name)\
            .execute()
        
        if existing.data:
            raise HTTPException(
                status_code=409,
                detail=f"Categoría '{request.name}' ya existe"
            )
        
        # Crear categoría
        category_id = str(uuid.uuid4())
        # Usar horario de Argentina (UTC-3)
        from datetime import timezone, timedelta
        argentina_tz = timezone(timedelta(hours=-3))
        now = datetime.now(argentina_tz).isoformat()
        
        new_category = {
            "id_categoria": category_id,
            "nombre": request.name,
            "slug": slug,
            "descripcion": request.description,
            "color": request.color,
            "icono": request.icon,
            "orden": request.order,
            "activo": True,
            "fecha_creacion": now,
            "fecha_actualizacion": now,
        }
        
        response = client.table("categorias").insert(new_category).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Error al crear categoría")
        
        cat = response.data[0]
        return CategoryResponse(
            id=UUID(cat["id_categoria"]),
            name=cat["nombre"],
            slug=cat["slug"],
            description=cat.get("descripcion"),
            color=cat.get("color"),
            icon=cat.get("icono"),
            order=cat.get("orden", 0),
            active=cat.get("activo", True),
            createdAt=cat["fecha_creacion"],
            updatedAt=cat["fecha_actualizacion"],
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating category: {e}")
        raise HTTPException(status_code=500, detail="Error al crear categoría")


# ────────────────────────────────────────────────────────────────────────
# GET /api/categories/{id} - Obtener categoría por ID
# ────────────────────────────────────────────────────────────────────────

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: UUID):
    """
    Obtiene una categoría específica por su ID.
    
    Parámetros:
    - category_id: ID de la categoría (UUID)
    
    Retorna: Datos de la categoría
    """
    try:
        client = get_supabase_client()
        
        response = client.table("categorias")\
            .select("*")\
            .eq("id_categoria", str(category_id))\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        
        cat = response.data[0]
        return CategoryResponse(
            id=UUID(cat["id_categoria"]),
            name=cat["nombre"],
            slug=cat["slug"],
            description=cat.get("descripcion"),
            color=cat.get("color"),
            icon=cat.get("icono"),
            order=cat.get("orden", 0),
            active=cat.get("activo", True),
            createdAt=cat["fecha_creacion"],
            updatedAt=cat["fecha_actualizacion"],
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting category {category_id}: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener categoría")


# ────────────────────────────────────────────────────────────────────────
# PATCH /api/categories/{id} - Actualizar categoría
# ────────────────────────────────────────────────────────────────────────

@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: UUID,
    request: UpdateCategoryRequest
):
    """
    Actualiza una categoría existente.
    
    Parámetros:
    - category_id: ID de la categoría (UUID)
    
    Body: Campos a actualizar (todos opcionales)
    - name: Nuevo nombre
    - description: Nueva descripción
    - color: Nuevo color
    - icon: Nuevo icono
    - order: Nuevo orden
    - active: Activar/desactivar
    
    Retorna: Categoría actualizada
    """
    try:
        client = get_supabase_client()
        
        # Verificar que existe
        existing = client.table("categorias")\
            .select("id_categoria")\
            .eq("id_categoria", str(category_id))\
            .execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        
        # Preparar actualización
        updates = {}
        if request.name is not None:
            updates["nombre"] = request.name
            updates["slug"] = generate_slug(request.name)
        if request.description is not None:
            updates["descripcion"] = request.description
        if request.color is not None:
            updates["color"] = request.color
        if request.icon is not None:
            updates["icono"] = request.icon
        if request.order is not None:
            updates["orden"] = request.order
        if request.active is not None:
            updates["activo"] = request.active
        
        updates["fecha_actualizacion"] = datetime.now(timezone(timedelta(hours=-3))).isoformat()
        
        # Actualizar
        response = client.table("categorias")\
            .update(updates)\
            .eq("id_categoria", str(category_id))\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Error al actualizar categoría")
        
        cat = response.data[0]
        return CategoryResponse(
            id=UUID(cat["id_categoria"]),
            name=cat["nombre"],
            slug=cat["slug"],
            description=cat.get("descripcion"),
            color=cat.get("color"),
            icon=cat.get("icono"),
            order=cat.get("orden", 0),
            active=cat.get("activo", True),
            createdAt=cat["fecha_creacion"],
            updatedAt=cat["fecha_actualizacion"],
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating category {category_id}: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar categoría")


# ────────────────────────────────────────────────────────────────────────
# DELETE /api/categories/{id} - Eliminar/desactivar categoría
# ────────────────────────────────────────────────────────────────────────

@router.delete("/{category_id}", status_code=204)
async def delete_category(category_id: UUID):
    """
    Elimina una categoría (soft delete: marca como inactiva).
    
    Parámetros:
    - category_id: ID de la categoría (UUID)
    
    Nota: Los productos vinculados a esta categoría quedan con id_categoria = NULL
    """
    try:
        client = get_supabase_client()
        
        # Verificar que existe
        existing = client.table("categorias")\
            .select("id_categoria")\
            .eq("id_categoria", str(category_id))\
            .execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        
        # Soft delete: marcar como inactiva
        response = client.table("categorias")\
            .update({
                "activo": False,
                "fecha_actualizacion": datetime.now(timezone(timedelta(hours=-3))).isoformat()
            })\
            .eq("id_categoria", str(category_id))\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Error al eliminar categoría")
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting category {category_id}: {e}")
        raise HTTPException(status_code=500, detail="Error al eliminar categoría")
