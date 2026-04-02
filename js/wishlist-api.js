// Wishlist API Module
// Handles all wishlist-related API calls

const WISHLIST_API = {
    baseUrl: '/api',

    // Get wishlist
    async getWishlist() {
        try {
            const response = await fetch(`${this.baseUrl}/wishlist`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();
            console.log(`Wishlist API Response [GET /wishlist]:`, data);
            return data;
        } catch (error) {
            // /* console.error */('Get wishlist error:', error);
            return { success: false, message: 'Failed to load wishlist' };
        }
    },

    // Check if product is in wishlist
    async checkWishlist(productId) {
        try {
            const response = await fetch(`${this.baseUrl}/wishlist/check/${productId}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();
            console.log(`Wishlist API Response [GET /wishlist/check/${productId}]:`, data);
            return data;
        } catch (error) {
            // /* console.error */('Check wishlist error:', error);
            return { success: false, in_wishlist: false };
        }
    },

    // Add to wishlist
    async addToWishlist(productId) {
        try {
            const response = await fetch(`${this.baseUrl}/wishlist`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    product_id: productId
                })
            });

            const data = await response.json();
            console.log(`Wishlist API Response [POST /wishlist]:`, data);
            return data;
        } catch (error) {
            // /* console.error */('Add to wishlist error:', error);
            return { success: false, message: 'Failed to add to wishlist' };
        }
    },

    // Remove from wishlist
    async removeFromWishlist(productId) {
        try {
            const response = await fetch(`${this.baseUrl}/wishlist/${productId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();
            console.log(`Wishlist API Response [DELETE /wishlist/${productId}]:`, data);
            return data;
        } catch (error) {
            // /* console.error */('Remove from wishlist error:', error);
            return { success: false, message: 'Failed to remove from wishlist' };
        }
    }
};



