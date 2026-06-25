# 🚀 CÓMO CONTINUAR - SESIÓN 6

**FECHA:** 23 Junio 2026  
**PRIORIDAD:** 🔴 CRÍTICA  
**TIEMPO:** 3-4 horas

---

## 📖 LEE PRIMERO (en este orden)

### 1. SESION_5_RESUMEN_EJECUTIVO.md (5 min)
Quick overview de qué se hizo

### 2. ACCIONES_INMEDIATAS_SESION_6.md (10 min)
Lee los 9 pasos de testing

### 3. VALIDACION_CHECKOUT_CONSOLIDADO.md (opcional, si tienes dudas)
Análisis técnico detallado

---

## ✅ CHECKLIST ANTES DE EMPEZAR

- [ ] Verificar que backend está corriendo: `python main.py` o deployment
- [ ] Verificar que frontend está actualizado
- [ ] Tener acceso a Supabase console
- [ ] Tener acceso a Mercado Pago sandbox

---

## 🎯 TAREAS SESIÓN 6 (En orden)

### PASO 1: Testing Endpoint Consolidado (1 hora)

**ARCHIVO DE REFERENCIA:** `ACCIONES_INMEDIATAS_SESION_6.md` (líneas 15-50)

```bash
# 1. Crear orden
curl -X POST http://localhost:8000/api/checkout/create-preference \
  -H "Content-Type: application/json" \
  -d '{...}'

# 2. Verificar en BD (estado = pending)
SELECT * FROM ordenes WHERE id_orden = '...'

# 3. Verificar stock NO descontado
SELECT stock FROM productos WHERE id_producto = '...'

# 4. Simular webhook exitoso
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{...}'

# 5. Verificar en BD (estado = paid)
SELECT * FROM ordenes WHERE id_orden = '...'

# 6. Verificar stock SÍ descontado
SELECT stock FROM productos WHERE id_producto = '...'

# 7. Simular webhook reintento (DEBE IGNORARSE)
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{...}'

# 8. Verificar estado no cambió y stock no descontó 2x
SELECT estado, stock FROM ordenes, productos WHERE ...
```

**ÉXITO SI:**
- ✅ Orden creada en pending
- ✅ Stock no descontado inicial
- ✅ Webhook cambia a paid
- ✅ Stock descontado
- ✅ Webhook reintento ignorado (idempotencia)

---

### PASO 2: Testing Frontend (30 min)

**REFERENCIA:** `ACCIONES_INMEDIATAS_SESION_6.md` (líneas 130-150)

1. Abrir http://localhost:5173
2. Agregar producto
3. Click checkout
4. Completar datos
5. Click "Confirmar y pagar"
6. Verificar redirige a MP
7. Simular pago en MP sandbox
8. Verificar retorna a success page
9. Verificar muestra order_number

**ÉXITO SI:**
- ✅ Redirige a Mercado Pago
- ✅ Vuelve después de pagar
- ✅ Muestra "Pedido confirmado"

---

### PASO 3: Deprecar Endpoints Viejos (30 min)

**ARCHIVOS A MODIFICAR:**

#### A. `backend/app/routes/checkout.py`

Cambiar:
```python
@router.post("/create-preference")
async def create_checkout_preference(request: CheckoutRequest):
    # Viejo código...
```

Por:
```python
@router.post("/create-preference")
async def create_checkout_preference_deprecated(request: CheckoutRequest):
    """DEPRECATED: Use /api/checkout/create-preference instead (in main.py)"""
    raise HTTPException(
        status_code=410,  # Gone
        detail="Este endpoint está deprecado. Usa POST /api/checkout/create-preference"
    )
```

---

#### B. Crear `backend/CHECKOUT_FLOW.md`

```markdown
# Checkout Flow - SantyHogar

## Official Endpoint ✅
POST /api/checkout/create-preference

Ubicado en: `app/main.py` línea 520

### Request
{
  "items": [
    {
      "product_id": "<uuid>",
      "quantity": 1
    }
  ],
  "customer_email": "user@example.com",
  "customer_name": "John Doe",
  "customer_phone": "+54123456789"
}

### Response
{
  "preference_id": "...",
  "init_point": "https://www.mercadopago.com/checkout/v1/...",
  "sandbox_init_point": "https://sandbox.mercadopago.com/checkout/v1/...",
  "external_reference": "<order_id>",
  "order_id": "<uuid>",
  "order_number": "2024-00001"
}

## Deprecated Endpoints ❌

1. POST /api/checkout/create-preference (old, in checkout.py)
   - DEPRECATED: Use the official endpoint above

2. POST /orders (direct order creation)
   - Use only for local/test mode
   - For Mercado Pago: use /api/checkout/create-preference

## Webhook Handling
POST /webhook
- Receives payment status from Mercado Pago
- Updates order status: pending → paid
- Decrements stock
- Idempotent: Safe to receive multiple times
```

