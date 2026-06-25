# ✅ TESTING & VALIDACIÓN: Qué verificar antes de producción

---

## 1. 🧪 TESTING DE BACKEND

### 1.1 InstallmentsService

#### Test 1: DEBUG Mode funciona
```bash
# .env debe tener: DEBUG=true

curl http://localhost:8000/api/installments/calculate?amount=5000

# ✅ Esperado: Array con métodos de pago mock
[
  {
    "payment_method_id": "visa",
    "name": "Visa",
    "payer_costs": [...]
  },
  ...
]

# ✅ Validar: Respuesta es rápida (<500ms) porque es mock
```

#### Test 2: Formato de respuesta es correcto
```bash
curl http://localhost:8000/api/installments/calculate?amount=10000 | jq .

# ✅ Todos deben tener estructura:
{
  "payment_method_id": "string",
  "payment_type_id": "credit_card",
  "name": "string",
  "secure_thumbnail": "url",
  "thumbnail": "url",
  "payer_costs": [
    {
      "installments": number,
      "installment_amount": number,
      "total_amount": number,
      "interest_rate": number,
      "labels": ["CFT_X%"]
    }
  ]
}
```

#### Test 3: BIN number validation
```bash
# ✅ Válido - 6 dígitos
curl "http://localhost:8000/api/installments/calculate?amount=5000&bin_number=453036"

# ❌ Inválido - menos de 6 dígitos
curl "http://localhost:8000/api/installments/calculate?amount=5000&bin_number=4530"
# Esperado: error o ignorar

# ❌ Inválido - caracteres no numéricos
curl "http://localhost:8000/api/installments/calculate?amount=5000&bin_number=4530ab"
# Esperado: error
```

#### Test 4: Cálculo de precio por cuota
```bash
curl "http://localhost:8000/api/installments/installment-price?amount=12000&installments=6"

# ✅ Esperado:
{
  "installments": 6,
  "installment_amount": 2000,  # 12000 / 6
  "total_amount": 12000,
  "interest_rate": 0,
  "tea": 0,
  "cft": 0
}
```

#### Test 5: Validación de parámetros
```bash
# ❌ amount negativo
curl "http://localhost:8000/api/installments/calculate?amount=-5000"
# Esperado: error 422

# ❌ installments > 12
curl "http://localhost:8000/api/installments/installment-price?amount=5000&installments=24"
# Esperado: error 422

# ❌ installments = 0
curl "http://localhost:8000/api/installments/installment-price?amount=5000&installments=0"
# Esperado: error 422
```

---

### 1.2 Productos y Órdenes

#### Test 6: GET /products/{id} funciona
```bash
curl http://localhost:8000/api/products/abc123

# ✅ Esperado: Producto con todos los campos
{
  "id": "abc123",
  "name": "Producto",
  "price": 5000,
  "image_url": "https://...",
  "category": "...",
  ...
}
```

#### Test 7: Crear orden con cuotas
```bash
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "user123",
    "items": [
      {
        "product_id": "prod123",
        "quantity": 1,
        "price": 5000
      }
    ],
    "installments": 6,  # ← NUEVO
    "payment_method": "mercado_pago"
  }'

# ✅ Esperado: Orden creada con campo installments
{
  "order_number": "ORD-2026-001",
  "installments": 6,
  "total": 5000,
  "status": "pending"
}
```

---

## 2. 🎨 TESTING DE FRONTEND

### 2.1 Componente CardBINInput

```tsx
// Test: Solo números, máximo 6 dígitos

import { render, screen, fireEvent } from '@testing-library/react';
import CardBINInput from './CardBINInput';

test('CardBINInput accepts only numbers', () => {
  const onChange = jest.fn();
  render(<CardBINInput value="" onChange={onChange} />);
  
  const input = screen.getByRole('textbox');
  
  // Intentar ingresar "abc"
  fireEvent.change(input, { target: { value: 'abc' } });
  
  // ✅ Esperado: onChange no llamado (validación)
  expect(onChange).not.toHaveBeenCalled();
});

test('CardBINInput limits to 6 digits', () => {
  const onChange = jest.fn();
  render(<CardBINInput value="" onChange={onChange} />);
  
  const input = screen.getByRole('textbox');
  
  // Intentar ingresar 7 dígitos
  fireEvent.change(input, { target: { value: '4530361234' } });
  
  // ✅ Esperado: Máximo 6 caracteres
  expect(input.value).toBe('453036');
});
```

### 2.2 Componente PaymentMethodsWithInstallments

