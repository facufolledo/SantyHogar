# ✅ Checklist de Deploy - SantyHogar

## 🎯 Orden de Deploy

### Fase 1: Backend en Railway
### Fase 2: Frontend en Hostinger
### Fase 3: Configuración MercadoPago
### Fase 4: Testing

---

## 📦 Fase 1: Backend en Railway

- [ ] **1.1 Preparar repositorio**
  - [ ] Commit y push de todos los cambios
  - [ ] Verificar que `backend/requirements.txt` esté completo
  - [ ] Verificar que `backend/Procfile` exista

- [ ] **1.2 Crear proyecto en Railway**
  - [ ] Crear cuenta en https://railway.app
  - [ ] Conectar con GitHub
  - [ ] Crear nuevo proyecto desde repo `SantyHogar`
  - [ ] Seleccionar rama `version1`
  - [ ] Root directory: `backend`

- [ ] **1.3 Configurar variables de entorno**
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_KEY`
  - [ ] `MERCADOPAGO_ACCESS_TOKEN` (PRODUCCIÓN)
  - [ ] `MERCADOPAGO_PUBLIC_KEY` (PRODUCCIÓN)
  - [ ] `DEBUG=false`
  - [ ] `ADMIN_MASTER_PASSWORD`
  - [ ] `FRONTEND_URL` (temporal, actualizar después)
  - [ ] `PUBLIC_API_URL` (copiar de Railway después del deploy)

- [ ] **1.4 Deploy y verificar**
  - [ ] Esperar a que termine el deploy
  - [ ] Copiar la URL de Railway (ej: `https://santyhogar-backend.railway.app`)
  - [ ] Actualizar `PUBLIC_API_URL` con la URL de Railway
  - [ ] Probar: `curl https://tu-app.railway.app/`
  - [ ] Probar: `curl https://tu-app.railway.app/products`

---

## 🌐 Fase 2: Frontend en Hostinger

- [ ] **2.1 Actualizar configuración**
  - [ ] Editar `frontend/.env.production`
  - [ ] Poner URL de Railway en `VITE_API_URL`
  - [ ] Poner Public Key de PRODUCCIÓN en `VITE_MP_PUBLIC_KEY`

- [ ] **2.2 Build**
  - [ ] `cd frontend`
  - [ ] `npm run build`
  - [ ] Verificar que se creó `frontend/dist`

- [ ] **2.3 Subir a Hostinger**
  - [ ] Conectar por FTP o File Manager
  - [ ] Ir a `public_html` (o carpeta del dominio)
  - [ ] Subir TODO el contenido de `frontend/dist`
  - [ ] Crear archivo `.htaccess` (ver DEPLOY_HOSTINGER.md)

- [ ] **2.4 Configurar dominio**
  - [ ] Activar SSL/HTTPS
  - [ ] Forzar HTTPS
  - [ ] Verificar que el dominio cargue

- [ ] **2.5 Actualizar Backend**
  - [ ] Ir a Railway → Variables
  - [ ] Actualizar `FRONTEND_URL` con tu dominio de Hostinger
  - [ ] Redeploy del backend

---

## 💳 Fase 3: Configuración MercadoPago

- [ ] **3.1 Cambiar a credenciales de PRODUCCIÓN**
  - [ ] Ir a https://www.mercadopago.com.ar/developers
  - [ ] Copiar Access Token de PRODUCCIÓN
  - [ ] Copiar Public Key de PRODUCCIÓN
  - [ ] Actualizar en Railway (backend)
  - [ ] Actualizar en `.env.production` y rebuild frontend

- [ ] **3.2 Configurar Webhooks**
  - [ ] Ir a MercadoPago → Webhooks
  - [ ] Agregar URL: `https://tu-app.railway.app/api/webhooks/mercadopago`
  - [ ] Seleccionar eventos: `payment`
  - [ ] Guardar

- [ ] **3.3 Verificar URLs**
  - [ ] Back URLs en el código apuntan a tu dominio de Hostinger
  - [ ] Notification URL apunta a Railway

---

## 🧪 Fase 4: Testing

- [ ] **4.1 Testing básico**
  - [ ] Abrir sitio en navegador
  - [ ] Verificar que cargue correctamente
  - [ ] Probar navegación (Home, Tienda, Producto, Carrito)
  - [ ] Verificar que las imágenes carguen

- [ ] **4.2 Testing de autenticación**
  - [ ] Login con Google
  - [ ] Verificar que guarde sesión
  - [ ] Logout

- [ ] **4.3 Testing de carrito**
  - [ ] Agregar producto al carrito
  - [ ] Modificar cantidad
  - [ ] Eliminar producto
  - [ ] Verificar que persista al recargar

- [ ] **4.4 Testing de checkout**
  - [ ] Ir a checkout
  - [ ] Completar formulario
  - [ ] Verificar que redirija a MercadoPago
  - [ ] **IMPORTANTE:** Usar tarjeta REAL (no de prueba)
  - [ ] Completar pago
  - [ ] Verificar redirección a página de éxito
  - [ ] Verificar que el carrito se limpió

- [ ] **4.5 Testing de webhook**
  - [ ] Verificar logs de Railway
  - [ ] Buscar mensaje: "📩 Webhook recibido"
  - [ ] Verificar que se creó el pedido en Supabase
  - [ ] Verificar que se actualizó el stock

- [ ] **4.6 Testing de admin**
  - [ ] Login como admin
  - [ ] Verificar panel de pedidos
  - [ ] Verificar que aparezca el pedido de prueba

---

## 🚨 Problemas Comunes

### Backend no inicia en Railway
- Verificar logs en Railway
- Verificar que todas las variables de entorno estén configuradas
- Verificar que `requirements.txt` tenga todas las dependencias

### Frontend muestra error 404 en rutas
- Verificar que `.htaccess` esté configurado correctamente
- Verificar que mod_rewrite esté habilitado en Hostinger

### API no responde desde el frontend
- Verificar CORS en el backend
- Verificar que `VITE_API_URL` sea correcta
- Verificar que Railway esté corriendo

### Webhook no funciona
- Verificar que la URL del webhook sea pública (Railway)
- Verificar logs de Railway cuando se hace un pago
- Verificar que MercadoPago tenga la URL correcta

### Pago rechazado
- Verificar que uses credenciales de PRODUCCIÓN
- Verificar que el dominio sea HTTPS
- Verificar que las back_urls sean correctas

---

## 📝 Notas Finales

- **Backup:** Hacer backup de la BD antes de ir a producción
- **Monitoreo:** Revisar logs de Railway regularmente
- **Costos:** Railway cobra después de 500 horas/mes gratis
- **SSL:** Hostinger incluye SSL gratis, activarlo siempre
- **Testing:** Probar TODO antes de compartir el sitio

---

**¡Éxito con el deploy!** 🚀
