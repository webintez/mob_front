// Order API Module
// Handles all order-related API calls

const ORDER_API = {
    baseUrl: '/api',
    
    // Create order
    async createOrder(orderData) {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }
            
            const response = await fetch(`${this.baseUrl}/orders`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(orderData)
            });

            const data = await response.json();
            // /* console.log */('Create Order API Response:', { status: response.status, data });
            // /* console.log */('Order Data Sent:', orderData);
            
            // Handle 401 Unauthorized
            if (response.status === 401) {
                if (typeof clearAuth === 'function') {
                    clearAuth();
                }
                return { success: false, message: 'Please login to create order', unauthorized: true };
            }
            
            // Handle 422 Validation Error
            if (response.status === 422) {
                const errorMessage = data.message || 'Validation error';
                const errors = data.errors || {};
                // /* console.error */('Order validation errors:', errors);
                return { 
                    success: false, 
                    message: errorMessage,
                    errors: errors,
                    validationError: true
                };
            }
            
            return data;
        } catch (error) {
            // /* console.error */('Create order error:', error);
            return { success: false, message: 'Failed to create order' };
        }
    },
    
    // Get order by order number
    async getOrder(orderNumber) {
        try {
            // Validate order number
            if (!orderNumber || orderNumber === 'undefined' || orderNumber === 'null') {
                return { success: false, message: 'Invalid order number' };
            }
            
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available', unauthorized: true };
            }
            
            // Check if user is authenticated
            if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
                return { success: false, message: 'Please login to view order', unauthorized: true };
            }
            
            const headers = getAuthHeaders();
            
            // Ensure Authorization header is present
            if (!headers['Authorization'] && !headers['authorization']) {
                return { success: false, message: 'Authentication token not found. Please login again.', unauthorized: true };
            }
            
            const response = await fetch(`${this.baseUrl}/orders/${orderNumber}`, {
                method: 'GET',
                headers: headers
            });

            const data = await response.json();
            // /* console.log */('Get Order API Response:', { status: response.status, data });
            
            // Handle 401 Unauthorized
            if (response.status === 401) {
                if (typeof clearAuth === 'function') {
                    clearAuth();
                }
                return { success: false, message: 'Please login to view order', unauthorized: true };
            }
            
            // Handle 404 Not Found
            if (response.status === 404) {
                return { success: false, message: 'Order not found. Please check the order number.' };
            }
            
            return data;
        } catch (error) {
            // /* console.error */('Get order error:', error);
            return { success: false, message: 'Failed to load order. Please try again.' };
        }
    },
    
    // List orders
    async listOrders(filters = {}) {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }
            
            // Build query string
            const queryParams = new URLSearchParams();
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.payment_status) queryParams.append('payment_status', filters.payment_status);
            if (filters.page) queryParams.append('page', filters.page);
            if (filters.limit) queryParams.append('limit', filters.limit);
            
            const queryString = queryParams.toString();
            const url = `${this.baseUrl}/orders${queryString ? '?' + queryString : ''}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();
            // /* console.log */('List Orders API Response:', { status: response.status, data });
            
            // Handle 401 Unauthorized
            if (response.status === 401) {
                if (typeof clearAuth === 'function') {
                    clearAuth();
                }
                return { success: false, message: 'Please login to view orders', unauthorized: true };
            }
            
            return data;
        } catch (error) {
            // /* console.error */('List orders error:', error);
            return { success: false, message: 'Failed to load orders' };
        }
    },
    
    // Cancel order
    async cancelOrder(orderNumber, reason = '') {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }
            
            const response = await fetch(`${this.baseUrl}/orders/${orderNumber}/cancel`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ reason })
            });

            const data = await response.json();
            // /* console.log */('Cancel Order API Response:', { status: response.status, data });
            
            // Handle 401 Unauthorized
            if (response.status === 401) {
                if (typeof clearAuth === 'function') {
                    clearAuth();
                }
                return { success: false, message: 'Please login to cancel order', unauthorized: true };
            }
            
            return data;
        } catch (error) {
            // /* console.error */('Cancel order error:', error);
            return { success: false, message: 'Failed to cancel order' };
        }
    },
    
    // Update payment status
    async updatePaymentStatus(orderNumber, paymentStatus, paymentId = null) {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }
            
            const body = { payment_status: paymentStatus };
            if (paymentId) body.payment_id = paymentId;
            
            const response = await fetch(`${this.baseUrl}/orders/${orderNumber}/payment-status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(body)
            });

            const data = await response.json();
            // /* console.log */('Update Payment Status API Response:', { status: response.status, data });
            
            // Handle 401 Unauthorized
            if (response.status === 401) {
                if (typeof clearAuth === 'function') {
                    clearAuth();
                }
                return { success: false, message: 'Please login to update payment status', unauthorized: true };
            }
            
            return data;
        } catch (error) {
            // /* console.error */('Update payment status error:', error);
            return { success: false, message: 'Failed to update payment status' };
        }
    }
};

