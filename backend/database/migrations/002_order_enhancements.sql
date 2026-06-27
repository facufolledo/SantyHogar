-- Incremental: mejoras en ordenes (si ya tenías tablas sin estas columnas / checks).
-- Ejecutar después de una versión vieja de 001, o ignorar si usás solo el 001 actualizado.

ALTER TABLE public.ordenes ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.ordenes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Asegurá que no haya filas con estado inválido antes de agregar el CHECK.
ALTER TABLE public.ordenes DROP CONSTRAINT IF EXISTS ordenes_estado_check;
ALTER TABLE public.ordenes
    ADD CONSTRAINT ordenes_estado_check CHECK (estado IN ('pending', 'paid', 'cancelled'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_ordenes_payment_id
    ON public.ordenes (payment_id)
    WHERE payment_id IS NOT NULL;

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
