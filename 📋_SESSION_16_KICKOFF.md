# 🎯 SESSION 16 KICKOFF - STORE FRONTEND BUILD

**Date:** Session 16  
**Status:** Starting fresh - all Session 15 fixes confirmed  
**Goal:** Build functional storefront with featured products, ratings, search, and cart improvements

---

## 🔧 PRE-SESSION CHECKLIST ✅

**Backend Fix Applied:**
- ✅ Fixed category field name from `'id_categoria'` to `'categoria'` (both locations in bulk_import_service.py)
- ✅ Frontend build successful
- ✅ Changes pushed to origin/version1
- ✅ Backend ready to restart

**Next Step:** Restart backend with `python run_dev.py`

---

## 🎨 DESIGN SYSTEM (Validated)

**Pattern:** Feature-Rich Showcase  
**Style:** Vibrant & Block-based (Dark theme)

### Color Palette
| Role | Hex |
|------|-----|
| Primary | #1E293B (Dark slate) |
| Secondary | #334155 (Medium slate) |
| CTA | #22C55E (Green) |
| Background | #0F172A (Navy) |
| Text | #F8FAFC (Almost white) |

### Typography
- **Headings:** Rubik (300-700)
- **Body:** Nunito Sans (300-700)
- **Mood:** Ecommerce, clean, shopping, retail
- **Source:** Google Fonts

### Key Effects
- Large sections (48px+ gaps)
- Bold hover (color shift)
- Scroll-snap support
- 200-300ms transitions
- Large type (32px+)

### Anti-patterns (AVOID ❌)
- Flat design without depth
- Text-heavy pages
- Emojis as icons (use SVG: Heroicons/Lucide)
- Missing cursor-pointer on interactive elements
- Missing hover states

---

## 📋 SESSION 16 AGENDA (Priority Order)

### 1️⃣ HOME PAGE FEATURED PRODUCT SLIDER

**Status:** ⚡ NOT STARTED  
**File:** `frontend/src/pages/Home.tsx`

**Requirements:**
- ✅ Section already exists (line ~360)
- ❌ Currently showing all featured products (8 items)
- ❌ Not a carousel/slider

**To Do:**
- [ ] Convert to carousel with left/right navigation
- [ ] Show 4 featured items visible at once
- [ ] Add smooth transitions between slides
- [ ] Auto-rotate every 5 seconds (like hero)
- [ ] Add pagination dots

**UI Components Needed:**
- Featured section with grid → carousel
- Previous/Next buttons (ChevronLeft/ChevronRight from lucide)
- Pagination indicators
- Framer Motion for animations

---

### 2️⃣ PRODUCT RATINGS & REVIEWS

**Status:** ⚡ NOT STARTED  
**Files:** 
- `frontend/src/components/ProductCard.tsx`
- `backend/app/models/product.py`

**Requirements:**
- [ ] Display star rating (1-5) on product cards
- [ ] Show number of reviews (e.g., "4.5 ⭐ (24 reviews)")
- [ ] Add review section on product detail page
- [ ] Rating endpoint in backend

**Current State:**
- Product model has: `calificacion` (float), `cantidad_resenas` (int)
- ProductCard already exists but doesn't show ratings

**UI Components:**
- Star rating display (custom SVG or Lucide Star icons)
- Review count badge
- Click to see reviews

---

### 3️⃣ SEARCH BAR IN HEADER

**Status:** ✅ PARTIALLY EXISTS  
**File:** `frontend/src/components/Navbar.tsx`

**Current State:**
- ✅ Desktop search: lines ~130-160 (works!)
- ✅ Mobile search: lines ~265-285 (works!)
- ✅ Navigates to `/tienda?q=query`

**To Do:**
- [ ] Verify search endpoint exists in backend
- [ ] Test search with products
- [ ] Add suggestion dropdown while typing

---

### 4️⃣ MULTI-SELECT SIZE IN CART

