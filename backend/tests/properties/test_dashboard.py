"""Property-based tests for dashboard statistics and rankings.

Feature: sprint-2-completar-ecommerce
Tests Properties 6 and 7 from the design document.

**Validates: Requirements 5.1, 5.5, 5.6**
"""
import asyncio
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from hypothesis import given, settings, assume
from hypothesis import strategies as st

from app.models.schemas import DashboardStats, TopCustomer, TopProduct
from app.services.dashboard_service import DashboardService


# ------------------------------------------------------------------ #
# Strategies (generators)
# ------------------------------------------------------------------ #

# Strategy for order totals (positive amounts)
total_st = st.floats(min_value=1.0, max_value=1_000_000.0, allow_nan=False, allow_infinity=False)

# Strategy for stock values
stock_st = st.integers(min_value=0, max_value=1000)

# Strategy for customer spending
spending_st = st.floats(min_value=0.0, max_value=10_000_000.0, allow_nan=False, allow_infinity=False)

# Strategy for order count
order_count_st = st.integers(min_value=0, max_value=500)


@st.composite
def paid_order_st(draw, date: datetime | None = None):
    """Strategy that generates a paid order row."""
    now = datetime.now(timezone.utc)
    if date is None:
        # Generate a date within the last 30 days
        days_ago = draw(st.integers(min_value=0, max_value=30))
        date = now - timedelta(days=days_ago)

    return {
        "id_orden": str(uuid4()),
        "estado": "paid",
        "total": draw(total_st),
        "fecha_creacion": date.isoformat(),
        "nombre_cliente": "Test Customer",
        "email_cliente": f"test_{draw(st.integers(min_value=1, max_value=9999))}@example.com",
    }


@st.composite
def order_with_status_st(draw):
    """Strategy that generates an order with any status."""
    now = datetime.now(timezone.utc)
    days_ago = draw(st.integers(min_value=0, max_value=30))
    date = now - timedelta(days=days_ago)
    status = draw(st.sampled_from(["pending", "paid", "cancelled"]))

    return {
        "id_orden": str(uuid4()),
        "estado": status,
        "total": draw(total_st),
        "fecha_creacion": date.isoformat(),
        "nombre_cliente": "Test Customer",
        "email_cliente": f"test@example.com",
    }


@st.composite
def product_row_st(draw):
    """Strategy that generates a product row."""
    return {
        "id_producto": str(uuid4()),
        "nombre": f"Product {draw(st.integers(min_value=1, max_value=9999))}",
        "stock": draw(stock_st),
        "precio": draw(total_st),
    }


@st.composite
def customer_row_st(draw):
    """Strategy that generates a customer row."""
    now = datetime.now(timezone.utc)
    days_ago = draw(st.integers(min_value=0, max_value=60))
    reg_date = now - timedelta(days=days_ago)

    return {
        "id_cliente": str(uuid4()),
        "nombre": f"Customer {draw(st.integers(min_value=1, max_value=9999))}",
        "email": f"customer_{draw(st.integers(min_value=1, max_value=99999))}@example.com",
        "total_gastado": draw(spending_st),
        "cantidad_ordenes": draw(order_count_st),
        "fecha_registro": reg_date.isoformat(),
        "activo": True,
    }


# ------------------------------------------------------------------ #
# Property 6: Dashboard stats correctness
# ------------------------------------------------------------------ #


