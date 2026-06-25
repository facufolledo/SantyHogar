"""Pydantic request, response, and domain models."""
from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator, field_serializer
from app.utils.validation import (
    validate_name,
    validate_phone,
    validate_quantity,
    validate_price,
    sanitize_string,
)


# ================================================================== #
# LITERALES Y ENUMS
# ================================================================== #

PaymentMethodLiteral = List  # Placeholder
OrderStatusLiteral = List  # Placeholder


# ================================================================== #
# CATEGORÍAS
# ================================================================== #

class CategoryResponse(BaseModel):
    """Category response for the frontend."""
    
    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    order: int = 0
    active: bool = True
    createdAt: str
    updatedAt: str


class CreateCategoryRequest(BaseModel):
    """Request to create a new category."""
    
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=1000)
    color: Optional[str] = Field(default=None, max_length=7)
    icon: Optional[str] = Field(default=None, max_length=50)
    order: int = Field(default=0, ge=0)

    @field_validator("name", mode="before")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        return sanitize_string(v, max_len=100).strip()

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return sanitize_string(v, max_len=1000).strip()


class UpdateCategoryRequest(BaseModel):
    """Request to update a category."""
    
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(default=None, max_length=7)
    icon: Optional[str] = Field(default=None, max_length=50)
    order: Optional[int] = Field(default=None, ge=0)
    active: Optional[bool] = None

    @field_validator("name", mode="before")
    @classmethod
    def sanitize_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return sanitize_string(v, max_len=100).strip()


# ================================================================== #
# ÓRDENES Y ITEMS
# ================================================================== #

class OrderItemRequest(BaseModel):
    """Single line in a create-order request."""

    product_id: UUID
    quantity: int = Field(gt=0)

    @field_validator("quantity", mode="before")
    @classmethod
    def validate_quantity_value(cls, v):
        is_valid, qty = validate_quantity(v)
        if not is_valid:
            raise ValueError("Cantidad inválida. Debe ser entre 1 y 10000")
        return qty


class OrderRequest(BaseModel):
    """POST /orders body."""

    userId: Optional[str] = None
    customerName: str = Field(min_length=1, max_length=255)
    customerEmail: EmailStr
    customerPhone: str = Field(min_length=1, max_length=50)
    items: List[OrderItemRequest] = Field(min_length=1)
    paymentMethod: str = "mp"

    @field_validator("userId", mode="before")
    @classmethod
    def normalize_optional_user_id(cls, v: object) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, str):
            s = v.strip()
            return s if s else None
        raise ValueError("userId must be a string or null")

    @field_validator("customerName", mode="before")
    @classmethod
    def validate_customer_name(cls, v: str) -> str:
        if not validate_name(v, min_len=2, max_len=100):
            raise ValueError("Nombre inválido. Usa solo letras, espacios, guiones")
        return v.strip()

    @field_validator("customerPhone", mode="before")
    @classmethod
    def validate_customer_phone(cls, v: str) -> str:
        if not validate_phone(v):
            raise ValueError("Teléfono inválido. Mínimo 6 dígitos (ej: 123123 o +54 9 11 1234-5678)")
        return v.strip()

    @field_validator("customerEmail", mode="before")
    @classmethod
    def validate_customer_email(cls, v: str) -> str:
        return v.strip().lower()


class OrderResponse(BaseModel):
    """Response after creating an order and Mercado Pago preference."""

    id: UUID
    orderNumber: str
    init_point: str
    status: str = "pending"
    createdAt: str


class OrderItemResponse(BaseModel):
    """Order item with product details."""
    
    id: UUID
    productId: UUID
    productName: str
    productImage: Optional[str] = None
    productBrand: str
    quantity: int
    unitPrice: float
    subtotal: float


class OrderDetailResponse(BaseModel):
    """Full order with items for admin panel."""
    
    id: UUID
    orderNumber: str
    userId: Optional[str] = None
    customerName: str
    customerEmail: str
    customerPhone: str
    total: float
    paymentMethod: str
    status: str
    preferenceId: Optional[str] = None
    paymentId: Optional[str] = None
    createdAt: str
    updatedAt: str
    items: List[OrderItemResponse]


