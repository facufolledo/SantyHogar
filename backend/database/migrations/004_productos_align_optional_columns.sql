-- Opcional: si `productos` tiene solo algunas columnas, podés alinear con el esquema completo.
-- El backend ya tolera columnas faltantes; esto es para datos ricos (imágenes, stock, etc.).
-- Ejecutar en Supabase → SQL Editor.

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS imagenes JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS descripcion TEXT;

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS especificaciones JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS destacado BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS marca VARCHAR(100) NOT NULL DEFAULT '';

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS calificacion DECIMAL(2, 1) NOT NULL DEFAULT 0;

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS cantidad_resenas INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
