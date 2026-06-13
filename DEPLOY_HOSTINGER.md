# 🌐 Deploy Frontend en Hostinger

## 📋 Pasos

### 1. Build del Frontend

Primero, actualizar las variables de entorno con las URLs de producción:

**Editar `frontend/.env.production`:**
```env
# API Backend (URL de Railway)
VITE_API_URL=https://tu-app.railway.app

# MercadoPago Public Key (PRODUCCIÓN)
VITE_MP_PUBLIC_KEY=APP_USR-tu-public-key-produccion

# Habilitar MercadoPago Checkout
VITE_ENABLE_MP_CHECKOUT=true
```

**Hacer el build:**
```bash
cd frontend
npm run build
```

Esto creará la carpeta `frontend/dist` con los archivos estáticos.

---

### 2. Subir a Hostinger

#### Opción A: FTP/SFTP (Manual)
1. Conectar por FTP a Hostinger
2. Ir a la carpeta `public_html` (o la carpeta de tu dominio)
3. Subir TODO el contenido de `frontend/dist`
4. Asegurarse de que `index.html` esté en la raíz

#### Opción B: File Manager de Hostinger
1. Ir a hPanel → File Manager
2. Navegar a `public_html`
3. Subir archivos de `frontend/dist`
4. Extraer si subiste como ZIP

---

### 3. Configurar .htaccess (IMPORTANTE)

Crear archivo `.htaccess` en la raíz de `public_html`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Redirigir todo a index.html para React Router
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Habilitar compresión
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache para assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
  ExpiresByType image/x-icon "access plus 1 year"
</IfModule>
```

---

### 4. Configurar Dominio

Si usás un subdominio (ej: `tienda.tudominio.com`):
1. hPanel → Dominios → Subdominios
2. Crear subdominio
3. Apuntar a la carpeta donde subiste los archivos

---

### 5. SSL/HTTPS

Hostinger incluye SSL gratis:
1. hPanel → SSL
2. Activar SSL para tu dominio
3. Forzar HTTPS (recomendado)

---

## 🔧 Actualizar Backend URL

Después de deployar el backend en Railway:

1. **Editar `frontend/.env.production`:**
   ```env
   VITE_API_URL=https://santyhogar-backend.railway.app
   ```

2. **Rebuild:**
   ```bash
   npm run build
   ```

3. **Re-subir a Hostinger**

---

## ✅ Verificación

1. Abrir tu dominio en el navegador
2. Verificar que cargue la página principal
3. Probar navegación (debe funcionar sin errores 404)
4. Abrir DevTools → Network
5. Verificar que las llamadas a la API vayan a Railway
6. Probar agregar producto al carrito
7. Probar checkout con MercadoPago

---

## 🔄 Actualizaciones Futuras

Para actualizar el sitio:
1. Hacer cambios en el código
2. `npm run build`
3. Subir archivos de `dist` a Hostinger
4. Limpiar caché del navegador (Ctrl+Shift+R)

---

## 📝 Notas

- Hostinger tiene límites de almacenamiento según el plan
- Los archivos estáticos se sirven muy rápido
- El dominio puede tardar hasta 24h en propagarse (DNS)
- Usar HTTPS siempre para MercadoPago (requisito)

---

## 🚨 Importante para MercadoPago

1. **Cambiar credenciales a PRODUCCIÓN**
2. **Configurar URLs correctas en MercadoPago:**
   - Back URLs: `https://tudominio.com/checkout/success`
   - Notification URL: `https://tu-app.railway.app/api/webhooks/mercadopago`
3. **Probar con tarjetas reales** (no de prueba)
