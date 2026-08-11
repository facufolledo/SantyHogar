-- Fix: Actualizar CHECK constraint de la tabla ordenes para permitir nuevos estados
-- Los valores permitidos ahora son: pending, pendiente_pago, pagada, processing, ready, delivered, cancelled

-- Primero, eliminar el constraint viejo
ALTER TABLE ordenes 
DROP CONSTRAINT IF EXISTS ordenes_estado_check;

-- Agregar nuevo constraint con todos los valores permitidos
ALTER TABLE ordenes 
ADD CONSTRAINT ordenes_estado_check 
CHECK (estado IN ('pending', 'pendiente_pago', 'pagada', 'processing', 'ready', 'delivered', 'cancelled'));

-- Opcional: Actualizar órdenes antiguas con estado 'pending' a 'pendiente_pago' para consistencia
-- (Comentado para no cambiar datos existentes sin autorización)
-- UPDATE ordenes SET estado = 'pendiente_pago' WHERE estado = 'pending' AND fecha_expiracion_pago IS NULL;
