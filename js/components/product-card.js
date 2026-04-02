/**
 * ProductCard Component
 * A shared, reusable product card for use in carousels, grids, and any other section.
 *
 * Usage:
 *   ProductCard.toHTML(product, options)   → returns an HTML string
 *   ProductCard.toElement(product, options) → returns a DOM Element
 *
 * Options:
 *   showPrice   {boolean} - default true
 *   showRating  {boolean} - default true
 *   extraClass  {string}  - extra CSS class(es) to add to the anchor element
 */
const ProductCard = {

    /**
     * Derive a clean discount percentage from product data.
     */
    _discountPct(product) {
        if (product.discount_percentage) return parseInt(product.discount_percentage);
        if (product.original_price && product.price) {
            const pct = Math.round((1 - (parseFloat(product.price) / parseFloat(product.original_price))) * 100);
            return pct > 0 ? pct : 0;
        }
        return 0;
    },

    /**
     * Format a number as Indian currency string.
     */
    _formatPrice(amount) {
        return parseFloat(amount).toLocaleString('en-IN');
    },

    /**
     * Returns the product HTML as a string.
     * Compatible with innerHTML / template literal usage.
     */
    toHTML(product, options = {}) {
        const showPrice = options.showPrice !== false;
        const showRating = options.showRating !== false;
        const extraClass = options.extraClass ? ` ${options.extraClass}` : '';
        const slug = product.slug || product.id;
        const imageUrl = product.image_url || product.image || '/img/placeholder-vertical.png';
        const discount = this._discountPct(product);
        const name = product.name || '';

        return `
<a href="/product.html?slug=${slug}" class="product-card homepage-product-card${extraClass}">
    <div class="product-image-wrapper">
        <img
            src="${imageUrl}"
            alt="${name}"
            class="product-image"
            loading="lazy"
            onerror="this.src='/img/placeholder-vertical.png'"
        >
        ${discount > 0 ? `<span class="product-discount-badge">${discount}% off</span>` : ''}
    </div>
    <div class="product-info">
        <div class="product-title">${name}</div>
        ${showPrice && product.price ? `
        <div class="product-price">
            <span class="price-current">₹${this._formatPrice(product.price)}</span>
            ${product.original_price ? `<span class="price-original">₹${this._formatPrice(product.original_price)}</span>` : ''}
        </div>` : ''}
        ${showRating && product.rating && parseFloat(product.rating) > 0 ? `
        <div class="product-rating">
            <span class="rating-badge">${parseFloat(product.rating).toFixed(1)} ★</span>
            ${product.review_count ? `<span class="review-count">(${product.review_count})</span>` : ''}
        </div>` : ''}
    </div>
</a>`.trim();
    },

    /**
     * Returns the product as a DOM Element.
     * Compatible with appendChild() / DOM manipulation usage.
     */
    toElement(product, options = {}) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = this.toHTML(product, options);
        return wrapper.firstElementChild;
    },
};

// Make available globally (for non-module scripts)
if (typeof window !== 'undefined') {
    window.ProductCard = ProductCard;
}
