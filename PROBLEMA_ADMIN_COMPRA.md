# 🔴 PROBLEMA: Admin No Puede Comprar (Email Hardcodeado)

## Descripción del Problema

Cuando el **admin** intenta realizar una compra, ocurre un error FK en la creación de dirección:

```
postgrest.exceptions.APIError: 
  'Key (id_cliente)=(...) is not present in table "clientes"'
  violates foreign key constraint "direcciones_id_cliente_fkey"
```

---

## Causa Raíz

### El Bug

En `backend/app/main.py` línea 344, el email está **hardcodeado**:

```python
# ❌ INCORRECTO:
customer_payload = {
    "id_cliente": customer_id_str,
    "nombre": body.get("customer_name", "Unnamed"),
    "email": body.get("customer_email", "admin@santyhogar.com"),  # ⚠️ HARDCODEADO
    "telefono": body.get("customer_phone", ""),
    ...
}
```

### Por Qué Falla

1. Admin inicia sesión con su email real: `admin@santyhogar.com`
2. Admin va a checkout y envía `customerEmail: admin@santyhogar.com` (su email real)
3. El backend intenta insertar cliente con `email: admin@santyhogar.com`
4. **PERO**: El admin ya existe en tabla `clientes` (creado anteriormente)
5. **Resultado:** Violación de PRIMARY KEY o UNIQUE constraint
6. Inserción falla → Error 500 → Dirección no se crea → FK error

---

## La Solución

### Cambio en `main.py` (línea 340-360)

**Antes (INCORRECTO):**
```python
customer_payload = {
    "id_cliente": customer_id_str,
    "nombre": body.get("customer_name", "Unnamed"),
    "email": body.get("customer_email", "admin@santyhogar.com"),  # ❌ Hardcodeado
    ...
}
```

**Después (CORRECTO):**
```python
# Usar email del body, no hardcodeado
customer_email = body.get("customer_email", "").strip()
if not customer_email:
    # Si no viene email, generar uno único basado en el ID
    customer_email = f"customer+{customer_id_str[:8]}@santyhogar.local"

customer_payload = {
    "id_cliente": customer_id_str,
    "nombre": body.get("customer_name", "Unnamed"),
    "email": customer_email,  # ✅ Usa email del body
    "telefono": body.get("customer_phone", ""),
    ...
}
```

---

## Por Qué Pasó

Este bug afecta **principalmente a ADMIN** porque:

1. **Admins tienen email conocido** (`admin@santyhogar.com`)
2. El código asume que TODOS los clientes usan ese email
3. Cuando admin compra con su email real, hay conflicto
4. Clientes normales: Menor probabilidad de tener email `admin@santyhogar.com`

---

## Flujo Correcto DESPUÉS del Fix

### Admin compra:
```
1. Admin login → userId = admin_uuid
2. Admin va a checkout
3. Envía: customerEmail = admin@santyhogar.com (su email real)
4. Backend recibe: customer_email = "admin@santyhogar.com"
5. Intenta crear cliente:
   - Verifica si existe cliente con id_cliente = admin_uuid
   - Si NO existe: Crea con email = "admin@santyhogar.com" ✅
   - Si existe: No duplica, usa existente ✅
6. Crea dirección ✅
7. Orden se actualiza a "pagada" ✅
```

---

## Impacto

### Antes del Fix
- ❌ Admin NO puede comprar
- ❌ Error 500 FK constraint
- ❌ Direcciones no se crean

### Después del Fix
- ✅ Admin puede comprar
- ✅ Email se obtiene del body (no hardcodeado)
- ✅ Cliente se crea sin duplicar
- ✅ Dirección se crea correctamente
- ✅ Orden se actualiza a pagada

---

## Testing

**Caso 1: Admin compra**
```
1. Login como admin@santyhogar.com
2. Ir a producto
3. Comprar
4. Rellenar datos (email: admin@santyhogar.com)
5. Pagar
6. Verificar: ✓ Sin error 500
            ✓ Orden marcada como "pagada"
            ✓ Dirección guardada
```

**Caso 2: Cliente compra**
```
1. Login como cliente@gmail.com
2. Ir a producto
3. Comprar
4. Rellenar datos (email: cliente@gmail.com)
5. Pagar
6. Verificar: ✓ Sin error 500
            ✓ Orden marcada como "pagada"
            ✓ Dirección guardada
```

---

## Archivos Modificados

- `backend/app/main.py` - Remover hardcodeado de email en línea 344