---

### PASO 4: Completar Paginación (1 hora)

**REFERENCIA:** `ACCIONES_INMEDIATAS_SESION_6.md` (líneas 170-210)

#### A. Actualizar `backend/app/routes/products.py`

Busca:
```python
@router.get("/products")
async def get_all_products(...):
    products = await product_service.get_all_products()
    return [product_to_response(p) for p in products]
```

Reemplaza por:
```python
@router.get("/products")
async def get_all_products(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    from app.services.pagination_service import PaginationService
    
    products = await product_service.get_all_products()
    pager = PaginationService(page=page, limit=limit)
    paginated = pager.paginate(
        total=len(products),
        results=[
            product_to_response(p).model_dump(mode="json")
            for p in products[pager.offset : pager.offset + pager.limit]
        ]
    )
    return paginated
```

---

#### B. Actualizar `backend/app/routes/orders.py`

Ya debería tener paginación en `list_orders()`. Verificar que devuelve:

```json
{
  "page": 1,
  "limit": 20,
  "total": 100,
  "pages": 5,
  "hasNext": true,
  "hasPrev": false,
  "results": [...]
}
```

---

#### C. Test Paginación

```bash
# Test page 1
curl "http://localhost:8000/api/products?page=1&limit=10"

# Test page 2
curl "http://localhost:8000/api/products?page=2&limit=10"

# Verify results are different
```

---

## 📋 CHECKLIST SESIÓN 6

### Testing (1 hora)
- [ ] Crear orden
- [ ] Verificar BD (pending)
- [ ] Simular webhook
- [ ] Verificar BD (paid)
- [ ] Verificar stock descontado
- [ ] Simular webhook reintento (idempotencia)
- [ ] Crear segunda orden (número único)
- [ ] Testing frontend completo

### Limpieza (30 min)
- [ ] Deprecar endpoint viejo
- [ ] Crear CHECKOUT_FLOW.md
- [ ] Documentar API oficial

### Paginación (1 hora)
- [ ] Actualizar products.py
- [ ] Verificar orders.py
- [ ] Test endpoints

---

## 🆘 SI ALGO FALLA

### Si webhook no procesa:
- [ ] Verificar logs backend
- [ ] Verificar que `webhook.py` está registrado en `main.py`
- [ ] Probar endpoint directamente con curl

### Si órdenes duplicadas:
- [ ] Verificar `skip_webhook_side_effects()` está siendo llamada
- [ ] Verificar BD tiene estado correcto

### Si stock no descuenta:
- [ ] Verificar webhook fue recibido
- [ ] Verificar `decrement_stock()` se está llamando
- [ ] Verificar producto existe en BD

---

## 📞 COMANDOS ÚTILES

```bash
# Verificar backend corriendo
curl http://localhost:8000/health

# Ver logs backend
tail -f backend/app.log

# Conectar a Supabase
# https://supabase.com/dashboard

# Mercado Pago Sandbox
# https://sandbox.mercadopago.com.ar

# Test crear orden (copy-paste en terminal)
curl -X POST http://localhost:8000/api/checkout/create-preference \
  -H "Content-Type: application/json" \
  -d '{"items":[{"product_id":"68afa89d-8ea5-4b70-96c5-b50b09b92fbf","quantity":1}],"customer_email":"test@test.com","customer_name":"Test","customer_phone":"+54123456789"}'
```

---

## 🎯 RESULTADO ESPERADO SESIÓN 6

✅ **Testing completado:**
- Endpoint consolidado funciona
- Webhook procesa correctamente
- Idempotencia verificada
- Stock se decrementa correctamente

✅ **Documentación:**
- Endpoints deprecados marcados
- CHECKOUT_FLOW.md creado
- API documentada

✅ **Paginación:**
- Todos los endpoints devuelven paginación
- Frontend puede pedir page/limit

---

## 📚 REFERENCIAS

**Documentos importantes:**
- `ACCIONES_INMEDIATAS_SESION_6.md` - Scripts de testing (USAR COMO CHEATSHEET)
- `VALIDACION_CHECKOUT_CONSOLIDADO.md` - Análisis técnico (si tienes dudas)
- `ESTADO_PROYECTO_SESION_5.md` - Contexto general

---

## ✨ AL TERMINAR SESIÓN 6

Habrás completado:
- ✅ Validación end-to-end del checkout
- ✅ Deprecación de endpoints
- ✅ Paginación funcional

Estarás listo para:
- ⏳ Sesión 7: Features finales (Reviews, Email, Addresses UI)

---

**TIEMPO ESTIMADO:** 3-4 horas  
**PRIORIDAD:** 🔴 CRÍTICA  
**PRÓXIMO:** Ejecuta los tests en `ACCIONES_INMEDIATAS_SESION_6.md`

