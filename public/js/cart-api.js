// Cart API Module
// Handles all cart-related API calls

const CART_API = {
    baseUrl: '/api',
    
    // Get cart
    async getCart() {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }
            
            const response = await fetch(`${this.baseUrl}/cart`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();
            
            // Handle 401 Unauthorized
            if (response.status === 401) {
                if (typeof clearAuth === 'function') {
                    clearAuth();
                }
                return { success: false, message: 'Please login to view your cart', unauthorized: true };
            }
            
            return data;
        } catch (error) {
            // /* console.error */('Get cart error:', error);
            return { success: false, message: 'Failed to load cart' };
        }
    },
    
    // Get cart count
    async getCartCount() {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, count: 0 };
            }
            
            const response = await fetch(`${this.baseUrl}/cart/count`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();
            
            // Handle 401 Unauthorized
            if (response.status === 401) {
                if (typeof clearAuth === 'function') {
                    clearAuth();
                }
                return { success: false, count: 0, unauthorized: true };
            }
            
            return data;
        } catch (error) {
            // /* console.error */('Get cart count error:', error);
            return { success: false, count: 0 };
        }
    },
    
    // Add to cart
    async addToCart(productId, quantity = 1) {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                // /* console.error */('getAuthHeaders function not available');
                return { success: false, message: 'Please login to add items to cart', unauthorized: true };
            }
            
            const headers = getAuthHeaders();
            // /* console.log */('Cart API - Headers:', { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : 'missing' });
            
            const response = await fetch(`${this.baseUrl}/cart`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    product_id: productId,
                    quantity: quantity
                })
            });

            // /* console.log */('Cart API - Response status:', response.status);
            
            const data = await response.json();
            // /* console.log */('Cart API - Response data:', data);
            
            // Handle 401 Unauthorized
            if (response.status === 401) {
                // /* console.error */('401 Unauthorized - Token may be invalid or expired');
                if (typeof clearAuth === 'function') {
                    clearAuth();
                }
                return { success: false, message: 'Please login to add items to cart', unauthorized: true };
            }
            
            return data;
        } catch (error) {
            // /* console.error */('Add to cart error:', error);
            return { success: false, message: 'Failed to add to cart' };
        }
    },
    
    // Update cart item quantity
    async updateCartItem(productId, quantity) {
        try {
            const response = await fetch(`${this.baseUrl}/cart/${productId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    quantity: quantity
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            // /* console.error */('Update cart error:', error);
            return { success: false, message: 'Failed to update cart' };
        }
    },
    
    // Remove from cart
    async removeFromCart(productId) {
        try {
            const response = await fetch(`${this.baseUrl}/cart/${productId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();
            return data;
        } catch (error) {
            // /* console.error */('Remove from cart error:', error);
            return { success: false, message: 'Failed to remove from cart' };
        }
    },
    
    // Clear cart
    async clearCart() {
        try {
            const response = await fetch(`${this.baseUrl}/cart`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();
            return data;
        } catch (error) {
            // /* console.error */('Clear cart error:', error);
            return { success: false, message: 'Failed to clear cart' };
        }
    }
};

// Update cart count in header
async function updateCartCountInHeader() {
    // Check if isAuthenticated function exists (auth.js must be loaded)
    if (typeof isAuthenticated === 'undefined' || !isAuthenticated()) {
        const cartCountEl = document.querySelector('.cart-count');
        if (cartCountEl) {
            cartCountEl.textContent = '0';
            cartCountEl.style.display = 'none';
        }
        return;
    }
    
    try {
        const result = await CART_API.getCartCount();
        if (result.success && result.data) {
            const cartCountEl = document.querySelector('.cart-count');
            if (cartCountEl) {
                const newCount = result.data.count || 0;
                const oldCount = parseInt(cartCountEl.textContent) || 0;
                
                cartCountEl.textContent = newCount;
                
                if (newCount > 0) {
                    cartCountEl.style.display = 'flex';
                    // Add animation if count changed
                    if (newCount !== oldCount) {
                        cartCountEl.style.animation = 'none';
                        setTimeout(() => {
                            cartCountEl.style.animation = 'cartPulse 0.3s ease-out';
                        }, 10);
                    }
                } else {
                    cartCountEl.style.display = 'none';
                }
            }
        } else if (result.message && result.message.includes('Unauthenticated')) {
            // Token expired or invalid, clear auth
            if (typeof clearAuth === 'function') {
                clearAuth();
            }
            const cartCountEl = document.querySelector('.cart-count');
            if (cartCountEl) {
                cartCountEl.textContent = '0';
                cartCountEl.style.display = 'none';
            }
        }
    } catch (error) {
        // /* console.error */('Error updating cart count:', error);
        const cartCountEl = document.querySelector('.cart-count');
        if (cartCountEl) {
            cartCountEl.textContent = '0';
            cartCountEl.style.display = 'none';
        }
    }
}

// Initialize cart count on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        updateCartCountInHeader();
    });
}

