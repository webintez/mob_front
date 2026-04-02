// Recently Viewed Products Module
// Tracks and displays products viewed by logged-in users

const RECENTLY_VIEWED_KEY = 'mobitez_recently_viewed';
const MAX_RECENTLY_VIEWED = 20; // Store up to 20 recently viewed products

// Track a product as viewed
function trackProductView(product) {
    // Track for all users (guests and logged in)
    // if (typeof isAuthenticated === 'undefined' || !isAuthenticated()) {
    //    return;
    // }

    if (!product || !product.id || !product.slug) {
        // /* console.warn */('Invalid product data for tracking:', product);
        return;
    }

    try {
        // Get existing recently viewed products
        const recentlyViewed = getRecentlyViewedProducts();

        // Remove the product if it already exists (to avoid duplicates)
        const filtered = recentlyViewed.filter(p => p.id !== product.id);

        // Add the new product at the beginning
        const updated = [{
            id: product.id,
            slug: product.slug,
            name: product.name || product.title || 'Product',
            image_url: product.image_url || product.image || '/images/placeholder.svg',
            price: product.price || 0,
            original_price: product.original_price || null,
            discount_percentage: product.discount_percentage || null,
            rating: product.rating || null,
            review_count: product.review_count || product.rating_count || 0,
            viewed_at: new Date().toISOString()
        }, ...filtered].slice(0, MAX_RECENTLY_VIEWED); // Keep only the most recent 20

        // Save to localStorage
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));

        // /* console.log */('Product tracked as recently viewed:', product.name);
    } catch (error) {
        // /* console.error */('Error tracking product view:', error);
    }
}

// Get recently viewed products
function getRecentlyViewedProducts() {
    try {
        const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        // /* console.error */('Error reading recently viewed products:', error);
    }
    return [];
}

// Clear recently viewed products
function clearRecentlyViewed() {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
}

// Get recently viewed products (limited count)
function getRecentlyViewedProductsLimited(count = 10) {
    const products = getRecentlyViewedProducts();
    return products.slice(0, count);
}



