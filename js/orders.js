// Orders List Page JavaScript - Flipkart Style

let currentFilters = {
    status: [],
    time: [],
    search: ''
};

// Helper function to normalize order status (same as order.js)
function normalizeOrderStatus(status) {
    if (!status) return 'pending';
    
    const normalized = String(status).toLowerCase().trim();
    const statusMap = {
        'pending': 'pending',
        'confirmed': 'confirmed',
        'processing': 'processing',
        'processed': 'processing',
        'shipped': 'shipped',
        'out_for_delivery': 'out_for_delivery',
        'out for delivery': 'out_for_delivery',
        'outfordelivery': 'out_for_delivery',
        'delivered': 'delivered',
        'delivery': 'delivered',
        'cancelled': 'cancelled',
        'canceled': 'cancelled',
        'refunded': 'refunded'
    };
    
    return statusMap[normalized] || normalized;
}

// Helper function to get order status from API response
function getOrderStatus(order) {
    return normalizeOrderStatus(order.status || order.order_status || order.delivery_status || 'pending');
}

// Helper function to normalize payment status
function normalizePaymentStatus(status) {
    if (!status) return 'pending';
    
    const normalized = String(status).toLowerCase().trim();
    const paymentStatusMap = {
        'pending': 'pending',
        'paid': 'paid',
        'completed': 'paid',
        'success': 'paid',
        'successful': 'paid',
        'done': 'paid',
        'failed': 'failed',
        'refunded': 'refunded'
    };
    
    return paymentStatusMap[normalized] || normalized;
}

// Helper function to get payment status from API response
function getPaymentStatus(order) {
    return normalizePaymentStatus(order.payment_status || order.paymentStatus || 'pending');
}

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '/login.html?return=/orders.html';
        return;
    }

    // Setup login dropdown
    setupLoginDropdown();
    updateAuthUI();
    await updateCartCountInHeader();

    // Setup filters
    setupFilters();

    // Setup search
    setupSearch();

    // Load orders
    await loadOrders();
});

function setupFilters() {
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const filterType = checkbox.dataset.filter;
            const filterValue = checkbox.dataset.value;
            
            if (checkbox.checked) {
                // Add to filters array if not already present
                if (!currentFilters[filterType].includes(filterValue)) {
                    currentFilters[filterType].push(filterValue);
                }
            } else {
                // Remove from filters array
                currentFilters[filterType] = currentFilters[filterType].filter(v => v !== filterValue);
            }
            
            loadOrders();
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchOrdersInput');
    const searchBtn = document.getElementById('searchOrdersBtn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            if (searchInput) {
                currentFilters.search = searchInput.value.trim();
                loadOrders();
            }
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentFilters.search = searchInput.value.trim();
                loadOrders();
            }
        });
    }
}

