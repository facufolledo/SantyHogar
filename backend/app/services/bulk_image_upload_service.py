"""Servicio para carga masiva de imágenes vinculadas a productos."""
import logging
import asyncio
from typing import List, Optional, Tuple
from io import BytesIO
from uuid import UUID
import httpx

from app.models.bulk_import import (
    BulkImageUploadConfirmRow,
    BulkImageUploadPreviewRow,
    BulkImageUploadResponse,
)

logger = logging.getLogger(__name__)


async def match_products_by_name(
    supabase_client,
    product_names: List[str],
) -> dict:
    """
    Matchea nombres de productos con productos existentes en la BD.
    Usa búsqueda fuzzy (aproximada) para tolerar pequeñas diferencias.
    
    Args:
        supabase_client: Cliente de Supabase
        product_names: Lista de nombres de productos a buscar
        
    Returns:
        Dict {nombre_original: {id_producto, nombre_encontrado}} o None si no existe
    """
    matches = {}
    
    try:
        # Obtener todos los productos
        result = supabase_client.table("productos")\
            .select("id_producto, nombre")\
            .execute()
        
        if not result.data:
            logger.warning("No hay productos en la BD para matchear")
            return matches
        
        all_products = {p["nombre"].lower(): (p["id_producto"], p["nombre"]) for p in result.data}
        logger.info(f"Se encontraron {len(all_products)} productos en la BD para matchear")
        
        for query_name in product_names:
            query_lower = query_name.lower().strip()
            
            # Búsqueda exacta primero
            if query_lower in all_products:
                product_id, product_name = all_products[query_lower]
                matches[query_name] = {
                    "id": product_id,
                    "nombre": product_name,
                    "match_type": "exact"
                }
                logger.info(f"  ✓ Match exacto: '{query_name}' -> '{product_name}'")
                continue
            
            # Búsqueda fuzzy: buscar palabras comunes
            best_match = None
            best_score = 0
            
            for product_name_db, (product_id, original_name) in all_products.items():
                # Calcular similitud simple: palabras en común
                query_words = set(query_lower.split())
                db_words = set(product_name_db.split())
                
                if query_words and db_words:
                    common_words = query_words & db_words
                    score = len(common_words) / max(len(query_words), len(db_words))
                    
                    # Si coinciden al menos 2 palabras o 50% de similitud
                    if score >= 0.5 or len(common_words) >= 2:
                        if score > best_score:
                            best_score = score
                            best_match = (product_id, original_name)
            
            if best_match and best_score >= 0.5:
                product_id, product_name = best_match
                matches[query_name] = {
                    "id": product_id,
                    "nombre": product_name,
                    "match_type": "fuzzy"
                }
                logger.info(f"  ≈ Match fuzzy: '{query_name}' -> '{product_name}' (score: {best_score:.2f})")
            else:
                logger.warning(f"  ✗ Sin coincidencia: '{query_name}'")
    
    except Exception as e:
        logger.error(f"Error en match_products_by_name: {str(e)}")
    
    return matches


async def validate_image_urls(urls: List[str]) -> Tuple[List[str], List[Tuple[str, str]]]:
    """
    Valida que las URLs sean accesibles y sean imágenes.
    
    Args:
        urls: Lista de URLs de imágenes
        
    Returns:
        Tupla (urls_validas, errores)
        - urls_validas: Lista de URLs que son válidas
        - errores: Lista de tuplas (url, error_message)
    """
    valid_urls = []
    errors = []
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        for url in urls:
            try:
                # Hacer HEAD request para verificar que existe
                response = await client.head(url, follow_redirects=True)
                
                if response.status_code != 200:
                    errors.append((url, f"HTTP {response.status_code}"))
                    continue
                
                # Verificar que sea una imagen
                content_type = response.headers.get("content-type", "").lower()
                if not any(img_type in content_type for img_type in ["image/", "application/octet-stream"]):
                    errors.append((url, "No es una imagen válida"))
                    continue
                
                # Verificar tamaño (máximo 5 MB)
                content_length = response.headers.get("content-length")
                if content_length and int(content_length) > 5 * 1024 * 1024:
                    errors.append((url, "Imagen mayor a 5 MB"))
                    continue
                
                valid_urls.append(url)
                logger.info(f"  ✓ URL válida: {url}")
                
            except Exception as e:
                errors.append((url, str(e)))
                logger.warning(f"  ✗ Error validando URL: {url} - {str(e)}")
    
    return valid_urls, errors


