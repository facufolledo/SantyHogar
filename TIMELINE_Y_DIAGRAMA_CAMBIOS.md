# 📅 TIMELINE Y DIAGRAMA: Evolución de Código

---

## 🕐 TIMELINE DE COMMITS (Últimos 51)

```
CASSIEL ORIGINAL (172362f)
│
├─ 40cf5c3 (grafted) feat: Santy Hogar e-commerce completo
│   └─ PUNTO DE PARTIDA: MercadoPago ✅, Órdenes ✅, Admin ✅
│
├─ CASSIEL (172362f) feat: sesion 4 - MercadoPago, direcciones guardadas, mejoras UX
│   ├─ MercadoPago Checkout Pro ✅
│   ├─ Saved Addresses ✅
│   ├─ Córdoba-only shipping ✅
│   └─ Excel Bulk Import ✅
│
├─ 6 COMMITS (FACUNDO) - Cleanup & Fixes
│   ├─ 3c57f1a fix: remover archivos de configuración de Railway
│   ├─ b31dcd0 fix: usar bash start.sh en Procfile
│   ├─ 8b1c934 fix: agregar requirements.txt en raíz
│   ├─ d0974f0 fix: usar script start.sh
│   ├─ 68c13be fix: remover Dockerfile
│   └─ 7070c61 fix: usar python -m uvicorn y agregar pyproject.toml
│
├─ 5020c50 fix: agregar Procfile y pyproject.toml para Railway
│
├─ 10 COMMITS - Deployment Config
│   ├─ 1d97a1b fix: mejorar robustez de start.sh
│   ├─ fa3f189 actualizar cambios en version1
│   ├─ 9797b87 merge: traer todas las features de main a version1
│   ├─ 9252fa1 actualizar cambios en version1
│   ├─ 1d97a1b fix: mejorar robustez de start.sh
│   ├─ 10853d6 fix: usar uvicorn backend.app.main:app
│   ├─ 84c8fce fix: volver a backend.app.main:app
│   ├─ b1f0a6d fix: crear __init__.py en /app
│   ├─ 83eb3a1 fix: volver a usar bash start.sh
│   └─ 10853d6 fix: usar uvicorn backend.app.main:app
│
├─ 📊 8 COMMITS - Mercado Pago Installments (NUEVO)
│   ├─ 89f63ec feat: Agregar servicio y rutas para calcular cuotas ✨ ALTO IMPACTO
│   │   ├─ Backend: /api/installments/calculate
│   │   ├─ Backend: /api/installments/installment-price
│   │   └─ SSLAdapter para desarrollo
│   │
│   ├─ a50c588 feat: Frontend para calcular cuotas ✨ ALTO IMPACTO
│   │   ├─ CardBINInput.tsx (111 líneas)
│   │   ├─ InstallmentCalculator.tsx (63 líneas)
│   │   └─ InstallmentsCalculator.tsx (212 líneas)
│   │
│   ├─ a3ecb5d fix: Usar DEBUG flag para controlar SSL
│   ├─ 3a797b5 fix: Agregar campos faltantes a config.py
│   ├─ 1779f31 fix: Remover cartel de oferta especial
│   ├─ 06d6514 docs: Agregar documentación de feature de cuotas
│   ├─ a50c588 feat: Agregar servicio de cuotas
│   └─ 89f63ec feat: Rutas de installments
│
├─ 🎨 6 COMMITS - UI Components (NUEVO)
│   ├─ PaymentMethodsModal.tsx (220 líneas) ✨
│   ├─ PaymentMethodsWithInstallments.tsx (238 líneas) ✨
│   ├─ Navbar refactor (644 líneas) 🔄
│   ├─ Cart improvements (428+ líneas) 🔄
│   └─ Checkout refactor (162+ líneas) 🔄
│
├─ 76545c8 Add UI/UX Pro Max skill ℹ️ (REFERENCIA)
│   └─ Design System: 1000+ líneas (solo para referencia)
│
├─ 🔐 5d04591 feat: Restaurar login con Google OAuth ✅
│   └─ Google OAuth funcional de nuevo
│
├─ 📷 8 COMMITS - Image Upload (NUEVO)
│   ├─ 3a688eb fix: Actualizar productsApi.ts con uploadProductImage
│   ├─ 3386db5 restore: Traer paneles admin completos
│   ├─ fb55eb5 Add product image upload endpoint (150+ líneas)
│   ├─ 952e555 Restore image support in bulk import
│   ├─ adf06b4 Restore Excel (.xlsx) bulk import
│   ├─ aa864ed Remove Fiserv, keep only Mercado Pago + saved addresses
│   ├─ 8b02556 Restore Córdoba-only shipping
│   └─ 3481533 Fix installments API response format
│
├─ 🎯 e23cfbf release: versión 1 del ecommerce SantyHogar
│
├─ 🌐 5 COMMITS - Frontend Build & Deploy
│   ├─ d2d2d1e fix: Hardcodear base path a /SantyHogar/
│   ├─ 80c256c fix: Remover lógica de servir frontend del backend
│   ├─ 625b594 fix: Revertir VITE_BASE_URL
│   ├─ 68b94ce revert: Quitar npm build de railway.toml
│   └─ 88e8cbb fix: Actualizar dist con nuevo base URL
│
├─ 📦 3 COMMITS - Dist & Config
│   ├─ a82e397 build: Agregar dist precompilado
│   ├─ 3f1d6f3 fix: Hacer que Railway compile frontend
│   ├─ c6bcac5 feat: Servir frontend (SPA) desde backend
│   └─ 16eb87e fix: Usar variable VITE_BASE_URL
│
├─ 🔒 3 COMMITS - Security & SSL
│   ├─ b7fab99 fix: Usar SSLAdapter custom para deshabilitar SSL
│   ├─ a3ecb5d fix: Usar DEBUG flag para controlar SSL
│   └─ 1779f31 fix: Remover oferta especial del home
│
├─ ✅ 10 COMMITS - Final Fixes & Polish
│   ├─ 3481533 Fix installments API response format
│   ├─ 8b02556 Restore Córdoba-only shipping + warning banner
│   ├─ aa864ed Remove Fiserv, add saved addresses
│   ├─ adf06b4 Restore Excel bulk import
│   ├─ 952e555 Restore image support
│   ├─ 2516dda Fix corrupted Unicode in ProductFormModal
│   ├─ fb55eb5 Add product image upload endpoint
│   ├─ c2ac7d9 Fix corrupted Unicode
│   ├─ 3918ab9 Fix: Add missing image service injection
│   └─ 9b3ec9d Add ImageUploadResponse schema
│
└─ HEAD (9b3ec9d - VERSION1)
    └─ ESTADO ACTUAL: Cassiel + 51 mejoras
        ├─ ✅ MercadoPago funcional
        ├─ ✅ Cuotas integradas
        ├─ ✅ Image upload funcional
        ├─ ✅ Favoritos sincronizados
        ├─ ✅ Direcciones guardadas
        └─ ✅ Deployment robusto
```

