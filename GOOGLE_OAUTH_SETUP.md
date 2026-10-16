# Configuración de Google OAuth con Supabase

## ¿Qué se implementó?

Se agregó autenticación con Google OAuth usando Supabase Auth. El flujo es:

1. Usuario abre el modal de login
2. Presiona el botón "Continuar con Google"
3. Se redirige a Google para autenticar
4. Después de autenticar, vuelve al callback `/auth/callback`
5. La sesión se guarda en localStorage y Supabase

## Archivos nuevos/modificados

### Nuevos
- `frontend/src/api/supabaseClient.ts` — Cliente de Supabase configurado
- `frontend/src/pages/AuthCallback.tsx` — Página de callback para Google OAuth

### Modificados
- `frontend/src/context/AuthContext.tsx` — Agregado `loginWithGoogle()` y integración con Supabase
- `frontend/src/components/AuthModal.tsx` — Agregado botón de Google
- `frontend/src/App.tsx` — Agregada ruta `/auth/callback`

## Pasos para activar Google OAuth

### 1. Crear proyecto en Google Cloud Console

1. Ve a https://console.cloud.google.com/
2. Crea un nuevo proyecto: "Santy Hogar" 
3. Ve a **APIs & Services → OAuth consent screen**
4. Elige **External** → Crear
5. Completa:
   - App name: "Santy Hogar"
   - User support email: tu@email.com
   - Developer contact: tu@email.com
6. En Scopes, agrega estos (después de crear las credenciales):
   - `email`
   - `profile`
   - `openid`

### 2. Crear credenciales OAuth

1. Ve a **APIs & Services → Credentials**
2. Click en **+ Create Credentials → OAuth 2.0 Client ID**
3. Elige **Web application**
4. Nombre: "Santy Hogar Frontend"
5. En **Authorized JavaScript origins**, agrega:
   ```
   http://localhost:5173
   http://localhost:5174
   https://santyhogar.com.ar
   https://www.santyhogar.com.ar
   ```
6. En **Authorized redirect URIs**, agrega:
   ```
   http://localhost:5173/auth/callback
   http://localhost:5174/auth/callback
   https://santyhogar.com.ar/auth/callback
   https://www.santyhogar.com.ar/auth/callback
   ```
7. Copia el **Client ID** (lo necesitarás)

### 3. Configurar en Supabase

1. Ve a https://supabase.com/dashboard
2. Entra a tu proyecto "santyhogar"
3. Ve a **Authentication → Providers**
4. Activa **Google**
5. Pega el **Client ID** de Google en el campo "Client ID"
6. El **Client Secret** será enviado por Google (está en las credenciales OAuth)
7. Copia el **Client Secret** y pégalo en Supabase
8. Guarda

### 4. Verificar que el callback está correcto

En Supabase → Authentication → URL Configuration, asegúrate de que:
- **Site URL**: `http://localhost:5173` (desarrollo) o `https://santyhogar.com.ar` (producción)
- **Redirect URLs**: Incluya `/auth/callback`

## Pruebas locales

1. Asegúrate de que el frontend corre en `http://localhost:5173`
2. Abre el modal de login
3. Presiona "Continuar con Google"
4. Completa el login con una cuenta Google
5. Deberías volver a `/auth/callback` y luego a `/` automáticamente
6. Tu usuario estará guardado en localStorage

## Integración con usuarios en la BD

Actualmente:
- Los usuarios de Google se guardan en la sesión de Supabase
- Se guarda un resumen en localStorage

Futuro:
- Sincronizar datos del usuario con tabla `auth.users` en Supabase
- Guardar rol (admin/cliente) en user_metadata

## Troubleshooting

### "Error al iniciar sesión con Google"
- Verifica que el Client ID está correcto
- Verifica que las URLs están en las listas blancas

### Callback no funciona
- Asegúrate de que Site URL en Supabase es `http://localhost:5173`
- Verifica que `/auth/callback` está en la lista de Redirect URLs

### Usuario no se guarda
- Revisa localStorage (`santyhogar_auth`)
- Revisa la console del navegador para errors

## Variables de entorno necesarias

Estas YA están en `.env`:
```
VITE_SUPABASE_URL=https://gsvtcrscojbfhgixxquw.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_l7GD-iAemesqsG5cS4LioQ_Ul8_sftV
```

No necesitas agregar Client ID de Google en las variables (Supabase lo maneja internamente).
