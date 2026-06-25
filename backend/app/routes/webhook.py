"""Webhook Mercado Pago (notificaciones IPN)."""
import logging
from typing import Annotated, Any, Optional
from uuid import UUID

import mercadopago
from fastapi import APIRouter, Depends, Request, HTTPException

from app.config import get_config
from app.deps import get_order_service, get_payment_service, get_product_service
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService
from app.services.product_service import ProductService
from app.services.webhook_idempotency import skip_webhook_side_effects
from app.database.connection import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(tags=["webhooks"])


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
@router.post("/mercadopago")
@router.post("/")
async def mercadopago_webhook(
    request: Request,
    order_service: Annotated[OrderService, Depends(get_order_service)],
    payment_service: Annotated[PaymentService, Depends(get_payment_service)],
    product_service: Annotated[ProductService, Depends(get_product_service)],
) -> dict[str, str]:
    """
    Endpoint para recibir notificaciones de Mercado Pago.
    
    Según la documentación de MP:
    - Recibe POST con JSON payload
    - Debe responder con HTTP 200/201 en max 22 segundos
    - MP reintenta si no recibe respuesta (cada 15 min hasta 3 veces, luego 6h, 48h, 96h, etc.)
    
    Tipos de notificaciones soportados:
    - payment: cambios en pagos
    - plan: cambios en planes de suscripción
    - subscription: cambios en suscripciones
    - invoice: cambios en facturas
    """
    try:
        body = await request.json()
        logger.info(f"📩 Webhook recibido: {body}")
    except Exception as e:
        logger.warning(f"Webhook: cuerpo no JSON - {e}")
        return {"status": "ok"}

    # Extraer tipo de notificación
    notification_type = body.get("type")
    
    # Si no es de pago, ignorar
    if notification_type != "payment":
        logger.info(f"Webhook: tipo de notificación no soportado: {notification_type}")
        return {"status": "ok"}

    # Extraer ID del pago
    payment_id = _extract_payment_id(body)
    if not payment_id:
        logger.info("Webhook: sin payment_id en payload")
        return {"status": "ok"}

    logger.info(f"💳 Procesando pago {payment_id}")

    try:
        # Obtener detalles del pago usando el SDK de MP
        config = get_config()
        sdk = mercadopago.SDK(config.mercadopago_access_token)
        
        # Llamar a la API de MP para obtener el estado actual del pago
        payment_info = sdk.payment().get(payment_id)
        payment_data = payment_info.get("response", {})
        
        logger.info(f"💳 Estado del pago {payment_id}: {payment_data.get('status')}")
        
    except Exception as e:
        logger.error(f"Error consultando pago {payment_id}: {str(e)}")
        # Responder OK igual para no reintentar
        return {"status": "ok"}

    # Solo procesar pagos aprobados
    if payment_data.get("status") != "approved":
        logger.info(f"Webhook: pago {payment_id} no está aprobado (estado: {payment_data.get('status')})")
        return {"status": "ok"}

    # Buscar la orden
    external_reference = payment_data.get("external_reference")
    preference_id = payment_data.get("preference_id")
    
    order = None
    if preference_id:
        try:
            order = await order_service.get_order_by_preference_id(preference_id)
        except Exception as e:
            logger.warning(f"No se encontró orden por preference_id {preference_id}: {e}")
    
    if not order and external_reference:
        try:
            order = await order_service.get_order_by_id(UUID(external_reference))
        except Exception as e:
            logger.warning(f"No se encontró orden por external_reference {external_reference}: {e}")

    if not order:
        logger.warning(f"Webhook: orden no encontrada para pago {payment_id}")
        return {"status": "ok"}

    # Evitar procesamiento doble (idempotencia)
    if skip_webhook_side_effects(order.status):
        logger.info(f"Webhook: orden {order.id} ya fue procesada (estado: {order.status})")
        return {"status": "ok"}

    logger.info(f"✅ Procesando orden {order.id} para pago {payment_id}")

    try:
        # Actualizar estado de la orden a "pagada"
        pref_key = order.preference_id or preference_id
        if pref_key:
            await order_service.update_order_status_by_preference(
                pref_key, "paid", payment_id=str(payment_id)
            )
            logger.info(f"✅ Orden {order.id} marcada como pagada")
        else:
            logger.warning(f"No se pudo actualizar orden {order.id}: sin preference_id")
    
    except Exception as e:
        logger.error(f"Error actualizando orden {order.id}: {str(e)}")
        # No fallar, responder OK de todas formas

    try:
        # Descontar stock
        await product_service.decrement_stock(order.id)
        logger.info(f"✅ Stock descontado para orden {order.id}")
    except Exception as e:
        logger.error(f"Error descontando stock para orden {order.id}: {str(e)}")
        # No fallar, stock puede haberse descontado antes

    return {"status": "ok"}