```tsx
// Test: Modal muestra opciones y permite seleccionar

test('PaymentMethodsWithInstallments displays payment methods', async () => {
  render(
    <PaymentMethodsWithInstallments 
      productPrice={5000}
      onSelect={jest.fn()}
    />
  );
  
  // ✅ Esperado: Se ve Visa, Mastercard, Amex
  await screen.findByText('Visa');
  await screen.findByText('Mastercard');
  await screen.findByText('American Express');
});

test('PaymentMethodsWithInstallments allows selection', async () => {
  const onSelect = jest.fn();
  render(
    <PaymentMethodsWithInstallments 
      productPrice={5000}
      onSelect={onSelect}
    />
  );
  
  // Usuario selecciona: Mastercard - 6 cuotas
  const option = await screen.findByText(/Mastercard.*6 cuotas/);
  fireEvent.click(option);
  
  // ✅ Esperado: onSelect llamado con parámetros correctos
  expect(onSelect).toHaveBeenCalledWith('master', 6);
});

test('Calculates installment price correctly', async () => {
  render(
    <PaymentMethodsWithInstallments productPrice={12000} />
  );
  
  // ✅ Esperado: Muestra $2,000 × 6 cuotas
  await screen.findByText('$2,000');
  await screen.findByText('6 cuotas');
});
```

### 2.3 ProductDetail Integration

```tsx
// Test: Botón "Ver medios de pago" funciona

test('ProductDetail shows payment methods button', () => {
  render(
    <ProductDetail 
      productId="abc123"
      mockData={{ price: 5000, name: "Producto" }}
    />
  );
  
  // ✅ Esperado: Botón existe
  const button = screen.getByRole('button', { name: /Ver medios de pago/i });
  expect(button).toBeInTheDocument();
});

test('Clicking payment methods opens modal', async () => {
  render(<ProductDetail productId="abc123" />);
  
  const button = screen.getByRole('button', { name: /Ver medios de pago/i });
  fireEvent.click(button);
  
  // ✅ Esperado: Modal abre
  await screen.findByText('Opciones de cuotas');
});
```

---

## 3. 🛒 TESTING DEL FLUJO COMPLETO (E2E)

### 3.1 Escenario: Cliente compra con cuotas

```gherkin
Feature: Cliente compra producto con cuotas

Scenario: Cliente ve opciones de cuotas antes de checkout
  Given Cliente en ProductDetail de producto "$5,000"
  When Cliente hace click en "Ver medios de pago"
  Then Se abre modal con opciones de cuotas
  And Ve Visa, Mastercard, Amex
  And Puede seleccionar "Mastercard - 6 cuotas"
  And Ve precio por cuota: "$833.33"
  
  When Cliente cierra modal y hace click "Agregar al carrito"
  Then Producto se agrega al carrito
  
  When Cliente va a Cart
  Then Ve resumen: "Mastercard - 6 cuotas"
  And Puede cambiar medio de pago
  
  When Cliente procede a Checkout
  Then Ve resumen de cuotas
  And MercadoPago Checkout Pro se abre
  And Cuotas seleccionadas están preseleccionadas
  
  When Cliente paga
  Then Vuelve a CheckoutSuccess
  And Orden muestra "6 cuotas de Mastercard"
```

### 3.2 Escenario: Admin sube imagen de producto

```gherkin
Feature: Admin sube imagen de producto

Scenario: Admin arrastra imagen a ProductFormModal
  Given Admin en AdminProducts
  When Admin hace click en "Nuevo producto"
  Then Se abre ProductFormModal
  
  When Admin arrastra imagen a área de upload
  Then Se muestra preview de imagen
  And "✓ Imagen cargada" aparece
  
  When Admin rellena datos y guarda
  Then Producto se crea
  And En ProductDetail la imagen aparece correctamente
```

### 3.3 Escenario: Direcciones guardadas

```gherkin
Feature: Direcciones guardadas funcionan

Scenario: Cliente usa dirección guardada en checkout
  Given Cliente logueado con 2 direcciones guardadas
  When Cliente va a Checkout
  Then Ve lista de direcciones guardadas
  
  When Cliente selecciona "Usar esta dirección"
  Then Formulario se autocompleta
  
  When Cliente procede a pagar
  Then Orden creada con dirección correcta
```

---

## 4. 🧪 TESTING MANUAL - CHECKLIST

### 4.1 Backend Manual Testing

