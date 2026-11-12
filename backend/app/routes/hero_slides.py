"""API endpoints para gestionar Hero Slides (promociones del home)."""
import logging
import uuid
from typing import List
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from app.database.connection import get_supabase_client
from app.models.schemas import HeroSlideResponse, CreateHeroSlideRequest, UpdateHeroSlideRequest
from app.services.cache_service import cache_get, cache_set, cache_clear

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/hero-slides", tags=["Hero Slides"])


# ════════════════════════════════════════════════════════════════════════════════
# GET /api/hero-slides - Listar todos los hero slides activos
# ════════════════════════════════════════════════════════════════════════════════

@router.get("", response_model=List[HeroSlideResponse])
async def list_hero_slides(active_only: bool = Query(True)):
    """
    Obtiene todos los hero slides activos, ordenados por fecha y orden.
    Resultado cacheado por 60 segundos.
    
    Parámetros:
    - active_only: Si True, solo retorna slides con activo=True
    
    Retorna: Lista de hero slides
    """
    try:
        cache_key = f"hero_slides:active={active_only}"
        cached = cache_get(cache_key)
        if cached is not None:
            return cached
        
        client = get_supabase_client()
        now = datetime.utcnow().isoformat()
        
        # Query base
        query = client.table("hero_slides")\
            .select("*")\
            .order("orden")
        
        # Filtrar activos
        if active_only:
            query = query.eq("activo", True)
        
        # Filtrar por fechas (si existen)
        response = query.execute()
        
        if not response.data:
            result = []
        else:
            # Filtrar por fechas en memoria (Supabase no soporta bien comparaciones complejas con NULL)
            slides = []
            for slide in response.data:
                # Si tiene fecha_inicio y está en el futuro, skip
                if slide.get("fecha_inicio"):
                    if datetime.fromisoformat(slide["fecha_inicio"]) > datetime.fromisoformat(now):
                        continue
                
                # Si tiene fecha_fin y está en el pasado, skip
                if slide.get("fecha_fin"):
                    if datetime.fromisoformat(slide["fecha_fin"]) < datetime.fromisoformat(now):
                        continue
                
                slides.append(HeroSlideResponse(
                    id=UUID(slide["id_hero"]),
                    titulo=slide["titulo"],
                    subtitulo=slide.get("subtitulo"),
                    textoCta=slide.get("texto_cta"),
                    imagenUrl=slide["imagen_url"],
                    enlace=slide.get("enlace"),
                    orden=slide.get("orden", 0),
                    activo=slide.get("activo", True),
                    fechaInicio=slide.get("fecha_inicio"),
                    fechaFin=slide.get("fecha_fin"),
                    fechaCreacion=slide["fecha_creacion"],
                    fechaActualizacion=slide["fecha_actualizacion"],
                ))
            result = slides
        
        # Cache por 60 segundos
        cache_set(cache_key, result, ttl=60)
        return result
        
    except Exception as e:
        logger.error(f"Error listing hero slides: {e}")
        raise HTTPException(status_code=500, detail="Error al listar hero slides")


# ════════════════════════════════════════════════════════════════════════════════
# POST /api/hero-slides - Crear nuevo hero slide
# ════════════════════════════════════════════════════════════════════════════════

