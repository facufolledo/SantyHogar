"""Lógica de negocio de productos."""
from __future__ import annotations

from typing import List, Tuple
from uuid import UUID

from app.database.operations import DatabaseOperations
from app.exceptions import ProductNotFoundError
from app.mappers import row_to_product
from app.models.schemas import Product
from app.utils.stock import ensure_stock_available


class ProductService:
    def __init__(self, db: DatabaseOperations) -> None:
        self._db = db

    async def get_all_products(self) -> List[Product]:
        rows = await self._db.get_all_products()
        return [row_to_product(r) for r in rows]

    async def validate_products_exist(self, product_ids: List[UUID]) -> None:
        if not product_ids:
            return
        rows = await self._db.get_products_by_ids(product_ids)
        found = {UUID(str(r["id_producto"])) for r in rows}
        missing = [pid for pid in product_ids if pid not in found]
        if missing:
            raise ProductNotFoundError(
                f"Producto(s) inexistente(s): {', '.join(str(m) for m in missing)}"
            )

    async def check_stock_availability(
        self, items: List[Tuple[UUID, int]]
    ) -> None:
        """items: (product_id, quantity)."""
        if not items:
            return
        ids = [pid for pid, _ in items]
        rows = await self._db.get_products_by_ids(ids)
        by_id = {UUID(str(r["id_producto"])): int(r["stock"]) for r in rows}
        for pid, qty in items:
            if pid not in by_id:
                raise ProductNotFoundError(f"Producto no encontrado: {pid}")
            ensure_stock_available(by_id[pid], qty)

    async def decrement_stock(self, order_id: UUID) -> None:
        """Descuenta stock por cada ítem de la orden (tras pago aprobado)."""
        items = await self._db.get_order_items(order_id)
        for row in items:
            pid = UUID(str(row["id_producto"]))
            qty = int(row["cantidad"])
            await self._db.decrement_product_stock(pid, qty)

    async def update_product_price(
        self, product_id: UUID, price: float, original_price: float | None = None
    ) -> Product:
        """Actualiza el precio de un producto."""
        # Verificar que el producto existe
        rows = await self._db.get_products_by_ids([product_id])
        if not rows:
            raise ProductNotFoundError(f"Producto no encontrado: {product_id}")
        
        # Actualizar precio
        await self._db.update_product_price(product_id, price, original_price)
        
        # Obtener producto actualizado
        updated_rows = await self._db.get_products_by_ids([product_id])
        return row_to_product(updated_rows[0])

    async def create_product(self, product_data: dict) -> Product:
        """Crea un nuevo producto."""
        product_id = await self._db.create_product(product_data)
        rows = await self._db.get_products_by_ids([product_id])
        return row_to_product(rows[0])

    async def update_product(self, product_id: UUID, product_data: dict) -> Product:
        """Actualiza un producto existente."""
        # Verificar que el producto existe
        rows = await self._db.get_products_by_ids([product_id])
        if not rows:
            raise ProductNotFoundError(f"Producto no encontrado: {product_id}")
        
        # Actualizar producto
        await self._db.update_product(product_id, product_data)
        
        # Obtener producto actualizado
        updated_rows = await self._db.get_products_by_ids([product_id])
        return row_to_product(updated_rows[0])

    async def delete_product(self, product_id: UUID) -> None:
        """Elimina un producto."""
        # Verificar que el producto existe
        rows = await self._db.get_products_by_ids([product_id])
        if not rows:
            raise ProductNotFoundError(f"Producto no encontrado: {product_id}")
        
        # Eliminar producto
        await self._db.delete_product(product_id)
