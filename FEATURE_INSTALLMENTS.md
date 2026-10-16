# Feature: Calculadora de Cuotas con Mercado Pago

**Fecha:** 17 de Junio de 2026  
**Branch:** version1  
**Status:** ✅ Implementado

---

## Descripción

Se implementó la funcionalidad para calcular y mostrar las opciones de pago en cuotas con Mercado Pago directamente en el checkout.

El usuario puede:
1. Ingresar los primeros 6 dígitos de su tarjeta (BIN)
2. Ver automáticamente el tipo de tarjeta detectado (Visa, Mastercard, Amex, etc.)
3. Consultar las opciones de cuotas disponibles desde MP
4. Ver el precio por cuota y el total con intereses
5. Seleccionar el plan de cuotas deseado

---

## Componentes Backend

### 1. `InstallmentsService` (backend/app/services/installments_service.py)

Servicio que se comunica con la API de Mercado Pago para obtener información de cuotas.

**Métodos principales:**
- `get_installments(amount, bin_number, payment_method_id)` - Obtiene todas las opciones de cuotas
- `calculate_installment_price(amount, installments, bin_number)` - Calcula el precio exacto para un número de cuotas específico

**Características:**
- Consultadirectamente la API v1/payment_methods/installments de MP
- Desactiva verificación SSL para desarrollo (parametrizable)
- Manejo de errores robusto
- Logging detallado

---

## Rutas Backend

### 1. `GET /api/installments/calculate`

Calcula todas las opciones de cuotas disponibles.

**Parámetros:**
- `amount` (float, requerido): Monto total en ARS
- `bin_number` (string, opcional): Primeros 6 dígitos de la tarjeta (formato: 6 dígitos)

**Ejemplo:**
```
GET /api/installments/calculate?amount=10000&bin_number=453036
```

**Respuesta:**
```json
{
  "amount": 10000,
  "bin_number": "453036",
  "options": [
    {
      "installments": 1,
      "installment_amount": 10000.00,
      "total_amount": 10000.00,
      "interest_rate": 0,
      "discount": 0,
      "labels": []
    },
    {
      "installments": 3,
      "installment_amount": 3353.59,
      "total_amount": 10060.76,
      "interest_rate": 0.6,
      "discount": 0,
      "labels": ["sin_interés"]
    },
    {
      "installments": 6,
      "installment_amount": 1728.33,
      "total_amount": 10369.97,
      "interest_rate": 3.7,
      "discount": 0,
      "labels": []
    }
  ],
  "total_options": 3
}
```

### 2. `GET /api/installments/installment-price`

Obtiene el precio exacto para un número específico de cuotas.

**Parámetros:**
- `amount` (float, requerido): Monto total en ARS
- `installments` (int, requerido): Número de cuotas (1-12)
- `bin_number` (string, opcional): Primeros 6 dígitos

**Ejemplo:**
```
GET /api/installments/installment-price?amount=10000&installments=6&bin_number=453036
```

**Respuesta:**
```json
{
  "installments": 6,
  "installment_amount": 1728.33,
  "total_amount": 10369.97,
  "interest_rate": 3.7,
  "tea": 44.40,
  "cft": 44.40,
  "discount": 0,
  "labels": []
}
```

---

## Componentes Frontend

### 1. `CardBINInput` (frontend/src/components/CardBINInput.tsx)

Componente para ingresar los primeros 6 dígitos de la tarjeta con detección automática del tipo.

**Props:**
- `onBINChange?: (bin: string) => void` - Callback cuando el BIN cambia
- `onCardTypeDetected?: (type: string) => void` - Callback cuando se detecta el tipo

**Características:**
- Validación de entrada (solo números, máx 6 dígitos)
- Detección de tipo de tarjeta por BIN:
  - Visa (4XXXXX)
  - Mastercard (51-55, 2221-2720)
  - American Express (34, 37)
  - Diners Club (300-305, 36, 38)
  - Discover (6011, 65)
- Muestra el ícono de la tarjeta detectada
- Contador de dígitos faltantes

**Uso:**
```tsx
<CardBINInput
  onBINChange={(bin) => console.log('BIN:', bin)}
  onCardTypeDetected={(type) => console.log('Tipo:', type)}
/>
```

---

### 2. `InstallmentsCalculator` (frontend/src/components/InstallmentsCalculator.tsx)

Componente que muestra las opciones de cuotas disponibles y permite seleccionar.

**Props:**
- `amount: number` - Monto total en ARS
- `binNumber?: string` - BIN de la tarjeta
- `onInstallmentSelected?: (option) => void` - Callback cuando selecciona una opción

