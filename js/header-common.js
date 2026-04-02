// Mobitez Header Loader
// Ensures consistent header across all pages matching the homepage nav

(function injectHeaderResources() {
    // Inject header styles if not already present
    const cssResources = [
        '/css/style.css'
    ];

    cssResources.forEach(href => {
        if (!document.querySelector(`link[href*="${href.split('/').pop()}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
        }
    });
})();

function loadHeader() {
    const headerContainer = document.getElementById('header-container') || document.querySelector('.header');
    if (!headerContainer) return;

    const isBlogPage = window.location.pathname.includes('blog');
    const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname.endsWith('/');

    const searchPlaceholder = isBlogPage ? "Search for blogs..." : "Search for Products";
    const logoSrc = isHomePage ? "/PNG/logo-yg.png?v=2" : "/PNG/logo-yw.png?v=2";

    const headerHtml = `
    <div class="header-container">
        <!-- Logo -->
        <div class="logo">
            <a href="/">
                <img src="${logoSrc}" alt="Mobitez" class="logo-image">
            </a>
        </div>

        <!-- Search Bar -->
        <div class="search-container">
            <button class="search-btn" id="searchBtn">
                <i class="fas fa-search"></i>
            </button>
            <input type="text" class="search-input" placeholder="${searchPlaceholder}" id="searchInput" autocomplete="off">
        </div>

        <!-- Right Side Menu (matches homepage) -->
        <div class="header-right">
            <div class="header-item login-dropdown-wrapper">
                <a href="/coming-soon.html" class="login-btn" id="loginBtn">
                    Login
                    <i class="fas fa-chevron-down"></i>
                </a>
                <div class="login-dropdown" id="loginDropdown">
                    <a href="/login.html" class="dropdown-item">
                        <i class="fas fa-sign-in-alt"></i>
                        Login
                    </a>
                    <a href="/signup.html" class="dropdown-item">
                        <i class="fas fa-user-plus"></i>
                        Sign Up
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="/profile.html" class="dropdown-item">
                        <i class="fas fa-user"></i>
                        My Profile
                    </a>
                    <a href="/coming-soon.html" class="dropdown-item">
                        <i class="fas fa-star"></i>
                        Mobitez Plus Zone
                    </a>
                    <a href="/orders.html" class="dropdown-item">
                        <i class="fas fa-shopping-bag"></i>
                        Orders
                    </a>
                    <a href="/wishlist.html" class="dropdown-item">
                        <i class="fas fa-heart"></i>
                        Wishlist
                    </a>
                    <a href="/coming-soon.html" class="dropdown-item">
                        <i class="fas fa-gift"></i>
                        Rewards
                    </a>
                    <a href="/coming-soon.html" class="dropdown-item">
                        <i class="fas fa-credit-card"></i>
                        Gift Cards
                    </a>
                </div>
            </div>
            <div class="header-item">
                <a href="https://seller.mobitez.webintez.com/" class="become-seller" target="_blank" rel="noopener">Sell with Us</a>
            </div>
            <div class="header-item more-dropdown-wrapper">
                <a href="/coming-soon.html" class="more-options">
                    More
                    <i class="fas fa-chevron-down"></i>
                </a>
                <div class="more-dropdown">
                    <a href="/coming-soon.html" class="dropdown-item">
                        <i class="fas fa-bell"></i>
                        Notification Preferences
                    </a>
                    <a href="/faq.html" class="dropdown-item">
                        <i class="fas fa-headset"></i>
                        24x7 Customer Care
                    </a>
                    <a href="/coming-soon.html" class="dropdown-item">
                        <i class="fas fa-download"></i>
                        Download App
                    </a>
                </div>
            </div>
            <div class="header-item">
                <a href="/cart.html" class="cart">
                    <i class="fas fa-shopping-cart"></i>
                    <span class="cart-text">Cart</span>
                    <span class="cart-count">0</span>
                </a>
            </div>
        </div>
    </div>
    `;

    // If it's a dedicated container, insert inside. If it's the header tag itself, replace content.
    if (headerContainer.tagName === 'HEADER') {
        headerContainer.classList.add('header');
        headerContainer.innerHTML = headerHtml;
    } else {
        headerContainer.innerHTML = `<header class="header">${headerHtml}</header>`;
    }

    // Initialize search if function exists (e.g., in search-common.js)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        if (typeof initializeSearch === 'function') {
            initializeSearch();
        } else if (typeof initSearch === 'function') {
            initSearch();
        }
    }

    // CRITICAL: Refresh Auth UI and Cart Count after dynamic header is injected
    if (typeof updateAuthUI === 'function') {
        updateAuthUI();
    }
    if (typeof updateCartCountInHeader === 'function') {
        updateCartCountInHeader();
    }

    // Initialize dropdowns
    setupHeaderDropdowns();
}

/**
 * Centered Dropdown Logic for Mobitez Header
 * Handles Login and More dropdowns consistently across all pages
 */
function setupHeaderDropdowns() {
    // 1. Login Dropdown
    const loginBtn = document.getElementById('loginBtn');
    const loginWrapper = loginBtn?.closest('.login-dropdown-wrapper');

    if (loginBtn && loginWrapper) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            loginWrapper.classList.toggle('active');

            // Close other dropdowns
            const moreWrapper = document.querySelector('.more-dropdown-wrapper');
            if (moreWrapper) moreWrapper.classList.remove('active');
        });
    }

    // 2. More Dropdown
    const moreOptions = document.querySelector('.more-options');
    const moreWrapper = document.querySelector('.more-dropdown-wrapper');
    const moreDropdown = document.querySelector('.more-dropdown');

    if (moreOptions && moreWrapper && moreDropdown) {
        moreOptions.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            moreWrapper.classList.toggle('active');

            // Close other dropdowns
            if (loginWrapper) loginWrapper.classList.remove('active');

            // Position if needed (optional refinement)
            if (moreWrapper.classList.contains('active')) {
                const btnRect = moreOptions.getBoundingClientRect();
                moreDropdown.style.top = (btnRect.bottom + 8) + 'px';
            }
        });
    }

    // 3. Global click-to-close
    document.addEventListener('click', (e) => {
        if (loginWrapper && !loginWrapper.contains(e.target)) {
            loginWrapper.classList.remove('active');
        }
        if (moreWrapper && !moreWrapper.contains(e.target)) {
            moreWrapper.classList.remove('active');
        }
    });
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader);
} else {
    loadHeader();
}
