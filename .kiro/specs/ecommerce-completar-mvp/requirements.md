# E-Commerce MVP Completo: Requisitos

**Objetivo:** Implementar 8 funcionalidades críticas para tener un e-commerce production-ready.

**Timeline:** 3-4 semanas  
**Prioridad:** CRÍTICA

---

## 1. 🔴 CRÍTICO - Endpoint GET /products/{id}

**Impacto:** CRÍTICA | **Esfuerzo:** 1 día

### Requisitos
- GET `/api/products/{product_id}` debe retornar producto completo
- Incluir: id, name, price, description, image_url, category, stock, created_at, updated_at
- Validar que el producto existe (404 si no)
- Sin autenticación requerida (público)

### Respuesta Esperada
```json
{
  "id": "uuid",
  "name": "Producto",
  "price": 5000,
  "description": "Descripción",
  "image_url": "https://...",
  "category": "Hogar",
  "stock": 10,
  "created_at": "2026-06-20T...",
  "updated_at": "2026-06-20T..."
}
```

---

## 2. ✅ ALTA - Sincronización Real de Favoritos

**Impacto:** ALTA | **Esfuerzo:** 3-4 días

### Requisitos Actuales
- Favoritos en localStorage en frontend
- Se pierden al cambiar navegador/dispositivo

### Lo que Falta
- POST `/api/customers/{customer_id}/favorites` - Agregar favorito
- DELETE `/api/customers/{customer_id}/favorites/{product_id}` - Remover favorito
- GET `/api/customers/{customer_id}/favorites` - Listar favoritos
- Backend debe guardar en DB
- RLS security (solo el usuario ve sus favoritos)

### Schema
```sql
CREATE TABLE favoritos (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES clientes(id),
  product_id UUID NOT NULL REFERENCES productos(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);
```

---

## 3. 🔍 ALTA - Buscador Global de Productos

**Impacto:** ALTA | **Esfuerzo:** 4-5 días

### Requisitos
- GET `/api/products/search?q=termo` - Buscar por nombre, descripción
- Buscar en: name, description, category
- Case-insensitive
- Retornar array de productos encontrados
- Paginación: `limit`, `offset` parámetros

### Ejemplo
```
GET /api/products/search?q=cocina&limit=10&offset=0

Response:
{
  "total": 5,
  "results": [
    { "id": "...", "name": "Cocina acero...", ... },
    ...
  ],
  "limit": 10,
  "offset": 0
}
```

---

## 4. 🎯 ALTA - Filtros Avanzados

**Impacto:** ALTA | **Esfuerzo:** 3 días

### Requisitos
- GET `/api/products/filter?category=Hogar&price_min=1000&price_max=50000`
- Filtrar por:
  - `category` - Categoría exacta
  - `price_min` - Precio mínimo
  - `price_max` - Precio máximo
  - Combinables (AND logic)
- Retornar productos que coincidan con TODOS los filtros

### Ejemplo
```
GET /api/products/filter?category=Hogar&price_min=5000&price_max=50000&limit=20

Response:
{
  "total": 12,
  "results": [ ... ],
  "filters_applied": {
    "category": "Hogar",
    "price_min": 5000,
    "price_max": 50000
  }
}
```

---

## 5. 📄 MEDIA - Paginación en Listados

**Impacto:** MEDIA | **Esfuerzo:** 2 días

### Requisitos
- GET `/api/products?page=1&limit=20`
- O alternativamente: `?limit=20&offset=0`
- Retornar:
  - `total` - total de items
  - `results` - array de items
  - `page` - página actual
  - `total_pages` - total de páginas
  - `has_next` - ¿hay siguiente?
  - `has_prev` - ¿hay anterior?

### Ejemplo
```json
{
  "total": 100,
  "page": 1,
  "limit": 20,
  "total_pages": 5,
  "has_next": true,
  "has_prev": false,
  "results": [...]
}
```

---

## 6. ⭐ MEDIA - Reviews/Calificaciones

**Impacto:** MEDIA | **Esfuerzo:** 3 días

### Requisitos
- POST `/api/products/{id}/reviews` - Crear review
- GET `/api/products/{id}/reviews` - Listar reviews
- DELETE `/api/products/{id}/reviews/{review_id}` - Borrar review (solo autor)

