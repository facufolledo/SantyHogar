"""Webhook Mercado Pago (notificaciones IPN)."""
import logging
import hmac
import hashlib
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

def _validate_signature(request: Request, data_id: str, secret: str) -> bool:
    """Valida la firma del webhook de Mercado Pago."""
    x_signature = request.headers.get("x-signature")
    x_request_id = request.headers.get("x-request-id")
    
    if not x_signature or not x_request_id:
        return False
        
    parts = dict(part.split('=') for part in x_signature.split(',') if '=' in part)
    ts = parts.get('ts')
    v1 = parts.get('v1')
    
    if not ts or not v1:
        return False
        
    manifest = f"id:{data_id};request-id:{x_request_id};ts:{ts};"
    sha = hmac.new(secret.encode(), msg=manifest.encode(), digestmod=hashlib.sha256).hexdigest()
    
    return hmac.compare_digest(sha, v1)



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

    # Validar firma del webhook
    config = get_config()
    if config.mercadopago_webhook_secret:
        is_valid = _validate_signature(request, payment_id, config.mercadopago_webhook_secret)
        if not is_valid:
            logger.error(f"🔴 CRÍTICO: Firma de webhook inválida para pago {payment_id}. Posible ataque.")
            raise HTTPException(status_code=403, detail="Invalid signature")
    else:
        logger.warning("mercadopago_webhook_secret no está configurado. Saltando validación de firma (INSEGURO)")

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
    
    logger.info(f"Webhook búsqueda de orden: external_reference={external_reference}, preference_id={preference_id}")
    
    order = None
    if preference_id:
        try:
            order = await order_service.get_order_by_preference_id(preference_id)
            if order:
                logger.info(f"✓ Orden encontrada por preference_id: {order.id}")
        except Exception as e:
            logger.warning(f"No se encontró orden por preference_id {preference_id}: {e}")
    
    if not order and external_reference:
        try:
            order = await order_service.get_order_by_id(UUID(external_reference))
            if order:
                logger.info(f"✓ Orden encontrada por external_reference: {order.id}")
        except Exception as e:
            logger.warning(f"No se encontró orden por external_reference {external_reference}: {e}")

    if not order:
        logger.error(f"❌ Webhook: orden NO encontrada para pago {payment_id} (ext_ref={external_reference}, pref={preference_id})")
        return {"status": "ok"}

    logger.info(f"✓ Orden encontrada: {order.id} (estado actual: {order.status})")

    # Evitar procesamiento doble (idempotencia)
    # Permitir procesar órdenes en estado "cancelada" si llega el pago (pueden recuperarse)
    if skip_webhook_side_effects(order.status) and order.status != "cancelada":
        logger.info(f"Webhook: orden {order.id} ya fue procesada (estado: {order.status})")
        return {"status": "ok"}

    logger.info(f"✅ Procesando orden {order.id} para pago {payment_id}")
    
    # CRÍTICO: Validar que el monto pagado coincida con el total de la orden
    transaction_amount = float(payment_data.get("transaction_amount", 0))
    if abs(transaction_amount - order.total) > 0.01:
        logger.error(f"🔴 CRÍTICO: Monto pagado ({transaction_amount}) no coincide con el total de la orden ({order.total}) para pago {payment_id}")
        return {"status": "ok"}

    try:
        # Actualizar estado de la orden a "pagada"
        pref_key = order.preference_id or preference_id
        logger.info(f"Attempting to update order: pref_key={pref_key}, new_status='pagada'")
        
        if pref_key:
            await order_service.update_order_status_by_preference(
                pref_key, "pagada", payment_id=str(payment_id)  # Changed: paid → pagada
            )
            logger.info(f"✅ Orden {order.id} marcada como pagada")
        else:
            logger.error(f"❌ No se pudo actualizar orden {order.id}: sin preference_id (order.preference_id={order.preference_id}, payment_data.preference_id={preference_id})")
    
    except Exception as e:
        logger.error(f"❌ Error actualizando orden {order.id}: {str(e)}", exc_info=True)
        # No fallar, responder OK de todas formas

    try:
        # Descontar stock
        await product_service.decrement_stock(order.id)
        logger.info(f"✅ Stock descontado para orden {order.id}")
    except Exception as e:
        logger.error(f"Error descontando stock para orden {order.id}: {str(e)}")
        # Reintentar una vez más por si fue error transitorio
        try:
            logger.info(f"Reintentando descuento de stock para orden {order.id}")
            await product_service.decrement_stock(order.id)
            logger.info(f"✅ Stock descontado en reintento para orden {order.id}")
        except Exception as e2:
            logger.error(f"Fallo descuento de stock en reintento para orden {order.id}: {str(e2)}")
            # Aún así responder 200 OK a MP para no reintentar infinitamente

    return {"status": "ok"}
