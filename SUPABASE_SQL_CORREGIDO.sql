-- ÍNDICES DE PERFORMANCE - SESIÓN 7 (FINAL - SIN USUARIOS_ADMIN)
-- Pega esto en Supabase SQL Editor

-- Índices en tabla PRODUCTOS
CREATE INDEX IF NOT EXISTS idx_productos_id ON productos(id_producto);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_subcategoria ON productos(subcategoria);
CREATE INDEX IF NOT EXISTS idx_productos_stock ON productos(stock);
CREATE INDEX IF NOT EXISTS idx_productos_fecha ON productos(fecha_creacion DESC);

-- Índices en tabla CLIENTES
CREATE INDEX IF NOT EXISTS idx_clientes_id ON clientes(id_cliente);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_provincia ON clientes(provincia);
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(activo);
CREATE INDEX IF NOT EXISTS idx_clientes_fecha_registro ON clientes(fecha_registro DESC);

-- Índices en tabla ORDENES
CREATE INDEX IF NOT EXISTS idx_ordenes_id ON ordenes(id_orden);
CREATE INDEX IF NOT EXISTS idx_ordenes_id_cliente ON ordenes(id_cliente);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha ON ordenes(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_ordenes_preferencia ON ordenes(id_preferencia);
CREATE INDEX IF NOT EXISTS idx_ordenes_payment_id ON ordenes(payment_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_id_usuario ON ordenes(id_usuario);
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente_estado ON ordenes(id_cliente, estado);

-- Índices en tabla ITEMS_ORDEN
CREATE INDEX IF NOT EXISTS idx_items_orden_id_orden ON items_orden(id_orden);
CREATE INDEX IF NOT EXISTS idx_items_orden_id_producto ON items_orden(id_producto);

-- Índices en tabla DIRECCIONES
CREATE INDEX IF NOT EXISTS idx_direcciones_id_cliente ON direcciones(id_cliente);
CREATE INDEX IF NOT EXISTS idx_direcciones_es_principal ON direcciones(es_principal);

-- Índices en tabla FAVORITOS
CREATE INDEX IF NOT EXISTS idx_favoritos_id_cliente ON favoritos(id_cliente);
CREATE INDEX IF NOT EXISTS idx_favoritos_id_producto ON favoritos(id_producto);
