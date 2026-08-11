-- Agregar columna image_url a la tabla categorias
ALTER TABLE public.categorias
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- Comentario sobre la columna
COMMENT ON COLUMN public.categorias.image_url IS 'URL de la imagen principal de la categoría (subida por admin)';
