# 🚂 Deploy Backend en Railway

## 📋 Pasos

### 1. Crear cuenta en Railway
1. Ir a https://railway.app
2. Sign up con GitHub
3. Conectar tu repositorio

### 2. Crear nuevo proyecto
1. Click en "New Project"
2. Seleccionar "Deploy from GitHub repo"
3. Elegir `SantyHogar`
4. Seleccionar rama `version1`

### 2.1 Configurar Root Directory (IMPORTANTE)
1. Una vez creado el proyecto, ir a **Settings**
2. Buscar la sección **"Source"**
3. En **"Root Directory"**, poner: `backend`
4. Click en **"Update"**
5. Esto hará que Railway detecte el proyecto Python correctamente

### 3. Configurar Variables de Entorno

En Railway → Settings → Variables, agregar:

```env
# Supabase
SUPABASE_URL=https://gsvtcrscojbfhgixxquw.supabase.co
SUPABASE_KEY=tu_service_role_key_aqui

# MercadoPago - PRODUCCIÓN (cambiar por credenciales reales)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-tu-access-token-produccion
MERCADOPAGO_PUBLIC_KEY=APP_USR-tu-public-key-produccion
MERCADOPAGO_WEBHOOK_SECRET=

# Config
DEBUG=false
API_HOST=0.0.0.0
API_PORT=$PORT
ADMIN_MASTER_PASSWORD=tu_password_seguro_aqui

# URLs (se configuran después del deploy)
FRONTEND_URL=https://tu-dominio-hostinger.com
PUBLIC_API_URL=https://tu-app.railway.app
```

### 4. Deploy
1. Railway detectará automáticamente Python
2. Instalará dependencias de `requirements.txt`
3. Ejecutará el comando del `Procfile`
4. Te dará una URL pública: `https://tu-app.railway.app`

### 5. Configurar Dominio (Opcional)
1. Railway → Settings → Domains
2. Agregar dominio custom si tenés

### 6. Actualizar URLs
Una vez que tengas la URL de Railway:
1. Copiar la URL (ej: `https://santyhogar-backend.railway.app`)
2. Actualizar `PUBLIC_API_URL` en Railway
3. Actualizar `VITE_API_URL` en Hostinger

---

## 🔧 Troubleshooting

### Error: "Railpack could not determine how to build the app"
**Causa:** Railway está intentando deployar desde la raíz del proyecto en lugar de la carpeta `backend`.

**Solución:**
1. Ir a **Settings** en Railway
2. Buscar **"Source"** → **"Root Directory"**
3. Poner: `backend`
4. Click en **"Update"**
5. Railway hará un redeploy automático

**Alternativa:** Verificar que el archivo `railway.toml` en la raíz tenga:
```toml
[build]
builder = "NIXPACKS"
```

### Error: SSL Certificate
- Ya está parcheado en el código para desarrollo
- En producción, Railway maneja SSL automáticamente

### Error: Port binding
- Railway asigna `$PORT` automáticamente
- El `Procfile` ya lo usa correctamente

### Error: Database connection
- Verificar que `SUPABASE_URL` y `SUPABASE_KEY` sean correctos
- Verificar que Supabase permita conexiones desde Railway

---

## 📝 Notas

- Railway tiene **500 horas gratis/mes** en el plan gratuito
- Después de eso, cobra por uso
- El backend se dormirá después de inactividad (plan gratuito)
- Primera request después de dormir puede tardar ~30 segundos

---

## ✅ Verificación

Una vez deployado, probar:
```bash
curl https://tu-app.railway.app/
# Debería devolver: {"message": "SantyHogar API v1.0.1"}

curl https://tu-app.railway.app/products
# Debería devolver lista de productos
```
