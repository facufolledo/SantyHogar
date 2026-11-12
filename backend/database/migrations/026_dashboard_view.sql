-- Dashboard view: single query for all stats
-- Eliminates N+1 problem completely

CREATE OR REPLACE VIEW dashboard_stats_view AS
SELECT
  -- Orders summary
  COUNT(DISTINCT o.id_pedido) as total_orders,
  COUNT(DISTINCT CASE WHEN o.estado IN ('pagada', 'entregado', 'delivered') THEN o.id_pedido END) as delivered_orders,
  COUNT(DISTINCT CASE WHEN o.estado IN ('pending_pago', 'pending') THEN o.id_pedido END) as pending_orders,
  COALESCE(SUM(CASE WHEN o.estado IN ('pagada', 'entregado', 'delivered') THEN o.total ELSE 0 END), 0) as total_sales,
  COALESCE(AVG(CASE WHEN o.estado IN ('pagada', 'entregado', 'delivered') THEN o.total END), 0) as avg_ticket,
  
  -- Today's sales
  COALESCE(SUM(CASE 
    WHEN o.estado IN ('pagada', 'entregado', 'delivered') 
    AND DATE(o.created_at) = CURRENT_DATE 
    THEN o.total 
    ELSE 0 
  END), 0) as sales_today,
  
  -- Products
  (SELECT COUNT(*) FROM productos WHERE is_visible = true) as active_products,
  (SELECT COUNT(*) FROM productos WHERE is_visible = true AND stock < 5) as low_stock_products,
  
  -- Customers
  (SELECT COUNT(*) FROM clientes) as total_customers
FROM orders o
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_estado_created_at ON orders(estado, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_productos_visible_stock ON productos(is_visible, stock);
