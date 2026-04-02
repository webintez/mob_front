// Cancel Order Page JavaScript

const API_CONFIG = {
    baseUrl: '/api',
    apiKey: ''
};

let orderData = null;
let currentOrderNumber = '';
let currentItemId = '';

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    // Get order and item IDs from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentOrderNumber = urlParams.get('orderId') || '';
    currentItemId = urlParams.get('itemId') || '';

    if (!currentOrderNumber) {
        showError('Order number is required');
        return;
    }

    // Load order details
    await loadOrderDetails();

    // Setup form handlers
    setupFormHandlers();

    // Setup login dropdown
    setupLoginDropdown();

    // Update cart count
    updateCartCountInHeader();
});

async function loadOrderDetails() {
    try {
        const response = await fetch(`${API_CONFIG.baseUrl}/orders/${currentOrderNumber}`, {
            headers: {
                'X-API-Key': API_CONFIG.apiKey,
                ...getAuthHeaders()
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load order details');
        }

        const result = await response.json();
        orderData = result.data || result;

        // Update breadcrumb
        const orderNumberBreadcrumbLink = document.getElementById('orderNumberBreadcrumbLink');
        if (orderNumberBreadcrumbLink && orderData.order_number) {
            orderNumberBreadcrumbLink.textContent = orderData.order_number;
            orderNumberBreadcrumbLink.href = `/order.html?order=${orderData.order_number}`;
        }

        // Display item details
        displayItemDetails(orderData);

    } catch (error) {
        // /* console.error */('Error loading order details:', error);
        showError('Failed to load order details. Please try again.');
    }
}

function displayItemDetails(order) {
    const itemDetailsContent = document.getElementById('itemDetailsContent');
    if (!itemDetailsContent) return;

    const items = order.items || [];
    
    if (items.length === 0) {
        itemDetailsContent.innerHTML = '<p>No items found in this order.</p>';
        return;
    }

    // Filter items if itemId is provided, otherwise show all
    const displayItems = currentItemId ? 
        items.filter(item => (item.id === currentItemId || item.item_id === currentItemId)) : 
        items;

    let itemsHTML = '';

    displayItems.forEach(item => {
        const product = item.product || {};
        
        // Get product image
        let productImage = '/images/placeholder.svg';
        if (product.image_url) {
            productImage = product.image_url;
        } else if (item.product_image_url) {
            productImage = item.product_image_url;
        } else if (product.images && product.images.length > 0) {
            productImage = Array.isArray(product.images) ? product.images[0] : product.images;
        } else if (product.image) {
            productImage = product.image;
        }
        
        // Calculate prices
        const itemSubtotal = parseFloat(item.subtotal) || 
                            parseFloat(item.total) || 0;
        
        let originalPrice = parseFloat(item.original_price) ||
                           parseFloat(item.mrp) ||
                           parseFloat(item.original_price_per_unit) ||
                           parseFloat(product.original_price) || 
                           parseFloat(product.mrp) || 
                           parseFloat(product.maximum_retail_price) ||
                           parseFloat(product.price) || 0;
        
        let currentPrice = parseFloat(item.price) ||
                          parseFloat(item.selling_price) ||
                          parseFloat(item.discounted_price) ||
                          parseFloat(item.price_per_unit) ||
                          parseFloat(product.price) || 
                          parseFloat(product.selling_price) ||
                          parseFloat(product.discounted_price) || 0;
        
        if (itemSubtotal > 0 && item.quantity > 0) {
            const calculatedUnitPrice = itemSubtotal / item.quantity;
            if (currentPrice === 0) {
                currentPrice = calculatedUnitPrice;
            }
            if (originalPrice === 0) {
                originalPrice = calculatedUnitPrice;
            }
        }
        
        if (currentPrice === 0) {
            currentPrice = parseFloat(product.price) || 
                          parseFloat(product.selling_price) ||
                          parseFloat(product.discounted_price) ||
                          originalPrice;
        }
        
        if (originalPrice === 0 && currentPrice > 0) {
            originalPrice = currentPrice;
        }
        
        const quantity = item.quantity || 1;
        const itemCurrentTotal = itemSubtotal > 0 ? itemSubtotal : (currentPrice * quantity);

        itemsHTML += `
            <div class="item-details-item">
                <img src="${productImage}" 
                     alt="${product.name || 'Product'}" 
                     class="item-details-image"
                     onerror="this.src='/images/placeholder.svg'">
                <div class="item-details-info">
                    <p class="item-details-name">${product.name || 'Product'}</p>
                    <p class="item-details-qty">Qty: ${quantity}</p>
                    <p class="item-details-price">₹${formatPrice(itemCurrentTotal)}</p>
                </div>
            </div>
        `;
    });

    itemDetailsContent.innerHTML = itemsHTML;
}

function setupFormHandlers() {
    const cancelOrderForm = document.getElementById('cancelOrderForm');
    const cancelReason = document.getElementById('cancelReason');
    const cancelComments = document.getElementById('cancelComments');
    const continueBtn = document.getElementById('continueBtn');

    // Enable/disable continue button based on form validity
    function checkFormValidity() {
        const reason = cancelReason.value;
        const comments = cancelComments.value.trim();
        const isValid = reason && comments.length > 0;
        
        if (continueBtn) {
            continueBtn.disabled = !isValid;
        }
    }

    if (cancelReason) {
        cancelReason.addEventListener('change', checkFormValidity);
    }

    if (cancelComments) {
        cancelComments.addEventListener('input', checkFormValidity);
    }

    if (cancelOrderForm) {
        cancelOrderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleCancelOrder();
        });
    }
}

