-- Migration 024: Add product visibility control
-- Adds 'visible' column to productos table to allow admin to show/hide products from customers

ALTER TABLE public.productos
ADD COLUMN visible BOOLEAN NOT NULL DEFAULT TRUE;

-- Create index for visibility filtering in customer views
CREATE INDEX IF NOT EXISTS idx_productos_visible ON public.productos (visible);

-- Comment explaining the column
COMMENT ON COLUMN public.productos.visible IS 'Controls whether the product is visible to customers in listings. Admin can toggle this to show/hide products without deleting them.';
