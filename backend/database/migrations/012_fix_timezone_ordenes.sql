-- Fix timezone for ordenes table
-- Set fecha_creacion to use Argentina timezone (UTC-3) at insertion time

DROP TRIGGER IF EXISTS trg_ordenes_set_fecha_creacion ON public.ordenes;
DROP FUNCTION IF EXISTS public.set_ordenes_fecha_creacion();

-- Function to set fecha_creacion with Argentina timezone
CREATE OR REPLACE FUNCTION public.set_ordenes_fecha_creacion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only set if not already provided
    IF NEW.fecha_creacion IS NULL THEN
        NEW.fecha_creacion := NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires';
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger to call the function before INSERT
CREATE TRIGGER trg_ordenes_set_fecha_creacion
    BEFORE INSERT ON public.ordenes
    FOR EACH ROW
    EXECUTE PROCEDURE public.set_ordenes_fecha_creacion();
