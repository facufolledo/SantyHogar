"""Rutas del dashboard de administración."""
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import get_dashboard_service
from app.exceptions import DatabaseError
from app.models.schemas import (
    DashboardStats,
    SalesChartPoint,
    TopCustomer,
    TopProduct,
)
from app.services.dashboard_service import DashboardService

router = APIRouter(tags=["dashboard"])


@router.get(
    "/dashboard/stats",
    response_model=DashboardStats,
    status_code=status.HTTP_200_OK,
)
async def get_dashboard_stats(
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
) -> DashboardStats:
    """Retorna estadísticas generales del dashboard."""
    try:
        return await dashboard_service.get_stats()
    except DatabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e


@router.get(
    "/dashboard/sales-chart",
    response_model=List[SalesChartPoint],
    status_code=status.HTTP_200_OK,
)
async def get_sales_chart(
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
) -> List[SalesChartPoint]:
    """Retorna datos del gráfico de ventas de los últimos 7 días."""
    try:
        return await dashboard_service.get_sales_chart()
    except DatabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e


@router.get(
    "/dashboard/top-products",
    response_model=List[TopProduct],
    status_code=status.HTTP_200_OK,
)
async def get_top_products(
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
) -> List[TopProduct]:
    """Retorna los 5 productos más vendidos."""
    try:
        return await dashboard_service.get_top_products()
    except DatabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e


@router.get(
    "/dashboard/top-customers",
    response_model=List[TopCustomer],
    status_code=status.HTTP_200_OK,
)
async def get_top_customers(
    dashboard_service: Annotated[DashboardService, Depends(get_dashboard_service)],
) -> List[TopCustomer]:
    """Retorna los 5 clientes con mayor gasto total."""
    try:
        return await dashboard_service.get_top_customers()
    except DatabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e
