# 🎯 SOLUCIÓN EN 1 MINUTO

## El Problema
Cuando intentas guardar un producto con categoría "Cocinas":
```
Error: violates check constraint "productos_categoria_check"
```

## La Causa
La tabla `productos` rechaza categorías que no estén en esta lista:
- electrodomesticos ✅
- muebleria ✅
- colchoneria ✅
- Cocinas ❌ ← RECHAZADO

## La Solución (3 pasos de 20 segundos cada uno)

### Paso 1: Abre Supabase
```
https://app.supabase.com/project/gsvtcrscojbfhgixxquw/sql/new
```

### Paso 2: Ejecuta esto
```sql
ALTER TABLE IF EXISTS public.productos 
DROP CONSTRAINT IF EXISTS productos_categoria_check;
```

### Paso 3: Click "Run"

## ✅ Listo
Ahora SantyHogar acepta cualquier categoría.

---

## Qué cambió en el código

**backend/app/routes/products.py:**
- ❌ Antes: Búsqueda de nombre de categoría + conversión a minúsculas + complejidad
- ✅ Ahora: Simplemente insertar `id_categoria`

**Resultado**: Más simple, más rápido.
