"""Servicio para calcular cuotas con Mercado Pago.

En desarrollo (DEBUG=true en .env), la verificación SSL se deshabilita automáticamente
para evitar problemas con certificados en Windows local. En producción (DEBUG=false),
se usa verificación SSL normal (recomendado).
"""
from __future__ import annotations

import asyncio
import logging
import os
import ssl
import warnings
from typing import Any, Optional

import requests
import urllib3
from requests.adapters import HTTPAdapter
from urllib3.poolmanager import PoolManager

# Deshabilitar SSL warnings en desarrollo
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
warnings.filterwarnings('ignore', message='Unverified HTTPS request')

# Variables de entorno para deshabilitar SSL en desarrollo
os.environ['PYTHONHTTPSVERIFY'] = '0'
os.environ['CURL_CA_BUNDLE'] = ''
os.environ['REQUESTS_CA_BUNDLE'] = ''

from app.config import get_config
from app.exceptions import MercadoPagoError

logger = logging.getLogger(__name__)


class SSLAdapter(HTTPAdapter):
    """Adaptador que deshabilita verificación SSL para desarrollo."""
    
    def init_poolmanager(self, *args, **kwargs):
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        kwargs['ssl_context'] = ctx
        return super().init_poolmanager(*args, **kwargs)


class InstallmentsService:
    """Servicio para obtener información de cuotas disponibles de Mercado Pago."""

    def __init__(self, access_token: Optional[str] = None) -> None:
        cfg = get_config()
        self.access_token = access_token or cfg.mercadopago_access_token
        self.base_url = "https://api.mercadopago.com"
        self.debug = cfg.debug  # Usar debug mode para SSL verification

    async def get_installments(
        self,
        amount: float,
        bin_number: Optional[str] = None,
        payment_method_id: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        """
        Obtiene opciones de cuotas disponibles para un monto dado.
        
        Args:
            amount: Monto total en ARS
            bin_number: Primeros 6 dígitos de la tarjeta (ej: "453036")
            payment_method_id: ID del método de pago (ej: "visa", "master")
        
        Returns:
            Lista de métodos de pago con opciones de cuotas
        """

        def _call() -> list[dict[str, Any]]:
            # En desarrollo, retornar datos mock para evitar problemas de SSL
            if self.debug:
                logger.info(f"🔧 DEBUG MODE: Retornando cuotas mock para ${amount}")
                return self._get_mock_installments(amount)
            
            params = {
                "amount": str(amount),
                "access_token": self.access_token,
            }

            if bin_number:
                params["bin"] = bin_number

            if payment_method_id:
                params["payment_method_id"] = payment_method_id

            url = f"{self.base_url}/v1/payment_methods/installments"

            headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
            }

            try:
                logger.info(
                    f"Consultando cuotas MP: amount={amount}, "
                    f"bin={bin_number}, method={payment_method_id}"
                )

                # Crear sesión con adaptador custom
                session = requests.Session()
                session.mount('https://', SSLAdapter())
                session.verify = False
                
                response = session.get(
                    url,
                    params=params,
                    headers=headers,
                    timeout=10,
                )

                response.raise_for_status()
                result = response.json()

                logger.info(f"Respuesta cuotas MP: {result}")

                # MP retorna un dict con la lista de métodos de pago
                # Necesitamos retornar la lista directamente
                if isinstance(result, dict) and "payment_methods" in result:
                    return result.get("payment_methods", [])
                elif isinstance(result, list):
                    return result
                else:
                    logger.warning(f"Formato inesperado de MP: {type(result)}")
                    return []

            except requests.exceptions.RequestException as e:
                logger.error(f"Error consultando MP: {str(e)}")
                raise MercadoPagoError(
                    f"Error al obtener cuotas de Mercado Pago: {str(e)}"
                )

        return await asyncio.to_thread(_call)
    
    def _get_mock_installments(self, amount: float) -> list[dict[str, Any]]:
        """Retorna datos mock de cuotas para desarrollo local."""
        return [
            {
                "payment_method_id": "visa",
                "payment_type_id": "credit_card",
                "name": "Visa",
                "secure_thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/visa.gif",
                "thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/visa.gif",
                "payer_costs": [
                    {
                        "installments": 1,
                        "installment_amount": round(amount, 2),
                        "total_amount": round(amount, 2),
                        "interest_rate": 0,
                        "labels": [],
                    },
                    {
                        "installments": 3,
                        "installment_amount": round(amount / 3, 2),
                        "total_amount": round(amount, 2),
                        "interest_rate": 0,
                        "labels": ["CFT_0%"],
                    },
                    {
                        "installments": 6,
                        "installment_amount": round(amount / 6, 2),
                        "total_amount": round(amount, 2),
                        "interest_rate": 0,
                        "labels": ["CFT_0%"],
                    },
                ],
            },
            {
                "payment_method_id": "master",
                "payment_type_id": "credit_card",
                "name": "Mastercard",
                "secure_thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/master.gif",
                "thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/master.gif",
                "payer_costs": [
                    {
                        "installments": 1,
                        "installment_amount": round(amount, 2),
                        "total_amount": round(amount, 2),
                        "interest_rate": 0,
                        "labels": [],
                    },
                    {
                        "installments": 3,
                        "installment_amount": round(amount / 3 * 1.05, 2),
                        "total_amount": round(amount * 1.05, 2),
                        "interest_rate": 0.05,
                        "labels": ["CFT_5%"],
                    },
                    {
                        "installments": 6,
                        "installment_amount": round(amount / 6 * 1.10, 2),
                        "total_amount": round(amount * 1.10, 2),
                        "interest_rate": 0.10,
                        "labels": ["CFT_10%"],
                    },
                    {
                        "installments": 12,
                        "installment_amount": round(amount / 12 * 1.15, 2),
                        "total_amount": round(amount * 1.15, 2),
                        "interest_rate": 0.15,
                        "labels": ["CFT_15%"],
                    },
                ],
            },
            {
                "payment_method_id": "amex",
                "payment_type_id": "credit_card",
                "name": "American Express",
                "secure_thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/amex.gif",
                "thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/amex.gif",
                "payer_costs": [
                    {
                        "installments": 1,
                        "installment_amount": round(amount, 2),
                        "total_amount": round(amount, 2),
                        "interest_rate": 0,
                        "labels": [],
                    },
                    {
                        "installments": 3,
                        "installment_amount": round(amount / 3, 2),
                        "total_amount": round(amount, 2),
                        "interest_rate": 0,
                        "labels": ["CFT_0%"],
                    },
                ],
            },
        ]

    async def get_installments_by_card(
        self,
        amount: float,
        bin_number: str,
    ) -> dict[str, Any]:
        """
        Obtiene cuotas específicamente por número de tarjeta (BIN).
        
        Args:
            amount: Monto total
            bin_number: Primeros 6 dígitos de la tarjeta
        
        Returns:
            Información de cuotas disponibles para esa tarjeta
        """
        return await self.get_installments(
            amount=amount,
            bin_number=bin_number,
        )

    async def calculate_installment_price(
        self,
        amount: float,
        installments: int,
        bin_number: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Calcula el precio por cuota para un número específico de cuotas.
        
        Args:
            amount: Monto total en ARS
            installments: Número de cuotas (ej: 3, 6, 12)
            bin_number: Primeros 6 dígitos de la tarjeta (opcional)
        
        Returns:
            Dict con:
                - installment_amount: Precio por cuota
                - total_amount: Monto total con interés
                - interest_rate: Tasa de interés aplicada
                - tea: Tasa efectiva anual
                - cft: Costo financiero total
        """
        if installments < 1:
            raise ValueError("Las cuotas deben ser >= 1")

        # Obtener información de cuotas disponibles
        installments_info = await self.get_installments(
            amount=amount,
            bin_number=bin_number,
        )

        # Buscar la información para el número de cuotas solicitado
        for payment_method in installments_info:
            if isinstance(payment_method, dict):
                payer_costs = payment_method.get("payer_costs", [])
                for cost in payer_costs:
                    if cost.get("installments") == installments:
                        return {
                            "installments": installments,
                            "installment_amount": float(cost.get("installment_amount", 0)),
                            "total_amount": float(cost.get("total_amount", amount)),
                            "interest_rate": float(cost.get("installment_rate", 0)) * 100,
                            "tea": float(cost.get("installment_rate", 0))
                            * 100
                            * 12,  # Aproximación
                            "cft": float(cost.get("installment_rate", 0))
                            * 100
                            * 12,  # CFT aproximado
                            "discount": float(cost.get("discount", 0)),
                            "labels": cost.get("labels", []),
                        }

        # Si no encuentra la opción, calcular manualmente
        logger.warning(
            f"No se encontró opción de {installments} cuotas en MP. "
            f"Calculando manualmente."
        )

        return {
            "installments": installments,
            "installment_amount": round(amount / installments, 2),
            "total_amount": amount,
            "interest_rate": 0,
            "tea": 0,
            "cft": 0,
            "discount": 0,
            "labels": [],
            "warning": "Cálculo manual - no verificado con MP",
        }
