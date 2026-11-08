# Branch Comparison Report: Santyhogar E-Commerce

## Executive Summary

| Aspect | Status |
|--------|--------|
| **version1 → version2** | Major refactoring: Security hardening, cleanup, database simplification |
| **version1 → version7** | Identical (no unique commits) |
| **Recommendation** | Merge version2 into version1 — contains critical security and operational improvements |

---

## Branch Status

### version1 (Current)
- Latest commit: `7b76cfe` — "feat: add more detailed logging to debug .map() error"
- Features: Full e-commerce MVP with checkout, orders, products, admin panel
- Issues: Contains legacy code, less secure patterns, more complex middleware

### version2 (Sprint 1)
- Latest commit: `7e2657f` — "feat: sprint 1 - seguridad, datos reales, cleanup"
- Status: Production-ready refactor with **comprehensive security hardening**
- Unique commits: 1 major commit with ~150 file changes

### version7
- Status: **Identical to version1** (0 unique commits)
- No new features or fixes
- Can be safely ignored

---

## Critical Files Comparison

### 🔴 **Deleted in version2 (Legacy/Removed Complexity)**

#### Configuration & Utilities Removed
- `backend/app/ssl_fix.py` — SSL certificate handling (moved to config layer)
- `backend/app/middleware/rate_limit.py` — Simple rate limiting (functionality retained)
- `backend/app/middleware/rate_limit_middleware.py` — Duplicate middleware
- `backend/app/utils/timezone.py` — Timezone utilities (integrated into models)
- `backend/app/utils/validation.py` — Validation helpers (moved to schemas)
- `backend/app/tasks/__init__.py` + `backend/app/tasks/cancel_expired_orders.py` — Background task scheduler (removed from lifespan)

#### Complex Routes Removed
- `backend/app/routes/categories.py` — **Dynamic categories API removed** (still in products)
- `backend/app/routes/installments.py` — Installments endpoint (merged into payment service)
- `backend/app/routes/favorites.py` — Favorites endpoint (moved to customer service)
- `backend/app/routes/checkout_pro.py` — Alternative checkout (consolidated to checkout.py)
- `backend/app/routes/retry_payment.py` — Payment retry (merged into webhook handling)

#### Services Removed or Consolidated
- `backend/app/services/bulk_image_upload_service.py` — **Removed bulk image upload** (images in bulk import)
- `backend/app/services/installments_service.py` — Installments logic (in payment service)
- `backend/app/services/pagination_service.py` — Custom pagination (likely migrated to query layer)
- `backend/app/services/checkout_service.py` — Checkout orchestration (in routes/checkout.py)

#### Database Migrations Removed
- `backend/database/migrations/022_atomic_stock_decrement.sql` — Stock decrement atomicity
- `backend/database/migrations/023_enable_row_level_security.sql` — Row-level security
- `backend/database/migrations/024_add_product_visibility.sql` — Product visibility toggle

#### Testing & Admin Scripts Removed
- `backend/generate_admin_password_hash.py`
- `backend/create_test_admin.py`
- `test_admin_endpoint.py`

---

### 🟢 **New in version2 (Security & Authentication)**

#### New Authentication System
- **`backend/app/auth.py`** (NEW)
  - JWT token verification from Supabase
  - User extraction from Bearer tokens
  - `get_current_user()` dependency
  - `require_admin()` role-based access control
  - Secure token validation against Supabase Auth endpoint

#### New Webhook System
- **`backend/app/routes/webhooks.py`** (NEW)
  - Replaces `webhook.py` with enhanced features
  - HMAC signature verification (x-signature, x-request-id headers)
  - Webhook idempotency service integration
  - MercadoPago IPN notification handling

#### New Service: Webhook Idempotency
- **`backend/app/services/webhook_idempotency.py`** (NEW)
  - Prevents duplicate webhook processing
  - Request ID deduplication

---

### 🔵 **Modified Core Files (Significant Changes)**

#### Backend Configuration
- **`backend/app/config.py`**
  - ✅ Added `.kiro/.env` path to env file search
  - ✅ Changed `mercadopago_public_key` to required field
  - ✅ Added `admin_master_password` field (with debug logging)
  - ✅ Removed `extra="ignore"` setting from BaseSettings

