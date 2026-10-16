"""Rutas de clientes."""
from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import get_customer_service
from app.exceptions import DatabaseError
from app.models.schemas import (
    CustomerListResponse,
    CustomerResponse,
    CreateCustomerRequest,
    UpdateCustomerRequest,
)
from app.services.customer_service import CustomerService

router = APIRouter(tags=["customers"])


@router.get(
    "/customers",
    response_model=List[CustomerListResponse],
    status_code=status.HTTP_200_OK,
)
async def list_customers(
    customer_service: Annotated[CustomerService, Depends(get_customer_service)],
) -> List[CustomerListResponse]:
    """Lista todos los clientes."""
    try:
        customers = await customer_service.get_all_customers()
        return customers
    except DatabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e


@router.get(
    "/customers/{customer_id}",
    response_model=CustomerResponse,
    status_code=status.HTTP_200_OK,
)
async def get_customer(
    customer_id: UUID,
    customer_service: Annotated[CustomerService, Depends(get_customer_service)],
) -> CustomerResponse:
    """Obtiene un cliente por ID."""
    try:
        customer = await customer_service.get_customer_by_id(customer_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente no encontrado",
            )
        return customer
    except DatabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e


@router.post(
    "/customers",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_customer(
    customer_data: CreateCustomerRequest,
    customer_service: Annotated[CustomerService, Depends(get_customer_service)],
) -> CustomerResponse:
    """Crea un nuevo cliente."""
    try:
        customer = await customer_service.create_customer(customer_data)
        return customer
    except DatabaseError as e:
        if "ya existe" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            ) from e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e


@router.patch(
    "/customers/{customer_id}",
    response_model=CustomerResponse,
    status_code=status.HTTP_200_OK,
)
async def update_customer(
    customer_id: UUID,
    customer_data: UpdateCustomerRequest,
    customer_service: Annotated[CustomerService, Depends(get_customer_service)],
) -> CustomerResponse:
    """Actualiza un cliente existente."""
    try:
        customer = await customer_service.update_customer(customer_id, customer_data)
        return customer
    except DatabaseError as e:
        if "no encontrado" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            ) from e
        if "ya existe" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            ) from e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e


@router.delete(
    "/customers/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_customer(
    customer_id: UUID,
    customer_service: Annotated[CustomerService, Depends(get_customer_service)],
) -> None:
    """Elimina un cliente (soft delete)."""
    try:
        await customer_service.delete_customer(customer_id)
    except DatabaseError as e:
        if "no encontrado" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            ) from e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e


@router.get(
    "/customers/{customer_id}/orders",
    status_code=status.HTTP_200_OK,
)
async def get_customer_orders(
    customer_id: UUID,
    customer_service: Annotated[CustomerService, Depends(get_customer_service)],
):
    """Obtiene todas las órdenes de un cliente."""
    try:
        orders = await customer_service.get_customer_orders(customer_id)
        return orders
    except DatabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e


@router.post(
    "/customers/{customer_id}/update-stats",
    status_code=status.HTTP_200_OK,
)
async def update_customer_stats(
    customer_id: UUID,
    customer_service: Annotated[CustomerService, Depends(get_customer_service)],
):
    """Actualiza las estadísticas del cliente (total gastado y cantidad de órdenes)."""
    try:
        await customer_service.update_customer_stats(customer_id)
        return {"message": "Estadísticas actualizadas correctamente"}
    except DatabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e
