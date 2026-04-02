// Product Page JavaScript

// API Configuration (reuse from app.js)
const API_CONFIG = {
    baseUrl: '/api',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key': ''
    }
};

// Global state
let currentProduct = null;
let selectedVariations = {};
let quantity = 1;
let currentImageIndex = 0;
let productImages = [];
let allBoughtTogetherProducts = [];
let boughtTogetherCategories = [];
let selectedBoughtTogetherCategory = 'all';
let linkedVariationsData = null;
let linkedVariationsProducts = [];
let selectedAddOns = []; // Track selected add-on products
let isInitializing = true; // Flag to prevent redirects during initialization

// Function to make buttons sticky at bottom on mobile
function makeButtonsStickyOnMobile() {
    if (window.innerWidth <= 768) {
        const buttonsContainer = document.querySelector('.product-actions-left');
        if (buttonsContainer) {
            buttonsContainer.style.setProperty('position', 'fixed', 'important');
            buttonsContainer.style.setProperty('bottom', '0', 'important');
            buttonsContainer.style.setProperty('left', '0', 'important');
            buttonsContainer.style.setProperty('right', '0', 'important');
            buttonsContainer.style.setProperty('width', '100%', 'important');
            buttonsContainer.style.setProperty('max-width', '100%', 'important');
            buttonsContainer.style.setProperty('z-index', '10000', 'important');
            buttonsContainer.style.setProperty('flex-direction', 'row', 'important');
            buttonsContainer.style.setProperty('padding', '12px 16px', 'important');
            buttonsContainer.style.setProperty('gap', '12px', 'important');
            buttonsContainer.style.setProperty('border-top', '1px solid #e0e0e0', 'important');
            buttonsContainer.style.setProperty('background', 'white', 'important');
            buttonsContainer.style.setProperty('box-shadow', '0 -2px 8px rgba(0,0,0,0.15)', 'important');
            buttonsContainer.style.setProperty('margin', '0', 'important');
            buttonsContainer.style.setProperty('box-sizing', 'border-box', 'important');

            // Add padding to main content
            const main = document.querySelector('main.product-main');
            if (main) {
                main.style.setProperty('padding-bottom', '30px', 'important');
            }
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initProductPage();
    makeButtonsStickyOnMobile();
    setTimeout(makeButtonsStickyOnMobile, 100);
    setTimeout(makeButtonsStickyOnMobile, 500);
});

// Also run on resize
window.addEventListener('resize', () => {
    makeButtonsStickyOnMobile();
});

// Initialize product page
async function initProductPage() {
    // Set initialization flag
    isInitializing = true;

    // Ensure page is scrolled to top
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Get product slug from URL
    const slug = getProductSlugFromURL();

    if (!slug) {
        showError('Product not found');
        isInitializing = false;
        return;
    }

    // Setup event listeners
    setupEventListeners();

    // Initialize compare bar
    updateCompareBar();

    // Add resize listener for mobile layout
    setupMobileLayoutListener();

    // Load product data
    await loadProduct(slug);

    // Check if review parameter is in URL - if so, open review modal after product loads
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('review') === 'true') {
        // Wait a bit for product to fully load, then show review form
        setTimeout(async () => {
            if (currentProduct && currentProduct.slug) {
                await showReviewForm();
                // Remove review parameter from URL without reload
                const newUrl = window.location.pathname + '?slug=' + currentProduct.slug;
                window.history.replaceState({}, '', newUrl);
            }
        }, 1500);
    }

    // Mark initialization as complete after a short delay to ensure all async operations are done
    setTimeout(() => {
        isInitializing = false;
        // Force mobile layout check after product is loaded
        forceMobileLayout();
    }, 1000);

    // Load categories for navigation - but only if not already loaded by category-nav-common.js
    // Check if categories are already being loaded or loaded
    if (!window.categoryNavLoaded && !window.categoriesLoading) {
        window.categoriesLoading = true;
        await loadCategories();
        window.categoriesLoading = false;
    } else {
        // Categories are being loaded by another script, skip to avoid duplicate calls
        // Just ensure nav-menu is visible
        setTimeout(() => {
            const navContainer = document.getElementById('navContainer');
            if (navContainer) {
                const navMenu = navContainer.closest('.nav-menu');
                if (navMenu && !navMenu.classList.contains('homepage-hidden')) {
                    navMenu.style.display = 'flex';
                    navMenu.style.visibility = 'visible';
                    navMenu.style.opacity = '1';
                }
            }
        }, 100);
    }

    // Scroll to top again after everything loads
    setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, 200);
}

// Get product slug from URL
function getProductSlugFromURL() {
    // Try query parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const slugFromQuery = urlParams.get('slug');
    if (slugFromQuery) {
        return slugFromQuery;
    }

    // Try path (e.g., /product/slug or /product.html?slug=...)
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(p => p);

    // Check if path contains 'product' followed by a slug
    const productIndex = pathParts.indexOf('product');
    if (productIndex !== -1 && pathParts.length > productIndex + 1) {
        const slug = pathParts[productIndex + 1];
        if (slug && slug !== 'product.html') {
            return slug;
        }
    }

    // Fallback: get last part of path
    const slug = pathParts[pathParts.length - 1];
    if (slug && slug !== 'product' && slug !== 'product.html') {
        return slug;
    }

    return null;
}

// Setup event listeners
function setupEventListeners() {
    // Quantity controls (if present)
    document.getElementById('quantityDecrease')?.addEventListener('click', () => {
        if (quantity > 1) {
            quantity--;
            updateQuantity();
        }
    });

    document.getElementById('quantityIncrease')?.addEventListener('click', () => {
        if (quantity < 10) {
            quantity++;
            updateQuantity();
        }
    });

    // Tab switching removed - tabs section removed from product page

    // Add to cart
    document.getElementById('addToCartBtn')?.addEventListener('click', addToCart);

    // Buy now
    document.getElementById('buyNowBtn')?.addEventListener('click', buyNow);

    // Wishlist button
    document.getElementById('wishlistBtn')?.addEventListener('click', toggleWishlist);

    // Share button and dropdown
    setupShareDropdown();

    // Compare checkbox removed - functionality moved to mobile banner slider

    // Compare bar buttons
    document.getElementById('compareBtn')?.addEventListener('click', () => {
        window.location.href = '/compare.html';
    });

    document.getElementById('compareClearBtn')?.addEventListener('click', () => {
        if (confirm('Clear all products from compare list?')) {
            saveCompareList([]);
            updateCompareBar();
        }
    });

    // Purchase options
    document.getElementById('purchaseWithoutExchange')?.addEventListener('change', handlePurchaseOption);
    document.getElementById('purchaseWithExchange')?.addEventListener('change', handlePurchaseOption);

    // Login dropdown positioning
    setupLoginDropdown();

    // View more offers
    document.getElementById('viewMoreOffers')?.addEventListener('click', (e) => {
        e.preventDefault();
        // TODO: Implement view more offers functionality
    });

    // Delivery pincode
    document.getElementById('deliveryCheckBtn')?.addEventListener('click', checkDelivery);
    document.getElementById('deliveryEnterBtn')?.addEventListener('click', checkDelivery);
    document.getElementById('deliveryPincode')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkDelivery();
        }
    });

    // Image zoom
    const mainImageContainer = document.querySelector('.main-image-container');
    if (mainImageContainer) {
        mainImageContainer.addEventListener('mousemove', handleImageZoom);
        mainImageContainer.addEventListener('mouseleave', () => {
            document.getElementById('imageZoom').style.display = 'none';
        });
    }

    // Rate Product button
    document.getElementById('rateProductBtn')?.addEventListener('click', async () => {
        // Check authentication first
        if (typeof isAuthenticated === 'undefined' || !isAuthenticated()) {
            showNotification('Please login to rate and review products', 'error');
            setTimeout(() => {
                window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
            }, 1500);
            return;
        }

        // Check if user has ordered this product
        const hasOrdered = await checkIfUserOrderedProduct();
        if (!hasOrdered) {
            showNotification('You can only review products you have ordered', 'error');
            return;
        }

        showReviewForm();
    });
}

// Toggle wishlist
async function toggleWishlist() {
    if (typeof isAuthenticated === 'undefined' || !isAuthenticated()) {
        window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
        return;
    }

    const wishlistBtn = document.getElementById('wishlistBtn') || document.querySelector('.product-banner-wishlist');
    const icon = wishlistBtn?.querySelector('i');
    const productId = currentProduct?.id;

    if (!productId || !wishlistBtn) return;

    if (wishlistBtn.classList.contains('active')) {
        // Remove from wishlist
        const result = await WISHLIST_API.removeFromWishlist(productId);
        if (result.success) {
            wishlistBtn.classList.remove('active');
            if (icon) icon.className = 'far fa-heart';
            // Also update mobile banner button
            const mobileBtn = document.querySelector('.product-banner-wishlist');
            if (mobileBtn && mobileBtn !== wishlistBtn) {
                mobileBtn.classList.remove('active');
                const mobileIcon = mobileBtn.querySelector('i');
                if (mobileIcon) mobileIcon.className = 'far fa-heart';
            }
            // Also update desktop button
            const desktopBtn = document.getElementById('wishlistBtn');
            if (desktopBtn && desktopBtn !== wishlistBtn) {
                desktopBtn.classList.remove('active');
                const desktopIcon = desktopBtn.querySelector('i');
                if (desktopIcon) desktopIcon.className = 'far fa-heart';
            }
            showNotification('Removed from wishlist');
        } else {
            showNotification(result.message || 'Failed to remove from wishlist', 'error');
        }
    } else {
        // Add to wishlist
        const result = await WISHLIST_API.addToWishlist(productId);
        if (result.success) {
            wishlistBtn.classList.add('active');
            if (icon) icon.className = 'fas fa-heart';
            // Also update mobile banner button
            const mobileBtn = document.querySelector('.product-banner-wishlist');
            if (mobileBtn && mobileBtn !== wishlistBtn) {
                mobileBtn.classList.add('active');
                const mobileIcon = mobileBtn.querySelector('i');
                if (mobileIcon) mobileIcon.className = 'fas fa-heart';
            }
            // Also update desktop button
            const desktopBtn = document.getElementById('wishlistBtn');
            if (desktopBtn && desktopBtn !== wishlistBtn) {
                desktopBtn.classList.add('active');
                const desktopIcon = desktopBtn.querySelector('i');
                if (desktopIcon) desktopIcon.className = 'fas fa-heart';
            }
            showNotification('Added to wishlist');
        } else {
            showNotification(result.message || 'Failed to add to wishlist', 'error');
        }
    }
}

// Handle mobile share
function handleMobileShare() {
    if (!currentProduct) {
        showNotification('Product information not available', 'error');
        return;
    }

    const productName = currentProduct.name || 'Product';
    const productUrl = window.location.href;
    const shareText = `Check out this product: ${productName}`;

    // Use Web Share API if available (mobile browsers)
    if (navigator.share) {
        navigator.share({
            title: productName,
            text: shareText,
            url: productUrl
        }).then(() => {
            // /* console.log */('Share successful');
        }).catch(err => {
            // User cancelled or share failed - try fallback
            if (err.name !== 'AbortError') {
                copyToClipboardFallback(productUrl);
            }
        });
    } else {
        // Fallback: Copy to clipboard
        copyToClipboardFallback(productUrl);
    }
}

// Copy to clipboard fallback
function copyToClipboardFallback(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Product link copied to clipboard!', 'success');
        }).catch(() => {
            // Final fallback: Use old method
            fallbackCopyTextToClipboard(url);
        });
    } else {
        fallbackCopyTextToClipboard(url);
    }
}

// Fallback copy method for older browsers
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Product link copied to clipboard!', 'success');
        } else {
            showNotification('Unable to copy link. Please copy manually: ' + text, 'error');
        }
    } catch (err) {
        showNotification('Unable to copy link. Please copy manually: ' + text, 'error');
    }

    document.body.removeChild(textArea);
}

// Update mobile wishlist button state
async function updateMobileWishlistButton(button) {
    if (!button || !currentProduct?.id) return;

    if (typeof isAuthenticated === 'undefined' || !isAuthenticated()) {
        return;
    }

    try {
        const result = await WISHLIST_API.getWishlist();
        if (result.success && result.data) {
            const wishlistItems = Array.isArray(result.data) ? result.data : (result.data.items || []);
            const isInWishlist = wishlistItems.some(item => {
                const itemId = item.product_id || item.product?.id || item.id;
                return itemId === currentProduct.id;
            });

            const icon = button.querySelector('i');
            if (isInWishlist) {
                button.classList.add('active');
                if (icon) icon.className = 'fas fa-heart';
            } else {
                button.classList.remove('active');
                if (icon) icon.className = 'far fa-heart';
            }
        }
    } catch (error) {
        // Silent error handling
    }
}

// Setup share dropdown functionality
function setupShareDropdown() {
    const shareBtn = document.getElementById('shareBtn');
    const shareDropdown = document.getElementById('shareDropdown');
    const shareWrapper = shareBtn?.closest('.share-dropdown-wrapper');

    if (!shareBtn || !shareDropdown || !shareWrapper) return;

    // Toggle dropdown on share button click
    shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        shareWrapper.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!shareWrapper.contains(e.target)) {
            shareWrapper.classList.remove('active');
        }
    });

    // Handle platform-specific sharing
    const shareOptions = shareDropdown.querySelectorAll('.share-option');
    shareOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const platform = option.dataset.platform;
            shareToPlatform(platform);
            shareWrapper.classList.remove('active');
        });
    });
}