class OrderListResponse(BaseModel):
    """Simplified order for list view."""
    
    id: UUID
    orderNumber: str
    customerName: str
    customerEmail: str
    total: float
    status: str
    itemCount: int
    createdAt: str


class UpdateOrderStatusRequest(BaseModel):
    """Request to update order status."""
    
    status: str = Field(description="Nuevo estado del pedido")


class PreferenceResponse(BaseModel):
    """Mercado Pago preference result."""

    preference_id: str
    init_point: str


class Order(BaseModel):
    """Persisted order with client and payment state."""

    id: UUID
    userId: Optional[str] = None
    customerName: str
    customerEmail: str
    customerPhone: str
    total: float
    paymentMethod: str
    status: str
    preference_id: Optional[str]
    payment_id: Optional[str] = None
    orderNumber: str
    createdAt: datetime
    updated_at: datetime


class OrderItem(BaseModel):
    """Single line item belonging to an order."""

    id: UUID
    order_id: UUID
    product_id: UUID
    quantity: int
    unit_price: float


class PaymentInfo(BaseModel):
    """Data returned from Mercado Pago when querying a payment."""

    payment_id: str
    status: str
    preference_id: str
    external_reference: Optional[str] = None


# ================================================================== #
# PRODUCTOS
# ================================================================== #

class ProductResponse(BaseModel):
    """Product as returned to the frontend (camelCase)."""

    id: UUID
    name: str
    slug: str
    categoryId: UUID
    categoryName: str
    subcategory: str
    price: float
    originalPrice: Optional[float] = None
    images: List[str]
    description: str
    specs: Dict[str, str]
    stock: int
    featured: bool
    brand: str
    rating: float
    reviews: int


class CreateProductRequest(BaseModel):
    """Request to create a new product."""
    
    name: str = Field(min_length=1, max_length=255)
    category_id: UUID = Field(description="ID de la categoría del producto")
    subcategory: str = Field(min_length=1, max_length=100)
    price: float = Field(ge=0)
    original_price: Optional[float] = Field(default=None, ge=0)
    stock: int = Field(ge=0, default=0)
    brand: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=5000)
    images: List[str] = Field(default_factory=list)
    specs: Dict[str, str] = Field(default_factory=dict)
    featured: bool = Field(default=False)

    @field_validator("name", mode="before")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        return sanitize_string(v, max_len=255).strip()

    @field_validator("price", mode="before")
    @classmethod
    def validate_price_value(cls, v):
        is_valid, price = validate_price(v)
        if not is_valid:
            raise ValueError("Precio inválido. Debe ser entre 0 y 1,000,000")
        return price

    @field_validator("original_price", mode="before")
    @classmethod
    def validate_original_price_value(cls, v):
        if v is None:
            return None
        is_valid, price = validate_price(v)
        if not is_valid:
            raise ValueError("Precio original inválido. Debe ser entre 0 y 1,000,000")
        return price

    @field_validator("stock", mode="before")
    @classmethod
    def validate_stock_value(cls, v):
        try:
            stock = int(v)
            if stock < 0:
                raise ValueError("Stock no puede ser negativo")
            if stock > 100000:
                raise ValueError("Stock máximo: 100,000")
            return stock
        except (ValueError, TypeError):
            raise ValueError("Stock debe ser un número entero")

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str) -> str:
        return sanitize_string(v, max_len=5000)


class UpdateProductRequest(BaseModel):
    """Request to update an existing product."""
    
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    category_id: Optional[UUID] = None
    subcategory: Optional[str] = Field(default=None, min_length=1, max_length=100)
    price: Optional[float] = Field(default=None, ge=0)
    original_price: Optional[float] = Field(default=None, ge=0)
    stock: Optional[int] = Field(default=None, ge=0)
    brand: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = None
    images: Optional[List[str]] = None
    specs: Optional[Dict[str, str]] = None
    featured: Optional[bool] = None


class Product(BaseModel):
    """Product loaded from the database."""

    id: UUID
    name: str
    slug: str
    id_categoria: Optional[UUID] = None
    categoria_nombre: Optional[str] = None
    subcategory: str
    price: float
    originalPrice: Optional[float] = None
    images: List[str]
    description: str
    specs: Dict[str, str]
    stock: int
    featured: bool
    brand: str
    rating: float
    reviews: int
    created_at: datetime


