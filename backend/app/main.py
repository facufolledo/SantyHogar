"""Aplicación FastAPI: CORS, rutas, logging y manejo de errores."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_config
from app.exceptions import (
    DatabaseError,
    InsufficientStockError,
    MercadoPagoError,
    ProductNotFoundError,
)
from app.routes import orders, products, webhook

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
    yield
    logger.info("Cierre de aplicación")


def create_app() -> FastAPI:
    cfg = get_config()
    app = FastAPI(
        title="Santy Hogar API",
        description="Backend e-commerce: productos, órdenes y Mercado Pago.",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[cfg.frontend_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(products.router)
    app.include_router(orders.router)
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

    return app


app = create_app()
