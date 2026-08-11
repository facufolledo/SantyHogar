"""Property-based tests for Excel (.xlsx) import functionality.

Feature: sprint-2-completar-ecommerce
Tests Properties 1, 2, 3 from the design document.
"""
import io
from typing import List

import pytest
from hypothesis import given, settings, assume
from hypothesis import strategies as st
from openpyxl import Workbook

from app.services.bulk_import_service import parse_xlsx_file, _detect_column_mapping, generate_slug


# ------------------------------------------------------------------ #
# Strategies (generators)
# ------------------------------------------------------------------ #

VALID_CATEGORIES = ["electrodomesticos", "muebleria", "colchoneria"]

# Strategy for valid product names (non-empty, printable, no control chars)
product_name_st = st.text(
    alphabet=st.characters(
        whitelist_categories=("L", "N", "P", "Z"),
        blacklist_characters="\x00\r\n\t",
    ),
    min_size=1,
    max_size=100,
).map(lambda s: s.strip()).filter(lambda s: len(s) >= 1)

# Strategy for valid category
category_st = st.sampled_from(VALID_CATEGORIES)

# Strategy for valid subcategory
subcategory_st = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N", "Z")),
    min_size=1,
    max_size=50,
).map(lambda s: s.strip()).filter(lambda s: len(s) >= 1)

# Strategy for valid price (non-negative float)
price_st = st.floats(min_value=0.0, max_value=999999.99, allow_nan=False, allow_infinity=False)

# Strategy for valid stock (non-negative int)
stock_st = st.integers(min_value=0, max_value=99999)

# Strategy for valid brand
brand_st = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N", "Z")),
    min_size=1,
    max_size=50,
).map(lambda s: s.strip()).filter(lambda s: len(s) >= 1)

# Strategy for description
description_st = st.text(
    alphabet=st.characters(
        whitelist_categories=("L", "N", "P", "Z"),
        blacklist_characters="\x00",
    ),
    min_size=0,
    max_size=200,
)


@st.composite
def product_row_st(draw):
    """Strategy that generates a valid product row dict."""
    return {
        "nombre": draw(product_name_st),
        "categoria": draw(category_st),
        "subcategoria": draw(subcategory_st),
        "precio": round(draw(price_st), 2),
        "stock": draw(stock_st),
        "marca": draw(brand_st),
        "descripcion": draw(description_st),
    }


def _create_xlsx_bytes(headers: List[str], rows: List[List]) -> bytes:
    """Helper: creates an .xlsx file in memory with given headers and rows."""
    wb = Workbook()
    ws = wb.active
    ws.append(headers)
    for row in rows:
        ws.append(row)
    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue()


# ------------------------------------------------------------------ #
# Property 1: Round-trip Excel parsing
# ------------------------------------------------------------------ #


class TestProperty1RoundTrip:
    """
    Property 1: Round-trip de parseo Excel

    For any valid set of product data, writing those data to an .xlsx file
    and then parsing with parse_xlsx_file must produce an equivalent set of products.

    **Validates: Requirements 3.1, 3.2, 3.9**
    """

    @given(products=st.lists(product_row_st(), min_size=1, max_size=10))
    @settings(max_examples=100, deadline=None)
    def test_roundtrip_excel_parsing(self, products):
        """Writing products to xlsx and parsing them back produces equivalent data."""
        headers = ["nombre", "categoria", "subcategoria", "precio", "stock", "marca", "descripcion"]
        rows = []
        for p in products:
            rows.append([
                p["nombre"],
                p["categoria"],
                p["subcategoria"],
                p["precio"],
                p["stock"],
                p["marca"],
                p["descripcion"],
            ])

        xlsx_bytes = _create_xlsx_bytes(headers, rows)
        validations = parse_xlsx_file(xlsx_bytes)

        # All rows should be parsed (valid or invalid)
        assert len(validations) == len(products)

        # For each valid row, check the data matches
        for i, (validation, original) in enumerate(zip(validations, products)):
            assert validation.valid, f"Row {i+1} should be valid but got errors: {validation.errors}"
            assert validation.data is not None

            assert validation.data.nombre == original["nombre"]
            assert validation.data.categoria == original["categoria"]
            assert validation.data.subcategoria == original["subcategoria"]
            assert abs(validation.data.precio - original["precio"]) < 0.01
            assert validation.data.stock == original["stock"]
            assert validation.data.marca == original["marca"]


# ------------------------------------------------------------------ #
# Property 2: Automatic column detection
# ------------------------------------------------------------------ #


# All recognized header names for each field
RECOGNIZED_HEADERS = {
    "nombre": ["nombre", "name", "producto"],
    "categoria": ["categoría", "categoria", "category"],
    "subcategoria": ["subcategoría", "subcategoria", "subcategory"],
    "precio": ["precio", "price", "valor"],
    "stock": ["stock", "cantidad", "qty"],
    "marca": ["marca", "brand", "fabricante"],
    "descripcion": ["descripción", "descripcion", "description"],
}


