# 📋 Variables de Entorno - Railway Dashboard

## Cómo Actualizar en Railway

1. Ve a https://dashboard.railway.app
2. Selecciona proyecto `SantyHogar`
3. Selecciona servicio `backend` (FastAPI)
4. Pestaña **Variables**
5. Actualiza cada variable según abajo
6. Haz clic en **Redeploy** cuando termines

---

## Variables a Configurar

### 🔐 Seguridad (CRÍTICO)

```
ENV=production
DEBUG=false
```

### 🌐 CORS (Arregla el problema actual)

```
FRONTEND_URL=https://www.santyhogar.com.ar,https://santyhogar.com.ar,https://santyhogar-production.up.railway.app,http://localhost:5173
```

**Nota:** Comma-separated, sin espacios

### 🔗 URLs Públicas

```
PUBLIC_API_URL=https://santyhogar-production.up.railway.app
```

### 🗄️ Supabase

```
SUPABASE_URL=https://gsvtcrscojbfhgixxquw.supabase.co
SUPABASE_KEY=(tu service_role key — ver abajo)
```

### 💳 MercadoPago

```
MERCADOPAGO_ACCESS_TOKEN=(tu token)
MERCADOPAGO_WEBHOOK_SECRET=(tu webhook secret)
```

### 🏠 Servidor

```
API_HOST=0.0.0.0
API_PORT=8000
```

---

## 🔑 Dónde Obtener las Credenciales

### Supabase Service Role Key

1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Settings (engranaje abajo a la izquierda)
4. → API
5. Copia el valor de **service_role** (es una larga cadena que empieza con `eyJ...`)

**⚠️ IMPORTANTE:**
- NO uses la `anon` key (esa es para frontend)
- Usa la `service_role` key

### MercadoPago Tokens

1. Ve a https://www.mercadopago.com.ar/developers/es/reference
2. Settings → Credentials
3. Copia el **Access Token** (modo producción si es necesario)
4. Para webhook secret, copia el valor del webhook que configuraste

---

## ✅ Verificación Después de Redeploy

1. Espera 5-10 minutos a que Railway termine el redeploy
2. Abre https://www.santyhogar.com.ar
3. Abre Console (F12)
4. Comprueba que NO hay errores CORS

Si ves:
```
Access to fetch has been blocked by CORS
```

Significa que el redeploy aún no terminó o las variables no se guardaron. Espera 5 minutos más e intenta otra vez.

---

## 🔄 Variables en Frontend (para referencia)

En `frontend/.env.production`:

```
VITE_API_URL=https://santyhogar-production.up.railway.app
VITE_ENABLE_MP_CHECKOUT=true
VITE_MP_PUBLIC_KEY=APP_USR-cc9d2f49-5a56-4edb-81d8-24a1ec9aa8a2
VITE_SUPABASE_URL=https://gsvtcrscojbfhgixxquw.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_l7GD-iAemesqsG5cS4LioQ_Ul8_sftV
```

**Nota:** El frontend está buildeado en Hostinger, no en Railway. Las variables `.env.production` se usan en BUILD TIME (cuando hiciste `npm run build`).

---

## 📊 Checklist

- [ ] `ENV=production`
- [ ] `DEBUG=false`
- [ ] `FRONTEND_URL` incluye `https://www.santyhogar.com.ar`
- [ ] `PUBLIC_API_URL` es correcto
- [ ] `SUPABASE_URL` y `SUPABASE_KEY` son válidos
- [ ] `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_WEBHOOK_SECRET` son válidos
- [ ] Hiciste Redeploy
- [ ] Esperaste 5-10 minutos
- [ ] Sin errores CORS en https://www.santyhogar.com.ar

---

## 🆘 Si Aún Hay Errores CORS

1. En Railway, revisa los **Logs** del servicio backend
2. Busca líneas como:
   ```
   Configuración cargada (frontend_url=...)
   ```
3. Comprueba que `frontend_url` incluye tu dominio con `www`
4. Si no está, actualiza y redeploy nuevamente

---

**Fecha:** Session 9
**Última actualización:** 2026-11-10
