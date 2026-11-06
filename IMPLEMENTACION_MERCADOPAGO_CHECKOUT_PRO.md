# 🛒 Implementación MercadoPago Checkout Pro

## 📋 Pasos de Implementación

### 1. Configurar Credenciales de Prueba

Actualizá `backend/.env` con tus credenciales:

```env
# MercadoPago - Credenciales de PRUEBA
MERCADOPAGO_ACCESS_TOKEN=TEST-tu-access-token-aqui
MERCADOPAGO_PUBLIC_KEY=TEST-tu-public-key-aqui
MERCADOPAGO_WEBHOOK_SECRET=tu-webhook-secret-opcional

# URL pública del backend (para webhooks y redirects)
PUBLIC_API_URL=http://localhost:8000
```

### 2. Estructura de Archivos a Crear/Modificar

**Backend:**
- `backend/app/routes/checkout.py` - Nuevo endpoint para crear preferencia
- `backend/app/routes/webhooks.py` - Webhook de MercadoPago
- `backend/app/config.py` - Agregar public_key
- `backend/app/main.py` - Registrar nuevas rutas

**Frontend:**
- `frontend/.env` - Agregar VITE_MP_PUBLIC_KEY
- `frontend/src/pages/Checkout.tsx` - Actualizar con Checkout Pro
- `frontend/src/api/checkoutApi.ts` - Nuevo API client

---

## 🔧 Implementación

### Backend

#### 1. Actualizar Config
```python
# backend/app/config.py
class Config(BaseSettings):
    # ... existing fields ...
    
    mercadopago_access_token: str = Field(..., description="MercadoPago access token")
    mercadopago_public_key: str = Field(default="", description="MercadoPago public key")
    mercadopago_webhook_secret: Optional[str] = Field(None, description="MercadoPago webhook secret")
    
    public_api_url: str = Field(
        default="http://localhost:8000",
        description="URL pública del backend (webhook Mercado Pago, back_urls)",
    )
```

#### 2. Crear Endpoint de Checkout
```python
# backend/app/routes/checkout.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import mercadopago
from app.config import get_config
from app.database.connection import get_supabase

router = APIRouter()

class CheckoutItem(BaseModel):
    product_id: str
    quantity: int

class CheckoutRequest(BaseModel):
    items: list[CheckoutItem]
    customer_email: str
    customer_name: str
    customer_phone: str

@router.post("/create-preference")
async def create_checkout_preference(request: CheckoutRequest):
    """Crear preferencia de pago en MercadoPago"""
    config = get_config()
    sdk = mercadopago.SDK(config.mercadopago_access_token)
    
    # Obtener productos de Supabase
    supabase = get_supabase()
    product_ids = [item.product_id for item in request.items]
    
    response = supabase.table("productos").select("*").in_("id", product_ids).execute()
    products = {p["id"]: p for p in response.data}
    
    # Construir items para MercadoPago
    mp_items = []
    total = 0
    
    for item in request.items:
        product = products.get(item.product_id)
        if not product:
            raise HTTPException(404, f"Producto {item.product_id} no encontrado")
        
        if product["stock"] < item.quantity:
            raise HTTPException(400, f"Stock insuficiente para {product['name']}")
        
        unit_price = float(product["price"])
        subtotal = unit_price * item.quantity
        total += subtotal
        
        mp_items.append({
            "id": product["id"],
            "title": product["name"],
            "description": product.get("description", "")[:255],
            "picture_url": product["images"][0] if product.get("images") else None,
            "category_id": product.get("category", "others"),
            "quantity": item.quantity,
            "unit_price": unit_price,
            "currency_id": "ARS",
        })
    
    # Crear preferencia
    preference_data = {
        "items": mp_items,
        "payer": {
            "name": request.customer_name,
            "email": request.customer_email,
            "phone": {
                "number": request.customer_phone
            }
        },
        "back_urls": {
            "success": f"{config.frontend_url}/checkout/success",
            "failure": f"{config.frontend_url}/checkout/failure",
            "pending": f"{config.frontend_url}/checkout/pending",
        },
        "auto_return": "approved",
        "notification_url": f"{config.public_api_url}/api/webhooks/mercadopago",
        "statement_descriptor": "SANTYHOGAR",
        "external_reference": f"ORDER-{request.customer_email}-{int(time.time())}",
        "metadata": {
            "customer_email": request.customer_email,
            "customer_name": request.customer_name,
            "customer_phone": request.customer_phone,
        }
    }
    
    preference_response = sdk.preference().create(preference_data)
    preference = preference_response["response"]
    
    if preference_response["status"] != 201:
        raise HTTPException(500, "Error al crear preferencia de pago")
    
    return {
        "preference_id": preference["id"],
        "init_point": preference["init_point"],  # URL para web
        "sandbox_init_point": preference["sandbox_init_point"],  # URL para testing
    }
```

