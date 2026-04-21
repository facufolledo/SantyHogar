"""Dependencias FastAPI (DB y servicios por request)."""
from typing import Annotated

from fastapi import Depends

from app.database import get_database_operations
from app.database.operations import DatabaseOperations
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService
from app.services.product_service import ProductService


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
