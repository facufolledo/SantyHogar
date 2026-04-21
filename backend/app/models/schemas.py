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
