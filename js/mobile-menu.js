// Mobile Menu Functionality
// Handles mobile navigation menu toggle and interactions

document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
});

function initMobileMenu() {
    // Create mobile menu toggle button if it doesn't exist
    const headerContainer = document.querySelector('.header-container');
    if (!headerContainer) return;

    // Check if mobile menu toggle already exists
    let mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (!mobileToggle) {
        mobileToggle = document.createElement('button');
        mobileToggle.className = 'mobile-menu-toggle';
        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
        mobileToggle.setAttribute('aria-label', 'Toggle mobile menu');
        headerContainer.insertBefore(mobileToggle, headerContainer.firstChild);
    }

    // BREAKING: prevent double-initialization if both scripts run
    if (mobileToggle.getAttribute('data-mobile-menu-init')) return;
    mobileToggle.setAttribute('data-mobile-menu-init', 'true');

    // Create mobile nav overlay if it doesn't exist
    let mobileOverlay = document.querySelector('.mobile-nav-overlay');
    if (!mobileOverlay) {
        mobileOverlay = document.createElement('div');
        mobileOverlay.className = 'mobile-nav-overlay';
        document.body.appendChild(mobileOverlay);
    }

    // Create mobile nav menu if it doesn't exist
    let mobileNavMenu = document.querySelector('.mobile-nav-menu');
    if (!mobileNavMenu) {
        mobileNavMenu = createMobileNavMenu();
        document.body.appendChild(mobileNavMenu);
    }

    // Toggle mobile menu
    mobileToggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleMobileMenu();
    });

    // Close mobile menu when overlay is clicked
    mobileOverlay.addEventListener('click', function () {
        closeMobileMenu();
    });

    // Close mobile menu when close button is clicked
    const closeBtn = mobileNavMenu.querySelector('.mobile-nav-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            closeMobileMenu();
        });
    }

    // Handle expandable menu items (Login, More)
    setupMobileMenuExpandables();

    // Close mobile menu on window resize (if resized to desktop)
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function (e) {
        if (mobileNavMenu.classList.contains('active') &&
            !mobileNavMenu.contains(e.target) &&
            !mobileToggle.contains(e.target)) {
            closeMobileMenu();
        }
    });
}

function createMobileNavMenu() {
    const navMenu = document.createElement('div');
    navMenu.className = 'mobile-nav-menu';

    let navContent = `
        <div class="mobile-nav-header">
            <div style="font-weight: 600; font-size: 18px;">Menu</div>
            <button class="mobile-nav-close" aria-label="Close menu">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="mobile-nav-content">
            <div class="mobile-nav-loading" style="padding: 20px; text-align: center; color: #666;">
                <i class="fas fa-spinner fa-spin"></i> Loading menu...
            </div>
        </div>
    `;

    navMenu.innerHTML = navContent;

    // Load menu items from Menu API
    loadMobileMenuItems();

    return navMenu;
}

// Load menu items from Menu API
async function loadMobileMenuItems() {
    const mobileNavContent = document.querySelector('.mobile-nav-content');
    if (!mobileNavContent) return;

    try {
        // Build header items first (Login, Sell with Us, More, Cart)
        let navContent = buildHeaderMenuItems();

        // Use the same API config if available
        const apiConfig = typeof API_CONFIG !== 'undefined' ? API_CONFIG : {
            baseUrl: '/api',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };

        const makeApiCall = typeof window.makeApiCall !== 'undefined' ? window.makeApiCall : async function (endpoint, options = {}) {
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
        };

        const result = await makeApiCall('/menus', { timeout: 5000 });

        if (result && result.success && result.data && Array.isArray(result.data)) {
            const menus = result.data;

            // Filter out categories - only show non-category items
            const nonCategoryMenus = menus.filter(menu => menu && menu.type !== 'category');

            // Don't add categories to mobile menu - user requested to remove them
            // Just show header items (Login, Sell with Us, More, Cart)
            // Categories are already shown in the homepage categories section

            mobileNavContent.innerHTML = navContent;
        } else {
            // Fallback - just show header items, no categories
            mobileNavContent.innerHTML = navContent;
        }
    } catch (error) {
        // /* console.log */('Mobile menu load error:', error.message);
        // Fallback - just show header items, no categories
        let navContent = buildHeaderMenuItems();
        mobileNavContent.innerHTML = navContent;
    }
}