#### Main Application
- **`backend/app/main.py`** (MAJOR REFACTOR)
  - ❌ Removed SSL fix import
  - ❌ Removed rate limiting middleware
  - ❌ Removed background task scheduler (cancel_expired_orders)
  - ❌ Removed custom pagination functions
  - ❌ Removed inline address/customer mappers
  - ❌ Removed categories route import
  - ❌ Removed installments, favorites, checkout_pro route imports
  - ✅ Added dashboard route import
  - ✅ Simplified CORS (single origin instead of comma-separated parsing)
  - Version downgraded: 1.0.2 → 1.0.1

#### Database Connection Layer
- **`backend/app/database/connection.py`**
  - Refactored connection handling
  - Likely improved error handling

#### Database Operations
- **`backend/app/database/operations.py`**
  - Operations consolidation
  - Service integration changes

#### Dependencies/Injection
- **`backend/app/deps.py`**
  - Updated dependency providers for new auth system
  - Removed pagination service dependency

#### Exception Handling
- **`backend/app/exceptions.py`**
  - Likely added auth-related exceptions

#### Mappers
- **`backend/app/mappers.py`**
  - Centralized model-to-response mappers
  - Removed inline mapping functions

#### Request Models
- **`backend/app/models/schemas.py`**
  - Updated for new auth and admin features

#### Admin Users Route
- **`backend/app/routes/admin_users.py`**
  - Integrated with new auth system
  - Now requires `require_admin()` dependency

#### Checkout Route
- **`backend/app/routes/checkout.py`**
  - Authentication checks added
  - Possible security improvements

#### Customers Route
- **`backend/app/routes/customers.py`**
  - Now protected with auth
  - Address management hardened

#### Dashboard Route
- **`backend/app/routes/dashboard.py`**
  - Authentication required
  - Admin-only endpoint

#### Orders Route
- **`backend/app/routes/orders.py`**
  - Auth integration
  - Webhook signature verification

#### Products Route
- **`backend/app/routes/products.py`**
  - Likely removed category-specific endpoints
  - Simplified product operations

#### Payment Service
- **`backend/app/services/payment_service.py`**
  - Likely consolidated installments logic
  - Webhook integration

#### Product Service
- **`backend/app/services/product_service.py`**
  - Database operations refactored
  - Pagination removed from service

#### Order Service
- **`backend/app/services/order_service.py`**
  - Updated order flow

#### Customer Service
- **`backend/app/services/customer_service.py`**
  - Integrated favorites logic

#### Dashboard Service
- **`backend/app/services/dashboard_service.py`**
  - Analytics consolidation

#### Bulk Import Service
- **`backend/app/services/bulk_import_service.py`**
  - Removed separate image upload service
  - Images now handled inline

#### Utilities
- **`backend/app/utils/order_number.py`**
  - Minor updates

#### Requirements
- **`backend/requirements.txt`**
  - ❌ Removed: `antiword==0.0.1`
  - ❌ Removed: `textract==1.6.5`
  - Reason: These were for legacy .doc file processing

#### Production Files
- **`backend/Procfile`** (NEW)
  - Separate Procfile for backend deployment
- **`backend/runtime.txt`** (NEW)
  - Python runtime specification
- **`railpack.toml`** (NEW)
  - Railway deployment configuration

#### Deployment
- **`Procfile`** — Modified for multi-service setup
- **`start.sh`** — Updated startup script
- **`railway.toml`** — Updated Railway configuration

---

### Frontend Changes

