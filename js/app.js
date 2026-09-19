// API Configuration
// Using relative path to proxy through Node.js server (avoids CORS issues and handles API key securely)
const API_CONFIG = {
    baseUrl: '/api',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
};

// Global state
let currentPage = 1;
let isLoading = false;
let hasMorePages = true;
let cartCount = 0;
let categories = [];
let brands = [];
let currentCategory = null;
let currentBrand = null;
let currentTag = null;
let searchQuery = '';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Initialize application
async function initApp() {
    try {
        // Load categories for navigation (non-blocking)
        // Load categories for navigation (non-blocking)
        loadCategories().catch(err => console.error('Categories load error:', err)); // Log enabled

        // Load homepage categories from Menu API (non-blocking)
        loadHomepageMenus().catch(err => console.error('Homepage menus load error:', err)); // Log enabled

        // Load brands (non-blocking)
        loadBrands().catch(err => console.error('Brands load error:', err)); // Log enabled

        // Load featured products (non-blocking)
        loadFeaturedProducts().catch(err => console.error('Featured products load error:', err)); // Log enabled

        // Load active flash sales (non-blocking)
        loadFlashSales().catch(err => console.error('Flash sales load error:', err));

        // Load Dynamic Sections (Main Homepage Content)
        fetchAndRenderDynamicSections().catch(err => console.error('Dynamic sections render error:', err));

        // Load recently viewed products (only if user is logged in)
        // Try loading even if not authenticated to test (will check inside function)
        loadRecentlyViewedProducts();

        // Initialize infinite scroll for all products
        initInfiniteScroll();

        // Setup search functionality (Handled by search-common.js)
        // setupSearch();

        // Setup category navigation
        setupCategoryNavigation();

        // Setup login dropdown
        setupLoginDropdown();

        // Setup more dropdown
        setupMoreDropdown();
    } catch (error) {
        // /* console.log */('App initialization error:', error.message);
        // Ensure page is still usable even if initialization fails
    }
}

// In-flight request deduplication map
const inFlightApiRequests = new Map();

// API Helper Function with timeout, retries, and local storage fallback
async function makeApiCall(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const requestKey = `${method}:${endpoint}`;

    // Share identical concurrent GET requests
    if (method === 'GET' && inFlightApiRequests.has(requestKey)) {
        return inFlightApiRequests.get(requestKey);
    }

    const executeCall = async () => {
        const timeout = options.timeout || 15000; // Increased to 15s default
        const maxRetries = options.maxRetries ?? (method === 'GET' ? 2 : 0);
        const retryDelay = options.retryDelay || 1000;

        // Map endpoints to local cache keys
        const cacheMap = {
            '/categories/index': 'cache_categories_index',
            '/brands': 'cache_brands',
            '/banners': 'cache_banners',
            '/flash-sales/active': 'cache_flash_sales_active',
            '/menus': 'cache_menus'
        };
        
        // Check if endpoint has matching cache key
        let cacheKey = options.cacheKey;
        if (!cacheKey && method === 'GET') {
            const cleanPath = endpoint.split('?')[0];
            if (cacheMap[cleanPath]) {
                cacheKey = cacheMap[cleanPath];
            } else if (cleanPath.startsWith('/section-groups/')) {
                cacheKey = `cache_sec_group_${cleanPath.replace('/section-groups/', '')}`;
            }
        }

        let attempt = 0;
        while (true) {
            try {
                const url = `${API_CONFIG.baseUrl}${endpoint}`;
                const config = {
                    method: options.method || 'GET',
                    headers: {
                        ...API_CONFIG.headers,
                        ...(options.headers || {})
                    }
                };

                if (options.body) {
                    config.body = JSON.stringify(options.body);
                }

                // Create timeout promise
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Request timeout')), timeout);
                });

                // Race between fetch and timeout
                const response = await Promise.race([
                    fetch(url, config),
                    timeoutPromise
                ]);

                // Handle non-JSON responses
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('Invalid response format');
                }

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || `API request failed with status ${response.status}`);
                }

                // Save successful response to cache
                if (cacheKey) {
                    try {
                        localStorage.setItem(cacheKey, JSON.stringify({
                            data: result,
                            timestamp: Date.now()
                        }));
                    } catch (e) {
                        // Suppress local storage save error warnings
                    }
                }

                return result;
            } catch (error) {
                attempt++;
                const isRetryableError = error.message === 'Request timeout' || 
                                         error.message.includes('Network') || 
                                         error.message.includes('fetch');

                if (attempt <= maxRetries && isRetryableError) {
                    const backoff = retryDelay * Math.pow(2, attempt - 1);
                    console.warn(`[API Retry] ${endpoint} failed (Attempt ${attempt}/${maxRetries}). Retrying in ${backoff}ms... Error: ${error.message}`);
                    await new Promise(resolve => setTimeout(resolve, backoff));
                    continue;
                }

                // Fallback to cached data if network fails/times out
                if (cacheKey) {
                    try {
                        const cached = localStorage.getItem(cacheKey);
                        if (cached) {
                            const parsed = JSON.parse(cached);
                            console.warn(`[API Fallback] Endpoint ${endpoint} failed. Loaded cached data from ${new Date(parsed.timestamp).toLocaleDateString()}`);
                            return parsed.data;
                        }
                    } catch (e) {
                        // Suppress cache read warnings
                    }
                }

                console.error('API Call Failed:', endpoint, error.message);
                throw error;
            }
        }
    };

    if (method === 'GET') {
        const promise = executeCall().finally(() => {
            inFlightApiRequests.delete(requestKey);
        });
        inFlightApiRequests.set(requestKey, promise);
        return promise;
    }

    return executeCall();
}

// Expose globally
window.makeApiCall = makeApiCall;


