# 🧪 PLAN DE TESTING - PRODUCCIÓN

**Estado**: 🟢 DEPLOYED Y CORRIENDO  
**Ambiente**: Production (MP Real, Supabase Production, Railway Deploy)  
**Fecha**: 2026-06-30

---

## 📋 TESTING CHECKLIST

### Fase 1: Verificación Básica (5 minutos)

- [ ] **Frontend carga** → Abre `https://santyhogar.com.ar`
- [ ] **Navbar visible** → Logo, Home, Carrito, Login
- [ ] **Sin errores console** → F12 → Console (sin red X)
- [ ] **Backend responde** → Abre DevTools → Network → cualquier request

### Fase 2: Autenticación (5 minutos)

- [ ] **Login funciona** → Ingresa email/contraseña
- [ ] **Token guardado** → LocalStorage > auth token existe
- [ ] **Redirect a home** → Después de login
- [ ] **Logout funciona** → Borra token y redirige a login

### Fase 3: Productos y Carrito (10 minutos)

- [ ] **Productos cargan** → Home muestra productos
- [ ] **Precio visible** → Cada producto muestra precio
- [ ] **Agregar al carrito** → Click en "Agregar" → aparece en carrito
- [ ] **Carrito se actualiza** → Badge muestra cantidad
- [ ] **Eliminar del carrito** → Click en X → se quita

### Fase 4: Checkout (15 minutos) ⭐ IMPORTANTE

**PASO 1: Ir a Checkout**
- [ ] Click en "Carrito"
- [ ] Click en "Ir a Checkout"

**PASO 2: Completar datos**
- [ ] Nombre se completa (del token/perfil)
- [ ] Email se completa
- [ ] Teléfono es editable
- [ ] Dirección se puede seleccionar (si existen)

**PASO 3: Enviar a Mercado Pago**
- [ ] Click en "Ir a Mercado Pago"
- [ ] **IMPORTANTE**: Redirige a `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...`

---

## 🧪 TESTING DE ÓRDENES (30 minutos) ⭐ CRÍTICO

### Test 1: Crear Orden SIN Pagar (Simular cliente que se va)

**Pasos**:
1. Login en `https://santyhogar.com.ar`
2. Agregar 2-3 productos al carrito
3. Ir a Checkout
4. Completar datos y enviar a MP
5. **EN MP**: Hacer clic en "Volver al sitio" **SIN PAGAR**

**Verificación**:
```
✅ Deberías ver mensaje: "Pago pendiente"
✅ En "Mis Pedidos": Orden con estado "Pendiente de pago" (badge NARANJA)
✅ Botón "Reintentar Pago" visible
✅ Banner explicativo
```

**Checklist**:
- [ ] Orden aparece en "Mis Pedidos"
- [ ] Estado es "Pendiente de pago"
- [ ] Badge naranja visible
- [ ] Botón "Reintentar Pago" funciona
- [ ] Click en botón → redirige a nuevo link MP

---

### Test 2: Pagar (Usar Tarjeta de Prueba MP)

**Pasos**:
1. Desde "Mis Pedidos", hacer clic en "Reintentar Pago"
2. Se abre nuevo link de MP
3. **Completa datos de pago**:
   ```
   Tarjeta: 5031 7557 3453 0604
   Exp: 11/25
   CVV: 123
   Titular: CUALQUIER NOMBRE
   ```
4. Hacer clic en "Pagar"

**Verificación**:
```
✅ Pago aprobado (MP dice "Pago realizado")
✅ Vuelves a la página
✅ En "Mis Pedidos": Orden ahora muestra "Pagada" (verde)
✅ Tracking visible (Pedido recibido → En preparación → ...)
✅ Stock se descuenta (producto no está más disponible o reduce cantidad)
```

**Checklist**:
- [ ] Pago se aprobó en MP
- [ ] Orden cambió de estado a "Pagada"
- [ ] Badge verde en lugar de naranja
- [ ] Tracking mostrado
- [ ] Banner desapareció
- [ ] Stock se actualizó en BD

---

### Test 3: Orden Pendiente Expira (2 horas)

**Pasos**:
1. Crear orden SIN pagar (Test 1)
2. Esperar 2 horas ⏱️
3. O modificar fecha en BD (para testing rápido):
   ```sql
   UPDATE ordenes 
   SET fecha_expiracion_pago = NOW() - INTERVAL '1 hour'
   WHERE estado = 'pendiente_pago'
   LIMIT 1;
   ```

**Verificación** (después de 2 horas o ejecutar job):
```
✅ Orden desaparece de "Mis Pedidos"
✅ Stock se restaura
✅ Job registra cancelación en logs
```

**Checklist**:
- [ ] Orden no aparece más en listado
- [ ] Stock se devuelve (productos vuelven a estar disponibles)
- [ ] En BD: orden fue eliminada

---

## 🔍 TESTING DE FUNCIONALIDADES (20 minutos)

### Mi Cuenta

- [ ] **Perfil** → Datos se muestran correctamente
- [ ] **Mis Direcciones** → Direcciones guardadas aparecen
- [ ] **Agregar dirección** → Puedo crear nueva
- [ ] **Editar dirección** → Puedo modificar

### Admin (si tienes acceso)

- [ ] **Dashboard** → Gráficos cargan
- [ ] **Órdenes** → Lista todas las órdenes con pagination
- [ ] **Productos** → Listado de productos
- [ ] **Editar precio** → Cambiar precio de producto

---

## 🐛 TESTING DE ERRORES (10 minutos)

### Errores Esperados

- [ ] **Stock insuficiente** → Agregar más items de los disponibles → Error
- [ ] **Login con email inválido** → Error "Credenciales inválidas"
- [ ] **Checkout sin datos** → Error "Campos requeridos"
- [ ] **Volver a pagar** → Clic en "Reintentar" después de pagar → Error "Ya pagada"

