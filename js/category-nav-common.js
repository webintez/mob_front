// Common Category Navigation Loader
// This script ensures category navigation loads on all pages
// Uses existing API functions if available to avoid conflicts

(function () {
    'use strict';

    // Get API config - use existing if available
    function getApiConfig() {
        if (typeof API_CONFIG !== 'undefined') {
            return API_CONFIG;
        }
        return {
            baseUrl: '/api',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };
    }

    // API Helper Function - use existing makeApiCall if available, otherwise create one
    async function makeApiCallForCategories(endpoint, options = {}) {
        // If makeApiCall already exists, use it
        if (typeof makeApiCall !== 'undefined') {
            return makeApiCall(endpoint, options);
        }

        // Otherwise, create our own with timeout
        try {
            const apiConfig = getApiConfig();
            const url = `${apiConfig.baseUrl}${endpoint}`;

            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const config = {
                method: options.method || 'GET',
                headers: {
                    ...apiConfig.headers,
                    ...(options.headers || {})
                },
                signal: controller.signal
            };

            if (options.body) {
                config.body = JSON.stringify(options.body);
            }

            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            // Handle non-JSON responses gracefully
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();

                // Log API response
                console.log(`Category Nav API Response [${endpoint}]:`, result);

                if (!response.ok) {
                    throw new Error(result.message || `API request failed with status ${response.status}`);
                }

                return result;
            } else {
                // If not JSON, try to parse as text or return error
                const text = await response.text();
                throw new Error(`Invalid response format: ${text.substring(0, 100)}`);
            }
        } catch (error) {
            // Return a safe fallback instead of throwing
            // Don't log to avoid console clutter
            return { success: false, data: null, message: error.message };
        }
    }

    // Get category icon (fallback function)
    function getCategoryIcon(category) {
        if (!category) return 'fas fa-box';

        const categoryIcons = {
            'smartphones': 'fas fa-mobile-alt',
            'mobile-accessories': 'fas fa-headphones',
            'smart-watches': 'fas fa-clock',
            'laptops': 'fas fa-laptop',
            'tablets': 'fas fa-tablet-alt',
            'default': 'fas fa-box'
        };

        if (category.slug && categoryIcons[category.slug]) {
            return categoryIcons[category.slug];
        }
        return categoryIcons.default;
    }

    // Helper function to check if current page is homepage
    function isHomepagePage() {
        return window.location.pathname === '/' ||
            window.location.pathname === '/index.html' ||
            document.body.classList.contains('homepage');
    }

    // Flatten category tree structure to array
    function flattenCategoryTree(tree, result = []) {
        if (!Array.isArray(tree)) return result;

        tree.forEach(category => {
            result.push(category);
            if (category.children && Array.isArray(category.children) && category.children.length > 0) {
                flattenCategoryTree(category.children, result);
            }
        });

        return result;
    }

    // Load and display category navigation
    async function loadCategoryNavigationCommon() {
        const navContainer = document.getElementById('navContainer');
        if (!navContainer) {
            return;
        }

        // Skip on non-homepage pages - handled by secondary-menu.js
        if (!isHomepagePage()) {
            return;
        }

        // Prevent duplicate API calls - check if categories are already loading
        if (window.categoriesLoading) {
            // Wait a bit and check again
            setTimeout(() => {
                if (!window.categoryNavLoaded && navContainer.children.length === 0) {
                    // Navigation will be loaded by loadCategoryNavigationCommon
                }
            }, 500);
            return;
        }

        // Mark as loading to prevent duplicate calls
        window.categoriesLoading = true;

        try {
            // Use /categories/root endpoint for navigation menu (most efficient)
            const result = await makeApiCallForCategories('/categories/root');

            if (result && result.success && result.data && Array.isArray(result.data)) {
                // Filter active categories and sort by sort_order
                const activeCategories = result.data
                    .filter(cat => cat.is_active !== false)
                    .sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999));

                // Display categories immediately without waiting
                if (activeCategories.length > 0) {
                    updateCategoryNavigationCommon(activeCategories.slice(0, 12));
                } else {
                    // /* console.warn */('No active categories found in API response');
                    updateCategoryNavigationCommon([]);
                }

                // Load full index in background (non-blocking) for breadcrumb generation
                makeApiCallForCategories('/categories/index').then(indexResult => {
                    if (indexResult && indexResult.success && indexResult.data && indexResult.data.flat) {
                        window.flatCategories = indexResult.data.flat;
                    }
                }).catch(() => {
                    // Silently fail - breadcrumbs can work without this
                });
            } else {
                // Fallback: try /categories/index if root fails
                const indexResult = await makeApiCallForCategories('/categories/index');
                if (indexResult && indexResult.success && indexResult.data) {
                    let categoriesArray = [];

                    if (indexResult.data.flat && Array.isArray(indexResult.data.flat)) {
                        categoriesArray = indexResult.data.flat.filter(cat =>
                            (cat.is_root === true || cat.level === 0) && cat.is_active !== false
                        );
                    } else if (indexResult.data.tree && Array.isArray(indexResult.data.tree)) {
                        categoriesArray = indexResult.data.tree.filter(cat => cat.is_active !== false);
                    }

                    window.flatCategories = indexResult.data.flat || [];

                    if (categoriesArray.length > 0) {
                        const sortedCategories = categoriesArray
                            .sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999));
                        updateCategoryNavigationCommon(sortedCategories.slice(0, 12));
                    } else {
                        updateCategoryNavigationCommon([]);
                    }
                } else {
                    updateCategoryNavigationCommon([]);
                }
            }
        } catch (error) {
            // Silently handle error - show at least "All" button
            // Don't log to avoid console clutter
            updateCategoryNavigationCommon([]);
        } finally {
            // Mark as no longer loading and as loaded
            window.categoriesLoading = false;
            window.categoryNavLoaded = true;
        }
    }

    // Cache for subcategories to avoid reloading
    const subcategoriesCache = new Map();

    // Load subcategories for a category
    async function loadSubcategories(categorySlug) {
        // Check cache first
        if (subcategoriesCache.has(categorySlug)) {
            return subcategoriesCache.get(categorySlug);
        }

        try {
            const result = await makeApiCallForCategories(`/categories/${categorySlug}/children`);
            if (result && result.success && result.data) {
                const subcategories = Array.isArray(result.data) ? result.data : [];
                // Cache the result
                subcategoriesCache.set(categorySlug, subcategories);
                return subcategories;
            }
        } catch (error) {
            // Silently fail
        }

        const emptyResult = [];
        subcategoriesCache.set(categorySlug, emptyResult);
        return emptyResult;
    }

    // Setup lazy dropdown loading (only load on hover)
    function setupLazyDropdown(navItem, category) {
        // Ensure this only runs on non-homepage pages
        if (isHomepagePage()) {
            return;
        }

        let dropdownCreated = false;
        let isLoading = false;

        navItem.addEventListener('mouseenter', async () => {
            // Only create dropdown once and if not already loading
            if (!dropdownCreated && !isLoading) {
                isLoading = true;

                // Check if dropdown already exists
                const existingDropdown = navItem.querySelector('.category-dropdown');
                if (existingDropdown) {
                    dropdownCreated = true;
                    isLoading = false;
                    return;
                }

                try {
                    const dropdown = await createCategoryDropdown(category);
                    navItem.appendChild(dropdown);
                    dropdownCreated = true;
                } catch (error) {
                    // Silently fail
                } finally {
                    isLoading = false;
                }
            }
        });

        // Keep dropdown visible when hovering over it
        navItem.addEventListener('mouseleave', (e) => {
            const dropdown = navItem.querySelector('.category-dropdown');
            if (dropdown) {
                // Check if mouse is moving to dropdown
                const relatedTarget = e.relatedTarget;
                if (relatedTarget && dropdown.contains(relatedTarget)) {
                    return; // Keep dropdown visible
                }
            }
        });
    }

    // Load brands
    async function loadBrands() {
        try {
            const result = await makeApiCallForCategories('/brands?per_page=50');
            if (result && result.success && result.data) {
                return Array.isArray(result.data) ? result.data : (result.data.brands || []);
            }
        } catch (error) {
            // Silently fail
        }
        return [];
    }

    // Create dropdown menu for a category (only subcategories, no filters)
    async function createCategoryDropdown(category) {
        const dropdown = document.createElement('div');
        dropdown.className = 'category-dropdown';
        dropdown.setAttribute('data-category', category.slug);

        // Load subcategories only
        const subcategories = await loadSubcategories(category.slug);

        // Create dropdown content
        const content = document.createElement('div');
        content.className = 'category-dropdown-content';

        // Subcategories columns only (no filters, no featured)
        const subcategoriesContainer = document.createElement('div');
        subcategoriesContainer.className = 'dropdown-subcategories';

        if (subcategories.length > 0) {
            // Group subcategories into columns (max 4 columns for better layout)
            const itemsPerColumn = Math.ceil(subcategories.length / 4);
            const numColumns = Math.min(4, Math.ceil(subcategories.length / itemsPerColumn));

            for (let i = 0; i < numColumns; i++) {
                const column = document.createElement('div');
                column.className = 'subcategory-column';
                const startIdx = i * itemsPerColumn;
                const endIdx = Math.min(startIdx + itemsPerColumn, subcategories.length);
                const columnSubcategories = subcategories.slice(startIdx, endIdx);

                if (columnSubcategories.length > 0) {
                    column.innerHTML = `
                        <div class="subcategory-column-title">${i === 0 ? category.name : ''}</div>
                        <ul class="subcategory-list">
                            ${columnSubcategories.map(subcat => `
                                <li class="subcategory-item">
                                    <a href="/categories.html?category=${encodeURIComponent(subcat.slug)}" class="subcategory-link">${subcat.name}</a>
                                </li>
                            `).join('')}
                        </ul>
                    `;
                    subcategoriesContainer.appendChild(column);
                }
            }
        } else {
            // If no subcategories, show main category link
            let viewAllHref = `/categories.html?category=${encodeURIComponent(category.slug)}`;
            if (category.slug === 'mobiles' || category.slug === 'smartphones') {
                viewAllHref = '/mobiles.html';
            }

            subcategoriesContainer.innerHTML = `
                    <div class="subcategory-column">
                        <div class="subcategory-column-title">${category.name}</div>
                        <ul class="subcategory-list">
                            <li class="subcategory-item">
                                <a href="${viewAllHref}" class="subcategory-link">View All ${category.name}</a>
                            </li>
                    </ul>
                </div>
            `;
        }

        content.appendChild(subcategoriesContainer);

        dropdown.appendChild(content);
        return dropdown;
    }

    // Update category navigation display
    function updateCategoryNavigationCommon(categories) {
        const navContainer = document.getElementById('navContainer');
        if (!navContainer) {
            return;
        }

        // Get current category from URL
        const urlParams = new URLSearchParams(window.location.search);
        const currentCategorySlug = urlParams.get('category');

        // Check if homepage using helper function
        const isHomepage = isHomepagePage();

        // Only create dropdowns for non-homepage pages
        const createDropdowns = !isHomepage;

        navContainer.innerHTML = '';

        const fragment = document.createDocumentFragment();

        // Add categories with icons and images from API
        if (categories && categories.length > 0) {
            // Display categories immediately without waiting for dropdowns
            categories.forEach(category => {
                if (!category || !category.slug || !category.name) {
                    return;
                }

                const navItem = document.createElement('div');
                navItem.className = 'nav-item';
                // Use API icon if available, otherwise fallback to getCategoryIcon
                const icon = category.icon || getCategoryIcon(category);
                const imageUrl = category.image_url || '';

                // Check if this is the active category
                const isActive = currentCategorySlug === category.slug;
                const linkClass = isHomepage ? (isActive ? 'nav-link active' : 'nav-link') : (isActive ? 'nav-link active' : 'nav-link');

                // For homepage, show icons/images. For other pages, show Flipkart-style text with chevron
                let href = `/categories.html?category=${encodeURIComponent(category.slug)}`;
                if (category.slug === 'mobiles' || category.slug === 'smartphones') {
                    href = '/group.html?slug=mobile-page';
                }

                if (isHomepage) {
                    navItem.innerHTML = `
                        <a href="${href}" class="${linkClass}" data-category="${category.slug}">
                            ${imageUrl ? `<img src="${imageUrl}" alt="${category.name}" class="nav-icon-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                            <i class="${icon} nav-icon-fallback" style="display: ${imageUrl ? 'none' : 'inline'};"></i>` : `<i class="${icon}"></i>`}
                            <span>${category.name}</span>
                        </a>
                    `;
                } else {
                    // Flipkart-style: text only with chevron
                    navItem.innerHTML = `
                        <a href="${href}" class="${linkClass}" data-category="${category.slug}">
                            <span>${category.name}</span>
                            <i class="fas fa-chevron-down"></i>
                        </a>
                    `;
                }

                // Setup lazy dropdown loading for non-homepage pages (load on hover)
                if (createDropdowns) {
                    setupLazyDropdown(navItem, category);
                }

                fragment.appendChild(navItem);
            });
        }

        navContainer.appendChild(fragment);
    }

    // Setup dropdowns for existing navigation items (if navigation was loaded by another script)
    function setupDropdownsForExistingNav() {
        if (isHomepagePage()) {
            return; // Don't setup dropdowns on homepage
        }

        const navContainer = document.getElementById('navContainer');
        if (!navContainer) return;

        const navItems = navContainer.querySelectorAll('.nav-item:not([data-dropdown-setup])');
        if (navItems.length === 0) return;

        // Get categories from existing nav items
        navItems.forEach(navItem => {
            const link = navItem.querySelector('a[data-category]');
            if (!link) return;

            const categorySlug = link.getAttribute('data-category');
            if (!categorySlug || categorySlug === 'all') return;

            // Extract category name from link text (remove chevron icon if present)
            let categoryName = '';
            const span = link.querySelector('span');
            if (span) {
                categoryName = span.textContent.trim();
            } else {
                // Fallback: get text and remove chevron
                categoryName = link.textContent.trim();
                const chevron = link.querySelector('.fa-chevron-down');
                if (chevron) {
                    categoryName = categoryName.replace(chevron.textContent || '', '').trim();
                }
            }

            // Create a category object from the link
            const category = {
                slug: categorySlug,
                name: categoryName || categorySlug
            };

            // Setup dropdown for this item
            setupLazyDropdown(navItem, category);
            navItem.setAttribute('data-dropdown-setup', 'true');
        });
    }

    // Initialize on page load
    function initCategoryNav() {
        const navContainer = document.getElementById('navContainer');
        if (navContainer) {
            // Ensure nav-menu is visible
            const navMenu = navContainer.closest('.nav-menu');
            if (navMenu && !navMenu.classList.contains('homepage-hidden')) {
                navMenu.style.display = 'flex';
                navMenu.style.visibility = 'visible';
                navMenu.style.opacity = '1';
            }

            // Check if navContainer is empty or if categories haven't been loaded
            const isEmpty = navContainer.children.length === 0 || navContainer.innerHTML.trim() === '';
            const notLoadedByOtherScript = !window.categoryNavLoaded &&
                !navContainer.querySelector('.nav-item') &&
                !navContainer.querySelector('.secondary-menu-item');

            if (isEmpty || notLoadedByOtherScript) {
                const isHomepage = isHomepagePage();

                // Load categories immediately (non-blocking)
                // Don't mark as loaded yet - let the function handle it
                loadCategoryNavigationCommon().catch(() => {
                    // If loading fails, mark as loaded
                    window.categoryNavLoaded = true;
                });
            } else {
                // Navigation already loaded by another script, setup dropdowns for existing items
                setTimeout(() => {
                    setupDropdownsForExistingNav();
                }, 100);
            }
        }
    }

    // Run on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCategoryNav);
    } else {
        initCategoryNav();
    }

    // Also try loading after a short delay in case DOM isn't ready
    setTimeout(() => {
        const navContainer = document.getElementById('navContainer');
        if (navContainer) {
            if (!window.categoryNavLoaded || navContainer.children.length === 0) {
                const isEmpty = navContainer.children.length === 0 || navContainer.innerHTML.trim() === '';
                if (isEmpty && !window.categoriesLoading) {
                    loadCategoryNavigationCommon().catch(() => {
                        window.categoryNavLoaded = true;
                    });
                }
            } else {
                // Navigation exists, ensure dropdowns are setup for non-homepage pages
                if (!isHomepagePage()) {
                    setupDropdownsForExistingNav();
                }
            }
        }
    }, 100);
})();
