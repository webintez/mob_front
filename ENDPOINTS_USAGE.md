# Category API Endpoints Usage

This document tracks which Category API endpoints are being used in the frontend codebase.

## ✅ Correctly Used Endpoints

### 1. GET /api/categories/root
**Used in:**
- `categories.js` - `loadCategoriesDisplay()` - Loading category display cards
- `categories.js` - `loadCategoryNavigation()` - Loading navigation menu
- `category-nav-common.js` - `loadCategoryNavigationCommon()` - Common navigation loader

**Purpose:** Get root categories (categories without parent) - most efficient for navigation

### 2. GET /api/categories/index
**Used in:**
- `app.js` - `loadCategories()` - Loading all categories for homepage
- `app.js` - `loadHomepageCategoriesWithImages()` - Loading homepage category images
- `categories.js` - Fallback when `/categories/root` fails
- `category-nav-common.js` - Fallback when `/categories/root` fails
- `product.js` - `loadCategories()` - Loading categories for product page
- `search.js` - `loadCategories()` - Loading categories for search filters

**Purpose:** Get hierarchical index (tree + flat formats) - used when full category structure needed

### 3. GET /api/categories/{slug}
**Used in:**
- `app.js` - `loadProductsByCategory()` - Getting category details and name
- `categories.js` - `loadCategoryProductsDirect()` - Getting category name for display

**Purpose:** Get detailed information about a specific category (includes breadcrumbs)

### 4. GET /api/categories/{slug}/products
**Used in:**
- `app.js` - `loadProducts()` - Loading products filtered by category
- `categories.js` - `loadCategoryProductsDirect()` - Loading products when category is selected
- `product.js` - `loadSimilarProducts()` - Loading similar products from same category

**Purpose:** Get all active products in a specific category

## ❌ Previously Incorrect Endpoints (Now Fixed)

### ~~GET /products/category/{slug}~~ (REMOVED)
**Was used in:** `product.js` - `loadSimilarProducts()`
**Fixed to:** `/categories/{slug}/products` ✅

## Endpoints Not Currently Used (Available for Future Use)

- GET /api/categories - List all categories (using `/categories/index` instead)
- GET /api/categories/tree - Get category tree (using `/categories/index` which includes tree)
- GET /api/categories/{slug}/children - Get child categories
- GET /api/categories/{slug}/parent - Get parent category
- GET /api/categories/{slug}/products/count - Get product count

## Notes

- All endpoints follow the documented API structure
- Response parsing handles the documented format: `{ success: true, data: {...} }`
- Category products API returns: `{ category: {...}, products: [...], count: number }`
- Proper error handling and fallbacks are implemented

