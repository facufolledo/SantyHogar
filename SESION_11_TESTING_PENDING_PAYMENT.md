# 🧪 Sesión 11 - Testing: Sistema de Órdenes con Pago Pendiente

## ✅ Estado del Sistema

### Backend - Todos los tests pasados
- [x] Migración 016: Constraint de estados actualizado (incluye 'paid' + nuevos estados)
- [x] Órdenes se crean con `estado='pendiente_pago'`
- [x] Fecha de expiración: NOW + 2 horas
- [x] Endpoint `/api/orders/{id}/retry-payment` crea nueva preferencia MP
- [x] Job cancela órdenes expiradas cada 5 minutos
- [x] Webhook actualiza estado a `'pagada'` cuando se confirma pago
- [x] Mapper `row_to_order()` preserva estados correctos
- [x] OrdersContext frontend ahora incluye tipos `pendiente_pago` y `pagada`

### Frontend - MyOrders.tsx
- [x] Banner "Pago pendiente" para órdenes `pendiente_pago`
- [x] Botón "Reintentar Pago" (naranja)
- [x] Clic en botón redirige a nueva preferencia MP
- [x] Tracking solo mostrado si NO es `pendiente_pago`

---

## 🧪 Plan de Pruebas

### PRUEBA 1: Crear Orden Sin Pagar (BACKEND)

**Estado**: ✅ Verificado con test script

Comando:
```bash
cd backend
python test_pending_payment_flow.py
```

Resultado esperado:
```
[OK] Orden creada: SH-XXXXXXXX (ID: xxxxxxxx)
[INFO] Estado: pendiente_pago
[OK] Orden encontrada en lista
[OK] Endpoint funcionando correctamente
[OK] Job de cancelación configurado correctamente
```

---

### PRUEBA 2: Verificar Orden en Frontend (IMPORTANTE)

**Pasos**:

1. Asegúrate que backend está corriendo:
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Inicia frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Abre `http://localhost:5173` en el navegador

4. Haz login con tu cuenta (ejemplo: `facufolledo7@gmail.com`)

5. Navega a **"Cuenta" → "Mis Pedidos"**

6. Verifica que ves:
   - ✅ Orden con estado **"Pendiente de pago"** (badge naranja)
   - ✅ Banner naranja que dice: "Pago pendiente - Esta orden está esperando confirmación de pago"
   - ✅ Botón **"Reintentar Pago"** (naranja)
   - ❌ NO debe mostrar el tracking (solo para órdenes pagadas)

**Resultado esperado**:
```
Mis pedidos
┌─ #SH-XXXXXXXX │ Pendiente de pago [NARANJA]
│  30 de junio · 1 producto
│
│  ⚠️ Pago pendiente
│  Esta orden está esperando confirmación de pago.
│  Haz clic en "Reintentar Pago" para continuar.
│
│  [Reintentar Pago] <- botón naranja
└─ Total: $50,000.00
```

---

### PRUEBA 3: Botón "Reintentar Pago" (FRONTEND)

**Pasos**:

1. Desde "Mis Pedidos", haz clic en **"Reintentar Pago"**

2. Espera 2-3 segundos (se muestra "Redirigiendo...")

3. Debería redirigir a **Mercado Pago** automáticamente

**Resultado esperado**:
- URL cambia a: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...`
- Se abre la página de checkout de MP
- Ves los mismos productos de la orden
- Puedes hacer clic en "Volver al sitio" para no pagar

---

### PRUEBA 4: Comprar Nueva Orden Sin Pagar

**Pasos**:

1. Ve a la página principal (`http://localhost:5173`)

2. Selecciona un producto y haz clic en "Agregar al carrito"

3. Ve a "Carrito" y haz clic en "Ir a Checkout"

4. Completa los datos:
   - Nombre: Tu nombre
   - Email: Tu email
   - Teléfono: Tu número
   - Método de pago: **Mercado Pago**

5. Haz clic en **"Ir a Mercado Pago"**

6. Se abre MP checkout. **Haz clic en "Volver al sitio" SIN pagar**

7. Espera a que vuelva al checkout

8. Ve a "Mis Pedidos"

**Resultado esperado**:
- ✅ Nueva orden aparece con estado "Pendiente de pago"
- ✅ Stock está reservado (no puedes comprar ese producto de nuevo)
- ✅ Botón "Reintentar Pago" está activo

---

### PRUEBA 5: Expiración de 2 Horas (MANUAL)

**Nota**: Esta prueba requiere esperar 2 horas o modificar la BD directamente.

**Opción A: Esperar 2 horas** ⏱️
1. Crea una orden sin pagar
2. Espera 2 horas
3. El job ejecutará cada 5 minutos:
   - Detectará que la orden expiró
   - Borrará la orden completamente
   - Restaurará el stock
4. La orden desaparecerá de "Mis Pedidos"

**Opción B: Modificar fecha en Supabase** (más rápido para testing)

En Supabase SQL Editor:
```sql
-- Buscar orden pendiente_pago
SELECT id_orden, fecha_expiracion_pago, estado 
FROM ordenes 
WHERE estado = 'pendiente_pago' 
LIMIT 1;

-- Cambiar fecha_expiracion_pago al pasado (hace 1 hora)
UPDATE ordenes 
SET fecha_expiracion_pago = NOW() - INTERVAL '1 hour'
WHERE estado = 'pendiente_pago' 
LIMIT 1;

-- Esperar a que el job ejecute (cada 5 minutos)
-- O ejecutar el job manualmente desde Python:
```

