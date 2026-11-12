"""Dashboard statistics - simplified with real orders data."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import hashlib

from app.database.connection import get_supabase_client

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# Simple cache
_cache = {}
_cache_ttl = {}
CACHE_SECONDS = 300  # 5 min cache


class StatCard(BaseModel):
    label: str
    value: str
    change: str
    icon: str
    color: str


class ChartData(BaseModel):
    day: str
    value: float


class DashboardStats(BaseModel):
    stats: List[StatCard]
    chart_data: List[ChartData]
    summary: dict
    orders: List[dict]
    date_range: dict


@router.get("/test")
async def test_orders(supabase = Depends(get_supabase_client)):
    """Test endpoint - check available columns."""
    try:
        response = supabase.table("ordenes").select("*").limit(1).execute()
        data = response.data
        if data:
            return {"success": True, "columns": list(data[0].keys()), "sample": data[0]}
        else:
            return {"success": True, "columns": [], "sample": None}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    supabase = Depends(get_supabase_client)
):
    """Get dashboard stats - real orders data."""
    try:
        print("\n=== DASHBOARD STATS START ===")
        
        # Get recent 100 orders
        print("Fetching recent 100 orders...")
        response = supabase.table("ordenes").select("id_orden, total, estado, fecha_creacion, nombre_cliente").order("fecha_creacion", desc=True).limit(100).execute()
        all_orders = response.data or []
        print(f"✅ Fetched {len(all_orders)} orders")
        
        # Parse dates
        if start_date and end_date:
            try:
                date_start = datetime.fromisoformat(start_date.replace('Z', '+00:00')).date()
                date_end = datetime.fromisoformat(end_date.replace('Z', '+00:00')).date()
            except:
                date_start = datetime.strptime(start_date, "%Y-%m-%d").date()
                date_end = datetime.strptime(end_date, "%Y-%m-%d").date()
        else:
            date_start = (datetime.now(timezone.utc) - timedelta(days=30)).date()
            date_end = datetime.now(timezone.utc).date()
        
        print(f"Date range: {date_start} to {date_end}")
        
        # Filter by date
        filtered_orders = []
        date_start_str = str(date_start)
        date_end_str = str(date_end)
        
        for order in all_orders:
            fecha = order.get("fecha_creacion")
            if not fecha:
                continue
            order_date = fecha[:10] if isinstance(fecha, str) else str(fecha)[:10]
            if date_start_str <= order_date <= date_end_str:
                filtered_orders.append(order)
        
        print(f"✅ Filtered to {len(filtered_orders)} orders")
        
        # Calculate metrics
        delivered = [o for o in filtered_orders if o.get("estado", "").lower() in ["pagada", "entregado", "delivered", "completado"]]
        today_str = str(datetime.now().date())
        today_orders = [o for o in filtered_orders if o.get("fecha_creacion", "")[:10] == today_str]
        today_delivered = [o for o in today_orders if o.get("estado", "").lower() in ["pagada", "entregado", "delivered", "completado"]]
        
        sales_total = sum(float(o.get("total") or 0) for o in delivered)
        sales_today = sum(float(o.get("total") or 0) for o in today_delivered)
        avg_ticket = sales_total / len(delivered) if delivered else 0
        
        # Stats
        stats = [
            {
                "label": "Ventas período",
                "value": f"${sales_total:,.0f}",
                "change": f"+{int((sales_today / max(sales_total, 1)) * 100)}%",
                "icon": "DollarSign",
                "color": "bg-blue-500/10 text-blue-400",
            },
            {
                "label": "Ventas hoy",
                "value": f"${sales_today:,.0f}",
                "change": f"{len(today_delivered)} pedidos",
                "icon": "TrendingUp",
                "color": "bg-green-500/10 text-green-400",
            },
            {
                "label": "Pedidos",
                "value": str(len(filtered_orders)),
                "change": f"{len(delivered)} entregados",
                "icon": "ShoppingBag",
                "color": "bg-purple-500/10 text-purple-400",
            },
            {
                "label": "Ticket",
                "value": f"${avg_ticket:,.0f}",
                "change": "promedio",
                "icon": "Package",
                "color": "bg-orange-500/10 text-orange-400",
            },
        ]
        
        # Chart data
        daily_sales = {}
        for o in delivered:
            day = o.get("fecha_creacion", "")[:10]
            total = float(o.get("total") or 0)
            daily_sales[day] = daily_sales.get(day, 0) + total
        
        chart_data = []
        for i in range((date_end - date_start).days + 1):
            day = date_start + timedelta(days=i)
            day_str = str(day)
            label = day.strftime("%a")[0].upper()
            value = daily_sales.get(day_str, 0)
            chart_data.append({
                "day": label,
                "value": float(value),
            })
        
        # Summary
        summary = {
            "productos_activos": 0,
            "stock_bajo": 0,
            "clientes_nuevos": 0,
            "pedidos_entregados": len(delivered),
            "pedidos_pendientes": len(filtered_orders) - len(delivered),
        }
        
        # Format orders
        formatted_orders = []
        for o in filtered_orders[-10:]:
            formatted_orders.append({
                "id": o.get("id_orden", ""),
                "customer": o.get("nombre_cliente", "Sin nombre"),
                "date": o.get("fecha_creacion", "")[:10],
                "status": o.get("estado", "").lower(),
                "total": float(o.get("total") or 0),
            })
        
        result = {
            "stats": stats,
            "chart_data": chart_data,
            "summary": summary,
            "orders": formatted_orders,
            "date_range": {
                "start": str(date_start),
                "end": str(date_end),
            }
        }
        
        print("=== SUCCESS ===\n")
        return result
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