class UpdatePriceRequest(BaseModel):
    """Request to update product price."""
    
    price: float = Field(gt=0, description="Nuevo precio del producto")
    original_price: Optional[float] = Field(default=None, ge=0, description="Precio original (opcional)")

    @field_validator("price", mode="before")
    @classmethod
    def validate_price_value(cls, v):
        is_valid, price = validate_price(v)
        if not is_valid or price <= 0:
            raise ValueError("Precio inválido. Debe ser mayor a 0 y menor a 1,000,000")
        return price

    @field_validator("original_price", mode="before")
    @classmethod
    def validate_original_price_value(cls, v):
        if v is None:
            return None
        is_valid, price = validate_price(v)
        if not is_valid:
            raise ValueError("Precio original inválido. Debe ser entre 0 y 1,000,000")
        return price


class UpdatePriceByProductBody(UpdatePriceRequest):
    """Actualizar precio enviando el id en el cuerpo."""

    product_id: UUID = Field(description="ID del producto")


class UpdatePriceResponse(BaseModel):
    """Response after updating product price."""
    
    id: UUID
    name: str
    price: float
    original_price: Optional[float] = None
    message: str = "Precio actualizado correctamente"


# ================================================================== #
# CLIENTES
# ================================================================== #

class CustomerResponse(BaseModel):
    """Customer as returned to the frontend."""
    
    id: UUID
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postalCode: Optional[str] = None
    registeredAt: str
    updatedAt: str
    totalSpent: float
    orderCount: int
    notes: Optional[str] = None
    active: bool


class CustomerListResponse(BaseModel):
    """Simplified customer for list view."""
    
    id: UUID
    name: str
    email: str
    phone: Optional[str] = None
    totalSpent: float
    orderCount: int
    registeredAt: str
    active: bool


class CreateCustomerRequest(BaseModel):
    """Request to create a new customer."""
    
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=50)
    address: Optional[str] = None
    city: Optional[str] = Field(default=None, max_length=100)
    province: Optional[str] = Field(default=None, max_length=100)
    postalCode: Optional[str] = Field(default=None, max_length=20)
    notes: Optional[str] = None

    @field_validator("name", mode="before")
    @classmethod
    def validate_customer_name(cls, v: str) -> str:
        if not validate_name(v, min_len=2, max_len=100):
            raise ValueError("Nombre inválido. Usa solo letras, espacios, guiones")
        return v.strip()

    @field_validator("email", mode="before")
    @classmethod
    def validate_customer_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("phone", mode="before")
    @classmethod
    def validate_customer_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not validate_phone(v):
            raise ValueError("Teléfono inválido. Mínimo 6 dígitos (ej: 123123 o +54 9 11 1234-5678)")
        return v.strip()

    @field_validator("address", mode="before")
    @classmethod
    def sanitize_address(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return sanitize_string(v, max_len=500).strip()

    @field_validator("notes", mode="before")
    @classmethod
    def sanitize_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return sanitize_string(v, max_len=1000)


class UpdateCustomerRequest(BaseModel):
    """Request to update an existing customer."""
    
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    address: Optional[str] = None
    city: Optional[str] = Field(default=None, max_length=100)
    province: Optional[str] = Field(default=None, max_length=100)
    postalCode: Optional[str] = Field(default=None, max_length=20)
    notes: Optional[str] = None
    active: Optional[bool] = None


class Customer(BaseModel):
    """Customer loaded from the database."""
    
    id: UUID
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    registered_at: datetime
    updated_at: datetime
    total_spent: float
    order_count: int
    notes: Optional[str] = None
    active: bool


# ================================================================== #
# IMAGE UPLOAD
# ================================================================== #

class ImageUploadResponse(BaseModel):
    """Response after uploading an image to Supabase Storage."""
    
    url: str = Field(description="Public URL of the uploaded image")
    filename: str = Field(description="Filename in Supabase Storage")
    message: str = Field(default="Image uploaded successfully")
