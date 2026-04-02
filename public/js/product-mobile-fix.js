// Product Page Mobile Layout Fix
// Forces single column layout on mobile devices

(function() {
    'use strict';

    function forceMobileLayout() {
        // Check if we're on mobile
        if (window.innerWidth <= 768) {
            const productContent = document.getElementById('productContent');
            const productImagesWrapper = document.querySelector('.product-images-wrapper');
            const productRightColumn = document.querySelector('.product-right-column');

            if (productContent) {
                // Force single column grid - override any inline styles
                productContent.style.setProperty('display', 'grid', 'important');
                productContent.style.setProperty('grid-template-columns', '1fr', 'important');
                productContent.style.setProperty('grid-template-rows', 'auto auto', 'important');
                productContent.style.setProperty('gap', '0', 'important');
                productContent.style.setProperty('width', '100%', 'important');
                productContent.style.setProperty('max-width', '100%', 'important');
                productContent.style.setProperty('min-height', 'auto', 'important');
            }

            if (productImagesWrapper) {
                // Force images wrapper to full width - override any inline styles
                productImagesWrapper.style.setProperty('position', 'relative', 'important');
                productImagesWrapper.style.setProperty('top', '0', 'important');
                productImagesWrapper.style.setProperty('width', '100%', 'important');
                productImagesWrapper.style.setProperty('max-width', '100%', 'important');
                productImagesWrapper.style.setProperty('grid-column', '1 / -1', 'important');
                productImagesWrapper.style.setProperty('grid-row', '1', 'important');
                productImagesWrapper.style.setProperty('height', 'auto', 'important');
                productImagesWrapper.style.setProperty('max-height', 'none', 'important');
            }

            if (productRightColumn) {
                // Force right column to full width - override any inline styles
                productRightColumn.style.setProperty('width', '100%', 'important');
                productRightColumn.style.setProperty('max-width', '100%', 'important');
                productRightColumn.style.setProperty('grid-column', '1 / -1', 'important');
                productRightColumn.style.setProperty('grid-row', '2', 'important');
            }
        }
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(forceMobileLayout, 100);
            setTimeout(forceMobileLayout, 500);
            setTimeout(forceMobileLayout, 1000);
        });
    } else {
        setTimeout(forceMobileLayout, 100);
        setTimeout(forceMobileLayout, 500);
        setTimeout(forceMobileLayout, 1000);
    }

    // Run after product is loaded (product.js sets display: block)
    const originalDisplayProduct = window.displayProduct;
    if (typeof originalDisplayProduct === 'function') {
        window.displayProduct = function(...args) {
            const result = originalDisplayProduct.apply(this, args);
            setTimeout(forceMobileLayout, 100);
            return result;
        };
    }

    // Also run on window resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(forceMobileLayout, 100);
    });

    // Run periodically to catch any dynamic changes
    setInterval(function() {
        if (window.innerWidth <= 768) {
            forceMobileLayout();
        }
    }, 1000);
})();

