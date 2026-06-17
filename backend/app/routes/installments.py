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
    
    Parámetros:
    - amount: Monto total en ARS (obligatorio)
    - bin_number: Primeros 6 dígitos de la tarjeta (opcional, formato: 6 dígitos)
    
    Ejemplo:
    GET /api/installments/calculate?amount=10000&bin_number=453036
    """
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
