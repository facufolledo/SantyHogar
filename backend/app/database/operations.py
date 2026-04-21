"""Acceso a datos en Supabase (tablas productos, ordenes, items_orden)."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, List, Optional
from uuid import UUID

from supabase import Client

from app.database.connection import get_supabase_client
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
            raise DatabaseError(str(e)) from e

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
            raise DatabaseError(str(e)) from e

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
            raise DatabaseError(str(e)) from e

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
            raise DatabaseError(str(e)) from e
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
            raise DatabaseError(str(e)) from e
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
            raise DatabaseError(str(e)) from e

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
            raise DatabaseError(str(e)) from e

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
            raise DatabaseError(str(e)) from e

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
            raise DatabaseError(str(e)) from e

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
            raise DatabaseError(str(e)) from e