async function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    const emptyOrders = document.getElementById('emptyOrders');
    const noMoreResults = document.getElementById('noMoreResults');
    
    // Show loading
    if (ordersList) {
        ordersList.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading orders...</p>
            </div>
        `;
    }

    // Build API filters
    const apiFilters = {};
    
    // Map status filters (can be multiple)
    if (currentFilters.status.length > 0) {
        const statusValues = [];
        currentFilters.status.forEach(status => {
            // Normalize status before adding to filter
            const normalizedStatus = normalizeOrderStatus(status);
            
            if (status === 'on_the_way' || normalizedStatus === 'on_the_way') {
                statusValues.push('shipped', 'processing', 'out_for_delivery');
            } else {
                statusValues.push(normalizedStatus);
            }
        });
        apiFilters.status = statusValues.join(',');
    }
    
    // Map time filters (can be multiple - use the most recent one)
    if (currentFilters.time.length > 0) {
        const now = new Date();
        // Sort time filters to prioritize most recent
        const sortedTimes = currentFilters.time.sort((a, b) => {
            const order = ['last_30_days', '2024', '2023', 'older'];
            return order.indexOf(a) - order.indexOf(b);
        });
        
        // Use the first (most recent) time filter
        const timeFilter = sortedTimes[0];
        if (timeFilter === 'last_30_days') {
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(now.getDate() - 30);
            apiFilters.start_date = thirtyDaysAgo.toISOString().split('T')[0];
        } else if (timeFilter === '2024') {
            apiFilters.start_date = '2024-01-01';
            apiFilters.end_date = '2024-12-31';
        } else if (timeFilter === '2023') {
            apiFilters.start_date = '2023-01-01';
            apiFilters.end_date = '2023-12-31';
        } else if (timeFilter === 'older') {
            apiFilters.end_date = '2022-12-31';
        }
    }
    
    // Add search
    if (currentFilters.search) {
        apiFilters.search = currentFilters.search;
    }

    const result = await ORDER_API.listOrders(apiFilters);

    if (result.success && result.data && result.data.length > 0) {
        displayOrders(result.data);
        
        if (emptyOrders) emptyOrders.style.display = 'none';
        if (ordersList) ordersList.style.display = 'block';
        if (noMoreResults) noMoreResults.style.display = 'block';
    } else {
        // Empty orders
        if (emptyOrders) emptyOrders.style.display = 'block';
        if (ordersList) ordersList.style.display = 'none';
        if (noMoreResults) noMoreResults.style.display = 'none';
    }
}

function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;

    ordersList.innerHTML = '';

    orders.forEach(order => {
        const orderCard = createOrderCard(order);
        ordersList.appendChild(orderCard);
    });

    // Inject review modal if not exists
    injectReviewModal();

    // Setup interactive star ratings if available
    setupRatings();
}

function createOrderCard(order) {
    // Get first item for display
    const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
    const product = firstItem?.product || {};
    
    // Get product image - try multiple sources
    let productImage = '/images/placeholder.svg';
    const firstProductImage = order.items && order.items.length > 0 ? (order.items[0].product_image_url || order.items[0].image_url) : null;
    productImage = firstProductImage || product.image_url || '/images/placeholder.svg';

    // Get normalized order status
    const orderStatus = getOrderStatus(order);
    const paymentStatus = getPaymentStatus(order);
    
    // Calculate delivery date - use actual delivery date if available
    const orderDate = new Date(order.created_at || order.createdAt || Date.now());
    let deliveryDateStr = '';
    
    const deliveredAt = order.delivered_at || order.deliveredAt || order.delivery_date || order.delivered_date || null;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (orderStatus === 'delivered') {
        if (deliveredAt) {
            const dDate = new Date(deliveredAt);
            deliveryDateStr = `Delivered on ${months[dDate.getMonth()]} ${dDate.getDate()}`;
        } else {
            deliveryDateStr = 'Delivered';
        }
    } else if (orderStatus === 'cancelled') {
        deliveryDateStr = `Cancelled`;
    } else {
        deliveryDateStr = getStatusMessage(orderStatus);
    }
    
    // Get product name (truncate if long)
    const productName = product.name || firstItem?.product_name || 'Product';
    const truncatedName = productName.length > 40 ? productName.substring(0, 40) + '...' : productName;

    const isDelivered = orderStatus === 'delivered';
    const isCancelled = orderStatus === 'cancelled';
    const isRefunded = paymentStatus === 'refunded';

    const link = document.createElement('a');
    link.href = `/order.html?order=${order.order_number}`;
    link.className = 'order-card-link';

    link.innerHTML = `
        <div class="order-card-content">
            <img src="${escapeHtml(productImage)}" 
                 alt="${escapeHtml(productName)}" 
                 class="order-product-image" 
                 onerror="this.onerror=null; this.src='/images/placeholder.svg';">
            
            <div class="order-product-details">
                <div class="order-status-title" style="font-weight: 500; font-size: 14px; color: ${isCancelled ? '#d32f2f' : (isRefunded ? '#388e3c' : '#212121')}">
                   ${deliveryDateStr}
                </div>
                <div class="order-product-name" style="font-size: 13px; color: #878787;">
                    ${escapeHtml(truncatedName)}
                    ${order.items && order.items.length > 1 ? `<sup style="color: #2874f0;"> (+${order.items.length - 1} more)</sup>` : ''}
                </div>
            </div>

            <div class="order-card-chevron">
                <i class="fas fa-chevron-right"></i>
            </div>

            ${isDelivered ? `
            <div class="order-rating-row" onclick="event.preventDefault();">
                <div class="star-items" data-slug="${escapeHtml(product.slug || '')}">
                    <i class="far fa-star rating-star" data-value="1"></i>
                    <i class="far fa-star rating-star" data-value="2"></i>
                    <i class="far fa-star rating-star" data-value="3"></i>
                    <i class="far fa-star rating-star" data-value="4"></i>
                    <i class="far fa-star rating-star" data-value="5"></i>
                </div>
                <div class="rating-text">Rate this product now</div>
            </div>
            ` : ''}
        </div>
    `;

    return link;
}

function setupRatings() {
    const starContainers = document.querySelectorAll('.star-items');
    
    starContainers.forEach(container => {
        const stars = container.querySelectorAll('.rating-star');
        const slug = container.getAttribute('data-slug');
        const textNode = container.nextElementSibling; // .rating-text
        
        if (!slug) return;

        stars.forEach(star => {
            star.addEventListener('mouseover', () => {
                highlightStars(stars, parseInt(star.getAttribute('data-value')));
            });
            
            star.addEventListener('mouseout', () => {
                highlightStars(stars, parseInt(container.getAttribute('data-selected') || '0'));
            });
            
            star.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const val = parseInt(star.getAttribute('data-value'));
                
                // Get product name and image from the card for the modal
                const card = container.closest('.order-card-link');
                const nameNode = card.querySelector('.order-product-name');
                const name = nameNode ? nameNode.textContent.replace(/\(\+\d+ more\)/, '').trim() : 'Product';
                const imgNode = card.querySelector('.order-product-image');
                const img = imgNode ? imgNode.src : '/images/placeholder.svg';
                
                openReviewModal(slug, name, img, val);
            });
        });
    });
}

function highlightStars(stars, val) {
    stars.forEach(s => {
        const sv = parseInt(s.getAttribute('data-value'));
        if (sv <= val) {
            s.classList.remove('far');
            s.classList.add('fas', 'active');
        } else {
            s.classList.remove('fas', 'active');
            s.classList.add('far');
        }
    });
}

async function submitRating(slug, ratingValue) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const payload = {
            product_slug: slug,
            rating: ratingValue,
            customer_name: user.name || 'User',
            review_text: ''
        };
        
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(payload)
        });
        
        return await response.json();
    } catch (e) {
        return { success: false, message: 'Rating API Error' };
    }
}

function getStatusMessage(status) {
    // Normalize status first to handle variations
    const normalizedStatus = normalizeOrderStatus(status);
    
    const messages = {
        'pending': 'Your Order has been placed.',
        'confirmed': 'Your Order has been confirmed.',
        'processing': 'Your Order is being processed.',
        'processed': 'Your Order is being processed.',
        'shipped': 'Your Order has been shipped.',
        'out_for_delivery': 'Your Order is out for delivery.',
        'delivered': 'Your Order has been delivered.',
        'cancelled': 'Your Order has been cancelled.',
        'canceled': 'Your Order has been cancelled.',
        'refunded': 'Your Order has been refunded.'
    };
    
    return messages[normalizedStatus] || messages[status] || 'Your Order has been placed.';
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
        min-width: 200px;
    `;
    
    // Add animation if not already added
    if (!document.getElementById('notification-styles-orders')) {
        const style = document.createElement('style');
        style.id = 'notification-styles-orders';
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
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after 3 seconds with fade-out
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
        notification.remove();
            }
        }, 300);
    }, 3000);
}

