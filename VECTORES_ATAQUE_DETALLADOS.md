# 🎯 Vectores de Ataque Identificados en Santy Hogar

## CRÍTICO - IMPLEMENTAR INMEDIATAMENTE

### 1. 🔴 WEBHOOK MERCADO PAGO SIN VALIDACIÓN DE FIRMA
**Archivo:** `backend/app/routes/webhook.py`  
**Severidad:** CRÍTICO  

**Problema:**
```python
# El webhook recibe notificaciones SIN verificar que vienen de Mercado Pago
@router.post("/webhook")
async def mercadopago_webhook(request: Request):
    body = await request.json()  # ❌ No hay validación
```

**Ataque:**
Un atacante puede fabricar un webhook falso y:
- Marcar órdenes pagadas sin que se haya pagado
- Descontar stock sin cobro
- Generar órdenes fantasma

**Ejemplos de ataque:**
```bash
# El atacante simplemente hace:
curl -X POST https://santyhogar-production.up.railway.app/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "data": {"id": "99999999"},
    "preference_id": "existing-pref-id"
  }'

# Y la orden se marca como pagada sin cobro
```

**Solución - Validar Firma de MP:**
```python
import hmac
import hashlib

def verify_mercadopago_signature(signature: str, request_id: str, timestamp: str, body: bytes) -> bool:
    """Valida que el webhook viene de Mercado Pago."""
    config = get_config()
    secret = config.mercadopago_webhook_secret
    
    # Construcción de string según docs de MP:
    # id,timestamp,shared_secret
    string_to_sign = f"{request_id},{timestamp},{secret}"
    
    expected_signature = hashlib.sha256(string_to_sign.encode()).hexdigest()
    return hmac.compare_digest(signature, expected_signature)

# En el webhook:
@router.post("/webhook")
async def mercadopago_webhook(request: Request):
    # Headers de MP
    signature = request.headers.get("x-signature")
    request_id = request.headers.get("x-request-id")
    timestamp = request.headers.get("x-timestamp")
    
    body = await request.body()
    
    if not verify_mercadopago_signature(signature, request_id, timestamp, body):
        logger.warning("⚠️ Webhook con firma INVÁLIDA - posible ataque")
        return {"status": "ok"}  # Responder OK igual para no dar pistas
```

---

### 2. 🔴 ADMIN MASTER PASSWORD EN PLAINTEXT EN MEMORY
**Archivo:** `backend/app/config.py`  
**Severidad:** CRÍTICO  

**Problema:**
```python
admin_master_password: Optional[str] = Field(None)

# En admin_users.py:
if request.master_password.strip() != config.admin_master_password.strip():
    raise HTTPException(...)  # Comparación directa
```

**Ataques posibles:**
1. **Memory dump attack:** Si alguien accede a RAM del servidor, obtiene la contraseña
2. **Timing attack:** Comparación de strings no es constante en tiempo
3. **Acceso a código:** La contraseña está visible en Railway variables

**Solución - Usar hash y comparación segura:**
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("")
async def create_admin_user(request: CreateAdminRequest):
    config = get_config()
    
    # Comparación timing-safe
    if not config.admin_master_password:
        raise HTTPException(status_code=500, detail="...")
    
    # Usar bcrypt para verificar (es timing-safe automáticamente)
    if not pwd_context.verify(request.master_password, config.admin_master_password):
        raise HTTPException(status_code=403, detail="Contraseña maestra incorrecta")
```

**Mejor aún - Usar Supabase RLS:**
```python
# En lugar de master password, usar JWT + RLS
# Solo usuarios con rol="admin_super" pueden crear admins
```

---

### 3. 🔴 FALTA DE VALIDACIÓN EN ORDERS - PRECIO BYPASS
**Archivo:** `backend/app/routes/orders.py` y `checkout_pro.py`  
**Severidad:** CRÍTICO  

**Problema:**
Un atacante puede:
- Cambiar el precio en el frontend
- Enviar precio falso en el request
- Comprar productos a $0.01

**Verificar en:**
```python
# backend/app/routes/checkout_pro.py
# backend/app/services/order_service.py
```

**Ataque:**
```javascript
// En console del navegador:
const items = [
  { product_id: "123", quantity: 1, price: 0.01 }  // ❌ Precio falso
];
fetch('/api/checkout/create-preference', {
  method: 'POST',
  body: JSON.stringify({ items, customer_email: 'hack@evil.com' })
})
```

**Solución:**
```python
# Nunca confiar en el precio del cliente
# SIEMPRE validar precio desde la BD

