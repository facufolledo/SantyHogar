"""Dashboard statistics and analytics endpoints."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional

from app.database.connection import get_supabase_client

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


class StatCard(BaseModel):
    label: str
    value: str
    change: str
    icon: str
    color: str
    bar: str


class ChartData(BaseModel):
    day: str
    value: float


class OrderItem(BaseModel):
    id: str
    customer: str
    date: str
    status: str
    total: int


class DashboardStats(BaseModel):
    stats: List[StatCard]
    chart_data: List[ChartData]
    orders: List[OrderItem]
    summary: dict
    date_range: dict


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    supabase = Depends(get_supabase_client)
):
    """Get comprehensive dashboard statistics with optional date filters."""
    try:
        # Parse dates or use defaults (current month)
        if start_date:
            date_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        else:
            date_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        if end_date:
            date_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        else:
            date_end = datetime.now(timezone.utc).replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Get today for comparison
        today = datetime.now(timezone.utc).date()
        today_start = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
        today_end = datetime.combine(today, datetime.max.time()).replace(tzinfo=timezone.utc)
        
        # Fetch orders in range
        orders_query = await supabase.table("orders").select("*").gte("created_at", date_start.isoformat()).lte("created_at", date_end.isoformat()).execute()
        all_orders = orders_query.data if orders_query.data else []
        
        # Fetch today's orders
        today_orders = await supabase.table("orders").select("*").gte("created_at", today_start.isoformat()).lte("created_at", today_end.isoformat()).execute()
        today_data = today_orders.data if today_orders.data else []
        
        # Calculate metrics
        delivered_orders = [o for o in all_orders if o.get("estado", "").lower() in ["entregado", "delivered"]]
        sales_total = sum([o.get("total", 0) for o in delivered_orders])
        sales_today = sum([o.get("total", 0) for o in today_data if o.get("estado", "").lower() in ["entregado", "delivered"]])
        
        avg_ticket = (sales_total / len(delivered_orders)) if delivered_orders else 0
        total_orders = len(all_orders)
        
        # Product metrics
        products = await supabase.table("productos").select("*", count="exact").eq("is_visible", True).execute()
        active_products = len(products.data) if products.data else 0
        
        low_stock = await supabase.table("productos").select("*", count="exact").lt("stock", 5).execute()
        low_stock_count = len(low_stock.data) if low_stock.data else 0
        
        # Customer metrics
        new_customers = await supabase.table("clientes").select("*", count="exact").gte("created_at", date_start.isoformat()).lte("created_at", date_end.isoformat()).execute()
        new_customers_count = len(new_customers.data) if new_customers.data else 0
        
        # Conversion rate
        conversion_rate = (total_orders / max(active_products * 10, 1)) * 100
        
        # Build stats cards with proper formatting
        stats = [
            {
                "label": "Ventas del período",
                "value": f"${sales_total:,.0f}",
                "change": f"+{((sales_today/max(sales_total,1))*100):.1f}%" if sales_total > 0 else "0%",
                "icon": "DollarSign",
                "color": "bg-blue-500/10 text-blue-400",
                "bar": "bg-blue-500"
            },
            {
                "label": "Ventas hoy",
                "value": f"${sales_today:,.0f}",
                "change": f"{((sales_today/max(sales_total,1))*100):.1f}% del total" if sales_total > 0 else "0% del total",
                "icon": "TrendingUp",
                "color": "bg-green-500/10 text-green-400",
                "bar": "bg-green-500"
            },
            {
                "label": "Pedidos",
                "value": str(total_orders),
                "change": f"{len(delivered_orders)} entregados" if delivered_orders else "0 entregados",
                "icon": "ShoppingBag",
                "color": "bg-purple-500/10 text-purple-400",
                "bar": "bg-purple-500"
            },
            {
                "label": "Ticket promedio",
                "value": f"${avg_ticket:,.0f}",
                "change": f"${avg_ticket:,.0f}" if avg_ticket > 0 else "$0",
                "icon": "Package",
                "color": "bg-orange-500/10 text-orange-400",
                "bar": "bg-orange-500"
            }
        ]
        
        # Get sales data for chart (7 or 30 days depending on range)
        days_data = []
        num_days = (date_end - date_start).days or 7
        num_days = min(num_days, 30)  # Cap at 30 days for chart
        
        for i in range(num_days - 1, -1, -1):
            day = date_start + timedelta(days=i)
            day_start = datetime.combine(day.date(), datetime.min.time()).replace(tzinfo=timezone.utc)
            day_end = datetime.combine(day.date(), datetime.max.time()).replace(tzinfo=timezone.utc)
            
            day_orders = [o for o in all_orders 
                         if datetime.fromisoformat(o.get("created_at", "").replace('Z', '+00:00')).date() == day.date()
                         and o.get("estado", "").lower() in ["entregado", "delivered"]]
            day_sales = sum([o.get("total", 0) for o in day_orders])
            
            days_data.append({
                "day": day.strftime("%a")[0].upper() if num_days <= 7 else day.strftime("%d"),
                "value": float(day_sales)
            })
        
        # Get recent orders
        recent_orders = sorted(all_orders, key=lambda x: x.get("created_at", ""), reverse=True)[:5]
        
        orders_list = []
        for order in recent_orders:
            orders_list.append({
                "id": order.get("id_pedido", ""),
                "customer": order.get("nombre_cliente", ""),
                "date": order.get("created_at", "")[:10],
                "status": order.get("estado", "pending").lower(),
                "total": int(order.get("total", 0))
            })
        
        # Summary stats
        summary = {
            "productos_activos": active_products,
            "stock_bajo": low_stock_count,
            "clientes_nuevos": new_customers_count,
            "tasa_conversion": f"{conversion_rate:.1f}%",
            "pedidos_entregados": len(delivered_orders),
            "pedidos_pendientes": total_orders - len(delivered_orders)
        }
        
        return {
            "stats": stats,
            "chart_data": days_data,
            "orders": orders_list,
            "summary": summary,
            "date_range": {
                "start": date_start.isoformat(),
                "end": date_end.isoformat()
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard stats: {str(e)}")
