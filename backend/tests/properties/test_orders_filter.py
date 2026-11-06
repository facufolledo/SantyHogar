"""Property-based tests for order filtering by email.

Feature: sprint-2-completar-ecommerce
Tests Property 8 from the design document.

**Validates: Requirements 6.1**
"""
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from hypothesis import given, settings, assume
from hypothesis import strategies as st

from app.services.order_service import OrderService
from app.services.product_service import ProductService


# ------------------------------------------------------------------ #
# Strategies (generators)
# ------------------------------------------------------------------ #

email_st = st.emails()

order_status_st = st.sampled_from(["pending", "paid", "cancelled"])


@st.composite
def order_row_st(draw, email: str | None = None):
    """Strategy that generates a fake order database row."""
    order_email = email if email else draw(email_st)
    created_at = draw(
        st.datetimes(
            min_value=datetime(2023, 1, 1),
            max_value=datetime(2025, 12, 31),
            timezones=st.just(timezone.utc),
        )
    )
    return {
        "id_orden": str(uuid4()),
        "numero_orden": f"SH{draw(st.integers(min_value=10000, max_value=99999))}",
        "nombre_cliente": draw(st.text(min_size=1, max_size=50).filter(lambda s: s.strip() != "")),
        "email_cliente": order_email,
        "telefono_cliente": "011 1234-5678",
        "total": round(draw(st.floats(min_value=100, max_value=100000, allow_nan=False, allow_infinity=False)), 2),
        "metodo_pago": "mp",
        "estado": draw(order_status_st),
        "fecha_creacion": created_at,
        "fecha_actualizacion": created_at,
        "id_preferencia": None,
        "payment_id": None,
        "id_usuario": None,
    }


@st.composite
def order_set_st(draw):
    """Strategy that generates a set of orders with mixed emails."""
    target_email = draw(email_st)
    other_email = draw(email_st)
    assume(target_email.lower() != other_email.lower())

    # Generate some orders for target email
    target_count = draw(st.integers(min_value=0, max_value=5))
    target_orders = [draw(order_row_st(email=target_email)) for _ in range(target_count)]

    # Generate some orders for other email
    other_count = draw(st.integers(min_value=0, max_value=5))
    other_orders = [draw(order_row_st(email=other_email)) for _ in range(other_count)]

    all_orders = target_orders + other_orders
    return target_email, target_orders, all_orders


# ------------------------------------------------------------------ #
# Property 8: Order filtering by email
# ------------------------------------------------------------------ #


class TestProperty8OrdersFilterByEmail:
    """
    Property 8: Filtrado de órdenes por email

    For any email and set of orders in the database, GET /orders?email={email}
    must return only the orders whose email_cliente matches the provided email,
    and they must be ordered by fecha_creacion descending.

    **Validates: Requirements 6.1**
    """

    @given(data=order_set_st())
    @settings(max_examples=100, deadline=None)
    def test_filter_returns_only_matching_email(self, data):
        """Filtering by email returns only orders with that email_cliente."""
        target_email, target_orders, all_orders = data

        # Mock DB: get_orders_by_email returns only target orders (sorted by date desc)
        sorted_target = sorted(target_orders, key=lambda o: o["fecha_creacion"], reverse=True)

        mock_db = AsyncMock()
        mock_db.get_orders_by_email = AsyncMock(return_value=sorted_target)
        mock_db.get_order_items = AsyncMock(return_value=[])

        mock_product_service = AsyncMock(spec=ProductService)
        service = OrderService(db=mock_db, product_service=mock_product_service)

        # Act
        result = asyncio.run(service.get_all_orders(email=target_email))

        # Assert: count matches
        assert len(result) == len(target_orders)

        # Assert: all returned orders have the target email
        for order in result:
            assert order.customerEmail == target_email

        # Assert: the DB method was called with the correct email
        mock_db.get_orders_by_email.assert_called_once_with(target_email)
        mock_db.get_all_orders.assert_not_called()

    @given(data=order_set_st())
    @settings(max_examples=100, deadline=None)
    def test_filter_results_ordered_by_date_desc(self, data):
        """Filtered orders must be ordered by fecha_creacion descending."""
        target_email, target_orders, all_orders = data
        assume(len(target_orders) >= 2)

        # Sort target orders by date descending (simulating DB behavior)
        sorted_target = sorted(target_orders, key=lambda o: o["fecha_creacion"], reverse=True)

        mock_db = AsyncMock()
        mock_db.get_orders_by_email = AsyncMock(return_value=sorted_target)
        mock_db.get_order_items = AsyncMock(return_value=[])

        mock_product_service = AsyncMock(spec=ProductService)
        service = OrderService(db=mock_db, product_service=mock_product_service)

        # Act
        result = asyncio.run(service.get_all_orders(email=target_email))

        # Assert: results are in descending date order
        dates = [r.createdAt for r in result]
        assert dates == sorted(dates, reverse=True)

    @given(all_orders=st.lists(order_row_st(), min_size=0, max_size=8))
    @settings(max_examples=100, deadline=None)
    def test_no_email_returns_all_orders(self, all_orders):
        """When no email is provided, all orders are returned."""
        sorted_all = sorted(all_orders, key=lambda o: o["fecha_creacion"], reverse=True)

        mock_db = AsyncMock()
        mock_db.get_all_orders = AsyncMock(return_value=sorted_all)
        mock_db.get_order_items = AsyncMock(return_value=[])

        mock_product_service = AsyncMock(spec=ProductService)
        service = OrderService(db=mock_db, product_service=mock_product_service)

        # Act: no email filter
        result = asyncio.run(service.get_all_orders(email=None))

        # Assert: all orders returned
        assert len(result) == len(all_orders)

        # Assert: get_all_orders was called (not get_orders_by_email)
        mock_db.get_all_orders.assert_called_once()
        mock_db.get_orders_by_email.assert_not_called()
