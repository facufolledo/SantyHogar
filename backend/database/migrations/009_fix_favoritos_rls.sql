-- Migration 009: Fix RLS for favoritos table (secure favorites)

-- Enable RLS on favoritos table
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all for service_role" ON public.favoritos;

-- Create new policies
-- Policy 1: Service role (backend) can see all
CREATE POLICY "service_role_access" ON public.favoritos
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Users can see their own favorites
CREATE POLICY "users_can_see_own_favorites" ON public.favoritos
    FOR SELECT
    USING (auth.uid()::text = id_cliente::text);

-- Policy 3: Users can insert their own favorites
CREATE POLICY "users_can_insert_own_favorites" ON public.favoritos
    FOR INSERT
    WITH CHECK (auth.uid()::text = id_cliente::text);

-- Policy 4: Users can delete their own favorites
CREATE POLICY "users_can_delete_own_favorites" ON public.favoritos
    FOR DELETE
    USING (auth.uid()::text = id_cliente::text);

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_favoritos_cliente_created ON public.favoritos(id_cliente, fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_favoritos_producto_cliente ON public.favoritos(id_producto, id_cliente);
