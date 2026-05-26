"""Webhook Mercado Pago (notificaciones IPN)."""
import hashlib
import hmac
import json
import logging
from typing import Annotated, Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.config import get_config
from app.deps import get_order_service, get_payment_service, get_product_service
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService
from app.services.product_service import ProductService
from app.services.webhook_idempotency import skip_webhook_side_effects

logger = logging.getLogger(__name__)

router = APIRouter(tags=["webhook"])


def _verify_webhook_signature(request: Request, body: bytes) -> bool:
    """Verifica la firma HMAC del webhook de MercadoPago.
    
    Si no hay secret configurado, permite el request (desarrollo).
    En producción, rechaza requests sin firma válida.
    """
    config = get_config()
    secret = config.mercadopago_webhook_secret
    
    if not secret:
        # Sin secret configurado, permitir (modo desarrollo)
        logger.debug("Webhook: sin secret configurado, omitiendo verificación")
        return True
    
    # MercadoPago envía la firma en x-signature header
    x_signature = request.headers.get("x-signature", "")
    x_request_id = request.headers.get("x-request-id", "")
    
    if not x_signature:
        logger.warning("Webhook: request sin header x-signature")
        return False
    
    # Parsear el header x-signature (formato: "ts=xxx,v1=xxx")
    parts = {}
    for part in x_signature.split(","):
        if "=" in part:
            key, value = part.split("=", 1)
            parts[key.strip()] = value.strip()
    
    ts = parts.get("ts", "")
    v1 = parts.get("v1", "")
    
    if not ts or not v1:
        logger.warning("Webhook: x-signature malformado")
        return False
    
    # Extraer data.id del query string
    data_id = request.query_params.get("data.id", "")
    
    # Construir el manifest para verificar
    manifest = f"id:{data_id};request-id:{x_request_id};ts:{ts};"
    
    # Calcular HMAC
    computed = hmac.new(
        secret.encode(),
        manifest.encode(),
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(computed, v1):
        logger.warning("Webhook: firma inválida")
        return False
    
    return True


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
    # Leer body raw para verificación de firma
    raw_body = await request.body()
    
    # Verificar firma
    if not _verify_webhook_signature(request, raw_body):
        logger.warning("Webhook: firma inválida, rechazando request")
        return {"status": "rejected"}
    
    try:
        body = json.loads(raw_body)
    except Exception:
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
