# 🎯 ACCIONES INMEDIATAS - SESIÓN 6

**FECHA:** 23 Junio 2026  
**PRIORIDAD:** 🔴 CRÍTICA  
**TIEMPO ESTIMADO:** 3-4 horas

---

## 📋 CHECKLIST EJECUTIVO

### ✅ Validación end-to-end (1-2 horas)

**OBJETIVO:** Verificar que checkout consolidado funciona sin duplicar órdenes

#### 1. Crear Orden con Checkout
```bash
curl -X POST http://localhost:8000/api/checkout/create-preference \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"product_id": "68afa89d-8ea5-4b70-96c5-b50b09b92fbf", "quantity": 1}],
    "customer_email": "test@test.com",
    "customer_name": "Test User",
    "customer_phone": "+54123456789"
  }' | jq .
```

**RESPUESTA ESPERADA:**
```json
{
  "preference_id": "12345678-ABCD-1234",
  "init_point": "https://www.mercadopago.com/checkout/v1/...",
  "sandbox_init_point": "https://sandbox.mercadopago.com/checkout/v1/...",
  "external_reference": "550e8400-e29b-41d4-a716-446655440000",
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "order_number": "2024-00001"
}
```

**GUARDAR:** `order_id` y `preference_id` para próximos tests

---

#### 2. Verificar Orden en BD (pending)
```bash
# Conectar a Supabase console o ejecutar:
SELECT 
  id_orden,
  numero_orden,
  estado,
  id_preferencia,
  total,
  fecha_creacion
FROM ordenes 
WHERE id_orden = '550e8400-e29b-41d4-a716-446655440000'
```

**VALIDACIÓN:**
- [ ] `estado` = `pending` (no pagado aún)
- [ ] `id_preferencia` está presente (vinculada)
- [ ] `numero_orden` es único
- [ ] `total` es correcto

---

#### 3. Verificar Items de Orden
```bash
SELECT 
  id_item,
  id_orden,
  id_producto,
  cantidad,
  precio_unitario
FROM items_orden
WHERE id_orden = '550e8400-e29b-41d4-a716-446655440000'
```

**VALIDACIÓN:**
- [ ] Items creados correctamente
- [ ] Cantidad correcta
- [ ] Precio correcto

---

#### 4. Stock Debe Permanecer Igual
```bash
-- Stock antes de crear orden
SELECT id_producto, stock FROM productos WHERE id_producto = '68afa89d-8ea5-4b70-96c5-b50b09b92fbf'

-- Stock después (debe ser IGUAL)
SELECT id_producto, stock FROM productos WHERE id_producto = '68afa89d-8ea5-4b70-96c5-b50b09b92fbf'
```

**VALIDACIÓN:**
- [ ] Stock NO descontado (pago no procesado aún)
- [ ] Stock solo descuenta cuando webhook dice "paid"

---

#### 5. Simular Webhook Exitoso
```bash
# Mercado Pago envía IPN (simulamos):
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "data": {
      "id": "12345678-payment-id"
    }
  }' | jq .
```

**VALIDACIÓN:**
- [ ] Responde `200 OK`
- [ ] No hay errores en logs

---

#### 6. Verificar Orden Updated (paid)
```bash
SELECT 
  id_orden,
  numero_orden,
  estado,
  payment_id,
  fecha_actualizacion
FROM ordenes 
WHERE id_orden = '550e8400-e29b-41d4-a716-446655440000'
```

**VALIDACIÓN:**
- [ ] `estado` cambió de `pending` a `paid`
- [ ] `payment_id` fue guardado
- [ ] `fecha_actualizacion` es reciente

---

#### 7. Verificar Stock Descontado
```bash
SELECT id_producto, stock FROM productos WHERE id_producto = '68afa89d-8ea5-4b70-96c5-b50b09b92fbf'
```

**VALIDACIÓN:**
- [ ] Stock fue descontado (qty - 1)
- [ ] Solo se descontó 1 vez (no 2x)

---

#### 8. Simular Webhook Reintento (Idempotencia)
```bash
# Mercado Pago reintenta el mismo webhook:
curl -X POST http://localhost:8000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "data": {
      "id": "12345678-payment-id"
    }
  }' | jq .
```

**VALIDACIÓN:**
- [ ] Responde `200 OK` (no error)
- [ ] Orden Sigue con estado `paid` (no cambia 2x)
- [ ] Stock no se descuenta de nuevo

---

#### 9. Crear Segunda Orden (Validar Número Único)
```bash
curl -X POST http://localhost:8000/api/checkout/create-preference \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"product_id": "68afa89d-8ea5-4b70-96c5-b50b09b92fbf", "quantity": 1}],
    "customer_email": "test2@test.com",
    "customer_name": "Test User 2",
    "customer_phone": "+54123456789"
  }' | jq .
```

**GUARDAR:** `order_id` nuevo

```bash
SELECT numero_orden FROM ordenes WHERE id_orden IN (
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001'
)
```

**VALIDACIÓN:**
- [ ] Cada orden tiene `numero_orden` diferente
- [ ] No hay colisiones

---

### ✅ Validación Frontend (30 min)

