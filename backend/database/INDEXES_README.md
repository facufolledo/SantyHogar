# Índices de Performance - Supabase

## Resumen

Este documento explica los índices agregados para optimizar queries en Supabase.

## ¿Por qué índices?

Sin índices:
- `SELECT * FROM ordenes WHERE estado='paid'` → Full table scan (lento con muchos datos)

Con índices:
- `SELECT * FROM ordenes WHERE estado='paid'` → Búsqueda indexada (muy rápido)

## Índices Creados

### Tabla PRODUCTOS
```sql
idx_productos_id              -- Búsquedas por ID
idx_productos_categoria       -- Filtros por categoría
idx_productos_subcategoria    -- Filtros por subcategoría
idx_productos_stock           -- Productos disponibles
idx_productos_fecha           -- Ordenar por fecha
```

### Tabla CLIENTES
```sql
idx_clientes_id               -- Búsquedas por ID
idx_clientes_email            -- Búsquedas por email (UNIQUE)
idx_clientes_provincia        -- Filtros por provincia
idx_clientes_activo           -- Usuarios activos
```

### Tabla ORDENES (⭐ MÁS IMPORTANTE)
```sql
idx_ordenes_id                -- Búsquedas por ID
idx_ordenes_id_cliente        -- Órdenes del usuario
idx_ordenes_estado            -- Dashboard: paid/pending
idx_ordenes_fecha             -- Ordenar por fecha
idx_ordenes_preferencia       -- Webhook de MP
idx_ordenes_payment_id        -- Webhook de MP
idx_ordenes_cliente_estado    -- Compuesto: órdenes pagadas por cliente
```

### Tabla ITEMS_ORDEN
```sql
idx_items_orden_id_orden      -- Items de una orden
idx_items_orden_id_producto   -- Productos en orden
```

### Tabla DIRECCIONES
```sql
idx_direcciones_id_cliente    -- Direcciones del usuario
idx_direcciones_es_principal  -- Dirección principal
```

### Tabla FAVORITOS
```sql
idx_favoritos_id_cliente      -- Favoritos del usuario
idx_favoritos_id_producto     -- En qué órdenes está
```

## Cómo Ejecutar

### Opción 1: SQL Editor de Supabase (Recomendado)

1. Abre Supabase Dashboard: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **SQL Editor** → Click en **New Query**
4. Copia el contenido de `migrations/010_add_performance_indexes.sql`
5. Click en **Run**
6. ✅ Verifica que todos los índices se crearon

### Opción 2: Desde Python

```bash
cd backend
python scripts/run_migration_010.py
```

**Nota**: Esto solo funciona si tienes una función RPC. Si falla, usa Opción 1.

## Verificar Índices Creados

En **Supabase Dashboard**:
1. Ve a **Table Editor**
2. Selecciona una tabla
3. Click en **Indexes** (pestaña)
4. Deberías ver los índices listados

O en SQL:

```sql
-- Listar todos los índices
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

## Impacto Esperado

**Antes (sin índices):**
- Cargar 100 órdenes: ~5-10 segundos
- Dashboard: ~3-5 segundos

**Después (con índices):**
- Cargar 100 órdenes: ~200-500ms
- Dashboard: ~500ms-1s

## Mantenimiento

Los índices se mantienen automáticamente. Supabase/PostgreSQL actualiza los índices cuando:
- Insertas datos
- Actualizas datos
- Borras datos

No requiere intervención manual.

## Performance Tips

1. **Usa índices en WHERE clauses frecuentes**
   - ✅ `WHERE id_cliente=X AND estado='paid'`
   - ❌ `WHERE nombre LIKE '%algo%'` (sin índice, usa FULL TEXT)

2. **Évita N+1 queries**
   - ✅ `SELECT * FROM ordenes JOIN items_orden ON...`
   - ❌ `SELECT * FROM ordenes; for ord in ordenes: SELECT * FROM items WHERE id_orden=ord.id`

3. **Limita resultados**
   - ✅ `SELECT * FROM productos LIMIT 100`
   - ❌ `SELECT * FROM productos` (si hay millones)

## Referencias

- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Supabase Performance](https://supabase.com/docs/guides/database/performance)
