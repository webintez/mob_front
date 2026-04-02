// Cart API Module
// Handles all cart-related API calls

const CART_API = {
    baseUrl: '/api',

    // Get cart
    async getCart() {
        try {
            if (typeof getAuthHeaders === 'undefined' || !getAuthHeaders().Authorization) {
                return { success: false, message: 'Please login to view your cart', unauthorized: true };
            }

            const response = await fetch(`${this.baseUrl}/cart`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();
            console.log(`Cart API Response [GET /cart]:`, data);

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

    getCartCountPromise: null,

    // Get cart count
    async getCartCount() {
        if (this.getCartCountPromise) {
            return this.getCartCountPromise;
        }

        this.getCartCountPromise = (async () => {
            try {
                if (typeof getAuthHeaders === 'undefined' || !getAuthHeaders().Authorization) {
                    return { success: false, count: 0 };
                }

                const response = await fetch(`${this.baseUrl}/cart/count`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });

                const data = await response.json();
                // console.log(`Cart API Response [GET /cart/count]:`, data);

                // Handle 401 Unauthorized
                if (response.status === 401) {
                    if (typeof clearAuth === 'function') {
                        clearAuth();
                    }
                    return { success: false, count: 0, unauthorized: true };
                }

                return data;
            } catch (error) {
                return { success: false, count: 0 };
            }
        })();

        try {
            return await this.getCartCountPromise;
        } finally {
            this.getCartCountPromise = null;
        }
    },

    // Add to cart
    async addToCart(productId, quantity = 1) {
        try {
            if (typeof getAuthHeaders === 'undefined' || !getAuthHeaders().Authorization) {
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
            console.log(`Cart API Response [POST /cart]:`, data);
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
            if (typeof getAuthHeaders === 'undefined' || !getAuthHeaders().Authorization) {
                return { success: false, message: 'Please login to update cart', unauthorized: true };
            }

            const response = await fetch(`${this.baseUrl}/cart/${productId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    quantity: quantity
                })
            });

            const data = await response.json();
            console.log(`Cart API Response [PUT /cart/${productId}]:`, data);
            return data;
        } catch (error) {
            // /* console.error */('Update cart error:', error);
            return { success: false, message: 'Failed to update cart' };
        }
    },

    // Remove from cart
    async removeFromCart(productId) {
        try {
            if (typeof getAuthHeaders === 'undefined' || !getAuthHeaders().Authorization) {
                return { success: false, message: 'Please login to modify cart', unauthorized: true };
            }

            const response = await fetch(`${this.baseUrl}/cart/${productId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();
            console.log(`Cart API Response [DELETE /cart/${productId}]:`, data);
            return data;
        } catch (error) {
            // /* console.error */('Remove from cart error:', error);
            return { success: false, message: 'Failed to remove from cart' };
        }
    },

    // Clear cart
    async clearCart() {
        try {
            if (typeof getAuthHeaders === 'undefined' || !getAuthHeaders().Authorization) {
                return { success: false, message: 'Please login to clear cart', unauthorized: true };
            }

            const response = await fetch(`${this.baseUrl}/cart`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();
            console.log(`Cart API Response [DELETE /cart]:`, data);
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
        const cartCountEls = document.querySelectorAll('.cart-count');
        cartCountEls.forEach(el => {
            el.textContent = '0';
            el.style.display = 'none';
        });
        return;
    }

    // Double check token availability before making API call
    if (typeof getAuthHeaders === 'undefined' || !getAuthHeaders().Authorization) {
        return;
    }

    try {
        const result = await CART_API.getCartCount();
        if (result.success && result.data) {
            const cartCountEls = document.querySelectorAll('.cart-count');
            const newCount = result.data.count || 0;
            
            cartCountEls.forEach(el => {
                const oldCount = parseInt(el.textContent) || 0;
                el.textContent = newCount;

                if (newCount > 0) {
                    el.style.display = 'flex';
                    el.classList.add('has-items');
                    // Add animation if count changed
                    if (newCount !== oldCount) {
                        el.style.animation = 'none';
                        setTimeout(() => {
                            el.style.animation = 'cartPulse 0.3s ease-out';
                        }, 10);
                    }
                } else {
                    el.style.display = 'none';
                    el.classList.remove('has-items');
                }
            });
        } else {
            // Token expired or invalid, or API failed, just hide count
            const cartCountEls = document.querySelectorAll('.cart-count');
            cartCountEls.forEach(el => {
                el.textContent = '0';
                el.style.display = 'none';
            });
        }
    } catch (error) {
        // /* console.error */('Error updating cart count:', error);
        const cartCountEls = document.querySelectorAll('.cart-count');
        cartCountEls.forEach(el => {
            el.textContent = '0';
            el.style.display = 'none';
        });
    }
}

// Initialize cart count on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        updateCartCountInHeader();
    });
}