**Status:** ⚡ NOT STARTED  
**Files:**
- `frontend/src/pages/Cart.tsx`
- `frontend/src/context/CartContext.tsx`

**Requirements:**
- [ ] Add size/variant selection to cart items
- [ ] Allow multiple sizes of same product
- [ ] Update cart item structure to include size

**Current State:**
- Cart stores: `{ id, quantity, price }`
- Needs: `{ id, quantity, price, size? }`

---

### 5️⃣ CREATE/EDIT/DELETE CATALOGS

**Status:** ⚡ NOT STARTED  
**File:** New - `frontend/src/pages/admin/CatalogManager.tsx`

**Requirements:**
- [ ] List all categories
- [ ] Create new category (slug, name, color)
- [ ] Edit existing category
- [ ] Delete category

**Backend Endpoints Needed:**
- POST `/api/categorias` - Create
- PUT `/api/categorias/{id}` - Update
- DELETE `/api/categorias/{id}` - Delete

---

### 6️⃣ DATA MIGRATION TO SUPABASE

**Status:** 🔴 BLOCKED  
**Reason:** Waiting for bulk import stabilization (just fixed in Session 15)

**To Do Later:**
- [ ] Test bulk import with real Excel file
- [ ] Verify all 28+ products import successfully
- [ ] Verify specifications show in product detail
- [ ] Test product search

---

## 🚀 IMMEDIATE NEXT STEPS

### This Session (Session 16)

1. **Test Session 15 Fixes**
   - Restart backend
   - Test bulk import with Excel file
   - Verify products appear with specifications

2. **Build Featured Slider** (1-2 hours)
   - Convert featured products to carousel
   - Add auto-rotate + manual controls

3. **Add Product Ratings** (1-2 hours)
   - Display star ratings on ProductCard
   - Add review count badge

4. **Verify Search** (30 mins)
   - Test search functionality
   - Add suggestion dropdown

### Next Session (Session 17)

1. **Multi-select Size in Cart**
2. **Create Catalog Manager (Admin)**
3. **Performance & Security Review**

---

## 📝 FILE CHECKLIST

**Frontend - To Review:**
- [ ] `src/pages/Home.tsx` - Featured products section
- [ ] `src/components/ProductCard.tsx` - Rating display
- [ ] `src/components/Navbar.tsx` - Search functionality
- [ ] `src/pages/Cart.tsx` - Cart structure
- [ ] `src/context/CartContext.tsx` - Cart state management

**Backend - To Review:**
- [ ] `app/routes/products.py` - Search endpoint
- [ ] `app/models/product.py` - Product schema

---

## 🎯 KEY DECISIONS

### Carousel Implementation
- **Library:** Framer Motion (already installed)
- **Pattern:** Click buttons or auto-rotate
- **Items per view:** 4 on desktop, 2 on tablet, 1 on mobile

### Ratings Display
- **Format:** `4.5 ⭐ (24 reseñas)`
- **Icons:** Lucide Star (filled/empty)
- **Color:** #22C55E (green from palette)

### Search
- **Endpoint:** Already works with `/tienda?q=query`
- **Suggestions:** Show recent searches or popular products

---

## ⚠️ IMPORTANT NOTES

1. **Database is clean** - All previous import errors fixed
2. **Build is passing** - Frontend compiles without errors
3. **Steering guidelines applied** - Design system validated
4. **Dark theme confirmed** - Current design matches palette

---

## 📞 QUICK REFERENCE

**Start Backend:**
```bash
cd backend
python run_dev.py
```

**Build Frontend:**
```bash
cd frontend
npm run build
```

**Test Bulk Import:**
1. Upload Excel file to BulkImport page
2. Verify all rows appear in preview
3. Check specifications show in "Especificaciones" column
4. Confirm import - check all products in /tienda

---

**Ready to start? Let's build the storefront! 🚀**