async def preview_bulk_image_upload(
    supabase_client,
    rows: List[dict],
) -> dict:
    """
    Genera un preview de la carga masiva de imágenes.
    Matchea productos y valida URLs.
    
    Args:
        supabase_client: Cliente de Supabase
        rows: Lista de dicts {nombre_producto, imagenes}
        
    Returns:
        Dict con resultado del preview
    """
    preview_rows = []
    product_names = [r.get("nombre_producto", "").strip() for r in rows if r.get("nombre_producto")]
    
    # Matchear todos los productos
    matches = await match_products_by_name(supabase_client, product_names)
    
    total_images = 0
    matched_count = 0
    unmatched_count = 0
    
    for row_idx, row in enumerate(rows, start=1):
        nombre_producto = row.get("nombre_producto", "").strip()
        imagenes_urls = row.get("imagenes", [])
        
        if not nombre_producto or not imagenes_urls:
            continue
        
        # Validar URLs
        valid_urls, url_errors = await validate_image_urls(imagenes_urls)
        total_images += len(imagenes_urls)
        
        # Buscar match
        match = matches.get(nombre_producto)
        
        preview_row = BulkImageUploadPreviewRow(
            row_number=row_idx,
            nombre_producto=nombre_producto,
            imagenes_solicitadas=len(imagenes_urls),
            producto_encontrado=match is not None,
            producto_id=match["id"] if match else None,
            producto_nombre_encontrado=match["nombre"] if match else None,
            errors=[]
        )
        
        if not match:
            preview_row.errors.append(f"Producto no encontrado: '{nombre_producto}'")
            unmatched_count += 1
        else:
            matched_count += 1
        
        # Agregar errores de URLs
        for url, error in url_errors:
            preview_row.errors.append(f"URL inválida: {error}")
        
        preview_rows.append(preview_row)
    
    return {
        "total_rows": len(rows),
        "matched_products": matched_count,
        "unmatched_products": unmatched_count,
        "total_images": total_images,
        "previews": preview_rows,
    }


