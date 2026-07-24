"""Modelos para importación masiva de productos."""
from typing import List, Optional
from pydantic import BaseModel, Field


class ProductImportRow(BaseModel):
    """Fila individual del Excel de importación."""

    nombre: str = Field(min_length=1, max_length=255)
    precio: float = Field(default=0.0, ge=0)
    precio_costo: Optional[float] = Field(default=None, ge=0)
    stock: int = Field(ge=0, default=0)
    categoria: str = Field(min_length=1, max_length=100)  # Flexible - accepts any category slug
    subcategoria: Optional[str] = Field(default="General", max_length=100)
    descripcion: Optional[str] = Field(default="", max_length=5000)
    marca: Optional[str] = Field(default="Sin marca", max_length=100)
    slug: Optional[str] = None
    imagen: Optional[str] = None
    especificaciones: Optional[dict] = Field(default_factory=dict)


class ProductImportValidation(BaseModel):
    """Resultado de validación de una fila."""

    row_number: int
    valid: bool
    data: Optional[ProductImportRow] = None
    errors: List[str] = Field(default_factory=list)


class BulkImportResponse(BaseModel):
    """Respuesta del endpoint de importación masiva."""

    total_rows: int
    valid_rows: int
    invalid_rows: int
    imported_count: int
    validations: List[ProductImportValidation]
    message: str


class ExcelImportPreview(BaseModel):
    """Respuesta del endpoint de preview de importación Excel."""

    total_rows: int
    valid_rows: int
    invalid_rows: int
    validations: List[ProductImportValidation]


class ExcelImportConfirmRow(BaseModel):
    """Fila confirmada para importar con datos posiblemente editados."""

    nombre: str = Field(min_length=1, max_length=255)
    precio: float = Field(default=0.0, ge=0)
    stock: int = Field(ge=0, default=0)
    categoria: str = Field(min_length=1, max_length=100)  # Flexible - accepts any category slug
    subcategoria: Optional[str] = Field(default="General", max_length=100)
    descripcion: Optional[str] = Field(default="", max_length=5000)
    marca: Optional[str] = Field(default="Sin marca", max_length=100)
    imagen: Optional[str] = None
    especificaciones: Optional[dict] = Field(default_factory=dict)


class ExcelImportConfirmRequest(BaseModel):
    """Request para confirmar importación de filas seleccionadas."""

    rows: List[ExcelImportConfirmRow] = Field(min_length=1)


# ================================================================== #
# BULK IMAGE UPLOAD
# ================================================================== #

class BulkImageUploadRow(BaseModel):
    """Fila de producto con URLs de imágenes."""
    
    nombre_producto: str = Field(min_length=1, max_length=255, description="Nombre del producto a matchear")
    imagenes: List[str] = Field(min_length=1, description="Lista de URLs de imágenes")


class BulkImageUploadPreviewRow(BaseModel):
    """Resultado de preview de una fila de upload de imágenes."""
    
    row_number: int
    nombre_producto: str
    imagenes_solicitadas: int
    producto_encontrado: bool
    producto_id: Optional[str] = None
    producto_nombre_encontrado: Optional[str] = None
    errors: List[str] = Field(default_factory=list)


class BulkImageUploadPreviewResponse(BaseModel):
    """Respuesta del preview de bulk image upload."""
    
    total_rows: int
    matched_products: int
    unmatched_products: int
    total_images: int
    previews: List[BulkImageUploadPreviewRow]


class BulkImageUploadConfirmRow(BaseModel):
    """Fila confirmada para upload de imágenes."""
    
    producto_id: str = Field(description="UUID del producto")
    imagenes: List[str] = Field(min_length=1, description="URLs de imágenes a descargar")


class BulkImageUploadConfirmRequest(BaseModel):
    """Request para confirmar upload de imágenes."""
    
    rows: List[BulkImageUploadConfirmRow] = Field(min_length=1)


class BulkImageUploadResponse(BaseModel):
    """Respuesta del endpoint de bulk image upload."""
    
    total_products: int
    successful_uploads: int
    failed_uploads: int
    total_images_uploaded: int
    details: List[dict] = Field(default_factory=list)
    message: str
