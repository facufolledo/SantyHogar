-- Migration: 023_enable_row_level_security.sql
-- Purpose: Enable RLS on all user-related tables for security
-- Date: 2026-08-11
-- CRITICAL: Run this in Supabase SQL Editor

-- ============================================================================
-- PASO 1: HABILITAR RLS EN TABLAS
-- ============================================================================

-- Órdenes: Solo usuarios ven sus propias órdenes
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_orders" ON ordenes
  FOR SELECT
  USING (auth.uid()::text = id_usuario OR id_usuario IS NULL);

CREATE POLICY "users_create_own_orders" ON ordenes
  FOR INSERT
  WITH CHECK (auth.uid()::text = id_usuario);

CREATE POLICY "admins_manage_all_orders" ON ordenes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.user_metadata->>'role' = 'admin'
    )
  );

-- Direcciones: Solo usuarios ven sus propias direcciones
ALTER TABLE direcciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_addresses" ON direcciones
  FOR SELECT
  USING (auth.uid()::text = id_cliente);

CREATE POLICY "users_create_own_addresses" ON direcciones
  FOR INSERT
  WITH CHECK (auth.uid()::text = id_cliente);

CREATE POLICY "users_update_own_addresses" ON direcciones
  FOR UPDATE
  USING (auth.uid()::text = id_cliente)
  WITH CHECK (auth.uid()::text = id_cliente);

CREATE POLICY "users_delete_own_addresses" ON direcciones
  FOR DELETE
  USING (auth.uid()::text = id_cliente);

-- Favoritos: Solo usuarios ven sus propios favoritos
ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_favorites" ON favoritos
  FOR SELECT
  USING (auth.uid()::text = id_cliente);

CREATE POLICY "users_manage_own_favorites" ON favoritos
  FOR INSERT
  WITH CHECK (auth.uid()::text = id_cliente);

CREATE POLICY "users_delete_own_favorites" ON favoritos
  FOR DELETE
  USING (auth.uid()::text = id_cliente);

-- Clientes: Solo administradores pueden ver/editar datos de clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_profile" ON clientes
  FOR SELECT
  USING (auth.uid()::text = id_cliente);

CREATE POLICY "users_update_own_profile" ON clientes
  FOR UPDATE
  USING (auth.uid()::text = id_cliente)
  WITH CHECK (auth.uid()::text = id_cliente);

CREATE POLICY "admins_view_all_customers" ON clientes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.user_metadata->>'role' = 'admin'
    )
  );

-- Productos: Todos pueden leer (public read)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_view_products" ON productos
  FOR SELECT
  USING (true);

-- Solo admins pueden escribir productos
CREATE POLICY "admins_manage_products" ON productos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.user_metadata->>'role' = 'admin'
    )
  );

-- Categorías: Todos pueden leer
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_view_categories" ON categorias
  FOR SELECT
  USING (true);

-- Solo admins pueden escribir
CREATE POLICY "admins_manage_categories" ON categorias
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.user_metadata->>'role' = 'admin'
    )
  );

-- ============================================================================
-- PASO 2: VERIFICACIÓN
-- ============================================================================
-- Ejecutar esto para verificar que RLS está habilitado:
/*
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('ordenes', 'direcciones', 'favoritos', 'clientes', 'productos', 'categorias')
ORDER BY tablename;

-- Debería mostrar todas con rowsecurity = true
*/

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. El backend usa service_role_key que IGNORA RLS (es intencional)
-- 2. RLS protege si alguien expone la anon_key en frontend
-- 3. Los usuarios normales solo ven sus datos
-- 4. Los admins necesitan role='admin' en user_metadata
-- 5. Esto es una SEGUNDA LÍNEA DE DEFENSA
