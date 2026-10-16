-- Migration 007: Create tables for addresses (direcciones) and favorites (favoritos)

CREATE TABLE IF NOT EXISTS public.direcciones (
    id_direccion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_cliente UUID NOT NULL REFERENCES public.clientes(id_cliente) ON DELETE CASCADE,
    etiqueta VARCHAR(50) NOT NULL,
    calle TEXT NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(20) NOT NULL,
    es_principal BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.favoritos (
    id_cliente UUID NOT NULL REFERENCES public.clientes(id_cliente) ON DELETE CASCADE,
    id_producto UUID NOT NULL REFERENCES public.productos(id_producto) ON DELETE CASCADE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id_cliente, id_producto)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_direcciones_cliente ON public.direcciones(id_cliente);
CREATE INDEX IF NOT EXISTS idx_favoritos_cliente ON public.favoritos(id_cliente);
CREATE INDEX IF NOT EXISTS idx_favoritos_producto ON public.favoritos(id_producto);

-- Disable RLS for service_role access (consistent with other tables)
ALTER TABLE public.direcciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service_role" ON public.direcciones
    FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service_role" ON public.favoritos
    FOR ALL USING (true) WITH CHECK (true);
