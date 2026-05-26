# 🚨 Solución: Railway "Railpack could not determine how to build the app"

## ❌ Problema

Railway está mostrando este error:
```
✖ Railpack could not determine how to build the app.
```

Esto ocurre porque Railway está intentando deployar desde la **raíz del proyecto** en lugar de la carpeta `backend`.

---

## ✅ Solución (Opción 1 - RECOMENDADA)

### Configurar Root Directory en Railway

1. **Ir a tu proyecto en Railway**
   - https://railway.app/project/tu-proyecto

2. **Abrir Settings**
   - Click en el tab **"Settings"**

3. **Configurar Root Directory**
   - Buscar la sección **"Source"**
   - Encontrar el campo **"Root Directory"**
   - Poner: `backend`
   - Click en **"Update"** o **"Save"**

4. **Redeploy automático**
   - Railway detectará el cambio
   - Hará un redeploy automático
   - Ahora debería detectar Python correctamente

---

## ✅ Solución (Opción 2)

### Forzar Redeploy Manual

Si la Opción 1 no funciona:

1. **Ir a Deployments**
   - Click en el tab **"Deployments"**

2. **Redeploy**
   - Click en los 3 puntos del último deploy
   - Seleccionar **"Redeploy"**

---

## ✅ Solución (Opción 3)

### Verificar railway.toml

El archivo `railway.toml` en la raíz del proyecto debe tener:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

**NOTA:** Ya está configurado correctamente en el proyecto.

---

## 📋 Archivos Creados

Para ayudar con el deploy, se crearon estos archivos:

### En la raíz del proyecto:
- ✅ `railway.toml` - Configuración de Railway con Nixpacks

### En la carpeta backend:
- ✅ `backend/Procfile` - Comando de inicio para Railway
- ✅ `backend/runtime.txt` - Versión de Python (3.11.9)
- ✅ `backend/nixpacks.toml` - Configuración específica de Nixpacks
- ✅ `backend/requirements.txt` - Dependencias de Python

---

## 🔍 Verificar que funcionó

Después de configurar el Root Directory, deberías ver en los logs:

```
✓ Detected Python project
✓ Installing dependencies from requirements.txt
✓ Starting uvicorn server
```

En lugar de:
```
✖ Railpack could not determine how to build the app
```

---

## 📝 Notas

- **Railpack** es el builder antiguo de Railway (deprecated)
- **Nixpacks** es el builder nuevo y recomendado
- Railway debería usar Nixpacks automáticamente al detectar Python
- El Root Directory le dice a Railway dónde está el código del backend

---

## 🆘 Si sigue sin funcionar

1. **Verificar que el repositorio esté actualizado:**
   ```bash
   git add .
   git commit -m "Configuración Railway con Nixpacks"
   git push origin version1
   ```

2. **Eliminar el proyecto en Railway y crear uno nuevo:**
   - Settings → Danger → Delete Project
   - Crear nuevo proyecto desde GitHub
   - Configurar Root Directory: `backend`

3. **Contactar soporte de Railway:**
   - https://railway.app/help

---

**¡El problema debería resolverse configurando el Root Directory!** 🚀