```
Prueba 1: InstallmentsService en DEBUG mode
□ Iniciar backend con DEBUG=true
□ GET /api/installments/calculate?amount=5000
□ ✅ Verifica: Respuesta mock aparece (<500ms)
□ ✅ Verifica: No hay errores SSL

Prueba 2: InstallmentsService en PRODUCTION mode (simulado)
□ Cambiar .env a DEBUG=false
□ GET /api/installments/calculate?amount=5000
□ ⚠️ Nota: Si no está configurado MP, fallará (esperado)
□ ✅ Verifica: Error es claro, no genérico

Prueba 3: Endpoints de órdenes
□ Crear orden con campo installments
□ ✅ Verifica: Order creada con installments guardados
□ GET /orders/{id}
□ ✅ Verifica: installments aparece en respuesta

Prueba 4: SSL Fix
□ En desarrollo: GET a API externa debe funcionar
□ ✅ Verifica: No hay SSL verification errors

Prueba 5: Image Upload
□ POST /products/upload-image (multipart)
□ Archivos: test.jpg, test.png, test.gif
□ ✅ Verifica: Archivos se suben correctamente
□ ✅ Verifica: URL retornada es válida
```

### 4.2 Frontend Manual Testing

```
Prueba 1: CardBINInput
□ Ir a ProductDetail
□ Abrir modal de pagos
□ Input de BIN aparece
□ Escribir: "453"
□ ✅ Verifica: Solo 3 caracteres, no más

Prueba 2: Calcular cuotas
□ Ingresar BIN: "453036"
□ ✅ Verifica: Cuotas cargan (puede ser mock)
□ ✅ Verifica: Se ve Visa, Mastercard, Amex

Prueba 3: Seleccionar cuotas
□ Click en "Mastercard - 6 cuotas"
□ ✅ Verifica: Modal muestra precio por cuota

Prueba 4: Persistencia de selección
□ Seleccionar "Mastercard - 6 cuotas"
□ Cerrar modal
□ Agregar a carrito
□ Ir a Cart
□ ✅ Verifica: Selección persiste

Prueba 5: Checkout con cuotas
□ En Checkout, ir a pagar
□ ✅ Verifica: Cuotas aparecen en MP Checkout Pro

Prueba 6: Responsive
□ Abrir en mobile (375px)
□ ✅ Verifica: Modal se ve bien
□ ✅ Verifica: BINInput funciona
□ Abrir en tablet (768px)
□ ✅ Verifica: Todo visible

Prueba 7: Favoritos sincronizados
□ Loguearse
□ Favoritar producto
□ Cambiar navegador (incognito)
□ Ir a Favoritos
□ ✅ Verifica: Favorito aparece en otro navegador
```

### 4.3 Producción Manual Testing (Railway)

```
Prueba 1: Deployment sin errores
□ Hacer git push a main/version1
□ Railway auto-deploya
□ ✅ Verifica: Build exitoso
□ ✅ Verifica: No hay errores en logs

Prueba 2: Backend funciona en Railway
□ curl https://api.santyhogar.railway.app/api/health
□ ✅ Verifica: 200 OK

Prueba 3: Instlments en Railway
□ curl https://api.santyhogar.railway.app/api/installments/calculate?amount=5000
□ ✅ Verifica: Respuesta correcta
□ ⚠️ Nota: En Railway, puede llamar API real de MP

Prueba 4: SSL en Railway
□ Todas las llamadas deben usar HTTPS
□ ✅ Verifica: No hay mixed content warnings
□ ✅ Verifica: Certificado es válido

Prueba 5: MercadoPago Checkout Pro
□ Hacer purchase en producción
□ ✅ Verifica: Checkout abre sin problemas
□ ✅ Verifica: Cuotas se ven correctamente
```

---

## 5. 📊 VALIDACIÓN DE DATOS CRÍTICOS

### 5.1 Mock Data de Cuotas

**Pregunta:** ¿Son realistas los datos mock?

```
Datos actuales (DEBUG=true):

Visa:
  - 1x: 0%
  - 3x: 0%
  - 6x: 0%

Mastercard:
  - 1x: 0%
  - 3x: 5% (+$166.67 en $5000)
  - 6x: 10% (+$500 en $5000)
  - 12x: 15% (+$750 en $5000)

Amex:
  - 1x: 0%
  - 3x: 0%
```

**VALIDACIÓN NECESARIA:**
- [ ] Comparar con tasas reales de MP Argentina
- [ ] Verificar que CFT (Costo Financiero Total) es correcto
- [ ] Actualizar si es necesario

**Comando para verificar (en producción):**
```bash
# Usar credenciales reales de Mercado Pago
curl https://api.mercadopago.com/v1/payment_methods/installments \
  -d "amount=5000" \
  -d "access_token=YOUR_TOKEN"
```

---

### 5.2 Configuración de Ambiente

**Validación pre-deployment:**

```yaml
.env (Desarrollo):
  DEBUG=true                              ✅ Debe ser true
  MERCADOPAGO_ACCESS_TOKEN=TEST_TOKEN     ✅ Token de test
  SUPABASE_URL=https://...supabase...     ✅ Debe estar definido
  SUPABASE_KEY=...                        ✅ Debe estar definido
  CORS_ORIGINS=http://localhost:5173      ✅ Permite frontend local

.env.production (Railway):
  DEBUG=false                             ✅ Debe ser false
  MERCADOPAGO_ACCESS_TOKEN=PROD_TOKEN     ✅ Token de producción
  SUPABASE_URL=...                        ✅ BD producción
  SUPABASE_KEY=...                        ✅ Key producción
  CORS_ORIGINS=https://santyhogar.com     ✅ Dominio de producción
```

