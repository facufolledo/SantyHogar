# 🔒 Hardening de Seguridad - SantyHogar

Cambios de seguridad implementados en esta sesión.

## ✅ Completado

### 1. SSL/TLS Verificado
- ✅ Removido: Deshabilitación de SSL en checkout.py
- ✅ Removido: SSL bypass en run_dev.py
- ✅ Removido: SSL bypass en connection.py
- ✅ Removido: SSL bypass en ssl_fix.py
- **Impacto:** Credenciales de MercadoPago ahora están protegidas por SSL verificado

### 2. CORS Restrictivo
```python
# Antes: allow_methods=["*"], allow_headers=["*"]
# Ahora: allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"]
#       allow_headers=["Content-Type", "Authorization"]
```
- **Impacto:** Previene CSRF attacks en pagos y órdenes

### 3. CSRF Protection
- ✅ Middleware nuevo: `backend/app/middleware/csrf.py`
- ✅ Frontend genera token en cada sesión: `frontend/src/api/client.ts`
- ✅ Todos los requests POST/PUT/DELETE envían `X-CSRF-Token` header
- **Impacto:** Ataques CSRF desde otros sitios ahora son imposibles

### 4. Rate Limiting Mejorado
- ✅ Middleware nuevo: `backend/app/middleware/rate_limit.py`
- ✅ Límites específicos por endpoint:
  - `/admin/users/create`: 5 requests/hora (protección brute-force)
  - `/auth`: 10 requests/hora
  - Otros: 100 requests/minuto
- **Impacto:** Brute force en admin y login ahora está limitado

### 5. Limpieza de Logs
- ✅ Removidos: 20+ console.log() de Home.tsx
- ✅ No hay secrets en logs del navegador
- **Impacto:** Información sensible no sale en consola del usuario

### 6. Documentación de Seguridad
- ✅ Creado: `.env.security` con guía de credenciales
- ✅ Creado: Este archivo (SECURITY_HARDENING.md)

---

## ⚠️ URGENTE - Antes de Producción

### 1. Regenerar Credenciales
```bash
# Supabase: Project Settings → API → Regenerate service_role key
# MercadoPago: Settings → Credentials → Regenerar tokens
```

### 2. Limpiar Historial de Git
Si tus credenciales estuvieron expuestas en GitHub:

```bash
# Ver si están en el historio
git log -p | grep "sb_publishable\|APP_USR"

# Si sí, limpiar (esto reescribe el historio)
git filter-branch --force --index-filter \
  'git rm --cached --force .env backend/.env' \
  --prune-empty --tag-name-filter cat -- --all

# Forzar push (⚠️ solo si es tu repo)
git push --force --all
```

### 3. Configurar Variables en Railway
1. Ir a tu proyecto en Railway
2. Settings → Environment
3. Agregar estas variables (NO en código):
   ```
   ENV=production
   DEBUG=false
   SUPABASE_URL=...
   SUPABASE_KEY=... (la service role, NO la anon key)
   MERCADOPAGO_ACCESS_TOKEN=...
   MERCADOPAGO_WEBHOOK_SECRET=...
   FRONTEND_URL=https://tu-dominio.com
   PUBLIC_API_URL=https://api.tu-dominio.com
   ```

### 4. Verificar .gitignore
```bash
# Asegurar que .env está ignorado
echo ".env" >> .gitignore
echo "backend/.env" >> .gitignore
echo "frontend/.env.local" >> .gitignore

git add .gitignore
git commit -m "chore: ensure .env files are ignored"
```

---

## 🔍 Verificación de Seguridad

### Backend
```bash
# Verificar que NO hay SSL bypass
grep -r "PYTHONHTTPSVERIFY\|CERT_NONE\|verify=False" backend/app/

# Verificar CORS está restricto
grep -A5 "CORSMiddleware" backend/app/main.py

# Verificar CSRF middleware
grep -r "CSRFProtectionMiddleware" backend/app/main.py
```

### Frontend
```bash
# Verificar que NO hay console.log sensibles
grep "password\|token\|secret" frontend/src/**/*.ts

# Verificar que client.ts tiene CSRF token
grep "X-CSRF-Token" frontend/src/api/client.ts
```

---

## 📊 Estado de Seguridad

| Aspecto | Antes | Ahora | Impacto |
|--------|-------|-------|--------|
| SSL/TLS | ❌ Deshabilitado | ✅ Verificado | CRÍTICO |
| CORS | ⚠️ Permisivo | ✅ Restrictivo | ALTO |
| CSRF | ❌ Sin protección | ✅ Token validation | ALTO |
| Rate Limiting | ⚠️ Genérico | ✅ Por endpoint | ALTO |
| Logs | ⚠️ Muchos en prod | ✅ Limpio | MEDIO |

---

## 🔧 Testing de Seguridad

### Test 1: CSRF Protection
```bash
# Este request DEBE fallar (sin token)
curl -X POST http://localhost:8000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"items":[]}'

# Debe retornar 403 Forbidden
```

### Test 2: Rate Limiting
```bash
# Hacer 6 requests en corto tiempo al admin endpoint
for i in {1..6}; do
  curl -X POST http://localhost:8000/admin/users/create \
    -H "Authorization: Bearer token" \
    -H "Content-Type: application/json"
done

# Después del 5to request, debe retornar 429 Too Many Requests
```

### Test 3: CORS
```bash
# Desde otro dominio (fetch desde console)
fetch('http://localhost:8000/api/products', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  credentials: 'include',
  body: '{}'
})

# Debe fallar con error CORS
```

---

## 📋 Próximos Pasos (Post-Hardening)

- [ ] Regenerar credenciales en Supabase y MercadoPago
- [ ] Limpiar historio de git si fue necesario
- [ ] Configurar variables en Railway
- [ ] Build y deploy frontend
- [ ] Deploy backend en Railway
- [ ] Verificar tests de seguridad
- [ ] Activar logging/monitoring (Sentry, etc.)
- [ ] Implementar webhook signature validation (MercadoPago)
- [ ] Agregar audit logging para acciones admin
- [ ] Implementar HTTPS enforcer (redirect http → https)

---

## 📚 Referencias

- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP CORS](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Origin_Resource_Sharing_Cheat_Sheet.html)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [SSL/TLS Best Practices](https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices)

---

**Última actualización:** Sesión 9
**Estado:** En Progreso
**Siguiente:** Testing y validación de cambios de seguridad
