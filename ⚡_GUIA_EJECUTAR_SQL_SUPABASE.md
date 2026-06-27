# ⚡ Guía Paso a Paso - Ejecutar SQL en Supabase

## 🎯 Objetivo
Ejecutar la migración de categorías dinámicas en tu base de datos Supabase en 5 minutos.

---

## 📝 Requisitos

- ✅ Acceso a tu proyecto Supabase
- ✅ Permiso de admin en Supabase
- ✅ Archivo SQL listo: `SQL_CATEGORIAS_LISTA_SUPABASE.sql`

---

## 📋 Pasos a Seguir

### PASO 1: Abre Supabase Dashboard

1. Ve a: https://app.supabase.com
2. Haz login con tu cuenta
3. Selecciona tu proyecto: **santyhogar**

```
┌─────────────────────────────────┐
│ Supabase Dashboard              │
├─────────────────────────────────┤
│ Mis Proyectos:                  │
│ ├─ santyhogar ← AQUÍ             │
│ └─ otros_proyectos              │
└─────────────────────────────────┘
```

---

### PASO 2: Abre el SQL Editor

En el sidebar izquierdo, busca **SQL Editor** (o usa el acceso directo):

```
Sidebar Izquierdo:
├─ Home
├─ Project Settings
├─ Database
├─ SQL Editor ← AQUÍ
├─ Authentication
├─ Storage
└─ ...
```

Click en **SQL Editor**

```
┌──────────────────────────────────────┐
│ SQL EDITOR                           │
├──────────────────────────────────────┤
│ [New query] [Open]  [History]        │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ (Área de edición vacía)        │  │
│ │ SELECT * FROM ...             │  │
│ │                                │  │
│ │                                │  │
│ └────────────────────────────────┘  │
│                                      │
│            [RUN] (Ctrl+Enter)        │
└──────────────────────────────────────┘
```

---

### PASO 3: Crear Nueva Query

Click en el botón **[New query]** en la esquina superior izquierda.

Se abrirá una pestaña nueva con el editor vacío.

---

### PASO 4: Copiar el SQL

1. Abre en tu editor: `SQL_CATEGORIAS_LISTA_SUPABASE.sql`
   - Ubicación: `d:\Users\Facundo\Desktop\santyhogar\SQL_CATEGORIAS_LISTA_SUPABASE.sql`

2. **Selecciona TODO el contenido** (Ctrl+A)

3. **Copia** (Ctrl+C)

```
Archivo SQL:
┌─────────────────────────────────────────┐
│ -- 📂 SISTEMA DE CATEGORÍAS DINÁMICAS   │
│ --                                      │
│ -- Pasos para ejecutar en Supabase:     │
│ CREATE TABLE IF NOT EXISTS ...          │
│ ...                                     │
│ INSERT INTO public.categorias ...       │
│ ...                                     │
│ UPDATE public.productos ...             │
│ ...                                     │
└─────────────────────────────────────────┘
        ↓ Seleccionar TODO (Ctrl+A)
        ↓ Copiar (Ctrl+C)
```

---

### PASO 5: Pegar en Supabase

1. Click en el **área de edición** del SQL Editor (donde está vacío)

2. **Pega el contenido** (Ctrl+V)

Deberías ver:

```
SQL EDITOR:
┌────────────────────────────────────────────────────────────┐
│ -- ═══════════════════════════════════════════════════════  │
│ -- 📂 SISTEMA DE CATEGORÍAS DINÁMICAS - SQL LISTO          │
│ --                                                         │
│ CREATE TABLE IF NOT EXISTS public.categorias (             │
│     id_categoria UUID PRIMARY KEY DEFAULT gen_random_uuid()│
│     nombre VARCHAR(100) NOT NULL UNIQUE,                  │
│     ...                                                    │
│                                                            │
│ CREATE INDEX IF NOT EXISTS idx_categorias_nombre ON ...   │
│ ...                                                        │
│                                                            │
│ INSERT INTO public.categorias (nombre, descripcion, ...)   │
│ VALUES                                                     │
│     ('Electrodomésticos', ..., TRUE),                      │
│     ('Mueblería', ..., TRUE),                             │
│     ('Colchonería', ..., TRUE)                            │
│ ON CONFLICT (nombre) DO NOTHING;                          │
│                                                            │
│ UPDATE public.productos p                                 │
│ SET id_categoria = (                                       │
│     SELECT id_categoria FROM public.categorias c           │
│     WHERE c.slug = p.categoria                            │
│ )                                                          │
│ WHERE p.id_categoria IS NULL ...                          │
└────────────────────────────────────────────────────────────┘
```

