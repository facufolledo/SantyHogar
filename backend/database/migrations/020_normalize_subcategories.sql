-- Migración 020: Normalizar subcategorías a lowercase
-- Esto asegura consistencia en la BD sin discriminar "Cocinas" vs "cocinas"

-- Actualizar todas las subcategorías a lowercase
UPDATE public.productos
SET subcategoria = LOWER(TRIM(subcategoria))
WHERE subcategoria IS NOT NULL
  AND subcategoria != LOWER(TRIM(subcategoria));

-- Verificación (descomentar para ejecutar después):
-- SELECT DISTINCT subcategoria FROM public.productos ORDER BY subcategoria;
