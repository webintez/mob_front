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
                userId: user.id || user.user_id,
                email: user.email,
                name: user.name
            });
            
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
            const productIdToDataMap = new Map(); // Store product ID -> full product data mapping
            
            // Extract unique product slugs and IDs from orders
            orders.forEach(order => {
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        const product = item.product || {};
                        // Try multiple sources for product slug (check item level first, then product object)
                        const slug = item.product_slug || item.slug || product.slug || product.product_slug;
                        if (slug) {
                            productSlugs.add(slug);
                        } else {
                            // If slug not found, collect product ID to fetch slug later
                            const productId = product.id || item.product_id;
                            if (productId) {
                                productIdsToFetch.add(productId);
                            }
                        }
                    });
                }
            });
            
            // /* console.log */('Extracted product slugs from orders:', Array.from(productSlugs));
            // /* console.log */('Product IDs to fetch slugs for:', Array.from(productIdsToFetch));
            
            // Fetch product slugs for products that only have IDs
            if (productIdsToFetch.size > 0) {
                const productIdsArray = Array.from(productIdsToFetch);
                let page = 1;
                const perPage = 50;
                let foundCount = 0;
                const maxPages = 20; // Limit to prevent infinite loops
                
                // Use fetch directly to ensure consistent response structure
                while (foundCount < productIdsArray.length && page <= maxPages) {
                    try {
                        const response = await fetch(`${this.baseUrl}/products?page=${page}&per_page=${perPage}`, {
                            headers: getAuthHeaders()
                        });
                        const productsResult = await response.json();
                        
                        if (productsResult.success && productsResult.data) {
                            // Handle Laravel paginated response: { success: true, data: { data: [...] } }
                            let products = [];
                            const responseData = productsResult.data;
                            
                            if (Array.isArray(responseData)) {
                                products = responseData;
                            } else if (responseData.data && Array.isArray(responseData.data)) {
                                // Laravel paginated response: { data: { data: [...] } }
                                products = responseData.data;
                            } else if (responseData.products && Array.isArray(responseData.products)) {
                                products = responseData.products;
                            }
                            
                            // /* console.log */(`Page ${page}: Fetched ${products.length} products`);
                            
                                // Match products by ID and store product data
                                products.forEach(product => {
                                    const productId = product.id || product.product_id;
                                    // Check both string and number comparison
                                    const matchesId = productIdsArray.some(id => {
                                        const idNum = parseInt(id);
                                        const productIdNum = parseInt(productId);
                                        return id == productId || idNum === productIdNum || String(id) === String(productId);
                                    });
                                    if (matchesId && product.slug) {
                                        productSlugs.add(product.slug);
                                        productIdToDataMap.set(productId, product); // Store full product data
                                        foundCount++;
                                        // /* console.log */(`✓ Found slug for product ID ${productId}: ${product.slug}`);
                                    }
                                });
                            
                            // Check if we've found all products or if there are more pages
                            if (foundCount >= productIdsArray.length) {
                                break; // Found all products
                            }
                            
                            // Check if there are more pages
                            const paginationData = responseData;
                            const hasMore = paginationData.next_page_url || 
                                          paginationData.has_more || 
                                          (paginationData.last_page && page < paginationData.last_page) ||
                                          products.length === perPage;
                            if (!hasMore) {
                                break; // No more pages
                            }
                            
                            page++;
                        } else {
                            // /* console.warn */(`Products API call failed for page ${page}`);
                            break; // API call failed
                        }
                    } catch (error) {
                        // /* console.error */(`Error fetching products page ${page}:`, error);
                        break;
                    }
                }
                
                // Log any products we couldn't find slugs for
                const notFoundCount = productIdsArray.length - foundCount;
                if (notFoundCount > 0) {
                    // /* console.warn */(`Could not find slugs for ${notFoundCount} product IDs:`, productIdsArray.filter(id => {
                        // Check if this ID was found
                        return !Array.from(productSlugs).some(slug => {
                            // We can't reverse lookup easily, so just log
                            return false;
                        });
                    }));
                }
            }
            
            // /* console.log */('Final product slugs after fetching:', Array.from(productSlugs));
            
            if (productSlugs.size === 0) {
                return {
                    success: true,
                    data: {
                        reviews: [],
                        total_reviews: 0,
                        pagination: {
                            current_page: page,
                            per_page: perPage,
                            total: 0,
                            has_more: false
                        }
                    }
                };
            }
            
            // Fetch reviews for each product and filter by current user
            const allReviews = [];
            const user = typeof getAuthUser !== 'undefined' ? getAuthUser() : null;
            const userEmail = user ? (user.email || '').toLowerCase().trim() : '';
            const userName = user ? (user.name || '').toLowerCase().trim() : '';
            const currentUserId = user ? (user.id || user.user_id || null) : null;
            
            // /* console.log */('User info for review filtering:', {
                userEmail: userEmail,
                userName: userName,
                currentUserId: currentUserId,
                user: user
            });
            
            // Use makeApiCall if available (same as product.js)
            const apiCall = (typeof makeApiCall !== 'undefined') ? makeApiCall : 
                          (typeof window.makeApiCall !== 'undefined') ? window.makeApiCall : null;
            
            const slugsArray = Array.from(productSlugs);
            const slugToProductDataMap = new Map(); // Store slug -> product data mapping
            
            // First, fetch product details for all slugs to get images
            for (const slug of slugsArray) {
                try {
                    let productData = null;
                    if (apiCall) {
                        const result = await apiCall(`/products/${slug}`);
                        if (result.success && result.data) {
                            productData = result.data;
                        }
                    } else {
                        const response = await fetch(`${this.baseUrl}/products/${slug}`, {
                            headers: getAuthHeaders()
                        });
                        const result = await response.json();
                        if (result.success && result.data) {
                            productData = result.data;
                        }
                    }
                    if (productData) {
                        slugToProductDataMap.set(slug, productData);
                    }
                } catch (error) {
                    // /* console.warn */(`Failed to fetch product details for ${slug}:`, error);
                }
            }
            
            // Now fetch reviews for each slug
            for (const slug of slugsArray) {
                try {
                    let reviewsData = null;
                    if (apiCall) {
                        const result = await apiCall(`/reviews/product/${slug}?page=1&per_page=50&sort=newest`);
                        if (result.success && result.data) {
                            reviewsData = result.data;
                        }
                    } else {
                        const response = await fetch(`${this.baseUrl}/reviews/product/${slug}?page=1&per_page=50&sort=newest`, {
                            headers: getAuthHeaders()
                        });
                        const result = await response.json();
                        if (result.success && result.data) {
                            reviewsData = result.data;
                        }
                    }
                    
                    if (reviewsData && reviewsData.reviews && Array.isArray(reviewsData.reviews)) {
                        // /* console.log */(`Fetched ${reviewsData.reviews.length} reviews for product: ${slug}`);
                        
                        // Filter reviews by current user (match by email or name or user_id)
                        const userReviews = reviewsData.reviews.filter(review => {
                            // Try multiple field names for email
                            const reviewEmail = (
                                review.customer_email || 
                                review.user?.email || 
                                review.email ||
                                ''
                            ).toLowerCase().trim();
                            
                            // Try multiple field names for name
                            const reviewName = (
                                review.customer_name || 
                                review.user?.name || 
                                review.reviewer_name ||
                                review.name ||
                                ''
                            ).toLowerCase().trim();
                            
                            // Try multiple field names for user ID
                            const reviewUserId = review.user_id || review.user?.id || review.user_id || null;
                            
                            // Also check if review has auth token info (some backends store this)
                            const reviewAuthUserId = review.auth_user_id || review.authenticated_user_id || null;
                            
                            // Match by email, name, or user ID
                            const emailMatch = userEmail && reviewEmail && reviewEmail === userEmail;
                            const nameMatch = userName && reviewName && reviewName === userName;
                            const userIdMatch = currentUserId && (reviewUserId === currentUserId || reviewAuthUserId === currentUserId);
                            
                            // Also try partial name match (first name or last name) as fallback
                            const nameParts = userName.split(' ').filter(p => p.length > 0);
                            const reviewNameParts = reviewName.split(' ').filter(p => p.length > 0);
                            const partialNameMatch = nameParts.length > 0 && reviewNameParts.length > 0 && 
                                (nameParts.some(part => reviewNameParts.includes(part)) || 
                                 reviewNameParts.some(part => nameParts.includes(part)));
                            
                            // Log for debugging (only for first product and first few reviews to avoid spam)
                            if (reviewsData.reviews.length > 0 && slug === Array.from(productSlugs)[0] && allReviews.length === 0) {
                                const reviewIndex = reviewsData.reviews.indexOf(review);
                                if (reviewIndex < 3) { // Only log first 3 reviews
                                    // /* console.log */(`Review Filtering Debug (product: ${slug}, review #${reviewIndex + 1}):`, {
                                        userEmail: userEmail,
                                        userName: userName,
                                        currentUserId: currentUserId,
                                        reviewEmail: reviewEmail,
                                        reviewName: reviewName,
                                        reviewUserId: reviewUserId,
                                        reviewFields: {
                                            customer_email: review.customer_email,
                                            customer_name: review.customer_name,
                                            user_id: review.user_id,
                                            user: review.user
                                        },
                                        matches: {
                                            emailMatch: emailMatch,
                                            nameMatch: nameMatch,
                                            userIdMatch: userIdMatch,
                                            finalMatch: emailMatch || nameMatch || userIdMatch
                                        }
                                    });
                                }
                            }
                            
                            // Return true if any exact match is found (email, name, or user_id)
                            const isMatch = emailMatch || nameMatch || userIdMatch;
                            
                            // Enhanced logging for debugging (log first 5 reviews of first product)
                            if (reviewsData.reviews.length > 0 && slug === Array.from(productSlugs)[0] && allReviews.length === 0) {
                                const reviewIndex = reviewsData.reviews.indexOf(review);
                                if (reviewIndex < 5) {
                                    // /* console.log */(`Review #${reviewIndex + 1} Match Check:`, {
                                        isMatch: isMatch,
                                        userEmail: `"${userEmail}"`,
                                        reviewEmail: `"${reviewEmail}"`,
                                        emailMatch: emailMatch,
                                        userName: `"${userName}"`,
                                        reviewName: `"${reviewName}"`,
                                        nameMatch: nameMatch,
                                        currentUserId: currentUserId,
                                        reviewUserId: reviewUserId,
                                        userIdMatch: userIdMatch,
                                        reviewRaw: {
                                            customer_email: review.customer_email,
                                            customer_name: review.customer_name,
                                            user_id: review.user_id,
                                            user: review.user
                                        }
                                    });
                                }
                            }
                            
                            return isMatch;
                        });
                        
                        if (userReviews.length > 0) {
                            // /* console.log */(`Found ${userReviews.length} matching reviews for product: ${slug}`);
                        }
                        
                        // Add product info to each review
                        userReviews.forEach(review => {
                            // Get product image and name from multiple possible sources
                            let productImage = null;
                            let productName = slug;
                            
                            // First try from product data we fetched earlier (most reliable)
                            const fetchedProductData = slugToProductDataMap.get(slug);
                            if (fetchedProductData) {
                                productImage = fetchedProductData.image_url || 
                                             fetchedProductData.image ||
                                             (fetchedProductData.gallery_images && Array.isArray(fetchedProductData.gallery_images) && fetchedProductData.gallery_images.length > 0 ? 
                                                (fetchedProductData.gallery_images[0].image_url || fetchedProductData.gallery_images[0]) : null);
                                productName = fetchedProductData.name || fetchedProductData.title || slug;
                            }
                            
                            // Fallback to reviews API product data
                            if (!productImage && reviewsData.product) {
                                productImage = reviewsData.product.image_url || 
                                             reviewsData.product.image || 
                                             (reviewsData.product.gallery_images && Array.isArray(reviewsData.product.gallery_images) && reviewsData.product.gallery_images.length > 0 ? reviewsData.product.gallery_images[0] : null);
                                if (!productName || productName === slug) {
                                    productName = reviewsData.product.name || reviewsData.product.title || slug;
                                }
                            }
                            
                            // Last resort: try from product data we fetched by ID
                            if (!productImage && productIdToDataMap.size > 0) {
                                // Find product by slug in the stored product data
                                for (const [pid, pdata] of productIdToDataMap.entries()) {
                                    if (pdata.slug === slug) {
                                        productImage = pdata.image_url || 
                                                     pdata.image ||
                                                     (pdata.gallery_images && Array.isArray(pdata.gallery_images) && pdata.gallery_images.length > 0 ? pdata.gallery_images[0] : null);
                                        if (!productName || productName === slug) {
                                            productName = pdata.name || pdata.title || slug;
                                        }
                                        break;
                                    }
                                }
                            }
                            
                            review.product = {
                                slug: slug,
                                name: productName,
                                image: productImage,
                                image_url: productImage // Also set image_url for compatibility
                            };
                            
                            if (reviewsData.product) {
                                review.product = { 
                                    ...review.product, 
                                    ...reviewsData.product,
                                    // Ensure we have image and name - prioritize what we found
                                    image: productImage || reviewsData.product.image_url || reviewsData.product.image || 
                                          (reviewsData.product.gallery_images && Array.isArray(reviewsData.product.gallery_images) && reviewsData.product.gallery_images.length > 0 ? reviewsData.product.gallery_images[0] : null),
                                    image_url: productImage || reviewsData.product.image_url || reviewsData.product.image ||
                                              (reviewsData.product.gallery_images && Array.isArray(reviewsData.product.gallery_images) && reviewsData.product.gallery_images.length > 0 ? reviewsData.product.gallery_images[0] : null),
                                    name: productName || reviewsData.product.name || reviewsData.product.title || slug
                                };
                            }
                        });
                        
                        allReviews.push(...userReviews);
                    } else {
                        // /* console.warn */(`No reviews data found for product: ${slug}`);
                    }
                } catch (error) {
                    // Continue with next product if one fails
                    // /* console.error */(`Failed to fetch reviews for product ${slug}:`, error);
                }
            }
            
            // Sort by date (newest first) and paginate
            allReviews.sort((a, b) => {
                const dateA = new Date(a.created_at || a.date || 0);
                const dateB = new Date(b.created_at || b.date || 0);
                return dateB - dateA;
            });
            
            // /* console.log */('Total filtered reviews found:', allReviews.length, 'from', productSlugs.size, 'products');
            
            // If no reviews found but user has orders, log warning
            if (allReviews.length === 0 && orders.length > 0) {
                // /* console.warn */('No reviews found for user, but user has orders. Check:', {
                    userEmail: userEmail,
                    userName: userName,
                    currentUserId: currentUserId,
                    productSlugsCount: productSlugs.size,
                    ordersCount: orders.length
                });
            }
            
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
            return { success: false, message: 'Failed to load reviews from orders: ' + error.message };
        }
    }
};
