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

    async def update_order_status_by_preference(
        self,
        preference_id: str,
        status: str,
        *,
        payment_id: Optional[str] = None,
    ) -> None:
        """Actualiza el estado de una orden por preference_id (webhook)."""
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

    async def get_all_orders(self) -> List[Any]:
        """Obtiene todas las órdenes con información resumida."""
        from app.models.schemas import OrderListResponse
        
        rows = await self._db.get_all_orders()
        orders = []
        
        for row in rows:
            # Contar items de la orden
            items = await self._db.get_order_items(UUID(str(row["id_orden"])))
            item_count = sum(item.get("cantidad", 0) for item in items)
            
            orders.append(OrderListResponse(
                id=UUID(str(row["id_orden"])),
                orderNumber=row.get("numero_orden", ""),
                customerName=row.get("nombre_cliente", ""),
                customerEmail=row.get("email_cliente", ""),
                total=float(row.get("total", 0)),
                status=row.get("estado", "pending"),
                itemCount=item_count,
                createdAt=row.get("fecha_creacion", "").isoformat() if hasattr(row.get("fecha_creacion", ""), "isoformat") else str(row.get("fecha_creacion", "")),
            ))
        
        return orders

    async def get_order_detail(self, order_id: UUID) -> Optional[Any]:
        """Obtiene el detalle completo de una orden con sus items y productos."""
        from app.models.schemas import OrderDetailResponse, OrderItemResponse
        
        order_row = await self._db.get_order_by_id(order_id)
        if not order_row:
            return None
        
        # Obtener items de la orden
        items_rows = await self._db.get_order_items(order_id)
        
        # Obtener información de productos
        product_ids = [UUID(str(item["id_producto"])) for item in items_rows]
        products_rows = await self._db.get_products_by_ids(product_ids) if product_ids else []
        products_by_id = {UUID(str(p["id_producto"])): p for p in products_rows}
        
        # Construir items con información de productos
        order_items = []
        for item in items_rows:
            product_id = UUID(str(item["id_producto"]))
            product = products_by_id.get(product_id, {})
            
            quantity = int(item.get("cantidad", 0))
            unit_price = float(item.get("precio_unitario", 0))
            
            order_items.append(OrderItemResponse(
                id=UUID(str(item["id_item"])),
                productId=product_id,
                productName=product.get("nombre", "Producto no encontrado"),
                productImage=product.get("imagenes", [None])[0] if product.get("imagenes") else None,
                productBrand=product.get("marca", ""),
                quantity=quantity,
                unitPrice=unit_price,
                subtotal=quantity * unit_price,
            ))
        
        return OrderDetailResponse(
            id=UUID(str(order_row["id_orden"])),
            orderNumber=order_row.get("numero_orden", ""),
            userId=order_row.get("id_usuario"),
            customerName=order_row.get("nombre_cliente", ""),
            customerEmail=order_row.get("email_cliente", ""),
            customerPhone=order_row.get("telefono_cliente", ""),
            total=float(order_row.get("total", 0)),
            paymentMethod=order_row.get("metodo_pago", "mp"),
            status=order_row.get("estado", "pending"),
            preferenceId=order_row.get("id_preferencia"),
            paymentId=order_row.get("payment_id"),
            createdAt=order_row.get("fecha_creacion", "").isoformat() if hasattr(order_row.get("fecha_creacion", ""), "isoformat") else str(order_row.get("fecha_creacion", "")),
            updatedAt=order_row.get("fecha_actualizacion", "").isoformat() if hasattr(order_row.get("fecha_actualizacion", ""), "isoformat") else str(order_row.get("fecha_actualizacion", "")),
            items=order_items,
        )

    async def update_order_status(self, order_id: UUID, status: str) -> None:
        """Actualiza el estado de una orden por ID."""
        await self._db.update_order_status_by_id(order_id, status)
