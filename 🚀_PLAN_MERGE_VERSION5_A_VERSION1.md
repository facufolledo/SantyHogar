# 🚀 PLAN DE MERGE: VERSION5 → VERSION1

**Objetivo**: Integrar los cambios de Cassiel en tu rama principal de producción.

**Riesgo**: 🟢 BAJO (Cassiel respetó tus cambios de categorías)

---

## 📊 CAMBIOS A INGRESARSE (RESUMEN RÁPIDO)

```
✅ 1 componente NUEVO: LowStockBanner.tsx
✅ 1 página NUEVA: TermsAndConditions.tsx
✅ 5 archivos MODIFICADOS (Checkout, Home, ProductCard, etc.)
✅ Legal completa (Términos + Privacidad)
✅ Stock bajo visual
✅ Direcciones guardadas en checkout
❌ 0 conflictos esperados
```

---

## 🎯 PASO A PASO

### PASO 1: Verificar estado actual
```bash
# Debes estar en version1 (ya lo estás)
cd d:\Users\Facundo\Desktop\santyhogar
git branch -v
# Output: * version1 4d92079...
#         version5 de442f2...
```

### PASO 2: Crear rama de backup (RECOMENDADO)
```bash
git branch version1-backup
# Esto crea una copia local en caso de que algo falle
```

### PASO 3: Mergear version5 en version1
```bash
git merge version5 --no-ff -m "merge: version5 (stock banner, terms, checkout improvements)"
```

**Resultado esperado**:
- ✅ Merge automático sin conflictos
- ✅ 1 commit de merge nuevo
- ✅ version1 ahora tiene todos los cambios

---

## 🔍 VERIFICAR DESPUÉS DEL MERGE

### 1. Ver qué entró
```bash
git log --oneline version1-backup..version1
# Debe mostrar 1 commit (el merge)

git diff version1-backup...version1 --stat
# Resumen de cambios
```

### 2. Listar archivos nuevos/modificados
```bash
git diff version1-backup...version1 --name-status
# M = Modificado
# A = Añadido (nuevo)
```

**Salida esperada**:
```
A  frontend/src/components/LowStockBanner.tsx
A  frontend/src/pages/TermsAndConditions.tsx
M  frontend/src/pages/Checkout.tsx
M  frontend/src/pages/Home.tsx
M  frontend/src/components/ProductCard.tsx
M  frontend/src/api/productsApi.ts
... (otros menores)
```

### 3. Build test
```bash
cd frontend
npm run build
# Debe completar SIN errores
```

### 4. Test manual en navegador (si tienes servidor local)
```bash
cd frontend
npm run dev
# Probar:
# ✅ Home carga categorías dinámicas
# ✅ ProductCard muestra "¡Últimas!" si stock < 3
# ✅ Producto con stock bajo muestra banner
```

---

## 🧪 TESTING CHECKLIST POST-MERGE

### Test 1: Categorías dinámicas siguen funcionando ✅
```
FROM: /tienda
EXPECT: Categorías con imágenes de productos + conteo
EXPECTED STATE: Admin panel todavía funciona
COMMAND: Ir a /admin/categories
```

### Test 2: Stock bajo visible ⚠️
```
FROM: /tienda o home
FIND: Producto con stock < 3
EXPECT: Badge "¡Últimas!" en card
```

### Test 3: Términos accesibles 📋
```
FROM: Navbar/Footer (si está el link)
GO TO: /terminos
EXPECT: Página con Términos + Privacidad
```

### Test 4: Checkout con direcciones 🏠
```
FROM: Checkout
STEP 1: Hacer login
STEP 2: Si tiene direcciones guardadas → dropdown debe mostrar
STEP 3: Si selecciona nueva → campos habilitados
STEP 4: Checkbox "Guardar para próxima" debe estar visible
```

### Test 5: Build sin errores 🔨
```bash
npm run build
# Debe generar /frontend/dist sin warnings
```

---

## 📤 DESPUÉS DEL MERGE: PUSH A ORIGIN

### Opción A: Push directo a version1 (RECOMENDADO)
```bash
git push origin version1 -u
```

**Resultado**:
- ✅ GitHub actualiza version1
- ✅ Railway ve el cambio y auto-redeploy (si está configurado)
- ✅ version5 permanece sin cambios

### Opción B: Crear Pull Request primero
```bash
# En GitHub:
# 1. Ir a repo → Pull Requests
# 2. New PR: version5 → version1
# 3. Review cambios
# 4. Merge
```

---

## ⚠️ SI ALGO SALE MAL

### Conflicto de merge
```bash
# Git te dirá qué archivos tienen conflicto
# Editar manualmente y resolver

git status
# Muestra archivos en conflicto

# Luego:
git add <archivo-resuelto>
git commit -m "resolve: merge conflicts"
```

### Revertir todo el merge
```bash
git merge --abort
# O si ya hiciste commit:
git reset --hard version1-backup
```

### El build falla post-merge
```bash
cd frontend
npm install  # Por si acaso
npm run build 2>&1 | tail -50  # Ver últimos 50 líneas de error
```

---

## 🎯 DECISIÓN FINAL

### Recomendación: ✅ **MERGEAR AHORA**

**Razones**:
1. ✅ Cassiel hizo buen trabajo (respetó tus cambios)
2. ✅ Añadió features críticas (términos, stock bajo)
3. ✅ Mejoró UX (direcciones guardadas)
4. ✅ Cero riesgo de conflictos
5. ✅ BUILD está pasando en version5

**Timeline**:
- Merge: 2 min
- Testing: 15 min
- Push: 1 min
- Railway redeploy: 5 min

**Total**: ~20 minutos

---

## 📋 CHECKLIST FINAL

- [ ] Estoy en branch `version1` local
- [ ] Leí todo el plan
- [ ] He verificado que version5 está sin errores
- [ ] Creé backup `version1-backup`
- [ ] Estoy listo para hacer `git merge version5`
- [ ] Tengo a mano el checklist de testing

**¿Quieres que proceda con el merge? (sí/no)**