// Build header menu items (Download App, Login, Sell with Us, More, Cart)
function buildHeaderMenuItems() {
    let content = '';

    // Download App Button - Add above Login
    const downloadAppBtn = document.querySelector('.download-app-btn');
    const downloadAppHref = downloadAppBtn ? downloadAppBtn.getAttribute('href') : '#';
    content += `
        <div class="mobile-nav-item mobile-nav-header-item">
            <a href="${escapeHtml(downloadAppHref)}" class="mobile-nav-link">
                <span><i class="fas fa-mobile-alt"></i> Download App</span>
                <i class="fas fa-chevron-right"></i>
            </a>
        </div>
    `;

    // Login Section - ALWAYS include this section
    const loginBtn = document.getElementById('loginBtn');
    const loginDropdown = document.getElementById('loginDropdown');

    // Always add Login section, even if elements aren't found
    content += `
        <div class="mobile-nav-item mobile-nav-header-item">
            <div class="mobile-nav-link mobile-nav-expandable" data-expand="login">
                <span><i class="fas fa-user"></i> Login</span>
                <i class="fas fa-chevron-down mobile-nav-expand-icon"></i>
            </div>
            <div class="mobile-nav-submenu" id="mobile-nav-login">
    `;

    if (loginDropdown && loginDropdown.children.length > 0) {
        // Get all children including dividers from the actual dropdown
        const dropdownChildren = loginDropdown.children;
        Array.from(dropdownChildren).forEach(item => {
            if (item.classList.contains('dropdown-item')) {
                const href = item.getAttribute('href') || '#';
                const text = item.textContent.trim();
                const icon = item.querySelector('i');
                const iconClass = icon ? icon.className : 'fas fa-circle';

                content += `
                    <a href="${escapeHtml(href)}" class="mobile-nav-sublink">
                        <i class="${iconClass}"></i>
                        <span>${escapeHtml(text)}</span>
                    </a>
                `;
            } else if (item.classList.contains('dropdown-divider')) {
                // Add divider in mobile menu
                content += `<div class="mobile-nav-divider"></div>`;
            }
        });
    } else {
        // Default login items - include all items from login dropdown
        content += `
            <a href="/login.html" class="mobile-nav-sublink">
                <i class="fas fa-sign-in-alt"></i>
                <span>Login</span>
            </a>
            <a href="/signup.html" class="mobile-nav-sublink">
                <i class="fas fa-user-plus"></i>
                <span>Sign Up</span>
            </a>
            <div class="mobile-nav-divider"></div>
            <a href="/profile.html" class="mobile-nav-sublink">
                <i class="fas fa-user"></i>
                <span>My Profile</span>
            </a>
            <a href="#" class="mobile-nav-sublink">
                <i class="fas fa-star"></i>
                <span>Mobitez Plus Zone</span>
            </a>
            <a href="/orders.html" class="mobile-nav-sublink">
                <i class="fas fa-shopping-bag"></i>
                <span>Orders</span>
            </a>
            <a href="/wishlist.html" class="mobile-nav-sublink">
                <i class="fas fa-heart"></i>
                <span>Wishlist</span>
            </a>
            <a href="#" class="mobile-nav-sublink">
                <i class="fas fa-gift"></i>
                <span>Rewards</span>
            </a>
            <a href="#" class="mobile-nav-sublink">
                <i class="fas fa-credit-card"></i>
                <span>Gift Cards</span>
            </a>
        `;
    }

    content += `
            </div>
        </div>
    `;

    // MY ORDERS Section
    content += `
        <div class="mobile-nav-item mobile-nav-header-item">
            <a href="/orders.html" class="mobile-nav-link">
                <span><i class="fas fa-shopping-bag"></i> MY ORDERS</span>
                <i class="fas fa-chevron-right"></i>
            </a>
        </div>
    `;

    // ACCOUNT SETTINGS Section
    content += `
        <div class="mobile-nav-item mobile-nav-header-item">
            <div class="mobile-nav-link mobile-nav-expandable" data-expand="account">
                <span><i class="fas fa-cog"></i> ACCOUNT SETTINGS</span>
                <i class="fas fa-chevron-down mobile-nav-expand-icon"></i>
            </div>
            <div class="mobile-nav-submenu" id="mobile-nav-account">
                <a href="/profile.html" class="mobile-nav-sublink">
                    <span>Profile Information</span>
                </a>
                <a href="/profile.html?section=addresses" class="mobile-nav-sublink">
                    <span>Manage Addresses</span>
                </a>
                <a href="/profile.html?section=pan" class="mobile-nav-sublink">
                    <span>PAN Card Information</span>
                </a>
            </div>
        </div>
    `;

    // PAYMENTS Section
    content += `
        <div class="mobile-nav-item mobile-nav-header-item">
            <div class="mobile-nav-link mobile-nav-expandable" data-expand="payments">
                <span><i class="fas fa-credit-card"></i> PAYMENTS</span>
                <i class="fas fa-chevron-down mobile-nav-expand-icon"></i>
            </div>
            <div class="mobile-nav-submenu" id="mobile-nav-payments">
                <a href="/profile.html?section=giftcards" class="mobile-nav-sublink">
                    <span>Gift Cards</span>
                </a>
                <a href="/profile.html?section=upi" class="mobile-nav-sublink">
                    <span>Saved UPI</span>
                </a>
                <a href="/profile.html?section=cards" class="mobile-nav-sublink">
                    <span>Saved Cards</span>
                </a>
            </div>
        </div>
    `;

    // MY STUFF Section
    content += `
        <div class="mobile-nav-item mobile-nav-header-item">
            <div class="mobile-nav-link mobile-nav-expandable" data-expand="mystuff">
                <span><i class="fas fa-box"></i> MY STUFF</span>
                <i class="fas fa-chevron-down mobile-nav-expand-icon"></i>
            </div>
            <div class="mobile-nav-submenu" id="mobile-nav-mystuff">
                <a href="/profile.html?section=coupons" class="mobile-nav-sublink">
                    <span>My Coupons</span>
                </a>
                <a href="/profile.html?section=reviews" class="mobile-nav-sublink">
                    <span>My Reviews & Ratings</span>
                </a>
                <a href="/profile.html?section=notifications" class="mobile-nav-sublink">
                    <span>All Notifications</span>
                </a>
                <a href="/wishlist.html" class="mobile-nav-sublink">
                    <span>My Wishlist</span>
                </a>
            </div>
        </div>
    `;

    // Sell with Us
    const becomeSeller = document.querySelector('.become-seller');
    if (becomeSeller) {
        const href = becomeSeller.getAttribute('href') || '#';
        content += `
            <div class="mobile-nav-item mobile-nav-header-item">
                <a href="${escapeHtml(href)}" class="mobile-nav-link">
                    <span><i class="fas fa-store"></i> Sell with Us</span>
                    <i class="fas fa-chevron-right"></i>
                </a>
            </div>
        `;
    }

    // More Section
    const moreOptions = document.querySelector('.more-options');
    const moreDropdown = document.querySelector('.more-dropdown');

    if (moreOptions || moreDropdown) {
        content += `
            <div class="mobile-nav-item mobile-nav-header-item">
                <div class="mobile-nav-link mobile-nav-expandable" data-expand="more">
                    <span><i class="fas fa-ellipsis-h"></i> More</span>
                    <i class="fas fa-chevron-down mobile-nav-expand-icon"></i>
                </div>
                <div class="mobile-nav-submenu" id="mobile-nav-more">
        `;

        if (moreDropdown) {
            const dropdownItems = moreDropdown.querySelectorAll('.dropdown-item');
            dropdownItems.forEach(item => {
                const href = item.getAttribute('href') || '#';
                const text = item.textContent.trim();
                const icon = item.querySelector('i');
                const iconClass = icon ? icon.className : 'fas fa-circle';

                content += `
                    <a href="${escapeHtml(href)}" class="mobile-nav-sublink">
                        <i class="${iconClass}"></i>
                        <span>${escapeHtml(text)}</span>
                    </a>
                `;
            });
        } else {
            // Default more items
            content += `
                <a href="#" class="mobile-nav-sublink">
                    <i class="fas fa-bell"></i>
                    <span>Notification Preferences</span>
                </a>
                <a href="#" class="mobile-nav-sublink">
                    <i class="fas fa-headset"></i>
                    <span>24x7 Customer Care</span>
                </a>
                <a href="#" class="mobile-nav-sublink">
                    <i class="fas fa-download"></i>
                    <span>Download App</span>
                </a>
            `;
        }

        content += `
                </div>
            </div>
        `;
    }

    // Cart
    const cart = document.querySelector('.cart');
    if (cart) {
        const href = cart.getAttribute('href') || '/cart.html';
        const cartCount = cart.querySelector('.cart-count');
        const count = cartCount ? cartCount.textContent.trim() : '0';

        content += `
            <div class="mobile-nav-item mobile-nav-header-item">
                <a href="${escapeHtml(href)}" class="mobile-nav-link">
                    <span><i class="fas fa-shopping-cart"></i> Cart</span>
                    ${count !== '0' ? `<span class="mobile-nav-badge">${escapeHtml(count)}</span>` : '<i class="fas fa-chevron-right"></i>'}
                </a>
            </div>
        `;
    }

    return content;
}

