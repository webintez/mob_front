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
}

function createOrderCard(order) {
    // Get first item for display
    const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
    const product = firstItem?.product || {};
    
    // Get product image - try multiple sources
    let productImage = '/images/placeholder.svg';
    
    // Try item-level image first
    if (firstItem?.product_image_url) {
        productImage = firstItem.product_image_url;
    } else if (firstItem?.image_url) {
        productImage = firstItem.image_url;
    } else if (firstItem?.image) {
        productImage = firstItem.image;
    }
    // Then try product-level images
    else if (product.image_url) {
        productImage = product.image_url;
    } else if (product.image) {
        productImage = product.image;
    } else if (product.images && product.images.length > 0) {
        productImage = Array.isArray(product.images) ? product.images[0] : product.images;
    } else if (product.gallery_images && product.gallery_images.length > 0) {
        productImage = Array.isArray(product.gallery_images) ? product.gallery_images[0] : product.gallery_images;
    }
    
    // Ensure image URL is valid (not null, undefined, or empty)
    if (!productImage || productImage === 'null' || productImage === 'undefined' || productImage.trim() === '') {
        productImage = '/images/placeholder.svg';
    }
    
    // Get normalized order status
    const orderStatus = getOrderStatus(order);
    const paymentStatus = getPaymentStatus(order);
    
    // Calculate delivery date - use actual delivery date if available, otherwise estimate
    const orderDate = new Date(order.created_at || order.createdAt || Date.now());
    let deliveryDateStr = '';
    
    // Check for actual delivery date from API
    const deliveredAt = order.delivered_at || order.deliveredAt || order.delivery_date || order.delivered_date || null;
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Handle delivery date display based on order status
    if (orderStatus === 'delivered') {
        // Order is delivered - show delivery date or just "Delivered"
        if (deliveredAt) {
            const deliveryDate = new Date(deliveredAt);
            deliveryDateStr = `Delivered on ${days[deliveryDate.getDay()]} ${months[deliveryDate.getMonth()]} ${deliveryDate.getDate()}`;
        } else {
            // Status is delivered but no date available
            deliveryDateStr = 'Delivered';
        }
    } else {
        // Order is not yet delivered - show expected delivery date
        let expectedDeliveryDate = new Date(orderDate);
        expectedDeliveryDate.setDate(orderDate.getDate() + 3 + Math.floor(Math.random() * 3));
        deliveryDateStr = `Delivery expected by ${days[expectedDeliveryDate.getDay()]} ${months[expectedDeliveryDate.getMonth()]} ${expectedDeliveryDate.getDate()}`;
    }
    
    // Get order status message using normalized status
    const statusMessage = getStatusMessage(orderStatus);
    
    // Get product name (truncate if long)
    const productName = product.name || firstItem?.product_name || 'Product';
    const truncatedName = productName.length > 50 ? productName.substring(0, 50) + '...' : productName;
    
    // Get total price
    const totalPrice = order.total || order.summary?.total || 0;

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
                <div class="order-product-name">${escapeHtml(truncatedName)}</div>
                <div class="order-product-price">₹${formatPrice(totalPrice)}</div>
            </div>
            <div class="order-delivery-info">
                <div class="order-delivery-date">
                    <span class="order-delivery-icon"></span>
                    <span>${deliveryDateStr}</span>
                </div>
                <div class="order-status-message">${statusMessage}</div>
            </div>
        </div>
    `;

    return link;
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
