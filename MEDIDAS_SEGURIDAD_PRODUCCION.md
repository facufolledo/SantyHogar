# 🔒 Medidas de Seguridad - Santy Hogar en Producción

## Estado Actual

- **Backend:** FastAPI en Railway (production)
- **Frontend:** Vite React en Hostinger/CDN
- **BD:** Supabase (PostgreSQL managed)
- **Pagos:** Mercado Pago integrado
- **Auth:** Supabase Auth (email/contraseña)

---

## 🚨 Vulnerabilidades Críticas INMEDIATAS

### 1. **EXPOSICIÓN DE KEYS EN FRONTEND** ⚠️ CRÍTICO
**Estado:** 🔴 ACTIVO  
**Archivo:** `.env.production`

```
VITE_SUPABASE_ANON_KEY=sb_publishable_l7GD-iAemesqsG5cS4LioQ_Ul8_sftV
VITE_MP_PUBLIC_KEY=APP_USR-cc9d2f49-5a56-4edb-81d8-24a1ec9aa8a2
```

**Riesgo:** Cualquiera puede:
- Hacer requests directamente a Supabase (leer/escribir usuarios, órdenes, etc.)
- Ver estructura de BD en console del navegador
- Hacer peticiones falsas a Mercado Pago

**Solución:**
```bash
# ✅ HACER AHORA
1. Rotar VITE_SUPABASE_ANON_KEY en Supabase → Settings → Project API keys
2. Rotar VITE_MP_PUBLIC_KEY en Mercado Pago
3. Regenerar keys
4. Actualizar .env.production
5. Redeploy frontend

# El VITE_API_URL es OK (es la URL pública del backend)
# Pero las keys del panel deben ser públicas restrictivas en Supabase RLS
```

---

### 2. **FALTA HTTPS OBLIGATORIO EN PRODUCCIÓN** ⚠️ CRÍTICO
**Estado:** 🔴 INCIERTO

**Verificar:**
```bash
curl -I https://santyhogar-production.up.railway.app/health

# Debe devolver:
# HTTP/2 200
# Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Si NO tiene HSTS:**
```bash
# Agregar a FastAPI en main.py:
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
app.add_middleware(HTTPSRedirectMiddleware)

# O en Railway: agregar header en deployment
```

---

### 3. **ADMIN MASTER PASSWORD EXPUESTO** ⚠️ CRÍTICO
**Estado:** 🔴 EN RAILWAY ENVIRONMENT

**Riesgo:** Si alguien accede a Railway, ve `ADMIN_MASTER_PASSWORD=SantyHogar2026!Admin`

**Solución:**
```bash
# INMEDIATO:
1. En Railway: Settings → Variables → ADMIN_MASTER_PASSWORD
2. Cambiar a contraseña más fuerte (40+ caracteres, random)
3. Usar: openssl rand -base64 32
4. Actualizar backend/.env local

# Generar nueva:
openssl rand -base64 32
# Ejemplo output: Tz8f9kL2nW5xQ1mP9oR4sJ7vB3hY6cU2dX5eZ8aT

# Guardar SOLO en Railway, no en .env local
```

---

### 4. **DATABASE CREDENTIALS EN CÓDIGO** ⚠️ CRÍTICO
**Estado:** 🟡 PARCIALMENTE OK

**Verificar:**
```bash
# No debería haber en git:
grep -r "supabase_key" backend/ --exclude-dir=.git

# Debería ser SOLO environment variable:
# backend/app/config.py lee de .env, no hardcodeado ✓
```

---

## 🛡️ Medidas de Seguridad NIVEL 1 (Implementar ESTA SEMANA)

### 1. Rotación de Keys
```bash
✅ Supabase → Settings → Project API keys → Rotate
✅ Mercado Pago → Account settings → API keys → Regenerate
✅ Railway → Environment variables (update all)
```

### 2. Rate Limiting
**Estado:** 🟢 YA IMPLEMENTADO  
Archivo: `backend/app/middleware.py` (RateLimitMiddleware)
- ✓ 100 requests/minute por IP

### 3. CORS Configurado
**Estado:** 🟢 CORRECTO  
```python
# main.py línea ~74:
allow_origins=cfg.frontend_url.split(',')
# Solo acepta el frontend configurado
```

### 4. SQL Injection
**Estado:** 🟢 PROTECTED  
- ✓ Usa Supabase SDK (prepared statements)
- ✓ No hay SQL raw en código

### 5. HTTPS Redirect
**ACCIÓN:** Verificar y configurar
```python
# Agregar a backend/app/main.py después de CORS:
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

# En create_app():
app.add_middleware(HTTPSRedirectMiddleware)  # Redirect HTTP → HTTPS
```

---

## 🛡️ Medidas de Seguridad NIVEL 2 (Implementar PRÓXIMAS 2 SEMANAS)

### 1. Supabase Row Level Security (RLS)
**CRÍTICO:** Sin esto, la anon key es peligrosa

```sql
-- ENABLE RLS en Supabase SQL editor:

-- Usuarios: Solo leer su propio perfil
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own" ON auth.users
  FOR SELECT USING (auth.uid() = id);

-- Órdenes: Solo ver propias
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_read_own" ON ordenes
  FOR SELECT USING (auth.uid()::text = id_usuario OR id_usuario IS NULL);

CREATE POLICY "orders_insert_own" ON ordenes
  FOR INSERT WITH CHECK (auth.uid()::text = id_usuario);

