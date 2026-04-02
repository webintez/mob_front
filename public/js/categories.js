// Categories Page JavaScript
// API Configuration - use existing if available, otherwise create
// Use window object to avoid const redeclaration errors
if (typeof window.API_CONFIG === 'undefined' && typeof API_CONFIG === 'undefined') {
    window.API_CONFIG = {
        baseUrl: '/api',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };
}

// API Helper Function - use existing if available, otherwise create
if (typeof window.makeApiCall === 'undefined' && typeof makeApiCall === 'undefined') {
    window.makeApiCall = async function (endpoint, options = {}) {
        try {
            // Use existing API_CONFIG from window or global scope
            const apiConfig = window.API_CONFIG || (typeof API_CONFIG !== 'undefined' ? API_CONFIG : {
                baseUrl: '/api',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

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
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Invalid response format');
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `API request failed with status ${response.status}`);
            }

            return result;
        } catch (error) {
            // /* console.log */('API Call Failed:', endpoint, error.message);
            throw error;
        }
    };
}

// Helper function to get makeApiCall - use existing or window version
function getMakeApiCall() {
    if (typeof makeApiCall !== 'undefined') {
        return makeApiCall;
    }
    if (typeof window.makeApiCall !== 'undefined') {
        return window.makeApiCall;
    }
    throw new Error('makeApiCall is not available');
}

// Category Icons Mapping - use existing if available, otherwise create
// Use IIFE to avoid const redeclaration errors
(function () {
    'use strict';

    // Only create if it doesn't exist
    if (typeof window.categoryIcons === 'undefined' && typeof categoryIcons === 'undefined') {
        window.categoryIcons = {
            'smartphones': 'fas fa-mobile-alt',
            'mobile-accessories': 'fas fa-headphones',
            'smart-watches': 'fas fa-clock',
            'laptops': 'fas fa-laptop',
            'pc-components': 'fas fa-desktop',
            'audio-headphones': 'fas fa-volume-up',
            'fashion': 'fas fa-tshirt',
            'home-kitchen': 'fas fa-home',
            'appliances': 'fas fa-tv',
            'beauty-toys': 'fas fa-smile',
            'furniture': 'fas fa-couch',
            'grocery': 'fas fa-shopping-basket',
            'electronics': 'fas fa-plug',
            'default': 'fas fa-tag'
        };
    }

    // Get Category Icon - use existing if available, otherwise create
    if (typeof window.getCategoryIcon === 'undefined' && typeof getCategoryIcon === 'undefined') {
        window.getCategoryIcon = function (category) {
            const icons = (typeof categoryIcons !== 'undefined' ? categoryIcons : window.categoryIcons);
            if (category.icon) {
                return category.icon;
            }
            const slug = category.slug || '';
            for (const [key, icon] of Object.entries(icons)) {
                if (slug.includes(key)) {
                    return icon;
                }
            }
            return icons.default;
        };
    }
})();

// Create wrapper function that uses existing getCategoryIcon (don't redeclare)
// Only create if it doesn't already exist
if (typeof getCategoryIcon === 'undefined') {
    var getCategoryIcon = function (category) {
        // Try to use existing getCategoryIcon from window
        if (typeof window.getCategoryIcon !== 'undefined') {
            return window.getCategoryIcon(category);
        }
        // Fallback if neither exists
        const icons = (typeof categoryIcons !== 'undefined' ? categoryIcons : window.categoryIcons);
        if (category.icon) {
            return category.icon;
        }
        const slug = category.slug || '';
        for (const [key, icon] of Object.entries(icons)) {
            if (slug.includes(key)) {
                return icon;
            }
        }
        return icons.default;
    };
}

document.addEventListener('DOMContentLoaded', () => {
    loadCategoriesDisplay();
    // loadCategoryNavigation(); // Conflicts with secondary-menu.js
    setupLoginDropdown();
    setupMoreDropdown();

    // Check if category parameter is in URL and load products
    const urlParams = new URLSearchParams(window.location.search);
    const categorySlug = urlParams.get('category');
    const subcategoryName = urlParams.get('subcategory');

    if (categorySlug) {
        // Show products section and hide categories section
        const productsSection = document.getElementById('productsSection');
        const categoriesSection = document.querySelector('.categories-display-section');

        if (productsSection) {
            productsSection.style.display = 'block';
        }
        if (categoriesSection) {
            categoriesSection.style.display = 'none';
        }

        // Load products by category - wait for app.js to load
        const loadCategoryProducts = async () => {
            if (typeof loadProductsBySubcategory === 'function') {
                await loadProductsBySubcategory(categorySlug, subcategoryName);
            } else if (typeof loadProductsByCategory === 'function') {
                await loadProductsByCategory(categorySlug, subcategoryName);
            } else {
                // Fallback: load products directly using category API
                await loadCategoryProductsDirect(categorySlug, subcategoryName);
            }
        };

        // Try immediately, then wait a bit if needed
        if (typeof loadProductsByCategory === 'function') {
            loadCategoryProducts();
        } else {
            // Wait for app.js to load (check every 100ms, max 3 seconds)
            let attempts = 0;
            const maxAttempts = 30;
            const checkInterval = setInterval(() => {
                attempts++;
                if (typeof loadProductsByCategory === 'function') {
                    clearInterval(checkInterval);
                    loadCategoryProducts();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    loadCategoryProductsDirect(categorySlug);
                }
            }, 100);
        }
    }
});

