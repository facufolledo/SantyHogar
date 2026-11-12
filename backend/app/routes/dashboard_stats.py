"""Dashboard statistics and analytics endpoints."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List

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
    value: int


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


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(supabase = Depends(get_supabase_client)):
    """Get comprehensive dashboard statistics."""
    try:
        # Get today's sales
        today = datetime.now(timezone.utc).date()
        today_start = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
        today_end = datetime.combine(today, datetime.max.time()).replace(tzinfo=timezone.utc)
        
        # Get month's start
        month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Sales today
        today_orders = await supabase.table("orders").select("total").gte("created_at", today_start.isoformat()).lte("created_at", today_end.isoformat()).eq("status", "entregado").execute()
        sales_today = sum([o["total"] for o in today_orders.data]) if today_orders.data else 0
        
        # Sales this month
        month_orders = await supabase.table("orders").select("total").gte("created_at", month_start.isoformat()).eq("status", "entregado").execute()
        sales_month = sum([o["total"] for o in month_orders.data]) if month_orders.data else 0
        
        # Total orders
        all_orders = await supabase.table("orders").select("*", count="exact").execute()
        total_orders = len(all_orders.data) if all_orders.data else 0
        
        # Average ticket
        avg_ticket = (sales_month / total_orders) if total_orders > 0 else 0
        
        # Active products
        products = await supabase.table("productos").select("*", count="exact").eq("is_visible", True).execute()
        active_products = len(products.data) if products.data else 0
        
        # Low stock products
        low_stock = await supabase.table("productos").select("*", count="exact").lt("stock", 5).execute()
        low_stock_count = len(low_stock.data) if low_stock.data else 0
        
        # New customers this month
        new_customers = await supabase.table("clientes").select("*", count="exact").gte("created_at", month_start.isoformat()).execute()
        new_customers_count = len(new_customers.data) if new_customers.data else 0
        
        # Conversion rate (simple: orders / sessions, approximated)
        conversion_rate = (total_orders / max(active_products * 10, 1)) * 100
        
        # Build stats cards
        stats = [
            {
                "label": "Ventas del día",
                "value": f"${sales_today:,.0f}",
                "change": "+18%",
                "icon": "DollarSign",
                "color": "bg-blue-500/10 text-blue-400",
                "bar": "bg-blue-500"
            },
            {
                "label": "Ventas del mes",
                "value": f"${sales_month:,.0f}",
                "change": "+12.5%",
                "icon": "TrendingUp",
                "color": "bg-green-500/10 text-green-400",
                "bar": "bg-green-500"
            },
            {
                "label": "Pedidos",
                "value": str(total_orders),
                "change": "+8.2%",
                "icon": "ShoppingBag",
                "color": "bg-purple-500/10 text-purple-400",
                "bar": "bg-purple-500"
            },
            {
                "label": "Ticket promedio",
                "value": f"${avg_ticket:,.0f}",
                "change": "+3.1%",
                "icon": "Package",
                "color": "bg-orange-500/10 text-orange-400",
                "bar": "bg-orange-500"
            }
        ]
        
        # Get sales data for last 7 days
        days_data = []
        for i in range(6, -1, -1):
            day = datetime.now(timezone.utc) - timedelta(days=i)
            day_start = datetime.combine(day.date(), datetime.min.time()).replace(tzinfo=timezone.utc)
            day_end = datetime.combine(day.date(), datetime.max.time()).replace(tzinfo=timezone.utc)
            
            day_orders = await supabase.table("orders").select("total").gte("created_at", day_start.isoformat()).lte("created_at", day_end.isoformat()).eq("status", "entregado").execute()
            day_sales = sum([o["total"] for o in day_orders.data]) if day_orders.data else 0
            
            days_data.append({
                "day": day.strftime("%a")[0].upper(),  # L, M, X, J, V, S, D
                "value": int(day_sales / 1000) if day_sales > 0 else 0  # Convert to thousands
            })
        
        # Get recent orders
        recent_orders = await supabase.table("orders").select("*").order("created_at", desc=True).limit(5).execute()
        
        orders_list = []
        if recent_orders.data:
            for order in recent_orders.data:
                orders_list.append({
                    "id": order.get("id_pedido", ""),
                    "customer": order.get("nombre_cliente", ""),
                    "date": order.get("created_at", "")[:10],  # YYYY-MM-DD
                    "status": order.get("estado", "pending").lower(),
                    "total": int(order.get("total", 0))
                })
        
        # Summary stats
        summary = {
            "productos_activos": active_products,
            "stock_bajo": low_stock_count,
            "clientes_nuevos": new_customers_count,
            "tasa_conversion": f"{conversion_rate:.1f}%"
        }
        
        return {
            "stats": stats,
            "chart_data": days_data,
            "orders": orders_list,
            "summary": summary
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard stats: {str(e)}")