async function handleCancelOrder() {
    const cancelReason = document.getElementById('cancelReason');
    const cancelComments = document.getElementById('cancelComments');
    const continueBtn = document.getElementById('continueBtn');

    if (!cancelReason || !cancelComments) {
        showError('Please fill in all required fields');
        return;
    }

    const reason = cancelReason.value;
    const comments = cancelComments.value.trim();

    if (!reason || !comments) {
        showError('Please fill in all required fields');
        return;
    }

    // Disable button during submission
    if (continueBtn) {
        continueBtn.disabled = true;
        continueBtn.textContent = 'PROCESSING...';
    }

    try {
        // Combine reason and comments for the API
        const cancellationReason = `${reason}: ${comments}`;
        
        const result = await ORDER_API.cancelOrder(currentOrderNumber, cancellationReason);

        if (result.success) {
            showNotification('Order cancelled successfully', 'success');
            // Redirect to orders page after a short delay
            setTimeout(() => {
                window.location.href = '/orders.html';
            }, 1500);
        } else {
            showError(result.message || 'Failed to cancel order. Please try again.');
            if (continueBtn) {
                continueBtn.disabled = false;
                continueBtn.textContent = 'CONTINUE';
            }
        }
    } catch (error) {
        // /* console.error */('Error cancelling order:', error);
        showError('An error occurred while cancelling the order. Please try again.');
        if (continueBtn) {
            continueBtn.disabled = false;
            continueBtn.textContent = 'CONTINUE';
        }
    }
}

function setupLoginDropdown() {
    const loginBtn = document.getElementById('loginBtn');
    const loginDropdown = document.getElementById('loginDropdown');

    if (!loginBtn || !loginDropdown) return;

    // Update login button text if authenticated
    updateAuthUI();

    loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginDropdown.classList.toggle('show');
        positionDropdown(loginBtn, loginDropdown);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!loginBtn.contains(e.target) && !loginDropdown.contains(e.target)) {
            loginDropdown.classList.remove('show');
        }
    });
}

function positionDropdown(button, dropdown) {
    const rect = button.getBoundingClientRect();
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.top = `${rect.bottom + 4}px`;
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 0
    }).format(price);
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 24px',
        borderRadius: '4px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10001',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animation: 'slideIn 0.3s ease-out'
    });

    // Set background color based on type
    if (type === 'error') {
        notification.style.background = '#e53935';
    } else if (type === 'success') {
        notification.style.background = '#4caf50';
    } else {
        notification.style.background = '#2196f3';
    }

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
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