✅ Se ven muchas líneas SQL en el editor

---

### PASO 6: Ejecutar el SQL

**Opción A: Click en el botón [RUN]**

En la esquina inferior derecha del editor, busca el botón azul **[RUN]**

```
┌────────────────────────────┐
│ ...SQL Editor...           │
│                            │
│                            │
│              [RUN] ← AQUÍ   │
└────────────────────────────┘
```

Click una sola vez.

**Opción B: Atajo de teclado**

Presiona **Ctrl+Enter** en el editor

---

### PASO 7: Esperar a que se ejecute

El SQL se ejecutará. Verás un indicador de carga:

```
┌─────────────────────────────────┐
│ ⟳ Ejecutando query...           │
│                                 │
│ (Espera 10-30 segundos)         │
└─────────────────────────────────┘
```

---

### PASO 8: Verificar el Resultado

Después de que se ejecute, verás uno de estos mensajes:

#### ✅ ÉXITO - Mensaje esperado:

```
┌────────────────────────────────────┐
│ ✓ Success                          │
│                                    │
│ No rows returned                   │
│ (La migración se ejecutó sin error)│
│                                    │
│ Query execution time: 1.234s       │
└────────────────────────────────────┘
```

**¡Perfecto! Puedes pasar a la Verificación Post-Migración.**

#### ❌ ERROR - Si algo falla:

Verás un mensaje como:

```
┌────────────────────────────────────────────┐
│ ✗ Error                                    │
│                                            │
│ ERROR: 42P01: relation "xyz" does not exist│
│ at character 1234                          │
│                                            │
│ Query execution time: 0.234s                │
└────────────────────────────────────────────┘
```

**→ Ve a la sección "Troubleshooting" al final de este documento**

---

## ✅ Verificación Post-Migración (IMPORTANTE)

Después de ejecutar el SQL exitosamente, verifica que todo está bien.

### Verificación 1: Ver Categorías Creadas

1. Click en **[New query]** para crear una query nueva
2. Pega este SQL:

```sql
SELECT id_categoria, nombre, slug, color, icono, orden, activo 
FROM public.categorias 
ORDER BY orden;
```

3. Click **[RUN]** (Ctrl+Enter)

**Resultado esperado:**

```
┌─────────────────────────────────────────────────────────┐
│ RESULTADOS:                                             │
│                                                         │
│ id_categoria        │ nombre          │ slug      │ orden│
├─────────────────────────────────────────────────────────┤
│ 550e8400-e29b...    │ Electrodomésticos│ electrodomesticos│ 1  │
│ 6ba7b810-9dad...    │ Mueblería       │ muebleria │ 2  │
│ 6ba7b811-9dad...    │ Colchonería     │ colchoneria│ 3  │
└─────────────────────────────────────────────────────────┘

Rows: 3
```

✅ Si ves 3 filas → Está bien

---

### Verificación 2: Contar Productos con Categoría

Crea otra query:

```sql
SELECT COUNT(*) as total_productos_con_categoria
FROM public.productos 
WHERE id_categoria IS NOT NULL;
```

**Resultado esperado:**

```
┌──────────────────────────────────┐
│ total_productos_con_categoria    │
├──────────────────────────────────┤
│ 13                               │
└──────────────────────────────────┘

(O el número total de productos que tengas)
```

✅ Si ves un número > 0 → Los productos están vinculados

---

### Verificación 3: Ver Ejemplo de Producto + Categoría

Crea otra query:

```sql
SELECT p.nombre, c.nombre as categoria_nombre, c.slug
FROM public.productos p
LEFT JOIN public.categorias c ON p.id_categoria = c.id_categoria
LIMIT 5;
```

**Resultado esperado:**

```
┌────────────────────────────────────────────────────┐
│ nombre              │ categoria_nombre │ slug       │
├────────────────────────────────────────────────────┤
│ Lavarropas 8kg      │ Electrodomésticos│ electrodo..│
│ Heladera 400L       │ Electrodomésticos│ electrodo..│
│ Sillón 3 Cuerpos    │ Mueblería       │ muebleria   │
│ Mesa Comedor        │ Mueblería       │ muebleria   │
│ Colchón Resortes    │ Colchonería     │ colchoneri..│
└────────────────────────────────────────────────────┘
```

