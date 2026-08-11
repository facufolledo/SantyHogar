# TASK 9: Autenticación con Google OAuth

**STATUS:** done ✅
**USER QUERY:** "que te parece si implementamos el crearse un usuario con google con supabase ya q lo tenemos conectado"

## PROBLEMA
El sistema solo tenía autenticación mock (usuarios hardcodeados). Se necesitaba implementar autenticación real con Google OAuth usando Supabase Auth.

## SOLUCIÓN IMPLEMENTADA

### 1. Configuración de Supabase

#### Frontend - Variables de entorno (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://gsvtcrscojbfhgixxquw.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_l7GD-iAemesqsG5cS4LioQ_Ul8_sftV
```

#### Cliente de Supabase (`frontend/src/lib/supabase.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

### 2. Google Cloud Console

**Configuración OAuth 2.0:**
- **Application type:** Web application
- **Name:** SantyHogar Web Client
- **Authorized JavaScript origins:**
  - `http://localhost:5173`
  - `https://gsvtcrscojbfhgixxquw.supabase.co`
- **Authorized redirect URIs:**
  - `https://gsvtcrscojbfhgixxquw.supabase.co/auth/v1/callback`
  - `http://localhost:5173/SantyHogar/auth/callback`

### 3. Supabase Dashboard

**Authentication → Providers → Google:**
- Habilitado Google OAuth
- Configurado Client ID y Client Secret de Google
- Callback URL: `https://gsvtcrscojbfhgixxquw.supabase.co/auth/v1/callback`

### 4. Frontend - AuthContext Actualizado

**Nuevas funcionalidades:**
```typescript
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;  // NUEVO
  loginWithGoogle: () => Promise<{ ok: boolean; error?: string }>;  // NUEVO
  // ... resto de métodos
}
```

**Flujo de autenticación:**
1. Usuario hace clic en "Continuar con Google"
2. `loginWithGoogle()` inicia OAuth flow con Supabase
3. Redirect a Google para autorización
4. Google redirige a `/auth/callback`
5. `AuthCallback` procesa la sesión
6. `setUserFromSupabase()` crea el usuario en el contexto
7. **Auto-crea cliente en tabla `clientes`** si no existe

**Auto-creación de cliente:**
```typescript
const setUserFromSupabase = async (supabaseUser: User) => {
  // ... crear authUser
  
  if (!isAdmin) {
    // Verificar si el cliente existe
    const response = await fetch(`${API_URL}/customers/${supabaseUser.id}`);
    
    if (response.status === 404) {
      // Crear cliente automáticamente
      await fetch(`${API_URL}/customers`, {
        method: 'POST',
        body: JSON.stringify({
          id: supabaseUser.id,  // Mismo UUID que auth.users
          name: authUser.name,
          email: authUser.email,
          phone: authUser.phone,
          notes: `Registrado con ${provider}`,
        }),
      });
    }
  }
};
```

### 5. Frontend - AuthModal con Google

**Botón de Google:**
```tsx
<button onClick={handleGoogleLogin}>
  <GoogleIcon />
  Continuar con Google
</button>

<div className="divider">O continuar con email</div>

{/* Formulario tradicional */}
```

### 6. Frontend - AuthCallback

**Página de callback (`frontend/src/pages/AuthCallback.tsx`):**
- Muestra loading mientras procesa la sesión
- Redirige a home después de 1 segundo
- Supabase actualiza automáticamente el estado de auth

### 7. Backend - Soporte para ID personalizado

**Schema actualizado (`CreateCustomerRequest`):**
```python
class CreateCustomerRequest(BaseModel):
    id: Optional[UUID] = None  # Para usuarios de Supabase Auth
    name: str
    email: EmailStr
    # ... resto de campos
```

**Servicio actualizado:**
```python
async def create_customer(self, request: CreateCustomerRequest):
    # Si se proporciona un ID (usuario de Supabase Auth), usarlo
    if request.id:
        db_data["id_cliente"] = str(request.id)
        await self._db.create_customer_with_id(db_data)
    else:
        customer_id = await self._db.create_customer(db_data)
```

**Database Operations:**
```python
async def create_customer_with_id(self, customer_data: dict[str, Any]) -> None:
    """Crea un nuevo cliente con un ID específico."""
    # Inserta con el UUID proporcionado
    res = self._client().table("clientes").insert(customer_data).execute()
```

## RESULTADO

### Antes:
- Solo autenticación mock con usuarios hardcodeados
- No había persistencia real de sesiones
- No se podía registrar usuarios nuevos

### Después:
- ✅ Login con Google funcional
- ✅ Registro automático en `auth.users` (Supabase)
- ✅ Auto-creación de cliente en tabla `clientes`
- ✅ Mismo UUID para usuario y cliente (relación 1:1)
- ✅ Avatar y nombre desde Google
- ✅ Sesión persistente (refresh token)
- ✅ Fallback a email/password tradicional
- ✅ Admin detection (admin@santyhogar.com)

### Flujo completo:
1. Usuario → "Continuar con Google"
2. Google → Autorización
3. Supabase Auth → Crea usuario en `auth.users`
4. Frontend → Detecta nuevo usuario
5. Backend → Crea cliente en `clientes` con mismo UUID
6. Usuario logueado con perfil completo

## ARCHIVOS MODIFICADOS

**Frontend:**
- `frontend/.env` - Variables de Supabase
- `frontend/package.json` - Agregado @supabase/supabase-js
- `frontend/src/lib/supabase.ts` - Cliente de Supabase (nuevo)
- `frontend/src/context/AuthContext.tsx` - Integración con Supabase Auth
- `frontend/src/components/AuthModal.tsx` - Botón de Google
- `frontend/src/pages/AuthCallback.tsx` - Página de callback (nuevo)
- `frontend/src/App.tsx` - Ruta de callback

**Backend:**
- `backend/app/models/schemas.py` - ID opcional en CreateCustomerRequest
- `backend/app/services/customer_service.py` - Soporte para ID personalizado
- `backend/app/database/operations.py` - Método create_customer_with_id

**Documentación:**
- `backend/database/migrations/008_create_cliente_on_signup.sql` - Trigger (no usado)
- `backend/scripts/run_migration_008.py` - Script de migración (no usado)

## NOTAS TÉCNICAS

### ¿Por qué no usar Database Triggers?
Intentamos crear un trigger en `auth.users` para auto-crear clientes, pero Supabase no permite triggers en tablas del schema `auth` por seguridad. La solución fue crear el cliente desde el frontend.

### Relación auth.users ↔ clientes
- `auth.users.id` = `clientes.id_cliente` (mismo UUID)
- Permite queries JOIN si es necesario
- Cliente se crea solo para usuarios no-admin

### Seguridad
- Anon key es pública (solo para frontend)
- Service role key en backend (permisos completos)
- RLS deshabilitado en `clientes` para desarrollo

### Próximas mejoras
- [ ] Habilitar RLS en producción
- [ ] Agregar más providers (Facebook, GitHub)
- [ ] Implementar 2FA
- [ ] Password reset flow
- [ ] Email verification