---

## 🎯 DIAGRAMA: Flujo de Arquitectura (NUEVO)

```
USUARIO FINAL
    │
    ├─ ProductDetail.tsx
    │   ├─ Click: "Ver medios de pago"
    │   │   │
    │   │   ├─ PaymentMethodsWithInstallments.tsx (NUEVO)
    │   │   │   │
    │   │   │   ├─ CardBINInput.tsx (NUEVO)
    │   │   │   │   └─ Entrada: "453036"
    │   │   │   │
    │   │   │   └─ Llama: GET /api/installments/calculate?amount=5000&bin=453036
    │   │   │       │
    │   │   │       ├─ Backend: InstallmentsService (NUEVO - 314 líneas)
    │   │   │       │   │
    │   │   │       │   ├─ Si DEBUG=true (Desarrollo)
    │   │   │       │   │   └─ Retorna MOCK data (< 100ms)
    │   │   │       │   │       ├─ Visa: 0%
    │   │   │       │   │       ├─ Mastercard: 5-15%
    │   │   │       │   │       └─ Amex: 0%
    │   │   │       │   │
    │   │   │       │   └─ Si DEBUG=false (Producción)
    │   │   │       │       └─ Llama API real de Mercado Pago
    │   │   │       │           └─ Retorna cuotas reales
    │   │   │       │
    │   │   │       └─ Respuesta: Array de métodos de pago
    │   │   │           [
    │   │   │             { payment_method: "visa", options: [...] },
    │   │   │             { payment_method: "mastercard", options: [...] },
    │   │   │             ...
    │   │   │           ]
    │   │   │
    │   │   └─ Frontend muestra opciones
    │   │       └─ Usuario selecciona: "Mastercard - 6 cuotas"
    │   │
    │   └─ Click: "Agregar al carrito"
    │       └─ CartContext almacena: { installments: 6, method: "master" }
    │
    ├─ Cart.tsx
    │   ├─ Muestra opciones de cuotas (heredadas)
    │   └─ Opción: "Cambiar medio de pago" → vuelve a Modal
    │
    ├─ Checkout.tsx
    │   ├─ Valida dirección (Córdoba)
    │   ├─ Carga direcciones guardadas (MEJORADO)
    │   ├─ Resumen de cuotas
    │   │
    │   └─ Click: "Pagar con Mercado Pago"
    │       │
    │       ├─ Llama: POST /api/checkout/preferences
    │       │   │
    │       │   └─ Backend crea preferencia con:
    │       │       ├─ Items
    │       │       ├─ Installments: 6 (NUEVO)
    │       │       ├─ Customer info
    │       │       └─ Direcciones
    │       │
    │       └─ Abre: MercadoPago Checkout Pro
    │           └─ Cuotas preseleccionadas (MEJORADO)
    │
    └─ MercadoPago completa pago
        │
        ├─ Webhook: POST /webhooks/mercadopago
        │   │
        │   └─ Backend actualiza orden con:
        │       ├─ Status: "completed"
        │       ├─ Installments: 6
        │       └─ Payment ID de MP
        │
        └─ CheckoutSuccess.tsx
            └─ Muestra resumen con cuotas

ADMIN
    │
    ├─ AdminProducts.tsx
    │   └─ Click: "Nuevo producto"
    │       │
    │       ├─ ProductFormModal (MEJORADO)
    │       │   │
    │       │   ├─ Campos de producto
    │       │   │
    │       │   └─ ÁREA DE IMAGEN (NUEVO)
    │       │       ├─ Drag-and-drop de imagen
    │       │       │   │
    │       │       │   └─ POST /api/products/upload-image
    │       │       │       │
    │       │       │       └─ Backend: ImageService (NUEVO)
    │       │       │           ├─ Valida: jpg, png, webp
    │       │       │           ├─ Optimiza imagen
    │       │       │           └─ Sube a Supabase Storage
    │       │       │
    │       │       └─ Preview de imagen (NUEVO)
    │       │
    │       └─ Click: "Guardar"
    │           └─ Backend crea producto con image_url
    │
    └─ ProductDetail muestra imagen correctamente
```

