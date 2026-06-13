"""Reglas de stock en aplicación (no en SQL). Usar antes de descontar."""
from app.exceptions import InsufficientStockError


def ensure_stock_available(current_stock: int, quantity: int) -> None:
    """
    Antes de descontar, comprobar stock actual vs cantidad pedida.

    Para concurrencia: leer el stock vigente (idealmente en la misma transacción
    que el UPDATE) y llamar a esta función inmediatamente antes del decremento.
    """
    if current_stock < quantity:
        raise InsufficientStockError(
            f"Stock insuficiente: hay {current_stock}, se pidieron {quantity}."
        )
