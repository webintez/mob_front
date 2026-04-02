// Search Filters JavaScript
// Handles filter functionality for search results page
// Integrates with search.js

(function() {
    'use strict';
    
    // Reference to search.js filter state (will be updated)
    let searchFilters = null;
    let loadSearchResultsFunc = null;
    
    // Initialize filters
    function initFilters() {
        // Get reference to search.js filter state and functions
        if (typeof window.selectedFilters !== 'undefined') {
            searchFilters = window.selectedFilters;
        }
        if (typeof loadSearchResults !== 'undefined') {
            loadSearchResultsFunc = loadSearchResults;
        }
        
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
        
        if (searchFilters) {
            searchFilters.minPrice = minPrice && minPrice.value ? parseFloat(minPrice.value) : null;
            searchFilters.maxPrice = maxPrice && maxPrice.value ? parseFloat(maxPrice.value) : null;
        }
        
        if (loadSearchResultsFunc) {
            if (typeof window.currentPage !== 'undefined') {
                window.currentPage = 1;
            }
            loadSearchResultsFunc();
        }
    }
    
    // Handle price range slider
    function handlePriceRangeChange(e) {
        const maxPriceInput = document.getElementById('maxPrice');
        if (maxPriceInput) {
            maxPriceInput.value = e.target.value;
            if (searchFilters) {
                searchFilters.maxPrice = parseFloat(e.target.value);
            }
            if (loadSearchResultsFunc) {
                if (typeof window.currentPage !== 'undefined') {
                    window.currentPage = 1;
                }
                loadSearchResultsFunc();
            }
        }
    }
    
    // Handle filter change (ratings, discounts, categories, brands, etc.)
    function handleFilterChange(e) {
        const filterType = e.target.className.split(' ')[0]; // rating-filter, discount-filter, etc.
        const value = e.target.value;
        const checked = e.target.checked;
        
        if (!searchFilters) {
            if (typeof window.selectedFilters !== 'undefined') {
                searchFilters = window.selectedFilters;
            } else {
                return;
            }
        }
        
        // Initialize filter arrays if needed
        if (!searchFilters.ratings) searchFilters.ratings = [];
        if (!searchFilters.discounts) searchFilters.discounts = [];
        if (!searchFilters.categories) searchFilters.categories = [];
        if (!searchFilters.brands) searchFilters.brands = [];
        
        if (filterType === 'rating-filter') {
            if (checked) {
                const rating = parseInt(value);
                if (!searchFilters.ratings.includes(rating)) {
                    searchFilters.ratings.push(rating);
                }
            } else {
                searchFilters.ratings = searchFilters.ratings.filter(r => r !== parseInt(value));
            }
            // Use highest selected rating
            searchFilters.rating = searchFilters.ratings.length > 0 ? Math.max(...searchFilters.ratings) : null;
        } else if (filterType === 'discount-filter') {
            if (checked) {
                const discount = parseInt(value);
                if (!searchFilters.discounts.includes(discount)) {
                    searchFilters.discounts.push(discount);
                }
            } else {
                searchFilters.discounts = searchFilters.discounts.filter(d => d !== parseInt(value));
            }
        } else if (filterType === 'availability-filter') {
            searchFilters.includeOutOfStock = checked;
        } else if (filterType === 'brand-filter') {
            const brandId = e.target.value;
            if (checked) {
                if (!searchFilters.brands.includes(brandId)) {
                    searchFilters.brands.push(brandId);
                }
            } else {
                searchFilters.brands = searchFilters.brands.filter(b => b !== brandId);
            }
            // Update brand array for search.js compatibility
            searchFilters.brand = searchFilters.brands;
        } else if (filterType === 'category-filter') {
            const categorySlug = e.target.value;
            if (checked) {
                if (!searchFilters.categories.includes(categorySlug)) {
                    searchFilters.categories.push(categorySlug);
                }
                // For search.js compatibility, use first selected category
                const categoryInput = document.querySelector(`input[value="${categorySlug}"].category-filter`);
                if (categoryInput && categoryInput.dataset.categoryId) {
                    searchFilters.category = categoryInput.dataset.categoryId;
                }
            } else {
                searchFilters.categories = searchFilters.categories.filter(c => c !== categorySlug);
                // If no categories selected, clear category filter
                if (searchFilters.categories.length === 0) {
                    searchFilters.category = null;
                } else {
                    // Use first remaining category
                    const firstCategory = document.querySelector(`input[value="${searchFilters.categories[0]}"].category-filter`);
                    if (firstCategory && firstCategory.dataset.categoryId) {
                        searchFilters.category = firstCategory.dataset.categoryId;
                    }
                }
            }
        }
        
        // Apply filters and reload results
        if (loadSearchResultsFunc) {
            if (typeof window.currentPage !== 'undefined') {
                window.currentPage = 1;
            }
            // Apply client-side filters if needed
            applyClientSideFilters();
            loadSearchResultsFunc();
        }
    }
    
    // Apply client-side filters (for discounts and availability)
    function applyClientSideFilters() {
        // This will be called after products are loaded
        // We'll filter products in the displayProducts function
    }
    
    // Clear all filters
    function clearAllFilters() {
        if (!searchFilters) {
            if (typeof window.selectedFilters !== 'undefined') {
                searchFilters = window.selectedFilters;
            } else {
                return;
            }
        }
        
        // Reset filter state
        searchFilters.category = null;
        searchFilters.brand = [];
        searchFilters.brands = [];
        searchFilters.minPrice = null;
        searchFilters.maxPrice = null;
        searchFilters.rating = null;
        searchFilters.ratings = [];
        searchFilters.discounts = [];
        searchFilters.includeOutOfStock = false;
        
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
        
        // Reload results
        if (loadSearchResultsFunc) {
            if (typeof window.currentPage !== 'undefined') {
                window.currentPage = 1;
            }
            loadSearchResultsFunc();
        }
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
        // Fallback: use fetch with API_CONFIG
        if (typeof API_CONFIG !== 'undefined' || typeof window.API_CONFIG !== 'undefined') {
            const apiConfig = window.API_CONFIG || API_CONFIG;
            return async function(endpoint, options = {}) {
                try {
                    const url = `${apiConfig.baseUrl}${endpoint}`;
                    const config = {
                        method: options.method || 'GET',
                        headers: {
                            ...apiConfig.headers,
                            ...(options.headers || {})
                        }
                    };
                    if (options.body) {
                        config.body = JSON.stringify(options.body);
                    }
                    const response = await fetch(url, config);
                    if (!response.ok) {
                        throw new Error(`API request failed with status ${response.status}`);
                    }
                    return await response.json();
                } catch (error) {
                    // /* console.log */('API Call Failed:', endpoint, error.message);
                    throw error;
                }
            };
        }
        return null;
    }
    
    // Load categories for filter
    async function loadCategoriesForFilter() {
        try {
            const makeApiCallFunc = getMakeApiCallFunc();
            if (!makeApiCallFunc) {
                // Fallback to fetch
                const apiConfig = typeof API_CONFIG !== 'undefined' ? API_CONFIG : (typeof window.API_CONFIG !== 'undefined' ? window.API_CONFIG : { baseUrl: '/api', headers: {} });
                const response = await fetch(`${apiConfig.baseUrl}/categories/index`, {
                    headers: apiConfig.headers
                });
                if (response.ok) {
                    const result = await response.json();
                    if (result && result.success && result.data) {
                        displayCategoriesForFilter(result.data);
                    }
                }
                return;
            }
            
            // /* console.log */('API Call: GET /categories/index');
            const result = await makeApiCallFunc('/categories/index');
            
            if (result && result.success && result.data) {
                displayCategoriesForFilter(result.data);
            }
        } catch (error) {
            // /* console.log */('Categories Fetch Failed:', error.message);
        }
    }
    
    // Display categories in filter
    function displayCategoriesForFilter(data) {
        let categories = [];
        
        // Use flat array from API response
        if (data.flat && Array.isArray(data.flat)) {
            categories = data.flat;
        } else if (data.tree && Array.isArray(data.tree)) {
            // Flatten tree structure if flat is not available
            categories = flattenCategoryTree(data.tree);
        }
        
        // Filter active categories and get unique categories
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
                    <input type="checkbox" value="${category.slug}" class="category-filter" data-category-id="${category.id}" data-category="${category.name}">
                    <span>${escapeHtml(category.name)}</span>
                `;
                label.querySelector('input').addEventListener('change', handleFilterChange);
                categoryFilters.appendChild(label);
            });
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
            if (!makeApiCallFunc) {
                // Fallback to fetch
                const apiConfig = typeof API_CONFIG !== 'undefined' ? API_CONFIG : (typeof window.API_CONFIG !== 'undefined' ? window.API_CONFIG : { baseUrl: '/api', headers: {} });
                const response = await fetch(`${apiConfig.baseUrl}/brands`, {
                    headers: apiConfig.headers
                });
                if (response.ok) {
                    const result = await response.json();
                    if (result && result.success && result.data) {
                        displayBrandsForFilter(result.data);
                    }
                }
                return;
            }
            
            // /* console.log */('API Call: GET /brands');
            const result = await makeApiCallFunc('/brands');
            
            if (result && result.success && result.data) {
                displayBrandsForFilter(result.data);
            }
        } catch (error) {
            // /* console.log */('Brands Fetch Failed:', error.message);
        }
    }
    
    // Display brands in filter
    function displayBrandsForFilter(data) {
        const brands = Array.isArray(data) ? data : (data.brands || []);
        const brandFilters = document.getElementById('brandFilters');
        
        if (brandFilters && brands.length > 0) {
            // Filter active brands
            const activeBrands = brands.filter(brand => brand.is_active !== false);
            
            brandFilters.innerHTML = '';
            activeBrands.forEach(brand => {
                const label = document.createElement('label');
                label.className = 'filter-checkbox';
                label.innerHTML = `
                    <input type="checkbox" value="${brand.id || brand.slug || brand.name}" class="brand-filter" data-brand="${brand.name}">
                    <span>${escapeHtml(brand.name)}</span>
                `;
                label.querySelector('input').addEventListener('change', handleFilterChange);
                brandFilters.appendChild(label);
            });
            
            // Show "VIEW ALL" link if more than 6 brands
            const viewAllLink = document.getElementById('viewAllBrands');
            if (viewAllLink && activeBrands.length > 6) {
                viewAllLink.style.display = 'block';
                viewAllLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Show all brands (remove max-height restriction)
                    brandFilters.style.maxHeight = 'none';
                    viewAllLink.style.display = 'none';
                });
            }
        }
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
    
    // Re-initialize when search.js is ready (in case it loads after this script)
    setTimeout(() => {
        if (typeof window.selectedFilters !== 'undefined' && !searchFilters) {
            searchFilters = window.selectedFilters;
        }
        if (typeof loadSearchResults !== 'undefined' && !loadSearchResultsFunc) {
            loadSearchResultsFunc = loadSearchResults;
        }
    }, 100);
})();