// Load Categories using new Category Index API
async function loadCategories() {
    try {
        const result = await makeApiCall('/categories/index');
        if (window.innerWidth <= 768) {
            console.log('Categories Index API Response:', result);
        }

        if (result && result.success && result.data) {
            // Use flat array from API response (per API documentation)
            if (result.data.flat && Array.isArray(result.data.flat)) {
                categories = result.data.flat;
            } else if (result.data.tree && Array.isArray(result.data.tree)) {
                // Fallback: flatten tree structure if flat is not available
                categories = flattenCategoryTree(result.data.tree);
            } else {
                categories = [];
            }

            // Store tree structure for navigation menus if available
            if (result.data.tree) {
                window.categoryTree = result.data.tree;
            }

            // Store flat structure globally for breadcrumbs and filtering
            window.flatCategories = categories;

            if (categories && categories.length > 0) {
                updateCategoryNavigation();
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
        result.push(category);
        if (category.children && Array.isArray(category.children) && category.children.length > 0) {
            flattenCategoryTree(category.children, result);
        }
    });

    return result;
}

// Category Icons Mapping
const categoryIcons = {
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

// Get Category Icon
function getCategoryIcon(category) {
    if (category.icon) {
        return category.icon;
    }
    const slug = category.slug || '';
    for (const [key, icon] of Object.entries(categoryIcons)) {
        if (slug.includes(key)) {
            return icon;
        }
    }
    return categoryIcons.default;
}

// Update Category Navigation
function updateCategoryNavigation() {
    const navContainer = document.querySelector('.nav-container');
    if (!navContainer) return;

    // Skip on non-homepage pages (handled by secondary-menu.js)
    const isHomepage = window.location.pathname === '/' || window.location.pathname === '/index.html' || document.body.classList.contains('homepage');
    if (!isHomepage) return;

    // Clear existing items
    navContainer.innerHTML = '';

    const fragment = document.createDocumentFragment();

    // "All" button removed - categories only

    // Add categories with icons and images from API
    if (categories && categories.length > 0) {
        // Filter to root categories only and sort by sort_order
        const rootCategories = categories
            .filter(cat => (cat.is_root === true || cat.level === 0) && cat.is_active !== false)
            .sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999))
            .slice(0, 12);

        rootCategories.forEach(category => {
            const navItem = document.createElement('div');
            navItem.className = 'nav-item';
            // Use API icon if available, otherwise fallback to getCategoryIcon
            const icon = category.icon || getCategoryIcon(category);
            const imageUrl = category.image_url || '';

            // Check if this is the active category
            const isActive = currentCategorySlug === category.slug;
            const linkClass = isActive ? 'nav-link active' : 'nav-link';

            // CRITICAL OVERRIDE: Link Mobiles directly to its dedicated page
            let href = `/categories.html?category=${encodeURIComponent(category.slug)}`;
            if (category.slug === 'mobiles' || category.slug === 'smartphones') {
                href = '/group.html?slug=mobile-page';
            }

            navItem.innerHTML = `
                <a href="${href}" class="${linkClass}" data-category="${category.slug}">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${category.name}" class="nav-icon-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                    <i class="${icon} nav-icon-fallback" style="display: ${imageUrl ? 'none' : 'inline'};"></i>` : `<i class="${icon}"></i>`}
                    <span>${category.name}</span>
                </a>
            `;
            fragment.appendChild(navItem);
        });
    }

    navContainer.appendChild(fragment);
}

// Load Menus from Menu API for Homepage Categories Section
async function loadHomepageMenus() {
    const categoriesNavContainer = document.getElementById('homepageCategoriesNav');
    if (!categoriesNavContainer) return;

    // Skip client-side load if menus were already pre-rendered by Express SSR
    if (categoriesNavContainer.querySelector('.homepage-category-item')) {
        console.log('Categories pre-rendered by Express server. Skipping client fetch.');
        return;
    }

    try {
        const result = await makeApiCall('/menus', { timeout: 8000 });
        if (window.innerWidth <= 768) {
            console.log('Homepage Menus API Response:', result.data);
        }

        if (result && result.success && result.data && Array.isArray(result.data)) {
            const menus = result.data;

            // Clear loading spinner
            categoriesNavContainer.innerHTML = '';

            // Display menus in order (already sorted by display_order from API)
            menus.forEach((menu, index) => {
                // Mark first item as active by default on homepage
                const isActive = index === 0;
                const menuItem = createHomepageMenuItem(menu, isActive);
                if (menuItem) {
                    categoriesNavContainer.appendChild(menuItem);
                }
            });

            // If no menus found, show a message but keep the section visible
            if (menus.length === 0) {
                categoriesNavContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #666; width: 100%;">No menu items available. Please add menus from the admin panel.</div>';
            }
        } else {
            throw new Error('Invalid menu API response');
        }
    } catch (error) {
        // /* console.log */('Menus Fetch Failed:', error.message);
        // Show error message
        categoriesNavContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Unable to load menu items</p>';
    }
}

// Create a homepage menu item element
function createHomepageMenuItem(menu, isActive = false) {
    if (!menu || !menu.name) return null;

    // Determine the URL based on menu type
    let href = '#';

    // CRITICAL OVERRIDE: Link Mobiles directly to its dedicated page
    if (menu.name && (menu.name.toLowerCase() === 'mobiles' || menu.name.toLowerCase() === 'smartphones')) {
        href = '/group.html?slug=mobile-page';
    } else if (menu.url && menu.url.trim() !== '') {
        // Use the URL from the API if provided
        href = menu.url;
    } else {
        // Fallback URLs based on type if no URL is provided
        switch (menu.type) {
            case 'category':
                // If it's a category type, try to construct category URL from name
                const categorySlug = menu.name.toLowerCase().replace(/\s+/g, '-');
                href = `/categories.html?category=${encodeURIComponent(categorySlug)}`;
                break;
            case 'page':
                // If it's a page type, use /page/{slug} format
                const pageSlug = menu.name.toLowerCase().replace(/\s+/g, '-');
                href = `/page/${encodeURIComponent(pageSlug)}`;
                break;
            case 'link':
            case 'custom':
            default:
                // For link and custom types, use home if no URL
                href = menu.url || '/';
        }
    }

    // Get icon based on menu type or use default
    const icon = getMenuIcon(menu);

    // Create the menu item as an anchor tag (matches existing CSS structure)
    const menuItem = document.createElement('a');
    menuItem.href = href;
    menuItem.className = `homepage-category-item ${isActive ? 'active' : ''}`;
    menuItem.setAttribute('data-menu-id', menu.id);
    menuItem.setAttribute('data-menu-type', menu.type || 'link');

    // Build the icon HTML - match existing structure with icon-wrapper
    let iconHtml = '';
    if (menu.image_url) {
        iconHtml = `
            <img src="${escapeHtml(menu.image_url)}" 
                 alt="${escapeHtml(menu.name)}" 
                 class="homepage-category-icon-image" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <i class="${icon} homepage-category-icon-fallback" style="display: none;"></i>
        `;
    } else {
        iconHtml = `<i class="${icon} homepage-category-icon-fallback"></i>`;
    }

    // Check if menu has dropdown indicator (for categories with children or brands)
    const hasDropdown = menu.type === 'category' || menu.name.toLowerCase().includes('brand');
    const dropdownIcon = hasDropdown ? '<i class="fas fa-chevron-down" style="font-size: 10px; margin-left: 4px;"></i>' : '';

    // Match the existing HTML structure from createHomepageCategoryItem
    menuItem.innerHTML = `
        <div class="homepage-category-icon-wrapper">
            ${iconHtml}
        </div>
        <span class="homepage-category-name">${escapeHtml(menu.name)}${dropdownIcon}</span>
    `;

    return menuItem;
}

// Get icon for menu item based on type and name
function getMenuIcon(menu) {
    if (!menu) return 'fas fa-box';

    // Icon mapping based on menu name (case-insensitive)
    const menuName = (menu.name || '').toLowerCase();
    const menuType = (menu.type || '').toLowerCase();

    const iconMap = {
        'home': 'fas fa-home',
        'smartphones': 'fas fa-mobile-alt',
        'mobile accessories': 'fas fa-headphones',
        'mobile-accessories': 'fas fa-headphones',
        'smart watches': 'fas fa-clock',
        'smart-watches': 'fas fa-clock',
        'laptops': 'fas fa-laptop',
        'tablets': 'fas fa-tablet-alt',
        'brands': 'fas fa-tags',
        'sell your phone': 'fas fa-mobile-alt',
        'sell': 'fas fa-mobile-alt',
        'mobile repair': 'fas fa-tools',
        'repair': 'fas fa-tools',
        'our stores': 'fas fa-store',
        'stores': 'fas fa-store',
        'about us': 'fas fa-info-circle',
        'contact': 'fas fa-envelope',
        'products': 'fas fa-box',
        'categories': 'fas fa-th-large'
    };

    // Check by menu name first
    if (iconMap[menuName]) {
        return iconMap[menuName];
    }

    // Check by type
    if (menuType === 'category') {
        return 'fas fa-folder';
    } else if (menuType === 'page') {
        return 'fas fa-file-alt';
    } else if (menuType === 'link') {
        return 'fas fa-link';
    }

    // Default icon
    return 'fas fa-box';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Category Mapping for Homepage with Real Images from Internet (DEPRECATED - kept for fallback)
const homepageCategoryMapping = {
    'smartphones': {
        name: 'Smart Phone',
        slug: 'smartphones',
        image: 'https://rukminim2.flixcart.com/fk-p-flap/64/64/image/5f2ee7f883cdb774.png?q=100'
    },
    'mobile-accessories': {
        name: 'Accessories',
        slug: 'mobile-accessories',
        image: 'https://rukminim2.flixcart.com/fk-p-flap/64/64/image/ff559cb9d803d424.png?q=100'
    },
    'smart-watches': {
        name: 'Smart Watches',
        slug: 'smart-watches',
        image: 'https://rukminim2.flixcart.com/fk-p-flap/64/64/image/af646c36d74c4be9.png?q=100'
    },
    'brands': {
        name: 'Brands',
        slug: 'brands',
        link: '/categories.html',
        image: 'https://rukminim2.flixcart.com/fk-p-flap/64/64/image/1788f177649e6991.png?q=100'
    },
    'laptops': {
        name: 'Laptop',
        slug: 'laptops',
        image: 'https://rukminim2.flixcart.com/fk-p-flap/64/64/image/e90944802d996756.jpg?q=100'
    },
    'sell': {
        name: 'Sell Your Phone',
        slug: 'sell',
        link: '/sell',
        icon: 'fas fa-hand-holding-usd',
        image: 'https://rukminim2.flixcart.com/fk-p-flap/64/64/image/3c647c2e0d937dc5.png?q=100'
    },
    'repair': {
        name: 'Mobile Repair',
        slug: 'repair',
        link: '/repair',
        icon: 'fas fa-tools',
        image: 'https://rukminim2.flixcart.com/fk-p-flap/64/64/image/b3020c99672953b9.png?q=100'
    },
    'stores': {
        name: 'Our Stores',
        slug: 'stores',
        link: '/stores',
        icon: 'fas fa-store',
        image: 'https://rukminim2.flixcart.com/fk-p-flap/64/64/image/e730a834ad950bae.png?q=100'
    }
};

// Load Homepage Categories with Real Images
async function loadHomepageCategoriesWithImages() {
    const categoriesNavContainer = document.getElementById('homepageCategoriesNav');
    if (!categoriesNavContainer) return;

    try {
        // /* console.log */('API Call: GET /categories/index (homepage)');
        const result = await makeApiCall('/categories/index', { timeout: 8000 });
        if (window.innerWidth <= 768) {
            console.log('Homepage Categories API Response:', result);
        }
        let apiCategories = [];

        if (result && result.success && result.data) {
            // Use flat array from API response (per API documentation)
            if (result.data.flat && Array.isArray(result.data.flat)) {
                apiCategories = result.data.flat;
            } else if (result.data.tree && Array.isArray(result.data.tree)) {
                apiCategories = flattenCategoryTree(result.data.tree);
            } else {
                apiCategories = [];
            }
        }

        // Create a map of categories by slug for quick lookup
        const categoryMap = {};
        apiCategories.forEach(cat => {
            categoryMap[cat.slug] = cat;
        });

        categoriesNavContainer.innerHTML = '';

        // Create homepage categories in order
        const homepageCategories = [
            { key: 'smartphones', isActive: true },
            { key: 'mobile-accessories' },
            { key: 'smart-watches' },
            { key: 'brands' },
            { key: 'laptops' },
            { key: 'sell' },
            { key: 'repair' },
            { key: 'stores' }
        ];

        homepageCategories.forEach((catConfig, index) => {
            const mapping = homepageCategoryMapping[catConfig.key];
            // Try to find API category by mapping slug first, then by key
            let apiCategory = categoryMap[mapping.slug] || categoryMap[catConfig.key];

            // If still not found, search by name (case-insensitive)
            if (!apiCategory && mapping.name) {
                apiCategory = apiCategories.find(cat =>
                    cat.name && cat.name.toLowerCase() === mapping.name.toLowerCase()
                );
            }

            const categoryItem = createHomepageCategoryItem(
                mapping,
                apiCategory,
                catConfig.isActive || false,
                catConfig.key
            );
            categoriesNavContainer.appendChild(categoryItem);
        });
    } catch (error) {
        // /* console.log */('Homepage Categories Fetch Failed:', error.message);
        // Clear loading state and show fallback
        categoriesNavContainer.innerHTML = '';
        loadHomepageCategoriesFallback();
    }
}

// Create Homepage Category Item with Real Images
function createHomepageCategoryItem(mapping, apiCategory, isActive = false, categoryKey = '') {
    const item = document.createElement('a');
    // Use API category slug if available, otherwise use mapping slug
    const categorySlug = apiCategory?.slug || mapping.slug;
    const link = mapping.link || `/categories.html?category=${categorySlug}`;
    item.href = link;
    item.className = `homepage-category-item ${isActive ? 'active' : ''}`;

    // Priority: 1. API category image_url, 2. Mapping image (from internet), 3. Icon
    const imageUrl = apiCategory?.image_url || mapping.image || '';
    // Use API icon if available, otherwise use mapping icon or fallback
    const icon = apiCategory?.icon || mapping.icon || getCategoryIcon(apiCategory || { slug: mapping.slug });
    // Use API category name if available, otherwise use mapping name
    const categoryName = apiCategory?.name || mapping.name;
    const hasDropdown = categoryKey === 'brands';

    item.innerHTML = `
        <div class="homepage-category-icon-wrapper">
            ${imageUrl ? `
                <img src="${imageUrl}" alt="${categoryName}" class="homepage-category-icon-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <i class="${icon} homepage-category-icon-fallback" style="display: none;"></i>
            ` : `
                <i class="${icon} homepage-category-icon-fallback"></i>
            `}
        </div>
        <span class="homepage-category-name">${categoryName}${hasDropdown ? '<i class="fas fa-chevron-down" style="font-size: 10px; margin-left: 4px;"></i>' : ''}</span>
    `;

    return item;
}

// Fallback if API fails
function loadHomepageCategoriesFallback() {
    const categoriesNavContainer = document.getElementById('homepageCategoriesNav');
    if (!categoriesNavContainer) return;

    const fallbackCategories = [
        { name: 'Smart Phone', slug: 'smartphones', icon: 'fas fa-mobile-alt', link: '/', active: true },
        { name: 'Accessories', slug: 'mobile-accessories', icon: 'fas fa-headphones', link: '/categories.html?category=mobile-accessories' },
        { name: 'Smart Watches', slug: 'smart-watches', icon: 'fas fa-clock', link: '/categories.html?category=smart-watches' },
        { name: 'Brands', slug: 'brands', icon: 'fas fa-star', link: '/categories.html', hasDropdown: true },
        { name: 'Laptop', slug: 'laptops', icon: 'fas fa-laptop', link: '/categories.html?category=laptops' },
        { name: 'Sell Your Phone', slug: 'sell', icon: 'fas fa-hand-holding-usd', link: '/sell' },
        { name: 'Mobile Repair', slug: 'repair', icon: 'fas fa-tools', link: '/repair' },
        { name: 'Our Stores', slug: 'stores', icon: 'fas fa-store', link: '/stores' }
    ];

    categoriesNavContainer.innerHTML = '';
    fallbackCategories.forEach(cat => {
        const item = document.createElement('a');
        item.href = cat.link;
        item.className = `homepage-category-item ${cat.active ? 'active' : ''}`;
        item.innerHTML = `
            <div class="homepage-category-icon-wrapper">
                <i class="${cat.icon} homepage-category-icon-fallback"></i>
            </div>
            <span class="homepage-category-name">${cat.name}${cat.hasDropdown ? '<i class="fas fa-chevron-down" style="font-size: 10px; margin-left: 4px;"></i>' : ''}</span>
        `;
        categoriesNavContainer.appendChild(item);
    });
}

// Setup Category Navigation
function setupCategoryNavigation() {
    document.addEventListener('click', (e) => {
        const navLink = e.target.closest('.nav-link[data-category]');
        if (navLink) {
            e.preventDefault();
            const categorySlug = navLink.getAttribute('data-category');

            // Redirect to categories page
            if (categorySlug === 'all') {
                window.location.href = '/';
            } else {
                window.location.href = `/categories.html?category=${categorySlug}`;
            }
        }
    });
}

// Setup Login Dropdown
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

        // Close dropdown when clicking outside
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

// Load Brands
async function loadBrands() {
    try {
        const result = await makeApiCall('/brands');
        if (window.innerWidth <= 768) {
            console.log('Brands List API Response:', result);
        }

        if (result.success && result.data && result.data.length > 0) {
            brands = result.data;
        } else {
        }
    } catch (error) {
        // Silent error handling
        console.error('Brands Fetch Error:', error.message);
    }
}

// Load Banners with Carousel
async function loadBanners() {
    const bannerContainer = document.getElementById('bannerContainer');
    if (!bannerContainer) return;

    try {
        const result = await makeApiCall('/banners', { timeout: 8000 });
        if (window.innerWidth <= 768) {
            console.log('Banners API Response:', result.data);
        }

        if (result.success && result.data && result.data.length > 0) {
            bannerContainer.innerHTML = '';

            // Create carousel wrapper
            const carousel = document.createElement('div');
            carousel.className = 'banner-carousel';
            carousel.style.cssText = 'position: relative; width: 100%; overflow: hidden;';

            const slides = document.createElement('div');
            slides.className = 'banner-slides';
            slides.style.cssText = 'display: flex; transition: transform 0.5s ease;';

            result.data.forEach((banner, index) => {
                const slide = document.createElement('div');
                slide.className = 'banner-slide';

                const link = document.createElement('a');
                link.href = banner.link_url || '#';
                link.style.cssText = 'display: block; width: 100%; height: 100%;';

                const img = document.createElement('img');
                img.src = banner.image_url || banner.url;
                img.alt = banner.title || 'Banner';
                img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; display: block;';
                img.onerror = function () {
                    this.style.display = 'none';
                };

                link.appendChild(img);
                slide.appendChild(link);
                slides.appendChild(slide);
            });

            carousel.appendChild(slides);

            // Auto-rotate banners (without dots)
            if (result.data.length > 1) {
                let currentSlide = 0;
                setInterval(() => {
                    currentSlide = (currentSlide + 1) % result.data.length;
                    slides.style.transform = `translateX(-${currentSlide * 100}%)`;
                }, 5000);
            }

            bannerContainer.appendChild(carousel);
        } else {
            bannerContainer.innerHTML = '<div class="banner-loading">No banners available</div>';
        }
    } catch (error) {
        // Always clear loading state on error
        bannerContainer.innerHTML = `
            <div class="error-message">
                <p>Failed to load banners. Please try again later.</p>
                <button onclick="loadBanners()">Retry</button>
            </div>
        `;
    }
}

// Load Featured Products (Carousel Style)
async function loadFlashSales() {
    const flashSaleSection = document.getElementById('flashSaleSection');
    const container = document.getElementById('flashSaleCardContainer');
    if (!flashSaleSection || !container) return;

    // Use original console.log to bypass global override if present
    const logFn = window.originalConsoleLog || console.log;

    try {
        const endpoint = '/flash-sales/active';
        const fullUrl = `${API_CONFIG.baseUrl}${endpoint}`;
        logFn('Flash Sale Request Endpoint:', endpoint);
        logFn('Flash Sale Full API URL:', window.location.origin + fullUrl);
        
        const result = await makeApiCall(endpoint);
        logFn('Flash Sale API Response:', result);
        
        const salesArray = Array.isArray(result) ? result : (result && result.data && Array.isArray(result.data) ? result.data : []);
        
        if (salesArray.length > 0) {
            let allItems = [];
            const now = Date.now();

            // Loop through all sales to collect items from all valid active sales
            for (const sale of salesArray) {
                const endTime = sale.end_time ? new Date(sale.end_time).getTime() : 0;
                if (endTime > 0 && endTime <= now) {
                    continue; // Skip ended sales
                }

                const isCat = sale.scope === 'category';
                let saleItems = [];
                if (isCat) {
                    if (sale.categories && sale.categories.length > 0) {
                        saleItems = sale.categories;
                    }
                } else {
                    if (sale.products && sale.products.length > 0) {
                        saleItems = sale.products;
                    }
                }

                // Add each item along with its associated flash sale metadata
                for (const item of saleItems) {
                    allItems.push({
                        item: item,
                        sale: sale,
                        isCategoryScope: isCat
                    });
                }
            }

            if (allItems.length > 0) {
                const displayItems = allItems.slice(0, 20); // Show up to 20 items across all sales
                window.flashSaleProducts = displayItems;
                window.currentFlashSaleIndex = 0;

                // Render the static card framework with the first item's details
                container.innerHTML = '';
                container.appendChild(createPromoFeaturedCard(displayItems[0]));

                // Set up the countdown timer using both start and end time of the first item's sale
                setupFlashSaleTimer(displayItems[0].sale.start_time, displayItems[0].sale.end_time);
                
                // Set up carousel controls
                initPromoCarousel();

                // Show the section
                flashSaleSection.style.display = 'block';
                logFn('Flash sale section displayed! Total items across all sales:', displayItems.length);
            } else {
                logFn('No active or upcoming Flash Sales with items were found.');
            }
        } else {
            logFn('Flash Sale response is not an array or is empty', result);
        }
    } catch (error) {
        console.error('Failed to load flash sales from endpoint /flash-sales/active:', error);
    }
}

function animateProductPrice(elementId, startPrice, endPrice) {
    const priceEl = document.getElementById(elementId);
    if (!priceEl) return;

    let duration = 2500;
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;

        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 4);

        const currentPrice = Math.floor(
            startPrice - (startPrice - endPrice) * easeOut
        );

        priceEl.textContent = "₹" + currentPrice.toLocaleString("en-IN");

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            priceEl.textContent = "₹" + endPrice.toLocaleString("en-IN");
            priceEl.classList.add("hit");

            setTimeout(() => {
                priceEl.classList.remove("hit");
            }, 500);
        }
    }

    requestAnimationFrame(step);
}

function createPromoFeaturedCard(itemObj) {
    const item = itemObj.item;
    const activeSale = itemObj.sale;
    const isCategory = itemObj.isCategoryScope;

    const imageUrl = item.pivot?.custom_image ? '/' + item.pivot.custom_image : (item.image_url || '/img/placeholder-vertical.png');
    const slug = item.slug || item.id;
    const name = item.name || '';

    if (isCategory) {
        const discount = item.pivot?.discount_percentage ? Math.round(parseFloat(item.pivot.discount_percentage)) : 0;
        const desc = item.description || `Enjoy amazing discounts on this limited time deal. Grab up to ${discount}% OFF on all products in this category!`;

        const card = document.createElement('div');
        card.className = 'promo-featured-card category-scoped';
        
        card.innerHTML = `
          <div class="promo-left-column-wrapper" style="position: relative; display: flex; flex-direction: column; width: 100%;">
              <button class="promo-nav-btn promo-nav-btn-left" id="promoPrevBtn" aria-label="Previous slide">
                  <i class="fas fa-chevron-left"></i>
              </button>
              <a href="/flash-sale.html" class="promo-left-column" style="display: flex; flex-direction: column; gap: 15px; text-decoration: none; width: 100%;">
                  <div class="promo-product-img">
                    <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" onerror="this.src='/img/placeholder-vertical.png'">
                  </div>
                  <h2 class="promo-left-title" style="font-size: 16px; color: #555; line-height: 1.6; margin: 0; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; font-weight: normal; text-align: center;">${escapeHtml(name)}</h2>
              </a>
              <button class="promo-nav-btn promo-nav-btn-right" id="promoNextBtn" aria-label="Next slide">
                  <i class="fas fa-chevron-right"></i>
              </button>
          </div>
          <div class="promo-featured-content">
            <a href="/flash-sale.html" class="promo-title-link" style="text-decoration: none;">
              <div class="promo-sale-title">
                ${activeSale.name || 'Hurry Up!'}
              </div>
            </a>
            <div class="promo-countdown flash-sale-timer-dynamic">
                <span class="timer-prefix">Loading Timer...</span>
                <div class="timer-boxes-wrapper" style="display:none;">
                    <div class="timer-card">
                        <span class="timer-digit-animate timer-days">00</span>
                        <span class="timer-label">DAYS</span>
                    </div>
                    <div class="timer-card">
                        <span class="timer-digit-animate timer-hours">00</span>
                        <span class="timer-label">HOURS</span>
                    </div>
                    <div class="timer-card">
                        <span class="timer-digit-animate timer-minutes">00</span>
                        <span class="timer-label">MINUTES</span>
                    </div>
                    <div class="timer-card">
                        <span class="timer-digit-animate timer-seconds">00</span>
                        <span class="timer-label">SECONDS</span>
                    </div>
                </div>
            </div>
            <p>${escapeHtml(desc)}</p>
            <div class="promo-price-action-row" style="display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; margin-top: 15px;">
              <div class="promo-price" style="margin: 0;">
                <div class="drop-label">FLASH DISCOUNT</div>
                <strong class="new-price" style="color: #ff3e6c;">FLAT ${discount}% OFF</strong>
                <div class="save-label" style="background: #eafbe7; color: #2e7d32; font-weight: 500;">LIMITED TIME ONLY</div>
              </div>
              <div class="promo-action-buttons" style="display: flex; gap: 10px; align-items: center;">
                <a href="/flash-sale.html" class="btn-buy-now" style="text-decoration: none; text-align: center; display: inline-block;">Shop Now</a>
              </div>
            </div>
          </div>
        `;
        return card;
    } else {
        const flashPrice = item.pivot?.flash_price || item.price;
        const originalPrice = item.price;
        
        // Fallback description, since API might not return it
        const desc = item.description || item.short_description || "Enjoy amazing discounts on this limited time deal. Grab it before it's gone!";

        const hasDiscount = originalPrice && parseFloat(originalPrice) > parseFloat(flashPrice);
        const saving = hasDiscount ? parseFloat(originalPrice) - parseFloat(flashPrice) : 0;

        const now = Date.now();
        const startTime = activeSale.start_time ? new Date(activeSale.start_time).getTime() : 0;
        const isStarted = now >= startTime;

        const card = document.createElement('div');
        card.className = 'promo-featured-card';
        
        card.innerHTML = `
          <div class="promo-left-column-wrapper" style="position: relative; display: flex; flex-direction: column; width: 100%;">
              <button class="promo-nav-btn promo-nav-btn-left" id="promoPrevBtn" aria-label="Previous slide">
                  <i class="fas fa-chevron-left"></i>
              </button>
              <a href="/product.html?slug=${slug}" class="promo-left-column" style="display: flex; flex-direction: column; gap: 15px; text-decoration: none; width: 100%;">
                  <div class="promo-product-img">
                    <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" onerror="this.src='/img/placeholder-vertical.png'">
                  </div>
                  <h2 class="promo-left-title" style="font-size: 16px; color: #555; line-height: 1.6; margin: 0; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; font-weight: normal; text-align: center;">${escapeHtml(name)}</h2>
              </a>
              <button class="promo-nav-btn promo-nav-btn-right" id="promoNextBtn" aria-label="Next slide">
                  <i class="fas fa-chevron-right"></i>
              </button>
          </div>
          <div class="promo-featured-content">
            <a href="/product.html?slug=${slug}" class="promo-title-link" style="text-decoration: none;">
              <div class="promo-sale-title">
                ${activeSale.name || 'Hurry Up!'}
              </div>
            </a>
            <div class="promo-countdown flash-sale-timer-dynamic">
                <span class="timer-prefix">Loading Timer...</span>
                <div class="timer-boxes-wrapper" style="display:none;">
                    <div class="timer-card">
                        <span class="timer-digit-animate timer-days">00</span>
                        <span class="timer-label">DAYS</span>
                    </div>
                    <div class="timer-card">
                        <span class="timer-digit-animate timer-hours">00</span>
                        <span class="timer-label">HOURS</span>
                    </div>
                    <div class="timer-card">
                        <span class="timer-digit-animate timer-minutes">00</span>
                        <span class="timer-label">MINUTES</span>
                    </div>
                    <div class="timer-card">
                        <span class="timer-digit-animate timer-seconds">00</span>
                        <span class="timer-label">SECONDS</span>
                    </div>
                </div>
            </div>
            <p>${escapeHtml(desc)}</p>
            <div class="promo-price-action-row" style="display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; margin-top: 15px;">
              <div class="promo-price" style="margin: 0;">
                ${hasDiscount ? `<div class="drop-label">SALE PRICE</div>` : ''}
                <strong id="salePrice-${item.id}" class="new-price" data-start-price="${hasDiscount ? originalPrice : flashPrice}" data-end-price="${flashPrice}">₹${parseFloat(hasDiscount ? originalPrice : flashPrice).toLocaleString('en-IN')}</strong>
                ${hasDiscount ? `<span class="old-price">₹${parseFloat(originalPrice).toLocaleString('en-IN')}</span>` : ''}
                ${hasDiscount ? `<div class="save-label">SAVE ₹${parseFloat(saving).toLocaleString('en-IN')}</div>` : ''}
                <span class="confetti c1"></span>
                <span class="confetti c2"></span>
                <span class="confetti c3"></span>
                <span class="confetti c4"></span>
                <span class="confetti c5"></span>
                <span class="confetti c6"></span>
              </div>
              <div class="promo-action-buttons" style="display: flex; gap: 10px; align-items: center;">
                <a href="/flash-sale.html" class="btn-view-details">View All</a>
                ${isStarted ? `<button class="btn-buy-now" onclick="addToCartAndRedirect(${item.id}, event)">Buy Now</button>` : ''}
              </div>
            </div>
          </div>
        `;
        return card;
    }
}

function createPromoSmallCard(product, activeSale) {
    const flashPrice = product.pivot?.flash_price || product.price;
    const originalPrice = product.price;
    const imageUrl = product.pivot?.custom_image ? '/' + product.pivot.custom_image : (product.image_url || '/img/placeholder-vertical.png');
    const slug = product.slug || product.id;
    const name = product.name || '';
    
    const desc = product.short_description || "Special discounted price today.";

    const a = document.createElement('a');
    a.href = `/product.html?slug=${slug}`;
    a.className = 'promo-small-card';
    
    a.innerHTML = `
        <div class="promo-product-img">
          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" onerror="this.src='/img/placeholder-vertical.png'">
        </div>
        <div class="promo-small-content">
          <h3>${escapeHtml(name)}</h3>
          <p>${escapeHtml(desc)}</p>
          <div class="promo-small-price">
            ₹${parseFloat(flashPrice).toLocaleString('en-IN')}
            ${originalPrice ? `<span>₹${parseFloat(originalPrice).toLocaleString('en-IN')}</span>` : ''}
          </div>
          <span class="promo-small-btn">Buy Now</span>
        </div>
    `;
    return a;
}

function initPromoCarousel() {
    console.log('[Flash Sale Carousel] initPromoCarousel started.');
    const prevBtn = document.getElementById('promoPrevBtn');
    const nextBtn = document.getElementById('promoNextBtn');
    if (!prevBtn || !nextBtn) {
        console.log('[Flash Sale Carousel] Prev/Next buttons not found in DOM.');
        return;
    }
    
    const products = window.flashSaleProducts || [];
    console.log('[Flash Sale Carousel] Products count:', products.length);
    if (products.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        console.log('[Flash Sale Carousel] Products count <= 1, auto-sliding disabled.');
        return;
    }
    
    let autoSlideInterval = null;
    
    function updateCarousel() {
        const index = window.currentFlashSaleIndex;
        console.log('[Flash Sale Carousel] Transitioning product to index:', index);
        
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === products.length - 1;

        const itemObj = products[index];
        const card = document.querySelector('.promo-featured-card');
        if (!card || !itemObj) return;

        const item = itemObj.item;
        const activeSale = itemObj.sale;
        const isCategory = itemObj.isCategoryScope;

        const leftColumn = card.querySelector('.promo-left-column');
        const priceRow = card.querySelector('.promo-price');
        const actionButtons = card.querySelector('.promo-action-buttons');
        
        // 1. Add transitioning class for fade out
        if (leftColumn) leftColumn.classList.add('transitioning');
        if (priceRow) priceRow.classList.add('transitioning');

        // 2. Wait for fade out animation
        setTimeout(() => {
            const imageUrl = item.pivot?.custom_image ? '/' + item.pivot.custom_image : (item.image_url || '/img/placeholder-vertical.png');
            const name = item.name || '';
            const slug = item.slug || item.id;

            // Update Sale Title
            const saleTitle = card.querySelector('.promo-sale-title');
            if (saleTitle) {
                saleTitle.textContent = activeSale.name || 'Hurry Up!';
            }

            // Update Timer for the active item's sale
            setupFlashSaleTimer(activeSale.start_time, activeSale.end_time);

            // Update Left Column (Image & Name)
            if (leftColumn) {
                leftColumn.href = isCategory ? '/flash-sale.html' : `/product.html?slug=${slug}`;
                const img = leftColumn.querySelector('.promo-product-img img');
                if (img) {
                    img.src = imageUrl;
                    img.alt = name;
                }
                const title = leftColumn.querySelector('.promo-left-title');
                if (title) {
                    title.textContent = name;
                }
            }

            // Update Title Link Href
            const titleLink = card.querySelector('.promo-title-link');
            if (titleLink) {
                titleLink.href = isCategory ? '/flash-sale.html' : `/product.html?slug=${slug}`;
            }

            if (isCategory) {
                // Update Price & Labels
                if (priceRow) {
                    const discount = item.pivot?.discount_percentage ? Math.round(parseFloat(item.pivot.discount_percentage)) : 0;
                    priceRow.innerHTML = `
                        <div class="drop-label">FLASH DISCOUNT</div>
                        <strong class="new-price" style="color: #ff3e6c;">FLAT ${discount}% OFF</strong>
                        <div class="save-label" style="background: #eafbe7; color: #2e7d32; font-weight: 500;">LIMITED TIME ONLY</div>
                    `;
                }
                if (actionButtons) {
                    actionButtons.innerHTML = `
                        <a href="/flash-sale.html" class="btn-buy-now" style="text-decoration: none; text-align: center; display: inline-block;">Shop Now</a>
                    `;
                }
            } else {
                // Update Price & Labels
                if (priceRow) {
                    const flashPrice = item.pivot?.flash_price || item.price;
                    const originalPrice = item.price;
                    const hasDiscount = originalPrice && parseFloat(originalPrice) > parseFloat(flashPrice);
                    const saving = hasDiscount ? parseFloat(originalPrice) - parseFloat(flashPrice) : 0;

                    // Update drop label
                    let dropLabel = priceRow.querySelector('.drop-label');
                    if (hasDiscount) {
                        if (!dropLabel) {
                            dropLabel = document.createElement('div');
                            dropLabel.className = 'drop-label';
                            dropLabel.textContent = 'SALE PRICE';
                            priceRow.insertBefore(dropLabel, priceRow.firstChild);
                        }
                    } else if (dropLabel) {
                        dropLabel.remove();
                    }

                    // Update strong (price)
                    const priceStrong = priceRow.querySelector('.new-price');
                    if (priceStrong) {
                        priceStrong.id = `salePrice-${item.id}`;
                        priceStrong.setAttribute('data-start-price', hasDiscount ? originalPrice : flashPrice);
                        priceStrong.setAttribute('data-end-price', flashPrice);
                        priceStrong.textContent = `₹${parseFloat(hasDiscount ? originalPrice : flashPrice).toLocaleString('en-IN')}`;
                    }

                    // Update old price
                    let oldPriceSpan = priceRow.querySelector('.old-price');
                    if (hasDiscount) {
                        if (!oldPriceSpan) {
                            oldPriceSpan = document.createElement('span');
                            oldPriceSpan.className = 'old-price';
                            priceStrong.insertAdjacentElement('afterend', oldPriceSpan);
                        }
                        oldPriceSpan.textContent = `₹${parseFloat(originalPrice).toLocaleString('en-IN')}`;
                        oldPriceSpan.classList.remove('active');
                    } else if (oldPriceSpan) {
                        oldPriceSpan.remove();
                    }

                    // Update save label
                    let saveLabel = priceRow.querySelector('.save-label');
                    if (hasDiscount) {
                        if (!saveLabel) {
                            saveLabel = document.createElement('div');
                            saveLabel.className = 'save-label';
                            priceRow.appendChild(saveLabel);
                        }
                        saveLabel.textContent = `SAVE ₹${parseFloat(saving).toLocaleString('en-IN')}`;
                    } else if (saveLabel) {
                        saveLabel.remove();
                    }
                }

                // Update Action Buttons links & click handlers
                if (actionButtons) {
                    actionButtons.innerHTML = `
                        <a href="/flash-sale.html" class="btn-view-details">View All</a>
                        ${Date.now() >= (activeSale.start_time ? new Date(activeSale.start_time).getTime() : 0) ? `<button class="btn-buy-now" onclick="addToCartAndRedirect(${item.id}, event)">Buy Now</button>` : ''}
                    `;
                }
            }

            // 3. Remove transitioning class to fade back in
            if (leftColumn) leftColumn.classList.remove('transitioning');
            if (priceRow) priceRow.classList.remove('transitioning');

            // 4. Trigger animations on new active slide
            if (!isCategory && priceRow) {
                const priceStrong = priceRow.querySelector('.new-price');
                const oldPriceSpan = priceRow.querySelector('.old-price');
                
                if (priceStrong) {
                    const startPrice = parseFloat(priceStrong.getAttribute('data-start-price') || 0);
                    const endPrice = parseFloat(priceStrong.getAttribute('data-end-price') || 0);
                    if (startPrice > endPrice) {
                        animateProductPrice(priceStrong.id, startPrice, endPrice);
                    }
                }

                if (oldPriceSpan) {
                    void oldPriceSpan.offsetWidth;
                    oldPriceSpan.classList.add('active');
                }
            }
        }, 400); // Wait for transition out
    }
    
    function startAutoSlide() {
        stopAutoSlide();
        console.log('[Flash Sale Carousel] startAutoSlide called.');
        if (products.length > 1) {
            console.log('[Flash Sale Carousel] Interval set for 10 seconds auto-slide.');
            autoSlideInterval = setInterval(() => {
                window.currentFlashSaleIndex = (window.currentFlashSaleIndex + 1) % products.length;
                updateCarousel();
            }, 10000); // 10 seconds
        } else {
            console.log('[Flash Sale Carousel] Conditions not met for auto-slide.');
        }
    }
    
    function stopAutoSlide() {
        if (autoSlideInterval) {
            console.log('[Flash Sale Carousel] Stopping auto-slide interval.');
            clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
    }
    
    prevBtn.addEventListener('click', () => {
        if (window.currentFlashSaleIndex > 0) {
            console.log('[Flash Sale Carousel] User clicked Prev. Moving from:', window.currentFlashSaleIndex);
            window.currentFlashSaleIndex--;
            updateCarousel();
            startAutoSlide(); // Reset the timer on user interaction
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (window.currentFlashSaleIndex < products.length - 1) {
            console.log('[Flash Sale Carousel] User clicked Next. Moving from:', window.currentFlashSaleIndex);
            window.currentFlashSaleIndex++;
            updateCarousel();
            startAutoSlide(); // Reset the timer on user interaction
        }
    });
    
    updateCarousel();
    startAutoSlide();
}

let activePromoTimerInterval;

function setupFlashSaleTimer(startTimeStr, endTimeStr) {
    if (activePromoTimerInterval) {
        clearInterval(activePromoTimerInterval);
    }

    const timerElements = document.querySelectorAll('.flash-sale-timer-dynamic');
    if (!timerElements.length || !endTimeStr) return;

    const startTime = startTimeStr ? new Date(startTimeStr).getTime() : 0;
    const endTime = new Date(endTimeStr).getTime();

    function updateTimer() {
        const now = new Date().getTime();
        
        let distance = 0;
        let prefix = "";
        
        if (startTime > now) {
            distance = startTime - now;
            prefix = "Starting soon:";
        } else if (endTime > now) {
            distance = endTime - now;
            prefix = "Ending soon:";
        } else {
            timerElements.forEach(el => {
                const prefixEl = el.querySelector('.timer-prefix');
                if (prefixEl) prefixEl.textContent = "Sale Ended";
                const wrapper = el.querySelector('.timer-boxes-wrapper');
                if (wrapper) wrapper.style.display = 'none';
            });
            if (activePromoTimerInterval) {
                clearInterval(activePromoTimerInterval);
            }
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Pad with leading zeros
        const d = days < 10 ? "0" + days : days.toString();
        const h = hours < 10 ? "0" + hours : hours.toString();
        const m = minutes < 10 ? "0" + minutes : minutes.toString();
        const s = seconds < 10 ? "0" + seconds : seconds.toString();
        
        timerElements.forEach(el => {
            const prefixEl = el.querySelector('.timer-prefix');
            const wrapper = el.querySelector('.timer-boxes-wrapper');

            if (prefixEl) prefixEl.textContent = prefix;
            if (wrapper) wrapper.style.display = 'flex';

            updateDigit(el.querySelector('.timer-days'), d);
            updateDigit(el.querySelector('.timer-hours'), h);
            updateDigit(el.querySelector('.timer-minutes'), m);
            updateDigit(el.querySelector('.timer-seconds'), s);
        });
    }

    function updateDigit(el, newValue) {
        if (!el) return;
        if (el.textContent !== newValue) {
            el.textContent = newValue;
            el.classList.remove('slide-down');
            // Trigger reflow to restart animation
            void el.offsetWidth;
            el.classList.add('slide-down');
        }
    }

    // Update immediately and then every second
    updateTimer();
    activePromoTimerInterval = setInterval(updateTimer, 1000);
}

// Load Featured Products (Carousel Style)
async function loadFeaturedProducts() {
    const featuredSection = document.querySelector('.featured-section');
    const featuredContainer = document.getElementById('featuredProducts');
    if (!featuredContainer || !featuredSection) return;

    try {
        const result = await makeApiCall('/products/featured', { timeout: 8000 });
        if (window.innerWidth <= 768) {
            console.log('Featured Products API Response:', result.data);
        }

        if (result.success && result.data && result.data.length > 0) {
            // Clear the grid container and replace with carousel
            featuredContainer.innerHTML = '';

            // Create carousel wrapper
            const carouselWrapper = document.createElement('div');
            carouselWrapper.style.cssText = `
                position: relative;
                display: flex;
                gap: 0;
                align-items: stretch;
            `;

            // Create scroll container
            const scrollContainer = document.createElement('div');
            scrollContainer.className = 'product-carousel-scroll featured-carousel-scroll';
            scrollContainer.style.cssText = `
                display: flex;
                overflow-x: auto;
                gap: 16px;
                padding: 10px 2px 20px 2px;
                scroll-behavior: smooth;
                flex: 1 1 auto;
            `;

            // Render products
            result.data.forEach(product => {
                const card = createProductCard(product);
                const cardWrapper = document.createElement('div');
                cardWrapper.style.cssText = `
                    flex: 0 0 auto;
                    width: 200px;
                    max-width: 200px;
                `;
                card.style.width = '100%';
                card.style.height = '100%';
                cardWrapper.appendChild(card);
                scrollContainer.appendChild(cardWrapper);
            });

            carouselWrapper.appendChild(scrollContainer);

            // Navigation Buttons
            const prevBtn = document.createElement('button');
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.className = 'carousel-btn carousel-btn-prev disabled';

            const nextBtn = document.createElement('button');
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextBtn.className = 'carousel-btn carousel-btn-next';

            carouselWrapper.appendChild(prevBtn);
            carouselWrapper.appendChild(nextBtn);
            featuredContainer.appendChild(carouselWrapper);

            // Button update logic
            const updateButtons = () => {
                const tolerance = 5;
                const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;

                if (scrollContainer.scrollLeft <= tolerance) {
                    prevBtn.classList.add('disabled');
                } else {
                    prevBtn.classList.remove('disabled');
                }

                if (scrollContainer.scrollLeft >= maxScroll - tolerance) {
                    nextBtn.classList.add('disabled');
                } else {
                    nextBtn.classList.remove('disabled');
                }

                // Hide buttons if no overflow
                if (scrollContainer.scrollWidth <= scrollContainer.clientWidth) {
                    prevBtn.style.display = 'none';
                    nextBtn.style.display = 'none';
                } else {
                    prevBtn.style.display = 'flex';
                    nextBtn.style.display = 'flex';
                }
            };

            scrollContainer.addEventListener('scroll', updateButtons);
            window.addEventListener('resize', updateButtons);

            // Button click handlers
            prevBtn.onclick = () => {
                scrollContainer.scrollBy({ left: -600, behavior: 'smooth' });
            };

            nextBtn.onclick = () => {
                scrollContainer.scrollBy({ left: 600, behavior: 'smooth' });
            };

            // Initial button state
            setTimeout(updateButtons, 100);

        } else {
            featuredContainer.innerHTML = '<div class="error-message"><p>No featured products available</p></div>';
        }
    } catch (error) {
        featuredContainer.innerHTML = `
            <div class="error-message">
                <p>Failed to load featured products. Please try again later.</p>
                <button onclick="loadFeaturedProducts()">Retry</button>
            </div>
        `;
    }
}

// Load Recently Viewed Products
function loadRecentlyViewedProducts() {
    const recentlyViewedSection = document.getElementById('recentlyViewedSection');
    const recentlyViewedProducts = document.getElementById('recentlyViewedProducts');

    if (!recentlyViewedSection || !recentlyViewedProducts) {
        return;
    }

    // Check if recently-viewed.js is loaded
    if (typeof getRecentlyViewedProductsLimited === 'undefined') {
        return;
    }

    const products = getRecentlyViewedProductsLimited(10);

    // Show section if there are products
    if (products.length === 0) {
        recentlyViewedSection.style.display = 'none';
        return;
    }

    // Show the section
    recentlyViewedSection.style.display = 'block';
    recentlyViewedProducts.innerHTML = '';

    // Create product cards using the shared ProductCard component
    products.forEach(product => {
        if (typeof ProductCard !== 'undefined') {
            const card = ProductCard.toElement(product, {
                extraClass: 'homepage-product-card'
            });
            recentlyViewedProducts.appendChild(card);
        }
    });

    // Setup horizontal scroll
    setupRecentlyViewedScroll();
}


// Setup horizontal scroll for recently viewed
function setupRecentlyViewedScroll() {
    const scrollContainer = document.getElementById('recentlyViewedScroll');
    const scrollLeftBtn = document.getElementById('recentlyViewedScrollLeft');
    const scrollRightBtn = document.getElementById('recentlyViewedScrollRight');

    if (!scrollContainer) return;

    // Scroll buttons
    if (scrollLeftBtn) {
        scrollLeftBtn.addEventListener('click', () => {
            scrollContainer.scrollBy({
                left: -300,
                behavior: 'smooth'
            });
        });
    }

    if (scrollRightBtn) {
        scrollRightBtn.addEventListener('click', () => {
            scrollContainer.scrollBy({
                left: 300,
                behavior: 'smooth'
            });
        });
    }

    // Show/hide scroll buttons based on scroll position
    const updateScrollButtons = () => {
        const tolerance = 10;
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        
        if (scrollLeftBtn) {
            scrollLeftBtn.style.display = scrollContainer.scrollLeft > tolerance ? 'flex' : 'none';
        }
        
        if (scrollRightBtn) {
            scrollRightBtn.style.display = scrollContainer.scrollLeft < maxScroll - tolerance ? 'flex' : 'none';
        }
    };

    scrollContainer.addEventListener('scroll', updateScrollButtons);
    // Also listen for resize as it affects clientWidth
    window.addEventListener('resize', updateScrollButtons);
    
    // Initial update
    setTimeout(updateScrollButtons, 100);
}

// Load Products with Pagination
async function loadProducts(page = 1, filters = {}) {
    try {
        let endpoint = `/products?page=${page}&per_page=20`;

        // Add filters if provided - use category products API per documentation
        if (filters.category && filters.category !== 'all') {
            endpoint = `/categories/${filters.category}/products?page=${page}&per_page=20`;
        } else if (filters.brand) {
            endpoint = `/brands/${filters.brand}/products?page=${page}&per_page=20`;
        } else if (filters.tag) {
            endpoint = `/tags/${filters.tag}/products?page=${page}&per_page=20`;
        }

        // /* console.log */('API Call: GET', endpoint);

        const result = await makeApiCall(endpoint);
        if (window.innerWidth <= 768) {
            console.log('Product API Response for:', endpoint, result);
        }

        if (result && result.success && result.data) {
            let products = [];
            let pagination = {};

            // Robust data extraction
            if (result.data.products) {
                if (Array.isArray(result.data.products)) {
                    products = result.data.products;
                    pagination = {
                        current_page: page,
                        last_page: Math.ceil((result.data.count || products.length) / 20),
                        per_page: 20,
                        total: result.data.count || products.length
                    };
                } else if (result.data.products.data && Array.isArray(result.data.products.data)) {
                    products = result.data.products.data;
                    pagination = result.data.products;
                }
            } else if (Array.isArray(result.data.data)) {
                products = result.data.data;
                pagination = result.data;
            } else if (Array.isArray(result.data)) {
                products = result.data;
                pagination = {
                    current_page: page,
                    last_page: 1,
                    per_page: 20,
                    total: products.length
                };
            } else if (result.data.data && result.data.data.products && Array.isArray(result.data.data.products)) {
                // Nested structure fallback
                products = result.data.data.products;
                pagination = result.data.data.pagination || result.data.pagination || {
                    current_page: page,
                    last_page: 1,
                    per_page: 20,
                    total: products.length
                };
            }

            // Client-side filtering by subcategory if provided
            if (window.currentSubcategory && window.currentSubcategory !== 'null' && window.currentSubcategory !== 'undefined' && products.length > 0) {
                const subQuery = window.currentSubcategory.toLowerCase();
                products = products.filter(p =>
                    (p.name && p.name.toLowerCase().includes(subQuery)) ||
                    (p.description && p.description.toLowerCase().includes(subQuery)) ||
                    (p.short_description && p.short_description.toLowerCase().includes(subQuery))
                );
                console.log(`Filtered to ${products.length} products for subcategory: ${window.currentSubcategory}`);
            }

            // Ensure pagination object has necessary fields
            const finalPagination = {
                current_page: pagination.current_page || page,
                last_page: pagination.last_page || 1,
                per_page: pagination.per_page || 20,
                total: pagination.total || products.length
            };

            return {
                data: products,
                ...finalPagination
            };
        }

        return null;
    } catch (error) {
        // /* console.log */('Products Fetch Failed:', endpoint, error.message);
        return null;
    }
}

// Load All Products
function loadAllProducts() {
    currentCategory = null;
    currentBrand = null;
    currentTag = null;
    currentPage = 1;
    hasMorePages = true;

    const allProductsContainer = document.getElementById('allProducts');
    const loadingMore = document.getElementById('loadingMore');
    const endMessage = document.getElementById('endMessage');

    if (allProductsContainer) {
        allProductsContainer.innerHTML = getSkeletonTemplate(10);
    }
    if (loadingMore) {
        loadingMore.style.display = 'none';
    }
    if (endMessage) {
        endMessage.style.display = 'none';
    }

    // Update section title
    const sectionTitle = document.querySelector('.products-section .section-title');
    if (sectionTitle) {
        sectionTitle.textContent = 'All Products';
    }

    loadMoreProducts();
}

// Load Products by Category
async function loadProductsByCategory(categorySlug, subcategoryName = null) {
    currentCategory = categorySlug;
    currentBrand = null;
    currentTag = null;
    currentPage = 1;
    hasMorePages = true;
    window.currentSubcategory = subcategoryName;

    const allProductsContainer = document.getElementById('allProducts');
    const loadingMore = document.getElementById('loadingMore');
    const endMessage = document.getElementById('endMessage');

    if (allProductsContainer) {
        allProductsContainer.innerHTML = getSkeletonTemplate(10);
    }
    if (loadingMore) {
        loadingMore.style.display = 'none';
    }
    if (endMessage) {
        endMessage.style.display = 'none';
    }

    // Update section title and breadcrumb with category name from API or local storage
    const updateTitleAndBreadcrumb = (categoryData, subName) => {
        const sectionTitle = document.querySelector('.products-section .section-title');
        const breadcrumb = document.getElementById('categoryBreadcrumb');

        if (categoryData && categoryData.name) {
            const categoryName = categoryData.name;
            const fullTitle = subName ? `${categoryName} - ${subName}` : categoryName;

            if (sectionTitle) sectionTitle.textContent = fullTitle;
            if (breadcrumb) {
                // Build full breadcrumb path if possible
                const breadcrumbPath = buildCategoryBreadcrumb(categoryData.slug);
                if (breadcrumbPath && breadcrumbPath.length > 0) {
                    let breadcrumbHTML = '';
                    breadcrumbPath.forEach((item, index) => {
                        breadcrumbHTML += item.name;
                        if (index < breadcrumbPath.length - 1) {
                            breadcrumbHTML += ' <i class="fas fa-chevron-right" style="font-size: 8px; margin: 0 4px;"></i> ';
                        }
                    });

                    if (subName) {
                        breadcrumbHTML += ` <i class="fas fa-chevron-right" style="font-size: 8px; margin: 0 4px;"></i> ${subName}`;
                    }
                    breadcrumb.innerHTML = breadcrumbHTML;
                } else {
                    breadcrumb.innerHTML = subName ? `${categoryName} <i class="fas fa-chevron-right" style="font-size: 8px; margin: 0 4px;"></i> ${subName}` : categoryName;
                }
            }
        }
    };

    // Find category from loaded categories array
    let category = categories.find(cat => cat.slug === categorySlug);

    if (category) {
        updateTitleAndBreadcrumb(category, subcategoryName);
    } else {
        // Try to fetch category details from API
        try {
            const categoryResult = await makeApiCall(`/categories/${categorySlug}`);
            if (categoryResult && categoryResult.success && categoryResult.data) {
                category = categoryResult.data;
                updateTitleAndBreadcrumb(category, subcategoryName);
            } else {
                // Last fallback: use slug as name
                const fallbackName = categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);
                updateTitleAndBreadcrumb({ name: fallbackName, slug: categorySlug }, subcategoryName);
            }
        } catch (error) {
            // Last fallback: use slug as name
            const fallbackName = categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);
            updateTitleAndBreadcrumb({ name: fallbackName, slug: categorySlug }, subcategoryName);
        }
    }

    // Load products using category slug
    await loadMoreProducts({ category: categorySlug });
}

/**
 * Load Products by Brand
 */
async function loadProductsByBrand(brandSlug) {
    currentBrand = brandSlug;
    currentCategory = null;
    currentTag = null;
    currentPage = 1;
    hasMorePages = true;

    const allProductsContainer = document.getElementById('allProducts');
    const loadingMore = document.getElementById('loadingMore');
    const endMessage = document.getElementById('endMessage');

    if (allProductsContainer) {
        allProductsContainer.innerHTML = getSkeletonTemplate(10);
    }
    if (loadingMore) loadingMore.style.display = 'none';
    if (endMessage) endMessage.style.display = 'none';

    // Load products using brand slug
    await loadMoreProducts({ brand: brandSlug });
}

/**
 * Load Products by Tag
 */
async function loadProductsByTag(tagSlug) {
    currentTag = tagSlug;
    currentCategory = null;
    currentBrand = null;
    currentPage = 1;
    hasMorePages = true;

    const allProductsContainer = document.getElementById('allProducts');
    const loadingMore = document.getElementById('loadingMore');
    const endMessage = document.getElementById('endMessage');

    if (allProductsContainer) {
        allProductsContainer.innerHTML = getSkeletonTemplate(10);
    }
    if (loadingMore) loadingMore.style.display = 'none';
    if (endMessage) endMessage.style.display = 'none';

    // Load products using tag slug
    await loadMoreProducts({ tag: tagSlug });
}

// Create Product Card Element
function createProductCard(product) {
    // Check if we're on the homepage - if so, display like recently viewed (no buttons)
    const isHomepage = window.location.pathname === '/' || window.location.pathname === '/index.html' || document.body.classList.contains('homepage');

    const card = document.createElement('a');
    card.href = `/product.html?slug=${product.slug}`;
    card.className = isHomepage ? 'product-card homepage-product-card' : 'product-card';

    const imageUrl = product.image_url || product.image || '/images/placeholder.svg';
    const title = product.name || product.title || 'Product Name';
    const price = parseFloat(product.price) || 0;
    const originalPrice = product.original_price ? parseFloat(product.original_price) : null;
    const discount = product.discount_percentage || null;
    const rating = product.rating ? parseFloat(product.rating) : null;
    const ratingCount = product.review_count || product.rating_count || 0;
    const stockQuantity = product.stock_quantity || 0;
    const isInStock = stockQuantity > 0;

    // Calculate discount if not provided
    let discountPercentage = discount;
    if (!discountPercentage && originalPrice && price < originalPrice) {
        discountPercentage = Math.round(((originalPrice - price) / originalPrice) * 100);
    }

    // Format price
    const formattedPrice = formatPrice(price);
    const formattedOriginalPrice = originalPrice ? formatPrice(originalPrice) : null;

    // Homepage style (like recently viewed) - no buttons
    if (isHomepage) {
        // Check if mobile
        const isMobile = window.innerWidth <= 768;

        card.innerHTML = `
            <div class="product-image-wrapper">
                <img src="${imageUrl}" alt="${title}" class="product-image" onerror="this.src='/images/placeholder.svg'">
                ${discountPercentage ? `<span class="product-discount-badge">${discountPercentage}% off</span>` : ''}
            </div>
            <div class="product-info">
                <div class="product-title">${escapeHtml(title)}</div>
                <div class="product-price">
                    <span class="price-current">₹${formattedPrice}</span>
                    ${formattedOriginalPrice && originalPrice > price ? `
                        <span class="price-original">₹${formattedOriginalPrice}</span>
                    ` : ''}
                </div>
                ${!isMobile && rating ? `
                    <div class="product-rating">
                        <span class="rating-stars">${generateStars(rating)}</span>
                        <span class="rating-count">(${ratingCount})</span>
                    </div>
                ` : ''}
            </div>
        `;
    } else {
        // Other pages - redesigned (no actions, price under title, wrapped in Info container)
        card.innerHTML = `
            <img src="${imageUrl}" alt="${title}" class="product-image" onerror="this.src='/images/placeholder.svg'">
            <div class="product-info">
                <div class="product-title">${escapeHtml(title)}</div>
                <div class="product-price">
                    <span class="price-current">₹${formattedPrice}</span>
                    ${formattedOriginalPrice && originalPrice > price ? `
                        <span class="price-original">₹${formattedOriginalPrice}</span>
                    ` : ''}
                    ${discountPercentage ? `
                        <span class="discount-badge">${discountPercentage}% off</span>
                    ` : ''}
                </div>
                ${rating ? `
                    <div class="product-rating">
                        <span class="rating-stars">${generateStars(rating)}</span>
                        <span class="rating-count">(${ratingCount})</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    return card;
}

// Get Skeleton Template for loading placeholder
function getSkeletonTemplate(count = 10) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
        <div class="product-card skeleton-card">
            <div class="skeleton-img skeleton-animation"></div>
            <div class="product-info">
                <div class="skeleton-title skeleton-animation"></div>
                <div class="skeleton-price skeleton-animation"></div>
                <div class="skeleton-rating skeleton-animation"></div>
            </div>
        </div>`;
    }
    return html;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Build Category Breadcrumb
function buildCategoryBreadcrumb(categorySlug) {
    if (!window.flatCategories || !Array.isArray(window.flatCategories)) {
        return [];
    }

    const category = window.flatCategories.find(cat => cat.slug === categorySlug);
    if (!category) return [];

    const breadcrumb = [];
    let current = category;

    while (current) {
        breadcrumb.unshift({
            name: current.name,
            slug: current.slug
        });

        // Find parent using parent_slug or parent_id
        if (current.parent_slug) {
            current = window.flatCategories.find(cat => cat.slug === current.parent_slug);
        } else if (current.parent && current.parent.slug) {
            current = window.flatCategories.find(cat => cat.slug === current.parent.slug);
        } else if (current.parent_id) {
            current = window.flatCategories.find(cat => cat.id === current.parent_id);
        } else {
            current = null;
        }
    }

    return breadcrumb;
}

// Fuzzy match product name - handles typos like "Mackbook" -> "Macbook"
function matchesProductNameApp(productName, searchQuery) {
    if (!productName || !searchQuery) return false;

    const nameLower = productName.toLowerCase();
    const queryLower = searchQuery.toLowerCase().trim();

    // Exact match (case-insensitive)
    if (nameLower.includes(queryLower)) {
        return true;
    }

    // Split into words for better matching
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
    const nameWords = nameLower.split(/\s+/).filter(w => w.length > 0);

    // If single word query, try fuzzy matching
    if (queryWords.length === 1) {
        const queryWord = queryWords[0];

        // Check if any word in product name matches (handles typos)
        for (const nameWord of nameWords) {
            // Exact substring match
            if (nameWord.includes(queryWord) || queryWord.includes(nameWord)) {
                return true;
            }

            // Fuzzy match for typos (e.g., "Mackbook" -> "Macbook")
            if (fuzzyMatchApp(nameWord, queryWord)) {
                return true;
            }
        }

        // Check if query is contained in any word (for partial matches)
        if (nameLower.includes(queryWord)) {
            return true;
        }
    } else {
        // Multiple words - check if all query words appear somewhere in product name
        return queryWords.every(queryWord => {
            return nameWords.some(nameWord => {
                if (nameWord.includes(queryWord) || queryWord.includes(nameWord)) {
                    return true;
                }
                return fuzzyMatchApp(nameWord, queryWord);
            }) || nameLower.includes(queryWord);
        });
    }

    return false;
}

// Fuzzy string matching for typo tolerance (handles "Mackbook" -> "Macbook")
function fuzzyMatchApp(str1, str2) {
    if (!str1 || !str2) return false;

    // If strings are very different in length, unlikely match
    const lengthDiff = Math.abs(str1.length - str2.length);
    if (lengthDiff > Math.max(str1.length, str2.length) * 0.3) {
        return false;
    }

    // Check if strings are similar (Levenshtein-like but simpler)
    const minLength = Math.min(str1.length, str2.length);
    const maxLength = Math.max(str1.length, str2.length);

    // If one is much shorter, check if longer contains shorter
    if (maxLength > minLength * 1.5) {
        return str1.includes(str2) || str2.includes(str1);
    }

    // Check character similarity
    let matches = 0;
    const shorter = str1.length <= str2.length ? str1 : str2;
    const longer = str1.length > str2.length ? str1 : str2;

    // Check if most characters match (allowing for 1-2 character differences)
    for (let i = 0; i < shorter.length; i++) {
        if (i < longer.length && shorter[i] === longer[i]) {
            matches++;
        }
    }

    // Also check if strings start similarly (handles "Mackbook" -> "Macbook")
    const startLength = Math.min(3, shorter.length);
    if (shorter.substring(0, startLength) === longer.substring(0, startLength)) {
        matches += startLength;
    }

    // Consider it a match if at least 70% of characters match
    const similarity = matches / Math.max(shorter.length, longer.length);
    return similarity >= 0.7;
}

// Generate Star Rating
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }

    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }

    return stars;
}

