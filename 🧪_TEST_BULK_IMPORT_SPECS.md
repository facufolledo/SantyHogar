# Testing Bulk Import with Specifications

## What Was Fixed

Specifications weren't showing in the bulk import preview. All three issues are now fixed:

1. ✅ **Backend parsing** - Already working
2. ✅ **Frontend API types** - Added `especificaciones` field
3. ✅ **Backend import logic** - Now includes specs when saving

## How to Test

### Step 1: Prepare Your Excel File

Make sure your Excel has:
- Column header: `especificaciones` (or any alias: `specs`, `características`, `propiedades`)
- Format: `"Pulgadas: 32, Resolución: 1366x768, Tipo: Smart TV"` (comma-separated key: value pairs)

Example:
```
nombre          | categoria    | precio | stock | especificaciones
Smart TV 32"    | Smart 32     | 250    | 10    | Pulgadas: 32", Resolución: 1366x768, Tipo: Smart TV
```

### Step 2: Upload in Bulk Import

1. Go to Admin > Importación masiva de productos
2. Drag & drop your Excel file
3. System should show preview with 5 columns:
   - NOMBRE
   - CATEGORÍA
   - PRECIO
   - STOCK
   - **ESPECIFICACIONES** ← Should show spec count (e.g., "4 specs")

### Step 3: What to Expect

**In Preview:**
- Each row should show the number of specs in a badge
- Example: "4 specs" = parsed 4 key-value pairs
- If empty "—" = no specs in that row (OK if intentional)

**After Import:**
- Check the product in admin
- Open "⚙️ Especificaciones" tab
- Should see all specs populated

### Step 4: Debug Output (If Needed)

If specs still not showing, check the browser console or backend logs for:

```
COLUMN DETECTION DEBUG:
  Raw headers: ['nombre', 'categoria', ... 'especificaciones']
  Normalized: ['nombre', 'categoria', ..., 'especificaciones']
  ✓ ESPECIFICACIONES DETECTADA en columna 6
```

If you see:
```
✗ ESPECIFICACIONES NO DETECTADA
```

Then the column name doesn't match. Check spelling and use one of these:
- `especificaciones`
- `specs`
- `características`
- `caracteristicas` (without accent)
- `propiedades`

## Supported Format

### Correct Format ✅
```
"Pulgadas: 32, Resolución: 1366x768, Tipo: Smart TV"
"Capacidad: 300L, Color: Blanco"
"Potencia: 800W"
```

### Will Parse To:
```
{
  "Pulgadas": "32",
  "Resolución": "1366x768",
  "Tipo": "Smart TV"
}
```

### NOT Supported ❌
```
"Pulgadas | 32"          ← Use comma, not pipe
"Pulgadas:32"            ← Needs space after colon (auto-trimmed but cleaner with space)
"32 pulgadas"            ← Needs "Key: Value" format
```

## Implementation Details

### Column Aliases Recognized
```python
COLUMN_ALIASES: {
    "especificaciones": [
        "especificaciones", 
        "specs", 
        "caracteristicas", 
        "características", 
        "propiedades"
    ]
}
```

### Parsing Logic
```
Input: "Pulgadas: 32, Resolución: 1366x768, Tipo: Smart TV"
        ↓
Split by comma: ["Pulgadas: 32", "Resolución: 1366x768", "Tipo: Smart TV"]
        ↓
For each pair, split by first colon and trim
        ↓
Output: {"Pulgadas": "32", "Resolución": "1366x768", "Tipo": "Smart TV"}
```

### Category Auto-Mapping
Categories in Excel are auto-mapped to valid DB categories:
- "Smart 32", "Smart TV", "Google TV" → `electrodomesticos` / `Televisores`
- "Heladera", "Freezer" → `electrodomesticos` / `Heladeras`
- "Colchón" → `colchoneria` / `Colchones`
- Anything else → `electrodomesticos` / `General`

## Your Test File

The file you provided (televisores-modificado.xlsx) has:
- 5 products ✓
- All have "especificaciones" column ✓
- Format is correct ✓
- Categories are recognized ✓

**Expected Result:**
All 5 products should import with specifications showing in preview.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "ESPECIFICACIONES" column shows "—" | Specs column not detected - check spelling |
| Row shows errors | Missing required field (nombre, categoria, etc.) |
| Specs imported but not showing in product | Check product edit modal "⚙️ Especificaciones" tab |
| Backend error | Check logs for column mapping debug output |

## Next Steps

1. **Before testing:** Make sure backend is running
2. **Test with your file:** Upload televisores-modificado.xlsx
3. **Verify in preview:** Should see "4 specs" or similar for each row
4. **Confirm import:** Select all and click "Confirmar importación"
5. **Check product:** Edit any product and verify specs in details tab

---

**Important:** If specs still don't appear, ask to check the logs and share what you see in the "COLUMN DETECTION DEBUG" section.