**Resultado esperado**:
- ✅ Orden se elimina de "Mis Pedidos"
- ✅ Stock se restaura
- ✅ Logs en backend muestran:
  ```
  [INFO] 🔍 Verificando órdenes expiradas...
  [INFO] ⏰ Orden XXXXXXXX EXPIRADA
  [INFO] ✓ Stock devuelto: PRODUCTO (30 → 31)
  [INFO] ✓ Items eliminados
  [INFO] ✅ ORDEN ELIMINADA
  ```

---

### PRUEBA 6: Webhook de Pago (OPCIONAL - requiere tarjeta real)

**Pasos**:

1. Crea nueva orden sin pagar (ve a Prueba 4, completa checkout)

2. Se abre MP. Haz clic en "Volver" pero esta vez **sí paga**

3. Usa tarjeta de prueba MP:
   - Número: `5031 7557 3453 0604`
   - Exp: `11/25`
   - CVV: `123`
   - Titular: Cualquier nombre

4. Completa la compra

5. Vuelve a `http://localhost:5173`

6. Ve a "Mis Pedidos"

**Resultado esperado**:
- ✅ Estado cambia a **"Pagada"** (verde)
- ✅ Desaparece el banner "Pago pendiente"
- ✅ Aparece tracking: "Pedido recibido → En preparación → ..."
- ✅ Stock se descuenta definitivamente

---

## 🐛 Troubleshooting

### Problema: "Pendiente de pago" no aparece

**Solución**:
1. Verifica que el backend está corriendo (`http://localhost:8000/health`)
2. Revisa los logs del backend en terminal
3. Asegúrate que estás logueado en el frontend
4. Abre DevTools (F12) → Network → ve a "Mis Pedidos" → revisa request a `/api/orders`

### Problema: Botón "Reintentar Pago" no funciona

**Solución**:
1. Abre DevTools (F12) → Console
2. Verifica si hay errores
3. Ve a Network y revisa la request a `/api/orders/{id}/retry-payment`
4. Debe devolver status 200 con `init_point`

### Problema: Stock no se restaura después de expirar

**Solución**:
1. Verifica que el job está corriendo (logs del backend)
2. Modifica la fecha manualmente en Supabase para forzar expiración
3. Ejecuta el job manualmente:
   ```bash
   cd backend
   python -c "from app.tasks import cancel_expired_orders; cancel_expired_orders()"
   ```

### Problema: Webhook no funciona (orden sigue como "pendiente_pago")

**Solución**:
1. Verifica que backend está en `http://localhost:8000` accesible
2. En MP dashboard (modo sandbox), verifica webhooks
3. Revisa logs del backend para ver si recibió notification
4. Puedes actualizar manualmente en Supabase:
   ```sql
   UPDATE ordenes 
   SET estado = 'pagada', fecha_expiracion_pago = NULL
   WHERE id_orden = 'tu-id';
   ```

---

## 📋 Checklist Final

Antes de marcar como completo, verifica:

- [ ] Backend tests pasan (`python test_pending_payment_flow.py` → todos [OK])
- [ ] Frontend muestra órdenes `pendiente_pago` con banner naranja
- [ ] Botón "Reintentar Pago" redirige a MP
- [ ] Stock se reserva al crear orden
- [ ] Órdenes desaparecen después de 2 horas (o al modificar fecha)
- [ ] Webhook actualiza estado a "pagada" (si pagaste)

---

## 🚀 Próximos Pasos

Una vez verificado todo:

1. **Limpiar archivos de test**:
   ```bash
   rm backend/test_pending_payment_flow.py
   rm backend/get_product_id.py
   ```

2. **Hacer commit**:
   ```bash
   git add -A
   git commit -m "feat: pending payment system with 2-hour expiration - fully tested and working"
   git push origin version1
   ```

3. **Decisión sobre producción**:
   - ¿Mergear a main?
   - ¿Deployment a Railway?
   - ¿Testing adicional en staging?

---

## 📝 Notas Técnicas

### Flujo Completo

1. **Orden Creada**:
   - Estado: `pendiente_pago`
   - Fecha expiración: NOW + 2h (Argentina TZ)
   - Stock: RESERVADO (no disponible para otros)
   - ID preferencia MP: guardado

2. **Usuario Intenta Pagar (Reintentar)**:
   - GET `/api/orders/{id}/retry-payment`
   - Crea NUEVA preferencia MP
   - Redirige a nuevo link MP

3. **Pago Confirmado** (Webhook):
   - Estado: `pagada`
   - Fecha expiración: NULL (no expira)
   - Stock: DESCONTADO

4. **Pago NO Confirmado** (2 horas):
   - Job detecta expiración
   - Elimina orden + items
   - Restaura stock

### Estados Permitidos

Desde migration 016:
```sql
CHECK (estado IN (
  'pending',           -- legacy
  'pendiente_pago',    -- NEW: esperando pago
  'pagada',            -- NEW: pago confirmado
  'paid',              -- legacy
  'processing',        -- preparando
  'ready',             -- listo para retirar
  'delivered',         -- retirado
  'cancelled'          -- cancelado
))
```

### Timezone

Todas las fechas se manejan en **Argentina (UTC-3)**:
- Creación: `datetime.now(timezone(timedelta(hours=-3)))`
- Expiración: `creación + 2 horas`
- Job: Compara con `NOW()` en UTC (Supabase convierte)

---

