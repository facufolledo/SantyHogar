"""Property-based tests for customer email uniqueness.

Feature: sprint-2-completar-ecommerce
Tests Property 4 from the design document.

**Validates: Requirements 2.7**
"""
import asyncio
from typing import Any, Dict, Optional
from unittest.mock import AsyncMock, patch
from uuid import UUID, uuid4

import pytest
from hypothesis import given, settings, assume
from hypothesis import strategies as st

from app.exceptions import DatabaseError
from app.models.schemas import CreateCustomerRequest
from app.services.customer_service import CustomerService


# ------------------------------------------------------------------ #
# Strategies (generators)
# ------------------------------------------------------------------ #

# Strategy for valid email addresses
email_st = st.emails()

# Strategy for valid customer names
customer_name_st = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N", "Z")),
    min_size=1,
    max_size=100,
).map(lambda s: s.strip()).filter(lambda s: len(s) >= 1)

# Strategy for optional phone
phone_st = st.one_of(st.none(), st.text(min_size=1, max_size=50).filter(lambda s: s.strip() != ""))


@st.composite
def customer_request_st(draw, email: Optional[str] = None):
    """Strategy that generates a valid CreateCustomerRequest."""
    return CreateCustomerRequest(
        name=draw(customer_name_st),
        email=email if email else draw(email_st),
        phone=draw(phone_st),
    )


def _make_existing_customer_row(email: str) -> Dict[str, Any]:
    """Creates a fake database row representing an existing customer."""
    from datetime import datetime, timezone

    return {
        "id_cliente": str(uuid4()),
        "nombre": "Existing Customer",
        "email": email,
        "telefono": None,
        "direccion": None,
        "ciudad": None,
        "provincia": None,
        "codigo_postal": None,
        "fecha_registro": datetime.now(timezone.utc),
        "fecha_actualizacion": datetime.now(timezone.utc),
        "total_gastado": 0.0,
        "cantidad_ordenes": 0,
        "notas": None,
        "activo": True,
    }


# ------------------------------------------------------------------ #
# Property 4: Email uniqueness on customer creation
# ------------------------------------------------------------------ #


class TestProperty4EmailUniqueness:
    """
    Property 4: Unicidad de email en creación de clientes

    For any email that already exists in the clientes table, attempting to
    create a new customer with that same email must result in an error
    containing "Ya existe un cliente con ese email", and the number of
    customers in the table must not change.

    **Validates: Requirements 2.7**
    """

    @given(existing_email=email_st, new_customer_name=customer_name_st)
    @settings(max_examples=100, deadline=None)
    def test_duplicate_email_creation_fails(self, existing_email: str, new_customer_name: str):
        """Creating a customer with an already-existing email must raise DatabaseError."""
        # Setup: mock DatabaseOperations where get_customer_by_email returns an existing row
        mock_db = AsyncMock()
        mock_db.get_customer_by_email = AsyncMock(
            return_value=_make_existing_customer_row(existing_email)
        )
        # create_customer should NOT be called
        mock_db.create_customer = AsyncMock()

        service = CustomerService(db=mock_db)

        request = CreateCustomerRequest(
            name=new_customer_name,
            email=existing_email,
        )

        # Act & Assert: creating a customer with existing email must fail
        with pytest.raises(DatabaseError) as exc_info:
            asyncio.run(service.create_customer(request))

        # The error message must contain the expected text indicating duplicate
        error_msg = str(exc_info.value).lower()
        assert "ya existe" in error_msg
        assert "email" in error_msg

        # The database create method must NOT have been called
        mock_db.create_customer.assert_not_called()

    @given(new_email=email_st, customer_name=customer_name_st)
    @settings(max_examples=100, deadline=None)
    def test_unique_email_creation_succeeds(self, new_email: str, customer_name: str):
        """Creating a customer with a non-existing email must succeed."""
        new_id = uuid4()

        # Setup: mock DatabaseOperations where get_customer_by_email returns None (no existing)
        mock_db = AsyncMock()
        mock_db.get_customer_by_email = AsyncMock(return_value=None)
        mock_db.create_customer = AsyncMock(return_value=new_id)

        # After creation, get_customer_by_id returns the new customer
        from datetime import datetime, timezone

        mock_db.get_customer_by_id = AsyncMock(return_value={
            "id_cliente": str(new_id),
            "nombre": customer_name,
            "email": new_email,
            "telefono": None,
            "direccion": None,
            "ciudad": None,
            "provincia": None,
            "codigo_postal": None,
            "fecha_registro": datetime.now(timezone.utc),
            "fecha_actualizacion": datetime.now(timezone.utc),
            "total_gastado": 0.0,
            "cantidad_ordenes": 0,
            "notas": None,
            "activo": True,
        })

        service = CustomerService(db=mock_db)

        request = CreateCustomerRequest(
            name=customer_name,
            email=new_email,
        )

        # Act: creating a customer with unique email must succeed
        result = asyncio.run(service.create_customer(request))

        # Assert: the customer was created
        assert result is not None
        assert result.email == new_email
        assert result.name == customer_name

        # The database create method MUST have been called
        mock_db.create_customer.assert_called_once()
