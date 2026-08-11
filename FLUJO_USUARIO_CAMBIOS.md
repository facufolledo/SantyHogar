# 👤 FLUJO DE USUARIO: Qué cambió entre Cassiel y Facundo

---

## ESCENARIO 1: Cliente Nuevo Compra un Producto

### ⏱ ANTES (Cassiel - 172362f)

```
1. Cliente visita Shop.tsx
2. Selecciona un producto → ProductDetail.tsx
3. Ve precio y botón "Agregar al carrito"
4. ❌ NO hay opción de ver medios de pago aquí
5. Agrega al carrito
6. Va a Cart.tsx
7. ❌ NO ve opciones de cuotas
8. Procede al Checkout
9. Elige dirección (si es logueado)
10. Elige Mercado Pago como método
11. 🤷 ¿Cuotas? Se negocia en MP Checkout Pro
12. Se abre MercadoPago Checkout Pro
13. Paga
14. Vuelve a CheckoutSuccess
15. Pedido creado
```

**Duración hasta pagar:** 8 clics

---

### ⏱ AHORA (Facundo - 9b3ec9d)

```
1. Cliente visita Shop.tsx
2. Selecciona un producto → ProductDetail.tsx
3. Ve precio y botón "Agregar al carrito"
4. ✅ NUEVO: Botón "Ver medios de pago"
5. Hace click en "Ver medios de pago"
6. 🆕 Se abre PaymentMethodsWithInstallments modal
7. 📱 (Opcional) Ingresa BIN de tarjeta (6 dígitos)
8. 📊 API calcula opciones de cuotas en tiempo real
9. Ve:
   - Visa: 1x, 3x (0%), 6x (0%)
   - Mastercard: 1x, 3x (5%), 6x (10%), 12x (15%)
   - Amex: 1x, 3x (0%)
10. Selecciona: "Mastercard - 6 cuotas"
11. Modal muestra: "$1,666.67 × 6 = $10,000 (con 10% de interés)"
12. Cierra modal (o vuelve a seleccionar)
13. Agrega al carrito
14. Va a Cart.tsx
15. ✅ NUEVO: Ve resumen de opciones de cuotas
16. Puede cambiar selección aquí (botón "Cambiar medios de pago")
17. Procede al Checkout
18. Se abre MercadoPago Checkout Pro
19. 💳 En MP ve los medios de pago precalculados
20. Paga con cuotas seleccionadas
21. Vuelve a CheckoutSuccess
22. Pedido creado con información de cuotas
```

**Duración hasta pagar:** 10 clics (pero INFORMADO sobre cuotas)

**Cambio en UX:** +2 clics, pero usuario conoce exactamente qué paga

---

## ESCENARIO 2: Admin Sube Imágenes de Productos

### ⏱ ANTES (Cassiel - 172362f)

```
1. Admin entra a AdminProducts.tsx
2. Hace click en "Editar" o "Nuevo producto"
3. Se abre ProductFormModal
4. Rellena datos del producto
5. 📷 Para imagen: carga URL manualmente
6. Guarda producto
7. ❌ Si la URL es inválida, la imagen no aparece
8. Debe editar de nuevo y poner otra URL
```

---

### ⏱ AHORA (Facundo - 9b3ec9d)

```
1. Admin entra a AdminProducts.tsx
2. Hace click en "Editar" o "Nuevo producto"
3. Se abre ProductFormModal
4. Rellena datos del producto
5. 📷 NUEVO: Área para subir imagen (drag & drop)
6. Admin puede:
   - Arrastrar imagen directamente
   - O hacer click y seleccionar archivo
7. ✅ NUEVO: Preview de la imagen antes de guardar
8. Backend sube a Supabase Storage automáticamente
9. Se retorna URL válida
10. Guarda producto
11. Imagen aparece en ProductDetail correctamente
```

**Ventaja:** Proceso más robusto, sin URLs rotas

---

## ESCENARIO 3: Cliente Logueado Hace Checkout

### ⏱ ANTES (Cassiel - 172362f)

```
Checkout.tsx:
1. Si usuario logueado:
   - Carga direcciones guardadas
   - Muestra opción "Usar dirección guardada"
2. Si no hay direcciones guardadas:
   - Formulario vacío para llenar manualmente
3. Pero: ❌ Endpoint GET /addresses no funcionaba bien
4. Usuarios frecuentes veían sus direcciones
5. A veces, las direcciones no cargaban
```

---

### ⏱ AHORA (Facundo - 9b3ec9d)

