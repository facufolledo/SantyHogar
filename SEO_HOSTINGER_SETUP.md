# 🔍 Setup SEO - SantyHogar en Hostinger

## 📁 Estructura de archivos en `public_html/`

En Hostinger, tu carpeta `public_html/` debe tener esta estructura:

```
public_html/
├── index.html              (React build)
├── sitemap.xml             (Sitemap estático - páginas principales)
├── sitemap-products.xml    (Sitemap dinámico - desde backend)
├── robots.txt              (Instrucciones para bots)
├── .htaccess               (Reescritura de URLs para React Router)
├── assets/                 (CSS, JS del build)
├── favicon.ico
└── manifest.json
```

---

## 🚀 Pasos de Setup

### 1. Subir archivos estáticos a Hostinger

En el **Administrador de archivos de Hostinger**:

1. Navega a `public_html/`
2. Descarga estos archivos desde tu proyecto local:
   - `frontend/public/sitemap.xml`
   - `frontend/public/robots.txt`
   - `frontend/public/.htaccess`

3. Verifica que también esté el build del frontend:
   - `frontend/dist/` → todo copiado a `public_html/`

---

### 2. Verificar que los archivos se sirven correctamente

Abre en tu navegador (reemplaza `santyhogar.com.ar` con tu dominio):

#### ✅ Verificar robots.txt
```
https://santyhogar.com.ar/robots.txt
```
Debe mostrar:
```
User-agent: *
Allow: /

Disallow: /admin/
...
Sitemap: https://santyhogar.com.ar/sitemap.xml
```

#### ✅ Verificar sitemap.xml (estático)
```
https://santyhogar.com.ar/sitemap.xml
```
Debe mostrar XML con URLs:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://santyhogar.com.ar/</loc>
    ...
  </url>
</urlset>
```

**Si ves la página de React en lugar de XML** → El `.htaccess` no está funcionando. Solución:
1. En Hostinger, ve a **Configuración → Mostrar archivos ocultos**
2. Verifica que `.htaccess` está presente
3. Si no, cópialo manualmente

#### ✅ Verificar sitemap dinámico (desde backend)
```
https://santyhogar.com.ar/api/sitemap-products.xml
```
Debe mostrar XML con todos tus productos:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://santyhogar.com.ar/producto/lavarropa-drean-next-1012-eco</loc>
    <lastmod>2026-11-08</lastmod>
    <priority>0.8</priority>
  </url>
  ...
</urlset>
```

Si devuelve error 404 o error del backend → El backend no está accesible desde Google.

---

### 3. Agregar sitemaps a Google Search Console

1. Ve a [Google Search Console](https://search.google.com/search-console)
2. Selecciona tu propiedad: `https://santyhogar.com.ar`
3. En el menú izquierdo → **Sitemaps**
4. Haz clic en **Agregar sitemap**
5. Ingresa: `sitemap.xml`
6. Repite para: `sitemap-products.xml`

Espera 24-48h a que Google procese.

---

## 🔄 Actualizar el sitemap dinámico

Cada vez que subes un producto nuevo, Google necesita descubrir el `sitemap-products.xml`.

### Opción 1: Manual (Rápido)
1. En Google Search Console → Sitemaps
2. Haz clic en `sitemap-products.xml`
3. Haz clic en los 3 puntos → **Solicitar indexación**

### Opción 2: Automático (Recomendado)
Crea un webhook en Supabase que notifique a Google cuando se agregue un producto:

```python
# En backend: webhook que notifica a Google Search Console
from fastapi import APIRouter
import requests

@app.post("/webhook/product-added")
async def product_added(data: dict):
    # Notificar a Google que el sitemap cambió
    url = "https://www.google.com/ping"
    params = {"sitemap": "https://santyhogar.com.ar/api/sitemap-products.xml"}
    requests.get(url, params=params)
    return {"status": "notified"}
```

---

## 📊 Checklist antes de enviar a Google

- [ ] `robots.txt` se sirve correctamente (es .txt, no HTML)
- [ ] `sitemap.xml` se sirve como XML (no HTML)
- [ ] `sitemap-products.xml` desde el backend devuelve XML
- [ ] `.htaccess` permite que rutas de React funcionen
- [ ] Frontend build está en `public_html/`
- [ ] Backend está en producción en Railway/similar
- [ ] Dominio es `santyhogar.com.ar` (sin www)
- [ ] HTTPS está activo
- [ ] Certificado SSL es válido

---

## 🛠️ Troubleshooting

### Problema: "Sitemap is HTML"
**Solución:** El `.htaccess` está redirigiendo `/sitemap.xml` a `index.html`

1. Abre `frontend/public/.htaccess`
2. Verifica que tenga estas líneas:
```apache
RewriteCond %{REQUEST_URI} !^/sitemap\.xml$
RewriteCond %{REQUEST_URI} !^/robots\.txt$
```
3. Si no, agrégalas
4. Recarga el sitio

### Problema: robots.txt devuelve 404
**Solución:** El archivo no está en `public_html/`

1. Descarga `frontend/public/robots.txt`
2. Sube a `public_html/` vía Administrador de archivos
3. Verifica: `https://santyhogar.com.ar/robots.txt`

### Problema: "DNS error" en Search Console
**Solución:** El dominio no está configurado correctamente

1. En Hostinger → Dominios → santyhogar.com.ar
2. Verifica que los nameservers apunten a Hostinger
3. Espera 24-48h a que se propague

---

## 📈 Próximos pasos para SEO

1. **Metaetiquetas en productos** → Agregar en React para cada producto
2. **Structured data** → JSON-LD schema.org para productos
3. **Open Graph** → Para compartir en redes sociales
4. **Heading tags** → H1, H2, H3 bien estructurados
5. **Alt text** → Descripciones de imágenes
6. **Internal linking** → Enlaces entre productos/categorías

---

**Última actualización:** Session 9
**Contacto:** Si hay problemas, verificá que backend esté corriendo en Railway
