-- Migración 011: Sistema de Categorías Dinámicas
-- Permite que los administradores creen, actualicen y eliminen categorías
-- Las categorías se relacionan 1-a-N con productos (un producto tiene una categoría)

-- ---------------------------------------------------------------------------
-- TABLA: categorias
-- Almacena todas las categorías disponibles en el sistema
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categorias (
    id_categoria UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    slug VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7),  -- Color hexadecimal (ej: #FF5733) para UI
    icono VARCHAR(50),  -- Nombre del icono (ej: "shopping-cart") para UI
    orden INTEGER NOT NULL DEFAULT 0,  -- Para ordenar categorías en frontend
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas y relaciones
CREATE INDEX IF NOT EXISTS idx_categorias_nombre ON public.categorias (nombre);
CREATE INDEX IF NOT EXISTS idx_categorias_slug ON public.categorias (slug);
CREATE INDEX IF NOT EXISTS idx_categorias_activo ON public.categorias (activo);
CREATE INDEX IF NOT EXISTS idx_categorias_orden ON public.categorias (orden);

-- Trigger para actualizar fecha_actualizacion automáticamente
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

-- ---------------------------------------------------------------------------
-- MODIFICACIÓN: Agregar columna id_categoria a tabla productos
-- Inicialmente permitimos NULL para compatibilidad con datos existentes
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.productos
ADD COLUMN IF NOT EXISTS id_categoria UUID REFERENCES public.categorias(id_categoria) ON DELETE SET NULL;

-- Índice para búsquedas por categoría
CREATE INDEX IF NOT EXISTS idx_productos_id_categoria ON public.productos (id_categoria);

-- Índice compuesto para queries comunes (categoria + destacado)
CREATE INDEX IF NOT EXISTS idx_productos_categoria_destacado 
    ON public.productos (id_categoria, destacado);

-- Índice compuesto para búsquedas de stock
CREATE INDEX IF NOT EXISTS idx_productos_categoria_stock 
    ON public.productos (id_categoria, stock) 
    WHERE stock > 0;

-- ---------------------------------------------------------------------------
-- MIGRACIÓN DE DATOS: Crear categorías predeterminadas basadas en valores actuales
-- y asignarlas a productos existentes
-- ---------------------------------------------------------------------------

-- Insertar las tres categorías predeterminadas del sistema actual
INSERT INTO public.categorias (nombre, descripcion, slug, color, icono, orden, activo)
VALUES 
    ('Electrodomésticos', 'Electrodomésticos y equipos para el hogar', 'electrodomesticos', '#3B82F6', 'zap', 1, TRUE),
    ('Mueblería', 'Muebles para todos los ambientes de tu hogar', 'muebleria', '#8B5CF6', 'home', 2, TRUE),
    ('Colchonería', 'Colchones, sommiers y accesorios de descanso', 'colchoneria', '#EC4899', 'moon', 3, TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- Actualizar productos existentes para referenciar las nuevas categorías
-- Esta query usa la categoría antigua (string) para encontrar el id_categoria correspondiente
UPDATE public.productos p
SET id_categoria = (
    SELECT id_categoria FROM public.categorias c
    WHERE c.slug = p.categoria
)
WHERE p.id_categoria IS NULL AND p.categoria IN ('electrodomesticos', 'muebleria', 'colchoneria');

-- ---------------------------------------------------------------------------
-- NOTA IMPORTANTE PARA DESARROLLO FUTURO:
-- 
-- Después de ejecutar esta migración exitosamente, se pueden hacer cambios adicionales:
-- 
-- 1. CAMBIAR TIPO DE DATO EN PRODUCTOS (después de verificar que todos tengan id_categoria):
--    ALTER TABLE public.productos DROP COLUMN categoria;
--    ALTER TABLE public.productos RENAME COLUMN id_categoria TO categoria;
--
-- 2. AGREGAR CONSTRAINT NOT NULL (opcional, si queremos que todo producto tenga categoría):
--    ALTER TABLE public.productos ALTER COLUMN id_categoria SET NOT NULL;
--
-- 3. PARA VERSIONAMIENTO, CREAR TABLA DE AUDITORÍA (opcional):
--    CREATE TABLE IF NOT EXISTS public.categorias_audit AS
--    SELECT * FROM public.categorias WHERE FALSE;
--
-- Estos cambios NO se incluyen en esta migración para mantener compatibilidad y seguridad.
-- ---------------------------------------------------------------------------