```
Checkout.tsx:
1. Si usuario logueado:
   - Carga direcciones guardadas correctamente
   - Muestra lista de direcciones con:
     * Calle, ciudad, provincia, código postal
     * Botón "Usar esta dirección"
     * Opción "Dirección principal" (primary)
2. SI selecciona "Usar esta dirección":
   - Autocompleta formulario
   - Puede guardar como nueva si quiere
3. Si quiere agregar dirección nueva:
   - ✅ NUEVO: SaveAddressModal más robusto
   - Validaciones mejoradas
   - Guarda en base de datos
4. Todas las direcciones sincronizadas en backend
```

**Ventaja:** Mejor manejo de direcciones, menos errores

---

## ESCENARIO 4: Cliente Ve Sus Favoritos

### ⏱ ANTES (Cassiel - 172362f)

```
Favoritos:
- Click en ❤️ en ProductCard
- Se agrega a favoritosContext (localStorage)
- Si cambia navegador: ❌ PIERDE LOS FAVORITOS
- No sincroniza con backend
```

---

### ⏱ AHORA (Facundo - 9b3ec9d)

```
Favoritos:
- Click en ❤️ en ProductCard
- Se agrega a favoritosContext (localStorage)
- 🔄 Simultáneamente: llama API para sincronizar con backend
- Si cambia navegador: ✅ RECUPERA FAVORITOS
- Sincronización mejorada en Navbar.tsx
```

**Ventaja:** Favoritos persistentes, sincronización real

---

## ESCENARIO 5: Deploy a Producción

### ⏱ ANTES (Cassiel - 172362f)

```
Railway config:
1. Procfile simple
2. Heroku auto-detecta Python
3. Instala requirements.txt
4. Arranca app
5. ⚠️ A veces falla por rutas relativas
6. A veces falla por SSL
```

---

### ⏱ AHORA (Facundo - 9b3ec9d)

```
Railway config:
1. railway.toml explicita cómo buildear
2. start.sh script explícito de inicio
3. Procfile como respaldo
4. ✅ Múltiples puntos de entrada
5. SSL Fix integrado (DEBUG=false en prod)
6. Más robusto y menos errores
```

**Ventaja:** Deployment más predecible y robusto

---

## COMPARACIÓN GENERAL DE UX

### TABLA DE CAMBIOS DE UX

| Área | Cassiel | Facundo | Cambio |
|------|---------|---------|--------|
| **Ver cuotas en ProductDetail** | ❌ No existe | ✅ Sí | +1 Feature |
| **Calcular cuotas en tiempo real** | ❌ No existe | ✅ Sí | +1 Feature |
| **Upload de imágenes de productos** | ❌ Manual URL | ✅ Upload directo | UX mejorada |
| **Sincronización de favoritos** | ❌ Solo localStorage | ✅ Con backend | UX mejorada |
| **Gestión de direcciones** | ✅ Básico | ✅ Mejorado | UX mejorada |
| **Navbar responsiveness** | ✅ Funciona | ✅ Mejorado | UX mejorada |
| **SSL en desarrollo** | ❌ Puede fallar | ✅ Automático | Bug fix |
| **Deployment a Railway** | ⚠️ Frágil | ✅ Robusto | Reliability ↑ |

---

## FLUJOS MÁS COMPLEJOS

### Flujo 1: Calcular Cuotas (NUEVO)

```
ProductDetail.tsx
    ↓
Cliente hace click: "Ver medios de pago"
    ↓
PaymentMethodsWithInstallments modal abre
    ↓
Frontend solicita: GET /api/installments/calculate?amount=5000
    ↓
Backend:
  ├─ Si DEBUG=true: retorna mock data
  └─ Si DEBUG=false: llama API de Mercado Pago
    ↓
Frontend recibe:
[
  { payment_method: "visa", options: [...] },
  { payment_method: "mastercard", options: [...] },
  { payment_method: "amex", options: [...] }
]
    ↓
Modal muestra opciones formateadas
    ↓
Cliente selecciona: "Mastercard - 6 cuotas"
    ↓
Guardar selección en CartContext
    ↓
Cuando vaya al Checkout: se incluye en preferencia de MP
```

---

### Flujo 2: Subir Imagen de Producto (NUEVO)

