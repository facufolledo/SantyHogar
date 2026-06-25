"""Aplicación FastAPI: CORS, rutas, logging y manejo de errores."""
from __future__ import annotations

# IMPORTANTE: Importar SSL fix PRIMERO (antes de cualquier import de requests/mercadopago)
import app.ssl_fix  # noqa: F401

import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import FastAPI, Request, Body, Query, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_config
from app.database.connection import get_supabase_client
from app.exceptions import (
    DatabaseError,
    InsufficientStockError,
    MercadoPagoError,
    ProductNotFoundError,
)
from app.routes import (
    admin_users,
    checkout,
    checkout_pro,
    customers,
    installments,
    orders,
    products,
    webhook,
)
from app.mappers import product_to_response
from app.services.pagination_service import PaginationService
from app.services.product_service import ProductService
from app.database.operations import DatabaseOperations

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    cfg = get_config()
    logger.info(
        "Configuración cargada (frontend_url=%s, public_api_url=%s)",
        cfg.frontend_url,
        cfg.public_api_url,
    )
    logger.info(
        "API v%s — precios: POST /catalog/update-price (y /api/catalog/update-price)",
        app.version,
    )
    yield
    logger.info("Cierre de aplicación")


def create_app() -> FastAPI:
    cfg = get_config()
    app = FastAPI(
        title="Santy Hogar API",
        description="Backend e-commerce: productos, órdenes y Mercado Pago.",
        # Subí este número cuando cambien rutas visibles en /docs (así ves si el proceso cargó el código nuevo).
        version="1.0.1",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.frontend_url.split(',') if ',' in cfg.frontend_url else [cfg.frontend_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    def _pagination(items: list, page: int, limit: int) -> dict:
        pager = PaginationService(page=page, limit=limit)
        return pager.paginate(
            total=len(items),
            results=items[pager.offset : pager.offset + pager.limit],
        )

    def _address_to_response(row: dict) -> dict:
        return {
            "id": row["id_direccion"],
            "label": row.get("etiqueta", ""),
            "street": row.get("calle", ""),
            "city": row.get("ciudad", ""),
            "province": row.get("provincia", ""),
            "zip": row.get("codigo_postal", ""),
            "isPrimary": bool(row.get("es_principal", False)),
        }

    def _customer_to_response(row: dict) -> dict:
        return {
            "id": row["id_cliente"],
            "name": row.get("nombre", ""),
            "email": row.get("email", ""),
            "phone": row.get("telefono"),
            "address": row.get("direccion"),
            "city": row.get("ciudad"),
            "province": row.get("provincia"),
            "postalCode": row.get("codigo_postal"),
            "registeredAt": str(row.get("fecha_registro", "")),
            "updatedAt": str(row.get("fecha_actualizacion", row.get("fecha_registro", ""))),
            "totalSpent": float(row.get("total_gastado", 0) or 0),
            "orderCount": int(row.get("cantidad_ordenes", 0) or 0),
            "notes": row.get("notas"),
            "active": bool(row.get("activo", True)),
        }

    async def _product_service() -> ProductService:
        return ProductService(DatabaseOperations())

    @app.get("/products/search", tags=["products"])
    @app.get("/api/products/search", tags=["products"])
    async def search_products(
        q: str = Query(default=""),
        page: int = Query(default=1, ge=1),
        limit: int = Query(default=20, ge=1, le=100),
    ) -> dict:
        term = q.strip().lower()
        if not term:
            return {**_pagination([], page, limit), "query": q}

        products_data = await (await _product_service()).get_all_products()
        results = [
            product_to_response(product).model_dump(mode="json")
            for product in products_data
            if term in product.name.lower()
            or term in product.description.lower()
            or term in product.category.lower()
            or term in product.subcategory.lower()
            or term in product.brand.lower()
        ]
        return {**_pagination(results, page, limit), "query": q}

    @app.get("/products/filter", tags=["products"])
    @app.get("/api/products/filter", tags=["products"])
    async def filter_products(
        category: str | None = Query(default=None),
        price_min: float | None = Query(default=None, ge=0),
        price_max: float | None = Query(default=None, ge=0),
        page: int = Query(default=1, ge=1),
        limit: int = Query(default=20, ge=1, le=100),
    ) -> dict:
        products_data = await (await _product_service()).get_all_products()
        results = []
        for product in products_data:
            if category and product.category != category:
                continue
            if price_min is not None and product.price < price_min:
                continue
            if price_max is not None and product.price > price_max:
                continue
            results.append(product_to_response(product).model_dump(mode="json"))

        filters_applied = {
            key: value
            for key, value in {
                "category": category,
                "price_min": price_min,
                "price_max": price_max,
            }.items()
            if value is not None
        }
        return {**_pagination(results, page, limit), "filters_applied": filters_applied}

    @app.post("/customers", tags=["customers"], status_code=status.HTTP_201_CREATED)
    @app.post("/api/customers", tags=["customers"], status_code=status.HTTP_201_CREATED)
    async def create_customer_compat(body: dict = Body(...)) -> dict:
        supabase = get_supabase_client()
        customer_id = str(body.get("id") or uuid4())
        email = body.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="El email es obligatorio")

        existing = (
            supabase.table("clientes")
            .select("*")
            .eq("email", email)
            .limit(1)
            .execute()
        )
        if existing.data:
            return _customer_to_response(existing.data[0])

        payload = {
            "id_cliente": customer_id,
            "nombre": body.get("name") or body.get("nombre") or "",
            "email": email,
            "telefono": body.get("phone") or body.get("telefono"),
            "direccion": body.get("address") or body.get("direccion"),
            "ciudad": body.get("city") or body.get("ciudad"),
            "provincia": body.get("province") or body.get("provincia"),
            "codigo_postal": body.get("postalCode") or body.get("codigo_postal"),
            "notas": body.get("notes") or body.get("notas"),
            "total_gastado": 0,
            "cantidad_ordenes": 0,
            "activo": True,
        }
        created = supabase.table("clientes").insert(payload).execute()
        if not created.data:
            raise HTTPException(status_code=500, detail="No se pudo crear el cliente")
        return _customer_to_response(created.data[0])

    @app.get("/customers/{customer_id}/favorites", tags=["favorites"])
    @app.get("/api/customers/{customer_id}/favorites", tags=["favorites"])
    async def get_favorites_compat(customer_id: UUID) -> list[dict]:
        supabase = get_supabase_client()
        rows = (
            supabase.table("favoritos")
            .select("id_producto, fecha_creacion")
            .eq("id_cliente", str(customer_id))
            .order("fecha_creacion", desc=True)
            .execute()
        )
        return [
            {
                "productId": row["id_producto"],
                "addedAt": str(row.get("fecha_creacion", "")),
            }
            for row in (rows.data or [])
        ]

    @app.post("/customers/{customer_id}/favorites", tags=["favorites"])
    @app.post("/api/customers/{customer_id}/favorites", tags=["favorites"])
    async def add_favorite_compat(
        customer_id: UUID,
        body: dict = Body(...),
    ) -> dict:
        product_id = body.get("productId") or body.get("product_id")
        if not product_id:
            raise HTTPException(status_code=400, detail="productId es obligatorio")

        supabase = get_supabase_client()
        product = (
            supabase.table("productos")
            .select("id_producto")
            .eq("id_producto", str(product_id))
            .limit(1)
            .execute()
        )
        if not product.data:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

        payload = {"id_cliente": str(customer_id), "id_producto": str(product_id)}
        try:
            row = supabase.table("favoritos").insert(payload).execute()
            created_at = (row.data or [{}])[0].get("fecha_creacion", "")
        except Exception as exc:
            if "duplicate" not in str(exc).lower() and "unique" not in str(exc).lower():
                raise
            existing = (
                supabase.table("favoritos")
                .select("fecha_creacion")
                .eq("id_cliente", str(customer_id))
                .eq("id_producto", str(product_id))
                .limit(1)
                .execute()
            )
            created_at = (existing.data or [{}])[0].get("fecha_creacion", "")

        return {"productId": str(product_id), "addedAt": str(created_at)}

    @app.delete("/customers/{customer_id}/favorites/{product_id}", tags=["favorites"])
    @app.delete("/api/customers/{customer_id}/favorites/{product_id}", tags=["favorites"])
    async def remove_favorite_compat(customer_id: UUID, product_id: UUID) -> dict:
        supabase = get_supabase_client()
        supabase.table("favoritos").delete().eq("id_cliente", str(customer_id)).eq(
            "id_producto", str(product_id)
        ).execute()
        return {"message": "Producto removido de favoritos"}

    @app.get("/customers/{customer_id}/addresses", tags=["addresses"])
    @app.get("/api/customers/{customer_id}/addresses", tags=["addresses"])
    async def get_addresses_compat(customer_id: UUID) -> list[dict]:
        supabase = get_supabase_client()
        rows = (
            supabase.table("direcciones")
            .select("*")
            .eq("id_cliente", str(customer_id))
            .order("fecha_creacion", desc=True)
            .execute()
        )
        return [_address_to_response(row) for row in (rows.data or [])]

    @app.post("/customers/{customer_id}/addresses", tags=["addresses"], status_code=status.HTTP_201_CREATED)
    @app.post("/api/customers/{customer_id}/addresses", tags=["addresses"], status_code=status.HTTP_201_CREATED)
    async def create_address_compat(customer_id: UUID, body: dict = Body(...)) -> dict:
        supabase = get_supabase_client()
        
        # Verificar que el cliente existe, si no crear uno mínimo
        customer_id_str = str(customer_id)
        existing_customer = (
            supabase.table("clientes")
            .select("id_cliente")
            .eq("id_cliente", customer_id_str)
            .limit(1)
            .execute()
        )
        
        if not existing_customer.data:
            # Crear cliente minimal si no existe
            supabase.table("clientes").insert({
                "id_cliente": customer_id_str,
                "nombre": body.get("customer_name", ""),
                "email": body.get("customer_email", ""),
                "telefono": body.get("customer_phone"),
                "total_gastado": 0,
                "cantidad_ordenes": 0,
                "activo": True,
            }).execute()
        
        is_primary = bool(body.get("isPrimary", False))
        if is_primary:
            supabase.table("direcciones").update({"es_principal": False}).eq(
                "id_cliente", customer_id_str
            ).execute()
        payload = {
            "id_direccion": str(uuid4()),
            "id_cliente": customer_id_str,
            "etiqueta": body.get("label", ""),
            "calle": body.get("street", ""),
            "ciudad": body.get("city", ""),
            "provincia": body.get("province", ""),
            "codigo_postal": body.get("zip", ""),
            "es_principal": is_primary,
        }
        created = supabase.table("direcciones").insert(payload).execute()
        if not created.data:
            raise HTTPException(status_code=500, detail="No se pudo crear la direccion")
        return _address_to_response(created.data[0])

    @app.patch("/customers/{customer_id}/addresses/{address_id}", tags=["addresses"])
    @app.patch("/api/customers/{customer_id}/addresses/{address_id}", tags=["addresses"])
    async def update_address_compat(
        customer_id: UUID,
        address_id: UUID,
        body: dict = Body(...),
    ) -> dict:
        supabase = get_supabase_client()
        payload = {}
        mapping = {
            "label": "etiqueta",
            "street": "calle",
            "city": "ciudad",
            "province": "provincia",
            "zip": "codigo_postal",
            "isPrimary": "es_principal",
        }
        for source, target in mapping.items():
            if source in body:
                payload[target] = body[source]
        if payload.get("es_principal") is True:
            supabase.table("direcciones").update({"es_principal": False}).eq(
                "id_cliente", str(customer_id)
            ).execute()
        updated = (
            supabase.table("direcciones")
            .update(payload)
            .eq("id_cliente", str(customer_id))
            .eq("id_direccion", str(address_id))
            .execute()
        )
        if not updated.data:
            raise HTTPException(status_code=404, detail="Direccion no encontrada")
        return _address_to_response(updated.data[0])

    @app.delete("/customers/{customer_id}/addresses/{address_id}", tags=["addresses"])
    @app.delete("/api/customers/{customer_id}/addresses/{address_id}", tags=["addresses"])
    async def delete_address_compat(customer_id: UUID, address_id: UUID) -> dict:
        supabase = get_supabase_client()
        supabase.table("direcciones").delete().eq("id_cliente", str(customer_id)).eq(
            "id_direccion", str(address_id)
        ).execute()
        return {"message": "Direccion eliminada"}

    @app.get("/dashboard/stats", tags=["dashboard"])
    @app.get("/api/dashboard/stats", tags=["dashboard"])
    async def dashboard_stats_compat() -> dict:
        db = DatabaseOperations()
        orders_data = await db.get_all_orders()
        products_data = await db.get_all_products()
        customers_data = await db.get_all_customers()
        paid = [row for row in orders_data if row.get("estado") == "paid"]
        sales_month = sum(float(row.get("total", 0) or 0) for row in paid)
        pending_count = sum(1 for row in orders_data if row.get("estado") == "pending")
        return {
            "sales_day": sales_month,
            "sales_week": sales_month,
            "sales_month": sales_month,
            "order_count": len(orders_data),
            "order_count_paid": len(paid),
            "order_count_pending": pending_count,
            "avg_ticket": round(sales_month / len(paid), 2) if paid else 0,
            "active_products": sum(1 for row in products_data if int(row.get("stock", 0) or 0) > 0),
            "low_stock_products": sum(1 for row in products_data if 0 < int(row.get("stock", 0) or 0) < 5),
            "new_customers_month": len(customers_data),
        }

    @app.get("/dashboard/sales-chart", tags=["dashboard"])
    @app.get("/api/dashboard/sales-chart", tags=["dashboard"])
    async def dashboard_sales_chart_compat() -> list[dict]:
        cordoba_tz = timezone(timedelta(hours=-3))
        today = datetime.now(cordoba_tz).date()
        return [
            {"date": str(today), "total": (await dashboard_stats_compat())["sales_month"]}
        ]

    @app.get("/dashboard/top-products", tags=["dashboard"])
    @app.get("/api/dashboard/top-products", tags=["dashboard"])
    async def dashboard_top_products_compat() -> list[dict]:
        return []

    @app.get("/dashboard/top-customers", tags=["dashboard"])
    @app.get("/api/dashboard/top-customers", tags=["dashboard"])
    async def dashboard_top_customers_compat() -> list[dict]:
        db = DatabaseOperations()
        rows = await db.get_all_customers()
        sorted_rows = sorted(
            rows,
            key=lambda row: float(row.get("total_gastado", 0) or 0),
            reverse=True,
        )[:5]
        return [
            {
                "name": row.get("nombre", ""),
                "email": row.get("email", ""),
                "total_spent": float(row.get("total_gastado", 0) or 0),
                "order_count": int(row.get("cantidad_ordenes", 0) or 0),
            }
            for row in sorted_rows
        ]

    app.include_router(products.router)
    # Mismo router bajo /api por si el reverse proxy o el front publican la API con prefijo (evita 404 genérico).
    app.include_router(products.router, prefix="/api")
    app.include_router(orders.router)
    app.include_router(customers.router)
    app.include_router(admin_users.router)
    app.include_router(admin_users.router, prefix="/api")
    app.include_router(installments.router)
    # checkout_pro define POST /checkout/create-preference, se registra bajo /api para quedar en /api/checkout/create-preference
    app.include_router(checkout_pro.router, prefix="/api")
    # Deprecated checkout.router solo retorna 410 Gone, registrado bajo /api/deprecated-checkout
    app.include_router(checkout.router, prefix="/api/deprecated-checkout")
    app.include_router(webhook.router)

    @app.get("/health", tags=["health"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.exception_handler(ProductNotFoundError)
    async def product_not_found_handler(
        request: Request, exc: ProductNotFoundError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": exc.message or "Producto no encontrado."},
        )

    @app.exception_handler(InsufficientStockError)
    async def insufficient_stock_handler(
        request: Request, exc: InsufficientStockError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": exc.message or "Stock insuficiente."},
        )

    @app.exception_handler(DatabaseError)
    async def database_error_handler(
        request: Request, exc: DatabaseError
    ) -> JSONResponse:
        logger.exception("Error de base de datos: %s", exc)
        cfg = get_config()
        detail = (
            (exc.message or str(exc)).strip()
            if cfg.debug
            else "Error al acceder a los datos."
        )
        if not detail:
            detail = "Error al acceder a los datos."
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": detail},
        )

    @app.exception_handler(MercadoPagoError)
    async def mercadopago_error_handler(
        request: Request, exc: MercadoPagoError
    ) -> JSONResponse:
        logger.exception("Mercado Pago: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": exc.message or "Error al comunicarse con Mercado Pago.",
            },
        )

    # Servir frontend (SPA) - Solo las APIs, no el frontend
    # El frontend debería estar en Hostinger o un CDN
    
    return app


app = create_app()
