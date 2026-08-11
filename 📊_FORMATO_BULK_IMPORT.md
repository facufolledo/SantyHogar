# 📊 Formato de Importación Masiva de Productos

## ¿Qué es el Bulk Import?

Es la funcionalidad para importar múltiples productos desde un archivo Excel (.xlsx) en lugar de crearlos uno por uno.

---

## 📋 Formato del Archivo Excel (.xlsx)

### Requisitos Generales
- **Formato**: `.xlsx` (Excel 2007 o superior)
- **Primera fila**: Encabezados (nombres de columnas)
- **Filas siguientes**: Datos de productos

### Columnas Detectadas (detección automática por nombre)

El sistema detecta automáticamente qué columna es cuál según el nombre. Puede usar cualquiera de estos nombres:

| Campo | Nombres Aceptados | Obligatorio | Ejemplo |
|-------|-------------------|------------|---------|
| **Nombre** | nombre, name, producto, product, articulo | ✅ Sí | "Heladera Drean RDA250" |
| **Categoría** | categoría, categoria, category, cat | ✅ Sí | "electrodomesticos" |
| **Subcategoría** | subcategoría, subcategoria, sub_categoria, sub | ❌ Opcional | "Frío" |
| **Precio** | precio, price, valor, monto, precio_venta | ✅ Sí | "25999.99" o "25.999,99" |
| **Stock** | stock, cantidad, qty, quantity, existencia, unidades | ✅ Sí | "15" o "15.00" |
| **Marca** | marca, brand, fabricante, manufacturer | ❌ Opcional | "Drean" |
| **Descripción** | descripción, descripcion, description, detalle, desc | ❌ Opcional | "Frío seco de 250L" |
| **Especificaciones** | especificaciones, specs, características, propiedades | ❌ Opcional | "Capacidad: 250L, Tipo: Frío Seco" |

### Categorías Válidas (slugs)

Solo se aceptan estas categorías (en minúsculas):
- `electrodomesticos` (o variaciones: electrodomésticos, electro)
- `muebleria` (o: mueblería, muebles)
- `colchoneria` (o: colchonería, colchones)
- `smart-32` (o: smart, tv, televisor, google tv, android tv)
- `cocinas` (o: cocina, estufa)

### Ejemplo Completo

```excel
nombre                          categoría          subcategoría    precio    stock    marca       descripción                 especificaciones
Heladera Drean RDA250           electrodomesticos  Frío Seco       25999.99  5        Drean       Frío seco 250L              Capacidad: 250L, Tipo: Frío Seco, Puertas: 2
Freezer Horizontal Inelro FIH   electrodomesticos  Congelador      18500.00  3        Inelro      Freezer horizontal 270L    Capacidad: 270L, Tipo: Congelador
Cama Sommier 2 Plazas           colchoneria        Sommier         12999.50  10       Patrick     Sommier de 2 plazas         Tamaño: 140x190cm, Altura: 30cm
Smart 55 Noblex LK55X7000       smart-32           Smartv 55"      45000.00  2        Noblex      Smart TV 55 pulgadas 4K     Resolución: 4K, Conexión: Wifi, HDMI: 3
```

---

## 📸 Imágenes

### Formato Aceptado
- **Formatos de imagen**: JPG, JPEG, PNG
- **Tamaño máximo**: 5 MB por imagen
- **Cantidad**: 1 imagen por producto en la importación masiva

### Cómo Cargar Imágenes

**En el flujo de Bulk Import:**

1. Selecciona tu archivo Excel
2. Haz clic en "Importar" → Se abre el preview
3. En cada fila, verás un ícono de imagen (📷)
4. Arrastra una imagen directamente sobre ese ícono
5. La imagen se subirá automáticamente a Supabase Storage
6. Se guardará la URL en el campo `imagen` de esa fila

**O en tu Excel:**

Puedes incluir una columna con URLs de imágenes:

```excel
nombre                  categoria           url_imagen
Heladera Drean          electrodomesticos   https://mi-servidor.com/heladera.jpg
Freezer Inelro          electrodomesticos   https://mi-servidor.com/freezer.png
```

