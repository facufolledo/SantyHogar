"""Utilidades para manejar timezones - Córdoba Argentina (UTC-3)."""
from datetime import datetime, timezone, timedelta
from typing import Optional

# Córdoba, Argentina está en UTC-3 (ART - Argentina Time)
CORDOBA_TZ = timezone(timedelta(hours=-3))


def now_cordoba() -> datetime:
    """Retorna la hora actual en horario de Córdoba (UTC-3)."""
    return datetime.now(CORDOBA_TZ)


def to_cordoba(dt: Optional[datetime]) -> Optional[datetime]:
    """Convierte un datetime (en cualquier tz) a Córdoba (UTC-3)."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        # Si no tiene tz, asumir UTC
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(CORDOBA_TZ)


def format_cordoba(dt: Optional[datetime], fmt: str = "%d/%m/%Y %H:%M") -> str:
    """Formatea un datetime en Córdoba con un formato específico."""
    if dt is None:
        return ""
    cordoba_dt = to_cordoba(dt)
    return cordoba_dt.strftime(fmt) if cordoba_dt else ""
