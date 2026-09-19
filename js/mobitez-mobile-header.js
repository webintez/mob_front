// Flipkart-style Mobile Header Setup
// Creates download app button and reorganizes header for mobile view

(function () {
    'use strict';

    // Reflow-free viewport width check
    function isMobileViewport() {
        return window.matchMedia('(max-width: 768px)').matches;
    }

    // KEYBOARD GUARD — must be at the top so all code below can use it.
    // On mobile, tapping a search input causes:
    //   1. keyboard opens → viewport height shrinks → 'resize' event fires
    //   2. browser auto-scrolls to keep input visible → 'scroll' event fires
    // Any DOM manipulation during these events blurs the input and closes the keyboard.
    // This function returns true when a text input is actively focused.
    function isKeyboardOpen() {
        const ae = document.activeElement;
        if (!ae) return false;
        if (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable) return true;
        // Extra check via visualViewport (iOS/Android shrink viewport when keyboard opens)
        if (window.visualViewport && window.screen && window.screen.height > 0) {
            return window.visualViewport.height < window.screen.height * 0.75;
        }
        return false;
    }

    function shouldHideSearch() {
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug');
        return window.location.pathname.includes('profile.html') || 
               window.location.pathname.includes('orders.html') ||
               window.location.pathname.includes('coming-soon.html') ||
               (window.location.pathname.includes('page.html') && !!slug);
    }

    function setupFlipkartMobileHeader() {
        // Guard against redundant runs if the header is already restructured
        if (document.querySelector('.header-top-row')) return;

        // CRITICAL: Never restructure header DOM while keyboard is open
        // moving a focused element (searchContainer) causes blur → keyboard closes.
        if (isKeyboardOpen()) return;

        const headerContainer = document.querySelector('.header-container');
        if (!headerContainer) return;

        if (!isMobileViewport()) {
            // Desktop view - remove mobile-specific elements
            const downloadBtn = document.querySelector('.download-app-btn');
            if (downloadBtn && downloadBtn.parentNode) {
                downloadBtn.parentNode.removeChild(downloadBtn);
            }
            const topRow = document.querySelector('.header-top-row');
            if (topRow && topRow.parentNode) {
                // Move children back to header-container
                while (topRow.firstChild) {
                    headerContainer.insertBefore(topRow.firstChild, topRow);
                }
                topRow.parentNode.removeChild(topRow);
            }
            return;
        }

        // Hide header on orders page for mobile
        if (window.location.pathname.includes('orders.html')) {
            const header = document.querySelector('.header, header');
            if (header) {
                header.style.setProperty('display', 'none', 'important');
            }
            const mainEl = document.querySelector('main.main-content, main');
            if (mainEl) {
                mainEl.style.setProperty('padding-top', '0px', 'important');
            }
            return;
        }

        // Mobile view - setup Flipkart-style header

        // Create download app button if it doesn't exist
        let downloadBtn = document.querySelector('.download-app-btn');
        if (!downloadBtn) {
            downloadBtn = document.createElement('a');
            downloadBtn.className = 'download-app-btn';
            downloadBtn.href = '#';
            downloadBtn.innerHTML = '<i class="fas fa-mobile-alt"></i>';
            downloadBtn.setAttribute('aria-label', 'Download App');
            downloadBtn.setAttribute('title', 'Download App');

            // Add click handler
            downloadBtn.addEventListener('click', function (e) {
                e.preventDefault();
                // You can add download app logic here
                // For now, it could open a modal or redirect
                alert('Download Mobitez Private Limited App');
            });
        }

        // Find header-right container
        const headerRight = headerContainer.querySelector('.header-right');
        if (headerRight) {
            // Insert download app button before login button
            const loginWrapper = headerRight.querySelector('.login-dropdown-wrapper');
            if (loginWrapper && !downloadBtn.parentNode) {
                headerRight.insertBefore(downloadBtn, loginWrapper);
            } else if (!loginWrapper && !downloadBtn.parentNode) {
                headerRight.insertBefore(downloadBtn, headerRight.firstChild);
            }
        }

        // Create top row wrapper if it doesn't exist
        let topRow = document.querySelector('.header-top-row');
        if (!topRow) {
            topRow = document.createElement('div');
            topRow.className = 'header-top-row';

            // Get elements to move into top row
            let mobileToggle = headerContainer.querySelector('.mobile-menu-toggle') || document.querySelector('.mobile-menu-toggle');

            // PROACTIVE FIX: Create mobile menu toggle if it doesn't exist
            if (!mobileToggle) {
                mobileToggle = document.createElement('button');
                mobileToggle.className = 'mobile-menu-toggle';
                mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
                mobileToggle.setAttribute('aria-label', 'Toggle mobile menu');
                // Don't append yet, we'll append to topRow below
            }

            const logo = headerContainer.querySelector('.logo');
            const headerRight = headerContainer.querySelector('.header-right');

            // Move elements to top row
            if (mobileToggle) topRow.appendChild(mobileToggle);
            if (logo) topRow.appendChild(logo);
            if (headerRight) topRow.appendChild(headerRight);

            // Insert top row as first child
            headerContainer.insertBefore(topRow, headerContainer.firstChild);

            // Re-initialize mobile menu functionality if we created the toggle
            if (typeof initMobileMenu === 'function') {
                initMobileMenu();
            }
        }

        // Ensure top row has proper spacing (reuse topRow variable)
        if (topRow && isMobileViewport()) {
            // PROACTIVE FIX: Move mobile-menu-toggle into topRow if it's outside
            const mobileToggle = document.querySelector('.mobile-menu-toggle');
            if (mobileToggle && mobileToggle.parentElement !== topRow) {
                topRow.insertBefore(mobileToggle, topRow.firstChild);
            }

            topRow.style.setProperty('justify-content', 'space-between', 'important'); // Balanced distribution
            topRow.style.setProperty('gap', '4px', 'important'); // Balanced gap
            topRow.style.setProperty('padding', '8px 12px', 'important'); // Consistent padding
            topRow.style.setProperty('overflow', 'visible', 'important'); // Allow badge visibility
        }

        // Ensure search container is last (order: 2) and visible
        const searchContainer = headerContainer.querySelector('.search-container');
        if (searchContainer) {
            // Remove from current position if not in header-container
            if (searchContainer.parentNode !== headerContainer) {
                searchContainer.parentNode.removeChild(searchContainer);
            }
            // Add as last child to header-container
            headerContainer.appendChild(searchContainer);

            // Ensure it's visible (hidden on specific pages)
            searchContainer.style.setProperty('display', shouldHideSearch() ? 'none' : 'flex', 'important');
            searchContainer.style.setProperty('order', '2', 'important');

            // Remove nav-menu on mobile - hide completely
            const navMenu = document.querySelector('nav.nav-menu');
            if (navMenu && isMobileViewport()) {
                navMenu.style.setProperty('display', 'none', 'important');
                navMenu.style.setProperty('height', '0', 'important');
                navMenu.style.setProperty('visibility', 'hidden', 'important');
                navMenu.style.setProperty('opacity', '0', 'important');
                navMenu.style.setProperty('position', 'absolute', 'important');
                navMenu.style.setProperty('left', '-9999px', 'important');
                navMenu.style.setProperty('margin', '0', 'important');
                navMenu.style.setProperty('padding', '0', 'important');

                // Remove any text nodes between header and main
                const header = document.querySelector('header');
                const main = document.querySelector('main');
                if (header && main) {
                    let node = header.nextSibling;
                    const nodesToRemove = [];
                    while (node && node !== main) {
                        if (node.nodeType === 3) { // Text node
                            const text = node.textContent.trim();
                            if (!text || text.length === 0) {
                                nodesToRemove.push(node);
                            }
                        }
                        node = node.nextSibling;
                    }
                    nodesToRemove.forEach(n => n.remove());
                }
            }
            searchContainer.style.setProperty('width', '100%', 'important');
        }

        // Force header and container styles to ensure search bar is visible
        const header = document.querySelector('.header');
        if (header) {
            header.style.setProperty('height', 'auto', 'important');
            header.style.setProperty('max-height', 'none', 'important');
            header.style.setProperty('overflow', 'visible', 'important');
            header.style.setProperty('overflow-y', 'visible', 'important');
        }

        if (headerContainer) {
            headerContainer.style.setProperty('height', 'auto', 'important');
            headerContainer.style.setProperty('max-height', 'none', 'important');
            headerContainer.style.setProperty('overflow', 'visible', 'important');
            headerContainer.style.setProperty('flex-direction', 'column', 'important');
        }

        // Ensure Login button is visible (not hidden) and properly formatted
        const loginBtn = document.querySelector('.login-btn');
        const loginWrapper = document.querySelector('.login-dropdown-wrapper');
        // Reuse headerRight from above (line 50) or get it if not already defined
        const headerRightForLogin = headerRight || document.querySelector('.header-right');

        if (loginBtn && isMobileViewport()) {
            // CRITICAL: Override mobile-responsive.css that hides login button
            loginBtn.style.setProperty('display', 'flex', 'important');
            loginBtn.style.setProperty('visibility', 'visible', 'important');
            loginBtn.style.setProperty('opacity', '1', 'important');
            loginBtn.style.setProperty('pointer-events', 'auto', 'important');
            loginBtn.style.setProperty('width', 'auto', 'important');
            loginBtn.style.setProperty('height', 'auto', 'important');
            loginBtn.style.setProperty('white-space', 'nowrap', 'important');
            loginBtn.style.setProperty('overflow', 'visible', 'important');
            loginBtn.style.setProperty('font-size', '11px', 'important'); // Match CSS
            loginBtn.style.setProperty('padding', '0 6px', 'important'); // Match CSS
            loginBtn.style.setProperty('flex-shrink', '0', 'important');
            loginBtn.style.setProperty('gap', '3px', 'important'); // Match CSS
            loginBtn.style.setProperty('max-width', '65px', 'important'); // Match CSS
            loginBtn.style.setProperty('box-sizing', 'border-box', 'important');

            // Set login link for mobile - ensure it's always set
            if (loginBtn.tagName === 'A') {
                // Store classes and ID before cloning
                const btnClasses = loginBtn.className;
                const btnId = loginBtn.id;
                const btnInnerHTML = loginBtn.innerHTML;

                // Remove all existing click handlers by cloning the node
                // This is the most reliable way to remove all event listeners
                const newLoginBtn = document.createElement('a');
                newLoginBtn.href = '/login.html';
                newLoginBtn.id = btnId;
                newLoginBtn.className = btnClasses;

                // Remove chevron from innerHTML and add user icon
                let cleanHTML = btnInnerHTML.replace(/<i[^>]*fa-chevron-down[^>]*>.*?<\/i>/gi, '');
                if (!cleanHTML.includes('fa-user')) {
                    cleanHTML = '<i class="fas fa-user"></i> ' + cleanHTML.trim();
                }
                newLoginBtn.innerHTML = cleanHTML;

                // Use onclick attribute to ensure it works (runs before addEventListener)
                newLoginBtn.setAttribute('onclick', 'if(window.matchMedia("(max-width: 768px)").matches){window.location.href="/login.html";return false;}');

                // Also add event listener as backup
                newLoginBtn.addEventListener('click', function (e) {
                    if (isMobileViewport()) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        window.location.href = '/login.html';
                        return false;
                    }
                }, true); // Use capture phase

                // Replace the old button
                loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
            } else {
                // If not an anchor, remove chevron and add user icon
                const chevron = loginBtn.querySelector('.fa-chevron-down');
                if (chevron) {
                    chevron.remove();
                }

                if (!loginBtn.querySelector('.fa-user')) {
                    const userIcon = document.createElement('i');
                    userIcon.className = 'fas fa-user';
                    loginBtn.insertBefore(userIcon, loginBtn.firstChild);
                }
            }
        }
        if (loginWrapper && isMobileViewport()) {
            // CRITICAL: Override mobile-responsive.css that hides login wrapper
            loginWrapper.style.setProperty('display', 'flex', 'important');
            loginWrapper.style.setProperty('visibility', 'visible', 'important');
            loginWrapper.style.setProperty('opacity', '1', 'important');
            loginWrapper.style.setProperty('pointer-events', 'auto', 'important');
            loginWrapper.style.setProperty('width', 'auto', 'important');
            loginWrapper.style.setProperty('height', 'auto', 'important');
            loginWrapper.style.setProperty('overflow', 'visible', 'important');
            loginWrapper.style.setProperty('flex-shrink', '0', 'important');
            loginWrapper.style.setProperty('gap', '4px', 'important');
            loginWrapper.style.setProperty('min-width', 'auto', 'important');
            loginWrapper.style.setProperty('max-width', 'none', 'important');
            loginWrapper.style.setProperty('padding', '0', 'important');
            loginWrapper.style.setProperty('margin', '0', 'important');
            loginWrapper.style.setProperty('overflow', 'visible', 'important');
        }
        if (headerRightForLogin && isMobileViewport()) {
            headerRightForLogin.style.setProperty('display', 'flex', 'important'); // Ensure show
            headerRightForLogin.style.setProperty('visibility', 'visible', 'important');
            headerRightForLogin.style.setProperty('opacity', '1', 'important');
            headerRightForLogin.style.setProperty('flex-wrap', 'nowrap', 'important'); // Prevent wrapping
            headerRightForLogin.style.setProperty('gap', '6px', 'important'); // Match CSS
            headerRightForLogin.style.setProperty('overflow', 'visible', 'important');
            headerRightForLogin.style.setProperty('min-width', '0', 'important');
            headerRightForLogin.style.setProperty('max-width', 'none', 'important'); // Remove width limit
            headerRightForLogin.style.setProperty('width', 'auto', 'important'); // Allow natural width
            headerRightForLogin.style.setProperty('margin-left', '0', 'important');
            headerRightForLogin.style.setProperty('margin-right', '0', 'important');
            headerRightForLogin.style.setProperty('flex-shrink', '0', 'important'); // Don't shrink
            headerRightForLogin.style.setProperty('box-sizing', 'border-box', 'important');

            // Ensure all children are visible if they contain relevant icons
            const items = headerRightForLogin.querySelectorAll('.header-item');
            items.forEach(item => {
                const hasLogin = item.querySelector('.login-btn');
                const hasCart = item.querySelector('.cart');
                const hasDownload = item.querySelector('.download-app-btn');

                if (hasLogin || hasCart || hasDownload) {
                    item.style.setProperty('display', 'flex', 'important');
                    item.style.setProperty('visibility', 'visible', 'important');
                    item.style.setProperty('opacity', '1', 'important');
                    item.style.setProperty('width', 'auto', 'important');
                    item.style.setProperty('height', 'auto', 'important');
                    item.style.setProperty('position', 'relative', 'important');

                    // Specific button visibility
                    const btn = item.querySelector('.login-btn, .cart, .download-app-btn');
                    if (btn) {
                        btn.style.setProperty('display', 'flex', 'important');
                        btn.style.setProperty('visibility', 'visible', 'important');
                        btn.style.setProperty('opacity', '1', 'important');
                        btn.style.setProperty('overflow', 'visible', 'important');

                        // For Cart specifically, ensure the icon is visible
                        if (hasCart) {
                            const cartIcon = btn.querySelector('i');
                            if (cartIcon) {
                                cartIcon.style.setProperty('display', 'block', 'important');
                                // cartIcon.style.setProperty('color', '#212121', 'important'); // DISABLED TO ALLOW CSS OVERRIDE
                            }
                            const cartCount = btn.querySelector('.cart-count');
                            if (cartCount) cartCount.style.setProperty('display', 'flex', 'important');
                        }
                    }
                }
            });
        }

        // Final fallback: check for any element with .login-btn or .cart class and force show
        document.querySelectorAll('.login-btn, .cart').forEach(el => {
            if (isMobileViewport()) {
                el.style.setProperty('display', 'flex', 'important');
                el.style.setProperty('visibility', 'visible', 'important');
                el.style.setProperty('opacity', '1', 'important');

                // Color fallback for cart icon - DISABLED TO ALLOW CSS OVERRIDE
                /*
                if (el.classList.contains('cart')) {
                    const i = el.querySelector('i');
                    if (i) i.style.setProperty('color', '#212121', 'important');
                }
                */

                let parent = el.parentElement;
                while (parent && !parent.classList.contains('header-top-row')) {
                    if (parent.classList.contains('header-item') || parent.classList.contains('header-right')) {
                        parent.style.setProperty('display', 'flex', 'important');
                        parent.style.setProperty('visibility', 'visible', 'important');
                        parent.style.setProperty('opacity', '1', 'important');
                    }
                    parent = parent.parentElement;
                }
            }
        });

        // Ensure logo has proper spacing
        const logo = document.querySelector('.logo');
        if (logo && isMobileViewport()) {
            logo.style.setProperty('margin-right', '8px', 'important'); // Add space after logo
        }

        // Ensure login link is set (run this separately to catch timing issues)
        // This runs after other scripts to override their handlers
        const loginBtnForLink = document.querySelector('#loginBtn');
        if (loginBtnForLink && isMobileViewport() && loginBtnForLink.tagName === 'A') {
            // Check if this button already has our handler (avoid duplicates)
            const hasOurHandler = loginBtnForLink.getAttribute('data-mobile-login-handler');
            if (!hasOurHandler) {
                // Clone and replace to remove all existing handlers
                const btnClasses = loginBtnForLink.className;
                const btnId = loginBtnForLink.id;
                const btnInnerHTML = loginBtnForLink.innerHTML;

                // Create new button element
                const newBtn = document.createElement('a');
                newBtn.href = '/login.html';
                newBtn.id = btnId;
                newBtn.className = btnClasses;
                newBtn.setAttribute('data-mobile-login-handler', 'true');

                // Remove chevron from innerHTML and add user icon
                let cleanHTML = btnInnerHTML.replace(/<i[^>]*fa-chevron-down[^>]*>.*?<\/i>/gi, '');
                if (!cleanHTML.includes('fa-user')) {
                    cleanHTML = '<i class="fas fa-user"></i> ' + cleanHTML.trim();
                }
                newBtn.innerHTML = cleanHTML;

                // Use onclick attribute to ensure it works (runs before addEventListener)
                newBtn.setAttribute('onclick', 'if(window.matchMedia("(max-width: 768px)").matches){window.location.href="/login.html";return false;}');

                // Also add event listener as backup
                newBtn.addEventListener('click', function (e) {
                    if (isMobileViewport()) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        window.location.href = '/login.html';
                        return false;
                    }
                }, true); // Use capture phase

                // Replace the old button
                loginBtnForLink.parentNode.replaceChild(newBtn, loginBtnForLink);
            }
        }

        // NOTE: category item padding/gap is now controlled purely by CSS.
        // Do NOT set inline styles here — they override all CSS !important rules.


        // Move categories nav inside header on mobile
        moveCategoriesNavOnMobile();

        // Start observing header height for deterministic main padding
        initHeaderResizeObserver();
    }

    // ============================================
    // MOBILE CATEGORIES NAV: Move inside header below search bar
    // ============================================
    // Store original parent so we can restore on desktop
    let _catsOriginalParent = null;
    let _catsOriginalNextSibling = null;

    function moveCategoriesNavOnMobile() {
        const categoriesNav = document.querySelector('.homepage-categories-nav');
        const hdrContainer = document.querySelector('.header-container');
        const hdr = document.querySelector('.header, header');
        const mainEl = document.querySelector('main.main-content, main');

        if (!categoriesNav) return;

        if (isMobileViewport() && document.body.classList.contains('homepage')) {
            // Only move if not already inside header
            if (!hdrContainer || hdrContainer.contains(categoriesNav)) {
                // Already moved — just ensure height/overflow is correct
                if (hdrContainer) {
                    hdrContainer.style.setProperty('max-height', 'none', 'important');
                    hdrContainer.style.setProperty('overflow-y', 'visible', 'important');
                    hdrContainer.style.setProperty('height', 'auto', 'important');
                }
                if (hdr) {
                    hdr.style.setProperty('height', 'auto', 'important');
                    hdr.style.setProperty('max-height', 'none', 'important');
                    hdr.style.setProperty('overflow-y', 'visible', 'important');
                }
                return;
            }

            // Remember where to restore it
            if (!_catsOriginalParent) {
                _catsOriginalParent = categoriesNav.parentNode;
                _catsOriginalNextSibling = categoriesNav.nextSibling;
            }

            // CRITICAL: Override header-container clipping (max-height:56px, overflow:hidden)
            if (hdrContainer) {
                hdrContainer.style.setProperty('max-height', 'none', 'important');
                hdrContainer.style.setProperty('overflow-y', 'visible', 'important');
                hdrContainer.style.setProperty('height', 'auto', 'important');
            }
            // Also override on the header element itself
            if (hdr) {
                hdr.style.setProperty('height', 'auto', 'important');
                hdr.style.setProperty('max-height', 'none', 'important');
                hdr.style.setProperty('overflow-y', 'visible', 'important');
            }

            // Apply mobile-in-header styles to categories nav
            // Use 'static' position to fully override sticky/sticky CSS
            categoriesNav.style.setProperty('position', 'static', 'important');
            categoriesNav.style.setProperty('top', 'unset', 'important');
            categoriesNav.style.setProperty('z-index', 'inherit', 'important');
            categoriesNav.style.setProperty('margin-top', '0', 'important');
            categoriesNav.style.setProperty('padding-top', '0', 'important');
            categoriesNav.style.setProperty('width', '100%', 'important');
            categoriesNav.style.setProperty('box-shadow', 'none', 'important');
            // CRITICAL: order:3 so it appears AFTER header-top-row(order:1) and search(order:2)
            categoriesNav.style.setProperty('order', '3', 'important');
            // CRITICAL: override any display:none that CSS may set
            categoriesNav.style.setProperty('display', 'block', 'important');
            categoriesNav.style.setProperty('visibility', 'visible', 'important');
            categoriesNav.style.setProperty('opacity', '1', 'important');

            // Append after search container inside header-container
            hdrContainer.appendChild(categoriesNav);

            hdrContainer.appendChild(categoriesNav);
            
            // Initial call to moveCategoriesNavOnMobile will now follow with setupFlipkartMobileHeader 
            // starting the ResizeObserver, which will handle the initial padding.


        } else {
            // Desktop: restore categories nav to original position in main
            if (_catsOriginalParent && !_catsOriginalParent.contains(categoriesNav)) {
                if (_catsOriginalNextSibling && _catsOriginalNextSibling.parentNode === _catsOriginalParent) {
                    _catsOriginalParent.insertBefore(categoriesNav, _catsOriginalNextSibling);
                } else {
                    _catsOriginalParent.insertBefore(categoriesNav, _catsOriginalParent.firstChild);
                }
            }
            // Reset inline styles set for mobile
            categoriesNav.style.removeProperty('position');
            categoriesNav.style.removeProperty('top');
            categoriesNav.style.removeProperty('z-index');
            categoriesNav.style.removeProperty('margin-top');
            categoriesNav.style.removeProperty('padding-top');
            categoriesNav.style.removeProperty('width');
            categoriesNav.style.removeProperty('box-shadow');
            categoriesNav.style.removeProperty('order');
            categoriesNav.style.removeProperty('display');
            categoriesNav.style.removeProperty('visibility');
            categoriesNav.style.removeProperty('opacity');
            // Restore header-container overflow
            if (hdrContainer) {
                hdrContainer.style.removeProperty('max-height');
                hdrContainer.style.removeProperty('overflow-y');
                hdrContainer.style.removeProperty('height');
            }
            if (hdr) {
                hdr.style.removeProperty('height');
                hdr.style.removeProperty('max-height');
                hdr.style.removeProperty('overflow-y');
            }
            if (mainEl) mainEl.style.removeProperty('padding-top');
        }
    }

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupFlipkartMobileHeader);
    } else {
        setupFlipkartMobileHeader();
    }

    // Run on resize — but NEVER while the keyboard is open
    let resizeTimeout;
    window.addEventListener('resize', function () {
        if (isKeyboardOpen()) return;
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
            if (!isKeyboardOpen()) {
                setupFlipkartMobileHeader();
                moveCategoriesNavOnMobile();
            }
        }, 150);
    });

    // Run after a delay to catch dynamically loaded content
    // Wrap every delayed call with a keyboard guard
    function safeSetupLater(delay) {
        setTimeout(function () {
            if (!isKeyboardOpen()) {
                setupFlipkartMobileHeader();
                moveCategoriesNavOnMobile();
            }
        }, delay);
    }
    safeSetupLater(500);
    safeSetupLater(1000);
    safeSetupLater(2000);
    safeSetupLater(3000);

    // Also run when DOM is fully ready
    if (document.readyState === 'complete') {
        setTimeout(function () { if (!isKeyboardOpen()) setupFlipkartMobileHeader(); }, 100);
    } else {
        window.addEventListener('load', function () {
            setTimeout(function () { if (!isKeyboardOpen()) setupFlipkartMobileHeader(); }, 100);
            setTimeout(function () { if (!isKeyboardOpen()) setupFlipkartMobileHeader(); }, 2000);
        });
    }

    // Add document-level click handler as ultimate fallback for login button
    document.addEventListener('click', function (e) {
        const target = e.target.closest('#loginBtn, .login-btn');
        if (target && isMobileViewport()) {
            // Check if it's the login button
            const loginBtn = document.getElementById('loginBtn');
            if (target === loginBtn || (loginBtn && target.closest && target.closest('.login-btn') === loginBtn)) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                window.location.href = '/login.html';
                return false;
            }
        }
    }, true); // Use capture phase to run before other handlers

    // ============================================
    // MAIN CONTENT PADDING: always match actual header height
    // Using ResizeObserver for deterministic, real-time height tracking.
    // ============================================
    var _headerObserver = null;
    function updateMainPadding() {
        if (!isMobileViewport()) return;
        
        // Target main element or page-container (used in page.html)
        let mainEl = document.querySelector('main.main-content, main');
        if (!mainEl) {
            mainEl = document.querySelector('.page-container');
        }
        
        const fullHdr = document.querySelector('.header, header');
        const cartHdr = document.querySelector('.cart-header-mobile');
        
        if (!mainEl) return;
        
        let hdrH = 0;
        if (fullHdr && fullHdr.offsetHeight > 0) {
            hdrH = fullHdr.offsetHeight;
        } else if (cartHdr && cartHdr.offsetHeight > 0) {
            // Fallback: use cart specific header height if main header is hidden (e.g. cart page)
            hdrH = cartHdr.offsetHeight;
        }
        
        // Apply padding with a small buffer. This runs reactively via ResizeObserver.
        if (hdrH > 0) {
            mainEl.style.setProperty('padding-top', hdrH + 'px', 'important');
        } else if (mainEl.classList.contains('product-main')) {
            // Initial fallback for product page BEFORE header content is loaded/measured
            mainEl.style.setProperty('padding-top', '56px', 'important');
        }
    }

    function initHeaderResizeObserver() {
        if (_headerObserver) return; // Already running
        const fullHdr = document.querySelector('.header, header');
        const cartHdr = document.querySelector('.cart-header-mobile');
        
        if (!fullHdr && !cartHdr) return;

        _headerObserver = new ResizeObserver(() => {
            requestAnimationFrame(updateMainPadding);
        });
        
        if (fullHdr) _headerObserver.observe(fullHdr);
        if (cartHdr) _headerObserver.observe(cartHdr);
        
        // Initial sync
        updateMainPadding();
    }



    // Initialize scroll state now (logo visible at top)
    // This ensures header-top-row is shown on fresh page load
    // without waiting for the first scroll event.
    (function initScrollState() {
        if (!isMobileViewport()) return;
        const headerTopRow = document.querySelector('.header-top-row');
        if (headerTopRow) {
            headerTopRow.style.setProperty('display', 'flex', 'important');
            headerTopRow.style.setProperty('opacity', '1', 'important');
            headerTopRow.style.setProperty('visibility', 'visible', 'important');
        }
    })();


    let lastScrollTop = 0;
    let scrollTimeout = null;
    const SCROLL_THRESHOLD = 10; // Minimum scroll distance to trigger hide/show
    let floatingToggle = null; // Reference to floating hamburger toggle
    let floatingSearchBar = null; // Reference to floating search bar

    function handleScroll() {
        if (!isMobileViewport()) {
            // Desktop - don't hide header, remove floating elements if exist
            if (floatingToggle && floatingToggle.parentNode) {
                floatingToggle.parentNode.removeChild(floatingToggle);
                floatingToggle = null;
            }
            if (floatingSearchBar && floatingSearchBar.parentNode) {
                floatingSearchBar.parentNode.removeChild(floatingSearchBar);
                floatingSearchBar = null;
            }
            const header = document.querySelector('.header');
            const headerTopRow = document.querySelector('.header-top-row');
            if (header) {
                header.classList.remove('header-hidden');
                header.style.setProperty('transform', 'translateY(0)', 'important');
            }
            if (headerTopRow) {
                headerTopRow.classList.remove('header-top-row-hidden');
                headerTopRow.style.setProperty('display', 'flex', 'important');
            }
            return;
        }

        const header = document.querySelector('.header');
        const headerTopRow = document.querySelector('.header-top-row');
        const searchContainer = document.querySelector('.search-container');
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        if (!header || !headerTopRow || !searchContainer || !mobileMenuToggle) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // At the top - always show full header
        if (scrollTop <= SCROLL_THRESHOLD) {
            header.classList.remove('header-hidden');
            header.style.setProperty('transform', 'translateY(0)', 'important');
            header.style.setProperty('transition', 'transform 0.3s ease-in-out', 'important');
            headerTopRow.classList.remove('header-top-row-hidden');
            headerTopRow.style.setProperty('display', 'flex', 'important');
            headerTopRow.style.setProperty('opacity', '1', 'important');
            headerTopRow.style.setProperty('visibility', 'visible', 'important');
            const isSearchHidden = shouldHideSearch();
            searchContainer.style.setProperty('display', isSearchHidden ? 'none' : 'flex', 'important');

            // Ensure nav-menu is visible and positioned correctly (if it exists and not on homepage, categories, or cart)
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu && !document.body.classList.contains('homepage') && !document.body.classList.contains('all-categories-page') && !document.body.classList.contains('cart-page')) {
                // CRITICAL: Force all visibility properties to ensure nav-menu stays visible
                navMenu.style.setProperty('top', '128px', 'important'); // 64px (top) + 4px (mg-t) + 48px (search) + 12px (mg-b)
                navMenu.style.setProperty('display', 'flex', 'important');
                navMenu.style.setProperty('visibility', 'visible', 'important');
                navMenu.style.setProperty('opacity', '1', 'important');
                navMenu.style.setProperty('transform', 'translateY(0)', 'important');
                navMenu.style.setProperty('position', 'fixed', 'important');
                navMenu.style.setProperty('z-index', '10001', 'important'); // Higher than header (10000)
                navMenu.style.setProperty('pointer-events', 'auto', 'important');
                navMenu.style.setProperty('transition', 'top 0.3s ease-in-out', 'important');
                // Remove any classes that might hide it
                navMenu.classList.remove('nav-menu-hidden', 'hidden', 'd-none');
            }

            // Remove floating elements if exist
            if (floatingToggle && floatingToggle.parentNode) {
                floatingToggle.parentNode.removeChild(floatingToggle);
                floatingToggle = null;
            }
            if (floatingSearchBar && floatingSearchBar.parentNode) {
                floatingSearchBar.parentNode.removeChild(floatingSearchBar);
                floatingSearchBar = null;
            }

            lastScrollTop = scrollTop;
            return;
        }

        // Scrolling down - hide top row (hamburger, logo, buttons), keep search bar visible
        if (scrollTop > lastScrollTop && scrollTop > SCROLL_THRESHOLD) {
            // Hide the top row (hamburger, logo, buttons)
            headerTopRow.classList.add('header-top-row-hidden');
            headerTopRow.style.setProperty('display', 'none', 'important');
            headerTopRow.style.setProperty('opacity', '0', 'important');
            headerTopRow.style.setProperty('visibility', 'hidden', 'important');
            headerTopRow.style.setProperty('transition', 'opacity 0.3s ease-in-out', 'important');

            // Keep search bar visible in header (hidden on specific pages)
            searchContainer.style.setProperty('display', shouldHideSearch() ? 'none' : 'flex', 'important');
            searchContainer.style.setProperty('margin-top', '8px', 'important');
            searchContainer.style.setProperty('margin-bottom', '8px', 'important');
            searchContainer.style.setProperty('padding-top', '0', 'important');

            // Adjust nav-menu position to be below search bar only (if it exists and not on homepage, categories, or cart)
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu && !document.body.classList.contains('homepage') && !document.body.classList.contains('all-categories-page') && !document.body.classList.contains('cart-page')) {
                // CRITICAL: Force all visibility properties to ensure nav-menu stays visible
                navMenu.style.setProperty('top', '64px', 'important'); // 8px (top gap) + 48px (search bar) + 8px (bottom gap)
                navMenu.style.setProperty('display', 'flex', 'important');
                navMenu.style.setProperty('visibility', 'visible', 'important');
                navMenu.style.setProperty('opacity', '1', 'important');
                navMenu.style.setProperty('transform', 'translateY(0)', 'important');
                navMenu.style.setProperty('position', 'fixed', 'important');
                navMenu.style.setProperty('z-index', '10001', 'important'); // Higher than header (10000)
                navMenu.style.setProperty('pointer-events', 'auto', 'important');
                navMenu.style.setProperty('transition', 'top 0.3s ease-in-out', 'important');
                // Remove any classes that might hide it
                navMenu.classList.remove('nav-menu-hidden', 'hidden', 'd-none');
            }

            // Remove floating hamburger toggle if it exists (don't show it)
            if (floatingToggle && floatingToggle.parentNode) {
                floatingToggle.parentNode.removeChild(floatingToggle);
                floatingToggle = null;
            }
        }
        // Scrolling up - show full header
        else if (scrollTop < lastScrollTop) {
            header.classList.remove('header-hidden');
            header.style.setProperty('transform', 'translateY(0)', 'important');
            header.style.setProperty('transition', 'transform 0.3s ease-in-out', 'important');
            headerTopRow.classList.remove('header-top-row-hidden');
            headerTopRow.style.setProperty('display', 'flex', 'important');
            headerTopRow.style.setProperty('opacity', '1', 'important');
            headerTopRow.style.setProperty('visibility', 'visible', 'important');
            headerTopRow.style.setProperty('transition', 'opacity 0.3s ease-in-out', 'important');
            searchContainer.style.setProperty('display', shouldHideSearch() ? 'none' : 'flex', 'important');
            searchContainer.style.setProperty('margin-top', '0', 'important');

            // Reset nav-menu position to normal (if it exists and not on homepage, categories, or cart)
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu && !document.body.classList.contains('homepage') && !document.body.classList.contains('all-categories-page') && !document.body.classList.contains('cart-page')) {
                // CRITICAL: Force all visibility properties to ensure nav-menu stays visible
                navMenu.style.setProperty('top', '120px', 'important'); // Full header height + 8px spacing
                navMenu.style.setProperty('display', 'flex', 'important');
                navMenu.style.setProperty('visibility', 'visible', 'important');
                navMenu.style.setProperty('opacity', '1', 'important');
                navMenu.style.setProperty('transform', 'translateY(0)', 'important');
                navMenu.style.setProperty('position', 'fixed', 'important');
                navMenu.style.setProperty('z-index', '10001', 'important'); // Higher than header (10000)
                navMenu.style.setProperty('pointer-events', 'auto', 'important');
                navMenu.style.setProperty('transition', 'top 0.3s ease-in-out', 'important');
                // Remove any classes that might hide it
                navMenu.classList.remove('nav-menu-hidden', 'hidden', 'd-none');
            }

            // Remove floating toggle
            if (floatingToggle && floatingToggle.parentNode) {
                floatingToggle.parentNode.removeChild(floatingToggle);
                floatingToggle = null;
            }
            if (floatingSearchBar && floatingSearchBar.parentNode) {
                floatingSearchBar.parentNode.removeChild(floatingSearchBar);
                floatingSearchBar = null;
            }
        }

        lastScrollTop = scrollTop;
    }

    // IMPORTANT: isKeyboardOpen() must be defined BEFORE scroll/resize listeners
    // On real mobile, tapping a search input causes:
    //   1. Keyboard opens → viewport height shrinks → 'resize' event fires
    //   2. Browser auto-scrolls to keep input visible → 'scroll' event fires
    // Both events call handleScroll() which hides the header top-row, causing
    // a DOM reflow that blurs the input, immediately closing the keyboard.
    function isKeyboardOpen() {
        const ae = document.activeElement;
        return ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable);
    }

    // Throttle scroll events for better performance
    let ticking = false;
    function onScroll() {
        if (isKeyboardOpen()) return; // Skip scroll handling while keyboard is open
        if (!ticking) {
            window.requestAnimationFrame(function () {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    }

    // Add scroll listener
    window.addEventListener('scroll', function () {
        if (isKeyboardOpen()) return; // Skip while mobile keyboard is open
        onScroll();
    }, { passive: true });

    // Handle resize - skip if keyboard is open (keyboard open/close fires resize on mobile)
    window.addEventListener('resize', function () {
        if (isKeyboardOpen()) return; // Don't touch the DOM while keyboard is open
        if (!isMobileViewport() && floatingToggle && floatingToggle.parentNode) {
            floatingToggle.parentNode.removeChild(floatingToggle);
            floatingToggle = null;
        }
        handleScroll();
    });

    // Initial check
    handleScroll();
})();