**⚠️ CRÍTICO:**
- [ ] Si DEBUG=true en Railway → SSL se deshabilita (GRAVE)
- [ ] Si DEBUG=false en local → Puede fallar SSL (pero es ok)

---

## 6. 🎯 CRITERIOS DE ACEPTACIÓN

### ✅ CRITERIOS PARA GO LIVE

```
Backend:
□ GET /api/installments/calculate retorna array de métodos
□ GET /api/installments/installment-price calcula correctamente
□ POST /orders acepta campo installments
□ SSL funciona correctamente en producción
□ Logs no muestran errores SSL en desarrollo

Frontend:
□ CardBINInput valida BIN (6 dígitos, solo números)
□ PaymentMethodsWithInstallments muestra opciones
□ Cálculo de cuotas es preciso
□ Selección persiste en Cart
□ Checkout muestra cuotas antes de MP
□ Responsive en 375px, 768px, 1440px

Infraestructura:
□ Railway deploya sin errores
□ MercadoPago Checkout Pro se abre correctamente
□ Webhooks de confirmación funcionan
□ Base de datos sincroniza pedidos
□ SSL válido en dominio final

Testing:
□ 0 errores en consola (browser dev tools)
□ 0 errores en logs del backend
□ E2E flujo completo testeado manualmente
□ Favoritos sincronizan correctamente
□ Direcciones guardadas cargan correctamente
```

---

## 7. 🚨 POTENCIALES PROBLEMAS Y SOLUCIONES

### Problema 1: InstallmentsService retorna vacío

```
Síntoma: GET /api/installments/calculate → []
Causa probable: DEBUG=true pero _get_mock_installments() no ejecuta
Solución:
  1. Verificar DEBUG=true en .env
  2. Revisar logs: "🔧 DEBUG MODE" debe aparecer
  3. Si no aparece: error en lectura de config
```

### Problema 2: SSL verification error

```
Síntoma: "SSL: CERTIFICATE_VERIFY_FAILED"
Causa probable: DEBUG=false en desarrollo sin SSL válido
Solución:
  1. Cambiar DEBUG=true en .env
  2. O usar SSLAdapter (ya está en código)
  3. O desactivar verificación (solo desarrollo)
```

### Problema 3: CardBINInput no valida

```
Síntoma: Input acepta letras o más de 6 caracteres
Causa probable: regex no aplicada correctamente
Solución:
  1. Revisar regex: ^[0-9]{6}$
  2. Verificar onChange handler
  3. Debugger en browser
```

### Problema 4: Cuotas no persisten en Checkout

```
Síntoma: Usuario selecciona cuotas, pero en checkout no aparecen
Causa probable: CartContext no guarda selectedInstallments
Solución:
  1. En Cart.tsx: dispatch action al CartContext
  2. En Checkout.tsx: leer del CartContext
  3. Pasar a createCheckoutPreference()
```

### Problema 5: Imagen no se sube

```
Síntoma: Admin arrastra imagen, pero no se guarda
Causa probable: Endpoint /products/upload-image no existe o falla
Solución:
  1. Verificar backend tiene /products/upload-image
  2. Verificar Supabase Storage bucket existe
  3. Revisar CORS headers
  4. Debugger en Network tab
```

---

## 8. 📋 TESTING CHECKLIST FINAL

Antes de hacer PUSH a producción:

```
BACKEND:
□ npm run test (o pytest si tienes tests)
□ Linter sin errores: npm run lint
□ Build sin warnings: npm run build

FRONTEND:
□ npm run test
□ npm run build (Vite)
□ npm run lint
□ 0 console errors en dev

GIT:
□ Todos los cambios committeados
□ Branch está actualizada con main
□ No hay conflictos

ENVIRONMENT:
□ .env correcto para desarrollo
□ .env.production correcto para Railway
□ Secrets configurados en Railway dashboard

MANUAL TESTING:
□ Escenario 1: Cliente compra con cuotas ✅
□ Escenario 2: Admin sube imagen ✅
□ Escenario 3: Favoritos sincronizan ✅
□ Escenario 4: Direcciones guardan ✅

DEPLOYMENT:
□ Railway pipeline verde ✅
□ Logs sin errores ✅
□ Endpoints responden ✅
□ SSL válido ✅
```

---

**Testing & Validation Completed**
**20 Junio 2026**
**Por: Kiro AI**
