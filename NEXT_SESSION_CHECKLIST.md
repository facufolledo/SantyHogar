# NEXT SESSION CHECKLIST - BACKEND VARIANT SUPPORT

**Priority**: 🔴 HIGH - Blocks all size-related features  
**Estimated Duration**: 2-4 hours

---

## PREREQUISITE: Review Current State

### What's Already Done ✅
- [x] Frontend UI for size selection complete
- [x] SizeSelector component built
- [x] Cart handles multiple sizes per product
- [x] ProductVariant interface defined
- [x] All TypeScript types in place
- [x] Build verified successful

### What's Needed 🚧
- [ ] Backend variant data structure
- [ ] Supabase schema updates
- [ ] API endpoint updates
- [ ] Bulk import size parsing

---

## TASK 1: Update Supabase Schema

### Changes Required
- [ ] Add `variants` JSONB column to `productos` table
- [ ] Column type: `jsonb` or `json`
- [ ] Default value: `[]` or `null`
- [ ] Migration: Update existing products (can be empty arrays initially)

### Schema Example
```sql
ALTER TABLE productos ADD COLUMN variants JSONB DEFAULT '[]'::jsonb;

-- Alternatively with JSON type:
ALTER TABLE productos ADD COLUMN variants JSON DEFAULT '[]'::json;
```

### Variant Data Structure
```json
{
  "variants": [
    {
      "size": "S",
      "stock": 10,
      "sku": "PROD001-S"
    },
    {
      "size": "M",
      "stock": 15,
      "sku": "PROD001-M"
    },
    {
      "size": "L",
      "stock": 8,
      "sku": "PROD001-L"
    }
  ]
}
```

---

## TASK 2: Update Backend API Response

### File: `backend/app/models/product.py`

Current:
```python
class ProductResponse(BaseModel):
    id: str
    name: str
    # ... other fields
    stock: int
```

Update to include:
```python
class ProductVariant(BaseModel):
    size: str
    stock: int
    sku: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    # ... other fields
    stock: int
    variants: Optional[List[ProductVariant]] = None
```

---

## TASK 3: Update Products API Endpoint

### File: `backend/app/routes/products.py`

**Current Endpoint**: `GET /api/productos`

**Updates Needed**:
1. Read `variants` column from Supabase
2. Parse as Pydantic model
3. Include in response JSON

**Example Code Pattern**:
```python
@router.get("/productos")
async def get_products():
    # Query includes variants column
    response = supabase.table("productos").select("*, variants").execute()
    
    # Variants will be automatically parsed by Supabase client
    products = [ProductResponse(**product) for product in response.data]
    return {"products": products}
```

---

## TASK 4: Update Bulk Import Script

### File: `backend/app/services/bulk_import_service.py`

**Current Excel Import**:
- Parses: Nombre, Categoria, Precio, Stock, etc.

**Changes Needed**:
1. [ ] Add size column parsing (e.g., "Talla" column)
2. [ ] Handle comma-separated sizes (e.g., "S,M,L")
3. [ ] Parse sizes with stock allocation (e.g., "S:10,M:15,L:8")
4. [ ] Create ProductVariant objects for each size
5. [ ] Insert as JSON array in `variants` column

**Example Parsing Pattern**:
```python
# Input from Excel: "S:10,M:15,L:8"
sizes_str = row.get('Tallas')  # or parse from another column
variants = []

if sizes_str:
    for size_data in sizes_str.split(','):
        if ':' in size_data:
            size, stock = size_data.split(':')
            variants.append({
                'size': size.strip(),
                'stock': int(stock.strip()),
                'sku': f"{product_id}-{size.strip()}"
            })

product_data['variants'] = variants
```

---

## TASK 5: Test with Sample Data

### Manual Testing Steps:

1. **Create Test Product** (in Supabase):
```sql
INSERT INTO productos (nombre, categoria, precio, stock, variants)
VALUES (
  'Test Product',
  'uuid-here',
  1000.00,
  30,
  '[
    {"size": "S", "stock": 10},
    {"size": "M", "stock": 12},
    {"size": "L", "stock": 8}
  ]'
);
```

2. **Test API Endpoint**:
```bash
curl http://localhost:8000/api/productos
# Should return variants array in response
```

3. **Test Frontend**:
- Go to product detail page
- Should see size selector with S, M, L buttons
- Each should show correct stock
- Select a size and add to cart
- Verify cart shows size information

---

## TASK 6: Update Bulk Import Excel Template

### Recommended Column Names:
- `Nombre` - Product name
- `Categoría` - Category slug
- `Precio` - Price
- `Stock_Total` - Total stock (for backward compat)
- `Tallas` - **NEW**: Sizes (format: "S:10,M:15,L:8")
- Other existing columns...

### Example Excel Row:
```
Nombre | Categoría | Precio | Stock_Total | Tallas | ...
Remera | muebleria | 500 | 30 | S:10,M:12,L:8 | ...
```

---

## VALIDATION CHECKLIST

Before marking complete:

- [ ] Supabase schema updated (variants column exists)
- [ ] Backend ProductResponse includes variants
- [ ] API endpoint returns variants in JSON
- [ ] Bulk import script parses sizes correctly
- [ ] Frontend receives variants data
- [ ] SizeSelector component displays sizes
- [ ] Cart handles sizes properly
- [ ] Can add same product with different sizes
- [ ] Order system captures selected size
- [ ] Build passes TypeScript checks

---

## QUICK REFERENCE: Frontend Expectations

### ProductResponse JSON Format
```json
{
  "id": "uuid",
  "name": "Product Name",
  "categoryId": "uuid",
  "category": "slug",
  "price": 1000,
  "variants": [
    {"size": "S", "stock": 10},
    {"size": "M", "stock": 15},
    {"size": "L", "stock": 8}
  ],
  "images": [...],
  "stock": 33,
  "rating": 4.5,
  ...
}
```

### Frontend Usage
```typescript
// In ProductDetail component
const { variants } = product;  // Optional property

<SizeSelector 
  variants={variants}
  selectedSize={selectedSize}
  onSizeChange={setSelectedSize}
/>

// Adding to cart with size
addItem(product, selectedSize);  // "S", "M", "L", etc.
```

---

## BLOCKERS & DEPENDENCIES

### Nothing blocks this task ✅
- Frontend is ready
- Supabase is accessible
- Backend is running
- No external dependencies needed

---

## ROLLBACK PLAN (If Needed)

If variants feature causes issues:

1. **Frontend Rollback**:
   - Revert commit `0d1714e`
   - Products will work without variants (null check in SizeSelector)

2. **Backend Rollback**:
   - Remove `variants` column from migration
   - Remove from ProductResponse model
   - Revert bulk import changes

3. **Data Rollback**:
   - Drop variants column: `ALTER TABLE productos DROP COLUMN variants;`

---

## SUCCESS CRITERIA

Feature is complete when:

✅ User can see size options on product detail page  
✅ User can select a size and add product to cart  
✅ Cart displays "Size: S" (or selected size)  
✅ Same product with different sizes are separate line items  
✅ Order system captures the selected size  
✅ Bulk import can parse sizes from Excel  
✅ No console errors or TypeScript issues  

---

## ESTIMATED TIMELINE

- Backend schema + API: 1-2 hours
- Bulk import updates: 0.5-1 hour
- Testing + validation: 0.5-1 hour
- **Total: 2-4 hours**

---

## NOTES

- Start with step 1-2 (schema + API)
- Test with manual Supabase query first
- Then proceed with bulk import
- Frontend will automatically work once API returns variants

**No frontend changes needed in next session** - just backend data integration.

