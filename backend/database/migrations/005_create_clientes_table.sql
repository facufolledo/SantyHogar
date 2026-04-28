-- Migración 005: Crear tabla de clientes
-- Fecha: 2026-04-27
-- Descripción: Tabla para almacenar información de clientes registrados

CREATE TABLE IF NOT EXISTS public.clientes (
    id_cliente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(50),
    direccion TEXT,
    ciudad VARCHAR(100),
    provincia VARCHAR(100),
    codigo_postal VARCHAR(20),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_gastado DECIMAL(10, 2) DEFAULT 0,
    cantidad_ordenes INTEGER DEFAULT 0,
    notas TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON public.clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_fecha_registro ON public.clientes(fecha_registro DESC);
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON public.clientes(activo);

-- Trigger para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION update_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_clientes_timestamp
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_clientes_updated_at();

-- Agregar columna id_cliente a la tabla ordenes (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ordenes' AND column_name = 'id_cliente'
    ) THEN
        ALTER TABLE public.ordenes ADD COLUMN id_cliente UUID;
        
        -- Crear índice para la relación
        CREATE INDEX idx_ordenes_id_cliente ON public.ordenes(id_cliente);
        
        -- Agregar foreign key
        ALTER TABLE public.ordenes 
        ADD CONSTRAINT fk_ordenes_cliente 
        FOREIGN KEY (id_cliente) 
        REFERENCES public.clientes(id_cliente) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Comentarios para documentación
COMMENT ON TABLE public.clientes IS 'Tabla de clientes registrados en el sistema';
COMMENT ON COLUMN public.clientes.id_cliente IS 'Identificador único del cliente (UUID)';
COMMENT ON COLUMN public.clientes.email IS 'Email del cliente (único)';
COMMENT ON COLUMN public.clientes.total_gastado IS 'Total acumulado de compras del cliente';
COMMENT ON COLUMN public.clientes.cantidad_ordenes IS 'Cantidad total de órdenes realizadas';
COMMENT ON COLUMN public.clientes.activo IS 'Indica si el cliente está activo en el sistema';
