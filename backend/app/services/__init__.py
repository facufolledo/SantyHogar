"""Business logic services."""

from app.database import get_database_operations
from app.database.operations import DatabaseOperations
from app.services.order_service import OrderCreationResult, OrderService
from app.services.payment_service import PaymentService
from app.services.product_service import ProductService
from app.services.webhook_idempotency import skip_webhook_side_effects


def get_product_service(
    db: DatabaseOperations | None = None,
) -> ProductService:
    return ProductService(db or DatabaseOperations())


def get_order_service(
    db: DatabaseOperations | None = None,
    products: ProductService | None = None,
) -> OrderService:
    d = db or DatabaseOperations()
    p = products or ProductService(d)
    return OrderService(d, p)


def get_payment_service() -> PaymentService:
    return PaymentService()


__all__ = [
    "DatabaseOperations",
    "OrderCreationResult",
    "OrderService",
    "PaymentService",
    "ProductService",
    "get_database_operations",
    "get_order_service",
    "get_payment_service",
    "get_product_service",
    "skip_webhook_side_effects",
]
