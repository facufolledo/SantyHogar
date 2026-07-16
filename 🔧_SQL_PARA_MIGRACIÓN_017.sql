-- Migración 017: Remover CHECK CONSTRAINT hardcodeado
ALTER TABLE IF EXISTS public.productos 
DROP CONSTRAINT IF EXISTS productos_categoria_check;
