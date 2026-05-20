# 🧪 INSTRUCCIONES PARA PROBAR SISTEMA DE FAVORITOS

## 📋 PRE-REQUISITOS

Antes de comenzar, asegúrate de tener:
- ✅ Python 3.14 instalado
- ✅ Node.js instalado
- ✅ Entorno virtual de Python activado
- ✅ Dependencias de backend instaladas
- ✅ Dependencias de frontend instaladas

---

## 🚀 PASO 1: INICIAR BACKEND

### Opción A: Usar el script (RECOMENDADO)
```powershell
cd backend
.\start_backend.ps1
```

### Opción B: Comando directo
```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### ✅ Verificar que funciona
1. Abre tu navegador en: http://localhost:8000/docs
2. Deberías ver la documentación de Swagger UI
3. Prueba el endpoint `/health` - debe responder con status 200

**Si ves errores de SSL:**
- Verifica que `backend/app/database/connection.py` tenga la configuración SSL deshabilitada
- Revisa que no haya errores de sintaxis en el archivo
- Intenta reiniciar el servidor

---

## 🎨 PASO 2: INICIAR FRONTEND

En una **nueva terminal** (deja el backend corriendo):

```powershell
cd frontend
npm run dev
```

### ✅ Verificar que funciona
1. Abre tu navegador en: http://localhost:5173
2. Deberías ver la página principal de SantyHogar
3. Verifica que los productos se cargan correctamente

---

## 🧪 PASO 3: PROBAR SISTEMA DE FAVORITOS

### Test 1: Agregar Favorito (Usuario Logueado)

1. **Iniciar sesión:**
   - Click en "Iniciar sesión" en la esquina superior derecha
   - Usa tus credenciales: `ffolledo@ultranet.com.ar`
   - Verifica que tu nombre aparece en el navbar

2. **Agregar un favorito:**
   - Ve a la página principal (Home)
   - Busca cualquier tarjeta de producto
   - Observa el **botón de corazón en la esquina superior derecha** de la tarjeta
   - Click en el corazón
   - **Resultado esperado:**
     - El corazón se pone rojo y se rellena
     - Aparece un toast: "Agregado a favoritos"
     - La animación es suave

3. **Verificar en "Mis Favoritos":**
   - Click en tu nombre en el navbar
   - Selecciona "Mis Favoritos"
   - **Resultado esperado:**
     - El producto que agregaste aparece en la lista
     - El contador muestra "1 productos"

4. **Agregar más favoritos:**
   - Vuelve a Home o ve a Tienda
   - Agrega 2-3 productos más a favoritos
   - Verifica que todos aparecen en "Mis Favoritos"

### Test 2: Quitar Favorito

1. **Desde ProductCard:**
   - Ve a Home o Tienda
   - Busca un producto que sea favorito (corazón rojo)
   - Click en el corazón
   - **Resultado esperado:**
     - El corazón se pone gris (outline)
     - Aparece un toast: "Eliminado de favoritos"
     - El producto desaparece de "Mis Favoritos"

2. **Desde "Mis Favoritos":**
   - Ve a "Mis Favoritos"
   - Click en el corazón de cualquier producto
   - **Resultado esperado:**
     - El producto desaparece de la lista con animación
     - El contador se actualiza
     - Si quitas todos, aparece mensaje "No tenés productos favoritos"

### Test 3: Sin Login

1. **Cerrar sesión:**
   - Click en tu nombre en el navbar
   - Selecciona "Cerrar sesión"

2. **Intentar agregar favorito:**
   - Ve a Home
   - Click en el corazón de cualquier producto
   - **Resultado esperado:**
     - Aparece el modal de autenticación
     - Mensaje: "Debes iniciar sesión para agregar favoritos"

3. **Iniciar sesión desde modal:**
   - Completa el login en el modal
   - **Resultado esperado:**
     - Modal se cierra
     - Puedes agregar favoritos normalmente

### Test 4: Persistencia

1. **Agregar favoritos:**
   - Inicia sesión
   - Agrega 3-4 productos a favoritos

2. **Recargar página:**
   - Presiona F5 o recarga el navegador
   - **Resultado esperado:**
     - Los corazones rojos siguen en los productos favoritos
     - "Mis Favoritos" muestra los mismos productos

3. **Cerrar y abrir navegador:**
   - Cierra completamente el navegador
   - Abre nuevamente http://localhost:5173
   - Inicia sesión
   - **Resultado esperado:**
     - Los favoritos siguen ahí

### Test 5: Optimistic Updates

1. **Agregar favorito rápidamente:**
   - Click en corazón
   - Observa que el cambio es **inmediato**
   - No hay delay esperando al servidor

2. **Simular error de red (opcional):**
   - Abre DevTools (F12)
   - Ve a Network tab
   - Activa "Offline"
   - Intenta agregar/quitar favorito
   - **Resultado esperado:**
     - El cambio se revierte automáticamente
     - Aparece toast de error

---

## ✅ CHECKLIST DE PRUEBAS

Marca cada item cuando lo hayas probado:

- [ ] Backend inicia sin errores de SSL
- [ ] Frontend carga correctamente
- [ ] Puedo iniciar sesión
- [ ] Botón de corazón aparece en ProductCard
- [ ] Puedo agregar favoritos (corazón se pone rojo)
- [ ] Toast de confirmación aparece
- [ ] Favoritos aparecen en "Mis Favoritos"
- [ ] Contador de favoritos es correcto
- [ ] Puedo quitar favoritos desde ProductCard
- [ ] Puedo quitar favoritos desde "Mis Favoritos"
- [ ] Sin login, muestra modal de autenticación
- [ ] Favoritos persisten al recargar página
- [ ] Favoritos persisten al cerrar/abrir navegador
- [ ] Animaciones son suaves
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en consola del backend

---

## 🐛 PROBLEMAS COMUNES

### Backend no inicia
**Error:** `ModuleNotFoundError: No module named 'docx'`
**Solución:**
```powershell
cd backend
pip install -r requirements.txt
```

### Error de SSL persiste
**Error:** `[SSL: CERTIFICATE_VERIFY_FAILED]`
**Solución:**
1. Verifica que `backend/app/database/connection.py` tenga el código actualizado
2. Reinicia el servidor backend
3. Si persiste, considera downgrade a Python 3.12

### Frontend no carga productos
**Error:** Productos no aparecen en Home
**Solución:**
1. Verifica que el backend esté corriendo en puerto 8000
2. Abre DevTools (F12) → Network tab
3. Busca errores en las peticiones a `/products`
4. Verifica que `frontend/.env` tenga `VITE_API_URL=http://localhost:8000`

