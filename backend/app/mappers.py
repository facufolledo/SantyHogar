"""Mapeo filas SQL (español) ↔ modelos Pydantic."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from app.models.schemas import Order, Product, ProductResponse


def _f(value: Any) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    return float(str(value))


def _parse_dt(value: Any) -> datetime:
    """Parse datetime from DB. Dates are already in Argentina timezone (UTC-3)."""
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        s = value.replace("Z", "+00:00") if value.endswith("Z") else value
        return datetime.fromisoformat(s)
    raise TypeError(f"fecha inválida: {type(value)}")


def row_to_product(row: dict[str, Any]) -> Product:
    """Fila `productos` → Product. Tolera columnas omitidas (tablas mínimas en Supabase)."""
    imgs = row.get("imagenes")
    if not isinstance(imgs, list):
        imgs = []
    specs = row.get("especificaciones")
    if specs is None:
        specs = {}
    elif not isinstance(specs, dict):
        specs = {str(k): str(v) for k, v in dict(specs).items()}
    else:
        specs = {str(k): str(v) for k, v in specs.items()}

    desc = row.get("descripcion")
    if desc is None:
        desc = ""
    po = row.get("precio_original")
    original = _f(po) if po is not None else None

    # Obtener ID de categoría
    id_cat = row.get("id_categoria")
    
    # Extraer slug desde el objeto categorias nested (si existe)
    categoria_slug = None
    categorias_obj = row.get("categorias")
    if categorias_obj:
        if isinstance(categorias_obj, dict):
            categoria_slug = categorias_obj.get("slug")
        elif isinstance(categorias_obj, list) and len(categorias_obj) > 0:
            categoria_slug = categorias_obj[0].get("slug")
    
    # Fallback: usar categoria antigua (string) si existe
    if not categoria_slug:
        categoria_slug = row.get("categoria") or "electrodomesticos"
    
    # Usar categorias_nombre si existe, sino usar el slug
    cat_name = row.get("categoria_nombre") or categoria_slug or "Desconocida"

    sub = row.get("subcategoria") or ""

    stock_raw = row.get("stock", 0)
    stock = int(stock_raw) if stock_raw is not None else 0

    marca = row.get("marca") or ""
    cal_raw = row.get("calificacion", 0)
    rating = _f(cal_raw) if cal_raw is not None else 0.0

    res_raw = row.get("cantidad_resenas", 0)
    reviews = int(res_raw) if res_raw is not None else 0

    fc = row.get("fecha_creacion")
    if fc is None:
        created_at = datetime.now(timezone.utc)
    else:
        created_at = _parse_dt(fc)

    return Product(
        id=UUID(str(row["id_producto"])),
        name=row.get("nombre") or "",
        slug=row.get("slug") or "",
        id_categoria=UUID(str(id_cat)) if id_cat else None,
        categoria_nombre=categoria_slug,  # Usar el slug como categoria_nombre
        subcategory=sub,
        price=_f(row.get("precio", 0)),
        originalPrice=original,
        images=[str(x) for x in imgs],
        description=str(desc),
        specs=specs,
        stock=stock,
        featured=bool(row.get("destacado", False)),
        brand=marca,
        rating=rating,
        reviews=reviews,
        created_at=created_at,
    )


def product_to_response(p: Product) -> ProductResponse:
    """Product → respuesta API (camelCase)."""
    return ProductResponse(
        id=p.id,
        name=p.name,
        slug=p.slug,
        categoryId=p.id_categoria or UUID(int=0),  # Default UUID si es None
        categoryName=p.categoria_nombre or "Desconocida",
        subcategory=p.subcategory,
        price=p.price,
        originalPrice=p.originalPrice,
        images=p.images,
        description=p.description,
        specs=p.specs,
        stock=p.stock,
        featured=p.featured,
        brand=p.brand,
        rating=p.rating,
        reviews=p.reviews,
    )


def row_to_order(row: dict[str, Any]) -> Order:
    """Fila `ordenes` → Order."""
    mp = row["metodo_pago"]
    if mp not in ("mp", "fiserv"):
        mp = "mp"
    
    st = row["estado"]
    # Mapear estados españoles a ingleses
    status_map = {
        "pendiente_pago": "pending",
        "pagada": "paid",
        "cancelada": "cancelled",
        # Aceptar también valores ya en inglés
        "pending": "pending",
        "paid": "paid",
        "cancelled": "cancelled",
    }
    mapped_status = status_map.get(st, "pending")

    uid = row.get("id_usuario")
    return Order(
        id=UUID(str(row["id_orden"])),
        userId=uid if uid else None,
        customerName=row["nombre_cliente"],
        customerEmail=row["email_cliente"],
        customerPhone=row["telefono_cliente"],
        total=_f(row["total"]),
        paymentMethod=mp,  # type: ignore[arg-type]
        status=mapped_status,  # type: ignore[arg-type]
        preference_id=row.get("id_preferencia"),
        payment_id=row.get("payment_id"),
        orderNumber=row["numero_orden"],
        createdAt=_parse_dt(row["fecha_creacion"]),
        updated_at=_parse_dt(row["updated_at"]),
    )
