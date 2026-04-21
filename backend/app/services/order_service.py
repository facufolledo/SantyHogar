"""Creación y actualización de órdenes."""
from __future__ import annotations

import logging
from collections import defaultdict
from dataclasses import dataclass
from typing import Any, List, Optional
from uuid import UUID, uuid4

from app.database.operations import DatabaseOperations
from app.exceptions import DatabaseError
from app.mappers import row_to_order
from app.models.schemas import Order, OrderRequest
from app.services.product_service import ProductService
from app.utils.order_number import generate_order_number

logger = logging.getLogger(__name__)


def _money(value: Any) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    return float(str(value))


@dataclass(frozen=True)
class OrderCreationResult:
    """Orden persistida + líneas para armar la preferencia de Mercado Pago."""

    order: Order
    payment_line_items: List[dict[str, Any]]


class OrderService:
    def __init__(
        self,
        db: DatabaseOperations,
        product_service: ProductService,
    ) -> None:
        self._db = db
        self._products = product_service

    async def create_order(self, req: OrderRequest) -> OrderCreationResult:
        unique_ids = list({it.product_id for it in req.items})
        await self._products.validate_products_exist(unique_ids)
        qty_by_product: defaultdict[UUID, int] = defaultdict(int)
        for it in req.items:
            qty_by_product[it.product_id] += it.quantity
        await self._products.check_stock_availability(list(qty_by_product.items()))

        rows = await self._db.get_products_by_ids(unique_ids)
        by_id = {UUID(str(r["id_producto"])): r for r in rows}

        total = 0.0
        items_data: List[dict[str, Any]] = []
        payment_line_items: List[dict[str, Any]] = []

        order_id = uuid4()
        order_id_str = str(order_id)

        for it in req.items:
            r = by_id[it.product_id]
            unit = _money(r["precio"])
            total += unit * it.quantity
            item_id = uuid4()
            items_data.append(
                {
                    "id_item": str(item_id),
                    "id_orden": order_id_str,
                    "id_producto": str(it.product_id),
                    "cantidad": it.quantity,
                    "precio_unitario": unit,
                }
            )
            title = (r.get("nombre") or "Producto")[:256]
            payment_line_items.append(
                {
                    "title": title,
                    "quantity": it.quantity,
                    "unit_price": unit,
                }
            )

        total_rounded = round(total, 2)

        order_data: dict[str, Any] = {
            "id_orden": order_id_str,
            "nombre_cliente": req.customerName,
            "email_cliente": str(req.customerEmail),
            "telefono_cliente": req.customerPhone,
            "total": total_rounded,
            "metodo_pago": req.paymentMethod,
            "estado": "pending",
            "numero_orden": "",
        }
        if req.userId is not None:
            order_data["id_usuario"] = req.userId

        last_err: Optional[Exception] = None
        for _ in range(30):
            order_data["numero_orden"] = generate_order_number()
            try:
                await self._db.create_order_with_items(order_data, items_data)
                break
            except DatabaseError as e:
                last_err = e
                msg = str(e).lower()
                if "23505" in msg or "duplicate" in msg or "unique" in msg:
                    logger.warning("numero_orden duplicado, reintentando: %s", e)
                    continue
                raise
        else:
            raise DatabaseError(
                f"No se pudo obtener numero_orden único: {last_err}"
            ) from last_err

        row = await self._db.get_order_by_id(order_id)
        if not row:
            raise DatabaseError("Orden creada pero no se pudo leer.")
        return OrderCreationResult(
            order=row_to_order(row),
            payment_line_items=payment_line_items,
        )

    async def update_order_status(
        self,
        preference_id: str,
        status: str,
        *,
        payment_id: Optional[str] = None,
    ) -> None:
        await self._db.update_order_status(
            preference_id, status, payment_id=payment_id
        )

    async def get_order_by_preference_id(
        self, preference_id: str
    ) -> Optional[Order]:
        row = await self._db.get_order_by_preference_id(preference_id)
        if not row:
            return None
        return row_to_order(row)

    async def get_order_by_id(self, order_id: UUID) -> Optional[Order]:
        row = await self._db.get_order_by_id(order_id)
        if not row:
            return None
        return row_to_order(row)

    async def attach_preference_id(self, order_id: UUID, preference_id: str) -> None:
        await self._db.update_order_preference_id(order_id, preference_id)