### Favoritos no se guardan
**Error:** Al recargar, los favoritos desaparecen
**Solución:**
1. Verifica que estés logueado
2. Abre DevTools (F12) → Console
3. Busca errores relacionados con `favorites`
4. Verifica que el backend responda correctamente a `/customers/{id}/favorites`

### Modal de login no aparece
**Error:** Click en corazón sin login no hace nada
**Solución:**
1. Abre DevTools (F12) → Console
2. Busca errores de JavaScript
3. Verifica que `AuthModal` esté importado correctamente en `ProductCard.tsx`

---

## 📊 RESULTADOS ESPERADOS

Al finalizar todas las pruebas, deberías tener:

✅ Backend funcionando sin errores de SSL
✅ Sistema de favoritos completamente funcional
✅ Optimistic updates funcionando
✅ Persistencia de favoritos
✅ Modal de autenticación funcionando
✅ Animaciones suaves
✅ Sin errores en consola

---

## 📝 REPORTAR PROBLEMAS

Si encuentras algún problema:

1. **Captura el error:**
   - Screenshot del error
   - Mensaje de error completo
   - Consola del navegador (F12)
   - Logs del backend

2. **Describe el problema:**
   - ¿Qué estabas haciendo?
   - ¿Qué esperabas que pasara?
   - ¿Qué pasó en realidad?

3. **Información del sistema:**
   - Versión de Python: `python --version`
   - Versión de Node: `node --version`
   - Sistema operativo: Windows
   - Navegador: Chrome/Firefox/Edge

---

## 🎉 SIGUIENTE PASO

Una vez que todas las pruebas pasen exitosamente, estaremos listos para:
- Hacer commit de los cambios
- Continuar con la siguiente funcionalidad (Búsqueda y Filtros)
- Agregar más mejoras al sistema de favoritos si es necesario
