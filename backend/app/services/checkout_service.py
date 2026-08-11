"""Servicio para crear preferencias de pago en Mercado Pago."""
from __future__ import annotations

import logging
from typing import Any, Optional

import mercadopago
from mercadopago.client.preference import PreferenceClient

from app.config import get_config
from app.exceptions import MercadoPagoError

logger = logging.getLogger(__name__)


class CheckoutService:
    """Servicio para crear preferencias de pago con Mercado Pago SDK."""

    def __init__(self, access_token: Optional[str] = None) -> None:
        cfg = get_config()
        self.access_token = access_token or cfg.mercadopago_access_token
        
        # Inicializar SDK de Mercado Pago
        self.sdk = mercadopago.SDK(self.access_token)

    def create_preference(
        self,
        items: list[dict[str, Any]],
        payer_email: str,
        payer_name: Optional[str] = None,
        payer_phone: Optional[str] = None,
        external_reference: Optional[str] = None,
        back_urls: Optional[dict[str, str]] = None,
        auto_return: str = "approved",
        installments: int = 1,
    ) -> dict[str, Any]:
        """
        Crea una preferencia de pago en Mercado Pago.
        
        Args:
            items: Lista de items con estructura:
                {
                    "title": "Nombre del producto",
                    "quantity": 1,
                    "unit_price": 100.00,
                    "currency_id": "ARS",
                }
            payer_email: Email del comprador
            payer_name: Nombre del comprador (opcional)
            payer_phone: Teléfono del comprador (opcional)
            external_reference: Referencia externa (ID de orden)
            back_urls: URLs de retorno {"success": "...", "failure": "...", "pending": "..."}
            auto_return: Auto-retorno después de pago ("approved", "all", "none")
            installments: Número de cuotas por defecto
        
        Returns:
            Dict con:
                - preference_id: ID de la preferencia
                - init_point: URL para redireccionar a MP
                - sandbox_init_point: URL de sandbox
        """
        
        try:
            # Construir datos de la preferencia
            preference_data = {
                "items": items,
                "payer": {
                    "email": payer_email,
                },
                "auto_return": auto_return,
                "back_urls": back_urls or {
                    "success": "https://santyhogar.com.ar",
                    "failure": "https://santyhogar.com.ar",
                    "pending": "https://santyhogar.com.ar",
                },
                "external_reference": external_reference,
                "expires": False,
            }
            
            # Agregar nombre si viene
            if payer_name:
                preference_data["payer"]["name"] = payer_name
            
            # Agregar teléfono si viene
            if payer_phone:
                preference_data["payer"]["phone"] = {
                    "area_code": "54",  # Argentina
                    "number": payer_phone,
                }
            
            # Agregar cuotas si es > 1
            if installments > 1:
                preference_data["payment_methods"] = {
                    "installments": installments,
                }
            
            logger.info(f"Creando preferencia MP con datos: {preference_data}")
            
            # Usar el cliente de preferencias del SDK
            preference_client = PreferenceClient(self.sdk)
            preference_response = preference_client.create(preference_data)
            
            logger.info(f"Preferencia creada exitosamente: {preference_response}")
            
            return {
                "preference_id": preference_response["id"],
                "init_point": preference_response["init_point"],
                "sandbox_init_point": preference_response["sandbox_init_point"],
                "external_reference": preference_response.get("external_reference"),
            }
        
        except Exception as e:
            logger.error(f"Error al crear preferencia MP: {str(e)}")
            raise MercadoPagoError(
                f"Error al crear preferencia de pago: {str(e)}"
            )

    def get_preference(self, preference_id: str) -> dict[str, Any]:
        """
        Obtiene los detalles de una preferencia de pago.
        
        Args:
            preference_id: ID de la preferencia
        
        Returns:
            Datos de la preferencia
        """
        try:
            preference_client = PreferenceClient(self.sdk)
            preference = preference_client.get(preference_id)
            return preference
        except Exception as e:
            logger.error(f"Error al obtener preferencia {preference_id}: {str(e)}")
            raise MercadoPagoError(
                f"Error al obtener preferencia: {str(e)}"
            )