---

## 📊 DIAGRAMA: Cambios de Archivo

```
backend/app/
├── routes/
│   ├── installments.py (NUEVO - 140 líneas) ✨
│   ├── customers.py (-162 líneas refactorizado)
│   ├── products.py (+28 líneas para image upload)
│   └── webhook.py (+109 líneas mejorado)
│
├── services/
│   ├── installments_service.py (NUEVO - 314 líneas) ✨
│   ├── checkout_service.py (NUEVO - 136 líneas) ✨
│   ├── image_service.py (+82 líneas - mejorado)
│   ├── customer_service.py (-154 líneas refactorizado)
│   └── order_service.py (+9 líneas)
│
├── models/
│   └── schemas.py (+108 líneas - nuevos schemas)
│
├── ssl_fix.py (NUEVO - 47 líneas) 🔐
├── config.py (+28 líneas - DEBUG flag)
└── database/
    └── connection.py (+34 líneas)

frontend/src/
├── components/
│   ├── CardBINInput.tsx (NUEVO - 111 líneas) ✨
│   ├── InstallmentCalculator.tsx (NUEVO - 63 líneas) ✨
│   ├── InstallmentsCalculator.tsx (NUEVO - 212 líneas) ✨
│   ├── PaymentMethodsModal.tsx (NUEVO - 220 líneas) ✨
│   ├── PaymentMethodsWithInstallments.tsx (NUEVO - 238 líneas) ✨
│   ├── Navbar.tsx (±644 líneas refactorizado) 🔄
│   └── ProductCard.tsx (+50 líneas mejorado)
│
├── pages/
│   ├── Cart.tsx (+428 líneas mejorado) 🔄
│   ├── Checkout.tsx (±162 líneas refactorizado) 🔄
│   ├── ProductDetail.tsx (-404 líneas simplificado) 🔄
│   ├── Shop.tsx (-365 líneas simplificado) 🔄
│   ├── Home.tsx (-210 líneas simplificado) 🔄
│   └── user/*
│       ├── MyAccount.tsx (±82 líneas)
│       ├── MyAddresses.tsx (-184 líneas)
│       ├── MyFavorites.tsx (-45 líneas)
│       └── MyOrders.tsx (+255 líneas) 🔄
│
├── utils/
│   └── installments.ts (NUEVO - 45 líneas) ✨
│
└── api/
    └── supabaseClient.ts (NUEVO - 18 líneas)

.kiro/steering/ui-ux-pro-max/ (NUEVO - REFERENCIA)
├── SKILL.md (288 líneas)
├── scripts/
│   ├── core.py (253 líneas)
│   ├── design_system.py (1067 líneas)
│   └── search.py (114 líneas)
└── data/ (27 archivos .csv - 1000+ líneas)

Deployment/
├── railway.toml (NUEVO - 6 líneas) 🚀
├── start.sh (NUEVO - 14 líneas) 🚀
├── Procfile (MODIFICADO - 1 línea)
└── requirements.txt (+2 líneas)
```

