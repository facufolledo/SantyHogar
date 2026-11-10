# 🚀 Instrucciones Paso a Paso - Subir a Hostinger

## 📋 Prerequisitos

Tienes estos 4 archivos listos (en `frontend/dist/`):

1. ✅ `sitemap.xml` — Sitemap estático (páginas principales)
2. ✅ `robots.txt` — Instrucciones para bots de Google
3. ✅ `.htaccess` — Reescritura de URLs para React
4. ✅ `index.html` + todo el build del frontend

---

## 🔧 Paso 1: Conectar a Hostinger

1. **Abre el Administrador de archivos de Hostinger**
   - Ve a tu panel: https://www.hostinger.com
   - Selecciona tu dominio `santyhogar.com.ar`
   - Haz clic en **Administrador de archivos**

2. **Navega a `public_html/`**
   - En la carpeta izquierda, haz clic en `public_html/`
   - Esta es la carpeta raíz de tu sitio

---

## 📁 Paso 2: Subir los archivos

**Opción A: Upload manual (Lento)**

1. En Hostinger, haz clic en **Subir archivos**
2. Selecciona estos 5 archivos del build:
   - `frontend/dist/sitemap.xml`
   - `frontend/dist/robots.txt`
   - `frontend/dist/.htaccess`
   - `frontend/dist/index.html`
   - Toda la carpeta `frontend/dist/assets/`
3. Espera a que suban

**Opción B: FTP (Rápido - Recomendado)**

1. Abre tu cliente FTP favorito (ej. FileZilla, WinSCP)
2. Conecta con los datos de Hostinger:
   - **Host:** tu dominio o IP FTP
   - **Usuario:** tu usuario FTP
   - **Contraseña:** tu contraseña FTP
3. Navega a `public_html/`
4. Sube la carpeta `frontend/dist/` completa

---

## ✅ Paso 3: Verificar que los archivos están correctos

Desde tu navegador, comprueba que se sirven como archivos estáticos (no como HTML):

### 1️⃣ Verifica robots.txt
```
https://santyhogar.com.ar/robots.txt
```

✅ **Debe mostrar:**
```
User-agent: *
Allow: /
...
```

❌ **No debe mostrar:** La página de SantyHogar

---

### 2️⃣ Verifica sitemap.xml
```
https://santyhogar.com.ar/sitemap.xml
```

✅ **Debe mostrar XML:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://santyhogar.com.ar/</loc>
    ...
  </url>
</urlset>
```

❌ **No debe mostrar:** La página de SantyHogar o error 404

---

### 3️⃣ Verifica que React router funciona
```
https://santyhogar.com.ar/tienda
https://santyhogar.com.ar/producto/lavarropa-drean-next-1012-eco
```

✅ **Debe mostrar:** La página de SantyHogar (no 404)

---

### 4️⃣ Verifica que el sitemap dinámico funciona

Si tu backend está corriendo en Railway:

```
https://santyhogar.com.ar/api/sitemap-products.xml
```

✅ **Debe mostrar XML** con todos los productos (tarda 2-3 segundos)

---

## 🔍 Paso 4: Agregar sitemaps a Google Search Console

1. Ve a [Google Search Console](https://search.google.com/search-console)
2. Selecciona tu propiedad: `https://santyhogar.com.ar`
3. En el menú izquierdo → **Sitemaps**
4. Haz clic en **Agregar/Probar sitemap**
5. Ingresa: **`sitemap.xml`**
6. Haz clic en **Enviar**
7. Repite para: **`sitemap-products.xml`** (si está disponible)

Google comenzará a indexar en 24-48 horas.

---

## 🛠️ Si algo no funciona...

### Problema: "Sitemap is HTML" en Google Search Console

**Causa:** El `.htaccess` está redirigiendo `/sitemap.xml` a `index.html`

**Solución:**

1. En Hostinger, en el Administrador de archivos, haz clic en **Settings** (arriba a la derecha)
2. Marca **Show Hidden Files**
3. Verifica que `.htaccess` está en `public_html/`
4. Si no está, sube el archivo manualmente desde `frontend/dist/.htaccess`
5. Espera 5 minutos y recarga la página

---

### Problema: 404 en /robots.txt

**Causa:** El archivo `robots.txt` no está en `public_html/`

**Solución:**

1. En Hostinger, descarga el archivo desde `frontend/dist/robots.txt`
2. Sube a `public_html/` vía FTP o administrador de archivos
3. Verifica: `https://santyhogar.com.ar/robots.txt`

---

### Problema: /api/sitemap-products.xml no responde

**Causa:** Tu backend en Railway no está corriendo

**Solución:**

1. Verifica que tu backend está corriendo en Railway:
   ```
   https://santyhogar-production.up.railway.app/health
   ```
2. Si muestra `{"status":"ok"}` → Todo bien, espera 1 minuto
3. Si muestra error → Reinicia el backend en Railway

---

## 📊 Checklist Final Antes de Decir "Listo"

- [ ] `robots.txt` se ve como TXT (no HTML)
- [ ] `sitemap.xml` se ve como XML (no HTML)
- [ ] `/tienda` funciona (React Router)
- [ ] `/producto/[slug]` funciona
- [ ] Backend en Railway está corriendo
- [ ] `/api/sitemap-products.xml` devuelve XML
- [ ] HTTPS es válido (no hay warning)
- [ ] No hay "www" en la URL
- [ ] Agregaste los sitemaps a Google Search Console

---

## 📈 Próximos Pasos (Después de que Google indexe)

1. **Agregar metaetiquetas** a productos
2. **Structured data** (JSON-LD)
3. **Mejorar palabras clave** en descripciones
4. **Open Graph** para redes sociales

---

## 🆘 ¿Necesitas ayuda?

Si algo no funciona:

1. Comparte tu `.htaccess` exacto
2. Verifica el error en browser console (F12)
3. Revisa los logs del backend: `https://dashboard.railway.app`
4. Envía un screenshot de Hostinger → Administrador de archivos

---

**Última actualización:** Session 9
**Backend:** Corriendo ✅
**Frontend Build:** Listo ✅
**Archivos SEO:** Listos ✅