---

## 🔢 Formatos de Datos

### Precio
- Acepta: `25999.99` o `25.999,99` o `25999` o `$25999.99`
- El sistema detecta automáticamente el separador decimal
- Rango: 0 a 1,000,000

### Stock
- Acepta: `15` o `15.00` o `15,00`
- Se convierte a número entero
- Rango: 0 a 100,000

### Especificaciones
- Formato: `"Nombre: Valor, Nombre2: Valor2"`
- Separadas por comas
- Cada par clave-valor separado por `:` (dos puntos)
- Ejemplo: `"Capacidad: 250L, Tipo: Frío Seco, Puertas: 2"`

---

## ✅ Flujo de Importación

### Paso 1: Upload
1. Abre "Importación Masiva" en Admin
2. Arrastra tu archivo `.xlsx` o haz clic para seleccionar
3. El sistema lo procesa automáticamente

### Paso 2: Preview
1. Se muestra un resumen:
   - Total de filas
   - Filas válidas ✓
   - Filas con errores ✗
   - Filas seleccionadas para importar

2. Revisar cada fila:
   - ✓ Verdes = válidas, pueden seleccionarse
   - ✗ Rojas = con errores, no se pueden importar
   - Coloca el ratón sobre los errores para ver el problema

3. (Opcional) Cargar imágenes:
   - Arrastra imágenes a las filas en el campo "Imagen"
   - Las imágenes se suben automáticamente

### Paso 3: Confirmar
1. Selecciona las filas que quieres importar (checkboxes)
2. Haz clic en "Confirmar importación (X)"
3. El sistema inserta los productos en la base de datos

### Paso 4: Resultado
- Se muestra el resumen de importación
- Cantidad de productos agregados
- Cualquier error ocurrido

---

## 🚨 Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "El archivo no es .xlsx" | Archivo en formato antiguo (.xls) | Abre en Excel y guarda como `.xlsx` |
| "Categoría no encontrada" | Nombre de categoría incorrecto | Usa uno de los slugs válidos (ver tabla arriba) |
| "El precio no puede ser negativo" | Precio con signo negativo | Verifica que no haya "-" en el precio |
| "Stock inválido" | Stock no es número | Asegúrate que sea un número entero o decimal |
| "El campo 'nombre' es obligatorio" | Fila sin nombre de producto | Toda fila debe tener al menos un nombre |

---

## 💡 Tips Útiles

### 1. Extracción Automática de Marca
Si no incluyes una columna "marca", el sistema intenta extraerla del nombre del producto.
- "Heladera **Drean** RDA250" → Marca: "Drean"
- "Freezer **Inelro** FIH-270" → Marca: "Inelro"

### 2. Generación Automática de Slug
El slug (URL) se genera automáticamente del nombre:
- "Heladera Drean RDA250" → Slug: "heladera-drean-rda250"

### 3. Subcategoría por Defecto
Si no especificas subcategoría, usa "General"

### 4. Detección Flexible de Headers
El sistema detecta automáticamente los headers aunque estén mal escritos:
- "Nombre del producto" ✓
- "NOMBRE" ✓
- "nombre" ✓
- "producto" ✓

### 5. Precios con $0
Si importas productos con precio $0, debes actualizar los precios después en "Gestión de Precios"

---

## 📥 Descarga Plantilla

Archivo Excel de ejemplo (plantilla vacía) disponible al abrir Bulk Import:

**[Botón: Descargar Plantilla]** (si está implementado)

O crea manualmente con estas columnas:
```
nombre | categoría | subcategoría | precio | stock | marca | descripción | especificaciones
```

---

## 🔗 Relación con Otras Funcionalidades

- **Gestión de Precios**: Actualizar precios después de importar
- **Panel de Productos**: Ver productos importados
- **Categorías**: Crear/editar categorías antes de importar
- **Imágenes**: Subir imágenes individuales si es necesario

---

**Última actualización**: Julio 2026
**Backend**: `POST /products/bulk-import/preview` y `POST /products/bulk-import/confirm`
**Frontend**: `frontend/src/pages/admin/BulkImport.tsx`
