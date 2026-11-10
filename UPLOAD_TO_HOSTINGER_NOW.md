# 📤 Subir a Hostinger - Instrucciones AHORA

## Problema Arreglado ✅

1. ✅ `.htaccess` ahora sirve XML correctamente (no HTML)
2. ✅ `sitemap-products.xml` ahora existe 
3. ✅ Todos los archivos están en `frontend/dist/`

---

## Qué Cambió

### `.htaccess` - Nuevo (Mejorado)

```apache
# Archivos reales se sirven como están
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Excepciones especiales: sitemap.xml, robots.txt, etc.
RewriteRule ^sitemap\.xml$ - [L]
RewriteRule ^robots\.txt$ - [L]

# Todo lo demás va a React Router
RewriteRule . /index.html [L]
```

**Resultado:** `/sitemap.xml` ahora devuelve XML puro, no HTML.

### `sitemap-products.xml` - Nuevo

Archivo estático como respaldo. Si el backend no responde, Google usa este.

---

## 🚀 Pasos para Subir a Hostinger

### 1. Descargar los nuevos archivos

```
frontend/dist/
├── .htaccess              ← CRÍTICO: Actualizado
├── sitemap.xml            ← OK
├── sitemap-products.xml   ← NUEVO
├── robots.txt             ← OK
├── index.html
└── assets/
```

### 2. Conectar a Hostinger

**Opción A: Administrador de archivos web**

1. https://www.hostinger.com → Panel
2. Selecciona tu dominio
3. **Administrador de archivos**
4. Navega a `public_html/`

**Opción B: FTP (Más rápido)**

1. Abre FileZilla o WinSCP
2. Conecta con credenciales FTP de Hostinger
3. Navega a `public_html/`

### 3. Actualizar archivos

Sube estos archivos a `public_html/`:

- ✅ `.htaccess` (reemplazar el existente)
- ✅ `sitemap.xml` (reemplazar el existente)
- ✅ `sitemap-products.xml` (NUEVO - subir)
- ✅ `robots.txt` (reemplazar el existente)
- ✅ `index.html` (reemplazar)
- ✅ `assets/` (carpeta completa)

---

## ✅ Verificar Después de Subir

Desde tu navegador:

### 1️⃣ Verifica sitemap.xml

```
https://www.santyhogar.com.ar/sitemap.xml
```

**Debe mostrar XML puro:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://santyhogar.com.ar/</loc>
    ...
  </url>
</urlset>
```

**❌ NO debe mostrar:** HTML, error 404, o la página de SantyHogar

### 2️⃣ Verifica sitemap-products.xml

```
https://www.santyhogar.com.ar/sitemap-products.xml
```

**Debe mostrar XML** (puede estar vacío inicialmente, Google completa desde el backend)

### 3️⃣ Verifica robots.txt

```
https://www.santyhogar.com.ar/robots.txt
```

**Debe mostrar:**
```
User-agent: *
Allow: /
...
Sitemap: https://santyhogar.com.ar/sitemap.xml
Sitemap: https://santyhogar.com.ar/sitemap-products.xml
Sitemap: https://santyhogar-production.up.railway.app/api/sitemap-products.xml
```

### 4️⃣ Verifica que React funciona

```
https://www.santyhogar.com.ar/tienda
https://www.santyhogar.com.ar/producto/lavarropa-drean-next-1012-eco
```

**Debe mostrar:** La página de SantyHogar (no 404)

---

## 🔍 Si Ves "Sitemap is HTML" en Google Search Console

Es porque `.htaccess` no se subió correctamente.

**Solución:**

1. En Hostinger → Administrador de archivos
2. Settings (arriba a la derecha) → **Show Hidden Files**
3. Verifica que `.htaccess` existe en `public_html/`
4. Si no está, sube el archivo nuevo:
   - Desde `frontend/dist/.htaccess`
5. Espera 5 minutos
6. Recarga en Google Search Console

---

## 📝 Checklist Final

- [ ] Subiste `.htaccess` actualizado
- [ ] Subiste `sitemap-products.xml` nuevo
- [ ] `/sitemap.xml` devuelve XML (no HTML)
- [ ] `/sitemap-products.xml` existe
- [ ] `/robots.txt` devuelve TXT
- [ ] `/tienda` funciona (React Router)
- [ ] HTTPS es válido
- [ ] Sin errores "CORS blocked" en consola

---

## 🎯 Resultado Esperado

Google ya no dirá "Sitemap is HTML" porque:

1. ✅ `.htaccess` permite que archivos reales se sirvan correctamente
2. ✅ `sitemap.xml` ahora devuelve XML puro
3. ✅ `sitemap-products.xml` existe (aunque esté vacío, es válido)
4. ✅ `robots.txt` apunta a ambos sitemaps

---

**Fecha:** 2026-11-10
**Archivos listos:** ✅ Sí
**Listo para subir:** ✅ Ahora
