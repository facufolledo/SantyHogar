# 🚀 INICIO RÁPIDO - SantyHogar

## ✅ Verificar Instalación
```powershell
.\verificar_instalacion.ps1
```

## 🔧 Iniciar Backend
```powershell
.\start_backend.ps1
```
**URL:** http://localhost:8000  
**Docs:** http://localhost:8000/docs

## 🎨 Iniciar Frontend
En una **nueva terminal**:
```powershell
cd frontend
npm run dev
```
**URL:** http://localhost:5173

---

## 📝 Notas

- El entorno virtual (`.venv`) está en la raíz del proyecto
- El script `start_backend.ps1` activa automáticamente el entorno virtual
- Si hay errores de dependencias, el script las instala automáticamente

---

## 🐛 Problemas Comunes

### Backend no inicia
```powershell
# Reinstalar dependencias
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

### Frontend no inicia
```powershell
cd frontend
npm install
npm run dev
```

### Error de SSL
Ya está resuelto en `backend/app/database/connection.py`

---

## 📚 Documentación Completa

- `SESION_3_INICIO.md` - Información detallada sobre SSL y configuración
- `SESION_3_RESUMEN.md` - Resumen completo de la sesión
- `INSTRUCCIONES_PRUEBA_FAVORITOS.md` - Cómo probar el sistema de favoritos
