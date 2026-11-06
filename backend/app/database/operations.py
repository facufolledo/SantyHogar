"""Acceso a datos en Supabase (tablas productos, ordenes, items_orden)."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, List, Optional
from urllib.parse import urlparse
from uuid import UUID

from supabase import Client

from app.database.connection import get_supabase_client
from app.config import get_config
from app.exceptions import DatabaseError, InsufficientStockError
from app.utils.stock import ensure_stock_available

logger = logging.getLogger(__name__)


class DatabaseOperations:
    """Operaciones CRUD contra PostgreSQL vía PostgREST."""

    def __init__(self, client: Optional[Client] = None) -> None:
        """Si `client` es None, el cliente se crea en la primera operación (lazy)."""
        self._client_override = client

    def _client(self) -> Client:
        if self._client_override is not None:
            return self._client_override
        return get_supabase_client()

    def _raise_db_error(self, exc: Exception) -> None:
        """
        Normaliza errores comunes al hablar con Supabase para devolver mensajes accionables.
        """
        msg = str(exc)
        low = msg.lower()

        if "getaddrinfo failed" in low or "name or service not known" in low:
            host = urlparse(get_config().supabase_url.rstrip("/")).hostname or "<host>"
            raise DatabaseError(
                "No se pudo resolver el host de Supabase (error DNS: getaddrinfo failed). "
                f"Host: {host}. Revisá SUPABASE_URL (Project URL) y tu DNS/Internet."
            ) from exc

        raise DatabaseError(msg) from exc

    # ------------------------------------------------------------------ #
    # Productos
    # ------------------------------------------------------------------ #

    async def get_all_products(self) -> List[dict[str, Any]]:
        try:
            return await asyncio.wait_for(
                asyncio.to_thread(self._get_all_products_sync),
                timeout=20.0,
            )
        except asyncio.TimeoutError:
            logger.error("get_all_products: timeout esperando a Supabase (20s)")
            raise DatabaseError(
                "La base de datos no respondió a tiempo. Revisá Supabase, la red o SUPABASE_KEY."
            ) from None

    def _get_all_products_sync(self) -> List[dict[str, Any]]:
        try:
            res = self._client().table("productos").select("*").execute()
            return list(res.data or [])
        except Exception as e:
            logger.exception("get_all_products")
            self._raise_db_error(e)

    async def get_products_by_ids(self, ids: List[UUID]) -> List[dict[str, Any]]:
        return await asyncio.to_thread(self._get_products_by_ids_sync, ids)

    def _get_products_by_ids_sync(self, ids: List[UUID]) -> List[dict[str, Any]]:
        if not ids:
            return []
        try:
            id_strs = [str(i) for i in ids]
            res = (
                self._client().table("productos")
                .select("*")
                .in_("id_producto", id_strs)
                .execute()
            )
            return list(res.data or [])
        except Exception as e:
            logger.exception("get_products_by_ids")
            self._raise_db_error(e)

    async def decrement_product_stock(self, product_id: UUID, quantity: int) -> None:
        await asyncio.to_thread(self._decrement_product_stock_sync, product_id, quantity)

    def _decrement_product_stock_sync(self, product_id: UUID, quantity: int) -> None:
        pid = str(product_id)
        try:
            res = (
                self._client().table("productos")
                .select("stock")
                .eq("id_producto", pid)
                .limit(1)
                .execute()
            )
            rows = res.data or []
            if not rows:
                raise DatabaseError(f"Producto no encontrado: {pid}")
            current = int(rows[0]["stock"])
            ensure_stock_available(current, quantity)
            new_stock = current - quantity
            self._client().table("productos").update({"stock": new_stock}).eq(
                "id_producto", pid
            ).execute()
        except InsufficientStockError:
            raise
        except DatabaseError:
            raise
        except Exception as e:
            logger.exception("decrement_product_stock")
            self._raise_db_error(e)

    # ------------------------------------------------------------------ #
    # Órdenes e ítems
    # ------------------------------------------------------------------ #

    async def create_order_with_items(
        self, order_data: dict[str, Any], items_data: List[dict[str, Any]]
    ) -> UUID:
        """
        Inserta `ordenes` + `items_orden` (columnas en español, UUID como string).

        order_data debe incluir al menos: id_orden, nombre_cliente, email_cliente,
        telefono_cliente, total, metodo_pago, estado, numero_orden; opcionales:
        id_usuario, id_preferencia, payment_id.

        Cada fila de items_data: id_item, id_orden, id_producto, cantidad, precio_unitario.

        Si falla la carga de ítems, se intenta eliminar la orden y los ítems insertados.
        """
        return await asyncio.to_thread(
            self._create_order_with_items_sync, order_data, items_data
        )

    def _create_order_with_items_sync(
        self, order_data: dict[str, Any], items_data: List[dict[str, Any]]
    ) -> UUID:
        if not items_data:
            raise DatabaseError("La orden debe tener al menos un ítem.")
        oid = order_data.get("id_orden")
        if not oid:
            raise DatabaseError("order_data debe incluir id_orden (UUID).")
        order_id = UUID(str(oid))
        order_id_str = str(order_id)
        try:
            self._client().table("ordenes").insert(order_data).execute()
        except Exception as e:
            logger.exception("create_order insert orden")
            self._raise_db_error(e)
        try:
            for row in items_data:
                self._client().table("items_orden").insert(row).execute()
        except Exception as e:
            logger.exception("create_order insert items; compensando")
            try:
                self._client().table("items_orden").delete().eq(
                    "id_orden", order_id_str
                ).execute()
            except Exception:
                logger.exception("compensación: delete items_orden")
            try:
                self._client().table("ordenes").delete().eq(
                    "id_orden", order_id_str
                ).execute()
            except Exception:
                logger.exception("compensación: delete ordenes")
            self._raise_db_error(e)
        return order_id

    async def update_order_preference_id(
        self, order_id: UUID, preference_id: str
    ) -> None:
        await asyncio.to_thread(
            self._update_order_preference_id_sync, order_id, preference_id
        )

    def _update_order_preference_id_sync(
        self, order_id: UUID, preference_id: str
    ) -> None:
        try:
            self._client().table("ordenes").update({"id_preferencia": preference_id}).eq(
                "id_orden", str(order_id)
            ).execute()
        except Exception as e:
            logger.exception("update_order_preference_id")
            self._raise_db_error(e)

    async def update_order_status(
        self,
        preference_id: str,
        status: str,
        *,
        payment_id: Optional[str] = None,
    ) -> None:
        await asyncio.to_thread(
            self._update_order_status_sync, preference_id, status, payment_id
        )

    def _update_order_status_sync(
        self,
        preference_id: str,
        status: str,
        payment_id: Optional[str],
    ) -> None:
        payload: dict[str, Any] = {"estado": status}
        if payment_id is not None:
            payload["payment_id"] = payment_id
        try:
            self._client().table("ordenes").update(payload).eq(
                "id_preferencia", preference_id
            ).execute()
        except Exception as e:
            logger.exception("update_order_status")
            self._raise_db_error(e)

    async def get_order_by_id(self, order_id: UUID) -> Optional[dict[str, Any]]:
        return await asyncio.to_thread(self._get_order_by_id_sync, order_id)

    def _get_order_by_id_sync(self, order_id: UUID) -> Optional[dict[str, Any]]:
        try:
            res = (
                self._client()
                .table("ordenes")
                .select("*")
                .eq("id_orden", str(order_id))
                .limit(1)
                .execute()
            )
            rows = res.data or []
            return rows[0] if rows else None
        except Exception as e:
            logger.exception("get_order_by_id")
            self._raise_db_error(e)

    async def get_order_by_preference_id(
        self, preference_id: str
    ) -> Optional[dict[str, Any]]:
        return await asyncio.to_thread(
            self._get_order_by_preference_id_sync, preference_id
        )

    def _get_order_by_preference_id_sync(
        self, preference_id: str
    ) -> Optional[dict[str, Any]]:
        try:
            res = (
                self._client().table("ordenes")
                .select("*")
                .eq("id_preferencia", preference_id)
                .limit(1)
                .execute()
            )
            rows = res.data or []
            return rows[0] if rows else None
        except Exception as e:
            logger.exception("get_order_by_preference_id")
            self._raise_db_error(e)

    async def get_order_items(self, order_id: UUID) -> List[dict[str, Any]]:
        return await asyncio.to_thread(self._get_order_items_sync, order_id)

    def _get_order_items_sync(self, order_id: UUID) -> List[dict[str, Any]]:
        try:
            res = (
                self._client().table("items_orden")
                .select("*")
                .eq("id_orden", str(order_id))
                .execute()
            )
            return list(res.data or [])
        except Exception as e:
            logger.exception("get_order_items")
            self._raise_db_error(e)

    async def update_product_price(
        self, product_id: UUID, price: float, original_price: float | None = None
    ) -> None:
        """Actualiza el precio de un producto."""
        await asyncio.to_thread(
            self._update_product_price_sync, product_id, price, original_price
        )

    def _update_product_price_sync(
        self, product_id: UUID, price: float, original_price: float | None = None
    ) -> None:
        pid = str(product_id)
        try:
            update_data = {"precio": price}
            if original_price is not None:
                update_data["precio_original"] = original_price
            
            self._client().table("productos").update(update_data).eq(
                "id_producto", pid
            ).execute()
        except Exception as e:
            logger.exception("update_product_price")
            self._raise_db_error(e)

    async def create_product(self, product_data: dict[str, Any]) -> UUID:
        """Crea un nuevo producto."""
        return await asyncio.to_thread(self._create_product_sync, product_data)

    def _create_product_sync(self, product_data: dict[str, Any]) -> UUID:
        try:
            from uuid import uuid4
            product_id = uuid4()
            
            # Generar slug si no existe
            if "slug" not in product_data:
                import re
                name = product_data.get("nombre", "")
                slug = name.lower()
                slug = re.sub(r'[^a-z0-9\s-]', '', slug)
                slug = re.sub(r'\s+', '-', slug)
                slug = re.sub(r'-+', '-', slug)
                product_data["slug"] = slug.strip('-')
            
            # Agregar ID y valores por defecto
            product_data["id_producto"] = str(product_id)
            product_data.setdefault("calificacion", 0.0)
            product_data.setdefault("cantidad_resenas", 0)
            
            res = self._client().table("productos").insert(product_data).execute()
            
            if not res.data:
                raise DatabaseError("No se pudo crear el producto")
            
            return product_id
        except Exception as e:
            logger.exception("create_product")
            self._raise_db_error(e)

    async def update_product(self, product_id: UUID, product_data: dict[str, Any]) -> None:
        """Actualiza un producto existente."""
        await asyncio.to_thread(self._update_product_sync, product_id, product_data)

    def _update_product_sync(self, product_id: UUID, product_data: dict[str, Any]) -> None:
        pid = str(product_id)
        try:
            # Filtrar solo los campos que no son None
            update_data = {k: v for k, v in product_data.items() if v is not None}
            
            if not update_data:
                return
            
            self._client().table("productos").update(update_data).eq(
                "id_producto", pid
            ).execute()
        except Exception as e:
            logger.exception("update_product")
            self._raise_db_error(e)

    async def delete_product(self, product_id: UUID) -> None:
        """Elimina un producto."""
        await asyncio.to_thread(self._delete_product_sync, product_id)

    def _delete_product_sync(self, product_id: UUID) -> None:
        pid = str(product_id)
        try:
            self._client().table("productos").delete().eq(
                "id_producto", pid
            ).execute()
        except Exception as e:
            logger.exception("delete_product")
            self._raise_db_error(e)

    async def get_all_orders(self) -> List[dict[str, Any]]:
        """Obtiene todas las órdenes."""
        return await asyncio.to_thread(self._get_all_orders_sync)

    def _get_all_orders_sync(self) -> List[dict[str, Any]]:
        try:
            res = (
                self._client().table("ordenes")
                .select("*")
                .order("fecha_creacion", desc=True)
                .execute()
            )
            return list(res.data or [])
        except Exception as e:
            logger.exception("get_all_orders")
            self._raise_db_error(e)

    async def update_order_status_by_id(self, order_id: UUID, status: str) -> None:
        """Actualiza el estado de una orden por ID."""
        await asyncio.to_thread(self._update_order_status_by_id_sync, order_id, status)

    def _update_order_status_by_id_sync(self, order_id: UUID, status: str) -> None:
        try:
            self._client().table("ordenes").update({"estado": status}).eq(
                "id_orden", str(order_id)
            ).execute()
        except Exception as e:
            logger.exception("update_order_status_by_id")
            self._raise_db_error(e)

    # ------------------------------------------------------------------ #
    # Clientes
    # ------------------------------------------------------------------ #

    async def get_all_customers(self) -> List[dict[str, Any]]:
        """Obtiene todos los clientes."""
        try:
            return await asyncio.wait_for(
                asyncio.to_thread(self._get_all_customers_sync),
                timeout=20.0,
            )
        except asyncio.TimeoutError:
            logger.error("get_all_customers: timeout esperando a Supabase (20s)")
            raise DatabaseError(
                "La base de datos no respondió a tiempo al consultar clientes. Revisá Supabase, la red o SUPABASE_KEY."
            ) from None

    def _get_all_customers_sync(self) -> List[dict[str, Any]]:
        try:
            res = (
                self._client().table("clientes")
                .select("*")
                .order("fecha_registro", desc=True)
                .execute()
            )
            return list(res.data or [])
        except Exception as e:
            logger.exception("get_all_customers")
            self._raise_db_error(e)

    async def get_customer_by_id(self, customer_id: UUID) -> Optional[dict[str, Any]]:
        """Obtiene un cliente por ID."""
        return await asyncio.to_thread(self._get_customer_by_id_sync, customer_id)

    def _get_customer_by_id_sync(self, customer_id: UUID) -> Optional[dict[str, Any]]:
        try:
            res = (
                self._client().table("clientes")
                .select("*")
                .eq("id_cliente", str(customer_id))
                .limit(1)
                .execute()
            )
            rows = res.data or []
            return rows[0] if rows else None
        except Exception as e:
            logger.exception("get_customer_by_id")
            self._raise_db_error(e)

    async def get_customer_by_email(self, email: str) -> Optional[dict[str, Any]]:
        """Obtiene un cliente por email."""
        return await asyncio.to_thread(self._get_customer_by_email_sync, email)

    def _get_customer_by_email_sync(self, email: str) -> Optional[dict[str, Any]]:
        try:
            res = (
                self._client().table("clientes")
                .select("*")
                .eq("email", email)
                .limit(1)
                .execute()
            )
            rows = res.data or []
            return rows[0] if rows else None
        except Exception as e:
            logger.exception("get_customer_by_email")
            self._raise_db_error(e)

    async def create_customer(self, customer_data: dict[str, Any]) -> UUID:
        """Crea un nuevo cliente."""
        return await asyncio.to_thread(self._create_customer_sync, customer_data)

    def _create_customer_sync(self, customer_data: dict[str, Any]) -> UUID:
        try:
            from uuid import uuid4
            customer_id = uuid4()
            
            customer_data["id_cliente"] = str(customer_id)
            customer_data.setdefault("total_gastado", 0.0)
            customer_data.setdefault("cantidad_ordenes", 0)
            customer_data.setdefault("activo", True)
            
            res = self._client().table("clientes").insert(customer_data).execute()
            
            if not res.data:
                raise DatabaseError("No se pudo crear el cliente")
            
            return customer_id
        except Exception as e:
            logger.exception("create_customer")
            self._raise_db_error(e)

    async def update_customer(self, customer_id: UUID, customer_data: dict[str, Any]) -> None:
        """Actualiza un cliente existente."""
        await asyncio.to_thread(self._update_customer_sync, customer_id, customer_data)

    def _update_customer_sync(self, customer_id: UUID, customer_data: dict[str, Any]) -> None:
        cid = str(customer_id)
        try:
            # Filtrar solo los campos que no son None
            update_data = {k: v for k, v in customer_data.items() if v is not None}
            
            if not update_data:
                return
            
            self._client().table("clientes").update(update_data).eq(
                "id_cliente", cid
            ).execute()
        except Exception as e:
            logger.exception("update_customer")
            self._raise_db_error(e)

    async def delete_customer(self, customer_id: UUID) -> None:
        """Elimina un cliente (soft delete - marca como inactivo)."""
        await asyncio.to_thread(self._delete_customer_sync, customer_id)

    def _delete_customer_sync(self, customer_id: UUID) -> None:
        cid = str(customer_id)
        try:
            # Soft delete: marcar como inactivo
            self._client().table("clientes").update({"activo": False}).eq(
                "id_cliente", cid
            ).execute()
        except Exception as e:
            logger.exception("delete_customer")
            self._raise_db_error(e)

    async def get_customer_orders(self, customer_id: UUID) -> List[dict[str, Any]]:
        """Obtiene todas las órdenes de un cliente."""
        return await asyncio.to_thread(self._get_customer_orders_sync, customer_id)

    def _get_customer_orders_sync(self, customer_id: UUID) -> List[dict[str, Any]]:
        try:
            res = (
                self._client().table("ordenes")
                .select("*")
                .eq("id_cliente", str(customer_id))
                .order("fecha_creacion", desc=True)
                .execute()
            )
            return list(res.data or [])
        except Exception as e:
            logger.exception("get_customer_orders")
            self._raise_db_error(e)

    async def update_customer_stats(self, customer_id: UUID) -> None:
        """Actualiza las estadísticas del cliente (total gastado y cantidad de órdenes)."""
        await asyncio.to_thread(self._update_customer_stats_sync, customer_id)

    def _update_customer_stats_sync(self, customer_id: UUID) -> None:
        cid = str(customer_id)
        try:
            # Obtener todas las órdenes pagadas del cliente
            res = (
                self._client().table("ordenes")
                .select("total, estado")
                .eq("id_cliente", cid)
                .execute()
            )
            orders = res.data or []
            
            # Calcular estadísticas
            total_spent = sum(float(o.get("total", 0)) for o in orders if o.get("estado") == "paid")
            order_count = len(orders)
            
            # Actualizar cliente
            self._client().table("clientes").update({
                "total_gastado": total_spent,
                "cantidad_ordenes": order_count
            }).eq("id_cliente", cid).execute()
        except Exception as e:
            logger.exception("update_customer_stats")
            self._raise_db_error(e)
