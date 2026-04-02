// Flipkart-style Mobile Header Setup
// Creates download app button and reorganizes header for mobile view

(function() {
    'use strict';
    
    function setupFlipkartMobileHeader() {
        const headerContainer = document.querySelector('.header-container');
        if (!headerContainer) return;
        
        if (window.innerWidth > 768) {
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
            downloadBtn.addEventListener('click', function(e) {
                e.preventDefault();
                // You can add download app logic here
                // For now, it could open a modal or redirect
                alert('Download Mobitez App');
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
            const mobileToggle = headerContainer.querySelector('.mobile-menu-toggle');
            const logo = headerContainer.querySelector('.logo');
            const headerRight = headerContainer.querySelector('.header-right');
            
            // Move elements to top row
            if (mobileToggle) topRow.appendChild(mobileToggle);
            if (logo) topRow.appendChild(logo);
            if (headerRight) topRow.appendChild(headerRight);
            
            // Insert top row as first child
            headerContainer.insertBefore(topRow, headerContainer.firstChild);
        }
        
        // Ensure top row has proper spacing (reuse topRow variable)
        if (topRow && window.innerWidth <= 768) {
            topRow.style.setProperty('justify-content', 'space-between', 'important'); // Balanced distribution
            topRow.style.setProperty('gap', '4px', 'important'); // Balanced gap
            topRow.style.setProperty('padding', '8px 12px', 'important'); // Consistent padding
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
            
            // Ensure it's visible
            searchContainer.style.setProperty('display', 'flex', 'important');
            searchContainer.style.setProperty('order', '2', 'important');
            
            // Remove nav-menu on mobile - hide completely
            const navMenu = document.querySelector('nav.nav-menu');
            if (navMenu && window.innerWidth <= 768) {
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
        }
        
        if (headerContainer) {
            headerContainer.style.setProperty('height', 'auto', 'important');
            headerContainer.style.setProperty('max-height', 'none', 'important');
            headerContainer.style.setProperty('flex-direction', 'column', 'important');
        }
        
        // Ensure Login button is visible (not hidden) and properly formatted
        const loginBtn = document.querySelector('.login-btn');
        const loginWrapper = document.querySelector('.login-dropdown-wrapper');
        // Reuse headerRight from above (line 50) or get it if not already defined
        const headerRightForLogin = headerRight || document.querySelector('.header-right');
        
        if (loginBtn && window.innerWidth <= 768) {
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
                newLoginBtn.setAttribute('onclick', 'if(window.innerWidth <= 768){window.location.href="/login.html";return false;}');
                
                // Also add event listener as backup
                newLoginBtn.addEventListener('click', function(e) {
                    if (window.innerWidth <= 768) {
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
        if (loginWrapper && window.innerWidth <= 768) {
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
        }
        if (headerRightForLogin && window.innerWidth <= 768) {
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
        }
        
        // Ensure logo has proper spacing and remove the link inside it as requested
        const logo = document.querySelector('.logo');
        if (logo && window.innerWidth <= 768) {
            logo.style.setProperty('margin-right', '8px', 'important'); // Add space after logo
            logo.style.setProperty('max-width', '35%', 'important'); // Match CSS
            
            // Remove the link (a tag) inside the logo if it exists
            // This matches the XPath requirement: /html/body/header/div/div[1]/div[2]/a
            const logoLink = logo.querySelector('a');
            if (logoLink) {
                // Move images/content out of the link into the logo container
                while (logoLink.firstChild) {
                    logo.insertBefore(logoLink.firstChild, logoLink);
                }
                // Remove the link tag itself
                logoLink.remove();
            }
        }
        
        // Ensure login link is set (run this separately to catch timing issues)
        // This runs after other scripts to override their handlers
        const loginBtnForLink = document.querySelector('#loginBtn');
        if (loginBtnForLink && window.innerWidth <= 768 && loginBtnForLink.tagName === 'A') {
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
                newBtn.setAttribute('onclick', 'if(window.innerWidth <= 768){window.location.href="/login.html";return false;}');
                
                // Also add event listener as backup
                newBtn.addEventListener('click', function(e) {
                    if (window.innerWidth <= 768) {
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
        
        // Ensure categories menu has proper spacing and gaps
        const categoriesNav = document.querySelector('.homepage-categories-nav');
        const categoriesContainer = document.querySelector('.homepage-categories-container');
        const categoryItems = document.querySelectorAll('.homepage-category-item');
        
        if (categoriesNav && window.innerWidth <= 768) {
            categoriesNav.style.setProperty('margin-top', '16px', 'important'); // Increased spacing
            categoriesNav.style.setProperty('padding-top', '12px', 'important'); // Increased padding
            categoriesNav.style.setProperty('position', 'relative', 'important');
            categoriesNav.style.setProperty('z-index', '1', 'important');
        }
        
        if (categoriesContainer && window.innerWidth <= 768) {
            categoriesContainer.style.setProperty('gap', '12px', 'important'); // Add gap between items
            categoriesContainer.style.setProperty('padding-left', '16px', 'important'); // Shift left
            categoriesContainer.style.setProperty('padding-right', '12px', 'important');
            categoriesContainer.style.setProperty('justify-content', 'flex-start', 'important');
        }
        
        // Ensure category items have proper spacing
        categoryItems.forEach(item => {
            if (window.innerWidth <= 768) {
                item.style.setProperty('margin-right', '0', 'important');
                item.style.setProperty('padding', '8px 6px', 'important');
            }
        });
    }
    
    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupFlipkartMobileHeader);
    } else {
        setupFlipkartMobileHeader();
    }
    
    // Run on resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(setupFlipkartMobileHeader, 100);
    });
    
    // Run after a delay to catch dynamically loaded content
    setTimeout(setupFlipkartMobileHeader, 500);
    setTimeout(setupFlipkartMobileHeader, 1000);
    setTimeout(setupFlipkartMobileHeader, 2000); // Run again after app.js loads
    setTimeout(setupFlipkartMobileHeader, 3000); // Run again to ensure it works
    
    // Also run when DOM is fully ready
    if (document.readyState === 'complete') {
        setTimeout(setupFlipkartMobileHeader, 100);
    } else {
        window.addEventListener('load', function() {
            setTimeout(setupFlipkartMobileHeader, 100);
            setTimeout(setupFlipkartMobileHeader, 2000); // Run again after all scripts load
        });
    }
    
    // Add document-level click handler as ultimate fallback for login button
    document.addEventListener('click', function(e) {
        const target = e.target.closest('#loginBtn, .login-btn');
        if (target && window.innerWidth <= 768) {
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
    // SCROLL BEHAVIOR: Hide header top row on scroll down, keep search bar visible
    // Only hamburger menu and search bar display when scrolling
    // ============================================
    let lastScrollTop = 0;
    let scrollTimeout = null;
    const SCROLL_THRESHOLD = 10; // Minimum scroll distance to trigger hide/show
    let floatingToggle = null; // Reference to floating hamburger toggle
    let floatingSearchBar = null; // Reference to floating search bar
    
    function handleScroll() {
        if (window.innerWidth > 768) {
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
            searchContainer.style.setProperty('display', 'flex', 'important');
            
            // Ensure nav-menu is visible and positioned correctly (if it exists and not on homepage)
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu && !document.body.classList.contains('homepage')) {
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
            
            // Keep search bar visible in header
            searchContainer.style.setProperty('display', 'flex', 'important');
            searchContainer.style.setProperty('margin-top', '0', 'important');
            searchContainer.style.setProperty('padding-top', '8px', 'important');
            
            // Adjust nav-menu position to be below search bar only (if it exists and not on homepage)
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu && !document.body.classList.contains('homepage')) {
                // CRITICAL: Force all visibility properties to ensure nav-menu stays visible
                navMenu.style.setProperty('top', '56px', 'important'); // Search bar height + 8px spacing
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
            searchContainer.style.setProperty('display', 'flex', 'important');
            searchContainer.style.setProperty('margin-top', '0', 'important');
            
            // Reset nav-menu position to normal (if it exists and not on homepage)
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu && !document.body.classList.contains('homepage')) {
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
    
    // Throttle scroll events for better performance
    let ticking = false;
    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    }
    
    // Function to continuously ensure nav-menu visibility
    function ensureNavMenuVisible() {
        if (window.innerWidth > 768) return; // Desktop - skip
        
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && !document.body.classList.contains('homepage')) {
            const headerTopRow = document.querySelector('.header-top-row');
            const isTopRowHidden = headerTopRow && headerTopRow.classList.contains('header-top-row-hidden');
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Determine correct top position
            let topPosition = '120px'; // Default: full header + spacing
            if (isTopRowHidden && scrollTop > SCROLL_THRESHOLD) {
                topPosition = '56px'; // Search bar height + spacing
            }
            
            // CRITICAL: Force all visibility properties
            navMenu.style.setProperty('top', topPosition, 'important');
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
    }
    
    // Add scroll listener
    window.addEventListener('scroll', function() {
        onScroll();
        ensureNavMenuVisible(); // Also ensure nav-menu visibility on every scroll
    }, { passive: true });
    
    // Handle resize - remove floating toggle on desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && floatingToggle && floatingToggle.parentNode) {
            floatingToggle.parentNode.removeChild(floatingToggle);
            floatingToggle = null;
        }
        handleScroll();
        ensureNavMenuVisible();
    });
    
    // Periodically check nav-menu visibility (safety net)
    setInterval(function() {
        if (window.innerWidth <= 768) {
            ensureNavMenuVisible();
        }
    }, 200); // Check every 200ms
    
    // Initial check
    handleScroll();
    ensureNavMenuVisible();
    
    // Function to hide nav-menu on mobile (override ensureNavMenuVisible)
    function hideNavMenuOnMobile() {
        if (window.innerWidth <= 768) {
            const navMenu = document.querySelector('nav.nav-menu');
            if (navMenu) {
                navMenu.style.setProperty('display', 'none', 'important');
                navMenu.style.setProperty('height', '0', 'important');
                navMenu.style.setProperty('min-height', '0', 'important');
                navMenu.style.setProperty('max-height', '0', 'important');
                navMenu.style.setProperty('visibility', 'hidden', 'important');
                navMenu.style.setProperty('opacity', '0', 'important');
                navMenu.style.setProperty('position', 'absolute', 'important');
                navMenu.style.setProperty('left', '-9999px', 'important');
                navMenu.style.setProperty('margin', '0', 'important');
                navMenu.style.setProperty('padding', '0', 'important');
                navMenu.style.setProperty('border', 'none', 'important');
                
                // Also hide nav-container
                const navContainer = navMenu.querySelector('.nav-container');
                if (navContainer) {
                    navContainer.style.setProperty('display', 'none', 'important');
                    navContainer.style.setProperty('height', '0', 'important');
                    navContainer.style.setProperty('min-height', '0', 'important');
                }
                
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
                    nodesToRemove.forEach(n => {
                        try {
                            n.remove();
                        } catch(e) {
                            // Ignore errors
                        }
                    });
                }
            }
        }
    }
    
    // Also check after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(ensureNavMenuVisible, 100);
            setTimeout(ensureNavMenuVisible, 500);
            setTimeout(hideNavMenuOnMobile, 200);
            setTimeout(hideNavMenuOnMobile, 600);
        });
    } else {
        setTimeout(ensureNavMenuVisible, 100);
        setTimeout(ensureNavMenuVisible, 500);
        setTimeout(hideNavMenuOnMobile, 200);
        setTimeout(hideNavMenuOnMobile, 600);
    }
    
    // Override ensureNavMenuVisible on mobile
    const originalEnsureNavMenuVisible = ensureNavMenuVisible;
    ensureNavMenuVisible = function() {
        if (window.innerWidth <= 768) {
            hideNavMenuOnMobile();
        } else {
            originalEnsureNavMenuVisible();
        }
    };
    
    // Also run on resize
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            hideNavMenuOnMobile();
        }
    });
})();

