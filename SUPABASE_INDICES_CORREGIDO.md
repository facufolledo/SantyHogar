# ✅ SUPABASE ÍNDICES - VERSIÓN CORREGIDA

## El problema

El SQL anterior tenía error de sintaxis:
```
❌ CREATE INDEX ... (email UNIQUE)  ← INCORRECTO
✅ CREATE UNIQUE INDEX ... (email)  ← CORRECTO
```

PostgreSQL no permite `UNIQUE` dentro del paréntesis de CREATE INDEX.

---

## ✅ SQL CORREGIDO

Abre Supabase → SQL Editor → New Query

**Copia y pega TODO esto:**

```sql
-- ÍNDICES DE PERFORMANCE - SESIÓN 7 (CORREGIDO)

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
CREATE INDEX IF NOT EXISTS idx_items_orden_fecha ON items_orden(fecha_creacion DESC);

-- Índices en tabla DIRECCIONES
CREATE INDEX IF NOT EXISTS idx_direcciones_id_cliente ON direcciones(id_cliente);
CREATE INDEX IF NOT EXISTS idx_direcciones_es_principal ON direcciones(es_principal);

-- Índices en tabla FAVORITOS
CREATE INDEX IF NOT EXISTS idx_favoritos_id_cliente ON favoritos(id_cliente);
CREATE INDEX IF NOT EXISTS idx_favoritos_id_producto ON favoritos(id_producto);
CREATE INDEX IF NOT EXISTS idx_favoritos_fecha ON favoritos(fecha_creacion DESC);

-- Índices en tabla USUARIOS_ADMIN
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_admin_email ON usuarios_admin(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_activo ON usuarios_admin(activo);
```

---

## 🚀 PASOS

1. **Abre**: https://app.supabase.com
2. **Ve a**: SQL Editor → New Query
3. **Copia**: El SQL de arriba (Ctrl+A, Ctrl+C)
4. **Pega**: En Supabase (Ctrl+V)
5. **Ejecuta**: Click RUN (botón azul)
6. **Espera**: ✅ Verde

---

## ✅ Cambios Hechos

| Campo | Antes (❌) | Después (✅) |
|-------|-----------|------------|
| `idx_clientes_email` | `CREATE INDEX ... (email UNIQUE)` | `CREATE UNIQUE INDEX ... (email)` |
| `idx_usuarios_admin_email` | `CREATE INDEX ... (email UNIQUE)` | `CREATE UNIQUE INDEX ... (email)` |

---

## 📁 Archivos

- ✅ `backend/database/migrations/010_add_performance_indexes.sql` - Actualizado
- ✅ `SUPABASE_SQL_CORREGIDO.sql` - Archivo standalone para copiar/pegar

---

**¡YA ESTÁ LISTO! Ejecuta el SQL y listo.** ✅
