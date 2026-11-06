"""Human-readable unique order numbers for `ordenes.numero_orden`."""
import secrets
from datetime import datetime, timezone


def generate_order_number(*, now: datetime | None = None) -> str:
    """
    Formato fijo SH-YYYYMMDD-XXXX (UTC), ej. SH-20260416-0001.

    XXXX son 4 dígitos (0000–9999) aleatorios; la unicidad la asegura
    `idx_ordenes_numero_orden` en DB (reintentar con otra llamada si colisiona).
    """
    dt = now or datetime.now(timezone.utc)
    day = dt.strftime("%Y%m%d")
    n = secrets.randbelow(10_000)
    return f"SH-{day}-{n:04d}"
