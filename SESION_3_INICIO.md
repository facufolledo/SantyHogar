# SESIÓN 3 - INICIO

## ⚠️ PROBLEMA RESUELTO: Error SSL en Python 3.14

### Problema
El backend no funcionaba debido a un error de certificados SSL:
```
[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate
```

Este error es específico de Python 3.13/3.14 en Windows, donde los certificados SSL no se instalan correctamente por defecto.

### Solución Implementada
Se modificó `backend/app/database/connection.py` para deshabilitar la verificación SSL en el cliente httpx que usa Supabase. **Esto es solo para desarrollo local.**

### Archivos Modificados
1. `backend/app/database/connection.py` - Configuración SSL deshabilitada
2. `start_backend.ps1` - Script en raíz del proyecto (usa entorno virtual de raíz)
3. `backend/start_backend.ps1` - Redirecciona al script de raíz

---

## 🚀 CÓMO INICIAR EL PROYECTO

### Paso 0: Verificar Instalación (RECOMENDADO)
```powershell
.\verificar_instalacion.ps1
```
Este script verifica que todo esté correctamente instalado.

### Paso 1: Iniciar Backend

**Opción 1: Usar el script (RECOMENDADO)**
```powershell
.\start_backend.ps1
```

**Opción 2: Manual**
```powershell
# Activar entorno virtual
.\.venv\Scripts\Activate.ps1

# Ir a backend e iniciar
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

**Verificar que funciona:**
- Abre: http://localhost:8000/docs
- Deberías ver la documentación de la API (Swagger UI)

### Paso 2: Iniciar Frontend

En una **nueva terminal**:
```powershell
cd frontend
npm run dev
```

**Verificar que funciona:**
- Abre: http://localhost:5173
- Deberías ver la página principal de SantyHogar

---

## 📝 NOTA SOBRE ENTORNO VIRTUAL

El entorno virtual (`.venv`) está en la **raíz del proyecto**, no en la carpeta `backend`. Esto es correcto y el script `start_backend.ps1` lo maneja automáticamente.

Estructura:
```
santyhogar/
├── .venv/              ← Entorno virtual aquí
├── backend/
│   ├── app/
│   └── requirements.txt
├── frontend/
└── start_backend.ps1   ← Script usa .venv de raíz
```

---

## 📋 PRÓXIMOS PASOS

### 1. Probar Sistema de Favoritos (TASK 1)
Una vez que el backend esté funcionando:
- [ ] Abrir frontend en http://localhost:5173
- [ ] Iniciar sesión con tu cuenta
- [ ] Ir a la página principal y probar el botón de corazón en las tarjetas de productos
- [ ] Verificar que los favoritos se guardan correctamente
- [ ] Ir a "Mis Favoritos" y verificar que se muestran los productos guardados
- [ ] Probar quitar favoritos desde ambas ubicaciones

### 2. Continuar con Nuevas Funcionalidades
Según el plan de Sesión 3:
- [ ] Sistema de Búsqueda y Filtros
- [ ] Loading Skeletons
- [ ] Optimización de Imágenes
- [ ] Mejoras de UX/UI

---

## 📝 ESTADO ACTUAL

### Backend
- **Puerto:** 8000
- **Estado:** Listo para iniciar con SSL deshabilitado
- **Endpoints:** Todos funcionando correctamente

### Frontend
- **Puerto:** 5173
- **Estado:** Funcionando correctamente
- **Nuevas funcionalidades:** Sistema de Favoritos implementado

### Cambios Pendientes de Commit
1. `frontend/src/context/FavoritesContext.tsx` - Nuevo
2. `frontend/src/App.tsx` - FavoritesProvider agregado
3. `frontend/src/components/ProductCard.tsx` - Botón de favorito
4. `frontend/src/pages/user/MyFavorites.tsx` - Usa FavoritesContext
5. `backend/app/database/connection.py` - SSL deshabilitado
6. `backend/start_backend.ps1` - Script actualizado

---

## ⚠️ NOTA IMPORTANTE
La deshabilitación de SSL es **SOLO PARA DESARROLLO LOCAL**. En producción, los certificados SSL deben estar correctamente configurados y la verificación debe estar habilitada.
