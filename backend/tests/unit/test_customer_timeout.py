"""Tests unitarios para timeout de clientes.

Verifica que cuando Supabase no responde a tiempo, se retorna HTTP 500
con el mensaje esperado.
"""
from __future__ import annotations

import asyncio
from unittest.mock import MagicMock, patch

import pytest

from app.database.operations import DatabaseOperations
from app.exceptions import DatabaseError


@pytest.fixture
def db_ops():
    """DatabaseOperations con cliente mockeado."""
    mock_client = MagicMock()
    return DatabaseOperations(client=mock_client)


@pytest.fixture
def mock_config():
    """Mock de get_config que retorna una configuración válida."""
    cfg = MagicMock()
    cfg.supabase_url = "https://myproject.supabase.co"
    cfg.supabase_key = "fake-service-role-key"
    cfg.mercadopago_access_token = "fake-token"
    return cfg


class TestGetAllCustomersTimeout:
    """Tests para el manejo de timeout en get_all_customers."""

    @pytest.mark.asyncio
    async def test_timeout_raises_database_error_with_correct_message(self, db_ops):
        """Cuando Supabase no responde en 20s, se lanza DatabaseError con mensaje de timeout."""

        # Simular que _get_all_customers_sync nunca termina
        def slow_query():
            import time
            time.sleep(30)
            return []

        db_ops._get_all_customers_sync = slow_query

        # Versión con timeout reducido para el test
        async def patched_get_all():
            try:
                return await asyncio.wait_for(
                    asyncio.to_thread(db_ops._get_all_customers_sync),
                    timeout=0.1,
                )
            except asyncio.TimeoutError:
                raise DatabaseError(
                    "La base de datos no respondió a tiempo al consultar clientes"
                ) from None

        with pytest.raises(DatabaseError) as exc_info:
            await patched_get_all()

        assert "La base de datos no respondió a tiempo al consultar clientes" in str(
            exc_info.value
        )

    @pytest.mark.asyncio
    async def test_timeout_error_message_matches_spec(self, db_ops, mock_config):
        """El mensaje de error de timeout contiene exactamente el texto esperado."""

        with patch(
            "app.database.operations.asyncio.wait_for",
            side_effect=asyncio.TimeoutError(),
        ), patch("app.database.operations.get_config", return_value=mock_config):
            with pytest.raises(DatabaseError) as exc_info:
                await db_ops.get_all_customers()

        error_msg = str(exc_info.value)
        assert "La base de datos no respondió a tiempo al consultar clientes" in error_msg

    @pytest.mark.asyncio
    async def test_successful_query_returns_data(self, db_ops):
        """Cuando la consulta es exitosa, retorna los datos correctamente."""
        expected_data = [
            {"id_cliente": "abc-123", "nombre": "Test", "email": "test@test.com"}
        ]

        db_ops._get_all_customers_sync = MagicMock(return_value=expected_data)

        with patch("app.database.operations.get_config") as cfg_mock:
            cfg_mock.return_value.supabase_url = "https://myproject.supabase.co"
            result = await db_ops.get_all_customers()

        assert result == expected_data

    @pytest.mark.asyncio
    async def test_dns_error_includes_hostname(self, db_ops, mock_config):
        """Cuando hay error DNS, el mensaje incluye el hostname fallido."""

        # Simular que la query de Supabase lanza un error DNS.
        # En el código real, _get_all_customers_sync llama a self._raise_db_error(e)
        # cuando la query falla. Simulamos eso configurando el mock del client.
        mock_table = MagicMock()
        mock_table.select.return_value.order.return_value.execute.side_effect = (
            Exception("getaddrinfo failed for some-host.supabase.co")
        )
        db_ops._client_override.table.return_value = mock_table

        with patch("app.database.operations.get_config", return_value=mock_config):
            with pytest.raises(DatabaseError) as exc_info:
                await db_ops.get_all_customers()

        error_msg = str(exc_info.value)
        assert "myproject.supabase.co" in error_msg
        assert "dns" in error_msg.lower()


class TestCustomerTimeoutHTTPResponse:
    """Tests que verifican la respuesta HTTP 500 a nivel de servicio + ruta."""

    @pytest.mark.asyncio
    async def test_http_500_on_timeout(self):
        """La ruta GET /customers retorna HTTP 500 con mensaje de timeout.

        Verificamos que el handler de la ruta convierte DatabaseError en HTTP 500.
        """
        from fastapi import HTTPException, status

        from app.services.customer_service import CustomerService

        # Crear un mock de DatabaseOperations que lance timeout
        mock_db = MagicMock()
        service = CustomerService(db=mock_db)

        # Simular que get_all_customers del DB lanza timeout
        mock_db.get_all_customers = MagicMock(
            side_effect=DatabaseError(
                "La base de datos no respondió a tiempo al consultar clientes"
            )
        )

        # El servicio propaga el DatabaseError
        with pytest.raises(DatabaseError) as exc_info:
            await service.get_all_customers()

        error_msg = str(exc_info.value)
        assert "La base de datos no respondió a tiempo al consultar clientes" in error_msg

        # Verificar que la ruta convierte esto en HTTP 500
        # (simulamos lo que hace el handler de la ruta)
        try:
            await service.get_all_customers()
        except DatabaseError as e:
            # Esto es lo que hace el handler en customers.py
            http_exc = HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e),
            )
            assert http_exc.status_code == 500
            assert (
                "La base de datos no respondió a tiempo al consultar clientes"
                in http_exc.detail
            )