// Format Price
function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 0
    }).format(price);
}

// Initialize Infinite Scroll
function initInfiniteScroll() {
    // Disable infinite scroll on pages that use standard pagination or custom loading
    const path = window.location.pathname;
    if (path.includes('search.html') || path.includes('categories.html') || path.includes('flash-sale.html')) {
        return;
    }

    // Check if we should load initial products
    const urlParams = new URLSearchParams(window.location.search);
    
    // Initialize global state from URL parameters
    currentCategory = urlParams.get('category') || null;
    currentBrand = urlParams.get('brand') || null;
    currentTag = urlParams.get('tag') || null;
    searchQuery = urlParams.get('q') || '';
    
    // Check if we're on a page that handles its own specific product loading (like categories.html?category=...)
    const hasSpecificFilter = !!(currentCategory || currentBrand || currentTag || searchQuery);
    
    // Only load automatically if no specific filter is present in URL
    // Otherwise, the specific page logic (e.g., categories.js, brands.js, tags.js) will trigger the load
    if (!hasSpecificFilter) {
        loadMoreProducts();
    }

    // Setup scroll listener with Intersection Observer (better performance)
    const loadingMore = document.getElementById('loadingMore');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading && hasMorePages) {
                loadMoreProducts();
            }
        });
    }, {
        rootMargin: '1000px'
    });

    if (loadingMore) {
        observer.observe(loadingMore);
    }

    // Fallback to scroll event for older browsers
    window.addEventListener('scroll', debounce(handleScroll, 200));
}

