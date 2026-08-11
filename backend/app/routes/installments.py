"""Rutas de consulta de cuotas de Mercado Pago."""
import logging

from fastapi import APIRouter, HTTPException, Query

from app.exceptions import MercadoPagoError
from app.config import get_config
from app.services.installments_service import InstallmentsService

router = APIRouter(prefix="/api/installments", tags=["installments"])
logger = logging.getLogger(__name__)


@router.get("/calculate")
async def calculate_installments(
    amount: float = Query(..., gt=0, description="Monto total en ARS"),
    bin_number: str = Query(..., description="Primeros 6-8 dígitos de la tarjeta"),
):
    """Devuelve cuotas reales para monto y BIN, sin iniciar una compra."""
    
    # Validar BIN localmente
    if not bin_number or not bin_number.isdigit():
        raise HTTPException(status_code=400, detail="BIN debe contener solo dígitos")
    
    if len(bin_number) < 6 or len(bin_number) > 8:
        raise HTTPException(
            status_code=400, 
            detail=f"BIN debe tener 6-8 dígitos, recibió {len(bin_number)}"
        )
    
    if get_config().debug:
        # En local no se llama a MP: se preserva el flujo simulador para desarrollo.
        return InstallmentsService.get_development_installments(amount)

    try:
        return await InstallmentsService().get_installments(amount=amount, bin_number=bin_number)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except MercadoPagoError as exc:
        logger.warning("Error de Mercado Pago al consultar cuotas: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/installment-price")
async def get_installment_price(
    amount: float = Query(..., gt=0),
    installments: int = Query(..., gt=0, le=36),
    bin_number: str = Query(..., min_length=6, max_length=8, pattern="^[0-9]+$"),
):
    """Devuelve una opción de cuota real para el BIN informado."""
    methods = await calculate_installments(amount, bin_number)
    for method in methods:
        for cost in method["payer_costs"]:
            if cost["installments"] == installments:
                return {**cost, "payment_method_id": method["payment_method_id"]}
    raise HTTPException(status_code=404, detail="La tarjeta no ofrece esa cantidad de cuotas.")