#### Critical Changes
- **`frontend/src/api/supabaseClient.ts`** — DELETED (replaced with auth.py in backend)
- **`frontend/src/components/CardBINInput.tsx`** — Removed (integrated into payment method selection)
- **`frontend/src/components/ImageZoom.tsx`** — Removed (not used)
- **`frontend/src/components/InstallmentCalculator.tsx`** — Removed (merged into PaymentMethods)
- **`frontend/src/components/InstallmentsCalculator.tsx`** — Removed (consolidated)
- **`frontend/src/components/LowStockBanner.tsx`** — Removed (not implemented)
- **`frontend/src/components/PaymentMethodsModal.tsx`** — Removed (merged into payment flow)
- **`frontend/src/components/PaymentMethodsWithInstallments.tsx`** — Removed (consolidated)
- **`frontend/src/components/SizeSelector.tsx`** — Removed (not needed for furniture store)
- **`frontend/src/hooks/useCategories.ts`** — Removed (API changed)
- **`frontend/src/hooks/useCategoriesAdmin.ts`** — Removed (consolidated)
- **`frontend/src/hooks/useCategoriesNav.ts`** — Removed (categories fetched from products)
- **`frontend/src/hooks/useDashboardStats.ts`** — Removed (in dashboard context)
- **`frontend/src/pages/TermsAndConditions.tsx`** — Removed (not required)
- **`frontend/src/pages/admin/BulkImageUpload.tsx`** — Removed (merged into BulkImport)
- **`frontend/src/pages/admin/CategoriesManagement.tsx`** — Removed (categories removed from API)
- **`frontend/src/utils/dateUtils.ts`** — Removed (date handling in services)
- **`frontend/src/utils/installments.ts`** — Removed (logic in backend)

#### Modified Components
- **`frontend/src/App.tsx`** — Updated routes (removed categories management)
- **`frontend/src/api/client.ts`** — Base API client changes
- **`frontend/src/api/customersApi.ts`** — Auth integration
- **`frontend/src/api/productsApi.ts`** — Categories endpoint removed
- **`frontend/src/components/AuthModal.tsx`** — Auth flow updated
- **`frontend/src/components/CartSidebar.tsx`** — Payment method integration
- **`frontend/src/components/CitySelect.tsx`** — Validation improvements
- **`frontend/src/components/Footer.tsx`** — Minor updates
- **`frontend/src/components/Navbar.tsx`** — Auth status handling
- **`frontend/src/components/ProductCard.tsx`** — Product display changes
- **`frontend/src/components/ProvinceSelect.tsx`** — Form validation
- **`frontend/src/components/SaveAddressModal.tsx`** — Address handling

#### Context & State Management
- **`frontend/src/context/CartContext.tsx`** — Payment method handling
- **`frontend/src/context/OrdersContext.tsx`** — Order status updates
- **`frontend/src/context/ProductsContext.tsx`** — Product fetching (no categories)
- **`frontend/src/context/AuthContext.tsx`** — NEW AUTH CONTEXT (likely renamed/refactored)
- **`frontend/src/context/ToastContext.tsx`** — Notification system

#### API Files
- **`frontend/src/api/checkoutApi.ts`** — Checkout flow
- **`frontend/src/api/ordersApi.ts`** — Order management
- **`frontend/src/api/supabaseClient.ts`** — DELETED

#### Pages
- **`frontend/src/pages/AuthCallback.tsx`** — OAuth callback
- **`frontend/src/pages/Cart.tsx`** — Shopping cart
- **`frontend/src/pages/Checkout.tsx`** — Checkout process
- **`frontend/src/pages/CheckoutSuccess.tsx`** — Success page
- **`frontend/src/pages/CheckoutPending.tsx`** — Pending payment page
- **`frontend/src/pages/CheckoutFailure.tsx`** — Failed checkout page
- **`frontend/src/pages/Contact.tsx`** — Contact form
- **`frontend/src/pages/Home.tsx`** — Landing page
- **`frontend/src/pages/ProductDetail.tsx`** — Product details
- **`frontend/src/pages/Shop.tsx`** — Product listing (no category filtering)

#### Admin Pages
- **`frontend/src/pages/admin/AdminLayout.tsx`** — Auth-protected layout
- **`frontend/src/pages/admin/AdminCustomers.tsx`** — Customer management
- **`frontend/src/pages/admin/AdminOrders.tsx`** — Order management
- **`frontend/src/pages/admin/AdminProducts.tsx`** — Product management
- **`frontend/src/pages/admin/AdminUsers.tsx`** — User/admin management
- **`frontend/src/pages/admin/BulkImport.tsx`** — Bulk product import
- **`frontend/src/pages/admin/Dashboard.tsx`** — Admin dashboard
- **`frontend/src/pages/admin/PriceManagement.tsx`** — Price updates
- **`frontend/src/pages/admin/ProductFormModal.tsx`** — Product form
- **`frontend/src/pages/admin/CustomerFormModal.tsx`** — Customer form (likely added)