---

## 📊 TESTING DE PERFORMANCE (5 minutos)

**Abre DevTools → Network → Performance**

### Cargas esperadas:
```
Tiempo de carga: < 3 segundos
Images: Cargan correctamente
API responses: < 1 segundo
```

**Checklist**:
- [ ] Página carga en < 3s
- [ ] Sin requests fallidas (X rojas en Network)
- [ ] Sin errores JavaScript (console limpia)
- [ ] Imágenes cargan correctamente

---

## 🔐 TESTING DE SEGURIDAD (5 minutos)

- [ ] **HTTPS** → URL comienza con `https://` (no http)
- [ ] **CORS configurado** → Requests al backend no dan error CORS
- [ ] **Tokens no en localStorage visible** → F12 → Storage → Auth token presente
- [ ] **Logout limpia datos** → Después de logout, token desaparece

---

## 🚨 TESTING CRÍTICO - Sistema de Órdenes Pendientes

Este es el **más importante** porque es lo nuevo:

### Escenario Completo (30 minutos)

**Paso 1: Crear orden sin pagar**
```
1. Login
2. Agregar productos
3. Checkout
4. MP → Click "Volver" SIN pagar
```

**Paso 2: Verificar en "Mis Pedidos"**
```
✅ Orden con estado "Pendiente de pago"
✅ Badge naranja
✅ Botón "Reintentar Pago"
```

**Paso 3: Reintentar pago**
```
1. Click "Reintentar Pago"
2. Se abre NUEVO link de MP (no el mismo)
3. Pagar con tarjeta de prueba
```

**Paso 4: Verificar pago confirmado**
```
✅ Orden cambió a "Pagada"
✅ Tracking visible
✅ Stock descontado
✅ Webhook funcionó (MP → Backend → BD)
```

**Paso 5: Verificar expiración (opcional, requiere esperar)**
```
✅ Si no pagas, orden se elimina en 2 horas
✅ Stock se restaura
```

---

## 📱 TESTING EN DIFERENTES DISPOSITIVOS

- [ ] **Desktop** (1920x1080)
- [ ] **Tablet** (768x1024)
- [ ] **Mobile** (375x667)
- [ ] **Responsive** → Menú se colapsa en mobile

---

## 🔗 LINKS IMPORTANTES

```
Frontend:        https://santyhogar.com.ar
API:             https://api.santyhogar.com.ar (o tu dominio)
Mercado Pago:    https://www.mercadopago.com.ar/checkout/...
Supabase:        https://supabase.com (panel control)
```

---

## 📝 REGISTRO DE TESTING

Usa esta tabla para registrar resultados:

| Test | Status | Notas | Responsable |
|------|--------|-------|-------------|
| Frontend carga | ✅/❌ | | |
| Login | ✅/❌ | | |
| Carrito | ✅/❌ | | |
| Checkout | ✅/❌ | | |
| Orden pendiente | ✅/❌ | | |
| Pago con MP | ✅/❌ | | |
| Orden pagada | ✅/❌ | | |
| Stock actualizado | ✅/❌ | | |
| Reintentar pago | ✅/❌ | | |
| Admin dashboard | ✅/❌ | | |
| Performance | ✅/❌ | | |
| Security | ✅/❌ | | |

---

## 🆘 Si Algo Falla

### Checklist de debugging:

1. **Abre DevTools** (F12)
   - Console: ¿Hay errores rojo?
   - Network: ¿Requests al backend devuelven 200?
   - Storage: ¿Está el token?

2. **Verifica logs del backend**
   - Railway: Dashboard → Logs
   - Busca: `ERROR`, `Exception`, `traceback`

3. **Verifica Supabase**
   - BD: ¿Ordenes se crean?
   - Datos: ¿Stock se actualiza?

4. **Verifica Mercado Pago**
   - Dashboard MP: ¿Webhooks se enviaron?
   - Preferencias: ¿El link de pago es correcto?

---

## 🎯 Órdenes Críticas a Testear

1. **✅ Crear orden** → Debe guardar en BD con estado "pendiente_pago"
2. **✅ Mostrar en UI** → "Mis Pedidos" debe mostrar orden
3. **✅ Reintentar pago** → Debe crear NUEVA preferencia MP
4. **✅ Pagar** → Webhook confirma pago
5. **✅ Actualizar BD** → Orden pasa a "pagada"
6. **✅ Actualizar UI** → UI cambia a "Pagada" sin refresh
7. **✅ Stock actualizado** → Producto desaparece o reduce cantidad
8. **✅ Expiración** → Job elimina orden si no se paga en 2h

---

## ✅ Cuándo Considerar "Listo"

Sistema está **100% funcional** cuando:

```
[✅] Frontend carga sin errores
[✅] Login/Logout funciona
[✅] Carrito y checkout funciona
[✅] Orden sin pagar muestra estado "Pendiente"
[✅] Reintentar pago funciona
[✅] Pago se confirma (webhook)
[✅] Orden actualiza a "Pagada"
[✅] Stock se actualiza
[✅] Tracking visible para órdenes pagadas
[✅] Expiración automática después de 2h
[✅] Dashboard carga rápido (< 1s)
[✅] Sin errores en console
[✅] HTTPS funciona
```

---

## 📞 Notas

- **Tarjeta de prueba**: 5031 7557 3453 0604 siempre aprueba
- **Webhook MP**: Demora 1-5 segundos en confirmar
- **Expiración**: Espera 2 horas O modifica BD manualmente
- **Logs**: Revisa Rails/Railway para debugging

---

**Generado por**: Kiro  
**Fecha**: 2026-06-30  
**Versión**: Production Ready