async def create_order(self, request: OrderRequest):
    for item in request.items:
        # ✅ Obtener precio real de BD
        product = await self.db.get_product(item.product_id)
        
        if product.price != item.price:  # Si cliente mandó diferente
            logger.warning(f"⚠️ PRICE MISMATCH: cliente mandó ${item.price}, BD tiene ${product.price}")
            raise InvalidPriceError(f"Precio incorrecto para producto {item.product_id}")
```

---

### 4. 🔴 ORDEN CREATION SIN VALIDACIÓN DE USUARIO AUTENTICADO
**Archivo:** `backend/app/routes/checkout_pro.py`  
**Severidad:** ALTO  

**Problema:**
```python
async def create_checkout_preference(body: dict = Body(...)):
    # No hay validación de que el usuario está autenticado
    # Cualquiera puede crear órdenes con email falso
```

**Ataque:**
```bash
# Atacante crea órdenes spam
for i in {1..1000}; do
  curl -X POST https://santyhogar-production.up.railway.app/api/checkout/create-preference \
    -H "Content-Type: application/json" \
    -d '{
      "user_id": "fake-'$i'",
      "customer_email": "spam-'$i'@evil.com",
      "items": [{"product_id": "1", "quantity": 1}]
    }'
done
```

**Solución:**
```python
from fastapi import Depends
from app.deps import get_current_user

