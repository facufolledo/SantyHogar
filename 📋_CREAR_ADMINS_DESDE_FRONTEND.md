# 📋 Cómo Crear Cuentas Admin desde el Frontend

## ✅ Ahora Disponible

A partir de esta sesión, puedes crear cuentas admin directamente desde el panel administrativo, sin necesidad de scripts de Python.

---

## 🚀 Cómo Hacerlo

### Paso 1: Accede al admin
1. Ve a: https://santyhogar.com.ar/admin
2. Ingresa con una cuenta admin existente:
   - **Email**: facundo@santyhogar.com
   - **Contraseña**: SantyHogar2024!

### Paso 2: Ve a "Usuarios Admin"
1. En el menú lateral, haz click en **"Usuarios Admin"** (ícono de personas)
2. Verás la lista de admins actuales

### Paso 3: Crear Nuevo Admin
1. Haz click en el botón **"Crear Usuario Admin"** (arriba a la derecha)
2. Se abrirá un modal con un formulario

### Paso 4: Completa los datos
| Campo | Ejemplo | Notas |
|-------|---------|-------|
| **Nombre** | Romina Accietto | Nombre completo |
| **Email** | romina@santyhogar.com | Email único |
| **Contraseña** | Charly5986 | Mínimo 6 caracteres |
| **Contraseña Maestra** | SantyHogar2026!Admin | Ver abajo ↓ |

### Paso 5: Crear
1. Click en **"Crear"**
2. Verás un mensaje de confirmación ✅
3. El nuevo admin aparecerá en la lista

---

## 🔐 Contraseña Maestra

**¿Qué es?** Una protección adicional para crear admins.

**Valor**: `SantyHogar2026!Admin`

**Ubicación**: Definida en `backend/.env` como `ADMIN_MASTER_PASSWORD`

**Por qué?** Previene que cualquiera cree admins sin autorización.

---

## 👥 Usuarios Admin Creados

### Facundo Santyago
- **Email**: facundo@santyhogar.com
- **Contraseña**: SantyHogar2024!
- **Rol**: Admin

### Romina Accietto
- **Email**: Rominaaccietto@gmail.com
- **Contraseña**: Charly5986
- **Rol**: Admin

---

## ⚙️ Funciones del Panel "Usuarios Admin"

### Ver Lista
- Muestra todos los usuarios admin
- Email, nombre, fecha de creación
- Estado (activo)

### Crear Admin
- Modal interactivo
- Validación de email
- Requerimientos de contraseña
- Protección con contraseña maestra

### Eliminar Admin
- Click en el botón rojo **"Eliminar"**
- Pide confirmación antes de borrar
- Irreversible

---

## 🔄 Flujo de Creación

```
1. Click "Crear Usuario Admin"
   ↓
2. Completa formulario (email, contraseña, nombre)
   ↓
3. Ingresa contraseña maestra
   ↓
4. Click "Crear"
   ↓
5. Backend valida datos
   ↓
6. Crea usuario en Supabase Auth
   ↓
7. Asigna rol "admin"
   ↓
8. ✅ Nuevo admin disponible
```

---

## 🛠️ Detrás de Escenas

**Frontend**: `frontend/src/pages/admin/AdminUsers.tsx`
- Componente React con formulario modal
- Validación de campos
- Llamadas a API

**Backend**: `backend/app/routes/admin_users.py`
- Endpoint: `POST /admin/users`
- Verifica contraseña maestra
- Crea usuario en Supabase Auth
- Asigna metadatos (nombre, rol)

**API**: 
```
POST /admin/users
{
  "email": "correo@santyhogar.com",
  "password": "contraseña",
  "name": "Nombre Completo",
  "master_password": "SantyHogar2026!Admin"
}
```

---

## ✨ Cambios en Esta Sesión

### Frontend
- ✅ `frontend/src/pages/admin/AdminUsers.tsx` - Ya existía, ahora es accesible
- ✅ `frontend/src/App.tsx` - Agregada ruta `/admin/usuarios`
- ✅ `frontend/src/pages/admin/AdminLayout.tsx` - Agregado al menú

### Backend
- ✅ Endpoints ya existían, solo se expusieron en frontend

---

## 🎯 Próximos Pasos

1. **Subir a Hostinger** (actualizar `public_html`)
2. **Probar crear admin desde el front**
3. **Validar que el nuevo admin puede acceder**

---

## ❓ FAQ

**¿Qué pasa si olvido la contraseña maestra?**
- No puedes crear admins desde el frontend
- Usa el script Python: `python backend/create_admin.py`

**¿Puedo crear usuarios normales desde aquí?**
- No, esta página es solo para admins
- Los clientes se registran desde la tienda

**¿Se puede cambiar la contraseña maestra?**
- Sí, editar `backend/.env` → `ADMIN_MASTER_PASSWORD`
- Requiere redeploy del backend

**¿Se pueden eliminar admins?**
- Sí, pero con cuidado. ¡No elimines todos!
- Button rojo "Eliminar" en la tabla
