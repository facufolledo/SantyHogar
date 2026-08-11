# TASK 7: Dashboard - Separar pedidos confirmados y pendientes

**STATUS:** done ✅
**USER QUERY:** "modifica el dashboard para que muestre pendientes tambien, pero que los divida, que abajo salga confirmados tanto y pendientes tanto"

## PROBLEMA
El dashboard solo mostraba estadísticas de pedidos con estado "paid" (pagados), ignorando los pedidos "pending" (pendientes). Esto causaba que las métricas mostraran $0 aunque hubiera pedidos pendientes.

## SOLUCIÓN IMPLEMENTADA

### Backend

#### 1. Schema actualizado (`backend/app/models/schemas.py`)
Agregados nuevos campos a `DashboardStats`:
```python
class DashboardStats(BaseModel):
    sales_day: float
    sales_week: float
    sales_month: float
    order_count: int
    order_count_paid: int        # NUEVO
    order_count_pending: int     # NUEVO
    avg_ticket: float
    active_products: int
    low_stock_products: int
    new_customers_month: int
```

#### 2. Dashboard Service actualizado (`backend/app/services/dashboard_service.py`)
Modificado `get_stats()` para:
- Contar pedidos pagados y pendientes por separado
- Mantener las ventas solo de pedidos pagados (correcto para métricas financieras)
- Calcular ticket promedio solo con pedidos pagados

**Lógica:**
```python
for order in all_orders:
    created_at = self._parse_date(order.get("fecha_creacion"))
    if created_at is None:
        continue
    
    estado = order.get("estado")
    
    # Count orders by status for the month
    if created_at >= month_start:
        order_count_month += 1
        if estado == "paid":
            order_count_paid += 1
        elif estado == "pending":
            order_count_pending += 1
```

### Frontend

#### 1. Tipo TypeScript actualizado (`frontend/src/api/dashboardApi.ts`)
```typescript
export interface DashboardStats {
  sales_day: number;
  sales_week: number;
  sales_month: number;
  order_count: number;
  order_count_paid: number;      // NUEVO
  order_count_pending: number;   // NUEVO
  avg_ticket: number;
  active_products: number;
  low_stock_products: number;
  new_customers_month: number;
}
```

#### 2. Dashboard actualizado (`frontend/src/pages/admin/Dashboard.tsx`)

**Card de Pedidos:**
- Agregado subtítulo mostrando "X confirmados, Y pendientes"
```typescript
{ 
  label: 'Pedidos', 
  value: String(stats.order_count), 
  icon: ShoppingBag, 
  color: 'bg-purple-500/10 text-purple-400', 
  subtitle: `${stats.order_count_paid} confirmados, ${stats.order_count_pending} pendientes` 
}
```

**Sección Resumen:**
- Agregadas dos nuevas barras de progreso:
  - "Pedidos confirmados" (verde)
  - "Pedidos pendientes" (amarillo)
```typescript
{ 
  label: 'Pedidos confirmados', 
  value: String(stats.order_count_paid), 
  pct: Math.min(100, (stats.order_count_paid / Math.max(stats.order_count, 1)) * 100), 
  color: 'bg-green-500' 
},
{ 
  label: 'Pedidos pendientes', 
  value: String(stats.order_count_pending), 
  pct: Math.min(100, (stats.order_count_pending / Math.max(stats.order_count, 1)) * 100), 
  color: 'bg-yellow-500' 
}
```

## RESULTADO

### Antes:
- Dashboard mostraba $0 en ventas aunque hubiera pedidos pendientes
- No se distinguía entre pedidos confirmados y pendientes
- Confusión sobre el estado real del negocio

### Después:
- **Card de Pedidos:** Muestra total + desglose en texto pequeño
  - Ejemplo: "1 pedido" → "1 confirmados, 0 pendientes"
- **Sección Resumen:** Dos barras separadas con colores distintivos
  - Verde para confirmados (pagados)
  - Amarillo para pendientes
- **Ventas:** Siguen mostrando solo pedidos pagados (correcto)
- **Ticket promedio:** Calculado solo con pedidos pagados (correcto)

## ARCHIVOS MODIFICADOS
- `backend/app/models/schemas.py` - Agregados campos order_count_paid y order_count_pending
- `backend/app/services/dashboard_service.py` - Lógica para contar pedidos por estado
- `frontend/src/api/dashboardApi.ts` - Tipo TypeScript actualizado
- `frontend/src/pages/admin/Dashboard.tsx` - UI actualizada con desglose de pedidos

## NOTAS TÉCNICAS
- Las **ventas** solo cuentan pedidos "paid" (correcto para métricas financieras)
- El **ticket promedio** se calcula solo con pedidos pagados
- Los **pedidos totales** incluyen todos los estados del mes
- El desglose ayuda a identificar pedidos que necesitan seguimiento