-- Favoritos: Solo ver propios
ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_read_own" ON favoritos
  FOR SELECT USING (auth.uid()::text = id_cliente);

-- Direcciones: Solo ver propias
ALTER TABLE direcciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses_read_own" ON direcciones
  FOR SELECT USING (auth.uid()::text = id_cliente);

-- Categorías y Productos: Todos pueden leer (public)
-- (No necesitan RLS, son catálogos)
```

### 2. JWT Validation
**Estado:** 🟢 SUPABASE MANEJA  
- ✓ Supabase automaticamente valida JWTs en requests

### 3. CORS Stricto
**ACTUAL:** Permite todos los headers y métodos
```python
# Cambiar en main.py:
app.add_middleware(
    CORSMiddleware,
    allow_origins=cfg.frontend_url.split(','),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],  # Específico, no *
    allow_headers=["Authorization", "Content-Type"],  # Específico, no *
)
```

### 4. CSP (Content Security Policy)
```python
# Agregar middleware a main.py:
@app.middleware("http")
async def add_csp_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' cdn.jsdelivr.net; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https://gsvtcrscojbfhgixxquw.supabase.co https://api.mercadopago.com"
    )
    return response
```

### 5. Webhook Validation (Mercado Pago)
**Estado:** 🟡 PARCIAL  
**Verificar:** `backend/app/routes/webhook.py`
```python
# Debe validar signature de Mercado Pago
# Ver: https://www.mercadopago.com.ar/developers/es/docs/checkout-api/how-tos/webhooks

# En webhook.py agregar:
def verify_mercadopago_signature(request_data: dict, signature: str) -> bool:
    """Valida que el webhook viene de Mercado Pago."""
    # Implementar verificación de firma
    pass
```

---

## 🛡️ Medidas de Seguridad NIVEL 3 (Implementar MÉS ADELANTE)

### 1. 2FA (Two-Factor Authentication)
- [ ] Google Authenticator para admin
- [ ] SMS 2FA para usuarios (opcional)

### 2. Audit Logging
- [ ] Todos los cambios en admin panel registrados
- [ ] Logs inmutables en Supabase

### 3. Encryption at Rest
- [ ] Datos sensibles (direcciones, teléfonos) encriptados
- [ ] PII masked en logs

### 4. Penetration Testing
- [ ] Contratar auditor de seguridad
- [ ] Test de penetración antes de campañas grandes

### 5. DDoS Protection
- [ ] Implementar Cloudflare
- [ ] Rate limiting más agresivo

---

## ✅ CHECKLIST INMEDIATO (ESTA SESIÓN)

### CRÍTICO - HACER AHORA:
- [ ] 1. Rotar `VITE_SUPABASE_ANON_KEY` en Supabase
- [ ] 2. Rotar `VITE_MP_PUBLIC_KEY` en Mercado Pago
- [ ] 3. Cambiar `ADMIN_MASTER_PASSWORD` en Railway
- [ ] 4. Agregar HTTPSRedirectMiddleware en FastAPI
- [ ] 5. Verificar HSTS headers
- [ ] 6. Actualizar .env.production con nuevas keys
- [ ] 7. Redeploy backend y frontend

### ALTO - ESTA SEMANA:
- [ ] 8. Implementar RLS en todas las tablas (SQL Supabase)
- [ ] 9. Restringir CORS a métodos específicos
- [ ] 10. Agregar CSP headers
- [ ] 11. Validar firma de webhook Mercado Pago

### MEDIO - PRÓXIMAS 2 SEMANAS:
- [ ] 12. Audit logging en admin panel
- [ ] 13. Documentación de seguridad (policies)
- [ ] 14. Training para equipo sobre datos sensibles

---

## 📋 Comandos Rápidos

### Generar contraseña segura:
```bash
# macOS/Linux:
openssl rand -base64 32

# Windows:
[Convert]::ToBase64String([System.Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes(24))
```

### Verificar HTTPS:
```bash
curl -I https://santyhogar-production.up.railway.app/health
```

### Verificar Headers de Seguridad:
```bash
curl -i https://santyhogar-production.up.railway.app/health | grep -i "strict-transport\|content-security\|x-frame"
```

### Revisar logs de Railway:
```bash
# En Railway Dashboard: Logs → últimas 24h
# Buscar: ERROR, 401, 403, 500
```

---

## 🔐 Secretos Críticos a JAMÁS Commitear

```bash
# .gitignore debe incluir:
.env
.env.local
.env.production.local
backend/.env
frontend/.env.local
*.pem
*.key
```

**Verificar que NUNCA están en git:**
```bash
git log --all -S "ADMIN_MASTER_PASSWORD" --oneline
git log --all -S "supabase_key" --oneline
```

Si encuentras algo, purgar historio git:
```bash
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch ARCHIVO_SENSIBLE' \
  --prune-empty --tag-name-filter cat -- --all
```

---

## 📞 Contactos para Reporte de Seguridad

Crear página `/security.txt`:
```
Contact: security@santyhogar.com.ar
Expires: 2025-08-03T00:00:00.000Z
Preferred-Languages: es, en
```

---

## ¿Preguntas?

**Próximo paso:** ¿Quieres que implemente los cambios CRÍTICOS ahora o prefieres revisar primero?

Cambios propuestos:
1. Rotar keys
2. Agregar HTTPS Redirect
3. Implementar RLS básico
4. Restringir CORS
