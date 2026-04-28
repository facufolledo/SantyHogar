"""Modelos para importación masiva de productos."""
from typing import List, Optional
from pydantic import BaseModel, Field


class ProductImportRow(BaseModel):
    """Fila individual del Excel de importación."""

    nombre: str = Field(min_length=1, max_length=255)
    # Se importan con precio 0 y luego se ajusta en "Gestión de Precios".
    precio: float = Field(default=0.0, ge=0)
    precio_costo: Optional[float] = Field(default=None, ge=0)
    stock: int = Field(ge=0, default=0)
    categoria: str = Field(pattern="^(electrodomesticos|muebleria|colchoneria)$")
    subcategoria: Optional[str] = Field(default="General", max_length=100)
    descripcion: Optional[str] = Field(default="", max_length=5000)
    marca: Optional[str] = Field(default="Sin marca", max_length=100)
    slug: Optional[str] = None  # Se genera automáticamente si no se provee


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