// Handle Scroll Event
function handleScroll() {
    if (isLoading || !hasMorePages) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.body.offsetHeight;

    // Load more when 1000px from bottom
    if (scrollPosition >= documentHeight - 1000) {
        loadMoreProducts();
    }
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load More Products
async function loadMoreProducts(filters = {}) {
    if (isLoading || !hasMorePages) return;

    isLoading = true;
    const loadingMore = document.getElementById('loadingMore');
    const allProductsContainer = document.getElementById('allProducts');

    if (loadingMore) {
        loadingMore.style.display = 'block';
    }

    try {
        // Build filters - only use current filters if no new filters provided
        const activeFilters = {
            category: filters.category !== undefined ? filters.category : currentCategory,
            brand: filters.brand !== undefined ? filters.brand : currentBrand,
            tag: filters.tag !== undefined ? filters.tag : currentTag
        };

        const data = await loadProducts(currentPage, activeFilters);

        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
            // Store products for filtering (if on category page)
            if (typeof window.storeProductsForFilter === 'function' && currentPage === 1) {
                window.storeProductsForFilter(data.data);
            } else if (typeof window.storeProductsForFilter === 'function') {
                // Append to existing products for filtering
                const existingProducts = window.allProductsForFilter || [];
                window.storeProductsForFilter([...existingProducts, ...data.data]);
            }

            // Clear loading skeleton or spinner if it is first page
            if (allProductsContainer && currentPage === 1) {
                allProductsContainer.innerHTML = '';
            } else if (allProductsContainer) {
                const loadingSpinner = allProductsContainer.querySelector('.loading-spinner');
                if (loadingSpinner) {
                    loadingSpinner.remove();
                }
            }

            data.data.forEach(product => {
                if (allProductsContainer) {
                    const productCard = createProductCard(product);
                    allProductsContainer.appendChild(productCard);
                }
            });

            // Update results count
            const resultsCount = document.getElementById('resultsCount');
            if (resultsCount && data.total !== undefined) {
                const currentCount = allProductsContainer ? allProductsContainer.querySelectorAll('.product-card').length : 0;
                resultsCount.textContent = `Showing 1 - ${currentCount} of ${data.total} products`;
            } else if (resultsCount && data.count !== undefined) {
                const currentCount = allProductsContainer ? allProductsContainer.querySelectorAll('.product-card').length : 0;
                resultsCount.textContent = `Showing 1 - ${currentCount} of ${data.count} products`;
            }

            currentPage++;
            hasMorePages = currentPage <= (data.last_page || 1);

            if (!hasMorePages) {
                const endMessage = document.getElementById('endMessage');
                if (endMessage) {
                    endMessage.style.display = 'block';
                }
            }
        } else {
            hasMorePages = false;
            const endMessage = document.getElementById('endMessage');
            if (endMessage) {
                endMessage.style.display = 'block';
            }

            if (allProductsContainer && (allProductsContainer.children.length === 0 || allProductsContainer.querySelector('.loading-spinner') || allProductsContainer.querySelector('.skeleton-card'))) {
                allProductsContainer.innerHTML = `
                    <div class="no-results-message" style="text-align: center; padding: 60px 20px; width: 100%; grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #fff; border-radius: 4px; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.1); margin-top: 10px;">
                        <div style="font-size: 64px; color: #f0f0f0; margin-bottom: 20px;">
                            <i class="fas fa-box-open"></i>
                        </div>
                        <h3 style="font-size: 20px; font-weight: 500; color: #212121; margin: 0 0 10px 0;">Coming Soon</h3>
                        <p style="font-size: 14px; color: #878787; margin: 0 0 24px 0;">We are currently adding new products to this category.</p>
                        <a href="/" class="browse-btn" style="display: inline-block; background: #1b5e20; color: #fff; padding: 12px 32px; border-radius: 2px; text-decoration: none; font-weight: 500; font-size: 14px; box-shadow: 0 2px 4px 0 rgba(0,0,0,0.2);">Explore Other Products</a>
                    </div>
                `;
            }
        }
    } catch (error) {
        // Silent error handling
        if (allProductsContainer) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = `
                <p>Failed to load products. Please try again.</p>
                <button onclick="retryLoadProducts()">Retry</button>
            `;
            allProductsContainer.appendChild(errorDiv);
        }
    } finally {
        isLoading = false;
        if (loadingMore) {
            loadingMore.style.display = 'none';
        }
    }
}

