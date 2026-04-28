"""Rutas de productos."""
from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile, status, HTTPException

from app.deps import get_product_service, get_supabase
from app.exceptions import ProductNotFoundError
from app.mappers import product_to_response
from app.models.bulk_import import BulkImportResponse
from app.models.schemas import (
    CreateProductRequest,
    ProductResponse,
    UpdatePriceByProductBody,
    UpdatePriceRequest,
    UpdatePriceResponse,
    UpdateProductRequest,
)
from app.services.bulk_import_service import process_bulk_import
from app.services.product_service import ProductService

router = APIRouter(tags=["products"])


@router.get(
    "/products",
    response_model=List[ProductResponse],
    status_code=status.HTTP_200_OK,
)
async def list_products(
    product_service: Annotated[ProductService, Depends(get_product_service)],
) -> List[ProductResponse]:
    products = await product_service.get_all_products()
    return [product_to_response(p) for p in products]


@router.post(
    "/products/bulk-import",
    response_model=BulkImportResponse,
    status_code=status.HTTP_200_OK,
)
async def bulk_import_products(
    file: UploadFile = File(...),
    supabase = Depends(get_supabase),
) -> BulkImportResponse:
    """
    Importación masiva de productos desde archivo .doc
    
    Formato esperado del documento:
    - Código del producto
    - Nombre/Descripción
    - Categoría
    - Stock (a la derecha)
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"=== BULK IMPORT INICIADO === Archivo: {file.filename}")
    
    # Validar tipo de archivo
    if not file.filename or not (file.filename.endswith('.doc') or file.filename.endswith('.docx')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser .doc o .docx"
        )
    
    # Leer contenido del archivo
    content = await file.read()
    logger.info(f"Archivo leído: {len(content)} bytes")
    
    # Procesar importación
    result = await process_bulk_import(content, supabase)
    logger.info(f"Importación completada: {result.imported_count} productos importados")
    
    return result


@router.post(
    "/catalog/update-price",
    response_model=UpdatePriceResponse,
    status_code=status.HTTP_200_OK,
)
async def update_product_price_by_body(
    body: UpdatePriceByProductBody,
    product_service: Annotated[ProductService, Depends(get_product_service)],
) -> UpdatePriceResponse:
    """Misma lógica que PATCH/POST `/products/{id}/price`, pero sin path param (evita 404 en proxies raros)."""
    try:
        product = await product_service.update_product_price(
            body.product_id,
            body.price,
            body.original_price,
        )
        return UpdatePriceResponse(
            id=product.id,
            name=product.name,
            price=product.price,
            original_price=product.originalPrice,
            message="Precio actualizado correctamente",
        )
    except ProductNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.patch(
    "/products/{product_id}/price",
    response_model=UpdatePriceResponse,
    status_code=status.HTTP_200_OK,
)
@router.post(
    "/products/{product_id}/price",
    response_model=UpdatePriceResponse,
    status_code=status.HTTP_200_OK,
)
async def update_product_price(
    product_id: UUID,
    price_data: UpdatePriceRequest,
    product_service: Annotated[ProductService, Depends(get_product_service)],
) -> UpdatePriceResponse:
    """Actualiza el precio (y opcionalmente precio_original) de un producto."""
    try:
        product = await product_service.update_product_price(
            product_id,
            price_data.price,
            price_data.original_price,
        )
        return UpdatePriceResponse(
            id=product.id,
            name=product.name,
            price=product.price,
            original_price=product.originalPrice,
            message="Precio actualizado correctamente",
        )
    except ProductNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.post(
    "/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_product(
    product_data: CreateProductRequest,
    product_service: Annotated[ProductService, Depends(get_product_service)],
) -> ProductResponse:
    """Crea un nuevo producto."""
    # Convertir de camelCase a snake_case para la BD
    db_data = {
        "nombre": product_data.name,
        "categoria": product_data.category,
        "subcategoria": product_data.subcategory,
        "precio": product_data.price,
        "precio_original": product_data.original_price,
        "stock": product_data.stock,
        "marca": product_data.brand,
        "descripcion": product_data.description,
        "imagenes": product_data.images,
        "especificaciones": product_data.specs,
        "destacado": product_data.featured,
    }
    
    product = await product_service.create_product(db_data)
    return product_to_response(product)


@router.patch(
    "/products/{product_id}",
    response_model=ProductResponse,
    status_code=status.HTTP_200_OK,
)
async def update_product(
    product_id: UUID,
    product_data: UpdateProductRequest,
    product_service: Annotated[ProductService, Depends(get_product_service)],
) -> ProductResponse:
    """Actualiza un producto existente."""
    try:
        # Convertir solo los campos que no son None
        db_data = {}
        if product_data.name is not None:
            db_data["nombre"] = product_data.name
        if product_data.category is not None:
            db_data["categoria"] = product_data.category
        if product_data.subcategory is not None:
            db_data["subcategoria"] = product_data.subcategory
        if product_data.price is not None:
            db_data["precio"] = product_data.price
        if product_data.original_price is not None:
            db_data["precio_original"] = product_data.original_price
        if product_data.stock is not None:
            db_data["stock"] = product_data.stock
        if product_data.brand is not None:
            db_data["marca"] = product_data.brand
        if product_data.description is not None:
            db_data["descripcion"] = product_data.description
        if product_data.images is not None:
            db_data["imagenes"] = product_data.images
        if product_data.specs is not None:
            db_data["especificaciones"] = product_data.specs
        if product_data.featured is not None:
            db_data["destacado"] = product_data.featured
        
        product = await product_service.update_product(product_id, db_data)
        return product_to_response(product)
    except ProductNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete(
    "/products/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_product(
    product_id: UUID,
    product_service: Annotated[ProductService, Depends(get_product_service)],
) -> None:
    """Elimina un producto."""
    try:
        await product_service.delete_product(product_id)
    except ProductNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
