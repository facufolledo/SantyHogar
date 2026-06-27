-- ═══════════════════════════════════════════════════════════════════════════════
-- 📂 SISTEMA DE CATEGORÍAS DINÁMICAS - SQL LISTO PARA SUPABASE
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- Pasos para ejecutar en Supabase:
-- 1. Ir a: https://app.supabase.com → SQL Editor
-- 2. Click en "New query"
-- 3. Copiar TODO el contenido de este archivo
-- 4. Click en "Run" (Ctrl+Enter)
-- 5. Verificar "Success. No rows returned." o mensaje de éxito
--
-- Si hay errores, revisar la sección de "TROUBLESHOOTING" al final
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 1: CREAR TABLA categorias
-- ───────────────────────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 2: CREAR ÍNDICES EN categorias (Performance)
-- ───────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_categorias_nombre ON public.categorias (nombre);
CREATE INDEX IF NOT EXISTS idx_categorias_slug ON public.categorias (slug);
CREATE INDEX IF NOT EXISTS idx_categorias_activo ON public.categorias (activo);
CREATE INDEX IF NOT EXISTS idx_categorias_orden ON public.categorias (orden);

-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 3: CREAR TRIGGER para actualizar fecha_actualizacion automáticamente
-- ───────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_categorias_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.fecha_actualizacion := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_categorias_set_updated_at ON public.categorias;
CREATE TRIGGER trg_categorias_set_updated_at
    BEFORE UPDATE ON public.categorias
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_categorias_updated_at();

-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 4: AGREGAR COLUMNA id_categoria A TABLA productos
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.productos
ADD COLUMN IF NOT EXISTS id_categoria UUID REFERENCES public.categorias(id_categoria) ON DELETE SET NULL;

-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 5: CREAR ÍNDICES EN productos PARA PERFORMANCE
-- ───────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_productos_id_categoria ON public.productos (id_categoria);
CREATE INDEX IF NOT EXISTS idx_productos_categoria_destacado ON public.productos (id_categoria, destacado);
CREATE INDEX IF NOT EXISTS idx_productos_categoria_stock ON public.productos (id_categoria, stock) WHERE stock > 0;

-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 6: INSERTAR CATEGORÍAS PREDETERMINADAS
-- ───────────────────────────────────────────────────────────────────────────────
-- Las tres categorías que existían como Literal ahora son registros en BD
-- ON CONFLICT evita duplicados si esta migración se ejecuta multiple veces
INSERT INTO public.categorias (nombre, descripcion, slug, color, icono, orden, activo)
VALUES 
    ('Electrodomésticos', 'Electrodomésticos y equipos para el hogar', 'electrodomesticos', '#3B82F6', 'zap', 1, TRUE),
    ('Mueblería', 'Muebles para todos los ambientes de tu hogar', 'muebleria', '#8B5CF6', 'home', 2, TRUE),
    ('Colchonería', 'Colchones, sommiers y accesorios de descanso', 'colchoneria', '#EC4899', 'moon', 3, TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 7: MIGRAR DATOS - ASIGNAR id_categoria A PRODUCTOS EXISTENTES
-- ───────────────────────────────────────────────────────────────────────────────
-- Esta query vincula cada producto existente con su categoría correcta
-- usando el slug como puente entre categoria antigua (string) y nueva (FK)
UPDATE public.productos p
SET id_categoria = (
    SELECT id_categoria FROM public.categorias c
    WHERE c.slug = p.categoria
)
WHERE p.id_categoria IS NULL 
AND p.categoria IN ('electrodomesticos', 'muebleria', 'colchoneria');

-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ FIN DE LA MIGRACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- VERIFICACIONES POST-MIGRACIÓN (ejecutar después de que la migración sea exitosa):
--
-- 1. Ver las categorías creadas:
--    SELECT id_categoria, nombre, slug, color, icono, orden, activo 
--    FROM public.categorias 
--    ORDER BY orden;
--
-- 2. Ver cuántos productos tienen categoría asignada:
--    SELECT COUNT(*) as productos_con_categoria 
--    FROM public.productos 
--    WHERE id_categoria IS NOT NULL;
--
-- 3. Ver un producto con sus datos de categoría:
--    SELECT p.nombre, c.nombre as categoria 
--    FROM public.productos p
--    LEFT JOIN public.categorias c ON p.id_categoria = c.id_categoria
--    LIMIT 5;
--
-- 4. Ver resumen de productos por categoría:
--    SELECT c.nombre, COUNT(p.id_producto) as total_productos
--    FROM public.categorias c
--    LEFT JOIN public.productos p ON c.id_categoria = p.id_categoria
--    GROUP BY c.id_categoria, c.nombre
--    ORDER BY c.orden;
--
-- ═══════════════════════════════════════════════════════════════════════════════