// Retry Load Products
function retryLoadProducts() {
    const allProductsContainer = document.getElementById('allProducts');
    const errorDiv = allProductsContainer?.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
    loadMoreProducts();
}

// Setup Search
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchSuggestions = document.getElementById('searchSuggestions');

    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

    if (searchInput) {
        // Handle Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
            }
        });

        // Handle input for suggestions
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            // Clear previous timeout
            clearTimeout(searchTimeout);

            // Hide suggestions if empty
            if (!query) {
                if (searchSuggestions) searchSuggestions.style.display = 'none';
                return;
            }

            // Debounce search suggestions
            searchTimeout = setTimeout(() => {
                loadSearchSuggestions(query);
            }, 300);
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (searchSuggestions && !searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
                searchSuggestions.style.display = 'none';
            }
        });

        // Show suggestions on focus if there's text
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim() && searchSuggestions) {
                loadSearchSuggestions(searchInput.value.trim());
            }
        });
    }
}

// Load search suggestions
async function loadSearchSuggestions(query) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    const searchSuggestionsContent = document.getElementById('searchSuggestionsContent');

    if (!searchSuggestions || !searchSuggestionsContent) return;

    try {
        // Show loading state
        searchSuggestionsContent.innerHTML = '<div class="suggestion-loading">Searching...</div>';
        searchSuggestions.style.display = 'block';

        // Call search API for suggestions - search by product name
        // Fetch more products to allow fuzzy matching for typos
        const response = await fetch(`${API_CONFIG.baseUrl}/products?name=${encodeURIComponent(query)}&search=${encodeURIComponent(query)}&per_page=20`, {
            headers: API_CONFIG.headers
        });

        if (response.ok) {
            const result = await response.json();

            if (result.success && result.data && result.data.length > 0) {
                // Filter suggestions by product name with fuzzy matching for typos
                const queryLower = query.toLowerCase().trim();
                const matchingProducts = result.data.filter(product => {
                    if (!product.name) return false;
                    return matchesProductNameApp(product.name, queryLower);
                });

                if (matchingProducts.length > 0) {
                    // Display suggestions
                    searchSuggestionsContent.innerHTML = '';
                    matchingProducts.forEach(product => {
                        const suggestionItem = document.createElement('div');
                        suggestionItem.className = 'search-suggestion-item';
                        suggestionItem.innerHTML = `
                            <i class="fas fa-search suggestion-icon"></i>
                            <span class="suggestion-text">${escapeHtml(product.name)}</span>
                        `;
                        suggestionItem.addEventListener('click', () => {
                            document.getElementById('searchInput').value = product.name;
                            searchSuggestions.style.display = 'none';
                            handleSearch();
                        });
                        searchSuggestionsContent.appendChild(suggestionItem);
                    });
                } else {
                    searchSuggestionsContent.innerHTML = '<div class="suggestion-empty">No suggestions found</div>';
                }

                // Add "View all results" option
                const viewAllItem = document.createElement('div');
                viewAllItem.className = 'search-suggestion-item view-all';
                viewAllItem.innerHTML = `
                    <i class="fas fa-arrow-right suggestion-icon"></i>
                    <span class="suggestion-text">View all results for "${escapeHtml(query)}"</span>
                `;
                viewAllItem.addEventListener('click', () => {
                    handleSearch();
                });
                searchSuggestionsContent.appendChild(viewAllItem);
            } else {
                searchSuggestionsContent.innerHTML = '<div class="suggestion-empty">No suggestions found</div>';
            }
        } else {
            searchSuggestionsContent.innerHTML = '<div class="suggestion-empty">No suggestions found</div>';
        }
    } catch (error) {
        // Silent error handling
        searchSuggestionsContent.innerHTML = '<div class="suggestion-empty">Error loading suggestions</div>';
    }
}