// Setup login dropdown
function setupLoginDropdown() {
    const loginBtn = document.getElementById('loginBtn');
    const loginDropdown = document.getElementById('loginDropdown');
    
    if (loginBtn && loginDropdown) {
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
        
        document.addEventListener('click', (e) => {
            if (!loginBtn.contains(e.target) && !loginDropdown.contains(e.target)) {
                loginDropdown.classList.remove('show');
            }
        });
        
        window.addEventListener('scroll', positionDropdown);
        window.addEventListener('resize', positionDropdown);
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --- Review Modal Integration ---

function injectReviewModal() {
    if (document.getElementById('reviewModalOverlay')) return;

    const modalHTML = `
        <div class="review-modal-overlay" id="reviewModalOverlay">
            <div class="review-modal">
                <div class="review-modal-header">
                    <h3>Write a Review</h3>
                    <button class="close-review-modal" id="closeReviewModal">&times;</button>
                </div>
                <div class="review-modal-body">
                    <div class="review-product-summary">
                        <img src="" alt="" class="review-product-image" id="reviewProductImage">
                        <div class="review-product-name" id="reviewProductName"></div>
                    </div>
                    <div class="review-stars-section">
                        <div class="review-stars-title">Rate this product</div>
                        <div class="review-star-picker" id="reviewStarPicker">
                            <i class="far fa-star" data-value="1"></i>
                            <i class="far fa-star" data-value="2"></i>
                            <i class="far fa-star" data-value="3"></i>
                            <i class="far fa-star" data-value="4"></i>
                            <i class="far fa-star" data-value="5"></i>
                        </div>
                    </div>
                    <div class="review-text-section">
                        <label class="review-text-label" for="reviewTextInput">Review description (Optional)</label>
                        <textarea class="review-textarea" id="reviewTextInput" placeholder="What did you like or dislike?"></textarea>
                    </div>
                </div>
                <div class="review-modal-footer">
                    <button class="btn-review-cancel" id="cancelReviewModal">Cancel</button>
                    <button class="btn-review-submit" id="submitReviewBtn">Submit</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setupModalEvents();
}

let activeReviewSlug = '';

function setupModalEvents() {
    const overlay = document.getElementById('reviewModalOverlay');
    const closeBtn = document.getElementById('closeReviewModal');
    const cancelBtn = document.getElementById('cancelReviewModal');
    const submitBtn = document.getElementById('submitReviewBtn');
    const pickerStars = document.querySelectorAll('#reviewStarPicker i');

    const closeModal = () => {
        overlay.classList.remove('active');
        const textInput = document.getElementById('reviewTextInput');
        if (textInput) textInput.value = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    // Star picker inside modal
    pickerStars.forEach(star => {
        star.addEventListener('click', () => {
            const val = parseInt(star.getAttribute('data-value'));
            const picker = document.getElementById('reviewStarPicker');
            if (picker) picker.setAttribute('data-selected', val);
            
            pickerStars.forEach(s => {
                const sv = parseInt(s.getAttribute('data-value'));
                if (sv <= val) {
                    s.classList.remove('far');
                    s.classList.add('fas', 'active');
                } else {
                    s.classList.remove('fas', 'active');
                    s.classList.add('far');
                }
            });
        });
    });

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const picker = document.getElementById('reviewStarPicker');
            const rating = parseInt(picker ? picker.getAttribute('data-selected') || '0' : '0');
            const textInput = document.getElementById('reviewTextInput');
            const text = textInput ? textInput.value.trim() : '';

            if (rating === 0) {
                showNotification('Please select a rating', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            const response = await submitReview(activeReviewSlug, rating, text);

            if (response.success) {
                showNotification('Review submitted successfully!');
                closeModal();
                loadOrders(); // Reload orders to update ratings if needed
            } else {
                showNotification(response.message || 'Failed to submit review', 'error');
            }

            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit';
        });
    }
}

function openReviewModal(slug, name, imageUrl, initialRating) {
    activeReviewSlug = slug;
    const overlay = document.getElementById('reviewModalOverlay');
    if (!overlay) return;

    const nameNode = document.getElementById('reviewProductName');
    const imgNode = document.getElementById('reviewProductImage');
    
    if (nameNode) nameNode.textContent = name;
    if (imgNode) imgNode.src = imageUrl || '/images/placeholder.svg';
    
    // Set initial rating
    const picker = document.getElementById('reviewStarPicker');
    if (picker) picker.setAttribute('data-selected', initialRating);
    const pickerStars = document.querySelectorAll('#reviewStarPicker i');
    
    pickerStars.forEach(s => {
        const sv = parseInt(s.getAttribute('data-value'));
        if (sv <= initialRating) {
            s.classList.remove('far');
            s.classList.add('fas', 'active');
        } else {
            s.classList.remove('fas', 'active');
            s.classList.add('far');
        }
    });

    overlay.classList.add('active');
}

async function submitReview(slug, ratingValue, text) {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const payload = {
            product_slug: slug,
            rating: ratingValue,
            customer_name: user.name || 'User',
            review_text: text || ''
        };
        
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(payload)
        });
        
        return await response.json();
    } catch (e) {
        return { success: false, message: 'Review API Error' };
    }
}
