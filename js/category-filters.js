// Category Filters JavaScript
// Handles filter functionality for category products page

(function() {
    'use strict';
    
    // Filter state
    let currentFilters = {
        brands: [],
        categories: [],
        tags: [], // Added for dynamic tag groups
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
        } else if (filterType === 'tag-filter') {
            const tagSlug = e.target.value;
            if (!currentFilters.tags) {
                currentFilters.tags = [];
            }
            if (checked) {
                if (!currentFilters.tags.includes(tagSlug)) {
                    currentFilters.tags.push(tagSlug);
                }
            } else {
                currentFilters.tags = currentFilters.tags.filter(t => t !== tagSlug);
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

            // Tag filter
            if (currentFilters.tags && currentFilters.tags.length > 0) {
                const productTags = product.tags || [];
                const productTagSlugs = productTags.map(t => t.slug || t);
                if (!currentFilters.tags.some(slug => productTagSlugs.includes(slug))) {
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

    // Build tree structure from flat category array fallback
    function buildTreeFromFlat(list) {
        const map = {};
        const tree = [];
        
        list.forEach(node => {
            const key = node.slug || node.id;
            map[key] = { ...node, children: node.children || [] };
        });
        
        list.forEach(node => {
            const key = node.slug || node.id;
            const parentKey = node.parent_slug || node.parent_id;
            if (parentKey && map[parentKey]) {
                if (!map[parentKey].children.some(c => c.slug === node.slug)) {
                    map[parentKey].children.push(map[key]);
                }
            } else if (!parentKey || node.is_root === true || node.level === 0) {
                tree.push(map[key]);
            }
        });
        return tree;
    }

    // Render nested category tree
    function renderCategoryTree(nodes, container, level = 0) {
        if (!Array.isArray(nodes)) return;

        nodes.forEach(node => {
            const itemWrapper = document.createElement('div');
            itemWrapper.className = `category-filter-item-wrapper level-${level}`;
            itemWrapper.style.paddingLeft = `${level * 16}px`;

            const hasChildren = node.children && Array.isArray(node.children) && node.children.length > 0;
            let toggleHTML = '';
            if (hasChildren) {
                toggleHTML = `<i class="fas fa-chevron-right toggle-children" style="cursor:pointer; margin-right: 6px; font-size: 10px; color: #878787;"></i>`;
            } else {
                toggleHTML = `<span style="display:inline-block; width: 16px;"></span>`;
            }

            itemWrapper.innerHTML = `
                <div class="category-header-row" style="display: flex; align-items: center; padding: 4px 0;">
                    ${toggleHTML}
                    <label class="filter-checkbox" style="display: flex; align-items: center; cursor: pointer; flex: 1; font-size: 14px; margin-bottom: 0 !important;">
                        <input type="checkbox" value="${node.slug}" class="category-filter" data-category="${node.name}" style="margin-right: 8px;">
                        <span>${node.name}</span>
                    </label>
                </div>
            `;

            const checkbox = itemWrapper.querySelector('input');
            checkbox.addEventListener('change', handleFilterChange);

            if (hasChildren) {
                const toggleIcon = itemWrapper.querySelector('.toggle-children');
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'category-children-container';
                childrenContainer.style.display = 'none'; // Collapsed by default

                renderCategoryTree(node.children, childrenContainer, level + 1);

                toggleIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isCollapsed = childrenContainer.style.display === 'none';
                    childrenContainer.style.display = isCollapsed ? 'block' : 'none';
                    toggleIcon.className = isCollapsed ? 'fas fa-chevron-down toggle-children' : 'fas fa-chevron-right toggle-children';
                });

                itemWrapper.appendChild(childrenContainer);
            }

            container.appendChild(itemWrapper);
        });
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
                const categoryFilters = document.getElementById('categoryFilters');
                if (categoryFilters) {
                    categoryFilters.innerHTML = '';
                    
                    let treeData = result.data.tree;
                    if (!treeData || !Array.isArray(treeData) || treeData.length === 0) {
                        treeData = buildTreeFromFlat(activeCategories);
                    }
                    
                    if (treeData && treeData.length > 0) {
                        renderCategoryTree(treeData, categoryFilters);
                    }
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
    
    // Load dynamic tag groups for filter
    async function loadTagGroupsForFilter() {
        const dynamicTagFilters = document.getElementById('dynamicTagFilters');
        if (!dynamicTagFilters) return;

        try {
            const makeApiCallFunc = getMakeApiCallFunc();
            if (!makeApiCallFunc) return;

            const result = await makeApiCallFunc('/tag-groups');
            
            if (result && result.success && result.data && Array.isArray(result.data)) {
                dynamicTagFilters.innerHTML = ''; // Clear prior

                // Create a main SPECIFICATIONS filter group
                const specGroup = document.createElement('div');
                specGroup.className = 'filter-group';
                specGroup.innerHTML = `
                    <div class="filter-group-header">
                        <span>SPECIFICATIONS</span>
                        <i class="fas fa-chevron-down toggle-icon"></i>
                    </div>
                    <div class="filter-group-content" id="tagTreeContainer">
                    </div>
                `;

                const container = specGroup.querySelector('#tagTreeContainer');

                result.data.forEach(group => {
                    if (!group.tags || !Array.isArray(group.tags) || group.tags.length === 0) return;

                    const groupWrapper = document.createElement('div');
                    groupWrapper.className = 'category-filter-item-wrapper level-0';
                    
                    groupWrapper.innerHTML = `
                        <div class="category-header-row" style="display: flex; align-items: center; padding: 4px 0; cursor: pointer;">
                            <i class="fas fa-chevron-right toggle-children" style="margin-right: 6px; font-size: 10px; color: #878787;"></i>
                            <span style="font-size: 14px; font-weight: 600; color: #212121; text-transform: uppercase;">${group.name}</span>
                        </div>
                    `;

                    const childrenContainer = document.createElement('div');
                    childrenContainer.className = 'category-children-container';
                    childrenContainer.style.display = 'none';

                    group.tags.forEach(tag => {
                        const tagWrapper = document.createElement('div');
                        tagWrapper.className = 'category-filter-item-wrapper level-1';
                        tagWrapper.style.paddingLeft = '16px';
                        tagWrapper.innerHTML = `
                            <div class="category-header-row" style="display: flex; align-items: center; padding: 4px 0;">
                                <span style="display:inline-block; width: 16px;"></span>
                                <label class="filter-checkbox" style="display: flex; align-items: center; cursor: pointer; flex: 1; font-size: 14px; margin-bottom: 0 !important;">
                                    <input type="checkbox" value="${tag.slug}" class="tag-filter" style="margin-right: 8px;">
                                    <span>${tag.name}</span>
                                </label>
                            </div>
                        `;
                        
                        tagWrapper.querySelector('input').addEventListener('change', (e) => {
                            // Ensure it works with existing handleFilterChange logic
                            e.target.classList.add('tag-filter'); // Should already be there
                            handleFilterChange(e);
                        });
                        
                        childrenContainer.appendChild(tagWrapper);
                    });

                    const toggleIcon = groupWrapper.querySelector('.toggle-children');
                    const headerRow = groupWrapper.querySelector('.category-header-row');
                    
                    headerRow.addEventListener('click', () => {
                        const isCollapsed = childrenContainer.style.display === 'none';
                        childrenContainer.style.display = isCollapsed ? 'block' : 'none';
                        toggleIcon.className = isCollapsed ? 'fas fa-chevron-down toggle-children' : 'fas fa-chevron-right toggle-children';
                    });

                    groupWrapper.appendChild(childrenContainer);
                    container.appendChild(groupWrapper);
                });

                // Add collapsible toggle to main header
                const mainHeader = specGroup.querySelector('.filter-group-header');
                mainHeader.addEventListener('click', toggleFilterGroup);

                dynamicTagFilters.appendChild(specGroup);
            }
        } catch (error) {
            console.error('Error loading tag groups:', error);
        }
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initFilters();
            loadCategoriesForFilter();
            loadTagGroupsForFilter();
            loadBrandsForFilter();
        });
    } else {
        initFilters();
        loadCategoriesForFilter();
        loadTagGroupsForFilter();
        loadBrandsForFilter();
    }
    
    // Export functions for global access
    window.storeProductsForFilter = storeProducts;
    window.applyCategoryFilters = applyFilters;
})();

