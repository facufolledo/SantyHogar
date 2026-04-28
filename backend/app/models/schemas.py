"""Pydantic request, response, and domain models."""
from datetime import datetime
from typing import Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


CategoryLiteral = Literal["electrodomesticos", "muebleria", "colchoneria"]
PaymentMethodLiteral = Literal["mp", "fiserv"]
OrderStatusLiteral = Literal["pending", "paid", "cancelled"]


class OrderItemRequest(BaseModel):
    """Single line in a create-order request."""

    product_id: UUID
    quantity: int = Field(gt=0)


class OrderRequest(BaseModel):
    """POST /orders body."""

    userId: Optional[str] = None
    customerName: str = Field(min_length=1, max_length=255)
    customerEmail: EmailStr
    customerPhone: str = Field(min_length=1, max_length=50)
    items: List[OrderItemRequest] = Field(min_length=1)
    paymentMethod: PaymentMethodLiteral = "mp"

    @field_validator("userId", mode="before")
    @classmethod
    def normalize_optional_user_id(cls, v: object) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, str):
            s = v.strip()
            return s if s else None
        raise ValueError("userId must be a string or null")


class ProductResponse(BaseModel):
    """Product as returned to the frontend (camelCase)."""

    id: UUID
    name: str
    slug: str
    category: CategoryLiteral
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


class OrderResponse(BaseModel):
    """Response after creating an order and Mercado Pago preference."""

    id: UUID
    orderNumber: str
    init_point: str
    status: OrderStatusLiteral = "pending"
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
    paymentMethod: PaymentMethodLiteral
    status: OrderStatusLiteral
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
    status: OrderStatusLiteral
    itemCount: int
    createdAt: str


class UpdateOrderStatusRequest(BaseModel):
    """Request to update order status."""
    
    status: OrderStatusLiteral = Field(description="Nuevo estado del pedido")


class PreferenceResponse(BaseModel):
    """Mercado Pago preference result."""

    preference_id: str
    init_point: str


class Product(BaseModel):
    """Product loaded from the database."""

    id: UUID
    name: str
    slug: str
    category: CategoryLiteral
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


class Order(BaseModel):
    """Persisted order with client and payment state."""

    id: UUID
    userId: Optional[str] = None
    customerName: str
    customerEmail: str
    customerPhone: str
    total: float
    paymentMethod: PaymentMethodLiteral
    status: OrderStatusLiteral
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


class UpdatePriceRequest(BaseModel):
    """Request to update product price."""
    
    price: float = Field(gt=0, description="Nuevo precio del producto")
    original_price: Optional[float] = Field(default=None, ge=0, description="Precio original (opcional)")


class UpdatePriceByProductBody(UpdatePriceRequest):
    """Actualizar precio enviando el id en el cuerpo (ruta alternativa si /products/{id}/price devuelve 404)."""

    product_id: UUID = Field(description="ID del producto (id_producto)")


class UpdatePriceResponse(BaseModel):
    """Response after updating product price."""
    
    id: UUID
    name: str
    price: float
    original_price: Optional[float] = None
    message: str = "Precio actualizado correctamente"


class CreateProductRequest(BaseModel):
    """Request to create a new product."""
    
    name: str = Field(min_length=1, max_length=255)
    category: CategoryLiteral
    subcategory: str = Field(min_length=1, max_length=100)
    price: float = Field(ge=0)
    original_price: Optional[float] = Field(default=None, ge=0)
    stock: int = Field(ge=0, default=0)
    brand: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=5000)
    images: List[str] = Field(default_factory=list)
    specs: Dict[str, str] = Field(default_factory=dict)
    featured: bool = Field(default=False)


class UpdateProductRequest(BaseModel):
    """Request to update an existing product."""
    
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    category: Optional[CategoryLiteral] = None
    subcategory: Optional[str] = Field(default=None, min_length=1, max_length=100)
    price: Optional[float] = Field(default=None, ge=0)
    original_price: Optional[float] = Field(default=None, ge=0)
    stock: Optional[int] = Field(default=None, ge=0)
    brand: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = None
    images: Optional[List[str]] = None
    specs: Optional[Dict[str, str]] = None
    featured: Optional[bool] = None


# ------------------------------------------------------------------ #
# Clientes
# ------------------------------------------------------------------ #

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