@st.composite
def permuted_headers_st(draw):
    """Strategy that picks one alias per field and shuffles the order."""
    fields = list(RECOGNIZED_HEADERS.keys())
    chosen = {}
    for field in fields:
        alias = draw(st.sampled_from(RECOGNIZED_HEADERS[field]))
        chosen[field] = alias

    # Create a permutation of the fields
    order = draw(st.permutations(fields))
    headers = [chosen[f] for f in order]
    return headers, order


class TestProperty2ColumnDetection:
    """
    Property 2: Detección automática de columnas Excel

    For any permutation of recognized column names in the first row of an .xlsx,
    the parser must correctly map each column to its corresponding field,
    regardless of order.

    **Validates: Requirement 3.3**
    """

    @given(data=permuted_headers_st(), product=product_row_st())
    @settings(max_examples=100, deadline=None)
    def test_column_detection_any_order(self, data, product):
        """Parser detects columns correctly regardless of header order."""
        headers, field_order = data

        # Build row values in the same order as headers
        row_values = []
        for field in field_order:
            row_values.append(product[field])

        xlsx_bytes = _create_xlsx_bytes(headers, [row_values])
        validations = parse_xlsx_file(xlsx_bytes)

        assert len(validations) == 1
        v = validations[0]
        assert v.valid, f"Row should be valid but got errors: {v.errors}"
        assert v.data is not None

        # Verify each field was mapped correctly
        assert v.data.nombre == product["nombre"]
        assert v.data.categoria == product["categoria"]
        assert v.data.subcategoria == product["subcategoria"]
        assert abs(v.data.precio - product["precio"]) < 0.01
        assert v.data.stock == product["stock"]
        assert v.data.marca == product["marca"]


# ------------------------------------------------------------------ #
# Property 3: Validation of empty required fields
# ------------------------------------------------------------------ #


class TestProperty3EmptyRequiredFields:
    """
    Property 3: Validación de filas con campos obligatorios vacíos

    For any row where the 'nombre' field is empty or absent, the parser must
    mark that row as invalid with a descriptive error message, and the row
    must not appear in the set of valid products.

    **Validates: Requirement 3.4**
    """

    @given(
        empty_name=st.sampled_from(["", "   ", "\t", "\n"]),
        categoria=category_st,
        precio=price_st,
        stock=stock_st,
        marca=brand_st,
    )
    @settings(max_examples=100, deadline=None)
    def test_empty_nombre_marked_invalid(self, empty_name, categoria, precio, stock, marca):
        """Rows with empty/whitespace-only nombre are marked invalid."""
        headers = ["nombre", "categoria", "precio", "stock", "marca"]
        rows = [[empty_name, categoria, precio, stock, marca]]

        xlsx_bytes = _create_xlsx_bytes(headers, rows)
        validations = parse_xlsx_file(xlsx_bytes)

        assert len(validations) == 1
        v = validations[0]
        assert not v.valid, "Row with empty nombre should be invalid"
        assert len(v.errors) > 0
        # Error message should mention 'nombre'
        assert any("nombre" in err.lower() for err in v.errors), \
            f"Error should mention 'nombre', got: {v.errors}"

    @given(
        valid_product=product_row_st(),
        empty_name=st.sampled_from(["", "   "]),
    )
    @settings(max_examples=100, deadline=None)
    def test_mixed_valid_and_invalid_rows(self, valid_product, empty_name):
        """In a file with both valid and invalid rows, only valid ones have data."""
        headers = ["nombre", "categoria", "subcategoria", "precio", "stock", "marca", "descripcion"]
        rows = [
            # Valid row
            [
                valid_product["nombre"],
                valid_product["categoria"],
                valid_product["subcategoria"],
                valid_product["precio"],
                valid_product["stock"],
                valid_product["marca"],
                valid_product["descripcion"],
            ],
            # Invalid row (empty nombre)
            [
                empty_name,
                valid_product["categoria"],
                valid_product["subcategoria"],
                valid_product["precio"],
                valid_product["stock"],
                valid_product["marca"],
                valid_product["descripcion"],
            ],
        ]

        xlsx_bytes = _create_xlsx_bytes(headers, rows)
        validations = parse_xlsx_file(xlsx_bytes)

        assert len(validations) == 2

        valid_rows = [v for v in validations if v.valid]
        invalid_rows = [v for v in validations if not v.valid]

        assert len(valid_rows) == 1
        assert len(invalid_rows) == 1
        assert valid_rows[0].data is not None
        assert valid_rows[0].data.nombre == valid_product["nombre"]
        assert invalid_rows[0].data is None
