"""Integración Mercado Pago (Checkout Pro)."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, List, Optional

from mercadopago import SDK

from app.config import get_config
from app.exceptions import MercadoPagoError
from app.models.schemas import Order, PaymentInfo, PreferenceResponse

logger = logging.getLogger(__name__)


def _preference_line_items(
    items: List[dict[str, Any]],
) -> List[dict[str, Any]]:
    """Normaliza ítems para la API de preferencias (currency_id ARS)."""
    out: List[dict[str, Any]] = []
    for it in items:
        out.append(
            {
                "title": str(it["title"])[:256],
                "quantity": int(it["quantity"]),
                "unit_price": float(it["unit_price"]),
                "currency_id": "ARS",
            }
        )
    return out


class PaymentService:
    def __init__(self, access_token: Optional[str] = None) -> None:
        cfg = get_config()
        token = access_token or cfg.mercadopago_access_token
        self._sdk = SDK(token)
        self._cfg = cfg

    async def create_preference(
        self,
        order: Order,
        line_items: List[dict[str, Any]],
    ) -> PreferenceResponse:
        """Crea preferencia Checkout Pro. `line_items`: title, quantity, unit_price."""

        def _call() -> PreferenceResponse:
            # Construcción de preferencia con back_urls
            pref: dict[str, Any] = {
                "items": _preference_line_items(line_items),
                "external_reference": str(order.id),
            }
            
            payer_email = order.customerEmail
            if payer_email:
                pref["payer"] = {"email": payer_email}

            # Configurar URLs de retorno
            # Usar frontend_url (Hostinger) para las back_urls, no el backend (Railway)
            frontend_urls = self._cfg.frontend_url.split(',')
            # Preferir el dominio de producción (no localhost, no railway)
            app_base_url = None
            for url in frontend_urls:
                url = url.strip()
                if "localhost" in url:
                    continue  # Skip localhost
                if "railway" in url:
                    continue  # Skip railway (es el backend)
                if url.startswith("https://"):  # Preferir https
                    app_base_url = url
                    break
            
            # Si no encontré https en producción, usar cualquiera que no sea localhost
            if not app_base_url:
                for url in frontend_urls:
                    url = url.strip()
                    if "localhost" not in url and "railway" not in url:
                        app_base_url = url
                        break
            
            # Fallback (shouldn't happen)
            if not app_base_url:
                app_base_url = frontend_urls[0].strip()
            
            app_base_url = app_base_url.rstrip("/")
            
            success_url = f"{app_base_url}/checkout/success?order_id={str(order.id)}&preference_id={{PREFERENCE_ID}}&payment_id={{PAYMENT_ID}}"
            failure_url = f"{app_base_url}/checkout/failure?preference_id={{PREFERENCE_ID}}"
            pending_url = f"{app_base_url}/checkout/pending?preference_id={{PREFERENCE_ID}}"
            
            pref["back_urls"] = {
                "success": success_url,
                "failure": failure_url,
                "pending": pending_url,
            }
            
            # Auto-redirigir después de pago aprobado
            pref["auto_return"] = "approved"

            logger.info(f"Creando preferencia MP con back_urls - app_base_url={app_base_url}")
            logger.info(f"URLs: success={success_url}")
            
            result = self._sdk.preference().create(pref)
            status = result.get("status")
            
            logger.info(f"Respuesta de MP: status={status}, response={result.get('response')}")
            
            if status not in (200, 201):
                err = result.get("response", result)
                logger.error("Mercado Pago preference error: %s", err)
                raise MercadoPagoError(f"Preferencia rechazada (HTTP {status}). Detalles: {err}")

            body = result.get("response") or {}
            pid = body.get("id")
            init = body.get("init_point") or body.get("sandbox_init_point") or ""
            if not pid:
                raise MercadoPagoError("Respuesta de Mercado Pago sin id de preferencia.")
            return PreferenceResponse(preference_id=str(pid), init_point=str(init))

        return await asyncio.to_thread(_call)

    async def get_payment_info(self, payment_id: str) -> PaymentInfo:
        """Consulta estado de un pago por id."""

        def _call() -> PaymentInfo:
            result = self._sdk.payment().get(payment_id)
            status = result.get("status")
            if status not in (200, 201):
                err = result.get("response", result)
                logger.error("Mercado Pago payment get error: %s", err)
                raise MercadoPagoError(f"Pago no encontrado o error (HTTP {status})")

            body = result.get("response") or {}
            if not isinstance(body, dict):
                raise MercadoPagoError("Respuesta de pago inválida.")

            pid = str(body.get("id", payment_id))
            st = str(body.get("status", ""))

            preference_id = ""
            meta = body.get("metadata")
            if isinstance(meta, dict):
                preference_id = str(meta.get("preference_id") or "")
            if not preference_id:
                preference_id = str(body.get("preference_id") or "")
            if not preference_id:
                # Algunos flujos exponen la preferencia en otras claves
                op = body.get("order")
                if isinstance(op, dict) and op.get("id"):
                    preference_id = str(op["id"])

            ext = body.get("external_reference")
            ext_str = str(ext) if ext is not None and ext != "" else None

            return PaymentInfo(
                payment_id=pid,
                status=st,
                preference_id=preference_id,
                external_reference=ext_str,
            )

        return await asyncio.to_thread(_call)
