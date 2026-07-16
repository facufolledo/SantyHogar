# 📋 RESUMEN: Error de CHECK CONSTRAINT y Solución

## ❌ El Problema

Cuando intentas crear un producto con categoría "Cocinas", Postgres rechaza con:

```
violates check constraint "productos_categoria_check"
Code: 23514
```

### Razón Técnica

La tabla `productos` tiene un CHECK CONSTRAINT antiguo que **solo permite 3 categorías**:

```sql
CHECK (categoria IN ('electrodomesticos', 'muebleria', 'colchoneria'))
```

Pero la migración 011 permitió crear categorías dinámicas. SantyHogar ahora tiene:
- `Electrodomesticos` ✅ (permitida)
- `Cocinas` ❌ (NO permitida por el CHECK antiguo)

Cuando el backend intenta guardar:
```json
{
  "id_categoria": "3881147c-5581-4642-87ff-5b9cd7045a13",
  "categoria": "Cocinas"  ← Postgres rechaza porque no está en el CHECK
}
```

## ✅ La Solución

Remover el CHECK CONSTRAINT y confiar **únicamente** en:
- La FK (Foreign Key) a `categorias.id_categoria`
- El campo `categoria` como caché del nombre

### Paso a Paso

**1️⃣ Abre Supabase SQL Editor:**
https://app.supabase.com/project/gsvtcrscojbfhgixxquw/sql/new

**2️⃣ Copia este SQL completo:**

```sql
-- Remover el CHECK CONSTRAINT
ALTER TABLE IF EXISTS public.productos 
DROP CONSTRAINT IF EXISTS productos_categoria_check;

-- Asegurar que existe la FK
ALTER TABLE IF EXISTS public.productos
ADD CONSTRAINT IF NOT EXISTS productos_id_categoria_fk 
  FOREIGN KEY (id_categoria) 
  REFERENCES public.categorias(id_categoria) 
  ON DELETE SET NULL;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_productos_id_categoria 
  ON public.productos (id_categoria);
```

**3️⃣ Click en "Run" (botón azul)**

**4️⃣ Espera a que complete** ✅

## 🎯 Qué Pasa Después

✅ Ya podrás crear productos con cualquier categoría dinámica
✅ "Cocinas", "Baños", "Dormitorios", etc. funcionarán
✅ La validación ocurre a través de la FK (más flexible)

## 📝 Archivos Relevantes

- **Migración SQL**: `backend/database/migrations/017_remove_hardcoded_categoria_check.sql`
- **Backend**: `backend/app/routes/products.py` (línea 383 ya tiene `.lower()`)
- **Instrucciones**: `🔧_EJECUTA_MIGRACION_017_AHORA.md`
- **SQL listo para copiar**: `🔧_SQL_PARA_MIGRACIÓN_017.sql`

## 🔄 Próximos Pasos Después de Aplicar la Migración

1. Intenta crear un producto con categoría "Cocinas" desde el admin
2. Debería funcionar sin errores ✅
3. El backend está ya preparado (tiene el `.lower()`)
4. No hay cambios necesarios en el frontend

## ❓ Dudas

Si el SQL fallara, verifica en Supabase → Project Settings → Database que:
- La tabla `productos` existe
- La tabla `categorias` existe
- Hay categorías creadas (mínimo: `Electrodomesticos` y `Cocinas`)
