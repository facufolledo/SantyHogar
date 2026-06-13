"""Rutas de productos."""
from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile, status, HTTPException

from app.deps import get_image_service, get_product_service, get_supabase
from app.exceptions import ProductNotFoundError
from app.mappers import product_to_response
from app.models.bulk_import import BulkImportResponse, ExcelImportConfirmRequest, ExcelImportPreview
from app.models.schemas import (
    CreateProductRequest,
    ImageUploadResponse,
    ProductResponse,
    UpdatePriceByProductBody,
    UpdatePriceRequest,
    UpdatePriceResponse,
    UpdateProductRequest,
)
from app.services.bulk_import_service import parse_xlsx_file, process_bulk_import, process_xlsx_import
from app.services.image_service import ImageService, ImageValidationError
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
    "/products/upload-image",
    response_model=ImageUploadResponse,
    status_code=status.HTTP_200_OK,
)
async def upload_product_image(
    file: UploadFile = File(...),
    image_service: ImageService = Depends(get_image_service),
) -> ImageUploadResponse:
    """Sube una imagen de producto a Supabase Storage.

    Valida tipo (JPEG, PNG, WebP) y tamaño (≤5 MB).
    Retorna la URL pública y el nombre del archivo generado.
    """
    try:
        url, filename = await image_service.upload_image(file)
        return ImageUploadResponse(url=url, filename=filename)
    except ImageValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.post(
    "/products/bulk-import/preview",
    response_model=ExcelImportPreview,
    status_code=status.HTTP_200_OK,
)
async def bulk_import_preview(
    file: UploadFile = File(...),
) -> ExcelImportPreview:
    """
    Preview de importación masiva desde archivo .xlsx.
    
    Parsea el archivo y retorna las validaciones sin insertar en la BD.
    El frontend muestra esta preview para que el admin seleccione qué filas importar.
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"=== BULK IMPORT PREVIEW === Archivo: {file.filename}")
    
    # Validar tipo de archivo
    if not file.filename or not file.filename.endswith('.xlsx'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser .xlsx"
        )
    
    # Leer contenido del archivo
    content = await file.read()
    logger.info(f"Archivo leído: {len(content)} bytes")
    
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo está vacío"
        )
    
    # Parsear el archivo
    validations = parse_xlsx_file(content)
    
    # Verificar si hay datos
    if not validations or (len(validations) == 1 and not validations[0].valid and validations[0].row_number == 0):
        error_msg = validations[0].errors[0] if validations and validations[0].errors else "El archivo no contiene productos para importar"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    valid_rows = [v for v in validations if v.valid]
    invalid_rows = [v for v in validations if not v.valid]
    
    return ExcelImportPreview(
        total_rows=len(validations),
        valid_rows=len(valid_rows),
        invalid_rows=len(invalid_rows),
        validations=validations,
    )


@router.post(
    "/products/bulk-import",
    response_model=BulkImportResponse,
    status_code=status.HTTP_200_OK,
)
async def bulk_import_products(
    file: UploadFile = File(None),
    supabase = Depends(get_supabase),
) -> BulkImportResponse:
    """
    Importación masiva de productos desde archivo .xlsx.
    
    Acepta un archivo .xlsx, lo parsea e importa los productos válidos.
    Para el flujo de dos pasos, usar primero /bulk-import/preview y luego /bulk-import/confirm.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    if file is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere un archivo .xlsx"
        )
    
    logger.info(f"=== BULK IMPORT INICIADO === Archivo: {file.filename}")
    
    # Validar tipo de archivo - ahora acepta .xlsx
    if not file.filename or not file.filename.endswith('.xlsx'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser .xlsx"
        )
    
    # Leer contenido del archivo
    content = await file.read()
    logger.info(f"Archivo leído: {len(content)} bytes")
    
    # Parsear el archivo Excel
    validations = parse_xlsx_file(content)
    
    # Verificar si hay datos
    if not validations or (len(validations) == 1 and not validations[0].valid and validations[0].row_number == 0):
        error_msg = validations[0].errors[0] if validations and validations[0].errors else "El archivo no contiene productos para importar"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Importar filas válidas
    valid_rows = [v for v in validations if v.valid]
    invalid_rows = [v for v in validations if not v.valid]
    imported_count = 0
    
    for validation in valid_rows:
        if validation.data:
            try:
                product_data = {
                    'nombre': validation.data.nombre,
                    'slug': validation.data.slug,
                    'categoria': validation.data.categoria,
                    'subcategoria': validation.data.subcategoria,
                    'precio': validation.data.precio,
                    'precio_original': None,
                    'stock': validation.data.stock,
                    'marca': validation.data.marca,
                    'descripcion': validation.data.descripcion or '',
                    'imagenes': [validation.data.imagen] if validation.data.imagen else [],
                    'especificaciones': {},
                    'destacado': False,
                    'calificacion': 0.0,
                    'cantidad_resenas': 0,
                }
                
                result = supabase.table('productos').insert(product_data).execute()
                
                if result.data:
                    imported_count += 1
            except Exception as e:
                validation.valid = False
                validation.errors.append(f"Error al insertar: {str(e)}")
    
    return BulkImportResponse(
        total_rows=len(validations),
        valid_rows=len(valid_rows),
        invalid_rows=len(invalid_rows),
        imported_count=imported_count,
        validations=validations,
        message=f"Importación completada: {imported_count} productos importados de {len(valid_rows)} válidos",
    )


@router.post(
    "/products/bulk-import/confirm",
    response_model=BulkImportResponse,
    status_code=status.HTTP_200_OK,
)
async def bulk_import_confirm(
    body: ExcelImportConfirmRequest,
    supabase = Depends(get_supabase),
) -> BulkImportResponse:
    """
    Confirma la importación de filas seleccionadas del preview.
    
    Recibe la lista de productos confirmados (posiblemente editados) y los inserta en la BD.
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"=== BULK IMPORT CONFIRM === {len(body.rows)} filas a importar")
    
    result = await process_xlsx_import(body.rows, supabase)
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
