"""Rutas para obtener información de cuotas con Mercado Pago."""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.services.installments_service import InstallmentsService
from app.exceptions import MercadoPagoError

router = APIRouter(prefix="/api/installments", tags=["installments"])
logger = logging.getLogger(__name__)


@router.get("/calculate")
async def calculate_installments(
    amount: float = Query(..., gt=0, description="Monto total en ARS"),
    bin_number: Optional[str] = Query(
        None, regex="^[0-9]{6}$", description="Primeros 6 dígitos de la tarjeta"
    ),
):
    """
    Calcula opciones de cuotas disponibles para un monto.
    
    En DEBUG mode retorna datos mock sin llamar a MP.
    """
    from app.config import get_config
    cfg = get_config()
    
    # En desarrollo, retornar datos MOCK
    if cfg.debug:
        logger.info(f"🔧 DEBUG: Retornando cuotas mock para ${amount}")
        return [
            {
                "payment_method_id": "visa",
                "payment_type_id": "credit_card",
                "name": "Visa",
                "secure_thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/visa.gif",
                "thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/visa.gif",
                "payer_costs": [
                    {"installments": 1, "installment_amount": round(amount, 2), "total_amount": round(amount, 2), "interest_rate": 0, "labels": []},
                    {"installments": 3, "installment_amount": round(amount / 3, 2), "total_amount": round(amount, 2), "interest_rate": 0, "labels": ["CFT_0%"]},
                    {"installments": 6, "installment_amount": round(amount / 6, 2), "total_amount": round(amount, 2), "interest_rate": 0, "labels": ["CFT_0%"]},
                    {"installments": 12, "installment_amount": round(amount / 12, 2), "total_amount": round(amount, 2), "interest_rate": 0, "labels": ["CFT_0%"]},
                ],
            },
            {
                "payment_method_id": "master",
                "payment_type_id": "credit_card",
                "name": "Mastercard",
                "secure_thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/master.gif",
                "thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/master.gif",
                "payer_costs": [
                    {"installments": 1, "installment_amount": round(amount, 2), "total_amount": round(amount, 2), "interest_rate": 0, "labels": []},
                    {"installments": 3, "installment_amount": round(amount / 3 * 1.05, 2), "total_amount": round(amount * 1.05, 2), "interest_rate": 0.05, "labels": ["CFT_5%"]},
                    {"installments": 6, "installment_amount": round(amount / 6 * 1.10, 2), "total_amount": round(amount * 1.10, 2), "interest_rate": 0.10, "labels": ["CFT_10%"]},
                    {"installments": 12, "installment_amount": round(amount / 12 * 1.20, 2), "total_amount": round(amount * 1.20, 2), "interest_rate": 0.20, "labels": ["CFT_20%"]},
                ],
            },
            {
                "payment_method_id": "amex",
                "payment_type_id": "credit_card",
                "name": "American Express",
                "secure_thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/amex.gif",
                "thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/amex.gif",
                "payer_costs": [
                    {"installments": 1, "installment_amount": round(amount, 2), "total_amount": round(amount, 2), "interest_rate": 0, "labels": []},
                    {"installments": 3, "installment_amount": round(amount / 3, 2), "total_amount": round(amount, 2), "interest_rate": 0, "labels": ["CFT_0%"]},
                ],
            },
        ]
    
    try:
        service = InstallmentsService()
        result = await service.get_installments(
            amount=amount,
            bin_number=bin_number,
        )

        # Formatear la respuesta para el frontend
        formatted = []
        for payment_method in result:
            if isinstance(payment_method, dict):
                payer_costs = payment_method.get("payer_costs", [])
                for cost in payer_costs:
                    formatted.append(
                        {
                            "installments": cost.get("installments"),
                            "installment_amount": float(
                                cost.get("installment_amount", 0)
                            ),
                            "total_amount": float(cost.get("total_amount", amount)),
                            "interest_rate": round(
                                float(cost.get("installment_rate", 0)) * 100, 2
                            ),
                            "discount": float(cost.get("discount", 0)),
                            "labels": cost.get("labels", []),
                        }
                    )

        return {
            "amount": amount,
            "bin_number": bin_number,
            "options": formatted,
            "total_options": len(formatted),
        }

    except MercadoPagoError as e:
        logger.error(f"Error MP en cuotas: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error calculando cuotas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/installment-price")
async def get_installment_price(
    amount: float = Query(..., gt=0, description="Monto total en ARS"),
    installments: int = Query(
        ..., gt=0, le=12, description="Número de cuotas (1-12)"
    ),
    bin_number: Optional[str] = Query(
        None, regex="^[0-9]{6}$", description="Primeros 6 dígitos de la tarjeta"
    ),
):
    """
    Obtiene el precio por cuota para un número específico de cuotas.
    
    Parámetros:
    - amount: Monto total en ARS (obligatorio)
    - installments: Número de cuotas, 1-12 (obligatorio)
    - bin_number: Primeros 6 dígitos de la tarjeta (opcional)
    
    Ejemplo:
    GET /api/installments/installment-price?amount=10000&installments=6&bin_number=453036
    """
    try:
        service = InstallmentsService()
        result = await service.calculate_installment_price(
            amount=amount,
            installments=installments,
            bin_number=bin_number,
        )

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except MercadoPagoError as e:
        logger.error(f"Error MP calculando precio: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error inesperado: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
