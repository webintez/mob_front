// Profile API Module
// Handles all profile-related API calls

function handleUnauthorizedResponse(response, message) {
    if (response.status === 401) {
        if (typeof clearAuth === 'function') {
            clearAuth();
        }
        return { success: false, message, unauthorized: true };
    }
    return null;
}

const PROFILE_API = {
    baseUrl: '/api',

    // Get user profile
    async getProfile() {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }

            const response = await fetch(`${this.baseUrl}/user/profile`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            // Handle 401 Unauthorized
            if (response.status === 401) {
                if (typeof clearAuth === 'function') {
                    clearAuth();
                }
                return { success: false, message: 'Please login to view profile', unauthorized: true };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Failed to load profile' };
        }
    },

    // Update user profile (name, phone, gender)
    async updateProfile(profileData) {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }

            const response = await fetch(`${this.baseUrl}/user/profile`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            // Handle 401 Unauthorized
            if (response.status === 401) {
                if (typeof clearAuth === 'function') {
                    clearAuth();
                }
                return { success: false, message: 'Please login to update profile', unauthorized: true };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Failed to update profile' };
        }
    },

    // Update email (uses auth/profile endpoint)
    async updateEmail(email, name = null) {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }

            const body = { email };
            if (name) {
                body.name = name;
            }

            const response = await fetch(`${this.baseUrl}/auth/profile`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(body)
            });

            const data = await response.json();

            // Handle 401 Unauthorized
            if (response.status === 401) {
                if (typeof clearAuth === 'function') {
                    clearAuth();
                }
                return { success: false, message: 'Please login to update email', unauthorized: true };
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Failed to update email' };
        }
    },
    async getAddresses() {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }

            const response = await fetch(`${this.baseUrl}/user/addresses`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();
            const unauthorized = handleUnauthorizedResponse(response, 'Please login to view addresses');
            if (unauthorized) {
                return unauthorized;
            }
            return data;
        } catch (error) {
            return { success: false, message: 'Failed to load addresses' };
        }
    },

    async addAddress(addressData) {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }

            const response = await fetch(`${this.baseUrl}/user/addresses`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(addressData)
            });

            const data = await response.json();
            const unauthorized = handleUnauthorizedResponse(response, 'Please login to add addresses');
            if (unauthorized) {
                return unauthorized;
            }
            return data;
        } catch (error) {
            return { success: false, message: 'Failed to add address' };
        }
    },

    async updateAddress(addressId, addressData) {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }

            const response = await fetch(`${this.baseUrl}/user/addresses/${addressId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(addressData)
            });

            const data = await response.json();
            const unauthorized = handleUnauthorizedResponse(response, 'Please login to update addresses');
            if (unauthorized) {
                return unauthorized;
            }
            return data;
        } catch (error) {
            return { success: false, message: 'Failed to update address' };
        }
    },

    async deleteAddress(addressId) {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }

            const response = await fetch(`${this.baseUrl}/user/addresses/${addressId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();
            const unauthorized = handleUnauthorizedResponse(response, 'Please login to delete addresses');
            if (unauthorized) {
                return unauthorized;
            }
            return data;
        } catch (error) {
            return { success: false, message: 'Failed to delete address' };
        }
    },

    async getPanCard() {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }
            const response = await fetch(`${this.baseUrl}/user/pan-card`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            const data = await response.json();
            const unauthorized = handleUnauthorizedResponse(response, 'Please login to view PAN card details');
            if (unauthorized) {
                return unauthorized;
            }
            return data;
        } catch (error) {
            return { success: false, message: 'Failed to load PAN card' };
        }
    },

    async savePanCard(formData, isUpdate = false) {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }
            const response = await fetch(`${this.baseUrl}/user/pan-card`, {
                method: isUpdate ? 'PUT' : 'POST',
                headers: {
                    Authorization: getAuthHeaders().Authorization
                },
                body: formData
            });
            const data = await response.json();
            const unauthorized = handleUnauthorizedResponse(response, 'Please login to save PAN card');
            if (unauthorized) {
                return unauthorized;
            }
            return data;
        } catch (error) {
            return { success: false, message: 'Failed to save PAN card' };
        }
    },
    async getStates() {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }

            const response = await fetch(`${this.baseUrl}/user/states`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            const data = await response.json();
            const unauthorized = handleUnauthorizedResponse(response, 'Please login to load states');
            if (unauthorized) {
                return unauthorized;
            }

            return data;
        } catch (error) {
            return { success: false, message: 'Failed to load states' };
        }
    }
    ,
    async getUpi() {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }
            const response = await fetch(`${this.baseUrl}/user/upi`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            const data = await response.json();
            const unauthorized = handleUnauthorizedResponse(response, 'Please login to view UPI');
            if (unauthorized) {
                return unauthorized;
            }
            return data;
        } catch (error) {
            return { success: false, message: 'Failed to load UPI details' };
        }
    },

    async addUpi(payload) {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }
            const response = await fetch(`${this.baseUrl}/user/upi`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            const unauthorized = handleUnauthorizedResponse(response, 'Please login to add UPI');
            if (unauthorized) {
                return unauthorized;
            }
            return data;
        } catch (error) {
            return { success: false, message: 'Failed to add UPI ID' };
        }
    },

    async updateUpi(payload) {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }
            const response = await fetch(`${this.baseUrl}/user/upi`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            const unauthorized = handleUnauthorizedResponse(response, 'Please login to update UPI');
            if (unauthorized) {
                return unauthorized;
            }
            return data;
        } catch (error) {
            return { success: false, message: 'Failed to update UPI ID' };
        }
    },

    async deleteUpi() {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }
            const response = await fetch(`${this.baseUrl}/user/upi`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            const data = await response.json();
            const unauthorized = handleUnauthorizedResponse(response, 'Please login to delete UPI');
            if (unauthorized) {
                return unauthorized;
            }
            return data;
        } catch (error) {
            return { success: false, message: 'Failed to delete UPI' };
        }
    },

    async verifyUpi(payload) {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }
            const response = await fetch(`${this.baseUrl}/user/upi/verify`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            const unauthorized = handleUnauthorizedResponse(response, 'Please login to verify UPI');
            if (unauthorized) {
                return unauthorized;
            }
            return data;
        } catch (error) {
            return { success: false, message: 'Failed to verify UPI' };
        }
    },

    async getUpiStatus() {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }
            const response = await fetch(`${this.baseUrl}/user/upi/status`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            const data = await response.json();
            const unauthorized = handleUnauthorizedResponse(response, 'Please login to check UPI status');
            if (unauthorized) {
                return unauthorized;
            }
            return data;
        } catch (error) {
            return { success: false, message: 'Failed to load UPI status' };
        }
    },

    async getUpiHandles() {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }
            const response = await fetch(`${this.baseUrl}/user/upi/handles`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            const data = await response.json();
            const unauthorized = handleUnauthorizedResponse(response, 'Please login to load UPI handles');
            if (unauthorized) {
                return unauthorized;
            }
            return data;
        } catch (error) {
            return { success: false, message: 'Failed to load UPI handles' };
        }
    },

    // Get user's reviews
    // Since /reviews/{id} catches all routes, we'll use a workaround:
    // Fetch user's orders, then get reviews for each product and filter by current user
    async getUserReviews(page = 1, perPage = 20) {
        try {
            // First, try to get user info to ensure we have correct matching data
            const user = typeof getAuthUser !== 'undefined' ? getAuthUser() : null;
            if (!user) {
                return { success: false, message: 'User not authenticated', unauthorized: true };
            }

            // /* console.log */('Fetching user reviews for:', {
            //     userId: user.id || user.user_id,
            //     email: user.email,
            //     name: user.name
            // });

            // Use fallback approach: get reviews from orders
            return await this.getUserReviewsFromOrders(page, perPage);
        } catch (error) {
            // /* console.error */('Error in getUserReviews:', error);
            return { success: false, message: 'Failed to load reviews: ' + error.message };
        }
    },

    // Get user reviews by fetching orders and then reviews for each product
    async getUserReviewsFromOrders(page = 1, perPage = 20) {
        try {
            if (typeof getAuthHeaders === 'undefined') {
                return { success: false, message: 'Authentication not available' };
            }

            if (typeof ORDER_API === 'undefined') {
                return { success: false, message: 'Orders API not available' };
            }

            // Get user's orders
            const ordersResult = await ORDER_API.listOrders({ limit: 100 });
            if (!ordersResult.success || !ordersResult.data) {
                return { success: false, message: 'Failed to load orders' };
            }

            const orders = Array.isArray(ordersResult.data) ? ordersResult.data : [];
            const productSlugs = new Set();
            const productIdsToFetch = new Set();
            const productIdToDataMap = new Map();

            // Extract unique product slugs and IDs from orders
            orders.forEach(order => {
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        const product = item.product || {};
                        const slug = item.product_slug || item.slug || product.slug || product.product_slug;
                        if (slug) {
                            productSlugs.add(slug);
                        } else {
                            const productId = product.id || item.product_id;
                            if (productId) {
                                productIdsToFetch.add(productId);
                            }
                        }
                    });
                }
            });

            // Fetch product slugs for products that only have IDs
            if (productIdsToFetch.size > 0) {
                const productIdsArray = Array.from(productIdsToFetch);
                let fetchPage = 1;
                const fetchPerPage = 50;
                let foundCount = 0;
                const maxPages = 20;

                while (foundCount < productIdsArray.length && fetchPage <= maxPages) {
                    try {
                        const response = await fetch(`${this.baseUrl}/products?page=${fetchPage}&per_page=${fetchPerPage}`, {
                            headers: getAuthHeaders()
                        });
                        const productsResult = await response.json();

                        if (productsResult.success && productsResult.data) {
                            let products = [];
                            const responseData = productsResult.data;

                            if (Array.isArray(responseData)) {
                                products = responseData;
                            } else if (responseData.data && Array.isArray(responseData.data)) {
                                products = responseData.data;
                            } else if (responseData.products && Array.isArray(responseData.products)) {
                                products = responseData.products;
                            }

                            products.forEach(product => {
                                const productId = product.id || product.product_id;
                                const matchesId = productIdsArray.some(id => {
                                    const idNum = parseInt(id);
                                    const productIdNum = parseInt(productId);
                                    return id == productId || idNum === productIdNum || String(id) === String(productId);
                                });
                                if (matchesId && product.slug) {
                                    productSlugs.add(product.slug);
                                    productIdToDataMap.set(productId, product);
                                    foundCount++;
                                }
                            });

                            if (foundCount >= productIdsArray.length) break;

                            const paginationData = responseData;
                            const hasMore = paginationData.next_page_url ||
                                paginationData.has_more ||
                                (paginationData.last_page && fetchPage < paginationData.last_page) ||
                                products.length === fetchPerPage;
                            if (!hasMore) break;

                            fetchPage++;
                        } else {
                            break;
                        }
                    } catch (error) { }
                }
            }

            if (productSlugs.size === 0) {
                return {
                    success: true,
                    data: {
                        reviews: [],
                        total_reviews: 0,
                        pagination: { current_page: page, per_page: perPage, total: 0, has_more: false }
                    }
                };
            }

            const allReviews = [];
            const user = typeof getAuthUser !== 'undefined' ? getAuthUser() : null;
            const userEmail = user ? (user.email || '').toLowerCase().trim() : '';
            const userName = user ? (user.name || '').toLowerCase().trim() : '';
            const currentUserId = user ? (user.id || user.user_id || null) : null;

            const apiCall = (typeof makeApiCall !== 'undefined') ? makeApiCall :
                (typeof window.makeApiCall !== 'undefined') ? window.makeApiCall : null;

            const slugsArray = Array.from(productSlugs);
            const slugToProductDataMap = new Map();

            for (const slug of slugsArray) {
                try {
                    let productData = null;
                    if (apiCall) {
                        const result = await apiCall(`/products/${slug}`);
                        if (result.success && result.data) productData = result.data;
                    } else {
                        const response = await fetch(`${this.baseUrl}/products/${slug}`, { headers: getAuthHeaders() });
                        const result = await response.json();
                        if (result.success && result.data) productData = result.data;
                    }
                    if (productData) slugToProductDataMap.set(slug, productData);
                } catch (error) { }
            }

            for (const slug of slugsArray) {
                try {
                    let reviewsData = null;
                    if (apiCall) {
                        const result = await apiCall(`/reviews/product/${slug}?page=1&per_page=50&sort=newest`);
                        if (result.success && result.data) reviewsData = result.data;
                    } else {
                        const response = await fetch(`${this.baseUrl}/reviews/product/${slug}?page=1&per_page=50&sort=newest`, { headers: getAuthHeaders() });
                        const result = await response.json();
                        if (result.success && result.data) reviewsData = result.data;
                    }

                    if (reviewsData && reviewsData.reviews && Array.isArray(reviewsData.reviews)) {
                        const userReviews = reviewsData.reviews.filter(review => {
                            const reviewEmail = (review.customer_email || review.user?.email || review.email || '').toLowerCase().trim();
                            const reviewName = (review.customer_name || review.user?.name || review.reviewer_name || review.name || '').toLowerCase().trim();
                            const reviewUserId = review.user_id || review.user?.id || null;
                            const reviewAuthUserId = review.auth_user_id || review.authenticated_user_id || null;

                            const emailMatch = userEmail && reviewEmail && reviewEmail === userEmail;
                            const nameMatch = userName && reviewName && reviewName === userName;
                            const userIdMatch = currentUserId && (reviewUserId === currentUserId || reviewAuthUserId === currentUserId);

                            return emailMatch || nameMatch || userIdMatch;
                        });

                        userReviews.forEach(review => {
                            let productImage = null;
                            let productName = slug;

                            const fetchedProductData = slugToProductDataMap.get(slug);
                            if (fetchedProductData) {
                                productImage = fetchedProductData.image_url || fetchedProductData.image || (fetchedProductData.gallery_images?.length ? (fetchedProductData.gallery_images[0].image_url || fetchedProductData.gallery_images[0]) : null);
                                productName = fetchedProductData.name || fetchedProductData.title || slug;
                            }

                            if (!productImage && reviewsData.product) {
                                productImage = reviewsData.product.image_url || reviewsData.product.image || (reviewsData.product.gallery_images?.length ? reviewsData.product.gallery_images[0] : null);
                                if (!productName || productName === slug) productName = reviewsData.product.name || reviewsData.product.title || slug;
                            }

                            review.product = { slug: slug, name: productName, image: productImage, image_url: productImage };
                        });

                        allReviews.push(...userReviews);
                    }
                } catch (error) { }
            }

            allReviews.sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0));

            const startIndex = (page - 1) * perPage;
            const endIndex = startIndex + perPage;
            const paginatedReviews = allReviews.slice(startIndex, endIndex);

            return {
                success: true,
                data: {
                    reviews: paginatedReviews,
                    total_reviews: allReviews.length,
                    pagination: {
                        current_page: page,
                        per_page: perPage,
                        total: allReviews.length,
                        has_more: endIndex < allReviews.length
                    }
                }
            };
        } catch (error) {
            return { success: false, message: 'Failed to load reviews: ' + error.message };
        }
    }
};
