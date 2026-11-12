"""Consulta de cuotas a Mercado Pago sin crear pagos ni preferencias."""
from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import get_config
from app.exceptions import MercadoPagoError

logger = logging.getLogger(__name__)


class InstallmentsService:
    """Obtiene las cuotas reales disponibles para la tarjeta informada.

    Mercado Pago determina las cuotas a partir del BIN (los primeros dígitos de
    la tarjeta), el emisor y el monto. Esta consulta es de sólo lectura: no crea
    una preferencia, orden ni intento de cobro.
    """

    def __init__(self) -> None:
        self.access_token = get_config().mercadopago_access_token
        self.base_url = "https://api.mercadopago.com"

    @staticmethod
    def get_development_installments(amount: float) -> list[dict[str, Any]]:
        """Datos de muestra exclusivos para desarrollo local.

        Nunca se usan como respaldo en producción: allí un error de Mercado
        Pago se informa al cliente para no mostrar condiciones falsas.
        """
        return [
            {
                "payment_method_id": "visa",
                "payment_type_id": "credit_card",
                "name": "Visa (simulado)",
                "secure_thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/visa.gif",
                "thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/visa.gif",
                "payer_costs": [
                    {"installments": 1, "installment_amount": round(amount, 2), "total_amount": round(amount, 2), "interest_rate": 0, "labels": ["SIMULADO"]},
                    {"installments": 3, "installment_amount": round(amount / 3, 2), "total_amount": round(amount, 2), "interest_rate": 0, "labels": ["SIMULADO", "CFT_0%"]},
                    {"installments": 6, "installment_amount": round(amount / 6, 2), "total_amount": round(amount, 2), "interest_rate": 0, "labels": ["SIMULADO", "CFT_0%"]},
                ],
            },
            {
                "payment_method_id": "master",
                "payment_type_id": "credit_card",
                "name": "Mastercard (simulado)",
                "secure_thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/master.gif",
                "thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/master.gif",
                "payer_costs": [
                    {"installments": 1, "installment_amount": round(amount, 2), "total_amount": round(amount, 2), "interest_rate": 0, "labels": ["SIMULADO"]},
                    {"installments": 3, "installment_amount": round(amount * 1.05 / 3, 2), "total_amount": round(amount * 1.05, 2), "interest_rate": 0.05, "labels": ["SIMULADO"]},
                ],
            },
        ]

    async def get_installments(self, amount: float, bin_number: str) -> list[dict[str, Any]]:
        if not bin_number or not bin_number.isdigit() or not 6 <= len(bin_number) <= 8:
            raise ValueError("Ingresá entre 6 y 8 dígitos iniciales de la tarjeta para consultar las cuotas.")

        headers = {"Authorization": f"Bearer {self.access_token}", "Accept": "application/json"}
        params = {"amount": f"{amount:.2f}", "bin": bin_number}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                installments_response = await client.get(
                    f"{self.base_url}/v1/payment_methods/installments",
                    params=params,
                    headers=headers,
                )
                installments_response.raise_for_status()
                methods_response = await client.get(
                    f"{self.base_url}/v1/payment_methods", headers=headers
                )
                methods_response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text[:500]
            logger.warning("Mercado Pago rechazó la consulta de cuotas: %s", detail)
            raise MercadoPagoError("Mercado Pago no pudo informar cuotas para esa tarjeta.") from exc
        except httpx.HTTPError as exc:
            logger.exception("No se pudo conectar con Mercado Pago para consultar cuotas")
            raise MercadoPagoError("No se pudo consultar Mercado Pago. Intentá nuevamente.") from exc

        raw_installments = installments_response.json()
        if isinstance(raw_installments, dict):
            raw_installments = raw_installments.get("payment_methods", [])
        if not isinstance(raw_installments, list):
            raise MercadoPagoError("Respuesta inválida de Mercado Pago al consultar cuotas.")

        catalog = methods_response.json()
        metadata_by_id = {
            method.get("id"): method
            for method in catalog
            if isinstance(method, dict) and method.get("id")
        } if isinstance(catalog, list) else {}

        return [self._format_method(method, metadata_by_id) for method in raw_installments if isinstance(method, dict)]

    async def get_all_installments(self, amount: float) -> list[dict[str, Any]]:
        """Obtiene todas las opciones de pago sin especificar BIN.
        
        Devuelve los medios de pago más comunes con opciones limitadas y deduplica resultados.
        """
        headers = {"Authorization": f"Bearer {self.access_token}", "Accept": "application/json"}
        
        # BINs representativos para cada tarjeta (una sola vez)
        bin_samples = {
            "visa": "411111",           # Visa
            "master": "555555",         # Mastercard  
            "amex": "378282",           # American Express
            "naranja": "589657",        # Naranja
            "shopping": "603799",       # Shopping
        }
        
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                # Hacer todas las requests en paralelo (mucho más rápido)
                tasks = []
                for payment_id, bin_number in bin_samples.items():
                    params = {"amount": f"{amount:.2f}", "bin": bin_number}
                    task = client.get(
                        f"{self.base_url}/v1/payment_methods/installments",
                        params=params,
                        headers=headers
                    )
                    tasks.append((payment_id, task))
                
                # Recopilar todas las respuestas
                all_methods = []
                seen_ids = set()  # Para deduplicar
                
                for payment_id, response_task in tasks:
                    try:
                        inst_response = await response_task
                        
                        if inst_response.status_code == 200:
                            raw_installments = inst_response.json()
                            if isinstance(raw_installments, dict):
                                raw_installments = raw_installments.get("payment_methods", [])
                            
                            if isinstance(raw_installments, list) and raw_installments:
                                method = raw_installments[0]  # Tomar el primero
                                if isinstance(method, dict):
                                    method_id = str(method.get("payment_method_id", payment_id))
                                    
                                    # Deduplicar: si ya vimos este método, saltarlo
                                    if method_id in seen_ids:
                                        continue
                                    seen_ids.add(method_id)
                                    
                                    # Formatear y limitar cuotas
                                    formatted = self._format_method(method, {})
                                    formatted["payer_costs"] = self._limit_installments(formatted.get("payer_costs", []))
                                    
                                    if formatted.get("payer_costs"):
                                        all_methods.append(formatted)
                    except Exception as exc:
                        logger.warning(f"Error obteniendo cuotas para {payment_id}: {exc}")
                        continue
                
                return all_methods if all_methods else self.get_development_installments(amount)
                
        except httpx.HTTPError as exc:
            logger.exception("No se pudo conectar con Mercado Pago")
            raise MercadoPagoError("No se pudo consultar Mercado Pago. Intentá nuevamente.") from exc

    @staticmethod
    def _limit_installments(payer_costs: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Limita cuotas a las más relevantes: 1, 3, 6, 12 cuotas.
        
        Toma las opciones sin interés primero, luego con interés si es necesario.
        """
        relevant_installments = [1, 3, 6, 12]
        result = []
        
        # Primero, opciones sin interés
        for target in relevant_installments:
            for cost in payer_costs:
                if cost.get("installments") == target and cost.get("interest_rate", 0) == 0:
                    result.append(cost)
                    break
        
        # Luego, opciones con interés si falta alguna
        for target in relevant_installments:
            if not any(c.get("installments") == target for c in result):
                for cost in payer_costs:
                    if cost.get("installments") == target:
                        result.append(cost)
                        break
        
        return result[:4]  # Máximo 4 opciones de cuotas

    @staticmethod
    def _format_method(method: dict[str, Any], metadata_by_id: dict[str, dict[str, Any]]) -> dict[str, Any]:
        method_id = str(method.get("payment_method_id") or method.get("id") or "")
        metadata = metadata_by_id.get(method_id, {})
        payer_costs = []
        for cost in method.get("payer_costs", []):
            if not isinstance(cost, dict):
                continue
            installments = int(cost.get("installments", 0))
            installment_amount = float(cost.get("installment_amount", 0))
            if installments < 1 or installment_amount <= 0:
                continue
            # Mercado Pago expresa installment_rate como porcentaje (ej. 12.5).
            rate_percent = float(cost.get("installment_rate") or 0)
            payer_costs.append({
                "installments": installments,
                "installment_amount": installment_amount,
                "total_amount": float(cost.get("total_amount") or installment_amount * installments),
                "interest_rate": rate_percent / 100,
                "labels": cost.get("labels") or [],
            })

        return {
            "payment_method_id": method_id,
            "payment_type_id": method.get("payment_type_id") or metadata.get("payment_type_id", "credit_card"),
            "name": metadata.get("name") or method.get("name") or method_id,
            "secure_thumbnail": metadata.get("secure_thumbnail") or metadata.get("thumbnail") or "",
            "thumbnail": metadata.get("thumbnail") or "",
            "payer_costs": payer_costs,
        }
