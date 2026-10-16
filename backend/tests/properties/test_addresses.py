"""Property-based tests for address round-trip.

Feature: sprint-2-completar-ecommerce
Tests Property 9 from the design document.

**Validates: Requirements 8.1**
"""
import asyncio
from datetime import datetime, timezone
from typing import Any, Dict
from unittest.mock import AsyncMock
from uuid import UUID, uuid4

import pytest
from hypothesis import given, settings, assume
from hypothesis import strategies as st

from app.exceptions import DatabaseError
from app.models.schemas import CreateAddressRequest
from app.services.customer_service import CustomerService


# ------------------------------------------------------------------ #
# Strategies (generators)
# ------------------------------------------------------------------ #

label_st = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N", "Z")),
    min_size=1,
    max_size=50,
).map(lambda s: s.strip()).filter(lambda s: len(s) >= 1)

street_st = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N", "Z", "P")),
    min_size=1,
    max_size=200,
).map(lambda s: s.strip()).filter(lambda s: len(s) >= 1)

city_st = st.text(
    alphabet=st.characters(whitelist_categories=("L", "Z")),
    min_size=1,
    max_size=100,
).map(lambda s: s.strip()).filter(lambda s: len(s) >= 1)

province_st = st.text(
    alphabet=st.characters(whitelist_categories=("L", "Z")),
    min_size=1,
    max_size=100,
).map(lambda s: s.strip()).filter(lambda s: len(s) >= 1)

zip_st = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N")),
    min_size=1,
    max_size=20,
).map(lambda s: s.strip()).filter(lambda s: len(s) >= 1)

is_primary_st = st.booleans()


@st.composite
def address_request_st(draw):
    """Strategy that generates a valid CreateAddressRequest."""
    return CreateAddressRequest(
        label=draw(label_st),
        street=draw(street_st),
        city=draw(city_st),
        province=draw(province_st),
        zip=draw(zip_st),
        isPrimary=draw(is_primary_st),
    )


# ------------------------------------------------------------------ #
# Property 9: Round-trip of addresses
# ------------------------------------------------------------------ #


class TestProperty9AddressRoundTrip:
    """
    Property 9: Round-trip de direcciones

    For any valid address data (label, street, city, province, zip),
    creating the address via POST and then retrieving it via GET must
    return an address with the same data that was sent.

    **Validates: Requirements 8.1**
    """

    @given(request=address_request_st())
    @settings(max_examples=100, deadline=None)
    def test_create_and_retrieve_address_roundtrip(self, request: CreateAddressRequest):
        """Creating an address and retrieving it returns the same data."""
        customer_id = uuid4()
        address_id = uuid4()

        # Mock DB: create_address returns the new ID
        mock_db = AsyncMock()
        mock_db.create_address = AsyncMock(return_value=address_id)
        # No existing addresses (so no primary to unset)
        mock_db.get_customer_addresses = AsyncMock(return_value=[])

        service = CustomerService(db=mock_db)

        # Act: create the address
        result = asyncio.run(service.create_address(customer_id, request))

        # Assert: the returned address matches the input
        assert result.id == address_id
        assert result.label == request.label
        assert result.street == request.street
        assert result.city == request.city
        assert result.province == request.province
        assert result.zip == request.zip
        assert result.isPrimary == request.isPrimary

        # Verify DB was called with correct data
        mock_db.create_address.assert_called_once()
        call_args = mock_db.create_address.call_args[0][0]
        assert call_args["id_cliente"] == str(customer_id)
        assert call_args["etiqueta"] == request.label
        assert call_args["calle"] == request.street
        assert call_args["ciudad"] == request.city
        assert call_args["provincia"] == request.province
        assert call_args["codigo_postal"] == request.zip
        assert call_args["es_principal"] == request.isPrimary

    @given(request=address_request_st())
    @settings(max_examples=100, deadline=None)
    def test_get_addresses_returns_created_data(self, request: CreateAddressRequest):
        """Getting addresses returns data matching what was stored."""
        customer_id = uuid4()
        address_id = uuid4()

        # Simulate the DB row that would be stored
        stored_row = {
            "id_direccion": str(address_id),
            "id_cliente": str(customer_id),
            "etiqueta": request.label,
            "calle": request.street,
            "ciudad": request.city,
            "provincia": request.province,
            "codigo_postal": request.zip,
            "es_principal": request.isPrimary,
            "fecha_creacion": datetime.now(timezone.utc),
        }

        mock_db = AsyncMock()
        mock_db.get_customer_addresses = AsyncMock(return_value=[stored_row])

        service = CustomerService(db=mock_db)

        # Act: get addresses
        result = asyncio.run(service.get_customer_addresses(customer_id))

        # Assert: one address returned with matching data
        assert len(result) == 1
        addr = result[0]
        assert addr.id == address_id
        assert addr.label == request.label
        assert addr.street == request.street
        assert addr.city == request.city
        assert addr.province == request.province
        assert addr.zip == request.zip
        assert addr.isPrimary == request.isPrimary
