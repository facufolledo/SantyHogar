"""Servicio de métricas y estadísticas del dashboard."""
from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, List

from app.database.operations import DatabaseOperations
from app.models.schemas import (
    DashboardStats,
    SalesChartPoint,
    TopCustomer,
    TopProduct,
)

logger = logging.getLogger(__name__)


class DashboardService:
    """Calcula métricas del dashboard a partir de datos de Supabase."""

    def __init__(self, db: DatabaseOperations) -> None:
        self._db = db

    # ------------------------------------------------------------------ #
    # get_stats
    # ------------------------------------------------------------------ #

    async def get_stats(self) -> DashboardStats:
        """
        Calcula estadísticas generales:
        - Ventas del día, semana y mes (solo órdenes con estado='paid')
        - Cantidad de pedidos pagados y pendientes del mes
        - Ticket promedio
        - Productos activos (stock > 0)
        - Productos con stock bajo (stock < 5 y stock > 0)
        - Clientes nuevos del mes
        """
        # Usar horario de Córdoba (UTC-3) para las métricas
        cordoba_tz = timezone(timedelta(hours=-3))
        now = datetime.now(cordoba_tz)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        month_start = today_start.replace(day=1)

        # Fetch all orders
        all_orders = await self._db.get_all_orders()

        # Filter paid orders
        paid_orders = [o for o in all_orders if o.get("estado") == "paid"]

        # Calculate sales by period
        sales_day = 0.0
        sales_week = 0.0
        sales_month = 0.0
        order_count_month = 0
        order_count_paid = 0
        order_count_pending = 0

        for order in all_orders:
            created_at = self._parse_date(order.get("fecha_creacion"))
            if created_at is None:
                continue
            
            estado = order.get("estado")
            
            # Count orders by status for the month
            if created_at >= month_start:
                order_count_month += 1
                if estado == "paid":
                    order_count_paid += 1
                elif estado == "pending":
                    order_count_pending += 1

        # Calculate sales only from paid orders
        for order in paid_orders:
            created_at = self._parse_date(order.get("fecha_creacion"))
            if created_at is None:
                continue
            total = float(order.get("total", 0))

            if created_at >= month_start:
                sales_month += total

            if created_at >= week_start:
                sales_week += total

            if created_at >= today_start:
                sales_day += total

        avg_ticket = sales_month / order_count_paid if order_count_paid > 0 else 0.0

        # Products stats
        all_products = await self._db.get_all_products()
        active_products = sum(1 for p in all_products if int(p.get("stock", 0)) > 0)
        low_stock_products = sum(
            1 for p in all_products
            if 0 < int(p.get("stock", 0)) < 5
        )

        # New customers this month
        all_customers = await self._db.get_all_customers()
        new_customers_month = 0
        for c in all_customers:
            registered = self._parse_date(c.get("fecha_registro"))
            if registered and registered >= month_start:
                new_customers_month += 1

        return DashboardStats(
            sales_day=sales_day,
            sales_week=sales_week,
            sales_month=sales_month,
            order_count=order_count_month,
            order_count_paid=order_count_paid,
            order_count_pending=order_count_pending,
            avg_ticket=round(avg_ticket, 2),
            active_products=active_products,
            low_stock_products=low_stock_products,
            new_customers_month=new_customers_month,
        )

    # ------------------------------------------------------------------ #
    # get_sales_chart
    # ------------------------------------------------------------------ #

    async def get_sales_chart(self) -> List[SalesChartPoint]:
        """
        Agrupa órdenes pagadas por fecha de los últimos 7 días.
        Retorna una lista de {date, total} para cada día.
        """
        # Usar horario de Córdoba (UTC-3)
        cordoba_tz = timezone(timedelta(hours=-3))
        now = datetime.now(cordoba_tz)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # Build the last 7 days
        days: List[str] = []
        for i in range(6, -1, -1):
            day = today_start - timedelta(days=i)
            days.append(day.strftime("%Y-%m-%d"))

        # Initialize totals
        totals: dict[str, float] = {d: 0.0 for d in days}

        # Fetch all orders and filter paid ones in the last 7 days
        all_orders = await self._db.get_all_orders()
        seven_days_ago = today_start - timedelta(days=6)

        for order in all_orders:
            if order.get("estado") != "paid":
                continue
            created_at = self._parse_date(order.get("fecha_creacion"))
            if created_at is None:
                continue
            if created_at < seven_days_ago:
                continue
            day_key = created_at.strftime("%Y-%m-%d")
            if day_key in totals:
                totals[day_key] += float(order.get("total", 0))

        return [SalesChartPoint(date=d, total=totals[d]) for d in days]

    # ------------------------------------------------------------------ #
    # get_top_products
    # ------------------------------------------------------------------ #

    async def get_top_products(self) -> List[TopProduct]:
        """
        Obtiene los 5 productos más vendidos.
        Como PostgREST no soporta JOINs complejos, hacemos:
        1. Obtener todos los items_orden
        2. Agrupar por id_producto en Python
        3. Obtener nombres de los top 5
        """
        # Get all order items - we need to get items from paid orders only
        all_orders = await self._db.get_all_orders()
        paid_order_ids = {
            str(o.get("id_orden"))
            for o in all_orders
            if o.get("estado") == "paid"
        }

        # Aggregate items by product
        product_stats: dict[str, dict[str, Any]] = defaultdict(
            lambda: {"quantity": 0, "revenue": 0.0}
        )

        # Get items for each paid order
        for order in all_orders:
            order_id = str(order.get("id_orden", ""))
            if order_id not in paid_order_ids:
                continue
            items = await self._db.get_order_items(
                __import__("uuid").UUID(order_id)
            )
            for item in items:
                pid = str(item.get("id_producto", ""))
                qty = int(item.get("cantidad", 0))
                price = float(item.get("precio_unitario", 0))
                product_stats[pid]["quantity"] += qty
                product_stats[pid]["revenue"] += qty * price

        if not product_stats:
            return []

        # Sort by quantity sold DESC and take top 5
        sorted_products = sorted(
            product_stats.items(),
            key=lambda x: x[1]["quantity"],
            reverse=True,
        )[:5]

        # Get product names
        from uuid import UUID as UUIDType
        top_ids = [UUIDType(pid) for pid, _ in sorted_products]
        products_data = await self._db.get_products_by_ids(top_ids)
        name_map = {
            str(p.get("id_producto", "")): p.get("nombre", "Producto desconocido")
            for p in products_data
        }

        result = []
        for pid, stats in sorted_products:
            result.append(TopProduct(
                name=name_map.get(pid, "Producto desconocido"),
                quantity_sold=stats["quantity"],
                total_revenue=round(stats["revenue"], 2),
            ))

        return result

    # ------------------------------------------------------------------ #
    # get_top_customers
    # ------------------------------------------------------------------ #

    async def get_top_customers(self) -> List[TopCustomer]:
        """
        Obtiene los 5 clientes con mayor gasto total.
        Ordena por total_gastado DESC, LIMIT 5.
        """
        all_customers = await self._db.get_all_customers()

        # Sort by total_gastado DESC
        sorted_customers = sorted(
            all_customers,
            key=lambda c: float(c.get("total_gastado", 0)),
            reverse=True,
        )[:5]

        return [
            TopCustomer(
                name=c.get("nombre", ""),
                email=c.get("email", ""),
                total_spent=float(c.get("total_gastado", 0)),
                order_count=int(c.get("cantidad_ordenes", 0)),
            )
            for c in sorted_customers
        ]

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #

    @staticmethod
    def _parse_date(value: Any) -> datetime | None:
        """Parsea una fecha de la BD (puede ser string ISO o datetime)."""
        if value is None:
            return None
        if isinstance(value, datetime):
            if value.tzinfo is None:
                return value.replace(tzinfo=timezone.utc)
            return value
        if isinstance(value, str):
            try:
                # Try ISO format with timezone
                dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except (ValueError, TypeError):
                return None
        return None
