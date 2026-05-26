# 📊 Sesión 4 - Resumen Deploy Railway

## 🎯 Objetivo
Preparar y deployar el backend de SantyHogar en Railway.

---

## ✅ Lo que se completó

### 1. Archivos de configuración creados

#### En la raíz del proyecto:
- ✅ `railway.toml` - Configuración principal de Railway con Nixpacks
- ✅ `DEPLOY_RAILWAY.md` - Guía completa de deploy en Railway
- ✅ `DEPLOY_HOSTINGER.md` - Guía completa de deploy en Hostinger
- ✅ `CHECKLIST_DEPLOY.md` - Checklist paso a paso completo
- ✅ `SOLUCION_RAILWAY_RAILPACK_ERROR.md` - Solución al error actual
- ✅ `PASOS_DEPLOY_RAILWAY_AHORA.md` - Pasos inmediatos a seguir

#### En la carpeta backend:
- ✅ `backend/Procfile` - Comando de inicio para Railway
- ✅ `backend/runtime.txt` - Python 3.11.9
- ✅ `backend/nixpacks.toml` - Configuración de Nixpacks
- ✅ `backend/requirements.txt` - Ya existía, verificado
- ✅ `backend/.env.example` - Ya existía, verificado

#### En la carpeta frontend:
- ✅ `frontend/.env.production` - Variables de entorno para producción

---

## 🚨 Problema Actual

**Error en Railway:**
```
✖ Railpack could not determine how to build the app
```

**Causa:**
Railway está intentando deployar desde la raíz del proyecto en lugar de la carpeta `backend`.

**Solución:**
Configurar **Root Directory** en Railway Settings → `backend`

---

## 📋 Próximos Pasos

### Paso 1: Solucionar el deploy en Railway

1. **Ir a Railway → Settings**
2. **Configurar Root Directory:** `backend`
3. **Esperar redeploy automático**
4. **Verificar que funcione:** `https://tu-app.railway.app/`

### Paso 2: Configurar variables de entorno

En Railway → Settings → Variables:

```env
SUPABASE_URL=https://gsvtcrscojbfhgixxquw.supabase.co
SUPABASE_KEY=[service_role_key]
MERCADOPAGO_ACCESS_TOKEN=[access_token]
MERCADOPAGO_PUBLIC_KEY=[public_key]
DEBUG=false
ADMIN_MASTER_PASSWORD=[password]
FRONTEND_URL=https://tu-dominio.com
PUBLIC_API_URL=https://tu-app.railway.app
```

### Paso 3: Deploy del Frontend en Hostinger

1. **Actualizar `frontend/.env.production`** con URL de Railway
2. **Build:** `npm run build`
3. **Subir `dist` a Hostinger**
4. **Crear `.htaccess`** para React Router
5. **Activar SSL/HTTPS**

### Paso 4: Configurar MercadoPago

1. **Cambiar a credenciales de PRODUCCIÓN**
2. **Configurar webhook:** `https://tu-app.railway.app/api/webhooks/mercadopago`
3. **Probar con tarjeta real**

### Paso 5: Testing completo

1. **Navegación y UI**
2. **Login con Google**
3. **Carrito y checkout**
4. **Pago con MercadoPago**
5. **Webhook y creación de pedidos**
6. **Panel de admin**

---

## 📚 Documentación Creada

| Archivo | Propósito |
|---------|-----------|
| `PASOS_DEPLOY_RAILWAY_AHORA.md` | **LEER PRIMERO** - Pasos inmediatos |
| `SOLUCION_RAILWAY_RAILPACK_ERROR.md` | Solución al error actual |
| `DEPLOY_RAILWAY.md` | Guía completa Railway |
| `DEPLOY_HOSTINGER.md` | Guía completa Hostinger |
| `CHECKLIST_DEPLOY.md` | Checklist completo de deploy |

---

## 🔧 Configuración Técnica

### Railway
- **Builder:** Nixpacks (forzado en `railway.toml`)
- **Python:** 3.11.9 (especificado en `runtime.txt`)
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Root Directory:** `backend` (DEBE configurarse manualmente)

### Hostinger
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Rewrite Rules:** `.htaccess` para React Router
- **SSL:** Activar HTTPS obligatorio

### MercadoPago
- **Modo:** Checkout Pro (redirección)
- **Webhook:** `/api/webhooks/mercadopago`
- **Credenciales:** Cambiar a PRODUCCIÓN antes de lanzar

---

## 💡 Notas Importantes

1. **Root Directory es CRÍTICO:** Sin esto, Railway no detecta el proyecto Python
2. **Nixpacks vs Railpack:** Nixpacks es el builder moderno, Railpack está deprecated
3. **Variables de entorno:** Configurar TODAS antes de probar
4. **SSL en desarrollo:** Los parches SSL son SOLO para desarrollo local
5. **Credenciales MP:** Usar PRUEBA para testing, PRODUCCIÓN para lanzamiento
6. **Webhook:** Debe ser URL pública de Railway
7. **CORS:** Ya está configurado en el backend para aceptar el frontend

---

## 🎯 Estado Actual

- ✅ **Backend:** Código listo, configuración lista, esperando deploy
- ✅ **Frontend:** Código listo, configuración lista, esperando build
- ⏳ **Railway:** Esperando configuración de Root Directory
- ⏳ **Hostinger:** Esperando deploy del frontend
- ⏳ **MercadoPago:** Esperando configuración de webhook

---

## 📞 Soporte

- **Railway:** https://railway.app/help
- **Hostinger:** Panel de control → Support
- **MercadoPago:** https://www.mercadopago.com.ar/developers/es/support

---

**¡Todo está listo para el deploy! Solo falta configurar el Root Directory en Railway.** 🚀
