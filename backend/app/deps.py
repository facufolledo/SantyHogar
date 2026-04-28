"""Dependencias FastAPI (DB y servicios por request)."""
from typing import Annotated, TYPE_CHECKING

from fastapi import Depends

from app.database import get_database_operations
from app.database.connection import get_supabase_client
from app.database.operations import DatabaseOperations
from app.services.customer_service import CustomerService
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService
from app.services.product_service import ProductService

if TYPE_CHECKING:
    from supabase import Client


def get_supabase():
    """Retorna el cliente de Supabase."""
    return get_supabase_client()


def get_product_service(
    db: Annotated[DatabaseOperations, Depends(get_database_operations)],
) -> ProductService:
    return ProductService(db)


def get_order_service(
    db: Annotated[DatabaseOperations, Depends(get_database_operations)],
    products: Annotated[ProductService, Depends(get_product_service)],
) -> OrderService:
    return OrderService(db, products)


def get_payment_service() -> PaymentService:
    return PaymentService()


def get_customer_service(
    db: Annotated[DatabaseOperations, Depends(get_database_operations)],
) -> CustomerService:
    return CustomerService(db)
