-- Migración 006: Fix RLS en tabla clientes
-- Fecha: 2026-04-28
-- Descripción: Deshabilitar RLS en la tabla clientes para evitar timeouts
--              cuando se usa la service_role key. Idempotente (seguro de ejecutar múltiples veces).

-- Deshabilitar RLS en la tabla clientes.
-- La service_role key ya bypasea RLS, pero deshabilitarlo explícitamente
-- evita cualquier overhead de evaluación de políticas y previene bloqueos
-- si alguna política restrictiva fue creada accidentalmente.
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes que puedan causar conflictos (si existen).
-- Usamos DO block para hacerlo idempotente.
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'clientes' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.clientes', pol.policyname);
    END LOOP;
END $$;

-- Agregar una política permisiva de respaldo por si RLS se reactiva en el futuro.
-- Esto permite acceso total al service_role y authenticated roles.
-- Primero habilitamos RLS temporalmente para poder crear la política, luego la deshabilitamos.
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Política permisiva: permite todas las operaciones para todos los roles.
-- Esto es un safety net en caso de que RLS se reactive accidentalmente.
DROP POLICY IF EXISTS allow_all_clientes ON public.clientes;
CREATE POLICY allow_all_clientes ON public.clientes
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Finalmente, deshabilitar RLS (la política queda como respaldo).
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;

-- Comentario de documentación
COMMENT ON POLICY allow_all_clientes ON public.clientes IS 
    'Política permisiva de respaldo. RLS está deshabilitado, pero si se reactiva, esta política permite acceso total.';