#### 1. Probar Flujo Completo en Browser
1. [ ] Abrir http://localhost:5173
2. [ ] Agregar producto al carrito
3. [ ] Ir a checkout
4. [ ] Completar datos
5. [ ] Click "Confirmar y pagar"
6. [ ] Verificar que redirige a MP (sandbox)

---

#### 2. Verificar sessionStorage
```javascript
// En browser console:
sessionStorage.getItem('pendingCheckout')
```

**VALIDACIÓN:**
- [ ] Contiene items y timestamp
- [ ] No vacío

---

#### 3. Simular Retorno de MP
1. [ ] En MP sandbox: Click "Pagar"
2. [ ] Debería redirigir a back_urls.success
3. [ ] Frontend muestra "Pedido confirmado"
4. [ ] Muestra order_number

---

### ✅ Limpieza de Endpoints (30 min)

#### 1. Deprecar endpoint viejo
**ARCHIVO:** `backend/app/routes/checkout.py`

```python
@router.post("/create-preference")
async def create_checkout_preference(request: CheckoutRequest):
    """DEPRECATED: Use /api/checkout/create-preference instead"""
    # Opcional: redirigir o devolver error deprecated
    raise HTTPException(
        status_code=410,  # Gone
        detail="Este endpoint está deprecado. Usa POST /api/checkout/create-preference"
    )
```

**O:** Simplemente borrar el archivo si no se usa en ningún lado

---

#### 2. Documentar flujo oficial
**CREAR:** `backend/CHECKOUT_FLOW.md`

```markdown
# Checkout Flow

## Official Endpoint
POST /api/checkout/create-preference

## Request
{
  "items": [{"product_id": "...", "quantity": 1}],
  "customer_email": "...",
  "customer_name": "...",
  "customer_phone": "..."
}

## Response
{
  "preference_id": "...",
  "init_point": "...",
  "order_id": "...",
  "order_number": "..."
}

## Deprecated Endpoints
- POST /api/checkout (old)
- POST /orders (use only for local mode)
```

---

### ✅ Paginación (Completar) - 1 hora

**OBJETIVO:** Aplicar PaginationService a todos endpoints de listado

#### 1. GET /products (general listing)
**ARCHIVO:** `backend/app/routes/products.py`

```python
@router.get("/products")
async def list_products(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    products = await product_service.get_all_products()
    pager = PaginationService(page=page, limit=limit)
    paginated = pager.paginate(
        total=len(products),
        results=products[pager.offset : pager.offset + pager.limit]
    )
    return paginated
```

---

#### 2. GET /orders (admin listado)
**ARCHIVO:** `backend/app/routes/orders.py`

```python
@router.get("/orders")
async def list_orders(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    orders = await order_service.get_all_orders()
    pager = PaginationService(page=page, limit=limit)
    return pager.paginate(
        total=len(orders),
        results=orders[pager.offset : pager.offset + pager.limit]
    )
```

---

#### 3. Verificar en Frontend
```bash
# Test con pagination
curl http://localhost:8000/api/products?page=1&limit=10
curl http://localhost:8000/api/products?page=2&limit=10
```

**VALIDACIÓN:**
- [ ] `page` 1 devuelve primeros 10
- [ ] `page` 2 devuelve siguientes 10
- [ ] Metadata de paginación incluida

---

## 🎯 RESUMEN DE CAMBIOS POR HACER

| Acción | Archivo | Tiempo | Criticidad |
|--------|---------|--------|-----------|
| Testing end-to-end | (scripts) | 1-2h | 🔴 CRÍTICA |
| Validar frontend | (manual) | 30min | 🔴 CRÍTICA |
| Deprecar endpoint viejo | checkout.py | 15min | 🟡 MEDIA |
| Completar paginación | products.py, orders.py | 1h | 🟡 MEDIA |
| Documentar flujo | CHECKOUT_FLOW.md | 15min | 🟢 BAJA |

**TOTAL:** 3-3.5 horas

---

## ✅ CHECKLIST FINAL

- [ ] **Crear orden:** Responde con order_id
- [ ] **Verificar BD:** Estado = pending, sin stock descontado
- [ ] **Simular webhook:** Estado cambia a paid, stock descuenta
- [ ] **Reintento webhook:** Idempotencia funciona
- [ ] **Segunda orden:** Número único
- [ ] **Frontend:** Redirige a MP correctamente
- [ ] **sessionStorage:** Guarda datos
- [ ] **Endpoints viejo:** Deprecado/documentado
- [ ] **Paginación:** Funciona en todos endpoints
- [ ] **Documentación:** Flujo oficial documentado

---

## 📞 COMANDOS RÁPIDOS

```bash
# Start backend
cd backend && python main.py

# Start frontend
cd frontend && npm run dev

# Test checkout endpoint
curl -X POST http://localhost:8000/api/checkout/create-preference \
  -H "Content-Type: application/json" \
  -d '{...}'

# Check logs
tail -f backend/app.log

# Access Supabase
# https://supabase.com/dashboard
```

---

## 🚀 PRÓXIMO PASO DESPUÉS DE SESIÓN 6

**SI validation pasa:** Proceder con features (Reviews, Email, Addresses)

**SI validation falla:** Debug specific issue

---

**PRIORIDAD:** 🔴 CRÍTICA  
**FECHA TARGET:** Hoy (23 Junio)  
**ESTIMADO:** 3-4 horas