// Load Categories Display (Big Cards) using Category Root API
async function loadCategoriesDisplay() {
    const categoriesContainer = document.getElementById('categoriesDisplay');
    if (!categoriesContainer) return;

    try {
        // /* console.log */('API Call: GET /categories/root');
        // Use /categories/root endpoint for root categories (most efficient)
        const result = await getMakeApiCall()('/categories/root');

        // Handle API response structure per documentation
        let categoriesArray = [];

        if (result && result.success && result.data && Array.isArray(result.data)) {
            // Root categories endpoint returns array directly
            categoriesArray = result.data;
            // /* console.log */('Categories Fetched:', categoriesArray.length, 'categories');
        } else {
            // Fallback: try /categories/index if root fails
            // /* console.log */('API Call: GET /categories/index (fallback)');
            const indexResult = await getMakeApiCall()('/categories/index');
            if (indexResult && indexResult.success && indexResult.data) {
                if (indexResult.data.flat && Array.isArray(indexResult.data.flat)) {
                    categoriesArray = indexResult.data.flat.filter(cat => cat.is_root === true || cat.level === 0);
                } else if (indexResult.data.tree && Array.isArray(indexResult.data.tree)) {
                    categoriesArray = indexResult.data.tree;
                }
                // /* console.log */('Categories Fetched:', categoriesArray.length, 'categories (from index)');
            }
        }

        if (categoriesArray.length > 0) {
            categoriesContainer.innerHTML = '';

            categoriesArray.forEach(category => {
                if (category && category.slug && category.name) {
                    const categoryCard = createCategoryCard(category);
                    categoriesContainer.appendChild(categoryCard);
                }
            });
        } else {
            categoriesContainer.innerHTML = '<div class="error-message"><p>No categories available</p></div>';
        }
    } catch (error) {
        // /* console.log */('Categories Fetch Failed:', error.message);
        categoriesContainer.innerHTML = `
            <div class="error-message">
                <p>Failed to load categories. Please try again later.</p>
                <button onclick="loadCategoriesDisplay()">Retry</button>
            </div>
        `;
    }
}

// Create Category Card
function createCategoryCard(category) {
    const card = document.createElement('a');
    let href = `/categories.html?category=${encodeURIComponent(category.slug)}`;
    if (category.slug === 'mobiles' || category.slug === 'smartphones') {
        href = '/group.html?slug=mobile-page';
    }
    card.href = href;
    card.className = 'category-card';

    const icon = getCategoryIcon(category);
    const imageUrl = category.image_url || '';

    card.innerHTML = `
        <div class="category-icon-wrapper">
            ${imageUrl ? `
                <img src="${imageUrl}" alt="${category.name}" class="category-icon-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <i class="${icon} category-icon-fallback" style="display: none;"></i>
            ` : `
                <i class="${icon} category-icon-fallback"></i>
            `}
        </div>
        <div class="category-name">${category.name}</div>
    `;

    return card;
}

