"""Rutas de favoritos."""
import logging
from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import get_db, get_supabase
from app.models.schemas import ProductResponse
from app.mappers import product_to_response

router = APIRouter(prefix="/api/customers", tags=["favorites"])
logger = logging.getLogger(__name__)


@router.post("/{customer_id}/favorites")
async def add_favorite(
    customer_id: str,
    product_id: str,
    supabase = Depends(get_supabase),
) -> dict:
    """Agrega un producto a favoritos del cliente.
    
    Args:
        customer_id: UUID del cliente
        product_id: UUID del producto
        
    Returns:
        {"message": "Producto agregado a favoritos", "product_id": "..."}
        
    Raises:
        404: Si producto no existe
        409: Si ya está en favoritos
    """
    try:
        # Validar que el producto existe
        product = supabase.table("productos").select("id").eq("id", product_id).execute()
        if not product.data:
            raise HTTPException(
                status_code=404,
                detail="Producto no encontrado"
            )
        
        # Intentar agregar a favoritos (UNIQUE constraint handled by DB)
        result = supabase.table("favoritos").insert({
            "customer_id": customer_id,
            "product_id": product_id,
        }).execute()
        
        logger.info(f"Producto {product_id} agregado a favoritos de {customer_id}")
        
        return {
            "message": "Producto agregado a favoritos",
            "product_id": product_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Si es UNIQUE constraint, retornar 409
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(
                status_code=409,
                detail="Este producto ya está en favoritos"
            )
        logger.error(f"Error agregando favorito: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error agregando a favoritos: {str(e)}"
        )


@router.delete("/{customer_id}/favorites/{product_id}")
async def remove_favorite(
    customer_id: str,
    product_id: str,
    supabase = Depends(get_supabase),
) -> dict:
    """Remueve un producto de favoritos del cliente.
    
    Args:
        customer_id: UUID del cliente
        product_id: UUID del producto
        
    Returns:
        {"message": "Producto removido de favoritos"}
    """
    try:
        result = supabase.table("favoritos").delete().eq(
            "customer_id", customer_id
        ).eq("product_id", product_id).execute()
        
        logger.info(f"Producto {product_id} removido de favoritos de {customer_id}")
        
        return {
            "message": "Producto removido de favoritos"
        }
        
    except Exception as e:
        logger.error(f"Error removiendo favorito: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error removiendo de favoritos: {str(e)}"
        )


@router.get("/{customer_id}/favorites")
async def get_favorites(
    customer_id: str,
    supabase = Depends(get_supabase),
) -> dict:
    """Obtiene lista de productos favoritos del cliente.
    
    Args:
        customer_id: UUID del cliente
        
    Returns:
        {
            "total": 5,
            "favorites": [
                {"id": "...", "name": "...", ...},
                ...
            ]
        }
    """
    try:
        # Obtener favoritos del cliente con info del producto
        result = supabase.table("favoritos").select(
            "product_id, productos(id, nombre, precio, imagen_url, categoria, stock)"
        ).eq("customer_id", customer_id).execute()
        
        if not result.data:
            return {
                "total": 0,
                "favorites": []
            }
        
        # Mapear resultados
        favorites = []
        for row in result.data:
            product_data = row.get("productos")
            if product_data:
                # Mapear a formato esperado
                product = {
                    "id": product_data.get("id"),
                    "name": product_data.get("nombre"),
                    "price": float(product_data.get("precio", 0)),
                    "image_url": product_data.get("imagen_url"),
                    "category": product_data.get("categoria"),
                    "stock": int(product_data.get("stock", 0)),
                }
                favorites.append(product)
        
        logger.info(f"Retornando {len(favorites)} favoritos para {customer_id}")
        
        return {
            "total": len(favorites),
            "favorites": favorites
        }
        
    except Exception as e:
        logger.error(f"Error obteniendo favoritos: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo favoritos: {str(e)}"
        )