```
AdminProducts.tsx
    ↓
Admin hace click: "Nuevo producto"
    ↓
ProductFormModal abre
    ↓
Area de drag-and-drop para imagen
    ↓
Admin arrastra imagen
    ↓
Frontend valida:
  ├─ Tamaño (< 5MB)
  └─ Formato (jpg, png, webp)
    ↓
Si válida: Frontend hace POST /api/products/upload-image
    ↓
Backend (image_service.py):
  ├─ Recibe multipart/form-data
  ├─ Optimiza imagen
  └─ Sube a Supabase Storage
    ↓
Backend retorna:
{
  "url": "https://supabase....",
  "path": "products/abc123.jpg"
}
    ↓
Frontend guarda URL en estado
    ↓
Admin hace click: "Guardar producto"
    ↓
Se crea/actualiza producto con imagen_url
    ↓
Imagen aparece en ProductDetail
```

---

### Flujo 3: Sincronización de Favoritos (MEJORADA)

```
ProductCard.tsx
    ↓
Cliente hace click: ❤️
    ↓
Frontend:
  ├─ Inmediato: adiciona a FavoritesContext
  ├─ Inmediato: actualiza UI
  └─ Async: POST /api/customers/{id}/favorites
    ↓
Backend:
  ├─ Valida que sea el usuario correcto (RLS)
  └─ Guarda en tabla `favoritos`
    ↓
Si vuelve a visitarse:
  ├─ localStorage muestra corazón rojo
  └─ Backend sincroniza automáticamente
    ↓
Si cambia navegador:
  ├─ localStorage: vacío
  ├─ Pero: GET /api/customers/{id}/favorites
  └─ Recupera favoritos del backend
    ↓
Navbar.tsx:
  ├─ Muestra contador de favoritos
  └─ Sincroniza en tiempo real
```

---

## IMPACTO EN CONVERSIÓN (ecommerce)

### Métrica 1: Claridad de Precio
```
Antes: Cliente no sabe cuánto paga exactamente si elige cuotas
       → Potencial abandono en checkout

Ahora: Cliente ve ANTES de ir al checkout:
       "Mastercard: $1,666.67 × 6 cuotas = $10,000 total"
       → Más confianza → Mayor conversión ✅
```

### Métrica 2: Experiencia de Admin
```
Antes: Admin debe encontrar URLs de imágenes
       → Proceso lento y error-prone

Ahora: Admin arrastra imagen
       → Proceso rápido y seguro ✅
```

### Métrica 3: Retención de Clientes Logueados
```
Antes: Favoritos se pierden al cambiar navegador
       → Cliente pierde interés

Ahora: Favoritos sincronizados
       → Cliente regresa y compra ✅
```

---

## RESUMEN: CAMBIOS PERCEPTIBLES PARA USUARIOS

### Para Clientes Finales:
1. ✅ Pueden ver opciones de cuotas ANTES de checkout
2. ✅ Saben exactamente cuánto pagan por mes
3. ✅ Direcciones guardadas funcionan mejor
4. ✅ Favoritos no se pierden al cambiar navegador

### Para Administradores:
1. ✅ Pueden subir imágenes directamente (no URLs manuales)
2. ✅ Preview de imagen antes de guardar
3. ✅ Proceso más rápido y robusto

### Para Infraestructura:
1. ✅ Deployment a Railway más confiable
2. ✅ SSL funciona en desarrollo sin errores
3. ✅ Mejor manejo de errores en API

---

## CHECKLIST: ¿Funcionan los cambios correctamente?

### Cliente Final - Funcionalidad ✅/❌
- [ ] ¿Ver medios de pago se abre desde ProductDetail?
- [ ] ¿Las opciones de cuotas calculan correctamente?
- [ ] ¿Se pueden seleccionar cuotas?
- [ ] ¿La selección persiste en Cart?
- [ ] ¿El checkout muestra las cuotas seleccionadas?
- [ ] ¿Las direcciones guardadas cargan?
- [ ] ¿Los favoritos persisten al cambiar navegador?

### Admin - Funcionalidad ✅/❌
- [ ] ¿Se pueden subir imágenes con drag-and-drop?
- [ ] ¿Preview de imagen funciona?
- [ ] ¿Imagen se guarda en Supabase?
- [ ] ¿Imagen aparece en ProductDetail?

### Infraestructura - Funcionalidad ✅/❌
- [ ] ¿Railway deploya sin errores?
- [ ] ¿SSL no falla en desarrollo?
- [ ] ¿APIs responden correctamente?
- [ ] ¿Webhooks de MP funcionan?

---

**Análisis de UX completado**
**Facundo vs Cassiel comparison**
**20 Junio 2026**