// Handle Search
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchSuggestions = document.getElementById('searchSuggestions');
    const query = searchInput.value.trim();

    // Hide suggestions
    if (searchSuggestions) {
        searchSuggestions.style.display = 'none';
    }

    if (query) {
        // Redirect to search results page
        window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
    }
}

// Add to Cart
async function addToCart(productId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // Check if authentication functions are available
    if (typeof isAuthenticated === 'undefined' || !isAuthenticated()) {
        window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
        return;
    }

    const result = await CART_API.addToCart(productId, 1);

    if (result.success) {
        await updateCartCountInHeader();
        showNotification('Product added to cart!', 'success', true); // Show with "View Cart" button
    } else {
        // If unauthorized, redirect to login
        if (result.unauthorized) {
            window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
        } else {
            showNotification(result.message || 'Failed to add to cart', 'error');
        }
    }
}

// Add to Cart and Redirect to Cart Page
async function addToCartAndRedirect(productId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    if (typeof isAuthenticated === 'undefined' || !isAuthenticated()) {
        window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
        return;
    }

    const result = await CART_API.addToCart(productId, 1);

    if (result.success) {
        await updateCartCountInHeader();
        window.location.href = '/cart.html';
    } else {
        if (result.unauthorized) {
            window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
        } else {
            showNotification(result.message || 'Failed to add to cart', 'error');
        }
    }
}