#### 3. Crear Webhook Handler
```python
# backend/app/routes/webhooks.py
from fastapi import APIRouter, Request, HTTPException
import hmac
import hashlib
import mercadopago
from app.config import get_config
from app.database.connection import get_supabase

router = APIRouter()

@router.post("/mercadopago")
async def mercadopago_webhook(request: Request):
    """Webhook de MercadoPago para notificaciones de pago"""
    config = get_config()
    
    # Verificar firma (si está configurado el secret)
    if config.mercadopago_webhook_secret:
        signature = request.headers.get("x-signature")
        # Implementar verificación de firma aquí
        pass
    
    body = await request.json()
    
    # MercadoPago envía diferentes tipos de notificaciones
    if body.get("type") == "payment":
        payment_id = body["data"]["id"]
        
        # Obtener detalles del pago
        sdk = mercadopago.SDK(config.mercadopago_access_token)
        payment_info = sdk.payment().get(payment_id)
        payment = payment_info["response"]
        
        if payment["status"] == "approved":
            # Crear orden en la base de datos
            external_reference = payment.get("external_reference")
            metadata = payment.get("metadata", {})
            
            supabase = get_supabase()
            
            # Crear orden
            order_data = {
                "customer_email": metadata.get("customer_email"),
                "customer_name": metadata.get("customer_name"),
                "customer_phone": metadata.get("customer_phone"),
                "total": payment["transaction_amount"],
                "status": "paid",
                "payment_method": "mercadopago",
                "payment_id": str(payment_id),
                "external_reference": external_reference,
            }
            
            order_response = supabase.table("pedidos").insert(order_data).execute()
            order_id = order_response.data[0]["id"]
            
            # Crear items de la orden
            # (necesitarías guardar los items en metadata o en una tabla temporal)
            
            print(f"✅ Orden {order_id} creada para pago {payment_id}")
    
    return {"status": "ok"}
```

#### 4. Registrar Rutas
```python
# backend/app/main.py
from app.routes import checkout, webhooks

app.include_router(checkout.router, prefix="/api/checkout", tags=["checkout"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["webhooks"])
```

---

### Frontend

#### 1. Configurar Variables de Entorno
```env
# frontend/.env
VITE_MP_PUBLIC_KEY=TEST-tu-public-key-aqui
VITE_API_URL=http://localhost:8000
```

#### 2. Crear API Client
```typescript
// frontend/src/api/checkoutApi.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface CheckoutItem {
  product_id: string;
  quantity: number;
}

export interface CheckoutRequest {
  items: CheckoutItem[];
  customer_email: string;
  customer_name: string;
  customer_phone: string;
}

export interface CheckoutResponse {
  preference_id: string;
  init_point: string;
  sandbox_init_point: string;
}

export async function createCheckoutPreference(
  data: CheckoutRequest
): Promise<CheckoutResponse> {
  const response = await fetch(`${API_URL}/api/checkout/create-preference`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al crear preferencia de pago');
  }

  return response.json();
}
```

#### 3. Actualizar Página de Checkout
```typescript
// frontend/src/pages/Checkout.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createCheckoutPreference } from '../api/checkoutApi';
import { useToast } from '../context/ToastContext';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    
    setLoading(true);
    
    try {
      const checkoutData = {
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        customer_email: formData.email,
        customer_name: formData.name,
        customer_phone: formData.phone,
      };
      
      const response = await createCheckoutPreference(checkoutData);
      
      // Redirigir a MercadoPago
      // En testing usa sandbox_init_point, en producción usa init_point
      const checkoutUrl = import.meta.env.MODE === 'production' 
        ? response.init_point 
        : response.sandbox_init_point;
      
      window.location.href = checkoutUrl;
      
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar el pago');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>
      
      {/* Resumen del carrito */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Tus Datos</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre completo</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="11 1234-5678"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Pagar con MercadoPago'}
            </button>
          </form>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Resumen</h2>
          {/* Mostrar items del carrito */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span>{item.product.name} x{item.quantity}</span>
                  <span>${(item.product.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### 4. Crear Páginas de Resultado
```typescript
// frontend/src/pages/CheckoutSuccess.tsx
export default function CheckoutSuccess() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Pago Exitoso!</h1>
      <p className="text-gray-600 mb-8">
        Tu pedido ha sido procesado correctamente. Recibirás un email con los detalles.
      </p>
      <Link to="/cuenta/pedidos" className="btn-primary">
        Ver mis pedidos
      </Link>
    </div>
  );
}
```

---

## 🧪 Testing

### Tarjetas de Prueba de MercadoPago

**Aprobada:**
- Número: `5031 7557 3453 0604`
- CVV: `123`
- Fecha: Cualquier fecha futura

**Rechazada:**
- Número: `5031 4332 1540 6351`

**Pendiente:**
- Número: `5031 4332 1540 6351`

### Usuarios de Prueba
Crear en: https://www.mercadopago.com.ar/developers/panel/test-users

---

## 📚 Documentación Oficial
- [Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing)
- [Webhooks](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks)
- [Testing](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-integration)

---

**Fecha:** 2026-05-18  
**Sesión:** 4  
**Estado:** Listo para implementar ✅
