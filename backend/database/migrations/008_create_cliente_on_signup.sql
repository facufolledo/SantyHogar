-- Migración 008: Crear cliente automáticamente cuando se registra un usuario
-- Fecha: 2026-05-06
-- Descripción: Trigger para crear un registro en la tabla clientes cuando se crea un usuario en auth.users

-- Función que se ejecutará cuando se cree un nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar un nuevo cliente con los datos del usuario de auth
  INSERT INTO public.clientes (
    id_cliente,
    nombre,
    email,
    telefono,
    direccion,
    ciudad,
    provincia,
    codigo_postal,
    notas,
    fecha_registro,
    total_gastado,
    cantidad_ordenes
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    '',
    '',
    '',
    '',
    'Registrado con ' || COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NOW(),
    0,
    0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se ejecuta después de insertar un usuario en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Comentarios
COMMENT ON FUNCTION public.handle_new_user() IS 'Crea automáticamente un cliente cuando se registra un usuario';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger para crear cliente al registrarse';
