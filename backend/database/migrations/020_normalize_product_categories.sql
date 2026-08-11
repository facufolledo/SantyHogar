-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN 020: Normalizar categorías en productos importados
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- Problema: Durante la importación masiva, algunos productos recibieron UUID's
-- incorrectos en el campo id_categoria en lugar del slug correcto en categoria.
-- 
-- Solución: Actualizar todos los productos con categorías inválidas para que
-- apunten a los id_categoria correctos de la tabla categorias.
--

-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 1: Ver productos sin categoría válida (diagnóstico)
-- ───────────────────────────────────────────────────────────────────────────────

-- SELECT COUNT(*) as productos_sin_categoria
-- FROM public.productos
-- WHERE id_categoria IS NULL;

-- SELECT COUNT(*) as productos_con_categoria_valida
-- FROM public.productos p
-- LEFT JOIN public.categorias c ON p.id_categoria = c.id_categoria
-- WHERE p.id_categoria IS NOT NULL AND c.id_categoria IS NULL;


-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 2: Actualizar productos con categoría NULL para que usen "electrodomesticos"
-- ───────────────────────────────────────────────────────────────────────────────

UPDATE public.productos p
SET id_categoria = (
    SELECT id_categoria FROM public.categorias c
    WHERE c.slug = 'electrodomesticos'
    LIMIT 1
)
WHERE p.id_categoria IS NULL;

-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 3: Corregir productos con id_categoria que no existe en categorias
-- ───────────────────────────────────────────────────────────────────────────────

-- Para cada producto con id_categoria inválido, intentar mapear por el campo categoria (string)
UPDATE public.productos p
SET id_categoria = (
    SELECT id_categoria FROM public.categorias c
    WHERE c.slug = p.categoria
    LIMIT 1
)
WHERE p.id_categoria IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.categorias c 
    WHERE c.id_categoria = p.id_categoria
  )
  AND p.categoria IN ('electrodomesticos', 'muebleria', 'colchoneria', 'cocinas', 'smart-32');

-- Si aún hay productos sin categoría válida, usar "electrodomesticos" por defecto
UPDATE public.productos p
SET id_categoria = (
    SELECT id_categoria FROM public.categorias c
    WHERE c.slug = 'electrodomesticos'
    LIMIT 1
)
WHERE p.id_categoria IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.categorias c 
    WHERE c.id_categoria = p.id_categoria
  );

-- ───────────────────────────────────────────────────────────────────────────────
-- PASO 4: Verificar resultados
-- ───────────────────────────────────────────────────────────────────────────────

-- SELECT 
--   p.nombre,
--   p.categoria as categoria_antigua,
--   c.nombre as categoria_nombre,
--   c.slug as categoria_slug,
--   p.id_categoria
-- FROM public.productos p
-- LEFT JOIN public.categorias c ON p.id_categoria = c.id_categoria
-- ORDER BY p.fecha_creacion DESC
-- LIMIT 20;

-- Contar productos por categoría después de la normalización:
-- SELECT 
--   c.nombre,
--   COUNT(p.id_producto) as total_productos
-- FROM public.categorias c
-- LEFT JOIN public.productos p ON c.id_categoria = p.id_categoria
-- GROUP BY c.id_categoria, c.nombre
-- ORDER BY c.orden;
