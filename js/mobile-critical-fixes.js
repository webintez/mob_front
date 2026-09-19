/* ==========================================================================
   MOBILE VIEW CRITICAL FIXES - JAVASCRIPT OVERRIDE
   Removes inline styles that block CSS from working
   ========================================================================== */

(function () {
    'use strict';

    function applyMobileFixes() {
        // Only run on mobile
        if (window.innerWidth > 768) return;

        // /* console.log */('Applying mobile critical fixes...');

        // FIX 1: Remove inline display:none from FBT sections
        const buyTogetherSection = document.getElementById('buyTogetherSection');
        const frequentlyBoughtSection = document.getElementById('frequentlyBoughtSection');

        if (buyTogetherSection) {
            buyTogetherSection.style.display = 'block';
            buyTogetherSection.style.padding = '16px 12px';
            buyTogetherSection.style.background = '#fff';
            buyTogetherSection.style.borderTop = '8px solid #f1f3f6';
            // /* console.log */('✓ Showed buyTogetherSection');
        }

        if (frequentlyBoughtSection) {
            frequentlyBoughtSection.style.display = 'none';
            // /* console.log */('✓ Hid frequentlyBoughtSection');
        }

        // FIX 2: Force remove gap above product image
        const productImagesWrapper = document.querySelector('.product-images-wrapper');
        if (productImagesWrapper) {
            productImagesWrapper.style.marginTop = '0';
            productImagesWrapper.style.paddingTop = '0';
            productImagesWrapper.style.top = '0';
            productImagesWrapper.style.position = 'relative';
            // /* console.log */('✓ Fixed product images wrapper');
        }

        const productImages = document.querySelector('.product-images');
        if (productImages) {
            productImages.style.marginTop = '0';
            productImages.style.paddingTop = '0';
            productImages.style.paddingLeft = '0';
            productImages.style.paddingRight = '0';
            productImages.style.paddingBottom = '0';
            // /* console.log */('✓ Fixed product images');
        }

        const productMain = document.querySelector('.product-main');
        if (productMain) {
            // /* console.log */('✓ product-main found, letting mobitez-mobile-header.js handle padding');
        }

        const productContainer = document.querySelector('.product-container');
        if (productContainer) {
            productContainer.style.paddingTop = '0';
            productContainer.style.marginTop = '0';
            // /* console.log */('✓ Fixed product container');
        }

        const productContent = document.querySelector('.product-content');
        if (productContent) {
            productContent.style.marginTop = '0';
            productContent.style.paddingTop = '0';
            // /* console.log */('✓ Fixed product content');
        }

        // FIX 3: Fix title overflow
        const productTitle = document.querySelector('.product-title');
        if (productTitle) {
            productTitle.style.paddingRight = '0';
            productTitle.style.paddingLeft = '0';
            productTitle.style.marginRight = '0';
            productTitle.style.marginLeft = '0';
            productTitle.style.width = '100%';
            productTitle.style.maxWidth = '100%';
            productTitle.style.boxSizing = 'border-box';
            productTitle.style.whiteSpace = 'normal';
            productTitle.style.overflow = 'visible';
            // /* console.log */('✓ Fixed product title');
        }

        const productInfo = document.querySelector('.product-info');
        if (productInfo) {
            productInfo.style.padding = '0px 12px 8px 12px'; // Compact vertical padding (no top padding)
            // /* console.log */('✓ Fixed product info');
        }

        const productTopActions = document.querySelector('.product-top-actions');
        if (productTopActions) {
            productTopActions.style.position = 'static';
            productTopActions.style.top = 'auto';
            productTopActions.style.right = 'auto';
            productTopActions.style.marginBottom = '12px';
            // /* console.log */('✓ Fixed product top actions');
        }

        // /* console.log */('Mobile critical fixes applied!');
    }

    // Apply on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyMobileFixes);
    } else {
        applyMobileFixes();
    }

    // Apply after a short delay to ensure all elements are loaded
    setTimeout(applyMobileFixes, 500);
    setTimeout(applyMobileFixes, 1000);
    setTimeout(applyMobileFixes, 2000);

    // Reapply on resize
    window.addEventListener('resize', function () {
        if (window.innerWidth <= 768) {
            applyMobileFixes();
        }
    });

})();
