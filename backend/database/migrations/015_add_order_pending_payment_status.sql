-- Agregar campos para manejar órdenes pendientes de pago con expiración
-- Estado: pendiente_pago → pagada → entregada/cancelada
-- Expiración: 2 horas desde creación si no paga

-- 1. Agregar columnas si no existen
ALTER TABLE ordenes 
ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'pendiente_pago',
ADD COLUMN IF NOT EXISTS fecha_expiracion_pago TIMESTAMP,
ADD COLUMN IF NOT EXISTS id_preferencia_mp TEXT;

-- 2. Index para el job de cancelación
CREATE INDEX IF NOT EXISTS idx_ordenes_estado_expiracion 
ON ordenes(estado, fecha_expiracion_pago) 
WHERE estado = 'pendiente_pago';

-- 3. Comentarios explicativos
COMMENT ON COLUMN ordenes.estado IS 'pendiente_pago: esperando confirmación de pago | pagada: pago confirmado | cancelada: orden cancelada/expirada';
COMMENT ON COLUMN ordenes.fecha_expiracion_pago IS 'Timestamp de expiración (NOW + 2 horas). NULL si ya pagó.';
COMMENT ON COLUMN ordenes.id_preferencia_mp IS 'ID de la preferencia/link de pago en Mercado Pago (para reintentos)';
