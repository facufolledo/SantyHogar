"""API endpoints para CRUD de categorías dinámicas."""
import logging
import uuid
from typing import List
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, HTTPException, Depends, Query, File, UploadFile, status
from uuid import UUID

from app.database.connection import get_supabase_client
from app.models.schemas import (
    CategoryResponse,
    CreateCategoryRequest,
    UpdateCategoryRequest,
    ImageUploadResponse,
)
from app.services.image_service import ImageService
from app.deps import get_image_service


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/categories", tags=["Categories"])


def generate_slug(name: str) -> str:
    """Genera un slug a partir del nombre de la categoría."""
    return name.lower().replace(" ", "-").replace("_", "-")


def _category_to_response(cat: dict) -> CategoryResponse:
    """Convierte un registro de categoría a CategoryResponse."""
    return CategoryResponse(
        id=UUID(cat["id_categoria"]),
        name=cat["nombre"],
        slug=cat["slug"],
        description=cat.get("descripcion"),
        color=cat.get("color"),
        icon=cat.get("icono"),
        imageUrl=cat.get("image_url"),
        order=cat.get("orden", 0),
        active=cat.get("activo", True),
        createdAt=cat["fecha_creacion"],
        updatedAt=cat["fecha_actualizacion"],
    )


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
        
        return [_category_to_response(cat) for cat in response.data]
        
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
        argentina_tz = timezone(timedelta(hours=-3))
        now = datetime.now(argentina_tz).isoformat()
        
        new_category = {
            "id_categoria": category_id,
            "nombre": request.name,
            "slug": slug,
            "descripcion": request.description,
            "color": request.color,
            "icono": request.icon,
            "image_url": request.imageUrl,
            "orden": request.order,
            "activo": True,
            "fecha_creacion": now,
            "fecha_actualizacion": now,
        }
        
        response = client.table("categorias").insert(new_category).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Error al crear categoría")
        
        return _category_to_response(response.data[0])
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
        
        return _category_to_response(response.data[0])
        
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
        if request.imageUrl is not None:
            updates["image_url"] = request.imageUrl
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
        
        return _category_to_response(response.data[0])
        
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


# ────────────────────────────────────────────────────────────────────────
# POST /api/categories/{id}/upload-image - Subir imagen de categoría
# ────────────────────────────────────────────────────────────────────────

@router.post(
    "/{category_id}/upload-image",
    response_model=ImageUploadResponse,
    status_code=status.HTTP_200_OK,
)
async def upload_category_image(
    category_id: UUID,
    file: UploadFile = File(...),
    image_service: ImageService = Depends(get_image_service),
):
    """
    Sube una imagen para una categoría y actualiza image_url en la BD.
    
    Parámetros:
    - category_id: ID de la categoría (UUID)
    - file: Archivo de imagen (JPEG, PNG, WEBP, máx 5MB)
    
    Retorna: URL pública de la imagen subida
    """
    try:
        client = get_supabase_client()
        
        # Verificar que la categoría existe
        existing = client.table("categorias")\
            .select("id_categoria")\
            .eq("id_categoria", str(category_id))\
            .execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=404,
                detail="Categoría no encontrada"
            )
        
        # Subir imagen a Supabase Storage
        url, filename = await image_service.upload_image(file)
        
        # Actualizar image_url en la BD
        argentina_tz = timezone(timedelta(hours=-3))
        now = datetime.now(argentina_tz).isoformat()
        
        update_response = client.table("categorias")\
            .update({
                "image_url": url,
                "fecha_actualizacion": now,
            })\
            .eq("id_categoria", str(category_id))\
            .execute()
        
        if not update_response.data:
            raise HTTPException(
                status_code=500,
                detail="Error al actualizar imagen en BD"
            )
        
        return ImageUploadResponse(url=url, filename=filename)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading category image: {e}")
        raise HTTPException(status_code=500, detail="Error al subir imagen")
