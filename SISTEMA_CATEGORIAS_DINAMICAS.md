# 📂 Sistema de Categorías Dinámicas - Documentación Completa

## 📋 Resumen Ejecutivo

El sistema de categorías pasará de estar **hardcodeado** como `Literal["electrodomesticos", "muebleria", "colchoneria"]` a ser **dinámico y almacenado en base de datos**, permitiendo que administradores creen, editen y eliminen categorías desde el panel de administración.

---

## 🏗️ Arquitectura de Base de Datos

### Tabla: `categorias` (Nueva)

```sql
CREATE TABLE IF NOT EXISTS public.categorias (
    id_categoria UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,          -- "Electrodomésticos", "Mueblería", etc.
    descripcion TEXT,                             -- Descripción para admin
    slug VARCHAR(100) NOT NULL UNIQUE,            -- "electrodomesticos", "muebleria", etc.
    color VARCHAR(7),                             -- Color hex para UI: "#3B82F6"
    icono VARCHAR(50),                            -- Nombre de icono: "zap", "home", "moon"
    orden INTEGER NOT NULL DEFAULT 0,             -- Para ordenar en frontend
    activo BOOLEAN NOT NULL DEFAULT TRUE,         -- Soft delete: categoría inactiva
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Índices de Performance:**
- `idx_categorias_nombre` → Búsqueda por nombre
- `idx_categorias_slug` → Búsqueda por slug (parte de URL)
- `idx_categorias_activo` → Filtrar categorías inactivas
- `idx_categorias_orden` → Ordenamiento en UI

### Tabla: `productos` (Modificada)

**Nueva columna:**
```sql
ALTER TABLE public.productos
ADD COLUMN IF NOT EXISTS id_categoria UUID REFERENCES public.categorias(id_categoria) ON DELETE SET NULL;
```

**Cambios:**
- Ahora `productos.id_categoria` (FK) en lugar de `productos.categoria` (string)
- La columna `categoria` (string antiguo) se mantiene por compatibilidad temporal
- Se agregaron índices de performance

**Índices Nuevos:**
- `idx_productos_id_categoria` → Búsquedas por categoría
- `idx_productos_categoria_destacado` → Productos destacados por categoría
- `idx_productos_categoria_stock` → Productos disponibles por categoría

### Relación de Datos

```
┌─────────────────┐         1         ┌──────────────────┐
│  categorias     │◄────────────┤     │    productos     │
└─────────────────┘       N           └──────────────────┘

- Un producto pertenece a UNA categoría (id_categoria FK)
- Una categoría puede tener MÚLTIPLES productos
- Si se elimina una categoría, los productos quedan con id_categoria = NULL
```

---

## 🔄 Migración de Datos Existentes

La migración SQL (`011_create_categorias_table.sql`) hace lo siguiente **automáticamente**:

### Paso 1: Insertar Categorías Predeterminadas

```sql
INSERT INTO public.categorias (nombre, descripcion, slug, color, icono, orden, activo)
VALUES 
    ('Electrodomésticos', 'Electrodomésticos y equipos para el hogar', 'electrodomesticos', '#3B82F6', 'zap', 1, TRUE),
    ('Mueblería', 'Muebles para todos los ambientes de tu hogar', 'muebleria', '#8B5CF6', 'home', 2, TRUE),
    ('Colchonería', 'Colchones, sommiers y accesorios de descanso', 'colchoneria', '#EC4899', 'moon', 3, TRUE)
ON CONFLICT (nombre) DO NOTHING;
```

**Resultado esperado:**
```
┌─────────────────────────────────────────────────────────────┐
│ id_categoria          │ nombre          │ slug              │
├─────────────────────────────────────────────────────────────┤
│ (UUID1)               │ Electrodomésticos│ electrodomesticos │
│ (UUID2)               │ Mueblería       │ muebleria         │
│ (UUID3)               │ Colchonería     │ colchoneria       │
└─────────────────────────────────────────────────────────────┘
```

### Paso 2: Relacionar Productos Existentes

```sql
UPDATE public.productos p
SET id_categoria = (
    SELECT id_categoria FROM public.categorias c
    WHERE c.slug = p.categoria
)
WHERE p.id_categoria IS NULL AND p.categoria IN ('electrodomesticos', 'muebleria', 'colchoneria');
```

**Resultado:** Todos los productos existentes ahora tienen `id_categoria` apuntando a la categoría correcta.

---

## 🔧 Cambios Requeridos en Backend

### 1. Actualizar Modelos Pydantic (`backend/app/models/schemas.py`)

**Cambio:** Reemplazar `CategoryLiteral` por `id_categoria: UUID`

**Antes:**
```python
CategoryLiteral = Literal["electrodomesticos", "muebleria", "colchoneria"]

