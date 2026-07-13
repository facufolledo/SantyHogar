-- ============================================================================
-- LIMPIAR TODAS LAS TABLAS - PARA PRODUCCIÓN
-- ============================================================================
-- 
-- ⚠️  ADVERTENCIA: Esta operación es DESTRUCTIVA
-- Elimina TODOS los datos de todas las tablas
-- SOLO ejecutar si quieres empezar limpio en producción
--
-- Creado: 2026-06-30
-- Ambiente: Production Ready

-- ============================================================================
-- OPCIÓN 1: BORRAR TODO (Más rápido)
-- ============================================================================

-- Desactivar foreign keys temporalmente (si es necesario)
SET session_replication_role = 'replica';

-- Limpiar todas las tablas (mantiene estructura)
TRUNCATE TABLE items_orden CASCADE;
TRUNCATE TABLE ordenes CASCADE;
TRUNCATE TABLE carrito CASCADE;
TRUNCATE TABLE direcciones CASCADE;
TRUNCATE TABLE clientes CASCADE;
TRUNCATE TABLE productos CASCADE;
TRUNCATE TABLE categorias CASCADE;
TRUNCATE TABLE usuarios CASCADE;
TRUNCATE TABLE precios_instalaciones CASCADE;

-- Reactivar foreign keys
SET session_replication_role = 'origin';

-- Verificar que todo está vacío
SELECT 
  'items_orden' as tabla, COUNT(*) as registros FROM items_orden
UNION ALL SELECT 'ordenes', COUNT(*) FROM ordenes
UNION ALL SELECT 'carrito', COUNT(*) FROM carrito
UNION ALL SELECT 'direcciones', COUNT(*) FROM direcciones
UNION ALL SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL SELECT 'productos', COUNT(*) FROM productos
UNION ALL SELECT 'categorias', COUNT(*) FROM categorias
UNION ALL SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL SELECT 'precios_instalaciones', COUNT(*) FROM precios_instalaciones
ORDER BY tabla;

-- Resultado esperado: todas las tablas con 0 registros


-- ============================================================================
-- OPCIÓN 2: BORRAR CON VERIFICACIÓN
-- ============================================================================
-- (Ejecuta esto después para ver qué se borró)

-- SELECT 
--   'Registros eliminados:' as operacion,
--   'items_orden' as tabla, COUNT(*) as before FROM items_orden
-- UNION ALL SELECT '', 'ordenes', COUNT(*) FROM ordenes
-- UNION ALL SELECT '', 'carrito', COUNT(*) FROM carrito
-- UNION ALL SELECT '', 'direcciones', COUNT(*) FROM direcciones
-- UNION ALL SELECT '', 'clientes', COUNT(*) FROM clientes
-- UNION ALL SELECT '', 'productos', COUNT(*) FROM productos
-- UNION ALL SELECT '', 'categorias', COUNT(*) FROM categorias
-- UNION ALL SELECT '', 'usuarios', COUNT(*) FROM usuarios
-- UNION ALL SELECT '', 'precios_instalaciones', COUNT(*) FROM precios_instalaciones;


-- ============================================================================
-- OPCIÓN 3: BORRAR SELECTIVO (Si quieres mantener algunas tablas)
-- ============================================================================
-- Descomenta lo que quieras borrar:

-- TRUNCATE TABLE items_orden CASCADE;        -- Items de órdenes
-- TRUNCATE TABLE ordenes CASCADE;            -- Órdenes completamente
-- TRUNCATE TABLE carrito CASCADE;            -- Carritos de compra
-- TRUNCATE TABLE direcciones CASCADE;        -- Direcciones de clientes
-- TRUNCATE TABLE clientes CASCADE;           -- Clientes
-- TRUNCATE TABLE productos CASCADE;          -- Productos (RESET stock)
-- TRUNCATE TABLE categorias CASCADE;         -- Categorías
-- TRUNCATE TABLE usuarios CASCADE;           -- Usuarios (admin, etc)
-- TRUNCATE TABLE precios_instalaciones CASCADE; -- Precios


-- ============================================================================
-- RESETEAR SECUENCIAS (IDs autoincrementales)
-- ============================================================================
-- Si usas serial/auto_increment, resetea los secuencias:

ALTER SEQUENCE IF EXISTS items_orden_id_item_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ordenes_id_orden_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS carrito_id_carrito_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS direcciones_id_direccion_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS clientes_id_cliente_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS productos_id_producto_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS categorias_id_categoria_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS usuarios_id_usuario_seq RESTART WITH 1;


-- ============================================================================
-- COMANDOS ÚTILES POST-LIMPIEZA
-- ============================================================================

-- Ver estado actual:
-- SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
-- FROM pg_tables 
-- WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Reinsert datos de prueba (si quieres):
-- (Aquí irían los INSERT de categorías, usuarios admin, etc.)


-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- 
-- NOTA: Si hiciste TRUNCATE y quieres deshacer, necesitas ROLLBACK inmediatamente
-- Si ya hiciste COMMIT, necesitarás restaurar desde backup
-- 
-- ROLLBACK;