// Share product to specific platform
function shareToPlatform(platform) {
    const productName = currentProduct?.name || 'Product';
    const productUrl = window.location.href;
    const shareText = `Check out this product: ${productName}`;

    let shareUrl = '';

    switch (platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
            window.open(shareUrl, '_blank', 'width=600,height=400');
            break;

        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`;
            window.open(shareUrl, '_blank', 'width=600,height=400');
            break;

        case 'email':
            const subject = encodeURIComponent(`Check out this product: ${productName}`);
            const body = encodeURIComponent(`${shareText}\n\n${productUrl}`);
            shareUrl = `mailto:?subject=${subject}&body=${body}`;
            window.location.href = shareUrl;
            break;

        default:
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(productUrl).then(() => {
                showNotification('Product link copied to clipboard!', 'success');
            }).catch(() => {
                showNotification('Failed to copy link', 'error');
            });
    }
}

// Compare functionality - Flipkart style
const COMPARE_STORAGE_KEY = 'mobitez.webintez.compare_products';
const MAX_COMPARE_PRODUCTS = 4;

// Get compare list from localStorage
function getCompareList() {
    try {
        const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        return [];
    }
}

// Save compare list to localStorage
function saveCompareList(products) {
    try {
        localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(products));
        updateCompareBar();
    } catch (error) {
        // Silently handle error
    }
}

// Add product to compare list
function addToCompare(product) {
    const compareList = getCompareList();

    // Check if product already exists
    const exists = compareList.some(p => p.id === product.id);
    if (exists) {
        showNotification('Product already in compare list', 'info');
        return false;
    }

    // Check max limit
    if (compareList.length >= MAX_COMPARE_PRODUCTS) {
        showNotification(`You can compare maximum ${MAX_COMPARE_PRODUCTS} products`, 'error');
        return false;
    }

    // Add product with minimal data
    const compareProduct = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        originalPrice: product.original_price,
        image: product.images && product.images.length > 0 ? product.images[0].url : product.image,
        rating: product.rating,
        ratingCount: product.rating_count
    };

    compareList.push(compareProduct);
    saveCompareList(compareList);
    showNotification('Product added to compare', 'success');
    return true;
}

// Remove product from compare list
function removeFromCompare(productId) {
    const compareList = getCompareList();
    const filtered = compareList.filter(p => p.id !== productId);
    saveCompareList(filtered);
    showNotification('Product removed from compare', 'success');
}

// Check if product is in compare list
function isInCompareList(productId) {
    const compareList = getCompareList();
    return compareList.some(p => p.id === productId);
}

// Handle compare checkbox
function handleCompare(e) {
    const isChecked = e.target.checked;

    if (!currentProduct) {
        e.target.checked = false;
        showNotification('Product data not loaded', 'error');
        return;
    }

    if (isChecked) {
        const added = addToCompare(currentProduct);
        if (!added) {
            e.target.checked = false;
        }
    } else {
        removeFromCompare(currentProduct.id);
    }

    // Update compare bar
    updateCompareBar();
}

// Update compare bar visibility and count
function updateCompareBar() {
    const compareList = getCompareList();
    const compareBar = document.getElementById('compareBar');
    const compareCount = document.getElementById('compareCount');
    const compareBtn = document.getElementById('compareBtn');

    if (compareBar && compareCount && compareBtn) {
        if (compareList.length > 0) {
            compareBar.style.display = 'flex';
            compareCount.textContent = compareList.length;
            compareBtn.disabled = false;
        } else {
            compareBar.style.display = 'none';
        }
    }
}

// Initialize compare checkbox state
function initCompareCheckbox() {
    const checkbox = document.getElementById('compareCheckbox');
    if (checkbox && currentProduct) {
        checkbox.checked = isInCompareList(currentProduct.id);
    }
}

// Handle purchase option
function handlePurchaseOption(e) {
    const purchaseType = e.target.id;
    const withoutExchange = document.getElementById('buyWithoutExchange');
    const withExchange = document.getElementById('buyWithExchange');

    if (purchaseType === 'purchaseWithoutExchange') {
        withoutExchange.classList.add('active');
        withExchange.classList.remove('active');
        // TODO: Update price display
    } else {
        withExchange.classList.add('active');
        withoutExchange.classList.remove('active');
        // TODO: Show exchange form/options
    }
}

// Load product data
async function loadProduct(slug) {
    showLoading();

    try {
        if (!slug) {
            showError('Product slug is required');
            return;
        }

        const result = await makeApiCall(`/products/${slug}`);

        // Log product API response
        // /* console.log */('Product API Response:', result);

        if (result && result.success && result.data) {
            currentProduct = result.data;
            displayProduct(currentProduct);

            // Track product view for recently viewed
            if (typeof trackProductView !== 'undefined') {
                trackProductView(currentProduct);
            }

            // Initialize compare checkbox state
            initCompareCheckbox();

            // Check wishlist status if authenticated
            if (isAuthenticated() && currentProduct.id) {
                checkWishlistStatus(currentProduct.id);
            }

            // Load linked variations (non-blocking)
            loadLinkedVariations(slug).catch(() => { });

            // Load warranty information (non-blocking)
            // /* console.log */('Product Load: Checking for brand information');
            // /* console.log */('Product Load: currentProduct.brand:', currentProduct.brand);
            // /* console.log */('Product Load: currentProduct.brands:', currentProduct.brands);
            // /* console.log */('Product Load: currentProduct.brand_id:', currentProduct.brand_id);

            // Determine which brand identifier to use (prefer slug, fallback to ID)
            let brandIdentifier = null;
            let identifierType = null;

            // Check brands array first (most common format)
            if (currentProduct.brands && Array.isArray(currentProduct.brands) && currentProduct.brands.length > 0) {
                const brand = currentProduct.brands[0]; // Use first brand
                if (brand.slug) {
                    brandIdentifier = brand.slug;
                    identifierType = 'slug';
                } else if (brand.id) {
                    brandIdentifier = brand.id;
                    identifierType = 'id';
                }
            }
            // Fallback to single brand object
            else if (currentProduct.brand?.slug) {
                brandIdentifier = currentProduct.brand.slug;
                identifierType = 'slug';
            } else if (currentProduct.brand?.id) {
                brandIdentifier = currentProduct.brand.id;
                identifierType = 'id';
            }
            // Fallback to brand_id
            else if (currentProduct.brand_id) {
                brandIdentifier = currentProduct.brand_id;
                identifierType = 'id';
            }

            if (brandIdentifier) {
                // /* console.log */('Product Load: Loading warranty for brand:', brandIdentifier, `(type: ${identifierType})`);
                loadWarrantyInfo(brandIdentifier, identifierType).catch((error) => {
                    // /* console.error */('Product Load: Warranty loading failed:', error);
                });
            } else {
                // /* console.log */('Product Load: No brand information found, skipping warranty load');
            }

            // Load frequently bought together (non-blocking)
            if (currentProduct.id) {
                loadFrequentlyBoughtTogether(currentProduct.id).catch(() => { });
            }

            // Load similar products (non-blocking)
            if (currentProduct.category?.slug) {
                loadSimilarProducts(currentProduct.category.slug, slug).catch(() => { });
            }

            // Load reviews and ratings (non-blocking)
            if (currentProduct.id) {
                loadProductReviews(currentProduct.id).catch(() => { });
            }

            // Load questions and answers (non-blocking)
            // Q&A is now loaded from product.qna in displayProduct, but keep API call as fallback
            if (currentProduct.id && (!currentProduct.qna || currentProduct.qna.length === 0)) {
                loadProductQuestions(currentProduct.id).catch(() => { });
            }
        } else {
            showError('Product not found or invalid response from server');
        }
    } catch (error) {
        const errorMessage = error.message || 'Failed to load product. Please try again.';
        showError(errorMessage);
    } finally {
        hideLoading();
    }
}

// Display product
function displayProduct(product) {
    // Update breadcrumbs (all locations) - use API breadcrumbs if available, otherwise build from flat categories
    if (product.category && product.category.slug) {
        let breadcrumb = [];

        // Try to get breadcrumbs from category API if category object has it
        if (product.category.breadcrumbs && Array.isArray(product.category.breadcrumbs)) {
            breadcrumb = product.category.breadcrumbs;
        } else {
            // Fallback: Build breadcrumb using parent references from flat categories
            breadcrumb = buildCategoryBreadcrumb(product.category.slug);
        }

        // If breadcrumb is available, use it; otherwise fallback to direct category
        const categoryName = (breadcrumb && breadcrumb.length > 0)
            ? breadcrumb[breadcrumb.length - 1].name
            : (product.category.name || 'Category');

        // Old breadcrumbs (hidden but keep for compatibility)
        const breadcrumbCategory = document.getElementById('breadcrumbCategory');
        if (breadcrumbCategory) {
            breadcrumbCategory.textContent = categoryName;
        }
        // Inline breadcrumbs in product-info
        const breadcrumbCategoryInline = document.getElementById('breadcrumbCategoryInline');
        if (breadcrumbCategoryInline) {
            breadcrumbCategoryInline.textContent = categoryName;
        }
        // Right-aligned breadcrumbs section (main one)
        const breadcrumbCategoryRight = document.getElementById('breadcrumbCategoryRight');
        if (breadcrumbCategoryRight) {
            breadcrumbCategoryRight.textContent = categoryName;
        }
    }
    // Old breadcrumbs (hidden but keep for compatibility)
    const breadcrumbProduct = document.getElementById('breadcrumbProduct');
    if (breadcrumbProduct) {
        breadcrumbProduct.textContent = product.name;
    }
    // Inline breadcrumbs in product-info
    const breadcrumbProductInline = document.getElementById('breadcrumbProductInline');
    if (breadcrumbProductInline) {
        breadcrumbProductInline.textContent = product.name;
    }
    // Right-aligned breadcrumbs section (main one)
    const breadcrumbProductRight = document.getElementById('breadcrumbProductRight');
    if (breadcrumbProductRight) {
        breadcrumbProductRight.textContent = product.name;
    }

    // Product title
    const productTitle = document.getElementById('productTitle');
    if (productTitle) {
        productTitle.textContent = product.name;
    }

    // Rating (dynamic from API if available, otherwise use defaults)
    // Convert rating to number (API returns string like "4.80" or "0.00")
    const rating = parseFloat(product.rating) || 0;
    // Use review_count as ratings_count if ratings_count is not available
    const ratingsCount = parseInt(product.ratings_count || product.review_count || 0, 10);
    const reviewsCount = parseInt(product.reviews_count || product.review_count || 0, 10);

    displayRating(rating, ratingsCount, reviewsCount);

    // Price - Convert to numbers
    const currentPrice = parseFloat(product.price) || 0;
    const originalPrice = parseFloat(product.original_price || product.price) || 0;
    const discount = originalPrice > currentPrice
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;
    const extraDiscount = discount > 0 ? Math.round((originalPrice - currentPrice) / 1000) : 0;

    const currentPriceEl = document.getElementById('currentPrice');
    if (currentPriceEl) {
        currentPriceEl.textContent = formatPrice(currentPrice);
    }

    const originalPriceEl = document.getElementById('originalPrice');
    const discountBadgeEl = document.getElementById('discountBadge');
    const extraOfferEl = document.getElementById('extraOffer');

    if (originalPrice > currentPrice) {
        if (originalPriceEl) {
            originalPriceEl.textContent = formatPrice(originalPrice);
            originalPriceEl.style.display = 'block';
        }
        if (discountBadgeEl) {
            discountBadgeEl.textContent = `${discount}% off`;
            discountBadgeEl.style.display = 'inline-block';
        }
        if (extraOfferEl) {
            if (extraDiscount > 0) {
                extraOfferEl.textContent = `Extra ₹${extraDiscount * 1000} off`;
                extraOfferEl.style.display = 'block';
            } else {
                extraOfferEl.style.display = 'none';
            }
        }
    } else {
        if (originalPriceEl) {
            originalPriceEl.style.display = 'none';
        }
        if (discountBadgeEl) {
            discountBadgeEl.style.display = 'none';
        }
        if (extraOfferEl) {
            extraOfferEl.style.display = 'none';
        }
    }

    // Update purchase option price
    const priceWithoutExchangeEl = document.getElementById('priceWithoutExchange');
    if (priceWithoutExchangeEl) {
        priceWithoutExchangeEl.textContent = formatPrice(currentPrice);
    }

    // Delivery date (will be calculated when pincode is checked via API)
    const deliveryDateEl = document.getElementById('deliveryDate');
    if (deliveryDateEl) {
        // Default to 3 days, will be updated when pincode is checked
        const deliveryDate = calculateDeliveryDate(3);
        deliveryDateEl.textContent = deliveryDate;
    }

    // Images
    productImages = [];

    // Priority 1: Use product_images array if available (includes main image + gallery images)
    if (product.product_images && Array.isArray(product.product_images) && product.product_images.length > 0) {
        // /* console.log */('Using product_images array:', product.product_images);
        product.product_images.forEach((img, index) => {
            let imageUrl = null;

            // Handle different formats
            if (typeof img === 'string') {
                imageUrl = img;
            } else if (img && typeof img === 'object') {
                imageUrl = img.image_url || img.url || img.src || img.image || img;
            }

            // Only add if it's a valid URL
            if (imageUrl &&
                typeof imageUrl === 'string' &&
                imageUrl.trim() !== '' &&
                imageUrl !== 'undefined' &&
                imageUrl !== 'null') {
                productImages.push(imageUrl.trim());
                // /* console.log */(`Added image ${index + 1} from product_images:`, imageUrl.trim());
            } else {
                // /* console.warn */(`Skipped invalid image at index ${index}:`, img);
            }
        });
    }

    // Priority 2: If product_images not available, use main image + gallery_images
    if (productImages.length === 0) {
        // /* console.log */('product_images not available, using image_url + gallery_images');
        // Add main product image
        if (product.image_url) {
            productImages.push(product.image_url);
        }

        // Add gallery images - handle different formats
        if (product.gallery_images && Array.isArray(product.gallery_images) && product.gallery_images.length > 0) {
            product.gallery_images.forEach(img => {
                let imageUrl = null;

                // Handle different formats
                if (typeof img === 'string') {
                    imageUrl = img;
                } else if (img && typeof img === 'object') {
                    imageUrl = img.image_url || img.url || img.src || img.image || img;
                }

                // Only add if it's a valid URL and different from main image
                if (imageUrl &&
                    typeof imageUrl === 'string' &&
                    imageUrl.trim() !== '' &&
                    imageUrl !== product.image_url &&
                    imageUrl !== 'undefined' &&
                    imageUrl !== 'null') {
                    productImages.push(imageUrl.trim());
                }
            });
        }
    }

    // Remove duplicates while preserving order
    productImages = [...new Set(productImages)];

    // Debug: Log images to console
    // /* console.log */('Final Product Images Array:', productImages);
    // /* console.log */('Total Images:', productImages.length);
    // /* console.log */('Images will be displayed in mobile banner slider:', productImages);

    if (productImages.length > 0) {
        displayProductImages(productImages);
    } else {
        // /* console.warn */('No product images found');
    }

    // Description is now displayed in product details section, not in tabs

    // Bank Offers
    if (product.bank_offers && Array.isArray(product.bank_offers) && product.bank_offers.length > 0) {
        displayBankOffers(product.bank_offers);
    }

    // Questions and Answers (from product.qna)
    if (product.qna && Array.isArray(product.qna) && product.qna.length > 0) {
        displayQuestionsAndAnswers(product.qna);
    }

    // Long Description (Product Description Section)
    if (product.long_description) {
        displayLongDescription(product.long_description);
    }

    // Specifications - Check for grouped specifications format first
    if (product.specifications && Array.isArray(product.specifications) && product.specifications.length > 0) {
        // New grouped format: [{ title: "Warranty", rows: [{ label: "...", value: "..." }] }]
        displayGroupedSpecifications(product.specifications);
    } else if (product.simple_attributes && product.simple_attributes.length > 0) {
        displaySpecifications(product.simple_attributes);
        displaySpecificationsInDetails(product.simple_attributes.map(attr => ({
            attribute: { name: attr.name || attr.attribute_name },
            display_value: attr.value || attr.attribute_value,
            value: attr.value || attr.attribute_value
        })));
    } else if (product.simple_attribute_values && product.simple_attribute_values.length > 0) {
        // Handle simple_attribute_values format from API
        displaySpecifications(product.simple_attribute_values.map(attr => ({
            name: attr.attribute?.name || attr.attribute_name,
            value: attr.display_value || attr.value || attr.attribute_value
        })));
        displaySpecificationsInDetails(product.simple_attribute_values);
    }

    // Show product content
    const productContent = document.getElementById('productContent');
    const productDetailsSection = document.getElementById('productDetailsSection');

    if (productContent) {
        productContent.style.display = 'grid';
        // CRITICAL: NO top margin - start immediately
        productContent.style.marginTop = '0px';
        productContent.style.paddingTop = '0px';
        productContent.style.gap = '0px';
        productContent.style.rowGap = '0px';
        productContent.style.columnGap = '0px';
        productContent.style.alignItems = 'start';
        productContent.style.alignContent = 'start';

        // Mobile layout: Let CSS handle everything via Flexbox
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            // No inline styles needed here, mobile-critical-fixes.css handles it
        } else {
            // Desktop: Grid handled by product.css
        }

        if (isMobile) {
            // Handled by CSS
        }
    }
    if (productDetailsSection) {
        productDetailsSection.style.display = 'block';
        populateProductDetails(product);
    }

    // Force mobile layout after product is displayed
    setTimeout(() => {
        forceMobileLayout();
        // Ensure sticky works on desktop
        if (window.innerWidth > 768) {
            ensureStickyParentContainers();
        }
    }, 100);
}

// Force mobile layout - called on resize and after product load
function forceMobileLayout() {
    const isMobile = window.innerWidth <= 768;
    const productContent = document.getElementById('productContent');

    if (!productContent) return;

    if (isMobile) {
        // Mobile Layout: Handled by mobile-critical-fixes.css
        // No inline styles needed here to avoid fighting with CSS
    } else {
        // Desktop: Remove inline mobile styles and ensure sticky positioning works
        productContent.style.removeProperty('grid-template-columns');
        productContent.style.removeProperty('grid-template-rows');
        productContent.style.removeProperty('width');
        productContent.style.removeProperty('max-width');
        productContent.style.removeProperty('min-height');

        const imagesWrapper = productContent.querySelector('.product-images-wrapper');
        if (imagesWrapper) {
            // Remove mobile-specific inline styles
            imagesWrapper.style.removeProperty('grid-column');
            imagesWrapper.style.removeProperty('grid-row');
            imagesWrapper.style.removeProperty('width');
            imagesWrapper.style.removeProperty('max-width');
            imagesWrapper.style.removeProperty('height');
            imagesWrapper.style.removeProperty('max-height');

            // CRITICAL: Ensure sticky positioning is enabled on desktop
            // Check if CSS sticky is applied, if not, force it
            const computedStyle = window.getComputedStyle(imagesWrapper);
            const isSticky = computedStyle.position === 'sticky' || computedStyle.position === '-webkit-sticky';

            if (!isSticky) {
                // CSS sticky not applied, force it with inline styles
                imagesWrapper.style.setProperty('position', 'sticky', 'important');
                imagesWrapper.style.setProperty('top', '112px', 'important');
                imagesWrapper.style.setProperty('align-self', 'start', 'important');
            } else {
                // CSS sticky is applied, just remove any conflicting inline styles
                imagesWrapper.style.removeProperty('position');
                imagesWrapper.style.removeProperty('top');
            }

            // Ensure parent containers allow sticky
            ensureStickyParentContainers();
        }

        const rightColumn = productContent.querySelector('.product-right-column');
        if (rightColumn) {
            rightColumn.style.removeProperty('grid-column');
            rightColumn.style.removeProperty('grid-row');
            rightColumn.style.removeProperty('width');
            rightColumn.style.removeProperty('max-width');
            rightColumn.style.removeProperty('position');
            rightColumn.style.removeProperty('top');
        }
    }
}

// Ensure parent containers allow sticky positioning
function ensureStickyParentContainers() {
    const containers = [
        document.querySelector('.product-main'),
        document.querySelector('.product-main > .container'),
        document.querySelector('.product-container'),
        document.querySelector('#productContainer'),
        document.querySelector('#productContent'),
        document.querySelector('.product-content')
    ];

    containers.forEach(container => {
        if (container) {
            const computed = window.getComputedStyle(container);
            // Ensure overflow is visible (required for sticky to work)
            if (computed.overflow !== 'visible' && computed.overflowY !== 'visible') {
                container.style.setProperty('overflow', 'visible', 'important');
                container.style.setProperty('overflow-y', 'visible', 'important');
                container.style.setProperty('overflow-x', 'visible', 'important');
            }
            // Ensure no transform (breaks sticky)
            if (computed.transform && computed.transform !== 'none') {
                container.style.setProperty('transform', 'none', 'important');
            }
        }
    });
}

// Setup resize listener for mobile layout
function setupMobileLayoutListener() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            forceMobileLayout();
            // Recreate banner slider if switching between mobile/desktop
            if (productImages && productImages.length > 0) {
                displayProductImages(productImages);
            }
            // Re-ensure sticky on desktop after resize
            if (window.innerWidth > 768) {
                ensureStickyParentContainers();
            }
        }, 100);
    });

    // Also call on orientation change for mobile devices
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            forceMobileLayout();
            if (window.innerWidth > 768) {
                ensureStickyParentContainers();
            }
        }, 200);
    });
}

// Populate product details section
function populateProductDetails(product) {
    // Populate description
    const descriptionText = document.getElementById('productDescriptionText');
    if (descriptionText && product.description) {
        descriptionText.textContent = product.description;
    }

    // Populate highlights from API or fallback to attributes
    const highlightsList = document.getElementById('highlightsList');
    if (highlightsList) {
        highlightsList.innerHTML = '';

        let highlights = [];

        // First, try to get highlights directly from API response
        if (product.highlights && Array.isArray(product.highlights) && product.highlights.length > 0) {
            // Extract text from array of objects: [{text: "..."}, {text: "..."}]
            highlights = product.highlights.map(h => {
                // If it's an object with text property, extract the text
                if (h && typeof h === 'object' && h.text) {
                    return h.text;
                }
                // If it's already a string, use it directly
                if (typeof h === 'string') {
                    return h;
                }
                return '';
            }).filter(h => h && h.trim && h.trim().length > 0);
        } else if (product.highlights && typeof product.highlights === 'string') {
            // If highlights is a string, try to parse it as JSON or split by newlines
            try {
                const parsed = JSON.parse(product.highlights);
                if (Array.isArray(parsed)) {
                    highlights = parsed.map(h => {
                        // If it's an object with text property, extract the text
                        if (h && typeof h === 'object' && h.text) {
                            return h.text;
                        }
                        // If it's already a string, use it directly
                        if (typeof h === 'string') {
                            return h;
                        }
                        return '';
                    }).filter(h => h && h.trim && h.trim().length > 0);
                } else {
                    highlights = [product.highlights];
                }
            } catch (e) {
                highlights = product.highlights.split('\n').filter(h => h.trim());
            }
        } else {
            // Fallback: Get highlights from product attributes
            if (product.simple_attribute_values) {
                const storage = product.simple_attribute_values.find(attr =>
                    attr.attribute?.slug === 'storage' || attr.attribute?.name?.toLowerCase().includes('storage')
                );
                if (storage) {
                    highlights.push(`${storage.display_value || storage.value} ROM`);
                }

                const display = product.simple_attribute_values.find(attr =>
                    attr.attribute?.slug === 'display' || attr.attribute?.name?.toLowerCase().includes('display')
                );
                if (display) {
                    highlights.push(display.display_value || display.value);
                }

                const camera = product.simple_attribute_values.find(attr =>
                    attr.attribute?.slug === 'camera' || attr.attribute?.name?.toLowerCase().includes('camera')
                );
                if (camera) {
                    highlights.push(camera.display_value || camera.value);
                }

                const processor = product.simple_attribute_values.find(attr =>
                    attr.attribute?.slug === 'processor' || attr.attribute?.name?.toLowerCase().includes('processor')
                );
                if (processor) {
                    highlights.push(`${processor.display_value || processor.value} Processor`);
                }
            }

            // If still no highlights found, add defaults
            if (highlights.length === 0) {
                highlights.push('Premium Quality');
                highlights.push('Fast Delivery');
                highlights.push('Secure Payment');
            }
        }

        highlights.forEach(highlight => {
            const li = document.createElement('li');
            // Ensure we're displaying a string, not an object
            const displayText = typeof highlight === 'string' ? highlight : (highlight?.text || String(highlight));
            li.textContent = displayText;
            highlightsList.appendChild(li);
        });
    }

    // Populate payment options from API or use defaults
    const paymentOptionsList = document.querySelector('.payment-options-list');
    if (paymentOptionsList) {
        paymentOptionsList.innerHTML = '';

        let paymentOptions = [];

        // First, try to get payment options from API response (check both easy_payment_options and payment_options)
        const apiPaymentOptions = product.easy_payment_options || product.payment_options;

        if (apiPaymentOptions && Array.isArray(apiPaymentOptions) && apiPaymentOptions.length > 0) {
            // Handle array of objects with 'text' property: [{text: "..."}, {text: "..."}]
            paymentOptions = apiPaymentOptions.map(opt => {
                if (typeof opt === 'object' && opt.text) {
                    return opt.text;
                } else if (typeof opt === 'string') {
                    return opt;
                }
                return String(opt);
            }).filter(opt => opt);
        } else if (apiPaymentOptions && typeof apiPaymentOptions === 'string') {
            // If payment_options is a string, try to parse it as JSON or split by newlines
            try {
                const parsed = JSON.parse(apiPaymentOptions);
                if (Array.isArray(parsed)) {
                    paymentOptions = parsed.map(opt => {
                        // If it's an object with text property, extract the text
                        if (opt && typeof opt === 'object' && opt.text) {
                            return opt.text;
                        }
                        // If it's already a string, use it directly
                        if (typeof opt === 'string') {
                            return opt;
                        }
                        return '';
                    }).filter(opt => opt && opt.trim && opt.trim().length > 0);
                } else {
                    paymentOptions = [apiPaymentOptions];
                }
            } catch (e) {
                paymentOptions = apiPaymentOptions.split('\n').filter(p => p.trim());
            }
        } else {
            // Fallback: Use default payment options
            const price = parseFloat(product.price) || 0;
            const monthlyEMI = Math.round(price / 12);
            paymentOptions = [
                `EMI starting from <span id="emiAmount">${formatPrice(monthlyEMI)}</span>/month`,
                'Cash on Delivery',
                'Net banking & Credit/ Debit/ ATM card'
            ];
        }

        paymentOptions.forEach(option => {
            const li = document.createElement('li');
            // Check if option contains HTML (like EMI with span)
            if (option.includes('<span')) {
                li.innerHTML = option;
            } else {
                li.textContent = option;
            }
            paymentOptionsList.appendChild(li);
        });

        // Update EMI amount if it exists separately
        const emiAmount = document.getElementById('emiAmount');
        if (emiAmount && product.price) {
            const price = parseFloat(product.price) || 0;
            const monthlyEMI = Math.round(price / 12);
            emiAmount.textContent = formatPrice(monthlyEMI);
        }
    } else {
        // Fallback: Update EMI amount if payment options list doesn't exist
        const emiAmount = document.getElementById('emiAmount');
        if (emiAmount && product.price) {
            const price = parseFloat(product.price) || 0;
            const monthlyEMI = Math.round(price / 12);
            emiAmount.textContent = formatPrice(monthlyEMI);
        }
    }
}

// Check delivery pincode using Delivery Check API
async function checkDelivery() {
    const pincodeInput = document.getElementById('deliveryPincode');
    const deliveryInfo = document.getElementById('deliveryInfo');

    if (!pincodeInput || !deliveryInfo) return;

    const pincode = pincodeInput.value.trim();

    // Validate pincode: 6 digits, not starting with 0 (regex: /^[1-9][0-9]{5}$/)
    if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode)) {
        showNotification('Please enter a valid 6-digit pincode (cannot start with 0)', 'error');
        return;
    }

    // Show loading state
    const checkBtn = document.getElementById('deliveryCheckBtn');
    const originalBtnText = checkBtn ? checkBtn.textContent : 'Check';
    if (checkBtn) {
        checkBtn.disabled = true;
        checkBtn.textContent = 'Checking...';
    }

    try {

        // Build API URL with query parameters
        let apiUrl = `/delivery/check?pincode=${encodeURIComponent(pincode)}`;
        if (currentProduct && currentProduct.id) {
            apiUrl += `&product_id=${currentProduct.id}`;
        }


        // Call delivery check API
        const result = await makeApiCall(apiUrl);

        if (!result || !result.success) {
            const errorMsg = result?.message || 'Failed to check delivery for this pincode';

            if (result?.errors) {
                const errorList = Object.values(result.errors).flat().join(', ');
                showNotification(errorList || errorMsg, 'error');
            } else {
                showNotification(errorMsg, 'error');
            }

            // Hide delivery info on error
            deliveryInfo.style.display = 'none';
            return;
        }

        const deliveryData = result.data || {};

        // Extract delivery message from API response
        const deliveryMessage = deliveryData.message || '';

        // Extract delivery information from API response
        // Try to parse delivery days from message (e.g., "Delivery in 2-7 days" -> use max or average)
        let deliveryDays = deliveryData.expected_delivery_days || deliveryData.delivery_days || 3;

        // If message contains delivery days info, try to extract it
        if (deliveryMessage && !deliveryData.expected_delivery_days && !deliveryData.delivery_days) {
            const daysMatch = deliveryMessage.match(/(\d+)[\s-]+(\d+)?\s*days?/i);
            if (daysMatch) {
                if (daysMatch[2]) {
                    // Range like "2-7 days" - use the higher number
                    deliveryDays = parseInt(daysMatch[2]);
                } else {
                    // Single number like "3 days"
                    deliveryDays = parseInt(daysMatch[1]);
                }
            }
        }

        const installationDays = deliveryData.installation_days || deliveryData.expected_installation_days || 5;
        const installationPrice = deliveryData.installation_fees || deliveryData.installation_fee || deliveryData.setup_fee || 399;
        const deliveryFee = deliveryData.delivery_fees || deliveryData.delivery_fee || 0;

        // Calculate dates
        const deliveryDate = calculateDeliveryDate(parseInt(deliveryDays));
        const installationDate = calculateInstallationDate(parseInt(installationDays));
        const currentHour = new Date().getHours();
        const currentMinute = new Date().getMinutes();
        const timeString = `${currentHour}:${currentMinute < 10 ? '0' : ''}${currentMinute} ${currentHour >= 12 ? 'PM' : 'AM'}`;

        // Update delivery info
        const deliveryDateDetail = document.getElementById('deliveryDateDetail');
        const deliveryTime = document.getElementById('deliveryTime');
        const installationDateEl = document.getElementById('installationDate');

        // Display delivery message if available, otherwise show calculated date
        if (deliveryDateDetail) {
            if (deliveryMessage) {
                // Show the API message (e.g., "Delivery in 2-7 days")
                deliveryDateDetail.textContent = deliveryMessage;
            } else {
                // Fallback to calculated date
                deliveryDateDetail.textContent = deliveryDate;
            }
        }

        if (deliveryTime) deliveryTime.textContent = timeString;
        if (installationDateEl) {
            // Update installation date
            installationDateEl.textContent = installationDate;
            // Update the parent element to include the price
            const installationInfo = installationDateEl.parentElement;
            if (installationInfo) {
                // Format: "Installation & Demo by [date] [price]"
                const priceStr = formatPrice(parseFloat(installationPrice));
                installationInfo.innerHTML = `Installation & Demo by <span id="installationDate">${installationDate}</span> ${priceStr}`;
            }
        }

        deliveryInfo.style.display = 'block';

        // Show message from API if available (no error notifications)
        if (deliveryMessage) {
            // Display the API message as info/success, not error
            showNotification(deliveryMessage, 'success');
        } else {
            // Fallback message
            showNotification(`Delivery information for pincode ${pincode}`, 'success');
        }

    } catch (error) {
        showNotification('Unable to check delivery for this pincode. Please try again.', 'error');

        // Hide delivery info on error
        deliveryInfo.style.display = 'none';
    } finally {
        // Reset button state
        if (checkBtn) {
            checkBtn.disabled = false;
            checkBtn.textContent = originalBtnText;
        }
    }
}

// Calculate installation date based on number of days
function calculateInstallationDate(days = 5) {
    const today = new Date();
    const installationDate = new Date(today);
    installationDate.setDate(today.getDate() + days);

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const day = installationDate.getDate();
    const month = months[installationDate.getMonth()];
    const dayName = daysOfWeek[installationDate.getDay()];

    return `${day} ${month}, ${dayName}`;
}

// Populate product details section
function populateProductDetails(product) {
    // Populate description
    const descriptionText = document.getElementById('productDescriptionText');
    if (descriptionText && product.description) {
        descriptionText.textContent = product.description;
    }

    // Populate highlights from API or fallback to attributes
    const highlightsList = document.getElementById('highlightsList');
    if (highlightsList) {
        highlightsList.innerHTML = '';

        let highlights = [];

        // First, try to get highlights directly from API response
        if (product.highlights && Array.isArray(product.highlights) && product.highlights.length > 0) {
            highlights = product.highlights;
        } else if (product.highlights && typeof product.highlights === 'string') {
            // If highlights is a string, try to parse it as JSON or split by newlines
            try {
                const parsed = JSON.parse(product.highlights);
                highlights = Array.isArray(parsed) ? parsed : [product.highlights];
            } catch (e) {
                highlights = product.highlights.split('\n').filter(h => h.trim());
            }
        } else {
            // Fallback: Get highlights from product attributes
            if (product.simple_attribute_values) {
                const storage = product.simple_attribute_values.find(attr =>
                    attr.attribute?.slug === 'storage' || attr.attribute?.name?.toLowerCase().includes('storage')
                );
                if (storage) {
                    highlights.push(`${storage.display_value || storage.value} ROM`);
                }

                const display = product.simple_attribute_values.find(attr =>
                    attr.attribute?.slug === 'display' || attr.attribute?.name?.toLowerCase().includes('display')
                );
                if (display) {
                    highlights.push(display.display_value || display.value);
                }

                const camera = product.simple_attribute_values.find(attr =>
                    attr.attribute?.slug === 'camera' || attr.attribute?.name?.toLowerCase().includes('camera')
                );
                if (camera) {
                    highlights.push(camera.display_value || camera.value);
                }

                const processor = product.simple_attribute_values.find(attr =>
                    attr.attribute?.slug === 'processor' || attr.attribute?.name?.toLowerCase().includes('processor')
                );
                if (processor) {
                    highlights.push(`${processor.display_value || processor.value} Processor`);
                }
            }

            // If still no highlights found, add defaults
            if (highlights.length === 0) {
                highlights.push('Premium Quality');
                highlights.push('Fast Delivery');
                highlights.push('Secure Payment');
            }
        }

        highlights.forEach(highlight => {
            const li = document.createElement('li');
            // Ensure we're displaying a string, not an object
            const displayText = typeof highlight === 'string' ? highlight : (highlight?.text || String(highlight));
            li.textContent = displayText;
            highlightsList.appendChild(li);
        });
    }

    // Populate payment options from API or use defaults
    const paymentOptionsList = document.querySelector('.payment-options-list');
    if (paymentOptionsList) {
        paymentOptionsList.innerHTML = '';

        let paymentOptions = [];

        // First, try to get payment options from API response (check both easy_payment_options and payment_options)
        const apiPaymentOptions = product.easy_payment_options || product.payment_options;

        if (apiPaymentOptions && Array.isArray(apiPaymentOptions) && apiPaymentOptions.length > 0) {
            // Extract text from array of objects: [{text: "..."}, {text: "..."}]
            paymentOptions = apiPaymentOptions.map(opt => {
                // If it's an object with text property, extract the text
                if (opt && typeof opt === 'object' && opt.text) {
                    return opt.text;
                }
                // If it's already a string, use it directly
                if (typeof opt === 'string') {
                    return opt;
                }
                return '';
            }).filter(opt => opt && opt.trim && opt.trim().length > 0);
        } else if (apiPaymentOptions && typeof apiPaymentOptions === 'string') {
            // If payment_options is a string, try to parse it as JSON or split by newlines
            try {
                const parsed = JSON.parse(apiPaymentOptions);
                if (Array.isArray(parsed)) {
                    paymentOptions = parsed.map(opt => {
                        if (opt && typeof opt === 'object' && opt.text) {
                            return opt.text;
                        }
                        if (typeof opt === 'string') {
                            return opt;
                        }
                        return '';
                    }).filter(opt => opt && opt.trim && opt.trim().length > 0);
                } else {
                    paymentOptions = [apiPaymentOptions];
                }
            } catch (e) {
                paymentOptions = apiPaymentOptions.split('\n').filter(p => p.trim());
            }
        } else {
            // Fallback: Use default payment options
            const price = parseFloat(product.price) || 0;
            const monthlyEMI = Math.round(price / 12);
            paymentOptions = [
                `EMI starting from <span id="emiAmount">${formatPrice(monthlyEMI)}</span>/month`,
                'Cash on Delivery',
                'Net banking & Credit/ Debit/ ATM card'
            ];
        }

        paymentOptions.forEach(option => {
            const li = document.createElement('li');
            // Check if option contains HTML (like EMI with span)
            if (option.includes('<span')) {
                li.innerHTML = option;
            } else {
                li.textContent = option;
            }
            paymentOptionsList.appendChild(li);
        });

        // Update EMI amount if it exists separately
        const emiAmount = document.getElementById('emiAmount');
        if (emiAmount && product.price) {
            const price = parseFloat(product.price) || 0;
            const monthlyEMI = Math.round(price / 12);
            emiAmount.textContent = formatPrice(monthlyEMI);
        }
    } else {
        // Fallback: Update EMI amount if payment options list doesn't exist
        const emiAmount = document.getElementById('emiAmount');
        if (emiAmount && product.price) {
            const price = parseFloat(product.price) || 0;
            const monthlyEMI = Math.round(price / 12);
            emiAmount.textContent = formatPrice(monthlyEMI);
        }
    }

    // Display specifications in details section
    if (product.simple_attribute_values && product.simple_attribute_values.length > 0) {
        displaySpecificationsInDetails(product.simple_attribute_values);
    } else if (product.simple_attributes && product.simple_attributes.length > 0) {
        displaySpecificationsInDetails(product.simple_attributes.map(attr => ({
            attribute: { name: attr.name || attr.attribute_name },
            display_value: attr.value || attr.attribute_value,
            value: attr.value || attr.attribute_value
        })));
    }
}

// Display rating with Flipkart-style badge
function displayRating(rating, ratingsCount, reviewsCount) {
    const ratingValue = document.getElementById('ratingValue');
    const ratingText = document.getElementById('ratingText');

    // Ensure rating is a number
    const numRating = parseFloat(rating) || 0;

    // Set rating value (format to one decimal place)
    if (ratingValue) {
        ratingValue.textContent = numRating.toFixed(1);
    }

    // Set ratings and reviews text (without parentheses, like Flipkart)
    if (ratingText) {
        const formattedRatings = new Intl.NumberFormat('en-IN').format(ratingsCount || 0);
        const formattedReviews = new Intl.NumberFormat('en-IN').format(reviewsCount || 0);
        ratingText.textContent = `${formattedRatings} Ratings & ${formattedReviews} Reviews`;
    }
}

// Calculate delivery date based on number of days
function calculateDeliveryDate(days = 3) {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + days);

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const day = deliveryDate.getDate();
    const month = months[deliveryDate.getMonth()];
    const dayName = daysOfWeek[deliveryDate.getDay()];

    return `${day} ${month}, ${dayName}`;
}

// Display product images (Flipkart style - vertical thumbnails)
function displayProductImages(images) {
    if (!images || images.length === 0) return;

    const isMobile = window.innerWidth <= 768;
    const mainImageContainer = document.querySelector('.main-image-container');

    // Mobile: Create banner slider
    if (isMobile && mainImageContainer) {
        createMobileBannerSlider(images, mainImageContainer);
    } else {
        // Desktop: Original behavior
        // Main image
        const mainImage = document.getElementById('mainProductImage');
        if (mainImage) {
            mainImage.src = images[0];
            currentImageIndex = 0;
        }

        // Thumbnails (vertical layout)
        const thumbnailGallery = document.getElementById('thumbnailGallery');
        if (!thumbnailGallery) return;

        thumbnailGallery.innerHTML = '';

        images.forEach((imageUrl, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = `thumbnail-item ${index === 0 ? 'active' : ''}`;
            thumbnail.onclick = () => selectImage(index);

            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = `Product image ${index + 1}`;
            img.onerror = function () {
                this.src = '/images/placeholder.jpg';
            };
            thumbnail.appendChild(img);
            thumbnailGallery.appendChild(thumbnail);
        });

        // Setup scroll arrows if more than 6 images
        const thumbUpBtn = document.getElementById('thumbUpBtn');
        const thumbDownBtn = document.getElementById('thumbDownBtn');

        if (images.length > 6) {
            if (thumbUpBtn) thumbUpBtn.style.display = 'flex';
            if (thumbDownBtn) thumbDownBtn.style.display = 'flex';

            // Scroll functions
            const scrollAmount = 67 * 2; // Scroll 2 items height approx

            if (thumbUpBtn && thumbDownBtn) {
                // Remove old listeners to prevent duplicates (cloning node is a quick way)
                const newUpBtn = thumbUpBtn.cloneNode(true);
                thumbUpBtn.parentNode.replaceChild(newUpBtn, thumbUpBtn);
                const newDownBtn = thumbDownBtn.cloneNode(true);
                thumbDownBtn.parentNode.replaceChild(newDownBtn, thumbDownBtn);

                newUpBtn.onclick = () => {
                    thumbnailGallery.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
                };

                newDownBtn.onclick = () => {
                    thumbnailGallery.scrollBy({ top: scrollAmount, behavior: 'smooth' });
                };

                // Update arrow state on scroll
                const updateArrows = () => {
                    const scrollTop = thumbnailGallery.scrollTop;
                    const maxScroll = thumbnailGallery.scrollHeight - thumbnailGallery.clientHeight;

                    if (scrollTop <= 5) {
                        newUpBtn.classList.add('disabled');
                    } else {
                        newUpBtn.classList.remove('disabled');
                    }

                    if (scrollTop >= maxScroll - 5) {
                        newDownBtn.classList.add('disabled');
                    } else {
                        newDownBtn.classList.remove('disabled');
                    }
                };

                thumbnailGallery.addEventListener('scroll', updateArrows);
                // Initial check
                updateArrows();

                // Allow some time for rendering before checking height
                setTimeout(updateArrows, 100);
            }
        } else {
            if (thumbUpBtn) thumbUpBtn.style.display = 'none';
            if (thumbDownBtn) thumbDownBtn.style.display = 'none';
        }
    }
}

// Create mobile banner slider
function createMobileBannerSlider(images, container) {
    if (!container || !images || images.length === 0) return;

    // Debug: Log images being used
    // /* console.log */('Creating mobile banner slider with images:', images);

    // Clear existing content
    container.innerHTML = '';

    // Create carousel wrapper
    const carousel = document.createElement('div');
    carousel.className = 'product-banner-carousel';

    // Create slides container
    const slides = document.createElement('div');
    slides.className = 'product-banner-slides';
    slides.id = 'productBannerSlides';
    // Set CSS variable for slide count
    slides.style.setProperty('--slide-count', images.length);

    // Create slides - ensure each gets a unique image
    images.forEach((imageUrl, index) => {
        // Ensure we have a valid URL
        if (!imageUrl || imageUrl === 'undefined' || imageUrl === 'null') {
            // /* console.warn */(`Skipping invalid image at index ${index}:`, imageUrl);
            return;
        }

        const slide = document.createElement('div');
        slide.className = 'product-banner-slide';
        slide.dataset.index = index;
        slide.style.width = '100%';
        slide.style.minWidth = '100%';
        slide.style.flexShrink = '0';

        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `Product image ${index + 1}`;
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.onerror = function () {
            // /* console.error */(`Failed to load image ${index + 1}:`, imageUrl);
            this.src = '/images/placeholder.jpg';
        };
        img.onload = function () {
            // /* console.log */(`Loaded image ${index + 1}:`, imageUrl);
        };

        // Ensure each image is unique and properly loaded
        img.setAttribute('data-image-index', index);
        img.setAttribute('data-image-url', imageUrl);

        slide.appendChild(img);
        slides.appendChild(slide);
    });

    // Debug: Verify slides were created
    // /* console.log */(`Created ${slides.children.length} slides for ${images.length} images`);

    carousel.appendChild(slides);

    // Create action buttons (Share and Wishlist) - Top right corner like Flipkart
    const actionButtons = document.createElement('div');
    actionButtons.className = 'product-banner-actions';

    // Wishlist button
    const wishlistBtn = document.createElement('button');
    wishlistBtn.className = 'product-banner-action-btn product-banner-wishlist';
    wishlistBtn.setAttribute('aria-label', 'Add to wishlist');
    wishlistBtn.innerHTML = '<i class="far fa-heart"></i>';
    wishlistBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist();
    };

    // Share button
    const shareBtn = document.createElement('button');
    shareBtn.className = 'product-banner-action-btn product-banner-share';
    shareBtn.setAttribute('aria-label', 'Share product');
    shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
    shareBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleMobileShare();
    };

    actionButtons.appendChild(wishlistBtn);
    actionButtons.appendChild(shareBtn);
    carousel.appendChild(actionButtons);

    // Update wishlist button state if product is already in wishlist
    setTimeout(() => {
        updateMobileWishlistButton(wishlistBtn);
    }, 500);

    // Create navigation dots
    if (images.length > 1) {
        const dots = document.createElement('div');
        dots.className = 'product-banner-dots';

        images.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = `product-banner-dot ${index === 0 ? 'active' : ''}`;
            dot.dataset.index = index;
            dot.onclick = () => goToSlide(index);
            dots.appendChild(dot);
        });

        carousel.appendChild(dots);

        // Create navigation arrows (only show if more than 1 image)
        const prevArrow = document.createElement('button');
        prevArrow.className = 'product-banner-arrow prev';
        prevArrow.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevArrow.onclick = () => previousSlide();
        prevArrow.setAttribute('aria-label', 'Previous image');

        const nextArrow = document.createElement('button');
        nextArrow.className = 'product-banner-arrow next';
        nextArrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextArrow.onclick = () => nextSlide();
        nextArrow.setAttribute('aria-label', 'Next image');

        carousel.appendChild(prevArrow);
        carousel.appendChild(nextArrow);

        // Touch/swipe support
        let touchStartX = 0;
        let touchEndX = 0;
        let isDragging = false;

        slides.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            isDragging = true;
        });

        slides.addEventListener('touchmove', (e) => {
            if (isDragging) {
                touchEndX = e.touches[0].clientX;
            }
        });

        slides.addEventListener('touchend', () => {
            if (isDragging) {
                const diff = touchStartX - touchEndX;
                const threshold = 50; // Minimum swipe distance

                if (Math.abs(diff) > threshold) {
                    if (diff > 0) {
                        nextSlide(); // Swipe left - next
                    } else {
                        previousSlide(); // Swipe right - previous
                    }
                }

                isDragging = false;
                touchStartX = 0;
                touchEndX = 0;
            }
        });

        // Auto-play (optional - can be disabled)
        // let autoPlayInterval = setInterval(() => {
        //     nextSlide();
        // }, 5000);
    }

    container.appendChild(carousel);
    currentImageIndex = 0;

    // Initialize first slide position - ensure transform is set
    setTimeout(() => {
        const slidesEl = document.getElementById('productBannerSlides');
        if (slidesEl) {
            slidesEl.style.transform = 'translateX(0%)';
            // Force reflow to ensure CSS is applied
            slidesEl.offsetHeight;
        }
        goToSlide(0);
    }, 100);
}

// Go to specific slide
function goToSlide(index) {
    if (!productImages || productImages.length === 0) return;
    if (index < 0 || index >= productImages.length) return;

    currentImageIndex = index;
    const slides = document.getElementById('productBannerSlides');
    if (slides) {
        const translateX = -(index * 100);
        slides.style.transform = `translateX(${translateX}%)`;
        slides.style.transition = 'transform 0.3s ease';
        // Force reflow to ensure transform is applied
        void slides.offsetHeight;
    }

    // Update active dot
    document.querySelectorAll('.product-banner-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

// Next slide
function nextSlide() {
    const nextIndex = (currentImageIndex + 1) % productImages.length;
    goToSlide(nextIndex);
}

// Previous slide
function previousSlide() {
    const prevIndex = (currentImageIndex - 1 + productImages.length) % productImages.length;
    goToSlide(prevIndex);
}

// Select image
function selectImage(index) {
    if (index < 0 || index >= productImages.length) return;

    currentImageIndex = index;

    // Check if mobile banner slider exists
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        goToSlide(index);
    } else {
        // Desktop: Update main image
        const mainImage = document.getElementById('mainProductImage');
        if (mainImage) {
            mainImage.src = productImages[index];
        }

        // Update active thumbnail
        document.querySelectorAll('.thumbnail-item').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }
}

// Handle image zoom
function handleImageZoom(e) {
    const container = e.currentTarget;
    const zoom = document.getElementById('imageZoom');
    const mainImage = document.getElementById('mainProductImage');

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const zoomX = (x / rect.width) * 100;
    const zoomY = (y / rect.height) * 100;

    zoom.style.left = `${x - 100}px`;
    zoom.style.top = `${y - 100}px`;
    zoom.style.backgroundImage = `url(${mainImage.src})`;
    zoom.style.backgroundPosition = `${zoomX}% ${zoomY}%`;
    zoom.style.display = 'block';
}

// Load linked variations
async function loadLinkedVariations(slug) {
    try {
        const result = await makeApiCall(`/linked-variations/product/${slug}`);

        if (result.success && result.data) {
            linkedVariationsData = result.data;
            linkedVariationsProducts = result.data.linked_variations || [];

            if (result.data.variation_attributes && result.data.variation_attributes.length > 0) {
                displayVariationAttributes(result.data.variation_attributes);
            }
        }
    } catch (error) {
        // Silently handle error
    }
}

// Load warranty information for the product's brand
async function loadWarrantyInfo(brandIdentifier, identifierType = null) {
    try {
        if (!brandIdentifier) {
            // /* console.log */('Warranty API: No brand identifier provided');
            return;
        }

        // Determine identifier type if not provided
        if (!identifierType) {
            // Check if it's a number (ID) or string (slug)
            identifierType = typeof brandIdentifier === 'number' || /^\d+$/.test(String(brandIdentifier)) ? 'id' : 'slug';
        }

        // Build API endpoint based on identifier type
        const apiEndpoint = `/brands/${brandIdentifier}/warranty`;

        // /* console.log */('Warranty API: Calling endpoint:', apiEndpoint);
        // /* console.log */('Warranty API: Brand identifier:', brandIdentifier);
        // /* console.log */('Warranty API: Identifier type:', identifierType);

        const result = await makeApiCall(apiEndpoint);

        // Log BRAND WARRANTY API response separately
        // /* console.log */('');
        // /* console.log */('============================================');
        // /* console.log */('BRAND WARRANTY API RESPONSE');
        // /* console.log */('============================================');
        // /* console.log */('Endpoint:', apiEndpoint);
        // /* console.log */('Brand identifier:', brandIdentifier);
        // /* console.log */('Identifier type:', identifierType);
        // /* console.log */('');
        // /* console.log */('Full API Response:');
        // /* console.log */(JSON.stringify(result, null, 2));
        // /* console.log */('');
        // /* console.log */('============================================');

        if (result.success && result.data && result.data.warranty) {
            // /* console.log */('Warranty API: Processing warranty data...');
            displayWarrantyInfo(result.data.warranty, result.data.brand);
            // /* console.log */('Warranty API: Warranty info displayed successfully');
        } else {
            // /* console.log */('Warranty API: Response not successful or missing warranty data');
            // /* console.log */('Warranty API: result.success:', result?.success);
            // /* console.log */('Warranty API: result.data:', result?.data);
            // /* console.log */('Warranty API: result.data.warranty:', result?.data?.warranty);
            displayDefaultWarranty();
        }
    } catch (error) {
        // /* console.error */('Warranty API: Error loading warranty info:', error);
        // /* console.error */('Warranty API: Error message:', error.message);
        // /* console.error */('Warranty API: Error stack:', error.stack);
        // Fallback to default warranty display
        displayDefaultWarranty();
    }
}

// Store warranty data globally for modal
let warrantyData = null;

// Display warranty information dynamically
function displayWarrantyInfo(warranty, brand) {
    const warrantyInfo = document.querySelector('.warranty-info');
    if (!warrantyInfo) return;

    // Store warranty data for modal
    warrantyData = { warranty, brand };

    // Get warranty durations and concatenate with "and"
    const deviceWarranty = warranty.device_warranty_duration || '';
    const accessoriesWarranty = warranty.accessories_warranty_duration || '';

    // Concatenate the two warranty strings with "and"
    let warrantyText = '';
    if (deviceWarranty && accessoriesWarranty) {
        warrantyText = `${deviceWarranty} and ${accessoriesWarranty}`;
    } else if (deviceWarranty) {
        warrantyText = deviceWarranty;
    } else if (accessoriesWarranty) {
        warrantyText = accessoriesWarranty;
    } else {
        warrantyText = '1 year warranty for phone and 1 year warranty for in Box Accessories.';
    }

    // Update warranty text
    const warrantySpan = warrantyInfo.querySelector('span');
    if (warrantySpan) {
        warrantySpan.textContent = warrantyText;
    } else {
        // If span doesn't exist, create it
        const span = document.createElement('span');
        span.textContent = warrantyText;
        warrantyInfo.insertBefore(span, warrantyInfo.querySelector('a'));
    }

    // Update brand logo if available
    if (brand && brand.image) {
        const warrantyLogo = warrantyInfo.querySelector('.warranty-logo');
        if (warrantyLogo) {
            warrantyLogo.src = brand.image;
            warrantyLogo.alt = brand.name || 'Brand';
        }
    }

    // Update "Know More" link to open modal instead of external link
    const knowMoreLink = warrantyInfo.querySelector('.detail-link');
    if (knowMoreLink) {
        knowMoreLink.href = '#';
        knowMoreLink.onclick = (e) => {
            e.preventDefault();
            openWarrantyModal(warranty, brand);
        };
    }
}

// Open warranty details modal
function openWarrantyModal(warranty, brand) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('warrantyModal');
    if (!modal) {
        modal = createWarrantyModal();
        document.body.appendChild(modal);
    }

    // Populate modal content
    const modalContent = modal.querySelector('.warranty-modal-content');
    if (modalContent) {
        let html = '';

        // Brand info
        if (brand) {
            html += `<div class="warranty-modal-header">`;
            if (brand.image) {
                html += `<img src="${brand.image}" alt="${brand.name || 'Brand'}" class="warranty-modal-brand-logo">`;
            }
            html += `<h2>${brand.name || 'Brand'} Warranty Information</h2>`;
            html += `</div>`;
        }

        // Warranty durations
        html += `<div class="warranty-modal-section">`;
        html += `<h3>Warranty Details</h3>`;
        if (warranty.device_warranty_duration) {
            html += `<div class="warranty-detail-item">`;
            html += `<strong>Device Warranty:</strong> ${warranty.device_warranty_duration}`;
            html += `</div>`;
        }
        if (warranty.accessories_warranty_duration) {
            html += `<div class="warranty-detail-item">`;
            html += `<strong>Accessories Warranty:</strong> ${warranty.accessories_warranty_duration}`;
            html += `</div>`;
        }
        html += `</div>`;

        // Company description
        if (warranty.company_description) {
            html += `<div class="warranty-modal-section">`;
            html += `<h3>About ${brand?.name || 'Brand'}</h3>`;
            html += `<p class="warranty-description">${warranty.company_description}</p>`;
            html += `</div>`;
        }

        // Customer support
        if (warranty.customer_support) {
            html += `<div class="warranty-modal-section">`;
            html += `<h3>Customer Support</h3>`;
            html += `<div class="warranty-support-info">`;
            if (warranty.customer_support.phone) {
                html += `<div class="support-item">`;
                html += `<i class="fas fa-phone"></i>`;
                html += `<span><strong>Phone:</strong> <a href="tel:${warranty.customer_support.phone}">${warranty.customer_support.phone}</a></span>`;
                html += `</div>`;
            }
            if (warranty.customer_support.email) {
                html += `<div class="support-item">`;
                html += `<i class="fas fa-envelope"></i>`;
                html += `<span><strong>Email:</strong> <a href="mailto:${warranty.customer_support.email}">${warranty.customer_support.email}</a></span>`;
                html += `</div>`;
            }
            html += `</div>`;
            html += `</div>`;
        }

        // Website link
        if (warranty.website_url) {
            html += `<div class="warranty-modal-section">`;
            html += `<a href="${warranty.website_url}" target="_blank" rel="noopener noreferrer" class="warranty-website-link">`;
            html += `<i class="fas fa-external-link-alt"></i> Visit Official Website`;
            html += `</a>`;
            html += `</div>`;
        }

        modalContent.innerHTML = html;
    }

    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Create warranty modal
function createWarrantyModal() {
    const modal = document.createElement('div');
    modal.id = 'warrantyModal';
    modal.className = 'warranty-modal';

    modal.innerHTML = `
        <div class="warranty-modal-overlay"></div>
        <div class="warranty-modal-container">
            <div class="warranty-modal-header-bar">
                <h2>Warranty Information</h2>
                <button class="warranty-modal-close" onclick="closeWarrantyModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="warranty-modal-content">
                <!-- Content will be populated dynamically -->
            </div>
        </div>
    `;

    // Close on overlay click
    modal.querySelector('.warranty-modal-overlay').addEventListener('click', closeWarrantyModal);

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeWarrantyModal();
        }
    });

    return modal;
}

// Close warranty modal
function closeWarrantyModal() {
    const modal = document.getElementById('warrantyModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Make closeWarrantyModal globally accessible
window.closeWarrantyModal = closeWarrantyModal;

// Display default warranty if API fails
function displayDefaultWarranty() {
    const warrantyInfo = document.querySelector('.warranty-info');
    if (!warrantyInfo) return;

    const warrantySpan = warrantyInfo.querySelector('span');
    if (warrantySpan) {
        warrantySpan.textContent = '1 year warranty for phone and 1 year warranty for in Box Accessories.';
    }
}

// Display variation attributes
function displayVariationAttributes(attributes) {
    const variationsDetailsSection = document.getElementById('variationsDetailsSection');
    if (!variationsDetailsSection) {
        return;
    }

    variationsDetailsSection.innerHTML = '';

    // Initialize selected variations with first value of each attribute
    selectedVariations = {};

    if (!attributes || attributes.length === 0) {
        return;
    }

    // Separate color, storage, and RAM from other attributes
    const colorAttr = attributes.find(attr => {
        const slug = attr.attribute?.slug?.toLowerCase() || '';
        const name = attr.attribute?.name?.toLowerCase() || '';
        return slug === 'color' || name === 'color';
    });

    const storageAttr = attributes.find(attr => {
        const slug = attr.attribute?.slug?.toLowerCase() || '';
        const name = attr.attribute?.name?.toLowerCase() || '';
        return slug === 'storage' || name === 'storage' || name.includes('storage');
    });

    const ramAttr = attributes.find(attr => {
        const slug = attr.attribute?.slug?.toLowerCase() || '';
        const name = attr.attribute?.name?.toLowerCase() || '';
        return slug === 'ram' || name === 'ram' || name.toLowerCase().includes('ram');
    });

    const otherAttrs = attributes.filter(attr => {
        const slug = attr.attribute?.slug?.toLowerCase() || '';
        const name = attr.attribute?.name?.toLowerCase() || '';
        return !(slug === 'color' || name === 'color' ||
            slug === 'storage' || name === 'storage' || name.includes('storage') ||
            slug === 'ram' || name === 'ram' || name.toLowerCase().includes('ram'));
    });

    // Create stacked layout: Color, Storage, RAM in order
    if (colorAttr) {
        const colorItem = createVariationItem(colorAttr, true);
        if (colorItem) variationsDetailsSection.appendChild(colorItem);
    }

    if (storageAttr) {
        const storageItem = createVariationItem(storageAttr, false);
        if (storageItem) variationsDetailsSection.appendChild(storageItem);
    }

    if (ramAttr) {
        const ramItem = createVariationItem(ramAttr, false);
        if (ramItem) variationsDetailsSection.appendChild(ramItem);
    }

    // Create separate rows for other attributes
    otherAttrs.forEach((attrData) => {
        const detailRow = createVariationDetailRow(attrData);
        variationsDetailsSection.appendChild(detailRow);
    });

    // Helper function to create variation item (for side-by-side layout)
    function createVariationItem(attrData, isColor) {
        const attribute = attrData.attribute;
        const values = attrData.values || [];
        const displayType = attrData.display_type || 'button';

        if (values.length === 0) return null;

        const isColorAttribute = (attribute.slug && attribute.slug.toLowerCase() === 'color') ||
            (attribute.name && attribute.name.toLowerCase() === 'color');

        // Set first value as default selection
        selectedVariations[attribute.id] = values[0];

        const variationItem = document.createElement('div');
        variationItem.className = 'variation-item';

        const label = document.createElement('div');
        label.className = 'variation-label-details';
        label.textContent = attribute.name;

        const content = document.createElement('div');
        content.className = 'detail-content';

        const options = document.createElement('div');
        options.className = 'variation-options-details';

        // Add label first, then content with options
        variationItem.appendChild(label);

        // For Color attributes, always use image_url from values array
        if (isColorAttribute) {
            // Color with images from variation_attributes values
            values.forEach((valueObj, valueIndex) => {
                // Handle both object format {value: "Lily White", image_url: "..."} and string format
                let value, imageUrl;
                if (typeof valueObj === 'object' && valueObj !== null) {
                    value = valueObj.value || valueObj.name || valueObj;
                    imageUrl = valueObj.image_url || valueObj.image || null;
                } else {
                    // Fallback: valueObj is a string
                    value = valueObj;
                    imageUrl = null;
                }

                const attrId = attribute.id;
                const variationProduct = findVariationProductByAttributeValue(attrId, value);

                const swatch = document.createElement('div');
                swatch.className = 'color-variation-box'; // Don't auto-select, will be set by autoSelectVariationsFromProduct
                swatch.title = value; // Color name for hover tooltip
                swatch.dataset.attrId = attrId;
                swatch.dataset.value = value;
                swatch.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Prevent redirects during initialization
                    if (isInitializing) {
                        return;
                    }

                    // If variationProduct has a slug, redirect to that product page
                    if (variationProduct && variationProduct.slug) {
                        // Use replace to avoid adding to history and prevent back navigation issues
                        // Also check if we're already on that product page to prevent redirect loops
                        const currentSlug = getProductSlugFromURL();
                        if (currentSlug && currentSlug !== variationProduct.slug) {
                            // Set flag to prevent any other redirects
                            isInitializing = true;
                            window.location.replace(`/product.html?slug=${encodeURIComponent(variationProduct.slug)}`);
                        }
                        return;
                    }

                    // Fallback: update selection on current page
                    options.querySelectorAll('.color-variation-box').forEach(item => item.classList.remove('selected'));
                    swatch.classList.add('selected');
                    await selectLinkedVariation(attrId, value, swatch, variationProduct);
                };

                // Always create an image element
                const img = document.createElement('img');
                img.alt = value;
                img.className = 'color-variation-image';

                // Priority: 1) image_url from variation_attributes, 2) variation product image, 3) current product image
                if (imageUrl) {
                    img.src = imageUrl;
                    img.onerror = function () {
                        // Fallback to variation product image or current product image
                        this.src = variationProduct?.image_url || currentProduct?.image_url || '/images/placeholder.jpg';
                    };
                } else {
                    // Use variation product image or current product image as fallback
                    img.src = variationProduct?.image_url || currentProduct?.image_url || '/images/placeholder.jpg';
                    img.onerror = function () {
                        this.src = currentProduct?.image_url || '/images/placeholder.jpg';
                    };
                }

                swatch.appendChild(img);
                options.appendChild(swatch);
            });
        } else if (displayType === 'color_swatch' || displayType === 'color') {
            // Regular color swatches - smaller (for non-color attributes with color display type)
            values.forEach((valueObj, valueIndex) => {
                const value = valueObj.value || valueObj;
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch-detail'; // Don't auto-select, will be set by autoSelectVariationsFromProduct
                swatch.style.backgroundColor = getColorValue(value);
                swatch.title = value;
                swatch.dataset.attrId = attribute.id;
                swatch.dataset.value = value;
                swatch.onclick = async () => {
                    options.querySelectorAll('.color-swatch-detail').forEach(item => item.classList.remove('selected'));
                    swatch.classList.add('selected');
                    const variationProduct = findVariationProductByAttributeValue(attribute.id, value);
                    await selectLinkedVariation(attribute.id, value, swatch, variationProduct);
                };
                options.appendChild(swatch);
            });
        } else {
            // Button options (for Storage, RAM, etc.) - smaller
            values.forEach((value, valueIndex) => {
                const option = document.createElement('div');
                option.className = 'variation-option-detail'; // Don't auto-select, will be set by autoSelectVariationsFromProduct
                option.textContent = value;
                option.dataset.attrId = attribute.id;
                option.dataset.value = value;
                option.onclick = async () => {
                    options.querySelectorAll('.variation-option-detail').forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                    const variationProduct = findVariationProductByAttributeValue(attribute.id, value);
                    await selectLinkedVariation(attribute.id, value, option, variationProduct);
                };
                options.appendChild(option);
            });
        }

        content.appendChild(options);
        variationItem.appendChild(content);

        return variationItem;
    }

    // Helper function to create detail row for other attributes
    function createVariationDetailRow(attrData) {
        if (!attrData || !attrData.attribute) return null;

        const attribute = attrData.attribute;
        const values = attrData.values || [];
        const displayType = attrData.display_type || 'button';

        if (values.length === 0) return null;

        const isColorAttribute = (attribute.slug && attribute.slug.toLowerCase() === 'color') ||
            (attribute.name && attribute.name.toLowerCase() === 'color');

        // Set first value as default selection
        selectedVariations[attribute.id] = values[0];

        // Create detail row for each variation
        const detailRow = document.createElement('div');
        detailRow.className = 'detail-row';

        const label = document.createElement('div');
        label.className = 'detail-label';
        label.textContent = attribute.name;

        const content = document.createElement('div');
        content.className = 'detail-content';

        const options = document.createElement('div');
        options.className = 'variation-options-details';

        if (isColorAttribute && displayType === 'color_swatch') {
            // Color image swatches for details section
            values.forEach((value, valueIndex) => {
                const attrId = attribute.id;
                const variationProduct = findVariationProductByAttributeValue(attrId, value);
                const imageUrl = variationProduct ? variationProduct.image_url : (currentProduct?.image_url || '');

                const swatch = document.createElement('div');
                swatch.className = 'color-option-item'; // Don't auto-select, will be set by autoSelectVariationsFromProduct
                swatch.title = value;
                swatch.dataset.attrId = attrId;
                swatch.dataset.value = value;
                swatch.onclick = async () => {
                    // Remove selected from all color options in this row
                    options.querySelectorAll('.color-option-item').forEach(item => item.classList.remove('selected'));
                    swatch.classList.add('selected');
                    await selectLinkedVariation(attrId, value, swatch, variationProduct);
                };

                const img = document.createElement('img');
                img.src = imageUrl || currentProduct?.image_url || '/images/placeholder.jpg';
                img.alt = value;
                img.onerror = function () {
                    this.src = currentProduct?.image_url || '/images/placeholder.jpg';
                };
                swatch.appendChild(img);
                options.appendChild(swatch);
            });

            // Add "more" link if more than 3 colors
            if (values.length > 3) {
                const moreLink = document.createElement('a');
                moreLink.href = '#';
                moreLink.className = 'detail-link';
                moreLink.textContent = `${values.length - 3} more`;
                moreLink.style.marginLeft = '8px';
                moreLink.onclick = (e) => {
                    e.preventDefault();
                    // Show all colors (could implement a modal or expand)
                };
                content.appendChild(moreLink);
            }
        } else if (displayType === 'color_swatch' || displayType === 'color') {
            // Regular color swatches
            values.forEach((value, valueIndex) => {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch-detail'; // Don't auto-select, will be set by autoSelectVariationsFromProduct
                swatch.style.backgroundColor = getColorValue(value);
                swatch.title = value;
                swatch.dataset.attrId = attribute.id;
                swatch.dataset.value = value;
                swatch.onclick = async () => {
                    options.querySelectorAll('.color-swatch-detail').forEach(item => item.classList.remove('selected'));
                    swatch.classList.add('selected');
                    const variationProduct = findVariationProductByAttributeValue(attribute.id, value);
                    await selectLinkedVariation(attribute.id, value, swatch, variationProduct);
                };
                options.appendChild(swatch);
            });
        } else {
            // Button options (for RAM, Storage, etc.)
            values.forEach((value, valueIndex) => {
                const option = document.createElement('div');
                option.className = 'variation-option-detail'; // Don't auto-select, will be set by autoSelectVariationsFromProduct
                option.textContent = value;
                option.dataset.attrId = attribute.id;
                option.dataset.value = value;
                option.onclick = async () => {
                    // Remove selected from all options in this row
                    options.querySelectorAll('.variation-option-detail').forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                    const variationProduct = findVariationProductByAttributeValue(attribute.id, value);
                    await selectLinkedVariation(attribute.id, value, option, variationProduct);
                };
                options.appendChild(option);
            });
        }

        content.appendChild(options);
        detailRow.appendChild(label);
        detailRow.appendChild(content);

        return detailRow;
    }

    // After all variations are displayed, auto-select based on current product
    // This ensures the correct color and RAM are selected based on the current product
    if (currentProduct) {
        // Use requestAnimationFrame for immediate selection after DOM is ready
        requestAnimationFrame(() => {
            autoSelectVariationsFromProduct(currentProduct);
        });
    }
}

// Find variation product by attribute value
function findVariationProductByAttributeValue(attrId, value) {
    if (!linkedVariationsProducts || linkedVariationsProducts.length === 0) return null;

    return linkedVariationsProducts.find(product => {
        if (!product.attribute_values) return false;

        // Check both numeric and string attribute IDs
        const attrValue = product.attribute_values[attrId] || product.attribute_values[String(attrId)];

        // Also check if value matches (case-insensitive)
        if (attrValue && typeof attrValue === 'string' && typeof value === 'string') {
            return attrValue.toLowerCase() === value.toLowerCase();
        }

        return attrValue === value;
    }) || null;
}

// Select linked variation
async function selectLinkedVariation(attrId, value, element, variationProduct) {

    selectedVariations[attrId] = value;

    // Update UI - find the detail-row containing this element
    const detailRow = element.closest('.detail-row');
    if (detailRow) {
        // Remove selected from all options in this row
        detailRow.querySelectorAll('.variation-option-detail, .color-swatch-detail, .color-option-item')
            .forEach(opt => opt.classList.remove('selected'));
        element.classList.add('selected');
    }

    // Find matching variation product based on all selected variations
    const matchingProduct = findMatchingVariationProduct();

    if (matchingProduct) {
        // Fetch full product details for the matching product
        await loadAndUpdateProductForVariation(matchingProduct);
    } else {
        // If no exact match, try to update with partial match or current selection
        // This handles cases where not all variations are selected yet
        if (variationProduct) {
            await loadAndUpdateProductForVariation(variationProduct);
        } else {
        }
    }
}

// Load full product details and update UI
async function loadAndUpdateProductForVariation(variationProduct) {
    if (!variationProduct) return;

    // Prevent loading different products during initialization to avoid redirect loops
    if (isInitializing && variationProduct.slug) {
        const currentSlug = getProductSlugFromURL();
        if (currentSlug && currentSlug !== variationProduct.slug) {
            // Don't load a different product during initialization
            return;
        }
    }

    // If we have a slug, fetch full product details
    if (variationProduct.slug) {
        // Check if we're already on this product's page
        const currentSlug = getProductSlugFromURL();
        if (currentSlug && currentSlug !== variationProduct.slug) {
            // If we're on a different product page, don't update (user should click to navigate)
            return;
        }

        try {
            const result = await makeApiCall(`/products/${variationProduct.slug}`);

            if (result.success && result.data) {
                // Merge fetched data with variation product
                const fullProductData = { ...variationProduct, ...result.data };

                // Auto-select variations based on fetched product's attributes
                autoSelectVariationsFromProduct(fullProductData);

                // Update product display
                updateProductForVariation(fullProductData);
            } else {
                // Fallback to variation product data if API call fails
                updateProductForVariation(variationProduct);
            }
        } catch (error) {
            // Fallback to variation product data
            updateProductForVariation(variationProduct);
        }
    } else {
        // No slug available, just update with what we have
        updateProductForVariation(variationProduct);
    }
}

// Auto-select variations based on product's attribute values
function autoSelectVariationsFromProduct(product) {
    if (!product) return;

    // Get attribute values from the product
    const attrValues = {};

    // Check simple_attribute_values first
    if (product.simple_attribute_values && product.simple_attribute_values.length > 0) {
        product.simple_attribute_values.forEach(attrVal => {
            const attrId = attrVal.attribute?.id;
            const value = attrVal.display_value || attrVal.value;

            if (attrId && value) {
                attrValues[attrId] = value;
            }
        });
    }

    // Also check attribute_values (from linked variations)
    if (product.attribute_values) {
        Object.assign(attrValues, product.attribute_values);
    }

    // Update selected variations - batch all updates
    if (Object.keys(attrValues).length > 0) {
        // Update all selected variations at once
        Object.assign(selectedVariations, attrValues);

        // Update UI for all attributes in a single pass
        const variationsSection = document.getElementById('variationsDetailsSection');
        if (variationsSection) {
            // Remove all selected classes first
            variationsSection.querySelectorAll('.color-variation-box, .variation-option-detail, .color-swatch-detail, .color-option-item')
                .forEach(opt => opt.classList.remove('selected'));

            // Then select matching options
            Object.keys(attrValues).forEach(attrId => {
                updateVariationSelectionInUI(attrId, attrValues[attrId]);
            });
        }
    }
}

// Update variation selection in UI (optimized for performance)
function updateVariationSelectionInUI(attrId, value) {
    const variationsSection = document.getElementById('variationsDetailsSection');
    if (!variationsSection) return;

    // Find options by data attributes (fastest method)
    const optionsByAttr = variationsSection.querySelectorAll(`[data-attr-id="${attrId}"]`);

    if (optionsByAttr.length === 0) return;

    // Find matching option (optimized loop)
    const valueLower = typeof value === 'string' ? value.toLowerCase().trim() : value;
    let matchingOption = null;

    for (let i = 0; i < optionsByAttr.length; i++) {
        const option = optionsByAttr[i];
        const optionAttrId = option.dataset.attrId;

        if (optionAttrId == attrId) { // Use == for type coercion
            const optionValue = option.dataset.value || option.textContent?.trim() || option.title?.trim() || '';
            const optionValueLower = typeof optionValue === 'string' ? optionValue.toLowerCase().trim() : optionValue;

            if (optionValueLower === valueLower || optionValue === value) {
                matchingOption = option;
                break; // Found match, exit early
            }
        }
    }

    if (matchingOption) {
        // Remove selected from all options with this attribute ID
        // For color-variation-box, find parent container
        if (matchingOption.classList.contains('color-variation-box')) {
            const variationItem = matchingOption.closest('.variation-item') || matchingOption.closest('.variation-row-top');
            if (variationItem) {
                variationItem.querySelectorAll('.color-variation-box').forEach(box => box.classList.remove('selected'));
            } else {
                // Fallback: remove from all color boxes with this attrId
                optionsByAttr.forEach(opt => {
                    if (opt.classList.contains('color-variation-box')) {
                        opt.classList.remove('selected');
                    }
                });
            }
        } else {
            // For other options, find the detail-row or variation-item
            const detailRow = matchingOption.closest('.detail-row') || matchingOption.closest('.variation-item');
            if (detailRow) {
                detailRow.querySelectorAll('.variation-option-detail, .color-swatch-detail, .color-option-item')
                    .forEach(opt => opt.classList.remove('selected'));
            } else {
                // Fallback: remove from all options with this attrId
                optionsByAttr.forEach(opt => opt.classList.remove('selected'));
            }
        }

        // Add selected class to matching option
        matchingOption.classList.add('selected');
    }
}

// Find matching variation product
function findMatchingVariationProduct() {
    if (!linkedVariationsProducts || linkedVariationsProducts.length === 0) return null;

    // If no variations selected, return null
    if (Object.keys(selectedVariations).length === 0) return null;

    return linkedVariationsProducts.find(product => {
        if (!product.attribute_values) return false;

        // Check if all selected variations match this product
        for (const [attrId, value] of Object.entries(selectedVariations)) {
            const productValue = product.attribute_values[attrId] || product.attribute_values[String(attrId)];

            // Case-insensitive string comparison
            if (productValue && typeof productValue === 'string' && typeof value === 'string') {
                if (productValue.toLowerCase() !== value.toLowerCase()) {
                    return false;
                }
            } else if (productValue !== value) {
                return false;
            }
        }
        return true;
    }) || null;
}

// Update product for variation
function updateProductForVariation(variationProduct) {
    if (!variationProduct) {
        return;
    }


    // Update price
    const currentPriceEl = document.getElementById('currentPrice');
    const originalPriceEl = document.getElementById('originalPrice');
    const discountBadgeEl = document.getElementById('discountBadge');
    const priceWithoutExchangeEl = document.getElementById('priceWithoutExchange');

    if (variationProduct.price) {
        const currentPrice = parseFloat(variationProduct.price) || 0;
        const originalPrice = parseFloat(variationProduct.original_price || variationProduct.price) || 0;
        const discount = originalPrice > currentPrice
            ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
            : 0;

        if (currentPriceEl) {
            currentPriceEl.textContent = formatPrice(currentPrice);
        }

        if (originalPrice > currentPrice) {
            if (originalPriceEl) {
                originalPriceEl.textContent = formatPrice(originalPrice);
                originalPriceEl.style.display = 'block';
            }
            if (discountBadgeEl) {
                discountBadgeEl.textContent = `${discount}% off`;
                discountBadgeEl.style.display = 'inline-block';
            }
        } else {
            if (originalPriceEl) originalPriceEl.style.display = 'none';
            if (discountBadgeEl) discountBadgeEl.style.display = 'none';
        }

        if (priceWithoutExchangeEl) {
            priceWithoutExchangeEl.textContent = formatPrice(currentPrice);
        }
    }

    // Update image
    if (variationProduct.image_url) {
        productImages[0] = variationProduct.image_url;
        const mainImage = document.getElementById('mainProductImage');
        if (mainImage) {
            mainImage.src = variationProduct.image_url;
            currentImageIndex = 0;

            // Update active thumbnail
            document.querySelectorAll('.thumbnail-item').forEach((thumb, i) => {
                thumb.classList.toggle('active', i === 0);
            });
        }
    }

    // Update title if needed - intelligently merge base name with variation suffix
    const productTitleEl = document.getElementById('productTitle');
    if (variationProduct.name && productTitleEl) {
        let fullName = variationProduct.name;
        // If the variation name starts with "(" and we have a base name, it's a suffix.
        // Also check if the base name is already in the variation name to avoid duplicates.
        if (currentProduct && currentProduct.name) {
            const baseName = currentProduct.name.trim();
            if (fullName.startsWith('(') && !fullName.includes(baseName)) {
                fullName = `${baseName} ${fullName}`;
            }
        }
        productTitleEl.textContent = fullName;
    }

    // Update description if available
    if (variationProduct.description) {
        const descriptionText = document.getElementById('productDescriptionText');
        if (descriptionText) {
            descriptionText.textContent = variationProduct.description;
        }
    }

    // Update highlights if simple_attribute_values are available
    if (variationProduct.simple_attribute_values && variationProduct.simple_attribute_values.length > 0) {
        const highlightsList = document.getElementById('highlightsList');
        if (highlightsList) {
            highlightsList.innerHTML = '';

            let highlights = [];

            // First, try to get highlights directly from API response
            if (variationProduct.highlights && Array.isArray(variationProduct.highlights) && variationProduct.highlights.length > 0) {
                // Handle array of objects with 'text' property: [{text: "..."}, {text: "..."}]
                highlights = variationProduct.highlights.map(h => {
                    // If it's an object with text property, extract the text
                    if (h && typeof h === 'object' && h.text) {
                        return h.text;
                    }
                    // If it's already a string, use it directly
                    if (typeof h === 'string') {
                        return h;
                    }
                    return '';
                }).filter(h => h && h.trim && h.trim().length > 0);
            } else if (variationProduct.highlights && typeof variationProduct.highlights === 'string') {
                // If highlights is a string, try to parse it as JSON or split by newlines
                try {
                    const parsed = JSON.parse(variationProduct.highlights);
                    if (Array.isArray(parsed)) {
                        highlights = parsed.map(h => {
                            // If it's an object with text property, extract the text
                            if (h && typeof h === 'object' && h.text) {
                                return h.text;
                            }
                            // If it's already a string, use it directly
                            if (typeof h === 'string') {
                                return h;
                            }
                            return '';
                        }).filter(h => h && h.trim && h.trim().length > 0);
                    } else {
                        highlights = [variationProduct.highlights];
                    }
                } catch (e) {
                    highlights = variationProduct.highlights.split('\n').filter(h => h.trim());
                }
            } else if (variationProduct.simple_attribute_values) {
                // Fallback: Get highlights from product attributes
                const storage = variationProduct.simple_attribute_values.find(attr =>
                    attr.attribute?.slug === 'storage' || attr.attribute?.name?.toLowerCase().includes('storage')
                );
                if (storage) {
                    highlights.push(`${storage.display_value || storage.value} ROM`);
                }

                const display = variationProduct.simple_attribute_values.find(attr =>
                    attr.attribute?.slug === 'display' || attr.attribute?.name?.toLowerCase().includes('display')
                );
                if (display) {
                    highlights.push(display.display_value || display.value);
                }

                const camera = variationProduct.simple_attribute_values.find(attr =>
                    attr.attribute?.slug === 'camera' || attr.attribute?.name?.toLowerCase().includes('camera')
                );
                if (camera) {
                    highlights.push(camera.display_value || camera.value);
                }

                const processor = variationProduct.simple_attribute_values.find(attr =>
                    attr.attribute?.slug === 'processor' || attr.attribute?.name?.toLowerCase().includes('processor')
                );
                if (processor) {
                    highlights.push(`${processor.display_value || processor.value} Processor`);
                }
            }

            // If still no highlights found, add defaults
            if (highlights.length === 0) {
                highlights.push('Premium Quality');
                highlights.push('Fast Delivery');
                highlights.push('Secure Payment');
            }

            highlights.forEach(highlight => {
                const li = document.createElement('li');
                li.textContent = highlight;
                highlightsList.appendChild(li);
            });
        }

        // Update payment options for variation
        const paymentOptionsList = document.querySelector('.payment-options-list');
        if (paymentOptionsList) {
            paymentOptionsList.innerHTML = '';

            let paymentOptions = [];

            // First, try to get payment options from API response (check both easy_payment_options and payment_options)
            const apiPaymentOptions = variationProduct.easy_payment_options || variationProduct.payment_options;

            if (apiPaymentOptions && Array.isArray(apiPaymentOptions) && apiPaymentOptions.length > 0) {
                // Extract text from array of objects: [{text: "..."}, {text: "..."}]
                paymentOptions = apiPaymentOptions.map(opt => {
                    // If it's an object with text property, extract the text
                    if (opt && typeof opt === 'object' && opt.text) {
                        return opt.text;
                    }
                    // If it's already a string, use it directly
                    if (typeof opt === 'string') {
                        return opt;
                    }
                    return '';
                }).filter(opt => opt && opt.trim && opt.trim().length > 0);
            } else if (apiPaymentOptions && typeof apiPaymentOptions === 'string') {
                // If payment_options is a string, try to parse it as JSON or split by newlines
                try {
                    const parsed = JSON.parse(apiPaymentOptions);
                    if (Array.isArray(parsed)) {
                        paymentOptions = parsed.map(opt => {
                            // If it's an object with text property, extract the text
                            if (opt && typeof opt === 'object' && opt.text) {
                                return opt.text;
                            }
                            // If it's already a string, use it directly
                            if (typeof opt === 'string') {
                                return opt;
                            }
                            return '';
                        }).filter(opt => opt && opt.trim && opt.trim().length > 0);
                    } else {
                        paymentOptions = [apiPaymentOptions];
                    }
                } catch (e) {
                    paymentOptions = apiPaymentOptions.split('\n').filter(p => p.trim());
                }
            } else {
                // Fallback: Use default payment options
                const price = parseFloat(variationProduct.price) || 0;
                const monthlyEMI = Math.round(price / 12);
                paymentOptions = [
                    `EMI starting from <span id="emiAmount">${formatPrice(monthlyEMI)}</span>/month`,
                    'Cash on Delivery',
                    'Net banking & Credit/ Debit/ ATM card'
                ];
            }

            paymentOptions.forEach(option => {
                const li = document.createElement('li');
                // Check if option contains HTML (like EMI with span)
                if (option.includes('<span')) {
                    li.innerHTML = option;
                } else {
                    li.textContent = option;
                }
                paymentOptionsList.appendChild(li);
            });

            // Update EMI amount if it exists separately
            const emiAmount = document.getElementById('emiAmount');
            if (emiAmount && variationProduct.price) {
                const price = parseFloat(variationProduct.price) || 0;
                const monthlyEMI = Math.round(price / 12);
                emiAmount.textContent = formatPrice(monthlyEMI);
            }
        }
    }

    // Update specifications tab if available
    if (variationProduct.simple_attribute_values && variationProduct.simple_attribute_values.length > 0) {
        displaySpecifications(variationProduct.simple_attribute_values.map(attr => ({
            name: attr.attribute?.name || attr.attribute_name,
            value: attr.display_value || attr.value || attr.attribute_value
        })));

        // Also update specifications in details section
        displaySpecificationsInDetails(variationProduct.simple_attribute_values);
    }

    // Update current product reference to maintain state
    if (currentProduct) {
        currentProduct = { ...currentProduct, ...variationProduct };
    }
}

// Display grouped specifications (new format from API)
function displayGroupedSpecifications(specifications) {
    const specsContainer = document.getElementById('specificationsContainer');
    const specificationsDetailSection = document.getElementById('specificationsDetailSection');

    if (!specsContainer || !specificationsDetailSection) return;

    specsContainer.innerHTML = '';

    if (!specifications || specifications.length === 0) {
        return;
    }

    // Show the specifications section
    specificationsDetailSection.style.display = 'block';

    specifications.forEach((section, sectionIndex) => {
        if (!section.title || !section.rows || section.rows.length === 0) {
            return;
        }

        // Create subsection container
        const subsection = document.createElement('div');
        subsection.className = 'specifications-subsection';

        // Add separator before each subsection except the first
        if (sectionIndex > 0) {
            const separator = document.createElement('div');
            separator.className = 'specifications-separator';
            specsContainer.appendChild(separator);
        }

        // Create subsection title
        const subtitle = document.createElement('h4');
        subtitle.className = 'specifications-subtitle';
        subtitle.textContent = section.title;
        subsection.appendChild(subtitle);

        // Create specifications table
        const specsTable = document.createElement('div');
        specsTable.className = 'specifications-table';
        specsTable.id = `specificationsTable-${sectionIndex}`;

        // Add rows
        section.rows.forEach((row, rowIndex) => {
            const rowElement = document.createElement('div');
            rowElement.className = 'specification-row';

            const label = document.createElement('div');
            label.className = 'specification-label';
            label.textContent = row.label || 'N/A';

            const value = document.createElement('div');
            value.className = 'specification-value';
            value.textContent = row.value || 'N/A';

            rowElement.appendChild(label);
            rowElement.appendChild(value);
            specsTable.appendChild(rowElement);
        });

        subsection.appendChild(specsTable);

        // Add "Read More" link if there are more than 5 rows
        if (section.rows.length > 5) {
            const readMoreLink = document.createElement('a');
            readMoreLink.href = '#';
            readMoreLink.className = 'read-more-link';
            readMoreLink.id = `readMoreSpecs-${sectionIndex}`;
            readMoreLink.textContent = 'Read More';

            // Add click handler
            readMoreLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (specsTable.classList.contains('collapsed')) {
                    specsTable.classList.remove('collapsed');
                    specsTable.classList.add('expanded');
                    readMoreLink.textContent = 'Read Less';
                } else {
                    specsTable.classList.remove('expanded');
                    specsTable.classList.add('collapsed');
                    readMoreLink.textContent = 'Read More';
                }
            });

            // Initially collapse
            specsTable.classList.add('collapsed');
            subsection.appendChild(readMoreLink);
        }

        specsContainer.appendChild(subsection);
    });
}

// Display specifications in details section
function displaySpecificationsInDetails(attributes) {
    const specsTable = document.getElementById('specificationsTable');
    const readMoreLink = document.getElementById('readMoreSpecs');

    if (!specsTable) return;

    specsTable.innerHTML = '';

    if (!attributes || attributes.length === 0) {
        return;
    }

    // Filter out attributes that are already shown in highlights (storage, display, camera, processor)
    const highlightAttributes = ['storage', 'display', 'camera', 'processor', 'ram'];
    const filteredAttributes = attributes.filter(attr => {
        const attrSlug = attr.attribute?.slug?.toLowerCase() || '';
        const attrName = attr.attribute?.name?.toLowerCase() || '';
        return !highlightAttributes.some(highlight =>
            attrSlug.includes(highlight) || attrName.includes(highlight)
        );
    });

    // If no filtered attributes, show all
    const attributesToShow = filteredAttributes.length > 0 ? filteredAttributes : attributes;

    attributesToShow.forEach((attr, index) => {
        const row = document.createElement('div');
        row.className = 'specification-row';

        const label = document.createElement('div');
        label.className = 'specification-label';
        label.textContent = attr.attribute?.name || attr.attribute_name || 'N/A';

        const value = document.createElement('div');
        value.className = 'specification-value';
        value.textContent = attr.display_value || attr.value || attr.attribute_value || 'N/A';

        row.appendChild(label);
        row.appendChild(value);
        specsTable.appendChild(row);
    });

    // Show "Read More" link if there are more than 5 specifications
    if (attributesToShow.length > 5 && readMoreLink) {
        readMoreLink.style.display = 'inline-block';
        specsTable.classList.add('collapsed');

        // Remove existing event listener if any
        const newReadMoreLink = readMoreLink.cloneNode(true);
        readMoreLink.parentNode.replaceChild(newReadMoreLink, readMoreLink);

        newReadMoreLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (specsTable.classList.contains('collapsed')) {
                specsTable.classList.remove('collapsed');
                specsTable.classList.add('expanded');
                newReadMoreLink.textContent = 'Read Less';
            } else {
                specsTable.classList.remove('expanded');
                specsTable.classList.add('collapsed');
                newReadMoreLink.textContent = 'Read More';
            }
        });
    } else if (readMoreLink) {
        readMoreLink.style.display = 'none';
        specsTable.classList.remove('collapsed', 'expanded');
    }
}

// Get color value (simple mapping)
function getColorValue(colorName) {
    const colorMap = {
        'red': '#ff0000',
        'blue': '#0000ff',
        'green': '#00ff00',
        'black': '#000000',
        'white': '#ffffff',
        'yellow': '#ffff00',
        'orange': '#ffa500',
        'purple': '#800080',
        'pink': '#ffc0cb',
        'gray': '#808080',
        'grey': '#808080'
    };

    return colorMap[colorName.toLowerCase()] || '#cccccc';
}

// Load frequently bought together
async function loadFrequentlyBoughtTogether(productId) {
    try {
        const result = await makeApiCall(`/frequently-bought-together/product/${productId}`);

        if (result.success && result.data) {
            allBoughtTogetherProducts = result.data.frequently_bought_together || [];
            boughtTogetherCategories = result.data.categories || [];

            // Display in carousel format (existing)
            displayFrequentlyBoughtWithCategories(allBoughtTogetherProducts, boughtTogetherCategories);

            // Display in "Buy together and save" format (new)
            displayBuyTogetherSection(allBoughtTogetherProducts);
        }
    } catch (error) {
    }
}

// Display frequently bought with categories
function displayFrequentlyBoughtWithCategories(products, categories) {
    if (products.length === 0) return;

    document.getElementById('frequentlyBoughtSection').style.display = 'block';

    // Display category tabs
    displayCategoryTabs(categories);

    // Display products
    filterBoughtTogetherProducts('all');
}

// Display category tabs
function displayCategoryTabs(categories) {
    const tabsContainer = document.getElementById('boughtTogetherCategoryTabs');
    tabsContainer.innerHTML = '';

    // All Categories tab
    const allTab = document.createElement('div');
    allTab.className = 'category-tab active';
    allTab.textContent = 'All Categories';
    allTab.dataset.category = 'all';
    allTab.onclick = () => selectBoughtTogetherCategory('all');
    tabsContainer.appendChild(allTab);

    // Individual category tabs
    if (categories && categories.length > 0) {
        categories.forEach(category => {
            const tab = document.createElement('div');
            tab.className = 'category-tab';
            tab.textContent = category.name;
            tab.dataset.category = category.slug;
            tab.onclick = () => selectBoughtTogetherCategory(category.slug);
            tabsContainer.appendChild(tab);
        });
    }
}

// Select bought together category
function selectBoughtTogetherCategory(categorySlug) {
    selectedBoughtTogetherCategory = categorySlug;

    // Update active tab
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === categorySlug);
    });

    filterBoughtTogetherProducts(categorySlug);
}

// Filter bought together products
function filterBoughtTogetherProducts(categorySlug) {
    let filteredProducts = allBoughtTogetherProducts;

    if (categorySlug !== 'all') {
        filteredProducts = allBoughtTogetherProducts.filter(product =>
            product.category && product.category.slug === categorySlug
        );
    }

    // Update carousel
    const carousel = document.getElementById('frequentlyBoughtCarousel');
    carousel.innerHTML = '';

    filteredProducts.forEach(product => {
        carousel.appendChild(createProductCard(product));
    });

    carousel.scrollLeft = 0;
    updateCarouselArrows('frequentlyBoughtCarousel');
}

// Load similar products
async function loadSimilarProducts(categorySlug, currentSlug) {
    try {
        // Use correct endpoint per API documentation: /categories/{slug}/products
        const result = await makeApiCall(`/categories/${categorySlug}/products?page=1&per_page=10`);


        // Handle category products API response structure per documentation
        // Response: { success: true, data: { category: {...}, products: [...], count: number } }
        let products = [];

        if (result && result.success && result.data) {
            // Category products API returns products array in data.products
            if (result.data.products && Array.isArray(result.data.products)) {
                products = result.data.products;
            }
            // Fallback for other response structures
            else if (Array.isArray(result.data)) {
                products = result.data;
            } else if (result.data.data && Array.isArray(result.data.data)) {
                products = result.data.data;
            } else if (result.data.data && result.data.data.products && Array.isArray(result.data.data.products)) {
                products = result.data.data.products;
            }
        }


        if (products && products.length > 0) {
            const filteredProducts = products.filter(p => p.slug !== currentSlug).slice(0, 8);

            if (filteredProducts.length > 0) {
                displaySimilarProducts(filteredProducts);
            } else {
                // Hide section if no similar products
                const section = document.getElementById('similarProductsSection');
                if (section) {
                    section.style.display = 'none';
                }
            }
        } else {
            // Hide section if API call fails or no data
            const section = document.getElementById('similarProductsSection');
            if (section) {
                section.style.display = 'none';
            }
        }
    } catch (error) {
        // Hide section on error
        const section = document.getElementById('similarProductsSection');
        if (section) {
            section.style.display = 'none';
        }
    }
}

// Display similar products
function displaySimilarProducts(products) {
    const section = document.getElementById('similarProductsSection');
    const carousel = document.getElementById('similarProductsCarousel');

    if (!section || !carousel) {
        // If elements don't exist, return early
        return;
    }

    // Only show if we have products
    if (products && products.length > 0) {
        carousel.innerHTML = '';

        products.forEach(product => {
            if (product && product.slug) {
                carousel.appendChild(createProductCard(product));
            }
        });

        // Only show section if we actually added products
        if (carousel.children.length > 0) {
            section.style.display = 'block';
            updateCarouselArrows('similarProductsCarousel');
        } else {
            section.style.display = 'none';
        }
    } else {
        section.style.display = 'none';
    }
}

// Create product card for carousel
function createProductCard(product) {
    const card = document.createElement('a');
    card.href = `/product.html?slug=${product.slug || product.id}`;
    card.className = 'carousel-product-card';



    // Sponsored label (optional, can be based on product data)
    if (product.sponsored) {
        const sponsoredLabel = document.createElement('div');
        sponsoredLabel.className = 'sponsored-label';
        sponsoredLabel.textContent = 'Sponsored';
        card.appendChild(sponsoredLabel);
    }

    // Product image
    const imgContainer = document.createElement('div');
    imgContainer.className = 'carousel-product-image-container';
    const img = document.createElement('img');
    img.src = product.image_url || '/images/placeholder.jpg';
    img.alt = product.name;
    img.className = 'carousel-product-image';
    img.onerror = function () {
        this.src = '/images/placeholder.jpg';
    };
    imgContainer.appendChild(img);
    card.appendChild(imgContainer);

    // Product title with specifications
    const title = document.createElement('div');
    title.className = 'carousel-product-title';
    title.textContent = product.name || 'Product Name';
    card.appendChild(title);

    // Rating
    const ratingValue = parseFloat(product.rating) || 0;
    const reviewsCount = parseInt(product.review_count || product.ratings_count || 0);

    if (ratingValue > 0) {
        const rating = document.createElement('div');
        rating.className = 'carousel-product-rating';

        const stars = document.createElement('span');
        stars.className = 'carousel-rating-stars';
        stars.innerHTML = '★'.repeat(Math.floor(ratingValue)) + '☆'.repeat(5 - Math.floor(ratingValue));
        rating.appendChild(stars);

        const ratingText = document.createElement('span');
        ratingText.className = 'carousel-rating-text';
        ratingText.textContent = `${ratingValue.toFixed(1)} (${reviewsCount.toLocaleString()} reviews)`;
        rating.appendChild(ratingText);

        card.appendChild(rating);
    }

    // Price
    const priceContainer = document.createElement('div');
    priceContainer.className = 'carousel-product-price';

    const currentPrice = parseFloat(product.price) || 0;
    const originalPrice = parseFloat(product.original_price || product.price) || 0;
    const discount = originalPrice > currentPrice
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;

    const priceEl = document.createElement('span');
    priceEl.className = 'carousel-current-price';
    priceEl.textContent = formatPrice(currentPrice);
    priceContainer.appendChild(priceEl);

    if (originalPrice > currentPrice) {
        const originalPriceEl = document.createElement('span');
        originalPriceEl.className = 'carousel-original-price';
        originalPriceEl.textContent = formatPrice(originalPrice);
        priceContainer.appendChild(originalPriceEl);

        if (discount > 0) {
            const discountEl = document.createElement('span');
            discountEl.className = 'carousel-discount';
            discountEl.textContent = `${discount}% off`;
            priceContainer.appendChild(discountEl);
        }
    }

    card.appendChild(priceContainer);

    return card;
}

// Scroll carousel
function scrollCarousel(carouselId, direction) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;

    const scrollAmount = 300;

    if (direction === 'left') {
        carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
        carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }

    setTimeout(() => updateCarouselArrows(carouselId), 300);
}

// Update carousel arrows
function updateCarouselArrows(carouselId) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;

    const wrapper = carousel.closest('.carousel-wrapper');
    if (!wrapper) return;

    const leftArrow = wrapper.querySelector('.carousel-arrow.left');
    const rightArrow = wrapper.querySelector('.carousel-arrow.right');

    if (leftArrow) {
        leftArrow.style.display = carousel.scrollLeft > 0 ? 'flex' : 'none';
    }
    if (rightArrow) {
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        rightArrow.style.display = carousel.scrollLeft < maxScroll - 10 ? 'flex' : 'none';
    }
}

// Switch tab
// switchTab function removed - tabs section removed from product page

// Display specifications
function displaySpecifications(attributes) {
    // Note: productSpecifications container was removed with tabs section
    // Specifications are now displayed in specificationsDetailSection via displaySpecificationsInDetails
    // This function is kept for compatibility but does nothing
    // Specifications are handled by displayGroupedSpecifications and displaySpecificationsInDetails
}

// Display Buy Together and Save section
function displayBuyTogetherSection(addonProducts) {
    const buyTogetherSection = document.getElementById('buyTogetherSection');
    const buyTogetherProducts = document.getElementById('buyTogetherProducts');

    if (!buyTogetherSection || !buyTogetherProducts) return;

    if (!addonProducts || addonProducts.length === 0) {
        buyTogetherSection.style.display = 'none';
        return;
    }

    buyTogetherSection.style.display = 'block';
    buyTogetherProducts.innerHTML = '';

    // Add main product (current product)
    const mainProductItem = createBuyTogetherProductItem(currentProduct, true, false);
    buyTogetherProducts.appendChild(mainProductItem);

    // Add plus sign
    const plusSign = document.createElement('div');
    plusSign.className = 'buy-together-plus';
    plusSign.textContent = '+';
    buyTogetherProducts.appendChild(plusSign);

    // Add add-on products (limit to first 2 for better display)
    const displayProducts = addonProducts.slice(0, 2);
    displayProducts.forEach((product, index) => {
        const addonItem = createBuyTogetherProductItem(product, false, true);
        buyTogetherProducts.appendChild(addonItem);

        // Add plus sign between add-ons
        if (index < displayProducts.length - 1) {
            const plusSign2 = document.createElement('div');
            plusSign2.className = 'buy-together-plus';
            plusSign2.textContent = '+';
            buyTogetherProducts.appendChild(plusSign2);
        }
    });

    // Initialize selected add-ons tracking
    selectedAddOns = [];
    // Initialize total section (empty when no add-ons selected)
    const totalSection = document.getElementById('buyTogetherTotalSection');
    if (totalSection) {
        totalSection.innerHTML = '';
    }
    updateBuyTogetherFooter();
}

// Create buy together product item
function createBuyTogetherProductItem(product, isMain, isAddon) {
    const item = document.createElement('div');
    item.className = `buy-together-product-item ${isMain ? 'main-product' : 'addon-product'}`;

    // Add checkbox for add-on products (positioned absolutely in CSS)
    if (isAddon) {
        const checkbox = document.createElement('div');
        checkbox.className = 'addon-checkbox';
        checkbox.dataset.productId = product.id;
        checkbox.setAttribute('role', 'checkbox');
        checkbox.setAttribute('aria-checked', 'false');
        checkbox.onclick = (e) => {
            e.stopPropagation();
            toggleAddOnProduct(product.id, checkbox, item);
        };
        item.appendChild(checkbox);
    }

    // Product image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'buy-together-product-image-container';
    const image = document.createElement('img');
    image.className = 'buy-together-product-image';
    image.src = product.image_url || '/images/placeholder.jpg';
    image.alt = product.name || 'Product';
    image.onerror = function () {
        this.src = '/images/placeholder.jpg';
    };
    imageContainer.appendChild(image);
    item.appendChild(imageContainer);

    // Content container (Middle)
    const content = document.createElement('div');
    content.className = 'buy-together-content';
    item.appendChild(content);

    // Product name
    const name = document.createElement('div');
    name.className = 'buy-together-product-name';
    name.textContent = product.name || 'Product Name';
    content.appendChild(name);

    // Rating
    if (product.rating || product.ratings_count) {
        const rating = document.createElement('div');
        rating.className = 'buy-together-product-rating';

        const stars = document.createElement('span');
        stars.className = 'buy-together-rating-stars';
        const ratingValue = parseFloat(product.rating) || 0;
        stars.textContent = '★'.repeat(Math.floor(ratingValue)) + '☆'.repeat(5 - Math.floor(ratingValue));
        rating.appendChild(stars);

        const ratingText = document.createElement('span');
        ratingText.className = 'buy-together-rating-text';
        const reviewsCount = parseInt(product.review_count || product.ratings_count || 0);
        ratingText.textContent = `${ratingValue.toFixed(1)} (${reviewsCount.toLocaleString()} reviews)`;
        rating.appendChild(ratingText);

        item.appendChild(rating);
    }

    // Price
    const priceContainer = document.createElement('div');
    priceContainer.className = 'buy-together-product-price';

    const currentPrice = parseFloat(product.price) || 0;
    const originalPrice = parseFloat(product.original_price || product.price) || 0;
    const discount = originalPrice > currentPrice
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;

    const priceEl = document.createElement('span');
    priceEl.className = 'buy-together-current-price';
    priceEl.textContent = formatPrice(currentPrice);
    priceContainer.appendChild(priceEl);

    if (originalPrice > currentPrice) {
        const originalPriceEl = document.createElement('span');
        originalPriceEl.className = 'buy-together-original-price';
        originalPriceEl.textContent = formatPrice(originalPrice);
        priceContainer.appendChild(originalPriceEl);

        if (discount > 0) {
            const discountEl = document.createElement('span');
            discountEl.className = 'buy-together-discount';
            discountEl.textContent = `${discount}% off`;
            priceContainer.appendChild(discountEl);
        }
    }

    content.appendChild(priceContainer);

    // Special price message for add-ons
    if (isAddon) {
        const specialPrice = document.createElement('div');
        specialPrice.className = 'buy-together-special-price';
        specialPrice.textContent = 'Special price if bought with this item';
        content.appendChild(specialPrice);
    }

    // Click handler for add-on products
    if (isAddon) {
        item.onclick = () => {
            const checkbox = item.querySelector('.addon-checkbox');
            if (checkbox) {
                toggleAddOnProduct(product.id, checkbox, item);
            }
        };
    }

    return item;
}

// Track selected add-ons (declared globally above)

// Toggle add-on product selection
function toggleAddOnProduct(productId, checkbox, item) {
    const index = selectedAddOns.findIndex(p => p.id === productId);

    if (index > -1) {
        // Deselect
        selectedAddOns.splice(index, 1);
        checkbox.classList.remove('checked');
        checkbox.setAttribute('aria-checked', 'false');
        item.classList.remove('selected');
    } else {
        // Select
        const product = allBoughtTogetherProducts.find(p => p.id === productId);
        if (product) {
            selectedAddOns.push(product);
            checkbox.classList.add('checked');
            checkbox.setAttribute('aria-checked', 'true');
            item.classList.add('selected');
        }
    }

    updateBuyTogetherFooter();
}

// Update buy together footer (total price and button)
function updateBuyTogetherFooter() {
    const totalSection = document.getElementById('buyTogetherTotalSection');
    const addCartBtn = document.getElementById('buyTogetherAddCartBtn');
    const buttonText = document.getElementById('buyTogetherButtonText');

    if (!totalSection || !addCartBtn) return;

    if (selectedAddOns.length === 0) {
        // Hide total section when no add-ons selected
        totalSection.innerHTML = '';
        if (addCartBtn) {
            addCartBtn.disabled = true;
        }
        if (buttonText) {
            buttonText.textContent = 'ADD TO CART';
        }
    } else {
        // Calculate and display total like Flipkart
        const mainProductPrice = parseFloat(currentProduct?.price || 0);
        let addOnsTotal = 0;

        selectedAddOns.forEach(product => {
            addOnsTotal += parseFloat(product.price || 0);
        });

        const totalPrice = mainProductPrice + addOnsTotal;
        const totalItems = 1 + selectedAddOns.length; // 1 main + add-ons

        // Build total section HTML
        totalSection.innerHTML = `
            <div class="buy-together-total-item">
                <span class="buy-together-total-label">1 Item</span>
                <span class="buy-together-total-price">${formatPrice(mainProductPrice)}</span>
            </div>
            <span class="buy-together-total-plus">+</span>
            <div class="buy-together-total-item">
                <span class="buy-together-total-label">${selectedAddOns.length} Add-on</span>
                <span class="buy-together-total-price">${formatPrice(addOnsTotal)}</span>
            </div>
            <span class="buy-together-total-equals">=</span>
            <div class="buy-together-total-final">
                <span class="buy-together-total-final-label">Total</span>
                <span class="buy-together-total-final-price">${formatPrice(totalPrice)}</span>
            </div>
        `;

        if (addCartBtn) {
            addCartBtn.disabled = false;
        }
        if (buttonText) {
            buttonText.textContent = `ADD ${totalItems} ITEMS TO CART`;
        }
    }
}

// Calculate total savings
function calculateTotalSavings() {
    let totalSavings = 0;

    selectedAddOns.forEach(product => {
        const currentPrice = parseFloat(product.price) || 0;
        const originalPrice = parseFloat(product.original_price || product.price) || 0;
        const discount = originalPrice > currentPrice ? (originalPrice - currentPrice) : 0;
        totalSavings += discount;
    });

    return totalSavings;
}

// Handle buy together add to cart
async function handleBuyTogetherAddToCart() {
    const addCartBtn = document.getElementById('buyTogetherAddCartBtn');

    if (!addCartBtn || addCartBtn.disabled || selectedAddOns.length === 0) {
        return;
    }

    // Check authentication
    if (typeof isAuthenticated === 'undefined' || !isAuthenticated()) {
        window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
        return;
    }

    // Check if CART_API is available
    if (typeof CART_API === 'undefined') {
        showNotification('Cart functionality not available', 'error');
        return;
    }

    // Disable button during operation
    addCartBtn.disabled = true;
    const originalText = addCartBtn.innerHTML;
    addCartBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    try {
        // Add main product and selected add-ons to cart
        const itemsToAdd = [currentProduct, ...selectedAddOns];
        let successCount = 0;
        let failedItems = [];

        // Add each item to cart
        for (const item of itemsToAdd) {
            if (!item || !item.id) {
                failedItems.push(item?.name || 'Unknown item');
                continue;
            }

            const result = await CART_API.addToCart(item.id, 1);

            if (result.success) {
                successCount++;
            } else {
                failedItems.push(item.name || `Product ID: ${item.id}`);
                // If unauthorized, stop and redirect
                if (result.unauthorized) {
                    window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
                    return;
                }
            }
        }

        // Update cart count
        if (successCount > 0) {
            await updateCartCountInHeader();
        }

        // Show appropriate notification
        if (successCount === itemsToAdd.length) {
            showNotification(`Added ${successCount} item(s) to cart!`, 'success', true);
        } else if (successCount > 0) {
            showNotification(`Added ${successCount} item(s) to cart. Failed to add: ${failedItems.join(', ')}`, 'error');
        } else {
            showNotification(`Failed to add items to cart: ${failedItems.join(', ')}`, 'error');
        }

        // Reset selections only if all items were added successfully
        if (successCount === itemsToAdd.length) {
            selectedAddOns = [];
            document.querySelectorAll('.addon-checkbox.checked').forEach(cb => {
                cb.classList.remove('checked');
                cb.closest('.addon-product')?.classList.remove('selected');
            });
            updateBuyTogetherFooter();
        }
    } catch (error) {
        // /* console.error */('Error adding items to cart:', error);
        showNotification('Failed to add items to cart. Please try again.', 'error');
    } finally {
        // Re-enable button (only if we didn't redirect)
        if (addCartBtn) {
            addCartBtn.disabled = false;
            addCartBtn.innerHTML = originalText;
        }
    }
}

// Update quantity
function updateQuantity() {
    const input = document.getElementById('quantityInput');
    if (input) {
        input.value = quantity;
    }
}

// Add to cart
async function addToCart() {
    // Check if authentication functions are available
    if (typeof isAuthenticated === 'undefined') {
        showNotification('Authentication not available. Please refresh the page.', 'error');
        return;
    }

    // Check authentication with better logging
    const token = typeof getAuthToken !== 'undefined' ? getAuthToken() : null;
    const authenticated = isAuthenticated();


    if (!authenticated || !token) {
        window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
        return;
    }

    const productId = currentProduct?.id;
    if (!productId) {
        showNotification('Product not available', 'error');
        return;
    }

    const result = await CART_API.addToCart(productId, quantity);


    if (result.success) {
        await updateCartCountInHeader();
        showNotification('Added to cart!', 'success', true); // Show with "View Cart" button
    } else {
        // If unauthorized, redirect to login
        if (result.unauthorized || result.message?.includes('Unauthenticated') || result.message?.includes('login')) {
            window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
        } else {
            showNotification(result.message || 'Failed to add to cart', 'error');
        }
    }
}

// Buy now
async function buyNow() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
        return;
    }

    const productId = currentProduct?.id;
    if (!productId) {
        showNotification('Product not available', 'error');
        return;
    }

    // Add to cart and redirect to checkout
    const result = await CART_API.addToCart(productId, quantity);

    if (result.success) {
        await updateCartCountInHeader();
        // TODO: Redirect to checkout page
        window.location.href = '/cart.html';
    } else {
        showNotification(result.message || 'Failed to add to cart', 'error');
    }
}

// Check wishlist status
async function checkWishlistStatus(productId) {
    if (typeof isAuthenticated === 'undefined' || !isAuthenticated() || !productId) return;

    try {
        const result = await WISHLIST_API.checkWishlist(productId);
        if (result.success && result.data && result.data.in_wishlist) {
            const wishlistBtn = document.getElementById('wishlistBtn');
            const icon = wishlistBtn?.querySelector('i');
            if (wishlistBtn) {
                wishlistBtn.classList.add('active');
                if (icon) icon.className = 'fas fa-heart';
            }
        }
    } catch (error) {
    }
}

// Show notification
function showNotification(message, type = 'success', showViewCart = false) {
    // Remove any existing notifications first
    const existingNotifications = document.querySelectorAll('.notification, .notification-error, .notification-success, .notification-info');
    existingNotifications.forEach(n => {
        // Clear any pending timeouts
        if (n.dataset.timeoutId) {
            clearTimeout(parseInt(n.dataset.timeoutId));
        }
        if (n.dataset.removeTimeoutId) {
            clearTimeout(parseInt(n.dataset.removeTimeoutId));
        }
        // Force immediate removal
        if (n.parentNode) {
            try {
                n.parentNode.removeChild(n);
            } catch (e) {
                // Try alternative removal methods
                if (n.remove) {
                    n.remove();
                } else {
                    n.style.display = 'none';
                }
            }
        }
    });

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    let notificationContent = message;
    if (showViewCart && type === 'success') {
        notificationContent = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span>${message}</span>
                <a href="/cart.html" style="background: white; color: #388e3c; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-weight: 500; white-space: nowrap;">View Cart</a>
            </div>
        `;
    }

    notification.innerHTML = notificationContent;

    // Add animation styles if not already added
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
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
            .notification {
                position: fixed;
                top: 120px;
                right: 20px;
                color: white;
                padding: 12px 24px;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                z-index: 10001;
                min-width: 200px;
                animation: slideIn 0.3s ease-out;
                transition: opacity 0.3s ease-out, transform 0.3s ease-out;
            }
        `;
        document.head.appendChild(style);
    }

    // Set background color based on type
    const bgColor = type === 'error' ? '#ff6161' : type === 'info' ? '#2874f0' : '#388e3c';
    notification.style.background = bgColor;

    document.body.appendChild(notification);

    // Auto-dismiss after 3 seconds (or 5 seconds for cart notifications)
    const dismissTime = showViewCart ? 5000 : 3000;
    const timeoutId = setTimeout(() => {
        // Add fade-out class and start transition
        notification.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';

        // Force removal after animation completes - use multiple fallbacks
        const removeTimeout = setTimeout(() => {
            // Try multiple removal methods to ensure it's removed
            try {
                if (notification && notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            } catch (e1) {
                try {
                    if (notification && notification.remove) {
                        notification.remove();
                    }
                } catch (e2) {
                    try {
                        if (notification && document.body.contains(notification)) {
                            document.body.removeChild(notification);
                        }
                    } catch (e3) {
                        // Last resort - hide it
                        if (notification) {
                            notification.style.display = 'none';
                        }
                    }
                }
            }
        }, 350); // Slightly longer than animation duration to ensure it completes

        // Store remove timeout ID for cleanup
        notification.dataset.removeTimeoutId = removeTimeout.toString();
    }, dismissTime);

    // Store timeout ID on the element for cleanup
    notification.dataset.timeoutId = timeoutId.toString();

    // Also add a click handler to manually dismiss if user clicks on it
    notification.addEventListener('click', () => {
        clearTimeout(timeoutId);
        if (notification.dataset.removeTimeoutId) {
            clearTimeout(parseInt(notification.dataset.removeTimeoutId));
        }
        notification.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 200);
    });
}

// Format price
function formatPrice(price) {
    // Convert to number if it's a string
    const numPrice = parseFloat(price) || 0;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(numPrice);
}

// API call helper
async function makeApiCall(endpoint, options = {}) {
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

        const response = await fetch(url, config);

        // Check if response is ok before parsing
        if (!response.ok) {
            let errorMessage = `API request failed with status ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // If response is not JSON, use status text
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        // Parse JSON response
        let result;
        try {
            result = await response.json();
        } catch (e) {
            throw new Error('Invalid JSON response from server');
        }

        return result;
    } catch (error) {
        throw error;
    }
}