@router.post("/checkout/create-preference")
async def create_checkout_preference(
    body: dict = Body(...),
    current_user = Depends(get_current_user)  # ✅ Validar usuario
):
    # Validar que user_id matches current_user
    if body.get("user_id") and body.get("user_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="No puedes crear órdenes para otro usuario")
```

---

## ALTO - IMPLEMENTAR ESTA SEMANA

### 5. 🟠 RACE CONDITION EN STOCK
**Archivo:** `backend/app/services/product_service.py`  
**Severidad:** ALTO  

**Problema:**
Dos personas compran el último producto al mismo tiempo:
```
T1: User A - Query stock = 1 ✓
T2: User B - Query stock = 1 ✓
T3: User A - Decrement stock (1 → 0)
T4: User B - Decrement stock (0 → -1) ❌ NEGATIVO
```

**Resultado:** Venden -1 productos

**Ataque sincronizado:**
```javascript
// Dos navegadores hacen click "Comprar" exactamente al mismo tiempo
// en la tienda
```

**Solución - SQL Atomic Decrement:**
```python
# NO HACER:
stock = get_stock(product_id)
if stock > 0:
    update_stock(stock - 1)

# ✅ HACER - Transaction atómica:
async def decrement_stock_atomic(self, product_id: str, quantity: int) -> bool:
    result = supabase.rpc('decrement_stock', {
        'product_id': product_id,
        'amount': quantity
    }).execute()
    return result.data
```

SQL en Supabase:
```sql
CREATE OR REPLACE FUNCTION decrement_stock(product_id TEXT, amount INT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE productos
    SET stock = stock - amount
    WHERE id_producto = product_id AND stock >= amount;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
```

---

### 6. 🟠 INYECCIÓN DE DATOS EN ADMIN USERS
**Archivo:** `backend/app/routes/admin_users.py`  
**Severidad:** ALTO  

**Problema:**
```python
@field_validator("name", mode="before")
@classmethod
def validate_admin_name(cls, v: str) -> str:
    # Validación débil
    if not validate_name(v, min_len=2, max_len=100):
        raise ValueError("...")
    return v.strip()
```

**Ataque - Script Injection en Supabase:**
Un admin malicioso podría:
```javascript
// Crear un admin con nombre que contiene JavaScript
{
  "name": "<img src=x onerror='alert(1)'>",
  "email": "hacker@admin.com"
}
```

**Solución:**
```python
from html import escape

@field_validator("name", mode="before")
@classmethod
def validate_admin_name(cls, v: str) -> str:
    # Limpiar HTML
    v = escape(v)
    
    # Validar
    if not validate_name(v, min_len=2, max_len=100):
        raise ValueError("...")
    
    return v.strip()
```

---

### 7. 🟠 INFORMACIÓN SENSIBLE EN LOGS
**Archivo:** Múltiples rutas  
**Severidad:** ALTO  

**Problema:**
```python
logger.info(f"💳 Estado del pago {payment_id}: {payment_data}")
# Se loguea TODO el payment_data que puede contener datos sensibles
```

**Ataque:**
- Si los logs están expuestos, atacante ve:
  - Datos de tarjeta (parcialmente)
  - Montos de transacciones
  - Emails y teléfonos

**Solución:**
```python
def sanitize_payment_data(data: dict) -> dict:
    """Remover datos sensibles antes de loguear."""
    return {
        'id': data.get('id'),
        'status': data.get('status'),
        'amount': data.get('amount'),
        # NO loguear:
        # 'card': data.get('card')
        # 'payer': data.get('payer')
    }

logger.info(f"💳 Payment: {sanitize_payment_data(payment_data)}")
```

---

### 8. 🟠 FALTA DE RATE LIMITING EN ENDPOINTS SENSIBLES
**Archivo:** Múltiples  
**Severidad:** ALTO  

**Problema:**
Aunque hay rate limiting global (100 req/min), faltan límites específicos para:

```python
# Brute force admin password
POST /admin/users (sin límite específico)

# Brute force customer data
GET /customers/{id} (sin validación de ownership)

# Enumeration de órdenes
GET /orders (sin filtrado)
```

**Ataque - Brute force master password:**
```bash
# 100 requests/min = fácil atacar en horarios bajos
for i in {1..1000}; do
  curl -X POST https://santyhogar-production.up.railway.app/admin/users \
    -H "Content-Type: application/json" \
    -d "{\"master_password\": \"pass$i\", \"email\": \"a$i@test.com\", \"password\": \"Pwd123!\"}"
done
```

**Solución:**
```python
from slowapi import Limiter

limiter = Limiter(key_func=lambda: request.remote_addr)

@router.post("")
@limiter.limit("5/minute")  # ✅ 5 intentos por minuto máximo
async def create_admin_user(request: CreateAdminRequest):
    ...
```

---

## MEDIO - IMPLEMENTAR PRÓXIMAS 2-3 SEMANAS

### 9. 🟡 ENUMERATION DE ÓRDENES
**Archivo:** `backend/app/routes/orders.py`  
**Severidad:** MEDIO  

**Problema:**
```python
@router.get("/orders")
async def list_orders(page: int = 1, limit: int = 50):
    # Cualquiera puede listar TODAS las órdenes
    orders = await order_service.get_all_orders(page=page, limit=limit)
```

**Ataque:**
Un usuario puede enumerar TODAS las órdenes de otros usuarios cambiando page/limit.

**Solución:**
```python
# Agregar autenticación y RLS
@router.get("/orders")
async def list_orders(
    page: int = 1,
    limit: int = 50,
    current_user = Depends(get_current_user)  # ✅
):
    # Si es admin, puede ver todas
    if current_user.role == "admin":
        return await order_service.get_all_orders(page, limit)
    
    # Si es usuario normal, solo sus órdenes
    return await order_service.get_user_orders(current_user.id, page, limit)
```

---

### 10. 🟡 FALTA DE VALIDACIÓN CSRF
**Archivo:** Frontend/Backend  
**Severidad:** MEDIO  

**Problema:**
Sin protección CSRF, un sitio malicioso puede:
- Hacer que tu cliente compre productos
- Eliminar admins
- Cambiar datos de cuenta

**Solución:**
```python
# Backend: Validar CSRF token en POST/PATCH/DELETE
from fastapi import Header, HTTPException

async def verify_csrf_token(
    x_csrf_token: str = Header(None),
    request: Request = None
):
    # Token debe estar en header
    if not x_csrf_token:
        raise HTTPException(status_code=403, detail="CSRF token missing")
    
    # Validar contra session
    ...

@router.post("/orders")
async def create_order(
    body: OrderRequest,
    csrf_validated = Depends(verify_csrf_token)
):
    ...
```

---

### 11. 🟡 FALTA DE VALIDACIÓN DE EMAIL
**Archivo:** Múltiples  
**Severidad:** MEDIO  

**Problema:**
No se valida que el email es real:
```python
# Un atacante puede usar fake@fake.fake
# O un email no verificado
```

**Solución:**
```python
# Verificar email con confirmación
async def send_verification_email(email: str):
    token = generate_token()
    # Guardar token en BD con TTL 24h
    await db.save_email_token(email, token, ttl=86400)
    
    # Enviar email
    send_email(email, f"Confirma: {domain}/verify-email?token={token}")

# Endpoint para confirmar
@router.post("/verify-email")
async def verify_email(token: str):
    email = await db.get_email_by_token(token)
    if not email:
        raise HTTPException(status_code=400, detail="Token inválido")
    
    # Marcar email como verificado
    await db.verify_email(email)
```

---

### 12. 🟡 FALTA DE AUDITORÍA EN CAMBIOS CRÍTICOS
**Archivo:** Admin panel  
**Severidad:** MEDIO  

**Problema:**
No hay logs de:
- Quién cambió precios
- Quién canceló órdenes
- Quién eliminó productos

**Solución:**
```python
# Crear tabla de auditoría
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    admin_id UUID,
    action TEXT,  -- "price_update", "order_cancel", etc.
    resource_id TEXT,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP
);

# En cada operación crítica:
async def update_product_price(product_id: str, new_price: float):
    old_price = await db.get_product_price(product_id)
    
    await db.update_price(product_id, new_price)
    
    # Registrar en auditoría
    await db.log_audit(
        admin_id=current_user.id,
        action="price_update",
        resource_id=product_id,
        old_value=str(old_price),
        new_value=str(new_price)
    )
```

---

### 13. 🟡 NO HAY VALIDACIÓN DE CANTIDAD NEGATIVA
**Archivo:** `checkout_pro.py`  
**Severidad:** MEDIO  

**Ataque:**
```javascript
// Enviar cantidad negativa para "reembolsarse"
{
  "items": [
    { "product_id": "123", "quantity": -100 }  // ❌
  ]
}
```

**Solución:**
```python
@router.post("/checkout/create-preference")
async def create_checkout_preference(body: dict = Body(...)):
    items = body.get("items") or []
    
    for item in items:
        quantity = item.get("quantity", 1)
        
        if quantity <= 0:  # ✅ Validar cantidad positiva
            raise HTTPException(
                status_code=400,
                detail=f"Cantidad debe ser > 0, recibido: {quantity}"
            )
```

---

## BAJO - NICE TO HAVE

### 14. 🟢 FALTA DE ENCRYPTION EN DATOS SENSIBLES
**Archivo:** BD  
**Severidad:** BAJO (si usar HTTPS)  

- Direcciones deberían estar encriptadas
- Teléfonos deberían estar masked
- Datos de tarjeta jamás guardar (dejar en Mercado Pago)

### 15. 🟢 FALTA DE BACKUP Y DISASTER RECOVERY
**Archivo:** Supabase  
**Severidad:** BAJO  

Verificar que:
- [ ] Backups automáticos cada 24h
- [ ] Plan de recovery documentado
- [ ] Testear restore regularly

---

## 📋 CHECKLIST PRIORIZADO

### ESTA SESIÓN:
- [ ] Agregar validación de firma Mercado Pago webhook
- [ ] Hashear admin master password
- [ ] Validar precio desde BD en órdenes
- [ ] Validar usuario autenticado en checkout

### ESTA SEMANA:
- [ ] Implementar race condition fix con SQL atómico
- [ ] Agregar rate limiting específico en /admin/users
- [ ] Sanitizar logs de datos sensibles
- [ ] Implementar RLS en Supabase

### PRÓXIMAS 2 SEMANAS:
- [ ] Agregar auditoría de cambios admin
- [ ] Validación de emails
- [ ] CSRF protection
- [ ] Validación de cantidades positivas

---

## 🔗 Referencias Útiles

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- FastAPI Security: https://fastapi.tiangolo.com/tutorial/security/
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Mercado Pago Webhooks: https://www.mercadopago.com.ar/developers/es/docs/checkout-api/how-tos/webhooks

---

## ❓ Preguntas

¿Quieres que implemente primero:
1. Validación de webhook MP (más crítico - evita fraude inmediato)
2. Hasheo de master password
3. Validación de precio

O todo en paralelo?
