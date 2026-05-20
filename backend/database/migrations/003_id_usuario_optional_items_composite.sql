-- Incremental: id_usuario opcional + índice compuesto items (orden, producto).
-- Para bases creadas antes de estos cambios. Índice compuesto: IF NOT EXISTS.

ALTER TABLE public.ordenes ALTER COLUMN id_usuario DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_items_orden_orden_producto
    ON public.items_orden (id_orden, id_producto);