// Load product reviews and ratings
async function loadProductReviews(productId) {
    try {
        // Fetch reviews from Review API endpoint
        let reviewsData = null;

        try {
            const result = await makeApiCall(`/reviews/product/${currentProduct.slug}?page=1&per_page=10&sort=newest`);
            if (result.success && result.data) {
                reviewsData = result.data;
            }
        } catch (error) {
            // Fallback to product data if API fails
            reviewsData = null;
        }

        // Display ratings and reviews
        displayRatingsAndReviews(reviewsData);
    } catch (error) {
        // Still display ratings from product data
        displayRatingsAndReviews(null);
    }
}

// Display ratings and reviews
function displayRatingsAndReviews(reviewsData) {
    // Get rating data from API response or fallback to product data
    let rating, ratingsCount, reviewsCount, ratingDistribution, categoryRatingsSummary, reviews, reviewImages;

    if (reviewsData) {
        // Use API data structure
        rating = parseFloat(reviewsData.average_rating) || parseFloat(currentProduct.rating) || 0;
        reviewsCount = parseInt(reviewsData.total_reviews || 0, 10);
        ratingsCount = reviewsCount; // In API, ratings and reviews are the same count
        ratingDistribution = reviewsData.rating_distribution || null;
        categoryRatingsSummary = reviewsData.category_ratings_summary || [];
        reviews = reviewsData.reviews || [];

        // Collect review images from all reviews
        reviewImages = [];
        reviews.forEach(review => {
            if (review.photos && Array.isArray(review.photos)) {
                reviewImages.push(...review.photos);
            }
        });

        // Update the main product rating display with review API data if available
        if (rating > 0 || reviewsCount > 0) {
            displayRating(rating, ratingsCount, reviewsCount);
        }
    } else {
        // Fallback to product data
        rating = parseFloat(currentProduct.rating) || 0;
        ratingsCount = parseInt(currentProduct.ratings_count || currentProduct.review_count || 0, 10);
        reviewsCount = parseInt(currentProduct.reviews_count || currentProduct.review_count || 0, 10);
        ratingDistribution = null;
        categoryRatingsSummary = [];
        reviews = [];
        reviewImages = [];
    }

    // Update overall rating summary
    const overallRatingValue = document.getElementById('overallRatingValue');
    const overallRatingText = document.getElementById('overallRatingText');

    if (overallRatingValue) {
        overallRatingValue.textContent = rating > 0 ? rating.toFixed(1) : '0.0';
    }

    if (overallRatingText) {
        const formattedRatings = new Intl.NumberFormat('en-IN').format(ratingsCount);
        const formattedReviews = new Intl.NumberFormat('en-IN').format(reviewsCount);
        overallRatingText.textContent = `${formattedRatings} Ratings & ${formattedReviews} Reviews`;
    }

    // Calculate and display star rating breakdown
    if (ratingDistribution) {
        displayStarBreakdown(ratingDistribution, ratingsCount);
    } else if (ratingsCount > 0) {
        // Generate mock distribution based on rating
        const mockDistribution = generateMockStarDistribution(rating, ratingsCount);
        displayStarBreakdown(mockDistribution, ratingsCount);
    } else {
        // No ratings yet
        displayStarBreakdown({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, 0);
    }

    // Display category ratings from API
    if (categoryRatingsSummary && categoryRatingsSummary.length > 0) {
        displayCategoryRatingsFromAPI(categoryRatingsSummary);
    } else {
        // Hide category ratings section if no data
        const categoryRatingsSection = document.querySelector('.category-ratings');
        if (categoryRatingsSection) {
            categoryRatingsSection.style.display = 'none';
        }
    }

    // Display review images
    if (reviewImages && reviewImages.length > 0) {
        displayReviewImages(reviewImages);
    }

    // Display individual reviews
    if (reviews && reviews.length > 0) {
        displayReviews(reviews);
    } else {
        // Show message if no reviews
        const reviewsList = document.getElementById('reviewsList');
        if (reviewsList) {
            reviewsList.innerHTML = '<div style="text-align: center; padding: 40px; color: #878787;">No reviews yet. Be the first to review this product!</div>';
        }
    }
}

// Generate mock star distribution based on overall rating
function generateMockStarDistribution(rating, totalRatings) {
    // Simple distribution algorithm
    const distribution = {
        5: Math.round(totalRatings * (rating >= 4.5 ? 0.8 : rating >= 4.0 ? 0.6 : rating >= 3.5 ? 0.4 : 0.2)),
        4: Math.round(totalRatings * (rating >= 4.5 ? 0.15 : rating >= 4.0 ? 0.3 : rating >= 3.5 ? 0.4 : 0.3)),
        3: Math.round(totalRatings * (rating >= 3.5 ? 0.03 : rating >= 3.0 ? 0.2 : 0.3)),
        2: Math.round(totalRatings * (rating >= 3.0 ? 0.01 : 0.1)),
        1: Math.round(totalRatings * (rating >= 3.0 ? 0.01 : 0.1))
    };

    // Normalize to total
    const sum = distribution[5] + distribution[4] + distribution[3] + distribution[2] + distribution[1];
    if (sum !== totalRatings) {
        distribution[5] += (totalRatings - sum);
    }

    return distribution;
}

// Display star rating breakdown
function displayStarBreakdown(distribution, totalRatings) {
    for (let star = 5; star >= 1; star--) {
        const count = distribution[star] || 0;
        const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

        const row = document.querySelector(`.star-rating-row[data-star="${star}"]`);
        if (row) {
            const bar = row.querySelector('.star-bar');
            const countEl = row.querySelector('.star-count');

            if (bar) {
                bar.style.width = `${percentage}%`;
            }

            if (countEl) {
                countEl.textContent = new Intl.NumberFormat('en-IN').format(count);
            }
        }
    }
}

// Display category ratings from API (new format with dynamic categories)
function displayCategoryRatingsFromAPI(categoryRatingsSummary) {
    const categoryRatingsContainer = document.querySelector('.category-ratings');
    if (!categoryRatingsContainer) return;

    // Clear existing category ratings
    categoryRatingsContainer.innerHTML = '';

    // Display up to 4 categories (or all if less than 4)
    const displayCategories = categoryRatingsSummary.slice(0, 4);

    displayCategories.forEach(category => {
        const rating = parseFloat(category.average) || 0;
        const categoryName = category.name || 'Unknown';
        const categorySlug = category.slug || '';

        // Create category rating item
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-rating-item';

        const circle = document.createElement('div');
        circle.className = 'category-rating-circle';
        circle.id = `categoryRating${category.rating_category_id}`;

        const valueEl = document.createElement('span');
        valueEl.className = 'category-rating-value';
        valueEl.textContent = rating > 0 ? rating.toFixed(1) : '0.0';

        const labelEl = document.createElement('div');
        labelEl.className = 'category-rating-label';
        labelEl.textContent = categoryName;

        // Set border color based on rating
        const color = rating >= 4.5 ? '#388e3c' : rating >= 4.0 ? '#66bb6a' : rating >= 3.5 ? '#ff9800' : '#f44336';
        circle.style.borderColor = color;

        circle.appendChild(valueEl);
        categoryItem.appendChild(circle);
        categoryItem.appendChild(labelEl);
        categoryRatingsContainer.appendChild(categoryItem);
    });

    // Show the container
    categoryRatingsContainer.style.display = 'flex';
}

// Display category ratings (legacy function for backward compatibility)
function displayCategoryRatings(categoryRatings) {
    const categories = ['camera', 'battery', 'display', 'design'];

    categories.forEach(category => {
        const rating = parseFloat(categoryRatings[category]) || 4.6;
        const circle = document.getElementById(`categoryRating${category.charAt(0).toUpperCase() + category.slice(1)}`);

        if (circle) {
            const valueEl = circle.querySelector('.category-rating-value');
            if (valueEl) {
                valueEl.textContent = rating.toFixed(1);
            }

            // Set border color based on rating
            const color = rating >= 4.5 ? '#388e3c' : rating >= 4.0 ? '#66bb6a' : rating >= 3.5 ? '#ff9800' : '#f44336';
            circle.style.borderColor = color;
        }
    });
}

// Display review images
function displayReviewImages(images) {
    const gallery = document.getElementById('reviewImagesGallery');
    if (!gallery) return;

    gallery.innerHTML = '';

    // Show first 8 images
    const displayImages = images.slice(0, 8);

    displayImages.forEach(imageUrl => {
        const item = document.createElement('div');
        item.className = 'review-image-item';

        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Review image';
        img.onerror = function () {
            this.style.display = 'none';
        };

        item.appendChild(img);
        gallery.appendChild(item);
    });

    // Add "more" indicator if there are more images
    if (images.length > 8) {
        const moreItem = document.createElement('div');
        moreItem.className = 'review-image-item review-image-more';
        moreItem.textContent = `+ ${images.length - 8}`;
        gallery.appendChild(moreItem);
    }
}

// Display individual reviews
function displayReviews(reviews) {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;

    reviewsList.innerHTML = '';

    // Show first 5 reviews
    const displayReviews = reviews.slice(0, 5);

    displayReviews.forEach(review => {
        const reviewItem = createReviewItem(review);
        reviewsList.appendChild(reviewItem);
    });
}

// Create review item
function createReviewItem(review) {
    const item = document.createElement('div');
    item.className = 'review-item';

    // Rating
    const rating = document.createElement('div');
    rating.className = 'review-rating';
    const ratingValue = parseFloat(review.rating) || 5;
    rating.innerHTML = `${'★'.repeat(Math.floor(ratingValue))}${ratingValue % 1 >= 0.5 ? '☆' : ''}`;
    item.appendChild(rating);

    // Category ratings (if available from API)
    if (review.category_ratings && Array.isArray(review.category_ratings) && review.category_ratings.length > 0) {
        const categoryRatingsContainer = document.createElement('div');
        categoryRatingsContainer.className = 'review-category-ratings';
        categoryRatingsContainer.style.display = 'flex';
        categoryRatingsContainer.style.flexWrap = 'wrap';
        categoryRatingsContainer.style.gap = '12px';
        categoryRatingsContainer.style.marginTop = '8px';
        categoryRatingsContainer.style.marginBottom = '8px';

        review.category_ratings.forEach(catRating => {
            const catRatingItem = document.createElement('div');
            catRatingItem.className = 'review-category-rating-item';
            catRatingItem.style.display = 'flex';
            catRatingItem.style.alignItems = 'center';
            catRatingItem.style.gap = '4px';
            catRatingItem.style.fontSize = '12px';
            catRatingItem.style.color = '#878787';

            const catName = document.createElement('span');
            catName.textContent = catRating.name || '';

            const catRatingValue = document.createElement('span');
            catRatingValue.style.fontWeight = '500';
            catRatingValue.style.color = '#212121';
            catRatingValue.textContent = `${catRating.rating}★`;

            catRatingItem.appendChild(catName);
            catRatingItem.appendChild(catRatingValue);
            categoryRatingsContainer.appendChild(catRatingItem);
        });

        item.appendChild(categoryRatingsContainer);
    }

    // Title
    if (review.title) {
        const title = document.createElement('div');
        title.className = 'review-title';
        title.textContent = review.title;
        item.appendChild(title);
    }

    // Body (using review_text from API)
    if (review.review_text || review.body || review.comment) {
        const body = document.createElement('div');
        body.className = 'review-body';
        const reviewText = review.review_text || review.body || review.comment || '';
        // Split by newlines or create paragraphs
        const paragraphs = reviewText.split('\n').filter(p => p.trim());
        paragraphs.forEach(p => {
            const para = document.createElement('p');
            para.textContent = p.trim();
            body.appendChild(para);
        });
        item.appendChild(body);
    }

    // Review photos (if available)
    if (review.photos && Array.isArray(review.photos) && review.photos.length > 0) {
        const photosContainer = document.createElement('div');
        photosContainer.className = 'review-photos';
        photosContainer.style.display = 'flex';
        photosContainer.style.flexWrap = 'wrap';
        photosContainer.style.gap = '8px';
        photosContainer.style.marginTop = '12px';

        review.photos.slice(0, 5).forEach(photoUrl => {
            const photoItem = document.createElement('div');
            photoItem.className = 'review-photo-item';
            photoItem.style.width = '80px';
            photoItem.style.height = '80px';
            photoItem.style.borderRadius = '4px';
            photoItem.style.overflow = 'hidden';
            photoItem.style.cursor = 'pointer';

            const img = document.createElement('img');
            img.src = photoUrl;
            img.alt = 'Review photo';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.onerror = function () {
                this.parentElement.style.display = 'none';
            };

            photoItem.appendChild(img);
            photosContainer.appendChild(photoItem);
        });

        item.appendChild(photosContainer);
    }

    // Reviewer info
    const reviewerInfo = document.createElement('div');
    reviewerInfo.className = 'reviewer-info';

    if (review.user?.avatar || review.avatar) {
        const avatar = document.createElement('img');
        avatar.className = 'reviewer-avatar';
        avatar.src = review.user?.avatar || review.avatar;
        avatar.alt = 'Reviewer';
        avatar.onerror = function () {
            this.style.display = 'none';
        };
        reviewerInfo.appendChild(avatar);
    }

    const reviewerDetails = document.createElement('div');
    reviewerDetails.style.display = 'flex';
    reviewerDetails.style.alignItems = 'center';
    reviewerDetails.style.gap = '8px';
    reviewerDetails.style.flexWrap = 'wrap';

    // Use customer_name from API
    if (review.customer_name || review.user?.name || review.reviewer_name) {
        const name = document.createElement('span');
        name.className = 'reviewer-name';
        name.textContent = review.customer_name || review.user?.name || review.reviewer_name;
        reviewerDetails.appendChild(name);
    }

    if (review.certified_buyer) {
        const badge = document.createElement('span');
        badge.className = 'reviewer-badge';
        badge.innerHTML = '✓ Certified Buyer';
        reviewerDetails.appendChild(badge);
    }

    if (review.user?.location || review.location) {
        const location = document.createElement('span');
        location.className = 'reviewer-location';
        location.textContent = review.user?.location || review.location;
        reviewerDetails.appendChild(location);
    }

    // Format date from API (created_at)
    if (review.created_at || review.date) {
        const date = document.createElement('span');
        date.className = 'review-date';
        const reviewDate = new Date(review.created_at || review.date);
        const now = new Date();
        const diffTime = Math.abs(now - reviewDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        let dateText = '';
        if (diffDays === 0) {
            dateText = 'Just now';
        } else if (diffDays === 1) {
            dateText = '1 day ago';
        } else if (diffDays < 30) {
            dateText = `${diffDays} days ago`;
        } else if (diffMonths === 1) {
            dateText = '1 month ago';
        } else if (diffMonths < 12) {
            dateText = `${diffMonths} months ago`;
        } else if (diffYears === 1) {
            dateText = '1 year ago';
        } else {
            dateText = `${diffYears} years ago`;
        }

        date.textContent = dateText;
        reviewerDetails.appendChild(date);
    }

    reviewerInfo.appendChild(reviewerDetails);
    item.appendChild(reviewerInfo);

    // Helpfulness
    if (review.helpful_count !== undefined || review.not_helpful_count !== undefined) {
        const helpfulness = document.createElement('div');
        helpfulness.className = 'review-helpfulness';

        const helpfulBtn = document.createElement('button');
        helpfulBtn.className = 'helpfulness-btn';
        helpfulBtn.innerHTML = '👍 <span class="helpfulness-count">' + (review.helpful_count || 0) + '</span>';
        helpfulness.appendChild(helpfulBtn);

        const notHelpfulBtn = document.createElement('button');
        notHelpfulBtn.className = 'helpfulness-btn';
        notHelpfulBtn.innerHTML = '👎 <span class="helpfulness-count">' + (review.not_helpful_count || 0) + '</span>';
        helpfulness.appendChild(notHelpfulBtn);

        item.appendChild(helpfulness);
    }

    return item;
}

// Load product questions and answers
async function loadProductQuestions(productId) {
    try {
        // Try to fetch Q&A from API endpoint
        let qaData = null;

        try {
            const result = await makeApiCall(`/products/${currentProduct.slug}/questions`);
            if (result.success && result.data) {
                qaData = result.data;
            }
        } catch (error) {
        }

        // Display questions and answers
        displayQuestionsAndAnswers(qaData);
    } catch (error) {
        // Still display with mock data or empty state
        displayQuestionsAndAnswers(null);
    }
}

// Display questions and answers
function displayQuestionsAndAnswers(qaData) {
    const qaList = document.getElementById('qaList');
    if (!qaList) return;

    qaList.innerHTML = '';

    // Handle different data structures
    let questions = [];

    if (qaData) {
        // Check if qaData is an array directly (from product.qna)
        if (Array.isArray(qaData)) {
            questions = qaData;
        } else if (qaData.questions && Array.isArray(qaData.questions)) {
            questions = qaData.questions;
        } else if (qaData.data && Array.isArray(qaData.data)) {
            questions = qaData.data;
        }
    }

    if (questions.length === 0) {
        qaList.innerHTML = '<div style="text-align: center; padding: 40px; color: #878787;">No questions yet. Be the first to ask a question!</div>';
        return;
    }

    // Display first 3 questions
    const displayQuestions = questions.slice(0, 3);

    displayQuestions.forEach(qa => {
        const qaItem = createQAItem(qa);
        qaList.appendChild(qaItem);
    });
}

// Create Q&A item
function createQAItem(qa) {
    const item = document.createElement('div');
    item.className = 'qa-item';

    // Question
    const question = document.createElement('div');
    question.className = 'qa-question';

    const questionLabel = document.createElement('span');
    questionLabel.className = 'qa-question-label';
    questionLabel.textContent = 'Q:';
    question.appendChild(questionLabel);

    const questionText = document.createElement('span');
    questionText.className = 'qa-question-text';
    questionText.textContent = qa.question || qa.question_text || 'No question text';
    question.appendChild(questionText);

    item.appendChild(question);

    // Answer
    if (qa.answer || qa.answer_text) {
        const answer = document.createElement('div');
        answer.className = 'qa-answer';

        const answerLabel = document.createElement('span');
        answerLabel.className = 'qa-answer-label';
        answerLabel.textContent = 'A:';
        answer.appendChild(answerLabel);

        const answerText = document.createElement('span');
        answerText.className = 'qa-answer-text';
        answerText.textContent = qa.answer || qa.answer_text;
        answer.appendChild(answerText);

        item.appendChild(answer);

        // Answerer info
        const answererInfo = document.createElement('div');
        answererInfo.className = 'qa-answerer-info';

        const answererName = document.createElement('span');
        answererName.className = 'qa-answerer-name';
        answererName.textContent = qa.answerer?.name || qa.answerer_name || 'Anonymous';
        answererInfo.appendChild(answererName);

        if (qa.answerer?.certified_buyer || qa.certified_buyer) {
            const badge = document.createElement('span');
            badge.className = 'qa-certified-badge';
            badge.innerHTML = '<i class="fas fa-check-circle"></i> Certified Buyer';
            answererInfo.appendChild(badge);
        }

        item.appendChild(answererInfo);

        // Helpfulness
        if (qa.helpful_count !== undefined || qa.not_helpful_count !== undefined) {
            const helpfulness = document.createElement('div');
            helpfulness.className = 'qa-helpfulness';

            const helpfulBtn = document.createElement('button');
            helpfulBtn.className = 'qa-helpfulness-btn';
            helpfulBtn.innerHTML = '👍 <span class="qa-helpfulness-count">' + (qa.helpful_count || 0) + '</span>';
            helpfulness.appendChild(helpfulBtn);

            const notHelpfulBtn = document.createElement('button');
            notHelpfulBtn.className = 'qa-helpfulness-btn';
            notHelpfulBtn.innerHTML = '👎 <span class="qa-helpfulness-count">' + (qa.not_helpful_count || 0) + '</span>';
            helpfulness.appendChild(notHelpfulBtn);

            const expandBtn = document.createElement('button');
            expandBtn.className = 'qa-helpfulness-btn';
            expandBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            expandBtn.style.marginLeft = '8px';
            helpfulness.appendChild(expandBtn);

            item.appendChild(helpfulness);
        }
    } else {
        // No answer yet
        const noAnswer = document.createElement('div');
        noAnswer.className = 'qa-answer';
        noAnswer.style.marginLeft = '28px';
        noAnswer.style.color = '#878787';
        noAnswer.style.fontStyle = 'italic';
        noAnswer.textContent = 'No answer yet. Be the first to answer!';
        item.appendChild(noAnswer);
    }

    return item;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Display Bank Offers
function displayBankOffers(bankOffers) {
    const offersList = document.getElementById('offersList');
    if (!offersList) return;

    offersList.innerHTML = '';

    if (!bankOffers || bankOffers.length === 0) {
        offersList.innerHTML = '<li class="offer-item">No offers available</li>';
        return;
    }

    // Display first 4 offers
    const displayOffers = bankOffers.slice(0, 4);

    displayOffers.forEach(offer => {
        const offerItem = document.createElement('li');
        offerItem.className = 'offer-item';

        // Create Bank Offer label (bold)
        const labelSpan = document.createElement('span');
        labelSpan.className = 'offer-label';
        if (offer.bank_name) {
            labelSpan.textContent = 'Bank Offer';
        } else {
            labelSpan.textContent = 'Special Offer';
        }

        // Create offer title text (normal weight, not bold)
        const titleSpan = document.createElement('span');
        titleSpan.className = 'offer-title-text';
        if (offer.offer_title) {
            titleSpan.textContent = ' ' + offer.offer_title;
        } else if (offer.formatted_offer) {
            titleSpan.textContent = ' ' + offer.formatted_offer;
        } else if (offer.offer_description) {
            titleSpan.textContent = ' ' + offer.offer_description;
        }

        // Add T&C link with click handler
        const tcLink = document.createElement('a');
        tcLink.href = '#';
        tcLink.className = 'offer-tc';
        tcLink.textContent = 'T&C';
        tcLink.onclick = (e) => {
            e.preventDefault();
            openTermsConditionsModal(offer);
        };

        // Append all elements
        offerItem.appendChild(labelSpan);
        offerItem.appendChild(titleSpan);
        offerItem.appendChild(document.createTextNode(' '));
        offerItem.appendChild(tcLink);

        offersList.appendChild(offerItem);
    });

    // Add "View more offers" link if there are more than 4 offers
    if (bankOffers.length > 4) {
        const viewMoreItem = document.createElement('li');
        viewMoreItem.className = 'offer-item view-more-offers';
        viewMoreItem.innerHTML = `<a href="#" id="viewMoreOffers">View ${bankOffers.length - 4} more offers</a>`;
        offersList.appendChild(viewMoreItem);
    }
}

// Open Terms & Conditions Modal
function openTermsConditionsModal(offer) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('termsConditionsModal');
    if (!modal) {
        modal = createTermsConditionsModal();
        document.body.appendChild(modal);
    }

    // Populate modal content
    const modalContent = modal.querySelector('.tc-modal-content');
    if (modalContent) {
        let html = '';

        // Header with offer title
        html += `<div class="tc-modal-header">`;
        html += `<h2>Terms & Conditions</h2>`;
        if (offer.offer_title) {
            html += `<p class="tc-offer-title">${escapeHtml(offer.offer_title)}</p>`;
        }
        html += `</div>`;

        // Terms and conditions content
        if (offer.terms_conditions) {
            // Convert line breaks to HTML
            const termsText = escapeHtml(offer.terms_conditions)
                .replace(/\r\n/g, '<br>')
                .replace(/\n/g, '<br>')
                .replace(/\r/g, '<br>');

            html += `<div class="tc-modal-section">`;
            html += `<div class="tc-content">${termsText}</div>`;
            html += `</div>`;
        } else {
            html += `<div class="tc-modal-section">`;
            html += `<p class="tc-no-content">No terms and conditions available for this offer.</p>`;
            html += `</div>`;
        }

        modalContent.innerHTML = html;
    }

    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Create Terms & Conditions Modal
function createTermsConditionsModal() {
    const modal = document.createElement('div');
    modal.id = 'termsConditionsModal';
    modal.className = 'tc-modal';

    modal.innerHTML = `
        <div class="tc-modal-overlay"></div>
        <div class="tc-modal-container">
            <div class="tc-modal-header-bar">
                <h2>Terms & Conditions</h2>
                <button class="tc-modal-close" onclick="closeTermsConditionsModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="tc-modal-content">
                <!-- Content will be populated dynamically -->
            </div>
        </div>
    `;

    // Close on overlay click
    modal.querySelector('.tc-modal-overlay').addEventListener('click', closeTermsConditionsModal);

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeTermsConditionsModal();
        }
    });

    return modal;
}