✅ Si ves productos + categorías correctas → Migración exitosa

---

## 🔧 Troubleshooting

### Error 1: "relation does not exist"

```
ERROR: 42P01: relation "categorias" does not exist
```

**Solución:** Este error indica que la tabla no se creó. Posibles causas:

1. Reintentar la migración completa
2. Si persiste, ejecutar solo la parte de crear tabla:

```sql
CREATE TABLE IF NOT EXISTS public.categorias (
    id_categoria UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    slug VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7),
    icono VARCHAR(50),
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### Error 2: "duplicate key value violates unique constraint"

```
ERROR: 23505: duplicate key value violates unique constraint "categorias_nombre_key"
```

**Causa:** Las categorías ya existen (migración ejecutada antes)

**Solución:** Esto es NORMAL si ya corriste la migración.
- Las queries tienen `ON CONFLICT ... DO NOTHING` para evitar esto
- Si ves este error, significa que tus categorías ya están en BD ✓

Verifica con:
```sql
SELECT COUNT(*) FROM public.categorias;
```

---

### Error 3: "column does not exist"

```
ERROR: 42703: column "id_categoria" does not exist
```

**Causa:** La columna no se agregó a tabla productos

**Solución:** Ejecutar solo esta línea:

```sql
ALTER TABLE public.productos
ADD COLUMN IF NOT EXISTS id_categoria UUID REFERENCES public.categorias(id_categoria) ON DELETE SET NULL;
```

---

### Error 4: "syntax error"

```
ERROR: 42601: syntax error at or near "CREATE"
```

**Causa:** Caracteres especiales o formato corrupto

**Solución:** 
1. Copiar el SQL nuevamente desde el archivo `.sql`
2. Pegar en Supabase
3. Ejecutar

---

## 📊 Casos Especiales

### Caso 1: Ya tengo categorías en BD

Si por algún motivo ya hay datos en tabla `categorias`:

```sql
-- Ver categorías existentes
SELECT * FROM public.categorias;

-- Si hay duplicados, hacer limpieza:
DELETE FROM public.categorias WHERE nombre NOT IN ('Electrodomésticos', 'Mueblería', 'Colchonería');
```

---

### Caso 2: Los productos no tienen datos migrarse

Si después de ejecutar el SQL, algunos productos NO tienen `id_categoria`:

```sql
-- Ver cuántos faltan
SELECT COUNT(*) FROM public.productos WHERE id_categoria IS NULL;

-- Migrar manualmente
UPDATE public.productos p
SET id_categoria = (
    SELECT id_categoria FROM public.categorias c
    WHERE c.slug = p.categoria
)
WHERE p.id_categoria IS NULL 
  AND p.categoria IN ('electrodomesticos', 'muebleria', 'colchoneria');
```

---

## ✨ Después de Ejecutar Exitosamente

✅ Base de datos lista

Ahora puedes:

1. **Opción A:** Decirme que la ejecutaste y yo implemento el backend
2. **Opción B:** Implementar el backend tú mismo usando la documentación
3. **Opción C:** Implementar todo juntos paso a paso

**¿Cuál prefieres?**

---

## 📞 Soporte

Si algo no funciona:

1. Verifica los queries de verificación arriba
2. Revisa la sección "Troubleshooting"
3. Comparte el mensaje de error exacto

---

## ✅ Checklist Final

```
□ Abierto Supabase Dashboard
□ Abierto SQL Editor
□ Copiado SQL del archivo
□ Pegado en Supabase
□ Clickeado [RUN] o Ctrl+Enter
□ Visto "Success. No rows returned."
□ Ejecutada Verificación 1: Ver 3 categorías
□ Ejecutada Verificación 2: Contar productos con categoría
□ Ejecutada Verificación 3: Ver productos + categorías
□ Todo muestra datos correctos

✅ MIGRACIÓN EXITOSA
```

---

**Estado:** 🟢 Listo para ejecutar  
**Tiempo estimado:** 5 minutos  
**Dificultad:** Muy fácil (solo copiar/pegar)

¡Adelante! 🚀

