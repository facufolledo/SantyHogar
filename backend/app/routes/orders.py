"""Rutas de órdenes y checkout."""
from typing import Annotated, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps import get_order_service, get_payment_service
from app.exceptions import DatabaseError, InsufficientStockError, MercadoPagoError, ProductNotFoundError
from app.models.schemas import (
    OrderRequest,
    OrderResponse,
    OrderListResponse,
    OrderDetailResponse,
    UpdateOrderStatusRequest,
)
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService

router = APIRouter(tags=["orders"])


@router.get(
    "/orders",
    response_model=List[OrderListResponse],
    status_code=status.HTTP_200_OK,
)
async def list_orders(
    order_service: Annotated[OrderService, Depends(get_order_service)],
    email: Optional[str] = Query(None, description="Filtrar órdenes por email del cliente"),
) -> List[OrderListResponse]:
    """Lista todas las órdenes. Si se pasa `email`, filtra por email_cliente."""
    try:
        orders = await order_service.get_all_orders(email=email)
        return orders
    except DatabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e


@router.get(
    "/orders/{order_id}",
    response_model=OrderDetailResponse,
    status_code=status.HTTP_200_OK,
)
async def get_order_detail(
    order_id: UUID,
    order_service: Annotated[OrderService, Depends(get_order_service)],
) -> OrderDetailResponse:
    """Obtiene el detalle completo de una orden con sus items."""
    try:
        order_detail = await order_service.get_order_detail(order_id)
        if not order_detail:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Orden no encontrada",
            )
        return order_detail
    except DatabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e


@router.patch(
    "/orders/{order_id}/status",
    status_code=status.HTTP_200_OK,
)
async def update_order_status(
    order_id: UUID,
    body: UpdateOrderStatusRequest,
    order_service: Annotated[OrderService, Depends(get_order_service)],
) -> dict:
    """Actualiza el estado de una orden."""
    try:
        await order_service.update_order_status(order_id, body.status)
        return {"message": "Estado actualizado correctamente", "status": body.status}
    except DatabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e


@router.post(
    "/orders",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_order(
    body: OrderRequest,
    order_service: Annotated[OrderService, Depends(get_order_service)],
    payment_service: Annotated[PaymentService, Depends(get_payment_service)],
) -> OrderResponse:
    # Solo validar MP si el método de pago es "mp"
    use_mercadopago = body.paymentMethod == "mp"

    try:
        created = await order_service.create_order(body)
    except ProductNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message or "Producto no encontrado.",
        ) from e
    except InsufficientStockError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message or "Stock insuficiente.",
        ) from e
    except DatabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear la orden.",
        ) from e

    # Si es Mercado Pago, crear preferencia de pago
    if use_mercadopago:
        try:
            pref = await payment_service.create_preference(
                created.order, created.payment_line_items
            )
        except MercadoPagoError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=e.message or "Error al crear el link de pago.",
            ) from e

        try:
            await order_service.attach_preference_id(created.order.id, pref.preference_id)
        except DatabaseError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al guardar la preferencia de pago.",
            ) from e

        order = await order_service.get_order_by_id(created.order.id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Orden no encontrada tras crear el pago.",
            )

        return OrderResponse(
            id=order.id,
            orderNumber=order.orderNumber,
            init_point=pref.init_point,
            status=order.status,
            createdAt=order.createdAt.isoformat(),
        )
    else:
        # Modo local: sin Mercado Pago, solo retornar la orden
        order = await order_service.get_order_by_id(created.order.id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Orden no encontrada tras crearla.",
            )

        return OrderResponse(
            id=order.id,
            orderNumber=order.orderNumber,
            init_point="",  # Sin init_point en modo local
            status=order.status,
            createdAt=order.createdAt.isoformat(),
        )