### Schema
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES productos(id),
  customer_id UUID NOT NULL REFERENCES clientes(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, customer_id)
);
```

### Request
```json
{
  "rating": 4,
  "comment": "Muy buen producto"
}
```

---

## 7. 📧 ALTA - Notificaciones Email

**Impacto:** ALTA | **Esfuerzo:** 4 días

### Requisitos
- Enviar email al crear orden: "Tu pedido fue recibido"
- Enviar email al confirmar pago: "Pedido confirmado - Tu orden será enviada"
- Enviar email al cambiar estado: "Estado de tu pedido: En proceso"
- Usar Resend.com o SendGrid

### Emails a Enviar
1. **Order Created** - Confirmación de recepción de pedido
2. **Payment Confirmed** - Confirmación de pago
3. **Order Shipped** - Pedido enviado (si integramos shipping)
4. **Order Delivered** - Pedido entregado

---

## 8. 📍 ALTA - Manejo de Addresses en Backend

**Impacto:** ALTA | **Esfuerzo:** 2 días

### Requisitos Actuales
- Frontend tiene SaveAddressModal
- Backend probablemente no persiste bien

### Lo que Falta (validar)
- POST `/api/customers/{id}/addresses` - Crear dirección
- GET `/api/customers/{id}/addresses` - Listar direcciones
- PUT `/api/customers/{id}/addresses/{address_id}` - Actualizar
- DELETE `/api/customers/{id}/addresses/{address_id}` - Borrar
- PUT `/api/customers/{id}/addresses/{address_id}/set-primary` - Marcar como principal

### Schema (probablemente ya existe)
```sql
CREATE TABLE direcciones (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES clientes(id),
  street VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Acceptance Criteria por Feature

### ✅ Endpoint GET /products/{id}
- [ ] Endpoint retorna 200 OK para producto válido
- [ ] Endpoint retorna 404 para producto no existe
- [ ] Respuesta contiene todos los campos esperados
- [ ] Sin autenticación requerida

### ✅ Sincronización Favoritos
- [ ] Crear favorito: POST /customers/{id}/favorites
- [ ] Listar favoritos: GET /customers/{id}/favorites
- [ ] Borrar favorito: DELETE /customers/{id}/favorites/{product_id}
- [ ] RLS: Usuario solo ve sus favoritos
- [ ] Frontend sincroniza automáticamente

### ✅ Buscador Global
- [ ] GET /products/search?q=termino funciona
- [ ] Busca en name, description, category
- [ ] Case-insensitive
- [ ] Paginación funciona

### ✅ Filtros Avanzados
- [ ] GET /products/filter?category=X funciona
- [ ] GET /products/filter?price_min=X&price_max=Y funciona
- [ ] Combinables (AND logic)
- [ ] Paginación funciona

### ✅ Paginación
- [ ] GET /api/products?page=1&limit=20 funciona
- [ ] Retorna metadata: total, page, total_pages, has_next, has_prev
- [ ] Funciona en: products, search, filter

### ✅ Reviews
- [ ] Crear review: POST /products/{id}/reviews
- [ ] Listar reviews: GET /products/{id}/reviews con promedio de rating
- [ ] Borrar review: DELETE solo el autor puede
- [ ] Rating 1-5

### ✅ Notificaciones Email
- [ ] Email en creación de orden
- [ ] Email en confirmación de pago
- [ ] Email en cambio de estado
- [ ] Usar template HTML
- [ ] Tracked (bounce, open, etc. optional)

### ✅ Addresses Backend
- [ ] CRUD completo funciona
- [ ] RLS: Usuario solo ve sus direcciones
- [ ] Set primary funciona
- [ ] Validation: Córdoba-only si es necessary

---

## Frontend Changes Necesarios

### Para Buscador
- [ ] Input de búsqueda en Navbar
- [ ] Llamar a `/api/products/search?q=`
- [ ] Mostrar resultados en modal/dropdown

### Para Filtros
- [ ] Sidebar en Shop.tsx con filtros
- [ ] Filtro por categoría
- [ ] Filtro por rango de precio
- [ ] Aplicar filtros dinámicamente

### Para Paginación
- [ ] Números de página en Shop
- [ ] Botones Previous/Next
- [ ] Jump to page X

### Para Reviews
- [ ] Mostrar reviews en ProductDetail
- [ ] Mostrar promedio de rating
- [ ] Form para crear review (si logueado)
- [ ] Mostrar "Mi review" con opción de borrar

### Para Emails
- [ ] Mostrar indicador "Email enviado" en order confirmation
- [ ] Link para resend email (opcional)

---

## Testing Requerido

### Backend Tests
- [ ] GET /products/{id} - válido e inválido
- [ ] Favoritos CRUD
- [ ] Búsqueda - case insensitive, múltiples campos
- [ ] Filtros - combinables
- [ ] Paginación - edge cases (última página, etc.)
- [ ] Reviews - rating validation
- [ ] Email - integración con Resend/SendGrid
- [ ] Addresses - RLS security

### Frontend Tests (Manual)
- [ ] Buscar producto funciona
- [ ] Filtrar por categoría y precio
- [ ] Paginación navega correctamente
- [ ] Review create/delete funciona
- [ ] Email recibido después de compra

---

## Deployment Checklist

- [ ] Migrations ejecutadas (favoritos, reviews, addresses)
- [ ] Email service configurado (Resend/SendGrid API key)
- [ ] Environment variables actualizados
- [ ] Testing de toda la pipeline
- [ ] Load testing (paginación con 1000+ productos)
- [ ] SSL valid en producción
- [ ] Database backups configured