// Close Terms & Conditions Modal
function closeTermsConditionsModal() {
    const modal = document.getElementById('termsConditionsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Make closeTermsConditionsModal globally accessible
window.closeTermsConditionsModal = closeTermsConditionsModal;

// Display Long Description (Product Description Section) - Flipkart Style
function displayLongDescription(longDescription) {
    const productDescriptionSection = document.getElementById('productDescriptionSection');
    const productDescriptionContent = document.getElementById('productDescriptionContent');

    if (!productDescriptionSection || !productDescriptionContent) return;

    if (longDescription) {
        // Check if longDescription is a JSON string or already parsed
        let descriptionData = longDescription;

        // Try to parse if it's a string
        if (typeof longDescription === 'string') {
            try {
                // Check if it's JSON array format
                if (longDescription.trim().startsWith('[') || longDescription.trim().startsWith('{')) {
                    descriptionData = JSON.parse(longDescription);
                } else {
                    // It's HTML, use as-is
                    productDescriptionContent.innerHTML = longDescription;
                    productDescriptionSection.style.display = 'block';
                    return;
                }
            } catch (e) {
                // Not JSON, treat as HTML
                productDescriptionContent.innerHTML = longDescription;
                productDescriptionSection.style.display = 'block';
                return;
            }
        }

        // Handle JSON array format with image_url, heading, short_text
        if (Array.isArray(descriptionData) && descriptionData.length > 0) {
            productDescriptionContent.innerHTML = '';

            descriptionData.forEach((item, index) => {
                // Create feature block
                const featureBlock = document.createElement('div');
                featureBlock.className = 'product-description-feature-block';
                featureBlock.style.display = 'flex';
                featureBlock.style.alignItems = 'center';
                featureBlock.style.gap = '40px';
                featureBlock.style.flexWrap = 'nowrap';
                featureBlock.style.marginBottom = '80px';
                featureBlock.style.maxWidth = '100%';

                // Alternate layout: even blocks (0-indexed) have image on left
                // Use CSS order property instead of row-reverse to keep text aligned
                // CSS will handle the ordering via nth-child selectors

                // Text section - Wider but fits with image on same line (70-75% width) - Flipkart Style
                const textWrapper = document.createElement('div');
                textWrapper.className = 'product-description-feature-text';
                textWrapper.style.flex = '3';
                textWrapper.style.minWidth = '450px';
                textWrapper.style.maxWidth = '75%';
                textWrapper.style.paddingRight = '0';
                textWrapper.style.paddingLeft = '0';

                // Heading
                if (item.heading) {
                    const heading = document.createElement('h2');
                    heading.className = 'product-description-feature-heading';
                    heading.textContent = item.heading;
                    textWrapper.appendChild(heading);
                }

                // Short text
                if (item.short_text) {
                    const paragraph = document.createElement('p');
                    paragraph.className = 'product-description-feature-paragraph';
                    paragraph.textContent = item.short_text;
                    textWrapper.appendChild(paragraph);
                }

                // Image section - Smaller but fits on same line (20-25% width) - Flipkart Style
                const imageWrapper = document.createElement('div');
                imageWrapper.className = 'product-description-feature-image';
                imageWrapper.style.flex = '0.8';
                imageWrapper.style.minWidth = '200px';
                imageWrapper.style.maxWidth = '25%';
                imageWrapper.style.display = 'flex';
                imageWrapper.style.alignItems = 'center';
                imageWrapper.style.justifyContent = 'center';
                imageWrapper.style.paddingLeft = '0';
                imageWrapper.style.paddingRight = '0';
                imageWrapper.style.flexShrink = '0';

                if (item.image_url) {
                    const imageDiv = document.createElement('div');
                    imageDiv.className = 'product-description-image-wrapper';
                    const img = document.createElement('img');
                    img.src = item.image_url;
                    img.alt = item.heading || 'Product feature';
                    img.style.width = '167px';
                    img.style.height = '125px';
                    img.style.display = 'block';
                    img.style.borderRadius = '8px';
                    img.style.objectFit = 'contain';
                    img.onerror = function () {
                        this.style.display = 'none';
                    };
                    imageDiv.appendChild(img);
                    imageWrapper.appendChild(imageDiv);
                }

                // Add sections to feature block
                featureBlock.appendChild(textWrapper);
                if (item.image_url) {
                    featureBlock.appendChild(imageWrapper);
                }

                productDescriptionContent.appendChild(featureBlock);
            });

            productDescriptionSection.style.display = 'block';
        } else if (typeof descriptionData === 'object' && descriptionData !== null) {
            // Single object format
            const featureBlock = document.createElement('div');
            featureBlock.className = 'product-description-feature-block';
            featureBlock.style.display = 'flex';
            featureBlock.style.alignItems = 'center';
            featureBlock.style.gap = '40px';
            featureBlock.style.flexWrap = 'nowrap';
            featureBlock.style.marginBottom = '80px';
            featureBlock.style.maxWidth = '100%';

            const textWrapper = document.createElement('div');
            textWrapper.className = 'product-description-feature-text';
            textWrapper.style.flex = '3';
            textWrapper.style.minWidth = '450px';
            textWrapper.style.maxWidth = '75%';
            textWrapper.style.paddingRight = '0';
            textWrapper.style.paddingLeft = '0';

            if (descriptionData.heading) {
                const heading = document.createElement('h2');
                heading.className = 'product-description-feature-heading';
                heading.textContent = descriptionData.heading;
                textWrapper.appendChild(heading);
            }

            if (descriptionData.short_text) {
                const paragraph = document.createElement('p');
                paragraph.className = 'product-description-feature-paragraph';
                paragraph.textContent = descriptionData.short_text;
                textWrapper.appendChild(paragraph);
            }

            featureBlock.appendChild(textWrapper);

            if (descriptionData.image_url) {
                const imageWrapper = document.createElement('div');
                imageWrapper.className = 'product-description-feature-image';
                imageWrapper.style.flex = '0.8';
                imageWrapper.style.minWidth = '200px';
                imageWrapper.style.maxWidth = '25%';
                imageWrapper.style.display = 'flex';
                imageWrapper.style.alignItems = 'center';
                imageWrapper.style.justifyContent = 'center';
                imageWrapper.style.paddingLeft = '0';
                imageWrapper.style.paddingRight = '0';
                imageWrapper.style.flexShrink = '0';

                const imageDiv = document.createElement('div');
                imageDiv.className = 'product-description-image-wrapper';
                const img = document.createElement('img');
                img.src = descriptionData.image_url;
                img.alt = descriptionData.heading || 'Product feature';
                img.style.width = '167px';
                img.style.height = '125px';
                img.style.display = 'block';
                img.style.borderRadius = '8px';
                img.style.objectFit = 'contain';
                imageDiv.appendChild(img);
                imageWrapper.appendChild(imageDiv);
                featureBlock.appendChild(imageWrapper);
            }

            productDescriptionContent.appendChild(featureBlock);
            productDescriptionSection.style.display = 'block';
        } else {
            // Fallback: treat as HTML string
            productDescriptionContent.innerHTML = longDescription;
            productDescriptionSection.style.display = 'block';
        }
    } else {
        productDescriptionSection.style.display = 'none';
    }
}

// Load categories using new Category Index API
async function loadCategories() {
    try {
        const result = await makeApiCall('/categories/index');


        if (result && result.success && result.data) {
            // Use flat array from API response (per API documentation)
            let categoriesArray = [];

            if (result.data.flat && Array.isArray(result.data.flat)) {
                categoriesArray = result.data.flat;
            } else if (result.data.tree && Array.isArray(result.data.tree)) {
                // Flatten tree if flat is not available
                categoriesArray = flattenCategoryTree(result.data.tree);
            } else {
                categoriesArray = [];
            }


            // Store globally for breadcrumb generation
            window.flatCategories = categoriesArray;

            if (categoriesArray.length > 0) {
                // Filter to show only root categories (level 0) or first-level categories in navigation
                // Also filter active categories and sort by sort_order
                const rootCategories = categoriesArray
                    .filter(cat => (cat.is_root === true || cat.level === 0) && cat.is_active !== false)
                    .sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999));

                const categoriesToShow = rootCategories.length > 0
                    ? rootCategories.slice(0, 12)
                    : categoriesArray
                        .filter(cat => cat.is_active !== false)
                        .sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999))
                        .slice(0, 12);

                updateCategoryNavigation(categoriesToShow);
            } else {
                // No categories found - ensure nav-menu still shows "All" button
                const navContainer = document.getElementById('navContainer');
                if (navContainer && navContainer.children.length === 0) {
                    // Let category-nav-common.js handle showing "All" button
                    // Just ensure nav-menu is visible
                    const navMenu = navContainer.closest('.nav-menu');
                    if (navMenu) {
                        navMenu.style.display = 'flex';
                        navMenu.style.visibility = 'visible';
                        navMenu.style.opacity = '1';
                    }
                }
            }
        } else {
            // API returned unsuccessful response - ensure nav-menu is visible
            const navContainer = document.getElementById('navContainer');
            if (navContainer) {
                const navMenu = navContainer.closest('.nav-menu');
                if (navMenu) {
                    navMenu.style.display = 'flex';
                    navMenu.style.visibility = 'visible';
                    navMenu.style.opacity = '1';
                }
            }
        }
    } catch (error) {
        // Silently handle error - don't log to avoid console clutter
        // Ensure nav-menu is visible even on error
        const navContainer = document.getElementById('navContainer');
        if (navContainer) {
            const navMenu = navContainer.closest('.nav-menu');
            if (navMenu) {
                navMenu.style.display = 'flex';
                navMenu.style.visibility = 'visible';
                navMenu.style.opacity = '1';
            }
        }
        // Let category-nav-common.js try to load categories
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

// Build breadcrumb from category slug using parent references
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

        // Find parent using parent_slug
        if (current.parent_slug) {
            current = window.flatCategories.find(cat => cat.slug === current.parent_slug);
        } else if (current.parent && current.parent.slug) {
            current = window.flatCategories.find(cat => cat.slug === current.parent.slug);
        } else {
            current = null;
        }
    }

    return breadcrumb;
}

