# 📋 Configurar Cron Job en Hostinger - Sitemap Sync

## 📥 Paso 1: Subir el Script a Hostinger

### Opción A: FTP
1. Abre FileZilla o tu cliente FTP favorito
2. Conecta a Hostinger con tus credenciales FTP
3. Navega a `/home/usuario/public_html/` (o donde esté tu www)
4. Sube el archivo: `update-sitemap.php`

### Opción B: Administrador de Archivos Hostinger
1. Panel Hostinger → Administrador de archivos
2. Ve a `public_html/`
3. Haz clic en **Subir archivos**
4. Selecciona `update-sitemap.php` (o copia el contenido manualmente)

---

## ⏰ Paso 2: Configurar el Cron Job

### En Hostinger Panel

1. **Panel Hostinger** → `www.hostinger.com/panel`
2. Selecciona tu dominio/cuenta
3. En el menú izquierdo → **Advanced** → **Cron Jobs**
4. Haz clic en **Create New Cron Job**

### Configurar el Cron

Llena los campos así:

| Campo | Valor |
|-------|-------|
| **Comando** | `php /home/usuario/public_html/update-sitemap.php` |
| **Frecuencia** | `Cada 6 horas` (o selecciona `0 */6 * * *`) |
| **Email** | Tu email (recibe notificaciones de ejecución) |

**⚠️ Importante:** Reemplaza `/home/usuario/` con tu usuario real de Hostinger

Para saber tu usuario:
- Panel → Settings → Acceso (ves tu usuario)
- O en FTP credentials

### Ejemplo con usuarios reales

Si tu usuario es `facundo`, sería:
```
php /home/facundo/public_html/update-sitemap.php
```

---

## ✅ Paso 3: Verificar que Funciona

### 1️⃣ Test Manual

En el Administrador de archivos de Hostinger:
1. Navega a `public_html/`
2. Haz clic derecho en `update-sitemap.php`
3. Selecciona **Run as PHP** o **Execute**
4. Debe mostrar: ✅ Sitemap sincronizado

### 2️⃣ Revisar el Log

El script crea automáticamente `.sitemap-sync-log` con detalles.

1. En el Administrador de archivos
2. Settings (arriba) → **Show Hidden Files**
3. Abre `.sitemap-sync-log`
4. Verifica que dice:
   ```
   [2026-11-10 14:30:45] === Iniciando sincronización de sitemap ===
   [2026-11-10 14:30:46] 📥 Descargando sitemap de Railway...
   [2026-11-10 14:30:47] ✅ Descarga completada (15234 bytes)
   [2026-11-10 14:30:47] 🔍 Validando XML...
   [2026-11-10 14:30:47] ✅ XML válido con 171 productos
   [2026-11-10 14:30:47] 💾 Guardando en disco local...
   [2026-11-10 14:30:47] ✅ Archivo guardado
   [2026-11-10 14:30:47] 🎉 Sincronización completada exitosamente
   ```

### 3️⃣ Verifica el Sitemap

En tu navegador:
```
https://www.santyhogar.com.ar/sitemap-products.xml
```

Debe mostrar **XML con productos** (no una plantilla vacía)

---

## 🛠️ Solucionar Problemas

### Problema: "Comando no reconocido"

**Error:** `php: command not found`

**Solución:**
- Usa la ruta completa a PHP:
  ```
  /usr/bin/php /home/usuario/public_html/update-sitemap.php
  ```
- O pregunta a Hostinger el path correcto a PHP

### Problema: "Permiso denegado"

**Error:** `Permission denied`

**Solución:**
1. En el Administrador de archivos
2. Haz clic derecho en `update-sitemap.php`
3. Propiedades → Cambiar permisos a **755**

### Problema: "Connection timeout"

**Error:** Railway no responde

**Verificar:**
1. ¿Railway está levantado? https://santyhogar-production.up.railway.app/health
2. ¿Dominio correcto? (debe ser `.up.railway.app`)
3. Espera 1 minuto e intenta manualmente

### Problema: "No puedo crear el cron"

**Solución:**
- Algunos planes Hostinger no incluyen cron
- Contacta a Hostinger para verificar
- Alternativa: Hacer sync manual 1x por día desde Google Search Console

---

## 📊 Lo que Pasa Automáticamente

```
Cada 6 horas:
  1. Cron de Hostinger llama al script
  2. Script descarga XML de Railway
  3. Valida que sea XML válido
  4. Guarda a /sitemap-products.xml
  5. Registra en log
  6. Te envía email (si lo configuraste)

Resultado:
  ✅ /sitemap-products.xml siempre tiene catálogo real
  ✅ Google puede leer desde Hostinger (no desde Railway)
  ✅ Si Railway se cae, el sitemap sigue siendo válido
  ✅ Cada 6 horas se sincroniza automáticamente
```

---

## 🎯 Verificación Final

Después de 6-12 horas, verifica:

1. ✅ `/sitemap-products.xml` tiene **171+ productos**
2. ✅ Log muestra ejecuciones exitosas
3. ✅ Google Search Console muestra **171+ URLs descubiertas**
4. ✅ Console log sin "Sitemap is HTML"

---

## 📞 Si Necesitas Ayuda

**Hostinger Support:**
- Panel → Settings → Support Chat
- Pregunta: "¿Cómo ejecuto un cron job PHP?"

**Verificación de usuario:**
```bash
whoami  # desde terminal si tienes acceso SSH
```

Habitualmente es:
- `home/santyhogar/` 
- `home/usuario/`
- `home/dominio/`

---

## 🚀 Resumen

| Paso | Acción |
|------|--------|
| 1 | Sube `update-sitemap.php` a `public_html/` |
| 2 | Crea cron job: `php /home/usuario/public_html/update-sitemap.php` |
| 3 | Frecuencia: Cada 6 horas |
| 4 | Verifica: `/sitemap-products.xml` tiene productos |
| 5 | ✅ Listo |

**Tiempo de setup:** 5 minutos  
**Costo:** $0  
**Mantenimiento:** Automático

---

**Última actualización:** 2026-11-10  
**Versión del script:** 1.0  
**Tested en:** Hostinger Linux
