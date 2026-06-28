"""Endpoint para reintentar pago de órdenes pendientes."""

import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import get_order_service, get_payment_service
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService
from app.database.operations import DatabaseOperations

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/{order_id}/retry-payment")
async def retry_payment(
    order_id: str,
    order_service: Annotated[OrderService, Depends(get_order_service)],
    payment_service: Annotated[PaymentService, Depends(get_payment_service)],
) -> dict:
    """
    Crear nueva preferencia MP para una orden pendiente_pago.
    
    Casos:
    - Orden en pendiente_pago → crea nueva preferencia
    - Orden ya pagada → error
    - Orden no existe → error
    """
    try:
        order_id_uuid = UUID(order_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="order_id inválido"
        )

    # Obtener orden
    try:
        order = await order_service.get_order_by_id(order_id_uuid)
    except Exception as e:
        logger.error(f"Error obteniendo orden {order_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error al obtener la orden"
        )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Orden no encontrada"
        )

    # Verificar que esté en pendiente_pago
    if order.status != "pendiente_pago":
        raise HTTPException(
            status_code=400,
            detail=f"Solo órdenes pendientes pueden reintentar. Estado actual: {order.status}"
        )

    logger.info(f"🔄 Reintentando pago para orden {order.id}")

    # Obtener items de la orden
    try:
        detail = await order_service.get_order_detail(order_id_uuid)
        if not detail or not detail.items:
            raise HTTPException(
                status_code=500,
                detail="No se encontraron items para la orden"
            )
    except Exception as e:
        logger.error(f"Error obteniendo detalle de orden {order_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error obteniendo detalle de la orden"
        )

    # Crear NUEVA preferencia con mismos items
    try:
        payment_line_items = [
            {
                "title": item.productName[:256],
                "quantity": item.quantity,
                "unit_price": item.unitPrice,
            }
            for item in detail.items
        ]

        preference = await payment_service.create_preference(
            order,
            payment_line_items,
        )

        logger.info(f"✅ Nueva preferencia creada: {preference.preference_id}")

        # Actualizar orden con nuevo preference ID
        try:
            await order_service.attach_preference_id(
                order_id_uuid,
                preference.preference_id,
            )
            logger.info(f"✅ Orden {order.id} actualizada con nuevo preference_id")
        except Exception as e:
            logger.error(f"Error actualizando preference_id: {e}")
            # No es crítico, devolvemos la preferencia de todas formas

        return {
            "preference_id": preference.preference_id,
            "init_point": preference.init_point,
            "sandbox_init_point": preference.init_point,
            "order_id": str(order.id),
            "order_number": order.orderNumber,
        }

    except Exception as e:
        logger.error(f"Error creando nueva preferencia: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error creando preferencia de pago: {str(e)}"
        )
