-- Migración 017: Remover CHECK CONSTRAINT hardcodeado
-- Solo remover el constraint que bloquea categorías dinámicas

ALTER TABLE IF EXISTS public.productos 
DROP CONSTRAINT IF EXISTS productos_categoria_check;
