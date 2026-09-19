// Search Filters JavaScript
// Handles filter functionality for search results page
// Integrates with search.js

(function () {
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
        if (!searchFilters.tags) searchFilters.tags = [];

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
        } else if (filterType === 'tag-filter') {
            const tagSlug = e.target.value;
            if (checked) {
                if (!searchFilters.tags.includes(tagSlug)) {
                    searchFilters.tags.push(tagSlug);
                }
            } else {
                searchFilters.tags = searchFilters.tags.filter(t => t !== tagSlug);
            }
            // Update tag array for search.js compatibility
            searchFilters.tag = searchFilters.tags;
        }

        // Apply filters and reload results
        if (loadSearchResultsFunc) {
            if (typeof window.currentPage !== 'undefined') {
                window.currentPage = 1;
            }
            loadSearchResultsFunc();
        }
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
        searchFilters.tags = [];
        searchFilters.tag = [];
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
            return async function (endpoint, options = {}) {
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
                        <input type="checkbox" value="${node.slug}" class="category-filter" data-category-id="${node.id}" data-category="${node.name}" style="margin-right: 8px;">
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

            const result = await makeApiCallFunc('/categories/index');

            if (result && result.success && result.data && result.data.tree) {
                const categoryFilters = document.getElementById('categoryFilters');
                if (categoryFilters) {
                    categoryFilters.innerHTML = '';
                    renderCategoryTree(result.data.tree, categoryFilters);
                }
            }
        } catch (error) {
            // /* console.log */('Categories Fetch Failed:', error.message);
        }
    }

    // Load brands for filter
    async function loadBrandsForFilter() {
        try {
            const makeApiCallFunc = getMakeApiCallFunc();
            if (!makeApiCallFunc) return;

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
                        
                        tagWrapper.querySelector('input').addEventListener('change', handleFilterChange);
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
            loadTagGroupsForFilter();
            loadBrandsForFilter();
        });
    } else {
        initFilters();
        loadCategoriesForFilter();
        loadTagGroupsForFilter();
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
