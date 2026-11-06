# Santy Hogar — Ecommerce

Tienda online de **Santy Hogar**: electrodomésticos, mueblería y colchonería con carrito, checkout y pago con Mercado Pago.

Monorepo: **`frontend/`** (Vite + React) y **`backend/`** (FastAPI).

## Características

- Catálogo de productos (API o catálogo estático de respaldo)
- Carrito, checkout y creación de órdenes vía API
- Integración Mercado Pago (`init_point`)
- Panel de administración y área de cuenta de usuario

## Tecnologías (frontend)

- React 18, TypeScript, Vite
- Tailwind CSS, Framer Motion
- React Router

## Instalación (frontend)

```bash
git clone https://github.com/cassiel2002/SantyHogar.git
cd SantyHogar

cd frontend
npm install

npm run dev
npm run build
npm run preview
```

## Despliegue

1. **Construir el proyecto**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Subir** el contenido de `frontend/dist/` al hosting (según tu proveedor: GitHub Pages, VPS, etc.).

3. **Dominio y SSL**: apuntá tu dominio al hosting y configurá HTTPS.

4. **SEO**: en `frontend/public/robots.txt` y `frontend/public/sitemap.xml` reemplazá `https://www.santyhogar.com` por tu dominio real si no coincide. Si publicás sin el subpath `/SantyHogar/`, ajustá también esas rutas para que coincidan con `vite.config.ts` (`base`).

5. **Auditorías locales** (opcional):
   ```bash
   cd frontend
   npm run seo-check
   npm run lighthouse
   ```
   Los scripts apuntan a `http://localhost:5173/SantyHogar/`; levantá el dev server antes.

## SEO

- `frontend/public/sitemap.xml` — mapa del sitio (rutas públicas principales)
- `frontend/public/robots.txt` — instrucciones para crawlers
- Meta tags en `frontend/index.html`

## Google Search Console

1. Verificá la propiedad del sitio.
2. Enviá el sitemap: `https://TU-DOMINIO/SantyHogar/sitemap.xml` (ajustá dominio y path).

## Scripts útiles (`frontend/`)

- `npm run dev` — desarrollo
- `npm run build` — producción
- `npm run preview` — previsualizar build
- `npm run deploy` — build + mensaje de despliegue
- `npm run analyze` — análisis del bundle
- `npm run lighthouse` / `npm run seo-check` — Lighthouse (local)

## Backend (API FastAPI)

Código en `backend/`. Variables de entorno: `backend/.env` (no se versiona; partí de `backend/.env.example` si existe).

**Variables típicas**: `FRONTEND_URL` (CORS para el origen del front, p. ej. `http://localhost:5173`), URL de Supabase, `MERCADOPAGO_ACCESS_TOKEN`, etc.

Desde la raíz del repositorio:

```bash
python -m venv .venv
.venv\Scripts\pip install -r backend\requirements.txt
```

Activá el venv y usá el directorio `backend` como cwd para `uvicorn`:

```bash
cd backend
..\.venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

En el front, configurá `VITE_API_URL` (p. ej. en `frontend/.env`) apuntando al backend.

**Checkout local (sin Mercado Pago):** dejá `VITE_ENABLE_MP_CHECKOUT=false` o no la definas. Los pedidos se guardan solo en el navegador. Cuando publiques y tengas token de MP en el backend, poné `VITE_ENABLE_MP_CHECKOUT=true` para redirigir al checkout de Mercado Pago.

## Licencia

MIT — ver archivo `LICENSE` si está presente.

---

**Santy Hogar** — ecommerce de electrodomésticos, mueblería y colchonería.
