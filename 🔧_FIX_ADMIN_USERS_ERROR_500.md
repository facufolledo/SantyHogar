# 🔧 Fix: Error 500 en GET /admin/users

## 🐛 Problema

```
TypeError: PoolKey.__new__() got an unexpected keyword argument 'key_check_hostname'
```

**Ruta afectada:** `GET /admin/users`  
**Causa:** Incompatibilidad de versiones entre `requests` y `urllib3`

---

## ✅ Solución Aplicada

### Cambio Realizado

Reemplazamos `requests` con `httpx` en:  
**Archivo:** `backend/app/routes/admin_users.py`

```python
# ANTES (❌ Error)
import requests
response = requests.get(url, headers=headers, verify=False)

# AHORA (✅ Funciona)
import httpx
async with httpx.AsyncClient(verify=False) as client:
    response = await client.get(url, headers=headers)
```

### Por Qué Funciona

- ✅ `httpx` es el cliente HTTP oficial de Supabase
- ✅ Ya está en `requirements.txt` con versión compatible
- ✅ No tiene conflictos con `urllib3`
- ✅ Soporta async/await (mejor para FastAPI)

### Funciones Actualizadas

1. `list_admin_users()` - Listar usuarios admin
2. `create_admin_user()` - Crear usuario admin
3. `delete_admin_user()` - Eliminar usuario admin

---

## 🚀 Pasos para Aplicar

### 1. **Reiniciar Backend**

Si estás en desarrollo local:

```bash
cd backend
python -m uvicorn app.main:app --reload
```

Si usas Heroku/Render:
```bash
# El servidor se reiniciará automáticamente
# Los cambios en backend/ se despliegan con git push
```

### 2. **Verificar que Funciona**

En el navegador:
```
GET https://tu-backend.com/admin/users
```

Debería responder con lista de usuarios admin (o error 403 si falta permiso, pero NO 500).

---

## 📋 Cambios Específicos

### Antes
```python
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

response = requests.get(
    url,
    headers=headers,
    timeout=10,
    verify=False
)
```

### Después
```python
import httpx

async with httpx.AsyncClient(verify=False) as client:
    response = await client.get(
        url,
        headers=headers,
        timeout=10,
    )
```

---

## ✅ Verificación

Después de reiniciar, prueba estos endpoints:

### 1. Listar usuarios admin (requiere token admin)
```bash
GET /admin/users
Authorization: Bearer <admin_token>
```

**Respuesta esperada:** 
```json
[
  {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin Name",
    "created_at": "2024-07-16T..."
  }
]
```

### 2. Crear usuario admin
```bash
POST /admin/users
Content-Type: application/json

{
  "email": "newadmin@example.com",
  "password": "StrongPass123!",
  "name": "New Admin",
  "master_password": "SantyHogar2026!Admin"
}
```

### 3. Eliminar usuario admin
```bash
DELETE /admin/users/{user_id}
Authorization: Bearer <admin_token>
```

---

## 🔍 Debugging

Si aún hay error 500, verifica:

1. **Logs del backend:**
   ```bash
   # Busca líneas que digan:
   # DEBUG: Consultando https://...
   # DEBUG: Status code: ...
   ```

2. **SUPABASE_KEY en .env:**
   ```bash
   # Debe ser la service_role_key (no la anon key)
   SUPABASE_KEY=eyJhbGc...
   ```

3. **SUPABASE_URL en .env:**
   ```bash
   # Debe ser el URL completo
   SUPABASE_URL=https://xxxxx.supabase.co
   ```

---

## 📦 Dependencias

Ya instaladas en `requirements.txt`:
- `httpx==0.25.2` ✅
- `httpcore==1.0.9` ✅
- `websockets>=11,<13` ✅

No necesita instalar nada extra.

---

## 🎯 Resumen

| Aspecto | Antes | Después |
|--------|-------|---------|
| Cliente HTTP | requests | httpx |
| Error | ❌ PoolKey error | ✅ Sin errores |
| Async | ❌ No | ✅ Sí |
| Compatibilidad | ❌ Conflicto urllib3 | ✅ Compatible |
| Dependencias | requests (no pinchado) | httpx (ya pinchado) |

---

## ✨ Próximos Pasos

Después de reiniciar, prueba en admin:

1. Click en "Usuarios Admin"
2. Deberías ver lista de admins (vacía si es primera vez)
3. Click "+ Crear Usuario Admin"
4. Completa formulario
5. Click "Guardar"

¡Listo! El error 500 debe desaparecer.

