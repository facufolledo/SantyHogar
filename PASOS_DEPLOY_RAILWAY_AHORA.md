# 🚀 Pasos para Deploy en Railway - AHORA

## ✅ Lo que ya está listo

- ✅ Código pusheado a GitHub (rama `version1`)
- ✅ `railway.toml` configurado con Nixpacks
- ✅ `backend/nixpacks.toml` creado
- ✅ `backend/Procfile` con comando de inicio
- ✅ `backend/runtime.txt` con Python 3.11.9
- ✅ `backend/requirements.txt` con todas las dependencias

---

## 📋 Pasos a seguir EN RAILWAY

### 1️⃣ Configurar Root Directory (CRÍTICO)

**Esto es lo que falta hacer para solucionar el error:**

1. **Ir a tu proyecto en Railway**
   - https://railway.app/project/[tu-proyecto-id]

2. **Click en "Settings"** (tab superior)

3. **Buscar la sección "Source"**

4. **Encontrar "Root Directory"**
   - Debería estar vacío o en `/`

5. **Poner:** `backend`

6. **Click en "Update"**

7. **Railway hará redeploy automático**
   - Ahora debería detectar Python
   - Instalará dependencias
   - Iniciará el servidor

---

### 2️⃣ Configurar Variables de Entorno

Una vez que el deploy funcione, agregar estas variables en **Settings → Variables**:

```env
# Supabase
SUPABASE_URL=https://gsvtcrscojbfhgixxquw.supabase.co
SUPABASE_KEY=[tu_service_role_key]

# MercadoPago - PRODUCCIÓN
MERCADOPAGO_ACCESS_TOKEN=[tu_access_token_produccion]
MERCADOPAGO_PUBLIC_KEY=[tu_public_key_produccion]

# Config
DEBUG=false
ADMIN_MASTER_PASSWORD=[password_seguro]

# URLs (actualizar después)
FRONTEND_URL=https://tu-dominio.com
PUBLIC_API_URL=https://tu-app.railway.app
```

**NOTA:** Por ahora puedes usar las credenciales de **PRUEBA** de MercadoPago para verificar que funcione:
```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-7432784266565606-051822-78845426f286ab5ec69bf0b3fbcc9c84-3412900184
MERCADOPAGO_PUBLIC_KEY=APP_USR-6a5392e5-d5c4-4378-a0c0-db011d6f4328
```

---

### 3️⃣ Verificar que funcione

Una vez deployado:

1. **Copiar la URL de Railway**
   - Ejemplo: `https://santyhogar-backend-production.up.railway.app`

2. **Probar en el navegador:**
   ```
   https://tu-app.railway.app/
   ```
   Debería devolver:
   ```json
   {"message": "SantyHogar API v1.0.1"}
   ```

3. **Probar productos:**
   ```
   https://tu-app.railway.app/products
   ```
   Debería devolver la lista de productos

---

## 🎯 Qué esperar en los logs

### ✅ Si funciona correctamente:
```
✓ Detected Python 3.11.9
✓ Installing dependencies from requirements.txt
✓ Starting uvicorn server
✓ Application startup complete
✓ Uvicorn running on http://0.0.0.0:8000
```

### ❌ Si sigue fallando:
```
✖ Railpack could not determine how to build the app
```
→ Significa que el Root Directory NO está configurado

---

## 📝 Después del deploy exitoso

1. **Copiar la URL de Railway**

2. **Actualizar la variable `PUBLIC_API_URL` en Railway**
   - Settings → Variables
   - `PUBLIC_API_URL` = tu URL de Railway

3. **Redeploy** (Railway lo hará automáticamente)

4. **Continuar con el deploy del Frontend en Hostinger**

---

## 🆘 Si algo falla

1. **Ver los logs:**
   - Click en "Deployments"
   - Click en el último deploy
   - Ver los logs completos

2. **Verificar Root Directory:**
   - Settings → Source → Root Directory = `backend`

3. **Verificar que el código esté pusheado:**
   ```bash
   git log --oneline -1
   # Debería mostrar: "Fix Railway deploy: Configurar Nixpacks y Root Directory"
   ```

4. **Redeploy manual:**
   - Deployments → 3 puntos → Redeploy

---

**¡El paso crítico es configurar el Root Directory a `backend`!** 🎯