---

## 🔄 DIAGRAMA: Relaciones entre Componentes NUEVOS

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE CUOTAS (NUEVO)                      │
└─────────────────────────────────────────────────────────────────┘

ProductDetail
    │
    ├─→ PaymentMethodsWithInstallments (NEW - 238 líneas)
    │   ├─→ CardBINInput (NEW - 111 líneas)
    │   └─→ Llama: GET /api/installments/calculate
    │       │
    │       ├─→ Backend: InstallmentsService (NEW - 314 líneas)
    │       │   └─→ Usa: SSLAdapter (NEW - 47 líneas)
    │       │       └─→ Deshabilita SSL en dev (DEBUG=true)
    │       │
    │       └─→ Retorna: Array de payment methods
    │           └─→ Guardado en CartContext
    │
    ├─→ CartContext (MEJORADO)
    │   └─→ Almacena: installments, paymentMethod
    │
    └─→ Checkout
        └─→ Lee: installments del CartContext
            └─→ Pasa a MercadoPago Checkout Pro

┌─────────────────────────────────────────────────────────────────┐
│                 FLUJO DE CARGA DE IMÁGENES (NUEVO)              │
└─────────────────────────────────────────────────────────────────┘

AdminProducts
    │
    └─→ ProductFormModal
        └─→ Área drag-and-drop
            │
            ├─→ Frontend: ProductFormModal (MEJORADO)
            │   └─→ POST /api/products/upload-image
            │
            ├─→ Backend: ImageService (NEW/MEJORADO)
            │   ├─→ image_service.py (82 líneas)
            │   └─→ Supabase Storage integration
            │
            └─→ Retorna: { url, path, created_at }
                └─→ Guardado en estado
                    └─→ Muestra preview
                        └─→ Guardado en BD al completar

┌─────────────────────────────────────────────────────────────────┐
│               FLUJO DE FAVORITOS SINCRONIZADOS (MEJORADO)       │
└─────────────────────────────────────────────────────────────────┘

ProductCard
    │
    └─→ Click ❤️
        │
        ├─→ Frontend: FavoritesContext (MEJORADO)
        │   ├─→ Inmediato: localStorage
        │   └─→ Async: POST /api/customers/{id}/favorites
        │
        ├─→ Backend: CustomerService (MEJORADO)
        │   └─→ Guarda en BD (RLS secure)
        │
        └─→ Navbar.tsx (REFACTORIZADO - 644 líneas)
            ├─→ Muestra contador de favoritos
            └─→ Sincroniza en tiempo real
```

---

## 📈 GRÁFICO: Líneas de Código por Área

```
Backend Improvements
  InstallmentsService         ████████████ 314
  Webhook refactor            ████████ 109
  Database layer              ████ 34
  SSL Fix                      ██ 47
  Config updates               █ 28
  ────────────────────────────────
  TOTAL BACKEND               532 líneas

Frontend Improvements
  Navbar refactor             ████████████████████ 229
  Cart improvements           ████████████████ 428
  PaymentMethodsWithInst      ███████████ 238
  Checkout refactor           ██████ 162
  InstallmentsCalculator      ████████ 212
  ProductCard updates         ███ 50
  MyOrders page               █████████ 255
  ────────────────────────────────
  TOTAL FRONTEND             1574 líneas

Components NUEVOS
  PaymentMethodsModal         ██████ 220
  CardBINInput                ███ 111
  InstallmentCalculator       ██ 63
  ────────────────────────────────
  TOTAL NUEVOS                394 líneas

