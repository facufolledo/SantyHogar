# ✅ FIX: Direcciones No Se Guardaban en Checkout

**Versión:** v1.1.2
**Fecha:** 2026-07-30
**Status:** COMPLETADO ✓

---

## 🔴 Problema Reportado

Cuando haces una compra y intentas guardar una nueva dirección:
- ❌ Se pregunta "¿Guardar esta dirección?"
- ❌ Pones "Sí"
- ❌ **PERO:** No aparece en "Mis direcciones"
- ❌ No se muestra en próximos checkouts

---

## 🔍 Análisis

### Causa Raíz

En `Checkout.tsx`, cuando se llama a `createAddress()`:

```typescript
// ❌ INCORRECTO:
await createAddress(user.customerId, {
  label: newAddressLabel,
  street: shippingAddress.street,
  city: shippingAddress.city,
  province: shippingAddress.province,
  zip: shippingAddress.zip,
  isPrimary: savedAddresses.length === 0,
  // 🔴 NO se pasan customer_name, customer_email, customer_phone
});
```

El backend `create_address_compat()` intenta:
1. Verificar si el cliente existe en tabla `clientes`
2. Si NO existe, crear el cliente con los datos
3. **PERO:** Sin `customer_email` y `customer_name`, falla la creación

Resultado:
- Cliente NO se crea
- Dirección NO se crea (FK error)
- Usuario no ve error (se captura silenciosamente)
- Dirección nunca aparece

---

## ✅ Solución

### Cambio en `Checkout.tsx` (Dos lugares)

**Antes (INCORRECTO):**
```typescript
await createAddress(user.customerId, {
  label: newAddressLabel,
  street: shippingAddress.street,
  city: shippingAddress.city,
  province: shippingAddress.province,
  zip: shippingAddress.zip,
  isPrimary: savedAddresses.length === 0,
});
```

**Después (CORRECTO):**
```typescript
await createAddress(user.customerId, {
  label: newAddressLabel,
  street: shippingAddress.street,
  city: shippingAddress.city,
  province: shippingAddress.province,
  zip: shippingAddress.zip,
  isPrimary: savedAddresses.length === 0,
  // ✅ Pasar datos del cliente
  customer_name: form.name,
  customer_email: form.email,
  customer_phone: form.phone,
} as any);
```

### Por Qué Funciona

Ahora el backend recibe:
1. `customer_email` → Puede crear cliente con email correcto
2. `customer_name` → Puede crear cliente con nombre correcto
3. `customer_phone` → Datos completos del cliente
4. Resto de datos → Crea dirección sin problemas

---

## 📊 Flujo Completo (Después del Fix)

```
1. Usuario está en checkout
2. Pone dirección nueva
3. Pregunta: "¿Guardar esta dirección?" → Dice SÍ
4. Frontend llama createAddress() CON datos del cliente ✅
5. Backend recibe datos:
   - Verifica si cliente existe
   - Si NO existe: Crea cliente con customer_email ✅
   - Crea dirección ✅
6. Dirección aparece en:
   - "Mis direcciones" ✅
   - Próximos checkouts ✅
```

---

## 🧪 Testing

**Paso 1: Guardar dirección en checkout**
```
1. Ir a producto
2. Comprar
3. Poner dirección (calle, ciudad, etc.)
4. Preguntar: "¿Guardar dirección?" → Sí
5. Completar pago
```

**Paso 2: Verificar que se guardó**
```
1. Ir a Mi Cuenta → Mis direcciones
2. Debe mostrar la dirección que acabas de guardar ✅
```

**Paso 3: Verificar que aparece en próximas compras**
```
1. Comprar otro producto
2. En checkout debe mostrar la dirección anterior como opción ✅
```

---

## 📝 Archivos Modificados

- `frontend/src/pages/Checkout.tsx` - Pasar customer_name, customer_email, customer_phone (2 lugares)

---

## 🎉 Resultado

| Antes | Después |
|-------|---------|
| ❌ Dirección no se guarda | ✅ Dirección se guarda correctamente |
| ❌ No aparece en Mis Direcciones | ✅ Aparece en Mis Direcciones |
| ❌ No se muestra en próximos checkout | ✅ Se muestra como opción en próximos checkouts |

---

## 🔗 Commit

```
commit cbb83a2
Author: Fix Direcciones
Date:   2026-07-30

    fix: pasar customer_name y customer_email al guardar dirección en checkout
```