#### User Pages
- **`frontend/src/pages/user/MyAccount.tsx`** — User profile
- **`frontend/src/pages/user/MyAddresses.tsx`** — Address management
- **`frontend/src/pages/user/MyFavorites.tsx`** — Favorites
- **`frontend/src/pages/user/MyOrders.tsx`** — Order history
- **`frontend/src/pages/user/MySecurity.tsx`** — Security settings
- **`frontend/src/pages/user/UserLayout.tsx`** — Protected user layout

#### Build & Config
- **`frontend/vite.config.ts`** — Build configuration
- **`frontend/tsconfig.app.json`** — TypeScript config
- **`frontend/package.json`** — Dependencies updated
- **`frontend/.env.production`** — Updated for new backend
- **`frontend/.env.example`** — Updated environment variables

---

## Feature Analysis: What's Missing in version1

### 🔐 **Authentication System (HIGH PRIORITY)**
- ❌ No centralized JWT verification
- ❌ Missing role-based access control (admin checks)
- ❌ No secure token validation against Supabase
- **Impact**: Admin endpoints potentially accessible without proper auth
- **Fix**: Implement `backend/app/auth.py` from version2

### 🔒 **Security Hardening (HIGH PRIORITY)**
- ❌ No webhook signature verification
- ❌ Missing HMAC validation
- ❌ No idempotency check for webhooks
- ❌ Removed security migrations (023_enable_row_level_security.sql)
- **Impact**: Webhook spoofing attacks possible
- **Fix**: Add webhook verification service

### 🗄️ **Database Consolidation (MEDIUM PRIORITY)**
- ❌ Removed 3 security-related migrations
  - Atomic stock decrement (race conditions possible)
  - Row-level security (data visibility issues)
  - Product visibility toggle (all products visible)
- **Impact**: Data integrity and visibility issues
- **Fix**: Review and apply missing migrations

### 🛒 **Simplified API Structure (MEDIUM PRIORITY)**
- ❌ Categories endpoint still exists but redundant
- ❌ Separate installments/favorites endpoints
- ❌ Checkout flow has multiple implementations (checkout.py + checkout_pro.py)
- **Impact**: Code duplication, maintenance burden
- **Fix**: Consolidate routes (version2 approach)

### 🖼️ **Product Visibility & Stock (MEDIUM PRIORITY)**
- ❌ Migration 024 removed (product visibility)
- ❌ Migration 022 removed (atomic stock decrement)
- **Impact**: Products can't be hidden, stock race conditions
- **Fix**: Add visibility field to products table

### 📦 **Bulk Operations (LOW PRIORITY)**
- ❌ Separate image upload service
- ❌ No image search automation in bulk import
- **Impact**: Bulk import harder to use
- **Fix**: Inline image handling in bulk import service

---

## Code Quality Improvements in version2

| Category | version1 | version2 | Benefit |
|----------|----------|----------|---------|
| **Route Count** | 9 routes + duplicates | 6 routes | Simpler API, less to maintain |
| **Middleware** | Rate limiting + SSL fix | Removed | Simplified deployment |
| **Background Tasks** | Complex scheduler | Removed | Simpler lifespan, fewer edge cases |
| **Authentication** | Basic Supabase client | Full auth service | Centralized, testable, secure |
| **File Dependencies** | 80+ utility files | Consolidated | Easier to follow code flow |
| **Type Safety** | Less strict schemas | Full validation | Better API contracts |

---

## Implementation Priority Matrix

### 🔴 **CRITICAL (Do First)**
1. **Implement `backend/app/auth.py`**
   - JWT verification
   - Role-based access control
   - Supabase token validation
   - **Risk if skipped**: Unauthorized access to admin endpoints

2. **Add Webhook Signature Verification**
   - HMAC validation (x-signature header)
   - Webhook idempotency service
   - **Risk if skipped**: Payment webhook spoofing

3. **Apply Missing Security Migrations**
   - `023_enable_row_level_security.sql`
   - `024_add_product_visibility.sql`
   - `022_atomic_stock_decrement.sql`
   - **Risk if skipped**: Data integrity issues

