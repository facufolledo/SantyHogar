# 📦 Despliegue Sesión 7 - Validación + Índices

## ✅ Cambios Realizados

### 1. Validación de Inputs (Seguridad)
- ✅ Integrada validación en modelos Pydantic (schemas.py)
- ✅ Validadores en OrderRequest, OrderItemRequest, CreateProductRequest
- ✅ Validadores en CreateCustomerRequest (nombre, teléfono, email)
- ✅ Contraseña fuerte para admin users (8+ chars, mayúscula, minúscula, número)
- ✅ Sanitización de strings (prevención XSS)

### 2. Índices de Performance (Listos para Supabase)
- ✅ Migración 010 preparada: `backend/database/migrations/010_add_performance_indexes.sql`
- ✅ Script de despliegue: `backend/scripts/deploy_indexes.py`
- ✅ Documentación: `backend/database/INDEXES_README.md`

---

## 🚀 Pasos de Despliegue

### Step 1: Desplegar a Railway (Backend + Validación)

```bash
# En tu terminal, en la raíz del proyecto
git add .
git commit -m "feat: agregar validación de inputs + índices listos"
git push -u origin version1
```

El backend se desplegará automáticamente en Railway con:
- ✅ Validación de inputs integrada
- ✅ Sanitización de XSS
- ✅ Validación de contraseña fuerte

---

### Step 2: Ejecutar Índices en Supabase (Manual)

⚠️ **IMPORTANTE**: Los índices deben ejecutarse manualmente en Supabase.

**Opción A: SQL Editor (Recomendado)**

1. Abre https://app.supabase.com
2. Selecciona tu proyecto "santyhogar"
3. Ve a **SQL Editor** → Click **"New Query"**
4. Abre `backend/database/migrations/010_add_performance_indexes.sql`
5. **Copia TODO el contenido**
6. Pega en SQL Editor de Supabase
7. Click **"Run"** (botón azul)
8. ✅ Espera confirmación (verde)

**Opción B: Script Python**

```bash
cd backend
python scripts/deploy_indexes.py
```

Este script mostrará el SQL y te dirá dónde ejecutarlo.

---

### Step 3: Verificar Índices Creados

En **Supabase Dashboard**:
1. Ve a **Table Editor**
2. Selecciona cada tabla (ordenes, clientes, productos, etc.)
3. Click en tab **"Indexes"**
4. Deberías ver los índices creados ✅

O en SQL (ejecuta en SQL Editor):

```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

---

## 📊 Validación Implementada

### Órdenes (POST /orders)
- ✅ Nombre cliente: 2-100 chars, sin caracteres peligrosos
- ✅ Teléfono: formato Argentina (+54 9 11 1234-5678)
- ✅ Email: formato válido (Pydantic EmailStr)
- ✅ Cantidad: 1-10000 por producto

### Productos (POST /products, PATCH /products/{id})
- ✅ Nombre: sin XSS, max 255 chars
- ✅ Precio: 0-1,000,000 (validación numérica)
- ✅ Stock: 0-100,000 (entero positivo)
- ✅ Descripción: sanitizada, max 5000 chars

### Clientes (POST /customers)
- ✅ Nombre: 2-100 chars, validado
- ✅ Email: único, formato válido
- ✅ Teléfono: formato Argentina (opcional)
- ✅ Dirección/notas: sanitizadas

### Admin Users (POST /admin/users)
- ✅ Email: válido y único
- ✅ Contraseña: 8+ chars, mayúscula, minúscula, número
- ✅ Nombre: validado, sin XSS

---

## 🔒 Seguridad Añadida

### Protección XSS
```
Sanitiza: <script>, javascript:, onclick, onerror
Limpia: HTML peligroso, contenido malicioso
```

### Protección SQL Injection
```
Pydantic valida tipos (UUID, EmailStr, Literal)
Supabase parameterización en queries
```

### Validación Telefónica
```
Formato Argentina: +54 9 (11) 1234-5678
Flexible para diferentes formatos
```

### Contraseña Fuerte
```
Mínimo 8 caracteres
Al menos 1 mayúscula (A-Z)
Al menos 1 minúscula (a-z)
Al menos 1 número (0-9)
```

---

## 📈 Performance (Índices)

### Impacto Esperado

**ANTES (sin índices):**
- Cargar 100 órdenes: ~5-10 segundos
- Dashboard: ~3-5 segundos
- Búsqueda por cliente: ~2-3 segundos

**DESPUÉS (con índices):**
- Cargar 100 órdenes: ~200-500ms ⚡
- Dashboard: ~500ms-1s ⚡
- Búsqueda por cliente: ~100-200ms ⚡

---

## 🧪 Testing

### Prueba Validación de Inputs

```bash
# Desde frontend o Postman, intenta crear cliente con datos inválidos:

# ❌ Nombre muy corto
POST /customers
{
  "name": "A",
  "email": "test@test.com",
  "phone": "1234"
}
# Response: 422 - "Nombre inválido. Usa solo letras, espacios, guiones"

# ❌ Teléfono inválido
POST /customers
{
  "name": "Juan García",
  "email": "test@test.com",
  "phone": "123"
}
# Response: 422 - "Teléfono inválido"

# ✅ Válido
POST /customers
{
  "name": "Juan García",
  "email": "test@test.com",
  "phone": "+54 9 11 1234-5678"
}
# Response: 201 - Customer creado
```

---

## 📝 Archivos Modificados

### Backend
- `backend/app/models/schemas.py` - Field validators en Pydantic
- `backend/app/routes/admin_users.py` - Validación de contraseña
- `backend/database/migrations/010_add_performance_indexes.sql` - Índices
- `backend/scripts/deploy_indexes.py` - Script despliegue
- `backend/database/INDEXES_README.md` - Documentación

---

## ✅ Checklist Pre-Producción

- [ ] Ejecuté índices en Supabase SQL Editor
- [ ] Verifiqué que los índices aparecen en Table Editor
- [ ] Probé crear orden con datos inválidos (debe rechazar)
- [ ] Probé crear cliente con teléfono inválido (debe rechazar)
- [ ] Probé crear admin con contraseña débil (debe rechazar)
- [ ] Backend desplegado en Railway (git push version1)
- [ ] Frontend funciona correctamente con validación

---

## 🎯 Próximos Pasos (Futuro)

1. **Logging/Monitoring**: Stack ELK o similar
2. **Rate Limiting**: Ya implementado ✅
3. **Caching**: Redis para queries frecuentes
4. **Compression**: Gzip en responses (FastAPI auto-hace)
5. **API Versioning**: Ya en place (/api/v1/)
6. **Documentación API**: Swagger (FastAPI auto-genera)

---

## 💬 Notas

- Validación ocurre en modelo Pydantic (antes de llegar a funciones)
- Errores de validación retornan 422 Unprocessable Entity
- Campo "master_password" required para crear admin (seguridad)
- Contraseña debe tener complejidad mínima (prevent guessing)

---

**Última actualización**: Sesión 7
**Status**: ✅ Listo para despliegue
**Próxima sesión**: Optimización de caché y logs
