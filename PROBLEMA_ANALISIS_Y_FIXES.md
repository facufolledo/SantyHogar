# 🔴 ANÁLISIS DE PROBLEMAS - Compra & Direcciones

## Problemas Encontrados

### ❌ PROBLEMA #1: Error 500 - Foreign Key Constraint (CRÍTICO)

**Error:**
```
postgrest.exceptions.APIError: 
  'Key (id_cliente)=(fbf3cd7f-4057-4ec6-9f7c-5cbe51dac3ff) is not present in table "clientes"'
  'insert or update on table "direcciones" violates foreign key constraint "direcciones_id_cliente_fkey"'
```

**Ubicación:** `POST /customers/{customer_id}/addresses` (línea 378 en main.py)

**Causa Raíz:**
1. El checkout intenta crear una dirección ANTES de asegurar que el cliente existe en la tabla `clientes`
2. El código intenta crear el cliente con `supabase.table("clientes").insert()` pero la excepción se captura silenciosamente con `pass`
3. Luego intenta insertar dirección sin cliente existente → Error FK

**Síntomas:**
- Compra procesa correctamente en Mercado Pago
- Pago se acredita (webhook de pago se procesa)
- Stock se descuenta correctamente ✅
- Orden se crea ✅
- **PERO:** Cuando intenta guardar dirección → Error 500 y dirección no se crea
- **RESULTADO:** Orden queda en estado `pendiente_pago` aunque el pago fue aprobado

---

### ❌ PROBLEMA #2: Órdenes No Se Actualizan a "Pagada"

**Problema:** Aunque el webhook detecta pago aprobado, la orden NO se actualiza a estado "pagada"

**Logs relevantes:**
```
✅ Procesando orden de30b35c-5729-4373-9701-d81526d5609c para pago 170362108701
✅ Orden de30b35c-5729-4373-9701-d81526d5609c marcada como pagada
✓ Stock descontado para orden de30b35c-5729-4373-9701-d81526d5609c
```

**Pero luego:**
- Dashboard muestra orden con estado `pendiente_pago` (NO actualizado)

**Causa Raíz:**
- El error 500 en direcciones ocurre DURANTE el checkout
- Aunque el webhook dice que marcó como pagada, la dirección falló y el flujo se interrumpe
- Frontend probablemente está catcheando el error 500 en dirección y volviendo atrás

---

### ❌ PROBLEMA #3: Error de Timezone en Scheduler

**Error:**
```
ERROR: can't compare offset-naive and offset-aware datetimes
```

**Ubicación:** `cancel_expired_orders.py` (tarea scheduled que corre cada 5 minutos)

**Causa Raíz:**
- `datetime.now()` retorna datetime NAIVE (sin timezone)
- Las fechas de Supabase vienen con timezone (+00:00)
- No se puede comparar naive vs aware

**Impacto:** El scheduler falla silenciosamente, órdenes expiradas no se cancelan

---

### ❌ PROBLEMA #4: Error 422 en Installments

**Error:**
```
GET /api/installments/calculate?amount=121&bin_number=40923039 HTTP/1.1" 422 Unprocessable Entity
```

**Causa Raíz:**
- El endpoint espera BIN con `min_length=6` pero el BIN es `40923039` (8 dígitos)
- La validación `pattern="^[0-9]+$"` debería pasar
- Probablemente hay un problema de parsing o validación

---

## 🔧 FIXES NECESARIOS

### FIX #1: Asegurar Cliente Existe ANTES de Crear Dirección

**Archivo:** `backend/app/main.py` (línea 325-357)

**Cambios:**
1. Validar que el cliente se creó exitosamente
2. Si falla, relanzar excepción (no continuar silenciosamente)
3. O crear cliente con manejo transaccional

**Código actual (INCORRECTO):**
```python
try:
    supabase.table("clientes").insert(customer_payload).execute()
except Exception as e:
    # Si falla, simplemente ignorar  ❌ INCORRECTO
    pass
```

**Código nuevo (CORRECTO):**
```python
if not existing_customer.data:
    customer_payload = {
        "id_cliente": customer_id_str,
        "nombre": body.get("customer_name", "Unnamed"),
        "email": body.get("customer_email", "admin@santyhogar.com"),  # Email por defecto
        "telefono": body.get("customer_phone", ""),
        "total_gastado": 0,
        "cantidad_ordenes": 0,
        "activo": True,
    }
    
    try:
        result = supabase.table("clientes").insert(customer_payload).execute()
        if not result.data:
            raise HTTPException(
                status_code=500, 
                detail="No se pudo crear cliente"
            )
    except Exception as e:
        logger.error(f"Error creando cliente: {e}")
        raise HTTPException(
            status_code=500, 
            detail="No se pudo crear cliente: " + str(e)
        )
```

---

### FIX #2: Corregir Timezone en cancel_expired_orders

**Archivo:** `backend/app/tasks/cancel_expired_orders.py`

**Cambios:**
```python
# INCORRECTO:
now = datetime.now(timezone.utc)  # Tiene timezone

# CORRECTO:
from datetime import datetime, timezone

# Opción 1: Comparar aware con aware
now = datetime.now(timezone.utc)
if isinstance(fecha_exp, str):
    fecha_exp = datetime.fromisoformat(fecha_exp.replace('Z', '+00:00'))
# fecha_exp ahora tiene timezone, ambos son aware ✅

# Opción 2: Si viene naive, hacerlo aware
if fecha_exp.tzinfo is None:
    fecha_exp = fecha_exp.replace(tzinfo=timezone.utc)
```

---

### FIX #3: Validación de BIN en Installments

**Archivo:** `backend/app/routes/installments.py`

**Cambios:**
```python
# El patrón está bien, pero revisar:
# - BIN "40923039" tiene 8 dígitos ✓
# - min_length=6 ✓
# - max_length=8 ✓
# - pattern "^[0-9]+$" ✓

# Posible issue: Si el amount es flotante con decimales
# Cambiar a integer o validación más flexible

@router.get("/calculate")
async def calculate_installments(
    amount: float = Query(..., gt=0, description="Monto total en ARS"),
    bin_number: str = Query(
        ..., 
        min_length=6, 
        description="Primeros 6-8 dígitos de la tarjeta"
    ),
):
    # Validar BIN localmente
    if not bin_number.isdigit():
        raise HTTPException(status_code=400, detail="BIN inválido")
    if len(bin_number) < 6 or len(bin_number) > 8:
        raise HTTPException(status_code=400, detail="BIN debe tener 6-8 dígitos")
    
    try:
        return await InstallmentsService().get_installments(amount=amount, bin_number=bin_number)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
```

---

## 📋 PASOS PARA FIJAR

1. ✅ Fijar FIX #1 (Cliente → Dirección)
2. ✅ Fijar FIX #2 (Timezone)
3. ✅ Fijar FIX #3 (BIN validation)
4. ✅ Testear flujo completo de compra
5. ✅ Push cambios

---

## ✅ RESULTADO ESPERADO

- ✓ Cliente se crea automáticamente antes de dirección
- ✓ Dirección se crea sin error 500
- ✓ Orden se actualiza a "pagada" correctamente
- ✓ Scheduler no falla por timezone
- ✓ Endpoint installments retorna 200

