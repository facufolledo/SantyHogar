"""Webhook Mercado Pago (notificaciones IPN)."""
import logging
from typing import Annotated, Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.deps import get_order_service, get_payment_service, get_product_service
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService
from app.services.product_service import ProductService
from app.services.webhook_idempotency import skip_webhook_side_effects

logger = logging.getLogger(__name__)

router = APIRouter(tags=["webhook"])


def _extract_payment_id(payload: Any) -> Optional[str]:
    """Mercado Pago envía típicamente data.id en el JSON."""
    if not isinstance(payload, dict):
        return None
    data = payload.get("data")
    if isinstance(data, dict) and data.get("id") is not None:
        return str(data["id"])
    if payload.get("id") is not None and payload.get("type") == "payment":
        return str(payload["id"])
    return None


@router.post("/webhook")
async def mercadopago_webhook(
    request: Request,
    order_service: Annotated[OrderService, Depends(get_order_service)],
    payment_service: Annotated[PaymentService, Depends(get_payment_service)],
    product_service: Annotated[ProductService, Depends(get_product_service)],
) -> dict[str, str]:
    try:
        body = await request.json()
    except Exception:
        logger.warning("Webhook: cuerpo no JSON")
        return {"status": "ok"}

    payment_id = _extract_payment_id(body)
    if not payment_id:
        logger.info("Webhook: sin payment_id en payload")
        return {"status": "ok"}

    try:
        info = await payment_service.get_payment_info(payment_id)
    except Exception as e:
        logger.exception("Webhook: error consultando pago %s: %s", payment_id, e)
        return {"status": "ok"}

    if info.status != "approved":
        return {"status": "ok"}

    order = None
    if info.preference_id:
        order = await order_service.get_order_by_preference_id(info.preference_id)
    if not order and info.external_reference:
        try:
            order = await order_service.get_order_by_id(UUID(info.external_reference))
        except ValueError:
            logger.warning("Webhook: external_reference no es UUID: %s", info.external_reference)

    if not order:
        logger.warning("Webhook: orden no encontrada (pago %s)", payment_id)
        return {"status": "ok"}

    if skip_webhook_side_effects(order.status):
        return {"status": "ok"}

    pref_key = order.preference_id or info.preference_id
    if not pref_key:
        logger.warning("Webhook: sin id de preferencia para orden %s", order.id)
        return {"status": "ok"}

    try:
        await order_service.update_order_status_by_preference(
            pref_key, "paid", payment_id=info.payment_id
        )
    except Exception as e:
        logger.exception("Webhook: error actualizando orden: %s", e)
        return {"status": "ok"}

    try:
        await product_service.decrement_stock(order.id)
    except Exception as e:
        logger.exception(
            "Webhook: error descontando stock (orden ya marcada pagada): %s", e
        )

    return {"status": "ok"}