// Load Category Navigation using Category Root API
async function loadCategoryNavigation() {
    const navContainer = document.getElementById('navContainer');
    if (!navContainer) return;

    try {
        // /* console.log */('API Call: GET /categories/root (navigation)');
        // Use /categories/root endpoint for navigation (most efficient)
        const result = await getMakeApiCall()('/categories/root');

        // Handle API response structure per documentation
        let categoriesArray = [];

        if (result && result.success && result.data && Array.isArray(result.data)) {
            // Root categories endpoint returns array directly
            categoriesArray = result.data;
            // /* console.log */('Navigation Categories Fetched:', categoriesArray.length, 'categories');
        } else {
            // Fallback: try /categories/index if root fails
            // /* console.log */('API Call: GET /categories/index (navigation fallback)');
            const indexResult = await getMakeApiCall()('/categories/index');
            if (indexResult && indexResult.success && indexResult.data) {
                if (indexResult.data.flat && Array.isArray(indexResult.data.flat)) {
                    categoriesArray = indexResult.data.flat.filter(cat => cat.is_root === true || cat.level === 0);
                } else if (indexResult.data.tree && Array.isArray(indexResult.data.tree)) {
                    categoriesArray = indexResult.data.tree;
                }
                // /* console.log */('Navigation Categories Fetched:', categoriesArray.length, 'categories (from index)');
            }
        }

        if (categoriesArray.length > 0) {
            // Get current category from URL
            const urlParams = new URLSearchParams(window.location.search);
            const currentCategorySlug = urlParams.get('category');

            navContainer.innerHTML = '';

            // "All" button removed - categories only

            categoriesArray.slice(0, 12).forEach(category => {
                if (!category || !category.slug || !category.name) {
                    return;
                }

                const navItem = document.createElement('div');
                navItem.className = 'nav-item';
                const icon = getCategoryIcon(category);
                const imageUrl = category.image_url || '';

                // Check if this is the active category
                const isActive = currentCategorySlug === category.slug;
                const linkClass = isActive ? 'nav-link active' : 'nav-link';

                let href = `/categories.html?category=${encodeURIComponent(category.slug)}`;
                if (category.slug === 'mobiles' || category.slug === 'smartphones') {
                    href = '/group.html?slug=mobile-page';
                }

                navItem.innerHTML = `
                    <a href="${href}" class="${linkClass}" data-category="${category.slug}">
                        ${imageUrl ? `
                            <img src="${imageUrl}" alt="${category.name}" class="nav-icon-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                            <i class="${icon} nav-icon-fallback" style="display: ${imageUrl ? 'none' : 'inline'};"></i>
                        ` : `
                            <i class="${icon}"></i>
                        `}
                        <span>${category.name}</span>
                    </a>
                `;
                navContainer.appendChild(navItem);
            });
        }
    } catch (error) {
        // /* console.log */('Navigation Categories Fetch Failed:', error.message);
    }
}

// Setup Login Dropdown (reuse from app.js)
function setupLoginDropdown() {
    const loginBtn = document.getElementById('loginBtn');
    const loginDropdown = document.getElementById('loginDropdown');

    if (loginBtn && loginDropdown) {
        // Function to position dropdown
        function positionDropdown() {
            if (loginDropdown.classList.contains('show')) {
                const btnRect = loginBtn.getBoundingClientRect();
                loginDropdown.style.top = (btnRect.bottom + 8) + 'px';
                loginDropdown.style.right = (window.innerWidth - btnRect.right) + 'px';
            }
        }

        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            loginDropdown.classList.toggle('show');
            if (loginDropdown.classList.contains('show')) {
                positionDropdown();
            }
        });

        // Reposition on scroll/resize
        window.addEventListener('scroll', positionDropdown);
        window.addEventListener('resize', positionDropdown);

        document.addEventListener('click', (e) => {
            if (!loginBtn.contains(e.target) && !loginDropdown.contains(e.target)) {
                loginDropdown.classList.remove('show');
            }
        });
    }
}

// Setup More Dropdown
function setupMoreDropdown() {
    const moreOptions = document.querySelector('.more-options');
    const moreDropdown = document.querySelector('.more-dropdown');
    const moreWrapper = document.querySelector('.more-dropdown-wrapper');

    if (moreOptions && moreDropdown && moreWrapper) {
        // Function to position dropdown
        function positionMoreDropdown() {
            const btnRect = moreOptions.getBoundingClientRect();
            moreDropdown.style.top = (btnRect.bottom + 8) + 'px';
            moreDropdown.style.right = (window.innerWidth - btnRect.right) + 'px';
        }

        // Position dropdown on hover
        moreWrapper.addEventListener('mouseenter', () => {
            positionMoreDropdown();
        });

        // Reposition on scroll/resize when visible
        window.addEventListener('scroll', () => {
            if (moreDropdown.style.opacity === '1' || moreDropdown.style.visibility === 'visible') {
                positionMoreDropdown();
            }
        });

        window.addEventListener('resize', () => {
            if (moreDropdown.style.opacity === '1' || moreDropdown.style.visibility === 'visible') {
                positionMoreDropdown();
            }
        });
    }
}

