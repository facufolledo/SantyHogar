# 📊 Valores Hardcodeados - Explicación

## ⚠️ IMPORTANTE: Datos Simulados

Actualmente hay varios valores **hardcodeados** (fijos en el código) que en producción deberían venir de APIs reales.

---

## 1. 💳 Cuotas e Intereses

### Ubicación:
`frontend/src/pages/ProductDetail.tsx` - Línea ~20

### Código actual:
```typescript
const INSTALLMENT_CONFIG = [
  { installments: 1, interestRate: 0, label: 'Pago único' },
  { installments: 2, interestRate: 0, label: '2 cuotas sin interés' },
  { installments: 3, interestRate: 0, label: '3 cuotas sin interés' },
  { installments: 6, interestRate: 0.15, label: '6 cuotas' },      // +15% TEA
  { installments: 12, interestRate: 0.30, label: '12 cuotas' },    // +30% TEA
];
```

### ❌ Problema:
- Las cuotas son **inventadas**
- Los intereses son **estimados** (15% y 30%)
- No reflejan las cuotas reales de MercadoPago
- No consideran promociones bancarias

### ✅ Solución en Producción:

#### Opción A: API de MercadoPago (Recomendado)
```typescript
// Endpoint de MercadoPago
GET https://api.mercadopago.com/v1/payment_methods/installments
  ?amount=50000
  &payment_method_id=visa
  &access_token=YOUR_ACCESS_TOKEN

// Respuesta:
{
  "payer_costs": [
    {
      "installments": 1,
      "installment_rate": 0,
      "labels": ["CFT_0,00%|TEA_0,00%"],
      "installment_amount": 50000
    },
    {
      "installments": 3,
      "installment_rate": 0,
      "labels": ["CFT_0,00%|TEA_0,00%"],
      "installment_amount": 16666.67
    },
    {
      "installments": 6,
      "installment_rate": 28.5,
      "labels": ["CFT_31,05%|TEA_28,50%"],
      "installment_amount": 9250
    }
  ]
}
```

#### Implementación sugerida:
```typescript
// backend/app/routes/payment_methods.py
from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()

@router.get("/installments")
async def get_installments(amount: float, payment_method: str = "visa"):
    """Obtener cuotas reales de MercadoPago"""
    mp_token = get_config().mercadopago_access_token
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.mercadopago.com/v1/payment_methods/installments",
            params={
                "amount": amount,
                "payment_method_id": payment_method,
            },
            headers={"Authorization": f"Bearer {mp_token}"}
        )
        
        if response.status_code != 200:
            raise HTTPException(500, "Error al obtener cuotas")
            
        return response.json()
```

```typescript
// frontend/src/api/paymentApi.ts
export async function fetchInstallments(amount: number) {
  const response = await fetch(
    `${API_URL}/installments?amount=${amount}`
  );
  return response.json();
}

// En ProductDetail.tsx
const [installments, setInstallments] = useState([]);

useEffect(() => {
  fetchInstallments(product.price).then(setInstallments);
}, [product.price]);
```

#### Opción B: Configuración en Base de Datos
Crear tabla `installment_config` con:
- `min_amount` / `max_amount`
- `installments`
- `interest_rate`
- `bank` (opcional)
- `active` (boolean)

---

## 2. 🏦 Tarjetas y Medios de Pago

### Ubicación:
`frontend/src/pages/ProductDetail.tsx` - Sección de medios de pago

### Código actual:
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {/* Mercado Pago - SVG hardcodeado */}
  {/* Visa - SVG hardcodeado */}
  {/* Mastercard - SVG hardcodeado */}
  {/* American Express - SVG hardcodeado */}
</div>
```

### ❌ Problema:
- Los iconos son **SVG dibujados manualmente**
- Las tarjetas mostradas son **fijas**
- No reflejan los medios de pago realmente configurados en tu cuenta de MercadoPago

### ✅ Solución en Producción:

#### API de MercadoPago - Payment Methods
```typescript
GET https://api.mercadopago.com/v1/payment_methods
  ?access_token=YOUR_ACCESS_TOKEN