// Update Cart Count
function updateCartCount() {
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
        cartCountElement.style.display = cartCount > 0 ? 'flex' : 'none';
    }
}

// Quick View
async function quickView(productId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    try {
        // Fetch product details
        const result = await makeApiCall(`/products/${productId}`);

        if (result.success && result.data) {
            showQuickViewModal(result.data);
        } else {
            showNotification('Product details not available');
        }
    } catch (error) {
        // Silent error handling
        showNotification('Failed to load product details');
    }
}

// Show Quick View Modal
function showQuickViewModal(product) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 8px;
        max-width: 800px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        padding: 30px;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 30px;
        cursor: pointer;
        color: #666;
    `;
    closeBtn.onclick = () => document.body.removeChild(modal);

    modalContent.innerHTML = `
        <img src="${product.image_url || '/images/placeholder.svg'}" style="width: 100%; max-height: 400px; object-fit: contain; margin-bottom: 20px;">
        <h2>${escapeHtml(product.name || 'Product')}</h2>
        <p>${escapeHtml(product.description || '')}</p>
        <div style="margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #2874f0;">₹${formatPrice(product.price || 0)}</span>
            ${product.original_price && product.original_price > product.price ? `
                <span style="text-decoration: line-through; color: #999; margin-left: 10px;">₹${formatPrice(product.original_price)}</span>
            ` : ''}
        </div>
        <button onclick="addToCart(${product.id}, event); document.body.removeChild(this.closest('.quick-view-modal'));" 
                style="padding: 12px 24px; background: #2874f0; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
            Add to Cart
        </button>
    `;

    modalContent.appendChild(closeBtn);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// View Product
function viewProduct(productSlugOrId) {
    // Navigate to product detail page
    window.location.href = `/product/${productSlugOrId}`;
}

// Show Notification
function showNotification(message, type = 'success', showViewCart = false) {
    // Create notification element
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2874f0';

    let notificationContent = message;
    if (showViewCart && type === 'success') {
        notificationContent = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span>${message}</span>
                <a href="/cart.html" style="background: white; color: ${bgColor}; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-weight: 500; white-space: nowrap;">View Cart</a>
            </div>
        `;
    }

    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background-color: ${bgColor};
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;

    if (showViewCart && type === 'success') {
        notification.innerHTML = notificationContent;
    } else {
        notification.textContent = message;
    }

    document.body.appendChild(notification);

    // Remove after 3-5 seconds (longer if View Cart button is shown)
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, showViewCart ? 5000 : 3000);
}

