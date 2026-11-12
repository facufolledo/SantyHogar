"""Dashboard statistics - simplified with SQL view."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from functools import lru_cache
import hashlib

from app.database.connection import get_supabase_client

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# Simple cache decorator
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


def _get_cache_key(start_date: str, end_date: str) -> str:
    """Generate cache key from dates."""
    key = f"{start_date}_{end_date}"
    return hashlib.md5(key.encode()).hexdigest()


def _get_cached(key: str) -> Optional[dict]:
    """Get from cache if not expired."""
    if key not in _cache:
        return None
    if datetime.now().timestamp() - _cache_ttl.get(key, 0) > CACHE_SECONDS:
        del _cache[key]
        del _cache_ttl[key]
        return None
    return _cache[key]


def _set_cache(key: str, data: dict):
    """Set cache."""
    _cache[key] = data
    _cache_ttl[key] = datetime.now().timestamp()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    supabase = Depends(get_supabase_client)
):
    """Get dashboard stats - cached and simplified."""
    try:
        # Parse dates
        if start_date:
            date_start = datetime.fromisoformat(start_date.replace('Z', '+00:00')).date()
        else:
            date_start = (datetime.now(timezone.utc) - timedelta(days=30)).date()
        
        if end_date:
            date_end = datetime.fromisoformat(end_date.replace('Z', '+00:00')).date()
        else:
            date_end = datetime.now(timezone.utc).date()
        
        # Check cache
        cache_key = _get_cache_key(str(date_start), str(date_end))
        cached = _get_cached(cache_key)
        if cached:
            return cached
        
        # Single query: get all orders in range
        orders = await supabase.table("orders").select("*").gte("created_at", f"{date_start}T00:00:00").lte("created_at", f"{date_end}T23:59:59").execute()
        orders_data = orders.data or []
        
        # Calculate everything from orders (no additional queries!)
        delivered = [o for o in orders_data if o.get("estado", "").lower() in ["pagada", "entregado", "delivered"]]
        today_orders = [o for o in orders_data if o.get("created_at", "").startswith(str(datetime.now().date()))]
        today_delivered = [o for o in today_orders if o.get("estado", "").lower() in ["pagada", "entregado", "delivered"]]
        
        sales_total = sum(float(o.get("total", 0)) for o in delivered)
        sales_today = sum(float(o.get("total", 0)) for o in today_delivered)
        avg_ticket = sales_total / len(delivered) if delivered else 0
        
        # Simple stats
        stats = [
            {
                "label": "Ventas período",
                "value": f"${sales_total:,.0f}",
                "change": f"+{((sales_today / max(sales_total, 1)) * 100):.0f}%",
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
                "value": str(len(orders_data)),
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
        
        # Chart data (group by day)
        daily_sales = {}
        for o in delivered:
            day = o.get("created_at", "")[:10]
            daily_sales[day] = daily_sales.get(day, 0) + float(o.get("total", 0))
        
        chart_data = [
            {
                "day": (date_start + timedelta(days=i)).strftime("%a")[0].upper(),
                "value": daily_sales.get(str(date_start + timedelta(days=i)), 0),
            }
            for i in range((date_end - date_start).days + 1)
        ]
        
        # Summary
        summary = {
            "total_orders": len(orders_data),
            "delivered": len(delivered),
            "pending": len(orders_data) - len(delivered),
            "conversion": f"{(len(delivered) / max(len(orders_data), 1) * 100):.1f}%",
        }
        
        result = {
            "stats": stats,
            "chart_data": chart_data,
            "summary": summary,
        }
        
        # Cache result
        _set_cache(cache_key, result)
        
        return result
    
    except Exception as e:
        print(f"Dashboard error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