// Update category navigation
function updateCategoryNavigation(categories) {
    const navContainer = document.getElementById('navContainer');
    if (!navContainer) {
        return;
    }

    // Ensure categories is an array
    if (!Array.isArray(categories)) {
        return;
    }

    navContainer.innerHTML = '';

    const fragment = document.createDocumentFragment();

    // Add "All" button
    const allItem = document.createElement('div');
    allItem.className = 'nav-item';
    allItem.innerHTML = `
        <a href="/" class="nav-link">
            <i class="fas fa-bars"></i>
            <span>All</span>
        </a>
    `;
    fragment.appendChild(allItem);

    // Get current category from URL (if on categories page)
    const urlParams = new URLSearchParams(window.location.search);
    const currentCategorySlug = urlParams.get('category');

    // Add categories with icons and images from API
    if (categories && categories.length > 0) {
        // Filter to root categories only and sort by sort_order
        const rootCategories = categories
            .filter(cat => (cat.is_root === true || cat.level === 0) && cat.is_active !== false)
            .sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999))
            .slice(0, 12);

        rootCategories.forEach(category => {
            // Ensure category has required fields
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
            const linkClass = isActive ? 'nav-link active' : 'nav-link';

            navItem.innerHTML = `
                <a href="/categories.html?category=${encodeURIComponent(category.slug)}" class="${linkClass}" data-category="${category.slug}">
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

// Show loading
function showLoading() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const productContent = document.getElementById('productContent');

    if (loadingSpinner) {
        loadingSpinner.style.display = 'flex';
    }
    if (productContent) {
        productContent.style.display = 'none';
    }
}

// Hide loading
function hideLoading() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const productContent = document.getElementById('productContent');

    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
    if (productContent) {
        productContent.style.display = 'grid';
    }
}

// Show error
function showError(message) {
    const container = document.getElementById('productContainer');
    container.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 40px;">
            <h2>${message}</h2>
            <a href="/" style="color: var(--mobitez-purple);">Go to Homepage</a>
        </div>
    `;
}

// Setup login dropdown with fixed positioning
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

// Review Form Functions
let ratingCategories = [];
let hasUserOrderedProduct = false;

// Check if user has ordered this product
async function checkIfUserOrderedProduct() {
    if (!currentProduct || !currentProduct.id) {
        return false;
    }

    // Check authentication
    if (typeof isAuthenticated === 'undefined' || !isAuthenticated()) {
        return false;
    }

    try {
        // Check if ORDER_API is available
        if (typeof ORDER_API === 'undefined') {
            return false;
        }

        // Fetch user's orders
        const result = await ORDER_API.listOrders({ limit: 100 }); // Get up to 100 orders

        if (result.success && result.data && Array.isArray(result.data)) {
            // Check if any order contains this product
            for (const order of result.data) {
                if (order.items && Array.isArray(order.items)) {
                    for (const item of order.items) {
                        const product = item.product || {};
                        // Check by product ID or slug
                        if (product.id === currentProduct.id ||
                            product.slug === currentProduct.slug ||
                            (item.product_id && item.product_id === currentProduct.id)) {
                            hasUserOrderedProduct = true;
                            return true;
                        }
                    }
                }
            }
        }

        hasUserOrderedProduct = false;
        return false;
    } catch (error) {
        return false;
    }
}

// Show review form modal
async function showReviewForm() {
    // Double-check authentication
    if (typeof isAuthenticated === 'undefined' || !isAuthenticated()) {
        showNotification('Please login to rate and review products', 'error');
        setTimeout(() => {
            window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
        }, 1500);
        return;
    }

    // Double-check if user has ordered
    if (!hasUserOrderedProduct) {
        const hasOrdered = await checkIfUserOrderedProduct();
        if (!hasOrdered) {
            showNotification('You can only review products you have ordered', 'error');
            return;
        }
    }

    if (!currentProduct || !currentProduct.slug) {
        showNotification('Product information not available', 'error');
        return;
    }

    // Load rating categories for this product
    await loadRatingCategories(currentProduct.slug);

    // Create and show modal
    createReviewModal();
}

// Load rating categories for product
async function loadRatingCategories(productSlug) {
    try {
        const result = await makeApiCall(`/reviews/product/${productSlug}/rating-categories`);
        if (result.success && result.data && result.data.rating_categories) {
            ratingCategories = result.data.rating_categories;
        } else {
            ratingCategories = [];
        }
    } catch (error) {
        ratingCategories = [];
    }
}

// Create review modal
function createReviewModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('reviewModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'reviewModal';
    modal.className = 'review-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        padding: 20px;
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'review-modal-content';
    modalContent.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
    `;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'review-modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: none;
        font-size: 28px;
        cursor: pointer;
        color: #878787;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    closeBtn.addEventListener('click', () => modal.remove());

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Rate & Review';
    title.style.cssText = 'margin: 0 0 20px 0; font-size: 20px; color: #212121;';

    // Form
    const form = document.createElement('form');
    form.id = 'reviewForm';
    form.method = 'POST';
    form.action = '#'; // Prevent default form submission
    form.style.cssText = 'display: flex; flex-direction: column; gap: 20px;';

    // Overall Rating
    const overallRatingSection = document.createElement('div');
    overallRatingSection.innerHTML = `
        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #212121;">Overall Rating *</label>
        <div class="star-rating-input" style="display: flex; gap: 8px; font-size: 32px; cursor: pointer;">
            <span data-rating="1" style="color: #ddd;">★</span>
            <span data-rating="2" style="color: #ddd;">★</span>
            <span data-rating="3" style="color: #ddd;">★</span>
            <span data-rating="4" style="color: #ddd;">★</span>
            <span data-rating="5" style="color: #ddd;">★</span>
        </div>
        <input type="hidden" id="overallRating" name="rating" value="0" required>
    `;

    // Star rating interaction
    const starInputs = overallRatingSection.querySelectorAll('.star-rating-input span');
    let selectedRating = 0;
    starInputs.forEach((star, index) => {
        star.addEventListener('click', () => {
            selectedRating = index + 1;
            document.getElementById('overallRating').value = selectedRating;
            starInputs.forEach((s, i) => {
                s.style.color = i < selectedRating ? '#ff9f00' : '#ddd';
            });
        });
        star.addEventListener('mouseenter', () => {
            starInputs.forEach((s, i) => {
                s.style.color = i <= index ? '#ff9f00' : '#ddd';
            });
        });
    });
    overallRatingSection.querySelector('.star-rating-input').addEventListener('mouseleave', () => {
        starInputs.forEach((s, i) => {
            s.style.color = i < selectedRating ? '#ff9f00' : '#ddd';
        });
    });

    form.appendChild(overallRatingSection);

    // Category Ratings
    if (ratingCategories.length > 0) {
        const categorySection = document.createElement('div');
        categorySection.innerHTML = '<label style="display: block; margin-bottom: 12px; font-weight: 500; color: #212121;">Category Ratings</label>';

        ratingCategories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.style.cssText = 'margin-bottom: 16px;';

            const categoryLabel = document.createElement('label');
            categoryLabel.textContent = category.name;
            categoryLabel.style.cssText = 'display: block; margin-bottom: 8px; font-size: 14px; color: #878787;';

            const categoryStars = document.createElement('div');
            categoryStars.className = 'category-star-rating';
            categoryStars.dataset.categoryId = category.id;
            categoryStars.style.cssText = 'display: flex; gap: 4px; font-size: 20px; cursor: pointer;';

            for (let i = 1; i <= 5; i++) {
                const star = document.createElement('span');
                star.dataset.rating = i;
                star.textContent = '★';
                star.style.color = '#ddd';
                star.addEventListener('click', () => {
                    const categoryId = categoryStars.dataset.categoryId;
                    const stars = categoryStars.querySelectorAll('span');
                    stars.forEach((s, idx) => {
                        s.style.color = idx < i ? '#ff9f00' : '#ddd';
                    });
                    // Store rating
                    const hiddenInput = document.getElementById(`categoryRating_${categoryId}`);
                    if (hiddenInput) {
                        hiddenInput.value = i;
                    }
                });
                categoryStars.appendChild(star);
            }

            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.id = `categoryRating_${category.id}`;
            hiddenInput.name = `category_ratings[${category.id}]`;
            hiddenInput.value = '0';

            categoryDiv.appendChild(categoryLabel);
            categoryDiv.appendChild(categoryStars);
            categoryDiv.appendChild(hiddenInput);
            categorySection.appendChild(categoryDiv);
        });

        form.appendChild(categorySection);
    }

    // Customer Name (pre-fill if user is logged in)
    let customerName = '';
    let customerEmail = '';
    if (typeof getAuthUser !== 'undefined') {
        const user = getAuthUser();
        if (user) {
            customerName = user.name || '';
            customerEmail = user.email || '';
        }
    }

    const nameSection = document.createElement('div');
    const nameLabel = document.createElement('label');
    nameLabel.setAttribute('for', 'customerName');
    nameLabel.style.cssText = 'display: block; margin-bottom: 8px; font-weight: 500; color: #212121;';
    nameLabel.textContent = 'Your Name *';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'customerName';
    nameInput.name = 'customer_name';
    nameInput.value = customerName;
    nameInput.required = true;
    nameInput.style.cssText = 'width: 100%; padding: 10px; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 14px;';

    nameSection.appendChild(nameLabel);
    nameSection.appendChild(nameInput);
    form.appendChild(nameSection);

    // Customer Email (pre-fill if user is logged in)
    const emailSection = document.createElement('div');
    const emailLabel = document.createElement('label');
    emailLabel.setAttribute('for', 'customerEmail');
    emailLabel.style.cssText = 'display: block; margin-bottom: 8px; font-weight: 500; color: #212121;';
    emailLabel.textContent = 'Email';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'customerEmail';
    emailInput.name = 'customer_email';
    emailInput.value = customerEmail;
    emailInput.style.cssText = 'width: 100%; padding: 10px; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 14px;';

    emailSection.appendChild(emailLabel);
    emailSection.appendChild(emailInput);
    form.appendChild(emailSection);

    // Review Text
    const reviewTextSection = document.createElement('div');
    reviewTextSection.innerHTML = `
        <label for="reviewText" style="display: block; margin-bottom: 8px; font-weight: 500; color: #212121;">Your Review</label>
        <textarea id="reviewText" name="review_text" rows="4" 
                  style="width: 100%; padding: 10px; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 14px; resize: vertical;"></textarea>
    `;
    form.appendChild(reviewTextSection);

    // Photo Upload
    const photoSection = document.createElement('div');
    photoSection.innerHTML = `
        <label for="reviewPhotos" style="display: block; margin-bottom: 8px; font-weight: 500; color: #212121;">Photos (Max 5)</label>
        <input type="file" id="reviewPhotos" name="photos[]" multiple accept="image/*" 
               style="width: 100%; padding: 10px; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 14px;">
        <small style="color: #878787; font-size: 12px; margin-top: 4px; display: block;">You can upload up to 5 photos</small>
    `;
    form.appendChild(photoSection);

    // Submit Button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'button'; // Use 'button' type to prevent form submission
    submitBtn.textContent = 'Submit Review';
    submitBtn.style.cssText = `
        background: #2874f0;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 4px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        margin-top: 8px;
    `;
    form.appendChild(submitBtn);

    // Handle button click - form is in scope
    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await submitReview(form);
        } catch (error) {
            showNotification('Error submitting review. Please try again.', 'error');
        }
    });

    // Also prevent form submission as a safety measure
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await submitReview(e.target);
    });

    modalContent.appendChild(closeBtn);
    modalContent.appendChild(title);
    modalContent.appendChild(form);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Submit review
async function submitReview(form) {
    // Final authentication check
    if (typeof isAuthenticated === 'undefined' || !isAuthenticated()) {
        showNotification('Please login to submit a review', 'error');
        document.getElementById('reviewModal')?.remove();
        setTimeout(() => {
            window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
        }, 1500);
        return;
    }

    // Final check if user has ordered
    const hasOrdered = await checkIfUserOrderedProduct();
    if (!hasOrdered) {
        showNotification('You can only review products you have ordered', 'error');
        document.getElementById('reviewModal')?.remove();
        return;
    }

    // Validate product slug first
    if (!currentProduct || !currentProduct.slug) {
        showNotification('Product information not available', 'error');
        return;
    }

    // Read values directly from input fields BEFORE creating formData
    const overallRatingInput = document.getElementById('overallRating');
    let overallRating = overallRatingInput ? overallRatingInput.value : '';
    if (overallRating) overallRating = overallRating.trim();

    const customerNameInput = document.getElementById('customerName');
    let customerName = customerNameInput ? customerNameInput.value : '';
    if (customerName) customerName = customerName.trim();

    const customerEmailInput = document.getElementById('customerEmail');
    let customerEmail = customerEmailInput ? customerEmailInput.value : '';
    if (customerEmail) customerEmail = customerEmail.trim();

    // Debug: Log raw input values

    // Validate overall rating
    if (!overallRating || overallRating === '0' || overallRating === '') {
        showNotification('Please select an overall rating', 'error');
        if (overallRatingInput) {
            overallRatingInput.focus();
        }
        return;
    }

    // If user is logged in, try to get their info as fallback for name
    if (typeof getAuthUser !== 'undefined') {
        const user = getAuthUser();
        if (user) {
            // Use authenticated user's name if not provided
            if (!customerName || customerName === '') {
                customerName = user.name || user.mobile || '';
                if (customerNameInput && customerName) {
                    customerNameInput.value = customerName;
                }
            }
            // Use authenticated user's email if not provided
            if ((!customerEmail || customerEmail === '') && user.email) {
                customerEmail = user.email;
                if (customerEmailInput) {
                    customerEmailInput.value = customerEmail;
                }
            }
        }
    }

    // Validate customer name
    if (!customerName || customerName === '') {
        showNotification('Please enter your name', 'error');
        if (customerNameInput) {
            customerNameInput.focus();
        }
        return;
    }

    // Validate values before creating FormData
    const productSlug = currentProduct?.slug;
    const validatedCustomerName = customerName?.trim();
    const validatedRating = overallRating?.trim();

    if (!productSlug || productSlug === '') {
        showNotification('Product slug is missing', 'error');
        return;
    }

    if (!validatedCustomerName || validatedCustomerName === '') {
        showNotification('Customer name is missing', 'error');
        return;
    }

    if (!validatedRating || validatedRating === '0' || validatedRating === '') {
        showNotification('Rating is missing', 'error');
        return;
    }

    // Create formData manually to ensure all fields are included correctly
    const formData = new FormData();

    // CRITICAL: Add required fields explicitly - ensure values are strings and not empty
    formData.append('product_slug', productSlug);
    formData.append('customer_name', validatedCustomerName);
    formData.append('rating', validatedRating);

    // Immediately verify the values were added

    // Add optional email if available
    if (customerEmail && customerEmail !== '') {
        formData.append('customer_email', customerEmail);
    }

    // Add review text if provided
    const reviewTextInput = document.getElementById('reviewText');
    if (reviewTextInput && reviewTextInput.value.trim()) {
        formData.append('review_text', reviewTextInput.value.trim());
    }

    // Add photos if any are selected
    const photosInput = document.getElementById('reviewPhotos');
    if (photosInput && photosInput.files && photosInput.files.length > 0) {
        for (let i = 0; i < photosInput.files.length; i++) {
            formData.append('photos[]', photosInput.files[i]);
        }
    }

    // Collect category ratings
    const categoryRatings = [];
    ratingCategories.forEach(category => {
        const ratingInput = document.getElementById(`categoryRating_${category.id}`);
        const rating = ratingInput ? ratingInput.value : null;
        if (rating && rating !== '0' && rating !== '') {
            categoryRatings.push({
                rating_category_id: parseInt(category.id),
                rating: parseInt(rating)
            });
        }
    });

    // Add category ratings - For multipart/form-data with Laravel/PHP, use array notation
    // Format: category_ratings[0][rating_category_id], category_ratings[0][rating], etc.
    categoryRatings.forEach((catRating, index) => {
        formData.append(`category_ratings[${index}][rating_category_id]`, catRating.rating_category_id.toString());
        formData.append(`category_ratings[${index}][rating]`, catRating.rating.toString());
    });

    // Debug: Verify formData contents
    for (let pair of formData.entries()) {
    }

    try {
        // Find submit button - it's type="button" now
        const submitBtn = form.querySelector('button[type="button"]') || form.querySelector('button');
        let originalText = 'Submit Review';
        if (submitBtn) {
            originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
        }

        // Add auth token to headers if available
        // IMPORTANT: Do NOT set Content-Type header when sending FormData
        // Browser will automatically set it with boundary parameter
        const headers = {
            'X-API-Key': API_CONFIG.headers['X-API-Key'],
            'Accept': 'application/json'
        };

        if (typeof getAuthHeaders !== 'undefined') {
            const authHeaders = getAuthHeaders();
            if (authHeaders && authHeaders.Authorization) {
                headers['Authorization'] = authHeaders.Authorization;
            }
        }

        // Final verification of FormData before sending
        const formDataEntries = [];
        for (let pair of formData.entries()) {
            const key = pair[0];
            const value = pair[1];
            formDataEntries.push({ key, value: value instanceof File ? `[File: ${value.name}]` : String(value) });
        }

        // Verify required fields exist
        const hasProductSlug = formData.has('product_slug');
        const hasCustomerName = formData.has('customer_name');
        const hasRating = formData.has('rating');

        if (!hasProductSlug || !hasCustomerName || !hasRating) {
            throw new Error('Required fields missing in FormData');
        }

        const response = await fetch(`${API_CONFIG.baseUrl}/reviews`, {
            method: 'POST',
            headers: headers,
            body: formData
        });


        // Check if response is ok before parsing JSON
        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            const text = await response.text();
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        // Reset button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }

        if (result.success) {
            showNotification('Review submitted successfully! It will be visible after admin approval.', 'success');
            document.getElementById('reviewModal')?.remove();
            // Reload reviews after a short delay
            setTimeout(async () => {
                await loadProductReviews(currentProduct.id);
            }, 1000);
        } else {
            let errorMsg = result.message || 'Failed to submit review';
            if (result.errors) {
                const errorList = Object.values(result.errors).flat().join(', ');
                errorMsg = errorList || errorMsg;
            }
            showNotification(errorMsg, 'error');
        }
    } catch (error) {
        // Reset button state
        const submitBtn = form.querySelector('button[type="button"]') || form.querySelector('button');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Review';
        }

        // Show more detailed error message
        const errorMsg = error.message || 'Error submitting review. Please try again.';
        showNotification(errorMsg, 'error');
    }
}

