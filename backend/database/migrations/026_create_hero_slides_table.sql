-- Migración 026: Tabla de Hero Slides / Promociones
-- Tabla independiente para gestionar los banners/carouseles del home

CREATE TABLE IF NOT EXISTS public.hero_slides (
    id_hero UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(100) NOT NULL,
    subtitulo VARCHAR(200),
    texto_cta VARCHAR(100),
    imagen_url TEXT NOT NULL,
    enlace VARCHAR(255),
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_hero_slides_orden ON public.hero_slides (orden);
CREATE INDEX IF NOT EXISTS idx_hero_slides_activo ON public.hero_slides (activo);
CREATE INDEX IF NOT EXISTS idx_hero_slides_fecha ON public.hero_slides (fecha_inicio, fecha_fin);

-- Trigger para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION public.set_hero_slides_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.fecha_actualizacion := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hero_slides_set_updated_at ON public.hero_slides;
CREATE TRIGGER trg_hero_slides_set_updated_at
    BEFORE UPDATE ON public.hero_slides
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_hero_slides_updated_at();
