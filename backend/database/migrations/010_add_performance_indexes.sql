/**
 * Migración 010: Agregar índices para mejorar performance
 * 
 * Targets:
 * - Búsquedas por ID (clientes, órdenes, productos)
 * - Filtros por estado (órdenes)
 * - Búsquedas por email (clientes)
 * - Filtros por categoría (productos)
 * - Joins en items_orden
 * - Ordenamiento por fecha
 */

-- Índices en tabla PRODUCTOS
-- Mejora búsquedas por ID y filtros por categoría
CREATE INDEX IF NOT EXISTS idx_productos_id ON productos(id_producto);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_subcategoria ON productos(subcategoria);
CREATE INDEX IF NOT EXISTS idx_productos_stock ON productos(stock);  -- Para filtrar disponibles
CREATE INDEX IF NOT EXISTS idx_productos_fecha ON productos(fecha_creacion DESC);

-- Índices en tabla CLIENTES
-- Mejora búsquedas por email, ID y filtros
CREATE INDEX IF NOT EXISTS idx_clientes_id ON clientes(id_cliente);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email UNIQUE);  -- Email debe ser único
CREATE INDEX IF NOT EXISTS idx_clientes_provincia ON clientes(provincia);
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(activo);

-- Índices en tabla ORDENES
-- Crítico para dashboards y listados
CREATE INDEX IF NOT EXISTS idx_ordenes_id ON ordenes(id_orden);
CREATE INDEX IF NOT EXISTS idx_ordenes_id_cliente ON ordenes(id_cliente);  -- Para get_customer_orders
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes(estado);  -- Para filtrar paid/pending
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha ON ordenes(fecha_creacion DESC);  -- Para ordenamiento
CREATE INDEX IF NOT EXISTS idx_ordenes_preferencia ON ordenes(id_preferencia);  -- Para webhook
CREATE INDEX IF NOT EXISTS idx_ordenes_payment_id ON ordenes(payment_id);  -- Para webhook
CREATE INDEX IF NOT EXISTS idx_ordenes_id_usuario ON ordenes(id_usuario);

-- Índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente_estado ON ordenes(id_cliente, estado);

-- Índices en tabla ITEMS_ORDEN
-- Mejora joins y búsquedas
CREATE INDEX IF NOT EXISTS idx_items_orden_id_orden ON items_orden(id_orden);  -- Para get_order_items
CREATE INDEX IF NOT EXISTS idx_items_orden_id_producto ON items_orden(id_producto);
CREATE INDEX IF NOT EXISTS idx_items_orden_fecha ON items_orden(fecha_creacion DESC);

-- Índices en tabla DIRECCIONES
-- Para búsquedas de direcciones por cliente
CREATE INDEX IF NOT EXISTS idx_direcciones_id_cliente ON direcciones(id_cliente);
CREATE INDEX IF NOT EXISTS idx_direcciones_es_principal ON direcciones(es_principal);

-- Índices en tabla FAVORITOS
-- Para cargar favoritos de usuario
CREATE INDEX IF NOT EXISTS idx_favoritos_id_cliente ON favoritos(id_cliente);
CREATE INDEX IF NOT EXISTS idx_favoritos_id_producto ON favoritos(id_producto);
CREATE INDEX IF NOT EXISTS idx_favoritos_fecha ON favoritos(fecha_creacion DESC);

-- Índices en tabla USUARIOS_ADMIN
-- Para búsquedas y autenticación
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_email ON usuarios_admin(email UNIQUE);
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_activo ON usuarios_admin(activo);

-- Índice para búsqueda de productos por nombre (si la usas)
-- CREATE INDEX IF NOT EXISTS idx_productos_nombre_gin ON productos USING gin(to_tsvector('spanish', nombre));

-- Informar creación
DO $$
BEGIN
  RAISE NOTICE 'Índices de performance creados exitosamente';
END $$;