class TestProperty6DashboardStats:
    """
    Property 6: Correctitud de estadísticas del dashboard

    For any set of orders with status "paid" and varied dates, the endpoint
    GET /dashboard/stats must return:
    - sales_day equal to the sum of totals of paid orders from today
    - sales_week equal to the sum of the last 7 days
    - sales_month equal to the sum of the current month
    - avg_ticket equal to sales_month / order_count (or 0 if no orders)

    **Validates: Requirements 5.1**
    """

    @given(
        today_orders=st.lists(total_st, min_size=0, max_size=5),
        week_orders=st.lists(total_st, min_size=0, max_size=5),
        old_orders=st.lists(total_st, min_size=0, max_size=3),
        products=st.lists(product_row_st(), min_size=0, max_size=10),
        customers=st.lists(customer_row_st(), min_size=0, max_size=5),
    )
    @settings(max_examples=100, deadline=None)
    def test_sales_calculations_correct(
        self,
        today_orders: List[float],
        week_orders: List[float],
        old_orders: List[float],
        products: List[Dict[str, Any]],
        customers: List[Dict[str, Any]],
    ):
        """Sales day/week/month must equal the sum of paid orders in each period."""
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        month_start = today_start.replace(day=1)

        # Build order rows
        all_order_rows: List[Dict[str, Any]] = []

        # Today's orders (also in week and month)
        for total in today_orders:
            all_order_rows.append({
                "id_orden": str(uuid4()),
                "estado": "paid",
                "total": total,
                "fecha_creacion": now.isoformat(),
            })

        # This week's orders (not today, but within the week)
        # Only add if week_start < today_start (i.e., today is not Monday)
        if today_start > week_start:
            for total in week_orders:
                # Use a date between week_start and yesterday
                date = week_start + timedelta(hours=12)
                all_order_rows.append({
                    "id_orden": str(uuid4()),
                    "estado": "paid",
                    "total": total,
                    "fecha_creacion": date.isoformat(),
                })

        # Old orders (more than 31 days ago, outside current month)
        for total in old_orders:
            date = month_start - timedelta(days=2)
            all_order_rows.append({
                "id_orden": str(uuid4()),
                "estado": "paid",
                "total": total,
                "fecha_creacion": date.isoformat(),
            })

        # Also add some non-paid orders that should be excluded
        all_order_rows.append({
            "id_orden": str(uuid4()),
            "estado": "pending",
            "total": 999999.0,
            "fecha_creacion": now.isoformat(),
        })
        all_order_rows.append({
            "id_orden": str(uuid4()),
            "estado": "cancelled",
            "total": 888888.0,
            "fecha_creacion": now.isoformat(),
        })

        # Setup mock
        mock_db = AsyncMock()
        mock_db.get_all_orders = AsyncMock(return_value=all_order_rows)
        mock_db.get_all_products = AsyncMock(return_value=products)
        mock_db.get_all_customers = AsyncMock(return_value=customers)

        service = DashboardService(db=mock_db)
        result = asyncio.run(service.get_stats())

        # Calculate expected values
        expected_sales_day = sum(today_orders)
        expected_sales_week = sum(today_orders)
        if today_start > week_start:
            expected_sales_week += sum(week_orders)

        # Month includes today + week orders (if week_start >= month_start)
        expected_sales_month = sum(today_orders)
        if week_start >= month_start and today_start > week_start:
            expected_sales_month += sum(week_orders)

        expected_order_count_month = len(today_orders)
        if week_start >= month_start and today_start > week_start:
            expected_order_count_month += len(week_orders)

        expected_avg_ticket = (
            expected_sales_month / expected_order_count_month
            if expected_order_count_month > 0
            else 0.0
        )

        # Assert sales calculations
        assert abs(result.sales_day - expected_sales_day) < 0.01, (
            f"sales_day: got {result.sales_day}, expected {expected_sales_day}"
        )
        assert abs(result.sales_week - expected_sales_week) < 0.01, (
            f"sales_week: got {result.sales_week}, expected {expected_sales_week}"
        )
        assert abs(result.sales_month - expected_sales_month) < 0.01, (
            f"sales_month: got {result.sales_month}, expected {expected_sales_month}"
        )
        assert result.order_count == expected_order_count_month
        assert abs(result.avg_ticket - round(expected_avg_ticket, 2)) < 0.01

    @given(products=st.lists(product_row_st(), min_size=1, max_size=20))
    @settings(max_examples=100, deadline=None)
    def test_product_stats_correct(self, products: List[Dict[str, Any]]):
        """Active products and low stock counts must be correct."""
        mock_db = AsyncMock()
        mock_db.get_all_orders = AsyncMock(return_value=[])
        mock_db.get_all_products = AsyncMock(return_value=products)
        mock_db.get_all_customers = AsyncMock(return_value=[])

        service = DashboardService(db=mock_db)
        result = asyncio.run(service.get_stats())

        expected_active = sum(1 for p in products if int(p.get("stock", 0)) > 0)
        expected_low_stock = sum(
            1 for p in products if 0 < int(p.get("stock", 0)) < 5
        )

        assert result.active_products == expected_active
        assert result.low_stock_products == expected_low_stock