class ProductResponse(BaseModel):
    category: CategoryLiteral

class CreateProductRequest(BaseModel):
    category: CategoryLiteral
```

**Después:**
```python
class ProductResponse(BaseModel):
    id: UUID
    # ... otros campos
    categoryId: UUID  # En camelCase para frontend
    categoryName: str  # Nombre legible

class CreateProductRequest(BaseModel):
    # ... otros campos
    category_id: UUID = Field(description="ID de la categoría del producto")

class CategoryResponse(BaseModel):
    """Respuesta de una categoría."""
    id: UUID
    name: str
    slug: str
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    order: int = 0
    active: bool = True
    createdAt: str
    updatedAt: str

class CreateCategoryRequest(BaseModel):
    """Solicitud para crear una nueva categoría."""
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(default=None, max_length=7)  # "#FF5733"
    icon: Optional[str] = Field(default=None, max_length=50)
    order: int = Field(default=0, ge=0)

    @field_validator("name", mode="before")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        return sanitize_string(v, max_len=100).strip()

class UpdateCategoryRequest(BaseModel):
    """Solicitud para actualizar una categoría."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(default=None, max_length=7)
    icon: Optional[str] = Field(default=None, max_length=50)
    order: Optional[int] = Field(default=None, ge=0)
    active: Optional[bool] = None
```

### 2. Crear Nuevas Funciones en BD (`backend/app/database/operations.py`)

```python
# Crear categoría
async def create_category(client, category_data: dict) -> dict:
    """Crea una nueva categoría en Supabase."""
    slug = category_data["name"].lower().replace(" ", "-")
    
    response = client.table("categorias").insert({
        "nombre": category_data["name"],
        "descripcion": category_data.get("description"),
        "slug": slug,
        "color": category_data.get("color"),
        "icono": category_data.get("icon"),
        "orden": category_data.get("order", 0),
    }).execute()
    return response.data[0] if response.data else None

# Listar categorías activas
async def list_active_categories(client) -> List[dict]:
    """Devuelve todas las categorías activas ordenadas por orden."""
    response = client.table("categorias")\
        .select("*")\
        .eq("activo", True)\
        .order("orden")\
        .execute()
    return response.data or []

# Obtener categoría por ID
async def get_category(client, category_id: UUID) -> dict:
    """Devuelve una categoría específica."""
    response = client.table("categorias")\
        .select("*")\
        .eq("id_categoria", str(category_id))\
        .single()\
        .execute()
    return response.data

# Actualizar categoría
async def update_category(client, category_id: UUID, updates: dict) -> dict:
    """Actualiza una categoría."""
    response = client.table("categorias")\
        .update(updates)\
        .eq("id_categoria", str(category_id))\
        .execute()
    return response.data[0] if response.data else None

# Eliminar categoría (soft delete)
async def delete_category(client, category_id: UUID) -> bool:
    """Desactiva una categoría (soft delete)."""
    response = client.table("categorias")\
        .update({"activo": False})\
        .eq("id_categoria", str(category_id))\
        .execute()
    return bool(response.data)

# Actualizar producto con nueva categoría
async def update_product_category(client, product_id: UUID, category_id: UUID) -> dict:
    """Asigna una categoría a un producto."""
    response = client.table("productos")\
        .update({"id_categoria": str(category_id)})\
        .eq("id_producto", str(product_id))\
        .execute()
    return response.data[0] if response.data else None
```

### 3. Crear Endpoints para CRUD de Categorías (`backend/app/routes/categories.py`)

```python
# GET /api/categories - Listar todas las categorías activas
# POST /api/categories - Crear nueva categoría (admin)
# GET /api/categories/{id} - Obtener categoría específica
# PATCH /api/categories/{id} - Actualizar categoría (admin)
# DELETE /api/categories/{id} - Eliminar/desactivar categoría (admin)
```

### 4. Actualizar Endpoints de Productos

**GET /api/products - Retornar categoryId en lugar de category string**

Antes:
```json
{
  "id": "uuid",
  "name": "Lavarropas",
  "category": "electrodomesticos"
}
```

Después:
```json
{
  "id": "uuid",
  "name": "Lavarropas",
  "categoryId": "uuid-categoria",
  "categoryName": "Electrodomésticos"
}
```

---

## 🎯 Validación de Migración en Supabase

Después de ejecutar `011_create_categorias_table.sql`, verificar:

```sql
-- 1. Verificar que la tabla categorias existe y tiene datos
SELECT COUNT(*) as total_categorias FROM public.categorias;
-- Resultado esperado: 3 (las tres categorías predeterminadas)

-- 2. Verificar que productos tienen id_categoria
SELECT 
    p.nombre,
    p.categoria as categoria_antigua,
    c.nombre as categoria_nueva,
    p.id_categoria
FROM public.productos p
LEFT JOIN public.categorias c ON p.id_categoria = c.id_categoria
LIMIT 5;

-- 3. Verificar índices
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename IN ('categorias', 'productos')
ORDER BY tablename, indexname;
```

---

## 📱 Cambios Requeridos en Frontend

### 1. Actualizar Interfaz de Categorías

**Antes:** Dropdown/select con options hardcodeadas
```typescript
const categories = ["electrodomesticos", "muebleria", "colchoneria"];
```

**Después:** Fetch de categorías desde API
```typescript
const [categories, setCategories] = useState<Category[]>([]);

useEffect(() => {
  fetchCategories();
}, []);

const fetchCategories = async () => {
  const response = await fetch('/api/categories');
  const data = await response.json();
  setCategories(data);
};
```

### 2. Panel de Administración - CRUD de Categorías

Nueva sección en admin panel:
- **Crear categoría**: Form con nombre, descripción, color, icono, orden
- **Listar categorías**: Tabla editable con opciones de editar/eliminar
- **Editar categoría**: Modal para actualizar datos
- **Eliminar categoría**: Soft delete (desactivar)

### 3. Asignación de Categorías a Productos

Al crear/editar producto:
- Cambiar selector de categoría de string a UUID
- Enviar `category_id` en lugar de `category`

---

## ✅ Checklist de Implementación

### Phase 1: Base de Datos ✅
- [x] Crear migration `011_create_categorias_table.sql`
- [ ] Ejecutar migration en Supabase
- [ ] Verificar datos con queries de validación

### Phase 2: Backend
- [ ] Actualizar modelos Pydantic en `schemas.py`
- [ ] Crear funciones de BD en `operations.py`
- [ ] Crear endpoints en `routes/categories.py`
- [ ] Actualizar endpoints de productos
- [ ] Agregar validaciones (nombre único, slug válido)

### Phase 3: Frontend
- [ ] Crear hook `useCategories()` para fetchear categorías
- [ ] Actualizar selector de categorías en forms
- [ ] Crear panel CRUD de categorías en admin
- [ ] Actualizar listado de productos para mostrar `categoryName`

### Phase 4: Testing & Despliegue
- [ ] Test de migración en Supabase
- [ ] Test de endpoints CRUD
- [ ] Test de asignación de categorías a productos
- [ ] Deployment a Railway

---

## 🚀 Próximos Pasos Después de la Implementación

### Paso 1: Limpiar Código Legacy
Una vez que todos los productos tienen `id_categoria`:
```sql
ALTER TABLE public.productos DROP COLUMN categoria;
-- O renombrar id_categoria a categoria para mantener compatibilidad
```

### Paso 2: Agregar Validaciones Avanzadas
- Validar que no se eliminen categorías con productos activos
- Validar slug único (auto-generado o manual)
- Validar color hexadecimal válido

### Paso 3: Auditoría (Opcional)
- Registrar quién crea/modifica/elimina categorías
- Historial de cambios

---

## 📊 Ejemplos de Queries Útiles

### Obtener productos de una categoría
```sql
SELECT p.* FROM public.productos p
JOIN public.categorias c ON p.id_categoria = c.id_categoria
WHERE c.slug = 'electrodomesticos'
AND p.stock > 0
ORDER BY p.destacado DESC, p.nombre ASC;
```

### Contar productos por categoría
```sql
SELECT c.nombre, COUNT(p.id_producto) as total
FROM public.categorias c
LEFT JOIN public.productos p ON c.id_categoria = p.id_categoria
WHERE c.activo = TRUE
GROUP BY c.id_categoria, c.nombre
ORDER BY c.orden;
```

### Encontrar categorías sin productos
```sql
SELECT c.* FROM public.categorias c
LEFT JOIN public.productos p ON c.id_categoria = p.id_categoria
WHERE p.id_producto IS NULL
AND c.activo = TRUE;
```

---

## 🔐 Consideraciones de Seguridad

1. **Row Level Security (RLS):** Las categorías son públicas (lectura), pero creación/edición/eliminación solo para admin
2. **Validación:** Sanitizar nombre, descripción y slug en backend
3. **Soft Delete:** No eliminar directamente, marcar como `activo = FALSE`
4. **Concurrencia:** Usar ON CONFLICT para evitar duplicados de slug

---

## 📝 Notas Importantes

- Esta migración es **reversible** si es necesario
- La columna `categoria` (string antiguo) se mantiene temporalmente para compatibilidad
- Los trigger automáticos actualizan `fecha_actualizacion` en cada cambio
- Los índices mejoran performance de búsquedas y filtros

**Estado:** ✅ Migration SQL lista para Supabase
**Siguiente:** Esperar aprobación del usuario antes de implementar backend/frontend