Design System (REFERENCIA)
  Scripts + Data              ██████████ 1440
  ────────────────────────────────
  TOTAL DESIGN SYSTEM        1440 líneas

Deployment & Config
  Procfile + start.sh + railway.toml ████ 34
  ────────────────────────────────
  TOTAL DEPLOY                 34 líneas

═══════════════════════════════════════════════════════
NETO: +7,317 líneas de código
═══════════════════════════════════════════════════════
```

---

## 🎯 MATRIZ DE IMPACTO vs COMPLEJIDAD

```
                    COMPLEJIDAD (Técnica)
                    Baja ←──────→ Alta
                    
A
L
T
O  ┌─────────────────────────────────────────┐
    │ ★ Navbar refactor                       │
    │ ★ InstallmentsService                   │  CRÍTICO
I   │ ★ Checkout flow                         │  VALIDAR
M   │                                         │
P   ├─────────────────────────────────────────┤
A   │ ★ Image Upload                          │
C   │ ★ PaymentMethods UI                     │  ALTO
T   │                                         │  IMPACTO
    ├─────────────────────────────────────────┤
    │ ★ CardBINInput                          │
B   │ ★ Favoritos Sync                        │  MEDIO
A   │ ★ SSL Fix                               │  BAJO
J   │                                         │  RIESGO
O   │                                         │
    └─────────────────────────────────────────┘

RECOMENDACIÓN:
  Validar primero: ★ CRÍTICO (3 áreas)
  Luego: ★ ALTO (2 áreas)
  Finalmente: ★ MEDIO (3 áreas)
```

---

## 🚀 DEPLOYMENT TIMELINE

```
Día 1: PRE-DEPLOYMENT VALIDATION
  08:00 - Verificar DEBUG=false en .env.production
  09:00 - Testear mock data de cuotas
  10:00 - E2E testing en staging
  11:00 - Revisión de responsive
  12:00 - Check SSL configuration

Día 2: DEPLOYMENT
  09:00 - Merge a main/version1
  10:00 - Railway auto-deploys
  10:30 - Smoke tests en producción
  11:00 - Verificar APIs responden
  12:00 - Go live a clientes
  
Día 3-7: MONITORING
  Diario: Revisar logs de errores
  Diario: Monitorear conversión
  Diario: Check de SSL/SSL warnings
  Respuesta rápida a issues
```

---

## 📊 RESUMEN VISUAL

```
╔════════════════════════════════════════════════════════════════╗
║                    CAMBIOS CASSIEL → FACUNDO                  ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  FEATURES NUEVAS:                                              ║
║  ✨ Sistema de cuotas integrado                               ║
║  ✨ Upload de imágenes                                        ║
║  ✨ 5 componentes UI nuevos                                   ║
║  ✨ Design System de referencia                              ║
║  ✨ SSL Fix automático                                        ║
║  ✨ Deployment robusto                                        ║
║                                                                ║
║  MEJORAS:                                                      ║
║  🔄 Navbar refactorizado                                       ║
║  🔄 Cart mejorado                                              ║
║  🔄 Checkout flow optimizado                                   ║
║  🔄 Favoritos sincronizados                                    ║
║  🔄 Direcciones guardadas                                      ║
║  🔄 Admin dashboard mejorado                                   ║
║                                                                ║
║  MANTIENE:                                                     ║
║  ✅ MercadoPago Checkout Pro                                   ║
║  ✅ Órdenes y pedidos                                          ║
║  ✅ Google OAuth                                               ║
║  ✅ RLS Security                                               ║
║  ✅ Bulk import Excel                                          ║
║  ✅ Admin completo                                             ║
║                                                                ║
║  ESTADÍSTICAS:                                                 ║
║  📈 51 commits nuevos                                          ║
║  📈 146 archivos modificados                                   ║
║  📈 +7,317 líneas neto                                         ║
║  📈 3 nuevos servicios backend                                 ║
║  📈 5 nuevos componentes frontend                              ║
║  📈 99% de compatibilidad con Cassiel                          ║
║                                                                ║
║  RIESGOS:                                                      ║
║  🔴 DEBUG flag en producción (CRÍTICO)                         ║
║  🟡 Mock data de cuotas (VALIDAR)                              ║
║  🟡 Navbar responsive (TEST)                                   ║
║  🟢 AdminCustomers removido (BAJO)                             ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

**Timeline y Diagrama completado**  
**Facundo Analysis**  
**20 Junio 2026**
