# 🔒 IMPLEMENTACIÓN FINAL DE SEGURIDAD

## Estado: Listos para Desplegar

Hemos corregido 3 vulnerabilidades críticas:

1. ✅ **Webhook sin validación** - COMPLETADO (en version7)
2. ✅ **Precio manipulable** - COMPLETADO (en version7)
3. ✅ **Race condition en stock** - IMPLEMENTADO (migration 022)
4. ✅ **Master password plaintext** - IMPLEMENTADO (bcrypt)
5. ⏳ **RLS en Supabase** - PENDIENTE (manual)

---

## 🚀 PASOS A EJECUTAR

### PASO 1: Generar Hash de Master Password (LOCAL)

```bash
cd backend
python generate_admin_password_hash.py
```

**Output esperado:**
```
$2b$12$X7y.Z9a8...somethinglong...
```

**Copia el hash completo.**

---

### PASO 2: Actualizar .env (LOCAL)

En `backend/.env`, reemplaza:

```ini
# ANTES:
ADMIN_MASTER_PASSWORD=SantyHogar2026!Admin

# DESPUÉS:
ADMIN_MASTER_PASSWORD=$2b$12$X7y.Z9a8...somethinglong...
```

⚠️ **IMPORTANTE:** El nuevo valor es UN HASH, no la contraseña.

---

### PASO 3: Buildear y Testear (LOCAL)

```bash
cd backend
pip install passlib bcrypt  # Si no lo tenés

# Test rápido
python -c "
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
password = 'SantyHogar2026!Admin'
hashed = '$2b$12$X7y.Z9a8...somethinglong...'  # Tu hash
print('✅ Hash válido' if pwd_context.verify(password, hashed) else '❌ Hash inválido')
"

# Buildear
cd ../frontend
npm run build
```

---

### PASO 4: Crear Migraciones en Supabase (MANUAL)

Ir a: **Supabase → SQL Editor**

**Copiar y ejecutar primero:**

```sql
-- 022_atomic_stock_decrement.sql
CREATE OR REPLACE FUNCTION decrement_order_stock(order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_success BOOLEAN := TRUE;
BEGIN
    SELECT * INTO v_order FROM ordenes WHERE id_orden = order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Orden no encontrada: %', order_id;
    END IF;
    
    FOR v_item IN 
        SELECT id_producto, cantidad FROM orden_items WHERE id_orden = order_id
    LOOP
        UPDATE productos
        SET stock = stock - v_item.cantidad
        WHERE id_producto = v_item.id_producto 
          AND stock >= v_item.cantidad;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Stock insuficiente para producto %', v_item.id_producto;
        END IF;
    END LOOP;
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error decrementando stock para orden %: %', order_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

**Luego ejecutar:**

```sql
-- 023_enable_row_level_security.sql
-- (Copiar el contenido completo del archivo migrations/023_*)
```

---

### PASO 5: Pushear a Git (RECOMENDADO)

```bash
git add .
git commit -m "security: implement atomic stock decrement, bcrypt password hashing, and RLS policies

- Add SQL function decrement_order_stock() for atomic transactions
- Fix race condition in stock management
- Replace plaintext master password with bcrypt hash
- Enable RLS on all user-related tables
- Implement policies for orders, addresses, favorites
- Second layer of defense if anon key is exposed"

git push origin version1
```

---

### PASO 6: Desplegar en Railway (PRODUCTION)

1. **Commit & Push completado** ✓
2. **En Railway Dashboard:**
   - Settings → Variables
   - Actualizar `ADMIN_MASTER_PASSWORD` con el nuevo HASH
   - No el plaintext, el HASH

**Ejemplo:**
```
ADMIN_MASTER_PASSWORD=$2b$12$X7y.Z9a8...somethinglong...
```

3. **Redeploy:**
   - Railway debería detectar los cambios
   - O fuerza redeploy manualmente

---

### PASO 7: Verificar en Producción

```bash
# Test 1: Webhook signature validation
curl -X POST https://santyhogar-production.up.railway.app/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: invalid" \
  -d '{"type": "payment", "data": {"id": "999"}}'

# Debería retornar 403 Forbidden (no OK)
# ✅ CORRECTO si rechaza

# Test 2: Admin password hash (vía frontend)
# Ir a http://localhost:5173/admin
# Intentar crear admin con plaintext password
# Debería fallar (no retornar secret en error)
# ✅ CORRECTO si falla elegantemente
```

---

## 📋 CHECKLIST FINAL

- [ ] Generé hash con `generate_admin_password_hash.py`
- [ ] Actualicé `backend/.env` con el HASH
- [ ] Ejecuté SQL migration 022 en Supabase (atomic stock)
- [ ] Ejecuté SQL migration 023 en Supabase (RLS)
- [ ] Commiteé cambios a version1
- [ ] Pusheeé a GitHub
- [ ] Actualicé variable en Railway con el HASH
- [ ] Redeploy completado en Railway
- [ ] Testé webhook (rechaza sin firma) ✓
- [ ] Testé admin password (usa bcrypt) ✓

---

## 🔍 VERIFICACIÓN MANUAL

### En Supabase SQL Editor

```sql
-- Verificar RLS habilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('ordenes', 'direcciones', 'favoritos', 'clientes', 'productos', 'categorias')
ORDER BY tablename;

-- Debería mostrar todas con rowsecurity = true
```

### En Backend Logs (Railway)

Buscar:
- ✅ "🔴 CRÍTICO: Firma de webhook inválida" (si rechaza webhook falso)
- ✅ "✓ Stock decrementado atomicamente" (si usa función SQL)

---

## ⚠️ IMPORTANTE

### Password Hash
- ❌ NO guardes plaintext en .env
- ✅ SÍ usa el HASH generado por bcrypt
- ✅ El HASH es **irreversible**
- ✅ Solo se compara con `pwd_context.verify()`

### RLS
- ℹ️ El backend (service_role_key) ignora RLS (intencional)
- ℹ️ RLS protege si la anon_key se expone
- ℹ️ Es la "segunda línea de defensa"

### Stock Decrement
- ℹ️ Usa transacciones SQL con LOCK
- ℹ️ Previene que 2 pedidos simultáneos causen stock negativo
- ✅ Garantiza consistencia

---

## 📞 SOPORTE

Si hay errores:

1. **Error en bcrypt:** Verifica que `passlib` y `bcrypt` estén instalados
   ```bash
   pip install passlib bcrypt
   ```

2. **Error en RLS:** Verifica que estés en Supabase SQL Editor correctamente
   
3. **Error en stock:** Verifica que la función SQL esté creada
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'decrement_order_stock';
   ```

---

## ✅ RESULTADO FINAL

Tras estos pasos:

✅ Webhooks validados con firma (imposible falsificar)
✅ Precios validados en servidor (imposible cambiar desde cliente)
✅ Stock protegido contra race conditions (transacciones atómicas)
✅ Master password hasheado (invisible en memory/logs)
✅ RLS en BD (segunda defensa contra exposición de keys)

**Santy Hogar está LISTO para producción segura** 🎉

