// Category Filters JavaScript
// Handles filter functionality for category products page

(function() {
    'use strict';
    
    // Filter state
    let currentFilters = {
        brands: [],
        categories: [],
        minPrice: null,
        maxPrice: null,
        ratings: [],
        discounts: [],
        includeOutOfStock: false
    };
    
    let allProducts = [];
    let filteredProducts = [];
    
    // Initialize filters
    function initFilters() {
        // Brand search
        const brandSearch = document.getElementById('brandSearch');
        if (brandSearch) {
            brandSearch.addEventListener('input', handleBrandSearch);
        }
        
        // Price inputs
        const minPrice = document.getElementById('minPrice');
        const maxPrice = document.getElementById('maxPrice');
        const priceRange = document.getElementById('priceRange');
        
        if (minPrice) {
            minPrice.addEventListener('change', handlePriceChange);
        }
        if (maxPrice) {
            maxPrice.addEventListener('change', handlePriceChange);
        }
        if (priceRange) {
            priceRange.addEventListener('input', handlePriceRangeChange);
        }
        
        // Rating filters
        const ratingFilters = document.querySelectorAll('.rating-filter');
        ratingFilters.forEach(filter => {
            filter.addEventListener('change', handleFilterChange);
        });
        
        // Discount filters
        const discountFilters = document.querySelectorAll('.discount-filter');
        discountFilters.forEach(filter => {
            filter.addEventListener('change', handleFilterChange);
        });
        
        // Availability filter
        const availabilityFilter = document.getElementById('includeOutOfStock');
        if (availabilityFilter) {
            availabilityFilter.addEventListener('change', handleFilterChange);
        }
        
        // Clear filters button
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', clearAllFilters);
        }
        
        // Sort dropdown
        const sortSelect = document.getElementById('sortProducts');
        if (sortSelect) {
            sortSelect.addEventListener('change', handleSortChange);
        }
        
        // Collapsible filter groups
        const filterHeaders = document.querySelectorAll('.filter-group-header');
        filterHeaders.forEach(header => {
            header.addEventListener('click', toggleFilterGroup);
        });
    }
    
    // Handle brand search
    function handleBrandSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const brandOptions = document.querySelectorAll('#brandFilters .filter-checkbox');
        
        brandOptions.forEach(option => {
            const brandName = option.querySelector('span').textContent.toLowerCase();
            if (brandName.includes(searchTerm)) {
                option.style.display = 'flex';
            } else {
                option.style.display = 'none';
            }
        });
    }
    
    // Handle price change
    function handlePriceChange() {
        const minPrice = document.getElementById('minPrice');
        const maxPrice = document.getElementById('maxPrice');
        
        currentFilters.minPrice = minPrice && minPrice.value ? parseFloat(minPrice.value) : null;
        currentFilters.maxPrice = maxPrice && maxPrice.value ? parseFloat(maxPrice.value) : null;
        
        applyFilters();
    }
    
    // Handle price range slider
    function handlePriceRangeChange(e) {
        const maxPriceInput = document.getElementById('maxPrice');
        if (maxPriceInput) {
            maxPriceInput.value = e.target.value;
            currentFilters.maxPrice = parseFloat(e.target.value);
            applyFilters();
        }
    }
    
    // Handle filter change (ratings, discounts, etc.)
    function handleFilterChange(e) {
        const filterType = e.target.className.split(' ')[0]; // rating-filter, discount-filter, etc.
        const value = e.target.value;
        const checked = e.target.checked;
        
        if (filterType === 'rating-filter') {
            if (checked) {
                currentFilters.ratings.push(parseInt(value));
            } else {
                currentFilters.ratings = currentFilters.ratings.filter(r => r !== parseInt(value));
            }
        } else if (filterType === 'discount-filter') {
            if (checked) {
                currentFilters.discounts.push(parseInt(value));
            } else {
                currentFilters.discounts = currentFilters.discounts.filter(d => d !== parseInt(value));
            }
        } else if (filterType === 'availability-filter') {
            currentFilters.includeOutOfStock = checked;
        } else if (filterType === 'brand-filter') {
            const brandName = e.target.dataset.brand;
            if (checked) {
                if (!currentFilters.brands.includes(brandName)) {
                    currentFilters.brands.push(brandName);
                }
            } else {
                currentFilters.brands = currentFilters.brands.filter(b => b !== brandName);
            }
        } else if (filterType === 'category-filter') {
            const categorySlug = e.target.value;
            // Handle category filtering - you can extend this based on your needs
            // For now, we'll just store it in filters
            if (!currentFilters.categories) {
                currentFilters.categories = [];
            }
            if (checked) {
                if (!currentFilters.categories.includes(categorySlug)) {
                    currentFilters.categories.push(categorySlug);
                }
            } else {
                currentFilters.categories = currentFilters.categories.filter(c => c !== categorySlug);
            }
        }
        
        applyFilters();
    }
    
    // Apply filters to products
    function applyFilters() {
        if (!allProducts || allProducts.length === 0) {
            return;
        }
        
        filteredProducts = allProducts.filter(product => {
            // Category filter
            if (currentFilters.categories && currentFilters.categories.length > 0) {
                const productCategory = product.category?.slug || product.category_slug || '';
                if (!currentFilters.categories.includes(productCategory)) {
                    return false;
                }
            }
            
            // Brand filter
            if (currentFilters.brands.length > 0) {
                const productBrand = product.brand?.name || product.brands?.[0]?.name || '';
                if (!currentFilters.brands.some(brand => productBrand.toLowerCase().includes(brand.toLowerCase()))) {
                    return false;
                }
            }
            
            // Price filter
            const productPrice = parseFloat(product.price) || 0;
            if (currentFilters.minPrice !== null && productPrice < currentFilters.minPrice) {
                return false;
            }
            if (currentFilters.maxPrice !== null && productPrice > currentFilters.maxPrice) {
                return false;
            }
            
            // Rating filter
            if (currentFilters.ratings.length > 0) {
                const productRating = parseFloat(product.rating) || 0;
                if (!currentFilters.ratings.some(rating => productRating >= rating)) {
                    return false;
                }
            }
            
            // Discount filter
            if (currentFilters.discounts.length > 0) {
                const originalPrice = parseFloat(product.original_price) || parseFloat(product.price) || 0;
                const currentPrice = parseFloat(product.price) || 0;
                const discount = originalPrice > 0 ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
                
                if (!currentFilters.discounts.some(d => discount >= d)) {
                    return false;
                }
            }
            
            // Availability filter
            if (!currentFilters.includeOutOfStock) {
                const stockQuantity = parseInt(product.stock_quantity || 0);
                if (stockQuantity <= 0) {
                    return false;
                }
            }
            
            return true;
        });
        
        displayFilteredProducts();
    }
    
    // Display filtered products
    function displayFilteredProducts() {
        const productsGrid = document.getElementById('allProducts');
        if (!productsGrid) return;
        
        // Clear existing products
        productsGrid.innerHTML = '';
        
        if (filteredProducts.length === 0) {
            productsGrid.innerHTML = '<div class="no-products"><p>No products match your filters.</p></div>';
            return;
        }
        
        // Use createProductCard if available
        if (typeof createProductCard === 'function') {
            filteredProducts.forEach(product => {
                const card = createProductCard(product);
                productsGrid.appendChild(card);
            });
        } else {
            // Fallback: simple product cards
            filteredProducts.forEach(product => {
                const cardHTML = `
                    <a href="/product.html?slug=${encodeURIComponent(product.slug)}" class="product-card">
                        <img src="${product.image_url || '/images/placeholder.svg'}" alt="${product.name || 'Product'}" onerror="this.src='/images/placeholder.svg'">
                        <h3>${product.name || 'Product Name'}</h3>
                        <p class="price">₹${(parseFloat(product.price) || 0).toLocaleString('en-IN')}</p>
                    </a>
                `;
                productsGrid.insertAdjacentHTML('beforeend', cardHTML);
            });
        }
    }
    
    // Handle sort change
    function handleSortChange(e) {
        const sortValue = e.target.value;
        
        if (!filteredProducts || filteredProducts.length === 0) {
            filteredProducts = [...allProducts];
        }
        
        switch(sortValue) {
            case 'price_low':
                filteredProducts.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
                break;
            case 'price_high':
                filteredProducts.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
                break;
            case 'newest':
                filteredProducts.sort((a, b) => {
                    const dateA = new Date(a.created_at || 0);
                    const dateB = new Date(b.created_at || 0);
                    return dateB - dateA;
                });
                break;
            case 'rating':
                filteredProducts.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
                break;
            case 'popularity':
            default:
                // Keep original order or sort by some popularity metric
                break;
        }
        
        displayFilteredProducts();
    }
    
    // Clear all filters
    function clearAllFilters() {
        currentFilters = {
            brands: [],
            categories: [],
            minPrice: null,
            maxPrice: null,
            ratings: [],
            discounts: [],
            includeOutOfStock: false
        };
        
        // Reset UI
        document.querySelectorAll('.filter-checkbox input').forEach(input => {
            input.checked = false;
        });
        
        const minPrice = document.getElementById('minPrice');
        const maxPrice = document.getElementById('maxPrice');
        const priceRange = document.getElementById('priceRange');
        
        if (minPrice) minPrice.value = '';
        if (maxPrice) maxPrice.value = '';
        if (priceRange) priceRange.value = priceRange.max;
        
        filteredProducts = [...allProducts];
        displayFilteredProducts();
    }
    
    // Toggle filter group
    function toggleFilterGroup(e) {
        const header = e.currentTarget;
        const content = header.nextElementSibling;
        
        if (content) {
            header.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        }
    }
    
    // Helper function to get makeApiCall
    function getMakeApiCallFunc() {
        if (typeof makeApiCall !== 'undefined') {
            return makeApiCall;
        } else if (typeof window.makeApiCall !== 'undefined') {
            return window.makeApiCall;
        } else if (typeof getMakeApiCall === 'function') {
            return getMakeApiCall();
        }
        return null;
    }
    
    // Load categories for filter
    async function loadCategoriesForFilter() {
        try {
            const makeApiCallFunc = getMakeApiCallFunc();
            if (!makeApiCallFunc) return;
            
            // /* console.log */('API Call: GET /categories/index');
            const result = await makeApiCallFunc('/categories/index');
            
            if (result && result.success && result.data) {
                let categories = [];
                
                // Use flat array from API response
                if (result.data.flat && Array.isArray(result.data.flat)) {
                    categories = result.data.flat;
                } else if (result.data.tree && Array.isArray(result.data.tree)) {
                    // Flatten tree structure if flat is not available
                    categories = flattenCategoryTree(result.data.tree);
                }
                
                // Filter active categories and get unique parent categories or root categories
                const activeCategories = categories
                    .filter(cat => cat.is_active !== false)
                    .filter((cat, index, self) => 
                        index === self.findIndex(c => c.slug === cat.slug)
                    );
                
                // Get root categories or categories without parent
                const rootCategories = activeCategories.filter(cat => 
                    cat.is_root === true || cat.level === 0 || !cat.parent_id
                );
                
                const categoryFilters = document.getElementById('categoryFilters');
                if (categoryFilters && rootCategories.length > 0) {
                    categoryFilters.innerHTML = '';
                    rootCategories.forEach(category => {
                        const label = document.createElement('label');
                        label.className = 'filter-checkbox';
                        label.innerHTML = `
                            <input type="checkbox" value="${category.slug}" class="category-filter" data-category="${category.name}">
                            <span>${category.name}</span>
                        `;
                        label.querySelector('input').addEventListener('change', handleFilterChange);
                        categoryFilters.appendChild(label);
                    });
                }
            }
        } catch (error) {
            // /* console.log */('Categories Fetch Failed:', error.message);
        }
    }
    
    // Flatten category tree structure to array
    function flattenCategoryTree(tree, result = []) {
        if (!Array.isArray(tree)) return result;
        
        tree.forEach(category => {
            if (category && category.slug) {
                result.push(category);
            }
            if (category.children && Array.isArray(category.children)) {
                flattenCategoryTree(category.children, result);
            }
        });
        
        return result;
    }
    
    // Load brands for filter
    async function loadBrandsForFilter() {
        try {
            const makeApiCallFunc = getMakeApiCallFunc();
            if (!makeApiCallFunc) return;
            
            // /* console.log */('API Call: GET /brands');
            const result = await makeApiCallFunc('/brands');
            
            if (result && result.success && result.data) {
                const brands = Array.isArray(result.data) ? result.data : (result.data.brands || []);
                const brandFilters = document.getElementById('brandFilters');
                
                if (brandFilters && brands.length > 0) {
                    // Filter active brands
                    const activeBrands = brands.filter(brand => brand.is_active !== false);
                    
                    brandFilters.innerHTML = '';
                    activeBrands.forEach(brand => {
                        const label = document.createElement('label');
                        label.className = 'filter-checkbox';
                        label.innerHTML = `
                            <input type="checkbox" value="${brand.slug || brand.name}" class="brand-filter" data-brand="${brand.name}">
                            <span>${brand.name}</span>
                        `;
                        label.querySelector('input').addEventListener('change', handleFilterChange);
                        brandFilters.appendChild(label);
                    });
                }
            }
        } catch (error) {
            // /* console.log */('Brands Fetch Failed:', error.message);
        }
    }
    
    // Store products for filtering
    function storeProducts(products) {
        allProducts = products;
        filteredProducts = [...products];
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initFilters();
            loadCategoriesForFilter();
            loadBrandsForFilter();
        });
    } else {
        initFilters();
        loadCategoriesForFilter();
        loadBrandsForFilter();
    }
    
    // Export functions for global access
    window.storeProductsForFilter = storeProducts;
    window.applyCategoryFilters = applyFilters;
})();

