"""Modelos para importaci├│n masiva de productos."""
from typing import List, Optional
from pydantic import BaseModel, Field


class ProductImportRow(BaseModel):
    """Fila individual del Excel de importaci├│n."""

    nombre: str = Field(min_length=1, max_length=255)
    # Se importan con precio 0 y luego se ajusta en "Gesti├│n de Precios".
    precio: float = Field(default=0.0, ge=0)
    precio_costo: Optional[float] = Field(default=None, ge=0)
    stock: int = Field(ge=0, default=0)
    categoria: str = Field(pattern="^(electrodomesticos|muebleria|colchoneria)$")
    subcategoria: Optional[str] = Field(default="General", max_length=100)
    descripcion: Optional[str] = Field(default="", max_length=5000)
    marca: Optional[str] = Field(default="Sin marca", max_length=100)
    slug: Optional[str] = None  # Se genera autom├íticamente si no se provee
    imagen: Optional[str] = None  # URL de imagen asociada (opcional)


class ProductImportValidation(BaseModel):
    """Resultado de validaci├│n de una fila."""

    row_number: int
    valid: bool
    data: Optional[ProductImportRow] = None
    errors: List[str] = Field(default_factory=list)


class BulkImportResponse(BaseModel):
    """Respuesta del endpoint de importaci├│n masiva."""

    total_rows: int
    valid_rows: int
    invalid_rows: int
    imported_count: int
    validations: List[ProductImportValidation]
    message: str


class ExcelImportPreview(BaseModel):
    """Respuesta del endpoint de preview de importaci├│n Excel."""

    total_rows: int
    valid_rows: int
    invalid_rows: int
    validations: List[ProductImportValidation]


class ExcelImportConfirmRow(BaseModel):
    """Fila confirmada para importar con datos posiblemente editados."""

    nombre: str = Field(min_length=1, max_length=255)
    precio: float = Field(default=0.0, ge=0)
    stock: int = Field(ge=0, default=0)
    categoria: str = Field(pattern="^(electrodomesticos|muebleria|colchoneria)$")
    subcategoria: Optional[str] = Field(default="General", max_length=100)
    descripcion: Optional[str] = Field(default="", max_length=5000)
    marca: Optional[str] = Field(default="Sin marca", max_length=100)
    imagen: Optional[str] = None


class ExcelImportConfirmRequest(BaseModel):
    """Request para confirmar importaci├│n de filas seleccionadas."""

    rows: List[ExcelImportConfirmRow] = Field(min_length=1)
