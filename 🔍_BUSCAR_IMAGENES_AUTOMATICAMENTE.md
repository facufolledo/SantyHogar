# 🔍 Buscar Imágenes Automáticamente

## ¿Cómo funciona?

Creamos un script Python que busca imágenes automáticamente de tus productos en Unsplash (gratuita, sin API key) y genera un Excel con las URLs. Luego subes ese Excel a la interfaz de "Cargar Imágenes".

---

## 📋 Paso 1: Instalar Requisitos

Ejecuta esto en PowerShell/Terminal:

```bash
cd backend
pip install openpyxl requests
```

---

## 🚀 Paso 2: Ejecutar el Script

```bash
cd backend
python scripts/auto_search_images.py
```

**Qué hace:**
1. Conecta con Supabase
2. Obtiene todos tus productos
3. Busca 3 imágenes por producto en Unsplash
4. Crea un archivo `product_images.xlsx`

**Resultado:**
```
[  1/50] Heladera Drean RDA250                  ✓ 3 imágenes encontradas
[  2/50] Freezer Inelro FIH-270                 ✓ 3 imágenes encontradas
[  3/50] Cama Sommier 2 Plazas                  ✓ 3 imágenes encontradas
...
```

---

## 📊 Paso 3: Subir el Excel

1. **Abre el panel:** http://localhost:5173/admin/cargar-imagenes
2. **Arrastra el archivo:** `product_images.xlsx`
3. **Revisa el preview:**
   - ✓ Verde = producto encontrado
   - ✗ Rojo = producto no encontrado
4. **Selecciona** los productos y **confirma**

---

## 📁 Formato del Excel Generado

| nombre_producto | imagen_url_1 | imagen_url_2 | imagen_url_3 | notas |
|---|---|---|---|---|
| Heladera Drean RDA250 | https://images.unsplash.com/... | https://images.unsplash.com/... | https://images.unsplash.com/... | ✓ 3 img |
| Freezer Inelro | https://images.unsplash.com/... | (vacío) | (vacío) | ⚠ Manual |

**Notas:**
- Si una búsqueda encuentra 0-1 imágenes, habrá celdas vacías
- Puedes **editar manualmente** las URLs antes de subir
- Si buscas mejor imagen, busca en [Unsplash.com](https://unsplash.com) y copia la URL

---

## 🔧 Personalizaciones

### Cambiar número de imágenes por producto

Edita `scripts/auto_search_images.py`, línea con:
```python
image_urls = search_images_unsplash(nombre, num_images=3)  # Cambiar a 5, 10, etc
```

### Usar otras fuentes (Pexels, Pixabay)

Para usar Pexels o Pixabay, necesitas una **API key gratuita**:

1. Pexels: https://www.pexels.com/api/
2. Pixabay: https://pixabay.com/api/docs/

Luego agrega a tu `.env`:
```
PEXELS_API_KEY=tu_key_aqui
PIXABAY_API_KEY=tu_key_aqui
```

---

## 📍 Troubleshooting

### Error: "No se encontraron productos"
- Verifica que Supabase esté configurado en `.env`
- Comprueba que existan productos en tu BD

### Error: "El archivo no es .xlsx"
- Verifica que sea Excel 2007 o superior (.xlsx, no .xls)
- Guarda el archivo correctamente en Excel

### Imágenes no se cargan
- Algunas URLs pueden estar expiradas
- Intenta editar manualmente el Excel
- Busca imágenes mejores en [Unsplash.com](https://unsplash.com)

---

## 🎯 Flujo Completo

```
1. Ejecutar script
   python scripts/auto_search_images.py
   ↓
2. Se genera product_images.xlsx
   ↓
3. Abrir http://localhost:5173/admin/cargar-imagenes
   ↓
4. Arrastrar product_images.xlsx
   ↓
5. Revisar preview de productos
   ↓
6. Confirmar carga
   ↓
7. ✓ Imágenes vinculadas a productos
```

---

## 💡 Tips

- **Primera vez:** El script tardará según cantidad de productos (100 productos ≈ 2 minutos)
- **Pausas automáticas:** El script pausa 1 segundo cada 5 productos para no sobrecargar APIs
- **Reutilizable:** Puedes ejecutar el script múltiples veces (genera nuevo Excel cada vez)
- **Edición manual:** Si una búsqueda falla, puedes editar el Excel y agregar URLs manualmente

---

**¿Preguntas?** Verifica que:
- Supabase esté configurado en `backend/.env`
- Backend esté corriendo en puerto 8000
- Frontend esté corriendo en puerto 5173
