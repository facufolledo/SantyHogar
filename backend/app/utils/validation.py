"""Utilidades para validar y sanitizar inputs."""
import re
from typing import Any, Optional
from uuid import UUID

def validate_email(email: str) -> bool:
    """Valida formato de email."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """Valida que el teléfono tenga solo dígitos y espacios (Argentina)."""
    phone = phone.strip()
    # Permitir: +54 9 (11) 1234-5678 o variantes
    pattern = r'^(\+?54)?[\d\s\-\(\)]{8,}$'
    return bool(re.match(pattern, phone))


def validate_name(name: str, min_len: int = 2, max_len: int = 100) -> bool:
    """Valida nombre: sin caracteres peligrosos, largo válido."""
    name = name.strip()
    if not (min_len <= len(name) <= max_len):
        return False
    # Permitir letras, espacios, guiones, puntos (para nombres como "María-José" o "Jean-Pierre")
    pattern = r"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.]+$"
    return bool(re.match(pattern, name))


def validate_password(password: str) -> tuple[bool, Optional[str]]:
    """
    Valida contraseña.
    Requisitos:
    - Mínimo 8 caracteres
    - Al menos una mayúscula
    - Al menos una minúscula
    - Al menos un número
    """
    if len(password) < 8:
        return False, "Mínimo 8 caracteres"
    if not re.search(r'[A-Z]', password):
        return False, "Debe incluir al menos una mayúscula"
    if not re.search(r'[a-z]', password):
        return False, "Debe incluir al menos una minúscula"
    if not re.search(r'\d', password):
        return False, "Debe incluir al menos un número"
    return True, None


def sanitize_string(value: str, max_len: int = 500) -> str:
    """Sanitiza string: trim, limita largo, elimina caracteres peligrosos."""
    if not isinstance(value, str):
        return ""
    value = value.strip()
    if len(value) > max_len:
        value = value[:max_len]
    # Reemplazar secuencias peligrosas
    dangerous_patterns = [
        (r'<script', ''),
        (r'javascript:', ''),
        (r'onclick', ''),
        (r'onerror', ''),
    ]
    for pattern, replacement in dangerous_patterns:
        value = re.sub(pattern, replacement, value, flags=re.IGNORECASE)
    return value


def validate_quantity(quantity: Any) -> tuple[bool, int]:
    """Valida cantidad: debe ser número positivo."""
    try:
        qty = int(quantity)
        if qty <= 0:
            return False, 0
        if qty > 10000:  # Límite máximo por orden
            return False, 0
        return True, qty
    except (ValueError, TypeError):
        return False, 0


def validate_price(price: Any) -> tuple[bool, float]:
    """Valida precio: debe ser número positivo."""
    try:
        p = float(price)
        if p < 0:
            return False, 0.0
        if p > 1_000_000:  # Límite máximo
            return False, 0.0
        return True, round(p, 2)
    except (ValueError, TypeError):
        return False, 0.0


def validate_uuid(value: Any) -> tuple[bool, Optional[UUID]]:
    """Valida que sea un UUID válido."""
    try:
        uid = UUID(str(value))
        return True, uid
    except (ValueError, AttributeError, TypeError):
        return False, None


def validate_enum(value: str, allowed: list[str]) -> bool:
    """Valida que el valor esté en el enum permitido."""
    return value in allowed