### 🟡 **HIGH (Next Sprint)**
4. **Consolidate Routes**
   - Remove duplicate checkout implementations
   - Merge installments into payment service
   - Remove standalone favorites/categories APIs

5. **Update Admin Endpoints**
   - Apply `require_admin()` dependency
   - Verify auth on all protected routes

6. **Frontend Auth Integration**
   - Remove `supabaseClient.ts` client-side auth
   - Use backend auth endpoints

### 🟢 **MEDIUM (Later)**
7. **Simplify Middleware**
   - Remove rate limiting (or implement server-side)
   - Remove SSL fix (use config)

8. **Consolidate Services**
   - Merge pagination into query layer
   - Merge timezone utilities into models

---

## Files to Merge (Copy from version2 → version1)

### Backend
```
✅ backend/app/auth.py (NEW)
✅ backend/app/services/webhook_idempotency.py (NEW)
✅ backend/Procfile (NEW)
✅ backend/runtime.txt (NEW)
✅ railpack.toml (NEW)
⚠️  backend/app/config.py (MERGE config changes)
⚠️  backend/app/main.py (MERGE to remove old code)
⚠️  backend/app/deps.py (MERGE auth dependencies)
⚠️  backend/app/routes/webhook.py (MERGE signature verification)
⚠️  backend/requirements.txt (MERGE - remove antiword/textract)
```

### Database
```
✅ backend/database/migrations/022_atomic_stock_decrement.sql
✅ backend/database/migrations/023_enable_row_level_security.sql
✅ backend/database/migrations/024_add_product_visibility.sql
```

### Frontend
```
✅ frontend/.env.example (MERGE env vars)
✅ frontend/.env.production (MERGE for production)
✅ frontend/src/api/ (MERGE auth integration)
✅ frontend/vite.config.ts (MERGE build changes)
```

---

## Files to Remove from version1 (Already Deleted in version2)

### Backend
```
❌ backend/app/ssl_fix.py
❌ backend/app/middleware/rate_limit.py
❌ backend/app/middleware/rate_limit_middleware.py
❌ backend/app/utils/timezone.py
❌ backend/app/utils/validation.py
❌ backend/app/tasks/
❌ backend/app/routes/categories.py
❌ backend/app/routes/installments.py
❌ backend/app/routes/favorites.py
❌ backend/app/routes/checkout_pro.py
❌ backend/app/routes/retry_payment.py
❌ backend/app/services/bulk_image_upload_service.py
❌ backend/app/services/installments_service.py
❌ backend/app/services/pagination_service.py
❌ backend/app/services/checkout_service.py
```

### Frontend
```
❌ frontend/src/api/supabaseClient.ts
❌ frontend/src/components/CardBINInput.tsx
❌ frontend/src/components/ImageZoom.tsx
❌ frontend/src/components/InstallmentCalculator.tsx
❌ frontend/src/components/InstallmentsCalculator.tsx
❌ frontend/src/components/LowStockBanner.tsx
❌ frontend/src/components/PaymentMethodsModal.tsx
❌ frontend/src/components/PaymentMethodsWithInstallments.tsx
❌ frontend/src/components/SizeSelector.tsx
❌ frontend/src/hooks/useCategories.ts
❌ frontend/src/hooks/useCategoriesAdmin.ts
❌ frontend/src/hooks/useCategoriesNav.ts
❌ frontend/src/hooks/useDashboardStats.ts
❌ frontend/src/pages/TermsAndConditions.tsx
❌ frontend/src/pages/admin/BulkImageUpload.tsx
❌ frontend/src/pages/admin/CategoriesManagement.tsx
❌ frontend/src/utils/dateUtils.ts
❌ frontend/src/utils/installments.ts
```

---

## Summary

**version2** represents a "cleanup sprint" that:
1. **Adds critical security** (authentication, webhook verification)
2. **Removes complexity** (redundant routes, utilities, migrations)
3. **Consolidates services** (payment, order, product)
4. **Improves deployment** (separate Procfiles, runtime specs)

**version7** is identical to **version1** and can be ignored.

**Recommendation**: Selectively merge version2 changes into version1, prioritizing security features first, then code cleanup.
