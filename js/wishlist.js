// Wishlist Page JavaScript

let wishlistData = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '/login.html?return=/wishlist.html';
        return;
    }

    // Setup login dropdown
    setupLoginDropdown();
    updateAuthUI();
    await updateCartCountInHeader();
    
    // Update user greeting
    updateUserGreeting();

    // Load wishlist
    await loadWishlist();
});

function updateUserGreeting() {
    const userGreetingText = document.querySelector('.user-greeting-text');
    if (userGreetingText) {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const userName = userData.name || userData.first_name || 'Hello';
        userGreetingText.textContent = userName;
    }
}

async function loadWishlist() {
    const wishlistItemsContainer = document.getElementById('wishlistItemsContainer');
    const emptyWishlist = document.getElementById('emptyWishlist');
    
    // Show loading
    if (wishlistItemsContainer) {
        wishlistItemsContainer.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading wishlist...</p>
            </div>
        `;
    }

    const result = await WISHLIST_API.getWishlist();

    if (result.success && result.data && result.data.length > 0) {
        wishlistData = result.data;
        displayWishlistItems(result.data);
        
        if (emptyWishlist) emptyWishlist.style.display = 'none';
        if (wishlistItemsContainer) wishlistItemsContainer.style.display = 'block';
    } else {
        // Empty wishlist
        if (emptyWishlist) emptyWishlist.style.display = 'block';
        if (wishlistItemsContainer) wishlistItemsContainer.style.display = 'none';
        wishlistData = [];
    }

    // Update item count
    const wishlistItemCount = document.getElementById('wishlistItemCount');
    if (wishlistItemCount) {
        wishlistItemCount.textContent = wishlistData.length;
    }
}

function displayWishlistItems(items) {
    const wishlistItemsContainer = document.getElementById('wishlistItemsContainer');
    if (!wishlistItemsContainer) return;

    wishlistItemsContainer.innerHTML = '';

    items.forEach(item => {
        const wishlistItem = createWishlistItemElement(item);
        wishlistItemsContainer.appendChild(wishlistItem);
    });
}

function createWishlistItemElement(item) {
    const product = item.product;
    const div = document.createElement('div');
    div.className = 'wishlist-item';
    div.dataset.productId = product.id;

    const originalPrice = parseFloat(product.original_price) || parseFloat(product.price) || 0;
    const currentPrice = parseFloat(product.price) || 0;
    const discount = originalPrice > currentPrice && originalPrice > 0 ? 
                    Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

    // Get product image - try multiple sources
    let productImage = '/images/placeholder.svg';
    if (product.image_url) {
        productImage = product.image_url;
    } else if (product.images && product.images.length > 0) {
        productImage = Array.isArray(product.images) ? product.images[0] : product.images;
    } else if (product.image) {
        productImage = product.image;
    }

    div.innerHTML = `
        <button class="wishlist-item-remove" onclick="removeFromWishlist(${product.id})" title="Remove from wishlist">
            <i class="fas fa-times"></i>
        </button>
        <div class="wishlist-item-image-wrapper">
            <a href="/product.html?slug=${product.slug || ''}">
                <img src="${productImage}" 
                     alt="${product.name || 'Product'}" 
                     class="wishlist-item-image" 
                     onerror="this.src='/images/placeholder.svg'">
            </a>
        </div>
        <div class="wishlist-item-details">
            <a href="/product.html?slug=${product.slug || ''}" class="wishlist-item-name">${product.name || 'Product'}</a>
            <div class="wishlist-item-price-section">
                <span class="wishlist-item-price">₹${formatPrice(currentPrice)}</span>
                ${originalPrice > currentPrice ? `<span class="wishlist-item-original-price">₹${formatPrice(originalPrice)}</span>` : ''}
                ${discount > 0 ? `<span class="wishlist-item-discount">${discount}% off</span>` : ''}
            </div>
            <div class="wishlist-item-actions">
                <button class="wishlist-item-btn wishlist-item-btn-add" onclick="addToCartFromWishlist(${product.id})">
                    ADD TO CART
                </button>
            </div>
        </div>
    `;

    return div;
}

async function removeFromWishlist(productId) {
    if (!confirm('Remove this item from wishlist?')) {
        return;
    }

    const result = await WISHLIST_API.removeFromWishlist(productId);
    
    if (result.success) {
        await loadWishlist();
        showNotification('Item removed from wishlist');
    } else {
        showNotification(result.message || 'Failed to remove item', 'error');
    }
}

async function addToCartFromWishlist(productId) {
    const result = await CART_API.addToCart(productId, 1);
    
    if (result.success) {
        await updateCartCountInHeader();
        showNotification('Item added to cart');
    } else {
        showNotification(result.message || 'Failed to add to cart', 'error');
    }
}

function formatPrice(price) {
    return parseFloat(price).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 120px;
        right: 20px;
        background: ${type === 'error' ? '#ff6161' : '#388e3c'};
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10001;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add slide animations if not already added
    if (!document.getElementById('notification-animations-wishlist')) {
        const style = document.createElement('style');
        style.id = 'notification-animations-wishlist';
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
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after 3 seconds with smooth animation
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
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
            loginDropdown.classList.toggle('show');
            if (loginDropdown.classList.contains('show')) {
                positionDropdown();
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!loginBtn.contains(e.target) && !loginDropdown.contains(e.target)) {
                loginDropdown.classList.remove('show');
            }
        });
        
        // Position dropdown on scroll/resize
        window.addEventListener('scroll', positionDropdown);
        window.addEventListener('resize', positionDropdown);
        
        // Handle mouse events for better UX
        loginBtn.addEventListener('mouseenter', () => {
            loginDropdown.classList.add('show');
            positionDropdown();
        });
        
        loginBtn.addEventListener('mouseleave', () => {
            setTimeout(() => {
                if (!loginDropdown.matches(':hover')) {
                    loginDropdown.classList.remove('show');
                }
            }, 200);
        });
        
        loginDropdown.addEventListener('mouseleave', () => {
            loginDropdown.classList.remove('show');
        });
    }
}

// Make functions global for onclick handlers
window.removeFromWishlist = removeFromWishlist;
window.addToCartFromWishlist = addToCartFromWishlist;


