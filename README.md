# Marmolería Santa Rita - Sitio Web Oficial

Sitio web oficial de Marmolería Santa Rita, especialistas en granitos y mármoles premium en La Rioja, Argentina.

Monorepo: **`frontend/`** (Vite + React) y **`backend/`** (FastAPI).

## 🏠 Sobre Nosotros

Marmolería Santa Rita nació hace más de 15 años en Córdoba, impulsada por la pasión familiar de ofrecer productos de calidad y buen servicio. Con esfuerzo y compromiso, hoy seguimos creciendo desde La Rioja, conservando el mismo espíritu de trabajo y atención personalizada que nos caracteriza.

## 🚀 Características

- **Diseño Moderno**: Interfaz elegante y responsiva
- **Animaciones Suaves**: Transiciones fluidas con Framer Motion
- **SEO Optimizado**: Meta tags, Schema.org y sitemap
- **Rendimiento**: Carga rápida y optimizada
- **Accesibilidad**: Diseño inclusivo y accesible

## 🛠️ Tecnologías

- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **Vite** - Herramienta de construcción
- **Tailwind CSS** - Framework de CSS
- **Framer Motion** - Animaciones
- **React Router** - Navegación

## 📦 Instalación (frontend)

```bash
# Clonar el repositorio
git clone https://github.com/cassiel2002/SantyHogar.git
cd SantyHogar

cd frontend
npm install

npm run dev
npm run build
npm run preview
```

## 🌐 Despliegue

### Para marmoleriasantarita.com

1. **Construir el proyecto**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Subir archivos**:
   - Subir todo el contenido de `frontend/dist/` al directorio raíz de tu hosting
   - Asegurarse de que el `.htaccess` de despliegue esté en la raíz del sitio (ver `frontend/.htaccess` o `frontend/public/.htaccess` según tu hosting)

3. **Configurar dominio**:
   - Apuntar el dominio `marmoleriasantarita.com` al hosting
   - Configurar SSL/HTTPS

4. **Verificar SEO**:
   ```bash
   cd frontend
   npm run seo-check
   npm run lighthouse
   ```

## 📊 SEO y Rendimiento

### Meta Tags Optimizados
- Título y descripción específicos para cada página
- Open Graph y Twitter Cards
- Schema.org structured data
- Canonical URLs

### Archivos SEO
- `frontend/sitemap.xml` - Mapa del sitio
- `frontend/robots.txt` - Instrucciones para crawlers
- `frontend/.htaccess` - Configuración del servidor (si aplica)

### Rendimiento
- Compresión GZIP
- Cache de navegador
- Lazy loading de imágenes
- Bundle splitting

## 📱 Páginas

- **Inicio** (`/`) - Página principal con hero y valores
- **Nosotros** (`/nosotros`) - Historia y filosofía
- **Productos** (`/productos`) - Catálogo de granitos
- **Trabajos** (`/trabajos`) - Galería de ejemplos
- **Diseños** (`/disenos`) - Diseños de interiores
- **Contacto** (`/contacto`) - Información de contacto

## 🎨 Estructura del repositorio

```
frontend/          # Vite + React
├── src/
│   ├── components/
│   ├── pages/
│   ├── data/
│   └── main.tsx
├── public/
├── index.html
└── package.json

backend/           # FastAPI
├── app/
├── database/
└── requirements.txt
```

## 📈 Monitoreo

### Google Analytics
Agregar el código de Google Analytics en `frontend/index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Google Search Console
1. Verificar propiedad en Google Search Console
2. Enviar sitemap: `https://marmoleriasantarita.com/sitemap.xml`
3. Monitorear rendimiento de búsqueda

## 🔧 Scripts Disponibles (en `frontend/`)

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Previsualizar build
- `npm run deploy` - Construir y preparar para despliegue
- `npm run analyze` - Analizar bundle
- `npm run lighthouse` - Auditoría de rendimiento
- `npm run seo-check` - Verificación de SEO

## 📞 Contacto

- **Teléfono**: +54 9 3549 43-4885
- **Email**: Maximilianoopriarioo@gmail.com
- **Ubicación**: La Rioja, Argentina

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles.

## Backend (API FastAPI)

Código en `backend/`. Variables de entorno: `backend/.env` (no se versiona; partí de `backend/.env.example`).

Desde la raíz del repositorio:

```bash
python -m venv .venv
.venv\Scripts\pip install -r backend\requirements.txt
```

Activá el venv y usá el directorio `backend` como cwd para imports de `app`:

```bash
cd backend
..\.venv\Scripts\activate
python -c "from app.config import get_config"
```

---

**Marmolería Santa Rita** - Especialistas en granitos y mármoles premium en La Rioja, Argentina.