@router.post("", response_model=HeroSlideResponse, status_code=201)
async def create_hero_slide(request: CreateHeroSlideRequest):
    """
    Crea un nuevo hero slide.
    
    Body:
    - titulo: Título principal (requerido)
    - subtitulo: Subtítulo descriptivo (opcional)
    - textoCta: Texto del botón CTA (opcional)
    - imagenUrl: URL de la imagen (requerido)
    - enlace: Link del CTA (opcional)
    - orden: Orden de aparición (default: 0)
    - fechaInicio: Fecha de inicio (opcional)
    - fechaFin: Fecha de fin (opcional)
    
    Retorna: Hero slide creado
    """
    try:
        client = get_supabase_client()
        
        # Crear hero slide
        slide_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        new_slide = {
            "id_hero": slide_id,
            "titulo": request.titulo,
            "subtitulo": request.subtitulo,
            "texto_cta": request.textoCta,
            "imagen_url": request.imagenUrl,
            "enlace": request.enlace,
            "orden": request.orden,
            "activo": True,
            "fecha_inicio": request.fechaInicio,
            "fecha_fin": request.fechaFin,
            "fecha_creacion": now,
            "fecha_actualizacion": now,
        }
        
        response = client.table("hero_slides").insert(new_slide).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Error al crear hero slide")
        
        # Invalidar cache
        cache_clear("hero_slides:active=True")
        cache_clear("hero_slides:active=False")
        
        slide = response.data[0]
        return HeroSlideResponse(
            id=UUID(slide["id_hero"]),
            titulo=slide["titulo"],
            subtitulo=slide.get("subtitulo"),
            textoCta=slide.get("texto_cta"),
            imagenUrl=slide["imagen_url"],
            enlace=slide.get("enlace"),
            orden=slide.get("orden", 0),
            activo=slide.get("activo", True),
            fechaInicio=slide.get("fecha_inicio"),
            fechaFin=slide.get("fecha_fin"),
            fechaCreacion=slide["fecha_creacion"],
            fechaActualizacion=slide["fecha_actualizacion"],
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating hero slide: {e}")
        raise HTTPException(status_code=500, detail="Error al crear hero slide")


# ════════════════════════════════════════════════════════════════════════════════
# GET /api/hero-slides/{id} - Obtener hero slide por ID
# ════════════════════════════════════════════════════════════════════════════════

@router.get("/{slide_id}", response_model=HeroSlideResponse)
async def get_hero_slide(slide_id: UUID):
    """Obtiene un hero slide específico."""
    try:
        client = get_supabase_client()
        
        response = client.table("hero_slides")\
            .select("*")\
            .eq("id_hero", str(slide_id))\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Hero slide no encontrado")
        
        slide = response.data[0]
        return HeroSlideResponse(
            id=UUID(slide["id_hero"]),
            titulo=slide["titulo"],
            subtitulo=slide.get("subtitulo"),
            textoCta=slide.get("texto_cta"),
            imagenUrl=slide["imagen_url"],
            enlace=slide.get("enlace"),
            orden=slide.get("orden", 0),
            activo=slide.get("activo", True),
            fechaInicio=slide.get("fecha_inicio"),
            fechaFin=slide.get("fecha_fin"),
            fechaCreacion=slide["fecha_creacion"],
            fechaActualizacion=slide["fecha_actualizacion"],
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting hero slide {slide_id}: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener hero slide")


# ════════════════════════════════════════════════════════════════════════════════
# PATCH /api/hero-slides/{id} - Actualizar hero slide
# ════════════════════════════════════════════════════════════════════════════════

@router.patch("/{slide_id}", response_model=HeroSlideResponse)
async def update_hero_slide(slide_id: UUID, request: UpdateHeroSlideRequest):
    """Actualiza un hero slide existente."""
    try:
        client = get_supabase_client()
        
        # Verificar que existe
        existing = client.table("hero_slides")\
            .select("id_hero")\
            .eq("id_hero", str(slide_id))\
            .execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Hero slide no encontrado")
        
        # Preparar actualización
        updates = {}
        if request.titulo is not None:
            updates["titulo"] = request.titulo
        if request.subtitulo is not None:
            updates["subtitulo"] = request.subtitulo
        if request.textoCta is not None:
            updates["texto_cta"] = request.textoCta
        if request.imagenUrl is not None:
            updates["imagen_url"] = request.imagenUrl
        if request.enlace is not None:
            updates["enlace"] = request.enlace
        if request.orden is not None:
            updates["orden"] = request.orden
        if request.activo is not None:
            updates["activo"] = request.activo
        if request.fechaInicio is not None:
            updates["fecha_inicio"] = request.fechaInicio
        if request.fechaFin is not None:
            updates["fecha_fin"] = request.fechaFin
        
        updates["fecha_actualizacion"] = datetime.utcnow().isoformat()
        
        # Actualizar
        response = client.table("hero_slides")\
            .update(updates)\
            .eq("id_hero", str(slide_id))\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Error al actualizar hero slide")
        
        # Invalidar cache
        cache_clear("hero_slides:active=True")
        cache_clear("hero_slides:active=False")
        
        slide = response.data[0]
        return HeroSlideResponse(
            id=UUID(slide["id_hero"]),
            titulo=slide["titulo"],
            subtitulo=slide.get("subtitulo"),
            textoCta=slide.get("texto_cta"),
            imagenUrl=slide["imagen_url"],
            enlace=slide.get("enlace"),
            orden=slide.get("orden", 0),
            activo=slide.get("activo", True),
            fechaInicio=slide.get("fecha_inicio"),
            fechaFin=slide.get("fecha_fin"),
            fechaCreacion=slide["fecha_creacion"],
            fechaActualizacion=slide["fecha_actualizacion"],
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating hero slide {slide_id}: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar hero slide")


# ════════════════════════════════════════════════════════════════════════════════
# DELETE /api/hero-slides/{id} - Eliminar hero slide
# ════════════════════════════════════════════════════════════════════════════════

@router.delete("/{slide_id}", status_code=204)
async def delete_hero_slide(slide_id: UUID):
    """Elimina un hero slide (soft delete: marca como inactivo)."""
    try:
        client = get_supabase_client()
        
        # Verificar que existe
        existing = client.table("hero_slides")\
            .select("id_hero")\
            .eq("id_hero", str(slide_id))\
            .execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Hero slide no encontrado")
        
        # Soft delete: marcar como inactivo
        response = client.table("hero_slides")\
            .update({
                "activo": False,
                "fecha_actualizacion": datetime.utcnow().isoformat()
            })\
            .eq("id_hero", str(slide_id))\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Error al eliminar hero slide")
        
        # Invalidar cache
        cache_clear("hero_slides:active=True")
        cache_clear("hero_slides:active=False")
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting hero slide {slide_id}: {e}")
        raise HTTPException(status_code=500, detail="Error al eliminar hero slide")
