# 📝 CAMBIOS EN SCRIPTS DE INICIO

## Problema Identificado
El entorno virtual (`.venv`) está en la **raíz del proyecto**, no en la carpeta `backend`. Los scripts anteriores no lo tenían en cuenta.

## Solución Implementada

### 1. Nuevo Script Principal: `start_backend.ps1` (raíz)
**Ubicación:** Raíz del proyecto  
**Función:** 
- Activa el entorno virtual desde `.venv` en la raíz
- Verifica que las dependencias estén instaladas
- Si faltan, las instala automáticamente
- Cambia al directorio `backend` e inicia el servidor

**Uso:**
```powershell
.\start_backend.ps1
```

### 2. Script de Verificación: `verificar_instalacion.ps1`
**Ubicación:** Raíz del proyecto  
**Función:**
- Verifica Python instalado
- Verifica Node.js instalado
- Verifica entorno virtual existe
- Verifica dependencias de backend instaladas
- Verifica dependencias de frontend instaladas
- Verifica archivos `.env` existen
- Muestra resumen de qué está listo y qué falta

**Uso:**
```powershell
.\verificar_instalacion.ps1
```

### 3. Script Actualizado: `backend/start_backend.ps1`
**Ubicación:** Carpeta backend  
**Función:**
- Redirecciona al script principal en la raíz
- Mantiene compatibilidad si alguien lo ejecuta desde backend

**Uso:**
```powershell
cd backend
.\start_backend.ps1
# Automáticamente ejecuta ..\start_backend.ps1
```

### 4. Guía Rápida: `INICIO_RAPIDO.md`
**Ubicación:** Raíz del proyecto  
**Función:**
- Comandos esenciales para iniciar el proyecto
- Soluciones a problemas comunes
- Referencias a documentación completa

---

## Estructura del Proyecto

```
santyhogar/
├── .venv/                          ← Entorno virtual (raíz)
├── backend/
│   ├── app/
│   │   └── database/
│   │       └── connection.py       ← SSL deshabilitado
│   ├── requirements.txt
│   └── start_backend.ps1           ← Redirecciona a raíz
├── frontend/
│   ├── src/
│   └── package.json
├── start_backend.ps1               ← Script principal ✨
├── verificar_instalacion.ps1       ← Verificación ✨
├── INICIO_RAPIDO.md                ← Guía rápida ✨
├── SESION_3_INICIO.md              ← Documentación detallada
└── SESION_3_RESUMEN.md             ← Resumen completo
```

---

## Ventajas de la Nueva Configuración

✅ **Automático:** El script activa el entorno virtual automáticamente  
✅ **Inteligente:** Verifica e instala dependencias si faltan  
✅ **Informativo:** Muestra mensajes claros de lo que está haciendo  
✅ **Compatible:** Funciona desde raíz o desde carpeta backend  
✅ **Verificable:** Script de verificación para diagnosticar problemas  

---

## Cómo Usar

### Primera Vez
```powershell
# 1. Verificar que todo está instalado
.\verificar_instalacion.ps1

# 2. Si falta algo, instalarlo según las instrucciones

# 3. Iniciar backend
.\start_backend.ps1

# 4. En otra terminal, iniciar frontend
cd frontend
npm run dev
```

### Uso Diario
```powershell
# Terminal 1: Backend
.\start_backend.ps1

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## Archivos Creados/Modificados

### Nuevos
- ✨ `start_backend.ps1` (raíz)
- ✨ `verificar_instalacion.ps1` (raíz)
- ✨ `INICIO_RAPIDO.md` (raíz)
- ✨ `CAMBIOS_SCRIPTS_INICIO.md` (este archivo)

### Modificados
- 🔧 `backend/start_backend.ps1` - Ahora redirecciona a raíz
- 🔧 `backend/app/database/connection.py` - SSL deshabilitado
- 🔧 `SESION_3_INICIO.md` - Actualizado con nuevas instrucciones

---

## Próximo Paso

**Ejecuta el script de verificación para asegurarte de que todo está listo:**
```powershell
.\verificar_instalacion.ps1
```

Si todo está ✓ (verde), entonces:
```powershell
.\start_backend.ps1
```

¡Y listo! El backend debería iniciar sin problemas de SSL.