**Características:**
- Carga automáticamente opciones cuando se ingresa el BIN
- Muestra:
  - Número de cuotas
  - Precio por cuota
  - Total a pagar
  - Tasa de interés
  - Descuentos (si aplica)
  - Labels especiales (ej: "sin_interés", "promoción")
- Animaciones suaves
- Indicador de carga
- Manejo de errores con mensajes claros
- Resumen visual de la opción seleccionada

**Uso:**
```tsx
<InstallmentsCalculator
  amount={10000}
  binNumber={bin}
  onInstallmentSelected={(option) => console.log('Seleccionó:', option)}
/>
```

---

### 3. Integración en Checkout

Los componentes se integran en la sección de pago del checkout (`pages/Checkout.tsx`):

1. Solo se muestran cuando:
   - Se selecciona Mercado Pago como método
   - Se está en modo online (MP habilitado)

2. El usuario ve:
   - Input para ingresar 6 dígitos de la tarjeta
   - Detección automática del tipo
   - Opciones de cuotas calculadas
   - Resumen de la opción seleccionada

---

## Flujo Completo del Usuario

```
Checkout → Método de Pago → Mercado Pago (seleccionado)
    ↓
Ingresa primeros 6 dígitos de tarjeta
    ↓
Frontend detecta tipo (Visa/MC/Amex/etc)
    ↓
Frontend consulta /api/installments/calculate
    ↓
Mostr opciones disponibles (1, 3, 6, 12 cuotas, etc.)
    ↓
Usuario selecciona una opción (ej: 6 cuotas)
    ↓
Se muestra resumen con:
  - 6 cuotas x $1.728,33
  - Total: $10.369,97
  - Interés: 3.7%
    ↓
Usuario confirma pago
    ↓
Se redirecciona a MP checkout con la opción de cuotas seleccionada
```

---

## Consideraciones Normativas (Argentina)

Según la documentación de Mercado Pago para Argentina (UVT - Ley 25.065):

Cuando se muestran cuotas, es **OBLIGATORIO** mostrar:
- ✅ Precio actual (precio sin financiar)
- ✅ Precio total financiado
- ✅ Número y monto de cada cuota
- ✅ Tasa Efectiva Anual (TEA)
- ✅ Costo Financiero Total (CFT)

**Status:**
- ✅ Se muestra precio por cuota
- ✅ Se muestra total a pagar
- ✅ Se muestra número de cuotas
- ✅ Se muestra interés / TEA
- ⚠️ CFT mostrado (puede necesitar verificación legal)

---

## Archivos Modificados/Creados

### Backend:
- ✅ `backend/app/services/installments_service.py` (nuevo)
- ✅ `backend/app/routes/installments.py` (nuevo)
- ✅ `backend/app/main.py` (modificado - registró router)

### Frontend:
- ✅ `frontend/src/components/CardBINInput.tsx` (nuevo)
- ✅ `frontend/src/components/InstallmentsCalculator.tsx` (nuevo)
- ✅ `frontend/src/pages/Checkout.tsx` (modificado - integró componentes)

---

## Testing

### Pruebas sugeridas:

1. **Detección de BIN:**
   ```
   - 453036 → Visa
   - 510000 → Mastercard
   - 375000 → Amex
   - 300000 → Diners
   - 601100 → Discover
   ```

2. **Cálculo de cuotas:**
   ```
   - Monto: 10.000 ARS
   - BIN: 453036 (Visa)
   - Esperado: 1, 3, 6, 12 cuotas disponibles
   ```

3. **Diferentes montos:**
   ```
   - $1.000, $5.000, $50.000, $100.000
   - Verificar que varían las cuotas disponibles
   ```

4. **Sin BIN:**
   ```
   - Si el usuario no ingresa BIN, los componentes no se muestran
   - Se muestra solo al ingresar 6 dígitos
   ```

---

## Variables de Entorno

No se requieren nuevas variables de entorno. Usa:
- `MERCADOPAGO_ACCESS_TOKEN` (ya existente)
- `VITE_API_URL` (frontend, ya existente)

---

## Commits

1. `89f63ec` - Backend: installments_service.py + rutas + main.py
2. `a50c588` - Frontend: CardBINInput + InstallmentsCalculator + Checkout

---

## Próximas Mejoras

- [ ] Cachear opciones de cuotas para la misma tarjeta (evitar múltiples consultas)
- [ ] Mostrar información de CFT más detallada
- [ ] Integración con Mercado Pago Bricks (si se migra)
- [ ] Tests unitarios para InstallmentsService
- [ ] Documentación legal completa de Argentina UVT

---

## Referencias

- [Mercado Pago - Installments API](https://www.mercadopago.com.ar/developers/en/reference)
- [Consideraciones Argentina](https://www.mercadopago.com.ar/developers/en/guides/resources/localization/considerations-argentina)
- Ley 25.065 de Financiación (Argentina)

