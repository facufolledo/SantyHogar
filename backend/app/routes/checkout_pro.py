"""Checkout Pro - Endpoint consolidado de Mercado Pago."""
from typing import Any
from fastapi import APIRouter, Body, HTTPException, status

from app.database.operations import DatabaseOperations
from app.models.schemas import OrderRequest, OrderItemRequest
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService
from app.services.product_service import ProductService

router = APIRouter(tags=["checkout"])


@router.post("/checkout/create-preference")
async def create_checkout_preference(body: dict = Body(...)) -> dict:
    """Crea una orden real y una preferencia de Mercado Pago para Checkout Pro."""
    items = body.get("items") or []
    if not items:
        raise HTTPException(status_code=400, detail="El checkout requiere items")

    try:
        order_request = OrderRequest(
            userId=body.get("user_id") or body.get("userId"),
            customerName=body.get("customer_name") or body.get("customerName"),
            customerEmail=body.get("customer_email") or body.get("customerEmail"),
            customerPhone=body.get("customer_phone") or body.get("customerPhone"),
            items=[
                OrderItemRequest(
                    product_id=item.get("product_id") or item.get("productId"),
                    quantity=item.get("quantity", 1),
                )
                for item in items
            ],
            paymentMethod="mp",
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Datos de checkout invalidos: {str(exc)}") from exc

    try:
        db = DatabaseOperations()
        product_service = ProductService(db)
        order_service = OrderService(db, product_service)
        payment_service = PaymentService()

        created = await order_service.create_order(order_request)
        preference = await payment_service.create_preference(
            created.order,
            created.payment_line_items,
        )
        await order_service.attach_preference_id(
            created.order.id,
            preference.preference_id,
        )

        return {
            "preference_id": preference.preference_id,
            "init_point": preference.init_point,
            "sandbox_init_point": preference.init_point,
            "external_reference": str(created.order.id),
            "order_id": str(created.order.id),
            "order_number": created.order.orderNumber,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500, 
            detail=f"Error creando preferencia: {str(exc)}"
        ) from exc