# ------------------------------------------------------------------ #
# Property 7: Top products and top customers ranking
# ------------------------------------------------------------------ #


class TestProperty7Rankings:
    """
    Property 7: Ranking de top productos y clientes

    For any set of order items, GET /dashboard/top-products must return the
    5 products with the highest quantity sold, ordered from highest to lowest.
    For any set of customers, GET /dashboard/top-customers must return the
    5 customers with the highest total_spent, ordered from highest to lowest.

    **Validates: Requirements 5.5, 5.6**
    """

    @given(customers=st.lists(customer_row_st(), min_size=1, max_size=15))
    @settings(max_examples=100, deadline=None)
    def test_top_customers_ranking(self, customers: List[Dict[str, Any]]):
        """Top customers must be sorted by total_spent DESC, limited to 5."""
        mock_db = AsyncMock()
        mock_db.get_all_customers = AsyncMock(return_value=customers)

        service = DashboardService(db=mock_db)
        result = asyncio.run(service.get_top_customers())

        # Should return at most 5
        assert len(result) <= 5
        assert len(result) == min(5, len(customers))

        # Should be sorted by total_spent DESC
        for i in range(len(result) - 1):
            assert result[i].total_spent >= result[i + 1].total_spent

        # The top customers should be the ones with highest total_spent
        sorted_customers = sorted(
            customers,
            key=lambda c: float(c.get("total_gastado", 0)),
            reverse=True,
        )[:5]

        for i, tc in enumerate(result):
            expected = sorted_customers[i]
            assert abs(tc.total_spent - float(expected["total_gastado"])) < 0.01

    @given(
        num_products=st.integers(min_value=1, max_value=8),
        quantities=st.lists(
            st.integers(min_value=1, max_value=100),
            min_size=1,
            max_size=8,
        ),
    )
    @settings(max_examples=100, deadline=None)
    def test_top_products_ranking(
        self,
        num_products: int,
        quantities: List[int],
    ):
        """Top products must be sorted by quantity_sold DESC, limited to 5."""
        # Create products
        products = []
        for i in range(num_products):
            products.append({
                "id_producto": str(uuid4()),
                "nombre": f"Product {i}",
                "stock": 10,
                "precio": 100.0,
            })

        # Create a single paid order
        order_id = str(uuid4())
        orders = [{
            "id_orden": order_id,
            "estado": "paid",
            "total": 1000.0,
            "fecha_creacion": datetime.now(timezone.utc).isoformat(),
        }]

        # Create items for the order - distribute quantities across products
        items: List[Dict[str, Any]] = []
        product_quantities: Dict[str, int] = {}
        for i, qty in enumerate(quantities[:num_products]):
            pid = products[i % num_products]["id_producto"]
            items.append({
                "id_item": str(uuid4()),
                "id_orden": order_id,
                "id_producto": pid,
                "cantidad": qty,
                "precio_unitario": 100.0,
            })
            product_quantities[pid] = product_quantities.get(pid, 0) + qty

        # Setup mock
        mock_db = AsyncMock()
        mock_db.get_all_orders = AsyncMock(return_value=orders)
        mock_db.get_order_items = AsyncMock(return_value=items)
        mock_db.get_products_by_ids = AsyncMock(return_value=products)

        service = DashboardService(db=mock_db)
        result = asyncio.run(service.get_top_products())

        # Should return at most 5
        assert len(result) <= 5

        # Should be sorted by quantity_sold DESC
        for i in range(len(result) - 1):
            assert result[i].quantity_sold >= result[i + 1].quantity_sold

        # Verify the top products match expected ranking
        expected_sorted = sorted(
            product_quantities.items(),
            key=lambda x: x[1],
            reverse=True,
        )[:5]

        assert len(result) == len(expected_sorted)
        for i, (pid, qty) in enumerate(expected_sorted):
            assert result[i].quantity_sold == qty
