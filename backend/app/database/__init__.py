"""Database operations and connection."""

from app.database.connection import get_supabase_client, reset_supabase_client
from app.database.operations import DatabaseOperations


def get_database_operations() -> DatabaseOperations:
    """Factory para inyección en FastAPI (cliente Supabase lazy salvo que se inyecte uno)."""
    return DatabaseOperations()


__all__ = [
    "DatabaseOperations",
    "get_database_operations",
    "get_supabase_client",
    "reset_supabase_client",
]
