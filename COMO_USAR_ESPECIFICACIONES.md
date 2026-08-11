# 📖 Cómo Usar las Especificaciones en la Carga de Productos

## 🚀 Acceso

1. Ir a **Dashboard Admin** → **Productos**
2. Click en **"+ Nuevo Producto"** o **"Editar"** en un producto existente
3. Se abrirá el formulario con 6 tabs

---

## 📱 Pasos para Agregar Especificaciones

### Paso 1: Llenar Información General
En el tab **"📋 General"**:
- Nombre: Lavarropas Automático 8kg
- Descripción: (opcional)
- Categoría: Electrodomésticos
- Marca: Samsung

### Paso 2: Configurar Precios y Stock
En tabs **"💰 Precios"** y **"📦 Stock"**:
- Precio: $45.000
- Stock: 10 unidades

### Paso 3: **NUEVO** - Agregar Especificaciones
En el tab **"⚙️ Especificaciones"**:

#### Campo 1: Nombre de Especificación
```
Capacidad
```

#### Campo 2: Valor de Especificación
```
8kg
```

**Click en "Agregar especificación"** (o presionar Enter)

---

## ✨ Interfaz del Tab Especificaciones

```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ Especificaciones                                         │
└─────────────────────────────────────────────────────────────┘

[Nombre de especificación ]
  Capacidad

[Valor de especificación ]
  8kg

         [+ Agregar especificación]

Especificaciones agregadas:
┌─────────────────────────────────────────────────────────────┐
│ Capacidad                                                [X]│
│ 8kg                                                         │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ Material                                                 [X]│
│ Acero inoxidable                                            │
└─────────────────────────────────────────────────────────────┘

💡 Ejemplos de especificaciones:
   • Lavarropas: Capacidad: 8kg, Velocidad: 1200 RPM, Color: Blanco
   • Colchón: Material: Resortes ensacados, Firmeza: Media, Medida: 140x190
   • Heladera: Capacidad: 500L, Tipo: Frost Free, Puerta: Francesa
```

---

## 🎯 Ejemplo Completo: Crear Lavarropas con Especificaciones

### Datos Generales
```
Nombre: Lavarropas Automático 8kg LG
Descripción: Lavarropas automático de última generación
Categoría: Electrodomésticos
Marca: LG
```

### Precios
```
Precio de venta: $45.000
Precio promocional: $40.000
Precio de costo: $27.000
```

### Stock
```
Stock actual: 10 unidades
```

### **Especificaciones** ← NUEVO
```
1. Capacidad → 8kg
2. Velocidad → 1200 RPM
3. Consumo → Clase A+++
4. Material → Acero inoxidable
5. Programas → 15 programas
6. Color → Blanco/Plata
```

### Imágenes
```
Agregar 3-4 imágenes del producto
```

### Envío
```
Peso: 85 kg
Dimensiones: 60x65x85 cm
```

---

## ⌨️ Atajos de Teclado

| Acción | Atajo |
|--------|-------|
| Agregar especificación | **Enter** (desde campo de valor) |
| Eliminar especificación | Hover + Click **X** |
| Cambiar tab | Click en nombre del tab |

---

## ✅ Validaciones

La interfaz valida:

1. **Campos vacíos**
   ```
   ❌ "Por favor completa nombre y valor de la especificación"
   ```

2. **Especificaciones duplicadas**
   ```
   ❌ "La especificación 'Capacidad' ya existe"
   ```

---

## 💾 Guardar el Producto

Una vez completes todos los campos necesarios:

```
[Cancelar]    [Crear producto]
```

- **Crear producto**: La API enviará todas las especificaciones a la BD
- **Guardar cambios**: Actualiza especificaciones del producto existente

---

## 🔄 Editar Especificaciones de Producto Existente

1. Click en producto → "Editar"
2. Tab "⚙️ Especificaciones"
3. Las especificaciones existentes se cargan automáticamente
4. Puedes:
   - ✅ Agregar nuevas
   - ✅ Eliminar existentes (Hover + X)
   - ✅ Guardar cambios

---

## 📊 Datos de Ejemplo por Categoría

### Electrodomésticos (Lavarropas)
```
Capacidad: 8kg
Velocidad: 1200 RPM
Programas: 15
Consumo: Clase A+++
Ruido: 72 dB
Tipo: Automático
```

### Mueblería (Cama)
```
Medida: 140x190cm
Material: Madera de pino
Color: Blanco
Capacidad: 200kg
Garantía: 2 años
```

### Colchonería (Colchón)
```
Material: Resortes ensacados
Firmeza: Media
Medida: 140x190cm
Grosor: 27cm
Zona de confort: Con memoria
Certificado: Doblefaz
```

### Cocinas (Cocina Integral)
```
Largo: 2.5m
Profundidad: 60cm
Alto: 90cm
Material: Melamina
Color: Blanco mate
Incluye: Hornallas + Horno
```

### Baños (Mueble de Baño)
```
Largo: 80cm
Profundidad: 50cm
Material: Madera
Color: Nogal
Incluye: Bacha cerámica
Espejo: Sí
```

---

## ❓ Preguntas Frecuentes

### ¿Cuántas especificaciones puedo agregar?
**Ilimitadas** - puedes agregar tantas como necesites

### ¿Se guardan en la BD?
**Sí** - se almacenan en formato JSON (JSONB) en la columna `especificaciones`

### ¿Aparecen en la tienda pública?
**Pronto** - próxima tarea: mostrar especificaciones en página de producto

### ¿Puedo importar especificaciones en bulk?
**Por ahora no** - se agregan una a una en el formulario

### ¿Se pueden editar después?
**Sí** - editando el producto y modificando el tab de Especificaciones

---

## 🎓 Tips Profesionales

### ✨ Mejor Organización
- Usa nombres consistentes: "Capacidad" en todos los lavarropas
- Usa valores estándar: "8kg", "10kg", "12kg" (no "ocho kilos")

### 🔍 Para SEO
- Las especificaciones se indexan en la BD
- Usa palabras clave: "Capacidad: 8kg", "Velocidad: 1200 RPM"

### 📱 Para Clientes
- Agrega especificaciones importantes: capacidad, medidas, material
- Usa información que el cliente buscaría

### 💡 Consistencia
- Definir especificaciones estándar por categoría
- Ej: Lavarropas siempre incluya Capacidad, RPM, Consumo

---

## 🚨 Problemas Comunes

### "El especificación no se guarda"
→ Verifica que el nombre y valor no estén vacíos
→ Revisa que no haya especificaciones duplicadas

### "No veo las especificaciones agregadas"
→ Revisa que hayas presionado Enter o click en "Agregar"
→ Comprueba en la sección "Especificaciones agregadas"

### "Quiero eliminar todas"
→ Usa el botón X en cada especificación
→ No hay botón "Limpiar todo" (eliminación individual)

---

## 📞 Soporte

Para problemas con especificaciones, verifica:
1. ✅ Campo de nombre no esté vacío
2. ✅ Campo de valor no esté vacío
3. ✅ No haya especificaciones duplicadas
4. ✅ Presionar Enter o click en "Agregar especificación"