// Fallback function to load category products directly
async function loadCategoryProductsDirect(categorySlug, subcategoryName = null) {
    const productsSection = document.getElementById('productsSection');
    const allProducts = document.getElementById('allProducts');
    const productsSectionTitle = document.getElementById('productsSectionTitle');

    if (!productsSection || !allProducts) {
        return;
    }

    try {
        // Show loading state
        productsSection.style.display = 'block';
        allProducts.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading products...</p></div>';

        // Fetch category details first to get name
        try {
            // /* console.log */('API Call: GET /categories/' + categorySlug);
            const categoryResult = await getMakeApiCall()(`/categories/${categorySlug}`);
            if (categoryResult && categoryResult.success && categoryResult.data && categoryResult.data.name) {
                const categoryName = categoryResult.data.name;
                if (productsSectionTitle) {
                    productsSectionTitle.textContent = subcategoryName ? `${categoryName} - ${subcategoryName}` : categoryName;
                }

                // Update breadcrumb
                const breadcrumb = document.getElementById('categoryBreadcrumb');
                if (breadcrumb) {
                    breadcrumb.innerHTML = subcategoryName ? `${categoryName} <i class="fas fa-chevron-right" style="font-size: 8px; margin: 0 4px;"></i> ${subcategoryName}` : categoryName;
                }
            }
        } catch (error) {
            // Silent error handling
        }

        // Fetch products using category products API
        // /* console.log */('API Call: GET /categories/' + categorySlug + '/products');
        const productsResult = await getMakeApiCall()(`/categories/${categorySlug}/products`);

        if (productsResult && productsResult.success && productsResult.data) {
            let products = [];

            // Handle category products API response structure
            if (productsResult.data.products && Array.isArray(productsResult.data.products)) {
                products = productsResult.data.products;
            } else if (Array.isArray(productsResult.data)) {
                products = productsResult.data;
            }

            // Client-side filtering by subcategory if provided
            if (subcategoryName && products.length > 0) {
                const subQuery = subcategoryName.toLowerCase();
                products = products.filter(p =>
                    (p.name && p.name.toLowerCase().includes(subQuery)) ||
                    (p.description && p.description.toLowerCase().includes(subQuery)) ||
                    (p.short_description && p.short_description.toLowerCase().includes(subQuery))
                );
            }

            if (products.length > 0) {
                // Clear loading spinner completely
                allProducts.innerHTML = '';

                // Update results count
                const resultsCount = document.getElementById('resultsCount');
                if (resultsCount) {
                    resultsCount.textContent = `Showing 1 - ${products.length} of ${products.length} products`;
                }

                // Store products for filtering
                if (typeof window.storeProductsForFilter === 'function') {
                    window.storeProductsForFilter(products);
                }

                // Use app.js createProductCard if available, otherwise create simple cards
                if (typeof createProductCard === 'function') {
                    products.forEach(product => {
                        const card = createProductCard(product);
                        allProducts.appendChild(card);
                    });
                } else {
                    // Simple product card creation
                    products.forEach(product => {
                        const cardHTML = `
                            <a href="/product.html?slug=${encodeURIComponent(product.slug)}" class="product-card">
                                <img src="${product.image_url || '/images/placeholder.svg'}" alt="${product.name || 'Product'}" onerror="this.src='/images/placeholder.svg'">
                                <h3>${product.name || 'Product Name'}</h3>
                                <p class="price">₹${(parseFloat(product.price) || 0).toLocaleString('en-IN')}</p>
                            </a>
                        `;
                        allProducts.insertAdjacentHTML('beforeend', cardHTML);
                    });
                }
            } else {
                allProducts.innerHTML = `
                    <div class="no-results-message" style="text-align: center; padding: 60px 20px; width: 100%; grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #fff; border-radius: 4px; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.1); margin-top: 10px;">
                        <div style="font-size: 64px; color: #f0f0f0; margin-bottom: 20px;">
                            <i class="fas fa-box-open"></i>
                        </div>
                        <h3 style="font-size: 20px; font-weight: 500; color: #212121; margin: 0 0 10px 0;">Coming Soon</h3>
                        <p style="font-size: 14px; color: #878787; margin: 0 0 24px 0;">We are currently adding new products to this category.</p>
                        <a href="/" class="browse-btn" style="display: inline-block; background: #2874f0; color: #fff; padding: 12px 32px; border-radius: 2px; text-decoration: none; font-weight: 500; font-size: 14px; box-shadow: 0 2px 4px 0 rgba(0,0,0,0.2);">Explore Other Products</a>
                    </div>
                `;
            }
        } else {
            allProducts.innerHTML = '<div class="error-message"><p>Failed to load products. Please try again.</p></div>';
        }
    } catch (error) {
        // /* console.log */('Category Products Fetch Failed:', categorySlug, error.message);
        allProducts.innerHTML = `<div class="error-message"><p>Error loading products: ${error.message}</p><button onclick="loadCategoryProductsDirect('${categorySlug}')">Retry</button></div>`;
    }
}

// Export for global access
window.loadCategoriesDisplay = loadCategoriesDisplay;
window.loadCategoryProductsDirect = loadCategoryProductsDirect;

