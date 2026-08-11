"""Shared helpers."""

from app.utils.order_number import generate_order_number
from app.utils.stock import ensure_stock_available

__all__ = ["ensure_stock_available", "generate_order_number"]