// Add CSS animations for notification
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    .out-of-stock {
        color: #f44336;
        font-size: 12px;
        font-weight: 500;
        margin: 5px 0;
    }
    .product-card .btn-add-cart:disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);

// Export functions for global access
window.loadBanners = loadBanners;
window.loadFeaturedProducts = loadFeaturedProducts;
window.retryLoadProducts = retryLoadProducts;
window.addToCart = addToCart;
window.addToCartAndRedirect = addToCartAndRedirect;
window.quickView = quickView;
window.viewProduct = viewProduct;
// Fetch and Render Dynamic Sections
async function fetchAndRenderDynamicSections() {
    try {
        const isMobile = window.innerWidth <= 768;
        const groupSlug = isMobile ? 'homepage-for-mobile-view' : 'homepage-for-desktop-view';

        const result = await makeApiCall(`/section-groups/${groupSlug}`);
        if (window.innerWidth <= 768) {
            console.log('Section Group Response:', result);
        }

        if (result && result.success && result.data && Array.isArray(result.data.sections)) {
            const sections = result.data.sections;
            const dynamicContainer = document.getElementById('dynamic-sections-container');
            if (dynamicContainer) {
                dynamicContainer.innerHTML = '';
                let index = 0;
                for (const section of sections) {
                    await SectionRenderer.render(section, dynamicContainer, index++);
                }

                // Hide static banner container if dynamic sections are loaded
                const staticBanner = document.getElementById('bannerContainer');
                if (staticBanner && sections.length > 0) {
                    staticBanner.closest('.banner-section').style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Dynamic Sections Fetch Failed:', error.message);
    }
}


