-- Fix timezone para tabla direcciones
-- Asegurar que fecha_creacion se guarde en Argentina timezone (UTC-3)

-- Primero, actualizar todas las direcciones existentes que tengan timestamp UTC
-- restando 3 horas a los que están fuera de rango correcto
UPDATE direcciones
SET fecha_creacion = fecha_creacion AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires'
WHERE fecha_creacion IS NOT NULL
  AND DATE_PART('hour', fecha_creacion AT TIME ZONE 'America/Argentina/Buenos_Aires') 
      != DATE_PART('hour', fecha_creacion AT TIME ZONE 'UTC');

-- Crear trigger para nuevas direcciones
DROP TRIGGER IF EXISTS trg_direcciones_set_fecha_creacion ON direcciones;

CREATE TRIGGER trg_direcciones_set_fecha_creacion
BEFORE INSERT ON direcciones
FOR EACH ROW
EXECUTE FUNCTION set_fecha_creacion_argentina();

-- Función auxiliar (si no existe)
CREATE OR REPLACE FUNCTION set_fecha_creacion_argentina()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fecha_creacion IS NULL THEN
    NEW.fecha_creacion := CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