async def download_and_save_image(
    image_url: str,
    product_id: str,
    image_index: int,
    supabase_client,
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Descarga una imagen desde URL y la guarda en Supabase Storage.
    
    Args:
        image_url: URL de la imagen
        product_id: ID del producto
        image_index: Índice de la imagen (para nombrado)
        supabase_client: Cliente de Supabase
        
    Returns:
        Tupla (éxito, url_pública, error_message)
    """
    try:
        # Descargar imagen
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(image_url, follow_redirects=True)
            response.raise_for_status()
        
        image_data = response.content
        
        # Determinar extensión de archivo
        content_type = response.headers.get("content-type", "image/jpeg").lower()
        if "png" in content_type:
            ext = "png"
        elif "webp" in content_type:
            ext = "webp"
        else:
            ext = "jpg"
        
        # Nombres de archivo
        filename = f"product_{product_id}_img_{image_index}.{ext}"
        file_path = f"products/{product_id}/{filename}"
        
        # Subir a Supabase Storage
        supabase_client.storage.from_("product-images").upload(
            file_path,
            image_data,
            {"content-type": f"image/{ext}"}
        )
        
        # Obtener URL pública
        public_url = supabase_client.storage.from_("product-images").get_public_url(file_path)
        
        logger.info(f"  ✓ Imagen descargada y subida: {filename}")
        return True, public_url, None
        
    except Exception as e:
        logger.error(f"Error descargando imagen {image_url}: {str(e)}")
        return False, None, str(e)


async def process_bulk_image_upload(
    supabase_client,
    confirmed_rows: List[BulkImageUploadConfirmRow],
) -> BulkImageUploadResponse:
    """
    Procesa la carga masiva de imágenes.
    Descarga cada imagen y la vincula al producto.
    
    Args:
        supabase_client: Cliente de Supabase
        confirmed_rows: Lista de filas confirmadas con producto_id e imagenes
        
    Returns:
        Resultado del upload
    """
    successful = 0
    failed = 0
    total_images = 0
    details = []
    
    logger.info(f"\n{'='*80}")
    logger.info(f"BULK IMAGE UPLOAD - Procesando {len(confirmed_rows)} productos")
    logger.info(f"{'='*80}\n")
    
    for row_idx, row in enumerate(confirmed_rows, start=1):
        producto_id = row.producto_id
        imagenes_urls = row.imagenes or []
        
        logger.info(f"Producto {row_idx}/{len(confirmed_rows)}: {producto_id}")
        
        try:
            # Obtener producto actual para ver imágenes existentes
            product_result = supabase_client.table("productos")\
                .select("imagenes")\
                .eq("id_producto", producto_id)\
                .single()\
                .execute()
            
            if not product_result.data:
                logger.warning(f"  ✗ Producto no encontrado: {producto_id}")
                failed += 1
                details.append({
                    "producto_id": producto_id,
                    "éxito": False,
                    "error": "Producto no encontrado",
                    "imágenes_cargadas": 0
                })
                continue
            
            existing_images = product_result.data.get("imagenes") or []
            new_images = []
            images_loaded = 0
            
            # Descargar y subir cada imagen
            for img_idx, image_url in enumerate(imagenes_urls, start=1):
                logger.info(f"  Imagen {img_idx}/{len(imagenes_urls)}: {image_url[:50]}...")
                
                success, public_url, error = await download_and_save_image(
                    image_url,
                    producto_id,
                    img_idx,
                    supabase_client
                )
                
                total_images += 1
                
                if success and public_url:
                    new_images.append(public_url)
                    images_loaded += 1
                else:
                    logger.warning(f"    Error: {error}")
            
            # Actualizar producto con nuevas imágenes
            all_images = existing_images + new_images
            
            update_result = supabase_client.table("productos")\
                .update({"imagenes": all_images})\
                .eq("id_producto", producto_id)\
                .execute()
            
            if update_result.data:
                successful += 1
                logger.info(f"  ✓ Actualizado: {images_loaded}/{len(imagenes_urls)} imágenes cargadas")
                details.append({
                    "producto_id": producto_id,
                    "éxito": True,
                    "imágenes_cargadas": images_loaded,
                    "imágenes_totales": len(all_images)
                })
            else:
                failed += 1
                logger.error(f"  ✗ Error al actualizar producto")
                details.append({
                    "producto_id": producto_id,
                    "éxito": False,
                    "error": "Error al actualizar producto en BD",
                    "imágenes_cargadas": 0
                })
        
        except Exception as e:
            failed += 1
            logger.error(f"  ✗ Error procesando producto {producto_id}: {str(e)}")
            details.append({
                "producto_id": producto_id,
                "éxito": False,
                "error": str(e),
                "imágenes_cargadas": 0
            })
    
    logger.info(f"\n{'='*80}")
    logger.info(f"RESULTADO: {successful} exitosos, {failed} fallidos")
    logger.info(f"Total imágenes: {total_images}")
    logger.info(f"{'='*80}\n")
    
    return BulkImageUploadResponse(
        total_products=len(confirmed_rows),
        successful_uploads=successful,
        failed_uploads=failed,
        total_images_uploaded=total_images,
        details=details,
        message=f"Carga completada: {successful} productos actualizados, {total_images} imágenes cargadas"
    )
