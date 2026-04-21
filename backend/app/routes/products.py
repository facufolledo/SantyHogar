"""Rutas de productos."""
from typing import Annotated, List

from fastapi import APIRouter, Depends, status

from app.deps import get_product_service
from app.mappers import product_to_response
from app.models.schemas import ProductResponse
from app.services.product_service import ProductService

router = APIRouter(tags=["products"])


@router.get(
    "/products",
    response_model=List[ProductResponse],
    status_code=status.HTTP_200_OK,
)
async def list_products(
    product_service: Annotated[ProductService, Depends(get_product_service)],
) -> List[ProductResponse]:
    products = await product_service.get_all_products()
    return [product_to_response(p) for p in products]
