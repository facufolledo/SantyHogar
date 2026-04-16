-- Esquema inicial: productos, ordenes, items_orden
-- PKs y FKs de entidades: UUID (gen_random_uuid). id_usuario TEXT opcional (sin login).
-- Ejecutar en Supabase: SQL Editor -> New query -> Run
--
-- Si ya creaste tablas con una versión anterior, en desarrollo podés:
--   DROP TABLE IF EXISTS public.items_orden, public.ordenes, public.productos CASCADE;
-- y volver a ejecutar este script; o aplicá también 002_order_enhancements.sql sobre tablas existentes.

-- ---------------------------------------------------------------------------
-- productos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.productos (
    id_producto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL
        CHECK (categoria IN ('electrodomesticos', 'muebleria', 'colchoneria')),
    subcategoria VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    precio_original DECIMAL(10, 2) CHECK (precio_original IS NULL OR precio_original >= 0),
    imagenes JSONB NOT NULL,
    descripcion TEXT,
    especificaciones JSONB,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    destacado BOOLEAN NOT NULL DEFAULT FALSE,
    marca VARCHAR(100) NOT NULL,
    calificacion DECIMAL(2, 1) NOT NULL DEFAULT 0
        CHECK (calificacion >= 0 AND calificacion <= 5),
    cantidad_resenas INTEGER NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_slug ON public.productos (slug);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos (categoria);
CREATE INDEX IF NOT EXISTS idx_productos_destacado ON public.productos (destacado);

-- ---------------------------------------------------------------------------
-- ordenes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ordenes (
    id_orden UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario TEXT,
    nombre_cliente VARCHAR(255) NOT NULL,
    email_cliente VARCHAR(255) NOT NULL,
    telefono_cliente VARCHAR(50) NOT NULL,
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('mp', 'fiserv')),
    estado VARCHAR(50) NOT NULL DEFAULT 'pending'
        CONSTRAINT ordenes_estado_check CHECK (estado IN ('pending', 'paid', 'cancelled')),
    id_preferencia VARCHAR(255),
    payment_id TEXT,
    numero_orden VARCHAR(50) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ordenes_id_preferencia
    ON public.ordenes (id_preferencia)
    WHERE id_preferencia IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ordenes_payment_id
    ON public.ordenes (payment_id)
    WHERE payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ordenes_numero_orden ON public.ordenes (numero_orden);

CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON public.ordenes (estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_id_usuario ON public.ordenes (id_usuario);

-- updated_at en cada UPDATE
CREATE OR REPLACE FUNCTION public.set_ordenes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ordenes_set_updated_at ON public.ordenes;
CREATE TRIGGER trg_ordenes_set_updated_at
    BEFORE UPDATE ON public.ordenes
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_ordenes_updated_at();

-- ---------------------------------------------------------------------------
-- items_orden
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.items_orden (
    id_item UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_orden UUID NOT NULL REFERENCES public.ordenes (id_orden) ON DELETE CASCADE,
    id_producto UUID NOT NULL REFERENCES public.productos (id_producto),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0)
);

CREATE INDEX IF NOT EXISTS idx_items_orden_id_orden ON public.items_orden (id_orden);
CREATE INDEX IF NOT EXISTS idx_items_orden_id_producto ON public.items_orden (id_producto);
CREATE INDEX IF NOT EXISTS idx_items_orden_orden_producto
    ON public.items_orden (id_orden, id_producto);