// Respuesta:
[
  {
    "id": "visa",
    "name": "Visa",
    "payment_type_id": "credit_card",
    "status": "active",
    "secure_thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/visa.gif",
    "thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/visa.gif"
  },
  {
    "id": "master",
    "name": "Mastercard",
    "payment_type_id": "credit_card",
    "status": "active",
    "secure_thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/master.gif",
    "thumbnail": "https://www.mercadopago.com/org-img/MP3/API/logos/master.gif"
  }
]
```

#### Implementación sugerida:
```typescript
// backend/app/routes/payment_methods.py
@router.get("/payment-methods")
async def get_payment_methods():
    """Obtener medios de pago disponibles"""
    mp_token = get_config().mercadopago_access_token
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.mercadopago.com/v1/payment_methods",
            headers={"Authorization": f"Bearer {mp_token}"}
        )
        
        if response.status_code != 200:
            raise HTTPException(500, "Error al obtener medios de pago")
            
        # Filtrar solo tarjetas activas
        methods = response.json()
        return [m for m in methods if m["status"] == "active"]
```

```typescript
// frontend/src/pages/ProductDetail.tsx
const [paymentMethods, setPaymentMethods] = useState([]);

useEffect(() => {
  fetch(`${API_URL}/payment-methods`)
    .then(res => res.json())
    .then(setPaymentMethods);
}, []);

// Renderizar dinámicamente
{paymentMethods.map(method => (
  <div key={method.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
    <img src={method.secure_thumbnail} alt={method.name} className="w-8 h-8" />
    <div>
      <p className="text-xs font-semibold">{method.name}</p>
      <p className="text-xs text-gray-500">{method.payment_type_id}</p>
    </div>
  </div>
))}
```

---

## 3. 💰 Impuestos (IVA)

### Ubicación:
`frontend/src/pages/ProductDetail.tsx` - Línea ~18

### Código actual:
```typescript
const IVA_RATE = 0.21; // 21% IVA en Argentina
```

### ✅ Este está bien!
El IVA del 21% es correcto para Argentina y es estable. Pero podrías:

#### Opción A: Configuración en Backend
```python
# backend/app/config.py
class Config(BaseSettings):
    iva_rate: float = Field(default=0.21, description="IVA rate")
```

#### Opción B: Base de datos (si tenés productos con diferentes IVA)
Algunos productos tienen IVA reducido (10.5%) o están exentos (0%).

```sql
ALTER TABLE productos ADD COLUMN iva_rate DECIMAL(5,4) DEFAULT 0.21;
```

---

## 📋 Resumen de Cambios Necesarios

### Prioridad Alta 🔴
1. **Cuotas de MercadoPago** - Usar API real
2. **Medios de pago** - Obtener de MercadoPago

### Prioridad Media 🟡
3. **IVA configurable** - Mover a config o DB

### Prioridad Baja 🟢
4. **Iconos de tarjetas** - Usar thumbnails de MercadoPago

---

## 🔧 Implementación Paso a Paso

### Paso 1: Crear endpoint en backend
```bash
# Crear archivo
touch backend/app/routes/payment_methods.py
```

### Paso 2: Agregar rutas en main.py
```python
from app.routes import payment_methods

app.include_router(payment_methods.router, prefix="/api/payment-methods", tags=["payment"])
```

### Paso 3: Crear API client en frontend
```bash
# Crear archivo
touch frontend/src/api/paymentApi.ts
```

### Paso 4: Actualizar ProductDetail
- Reemplazar `INSTALLMENT_CONFIG` con llamada a API
- Reemplazar iconos hardcodeados con datos dinámicos

---

## 📚 Documentación de Referencia

- [MercadoPago - Payment Methods](https://www.mercadopago.com.ar/developers/en/reference/payment_methods/_payment_methods/get)
- [MercadoPago - Installments](https://www.mercadopago.com.ar/developers/en/reference/payment_methods/_payment_methods_installments/get)
- [AFIP - Alícuotas de IVA](https://www.afip.gob.ar/iva/)

---

**Fecha:** 2026-05-18  
**Autor:** Kiro AI  
**Estado:** Documentación completa ✅