// Get fallback menu items
function getFallbackMenuItems() {
    // Don't return categories - user requested to remove them from mobile menu
    // Categories are shown in the homepage categories section
    return ''; // Return empty - only show header items
}

// Get default fallback menu items
function getDefaultFallbackMenuItems() {
    // Don't return categories - user requested to remove them from mobile menu
    return ''; // Return empty - only show header items
}

function updateMobileNavMenu() {
    // Reload menu items from API
    loadMobileMenuItems();
}

function toggleMobileMenu() {
    const mobileNavMenu = document.querySelector('.mobile-nav-menu');
    const mobileOverlay = document.querySelector('.mobile-nav-overlay');

    if (!mobileNavMenu || !mobileOverlay) return;

    const isActive = mobileNavMenu.classList.contains('active');

    if (isActive) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    const mobileNavMenu = document.querySelector('.mobile-nav-menu');
    const mobileOverlay = document.querySelector('.mobile-nav-overlay');

    if (!mobileNavMenu || !mobileOverlay) return;

    // Update menu content before opening (reload from API)
    updateMobileNavMenu();

    mobileNavMenu.classList.add('active');
    mobileOverlay.classList.add('active');
    mobileOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent body scroll
}

function closeMobileMenu() {
    const mobileNavMenu = document.querySelector('.mobile-nav-menu');
    const mobileOverlay = document.querySelector('.mobile-nav-overlay');

    if (!mobileNavMenu || !mobileOverlay) return;

    mobileNavMenu.classList.remove('active');
    mobileOverlay.classList.remove('active');
    setTimeout(() => {
        mobileOverlay.style.display = 'none';
    }, 300);
    document.body.style.overflow = ''; // Restore body scroll
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Setup expandable menu items
function setupMobileMenuExpandables() {
    // Use event delegation for dynamically added elements
    document.addEventListener('click', function (e) {
        const expandable = e.target.closest('.mobile-nav-expandable');
        if (expandable) {
            e.preventDefault();
            const expandId = expandable.getAttribute('data-expand');
            const submenu = document.getElementById(`mobile-nav-${expandId}`);
            const icon = expandable.querySelector('.mobile-nav-expand-icon');

            if (submenu) {
                const isExpanded = submenu.classList.contains('expanded');

                // Close all other submenus
                document.querySelectorAll('.mobile-nav-submenu').forEach(menu => {
                    menu.classList.remove('expanded');
                });
                document.querySelectorAll('.mobile-nav-expand-icon').forEach(ic => {
                    ic.classList.remove('expanded');
                });

                // Toggle current submenu
                if (!isExpanded) {
                    submenu.classList.add('expanded');
                    if (icon) icon.classList.add('expanded');
                }
            }
        }
    });
}

// Export functions for use in other scripts
window.toggleMobileMenu = toggleMobileMenu;
window.openMobileMenu = openMobileMenu;
window.closeMobileMenu = closeMobileMenu;

