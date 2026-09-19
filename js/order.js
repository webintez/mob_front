// Order Details Page JavaScript - Flipkart Style

let orderData = null;

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to normalize order status
function normalizeOrderStatus(status) {
    if (!status) return 'pending';

    const normalized = String(status).toLowerCase().trim();
    const statusMap = {
        'pending': 'pending',
        'confirmed': 'confirmed',
        'processing': 'processing',
        'processed': 'processing',
        'on_hold': 'on_hold',
        'ready_to_ship': 'ready_to_ship',
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

// Helper function to get order status from API response
function getOrderStatus(order) {
    return normalizeOrderStatus(order.status || order.order_status || order.delivery_status || 'pending');
}

// Helper function to get payment status from API response
function getPaymentStatus(order) {
    return normalizePaymentStatus(order.payment_status || order.paymentStatus || 'pending');
}

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
        return;
    }

    // Setup login dropdown
    setupLoginDropdown();
    updateAuthUI();
    await updateCartCountInHeader();

    // Get order number from URL
    const orderNumber = getOrderNumberFromURL();

    if (!orderNumber) {
        showError('Order number not found in URL. Please check your order details.');
        // Redirect to orders page if order number is invalid
        setTimeout(() => {
            window.location.href = '/orders.html';
        }, 3000);
        return;
    }

    // Load order
    await loadOrder(orderNumber);

    // Setup event listeners
    setupEventListeners();
});

function getOrderNumberFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('order');

    // Handle undefined or invalid order numbers
    if (!orderNumber || orderNumber === 'undefined' || orderNumber === 'null') {
        return null;
    }

    return orderNumber;
}

async function loadOrder(orderNumber) {
    const orderItemsSection = document.getElementById('orderItemsSection');

    // Show loading
    if (orderItemsSection) {
        orderItemsSection.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading order details...</p>
            </div>
        `;
    }

    try {
        const result = await ORDER_API.getOrder(orderNumber);

        if (result.success && result.data) {
            orderData = result.data;
            displayOrder(result.data);
        } else {
            // Handle unauthorized error
            if (result.unauthorized) {
                showError('Please login to view order details');
                setTimeout(() => {
                    window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
                }, 2000);
            } else {
                showError(result.message || 'Order not found. Please check the order number.');
                // Redirect to orders page after showing error
                setTimeout(() => {
                    window.location.href = '/orders.html';
                }, 3000);
            }
        }
    } catch (error) {
        // /* console.error */('Error loading order:', error);
        showError('Failed to load order. Please try again.');
        setTimeout(() => {
            window.location.href = '/orders.html';
        }, 3000);
    }
}

function displayOrder(order) {
    // Update breadcrumb
    const orderNumberBreadcrumb = document.getElementById('orderNumberBreadcrumb');
    if (orderNumberBreadcrumb) {
        orderNumberBreadcrumb.textContent = order.order_number || 'Order Details';
    }

    // Display order tracking info
    displayOrderTrackingInfo(order);

    // Display payment prompt if needed
    displayPaymentPrompt(order);

    // Display order items - pass order object so status can be checked
    displayOrderItems(order.items || [], order);

    // Display order timeline
    displayOrderTimeline(order);

    // Display delivery executive note
    displayDeliveryExecutiveNote(order);

    // Display order actions
    displayOrderActions(order);

    // Display order number
    displayOrderNumber(order);

    // Display delivery details
    displayDeliveryDetails(order);

    // Display price details
    displayPriceDetails(order);

    // Display recommendations
    loadRecentlyViewed();
    loadInterestedIn();

    // Display Delivery OTP if present
    displayDeliveryOTP(order);
}

function displayOrderTrackingInfo(order) {
    const orderTrackingInfo = document.getElementById('orderTrackingInfo');
    const trackingPhone = document.getElementById('trackingPhone');

    if (orderTrackingInfo && order.shipping_address?.phone) {
        if (trackingPhone) {
            trackingPhone.textContent = order.shipping_address.phone;
        }
        orderTrackingInfo.style.display = 'flex';
    }
}

function displayPaymentPrompt(order) {
    const paymentPrompt = document.getElementById('paymentPrompt');
    const payAmount = document.getElementById('payAmount');

    // Get normalized payment status
    const paymentStatus = getPaymentStatus(order);

    // Only show payment prompt if payment is pending and order total exists
    if (paymentPrompt && paymentStatus === 'pending' && order.total) {
        if (payAmount) {
            payAmount.textContent = formatPrice(order.total);
        }
        paymentPrompt.style.display = 'flex';
    } else if (paymentPrompt) {
        // Hide payment prompt if payment is completed
        paymentPrompt.style.display = 'none';
    }
}

function displayOrderItems(items, order = null) {
    const orderItemsSection = document.getElementById('orderItemsSection');
    if (!orderItemsSection) return;

    if (items.length === 0) {
        orderItemsSection.innerHTML = '<p>No items found in this order.</p>';
        return;
    }

    const orderObj = order || orderData || {};
    let itemsHTML = '';

    items.forEach((item, index) => {
        const product = item.product || {};
        const productName = product.name || item.product_name || item.name || 'Product';
        
        let productImage = '/images/placeholder.svg';
        if (product.image_url) productImage = product.image_url;
        else if (item.product_image_url) productImage = item.product_image_url;
        else if (product.images?.[0]) productImage = product.images[0];

        const quantity = item.quantity || 1;
        const price = parseFloat(item.price) || parseFloat(item.selling_price) || 0;
        const itemTotal = parseFloat(item.subtotal) || (price * quantity);
        
        let productSlug = product.slug || item.product_slug || item.slug || '';
        if (!productSlug && productName && productName !== 'Product') {
            productSlug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }

        itemsHTML += `
            <div class="order-item-card">
                <div class="order-item-image-wrapper">
                    <img src="${productImage}" alt="${escapeHtml(productName)}" class="order-item-image" onerror="this.src='/images/placeholder.svg'">
                </div>
                <div class="order-item-details">
                    <a href="/product.html?slug=${productSlug}" class="order-item-name-link">
                        ${escapeHtml(productName)}
                    </a>
                    <div class="order-item-seller">Seller: ${product.seller || 'Mobitez Private Limited'}</div>
                    <div class="order-item-specs">
                        ${[product.color, product.ram ? `${product.ram}GB RAM` : '', product.storage ? `${product.storage}GB ROM` : ''].filter(Boolean).join(', ')}
                    </div>
                    <div class="item-price-row">₹${formatPrice(itemTotal)}</div>
                </div>
            </div>
        `;
    });

    orderItemsSection.innerHTML = itemsHTML;
}

function displayOrderTimeline(order) {
    const status = getOrderStatus(order);
    const timelineProgress = document.getElementById('timelineProgress');
    const pointsContainer = document.getElementById('timelinePointsContainer');
    const horizontalTimelineWrapper = document.getElementById('horizontalTimelineWrapper');

    if (!timelineProgress || !pointsContainer) return;

    // Check if cancelled or refunded
    if (['cancelled', 'refunded'].includes(status)) {
        pointsContainer.style.justifyContent = 'center';
        pointsContainer.innerHTML = `
            <div class="point cancelled" data-label="${status === 'cancelled' ? 'Cancelled' : 'Refunded'}">
                <div class="dot active"></div>
                <div class="label">${status === 'cancelled' ? 'Order Cancelled' : 'Order Refunded'}</div>
                <div class="date">${status.charAt(0).toUpperCase() + status.slice(1)}</div>
            </div>
        `;
        timelineProgress.style.width = '0%';
        updateMainStatusTitles(status);
        return;
    } else {
        pointsContainer.style.justifyContent = 'space-between';
    }

    // Default static points
    pointsContainer.innerHTML = `
        <div class="point confirmed" data-label="Order Confirmed">
            <div class="dot"></div>
            <div class="label">Order Confirmed</div>
            <div class="date" id="confirmedDateLabel">...</div>
        </div>
        <div class="point shipped" data-label="Shipped">
            <div class="dot"></div>
            <div class="label">Shipped</div>
            <div class="date" id="shippedDateLabel">...</div>
        </div>
        <div class="point delivery" data-label="Delivery">
            <div class="dot"></div>
            <div class="label">Delivery</div>
            <div class="date" id="deliveryDateLabel">...</div>
        </div>
    `;

    const points = pointsContainer.querySelectorAll('.point');
    const createdAt = new Date(order.created_at || order.createdAt || Date.now());
    
    // Set dates
    const confirmedDateLabel = document.getElementById('confirmedDateLabel');
    const shippedDateLabel = document.getElementById('shippedDateLabel');
    const deliveryDateLabel = document.getElementById('deliveryDateLabel');

    if (confirmedDateLabel) {
        confirmedDateLabel.textContent = formatTimelineDate(createdAt).split(',')[0];
    }

    let progressWidth = '0%';
    let activeIndex = -1;

    // Mapping based on linear progression
    if (['confirmed', 'processing', 'ready_to_ship', 'on_hold', 'pending'].includes(status)) {
        progressWidth = '0%';
        activeIndex = 0;
        if (shippedDateLabel) shippedDateLabel.textContent = formatExpectedDate(createdAt, 1);
        if (deliveryDateLabel) deliveryDateLabel.textContent = 'Expected ' + formatExpectedDate(createdAt, 3);
    } else if (status === 'shipped') {
        progressWidth = '50%';
        activeIndex = 1;
        if (shippedDateLabel) shippedDateLabel.textContent = 'Shipped';
        if (deliveryDateLabel) deliveryDateLabel.textContent = 'Expected ' + formatExpectedDate(createdAt, 3);
    } else if (['delivered', 'out_for_delivery'].includes(status)) {
        progressWidth = '100%';
        activeIndex = 2;
        if (shippedDateLabel) shippedDateLabel.textContent = 'Shipped';
        if (deliveryDateLabel) deliveryDateLabel.textContent = status === 'delivered' ? 'Delivered' : 'Arriving Today';
    }

    timelineProgress.style.width = progressWidth;

    points.forEach((point, index) => {
        const dot = point.querySelector('.dot');
        if (index <= activeIndex) {
            point.classList.add('active');
            if (dot) dot.classList.add('active');
        }
    });

    updateMainStatusTitles(status);

    // Call public Shiprocket API if shipped/delivered
    if (['shipped', 'out_for_delivery', 'delivered'].includes(status)) {
        loadLiveTracking(order.order_number);
    }
}

// Global variable to store tracking info
let liveTrackingData = null;

function showDetailedTracking() {
    if (!orderData) return;

    const modal = document.getElementById('detailedTrackingModal');
    const orderIdModal = document.getElementById('trackingOrderIdModal');
    const timeline = document.getElementById('detailedVerticalTimeline');

    if (!modal || !timeline) return;

    if (orderIdModal) orderIdModal.textContent = `ID - ${orderData.order_number}`;
    
    // Render the detailed timeline
    renderDetailedTimeline(orderData, liveTrackingData);

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scroll
}

function renderDetailedTimeline(order, tracking) {
    const timeline = document.getElementById('detailedVerticalTimeline');
    if (!timeline) return;

    const status = getOrderStatus(order);
    const createdAt = new Date(order.created_at || order.createdAt || Date.now());
    
    let html = '';

    let shippedDesc = 'Your item has been picked up by courier.';
    if (order.shipping_company_name === 'Private Shipping' && order.seller_info && order.seller_info.company_name) {
        shippedDesc = 'Shipped by ' + order.seller_info.company_name;
    }

    // System Statuses Mapping
    const steps = [
        { id: 'pending', name: 'Order Placed', desc: 'We have received your order.' },
        { id: 'confirmed', name: 'Order Confirmed', desc: 'Your order has been confirmed.' },
        { id: 'processing', name: 'Order Processed', desc: 'Your order is being prepared.' },
        { id: 'ready_to_ship', name: 'Ready to Ship', desc: 'Your item is packed and ready.' },
        { id: 'shipped', name: 'Shipped', desc: shippedDesc },
        { id: 'delivered', name: 'Delivered', desc: 'Your item has been delivered.' }
    ];

    // Determine current index for flow
    const statusOrder = ['pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'delivered'];
    let currentIndex = statusOrder.indexOf(status);
    
    if (currentIndex === -1) {
        if (status === 'on_hold') currentIndex = 1; // After confirmed
        if (status === 'out_for_delivery') currentIndex = 4; // After shipped
        if (status === 'cancelled' || status === 'refunded') {
            currentIndex = 1; // Assume cancelled after confirmation for visual flow
        }
    }

    steps.forEach((step, index) => {
        // If it's cancelled, we stop showing future steps as potentially active
        const isCancelledOrRefunded = status === 'cancelled' || status === 'refunded';
        
        let isCompleted = index <= currentIndex;
        let isActive = index === currentIndex;
        
        // If order is cancelled, current steps are green, but future steps after the cancellation point are basically hidden or shown as is
        // BUT the user wants the "Sequence" of where it was cancelled.
        
        const dateStr = isCompleted ? formatTimelineDate(createdAt) : '';

        // Only show steps up to the cancellation or the full timeline if active
        if (isCancelledOrRefunded && index > currentIndex) {
            return; // Skip future steps in detailed view if cancelled
        }

        html += `
            <div class="detailed-timeline-item ${isCompleted ? 'completed' : 'pending'} ${isActive ? 'active' : ''}">
                <div class="status-dot"></div>
                <div class="status-info">
                    <div class="status-name">${step.name}</div>
                    ${dateStr ? `<div class="status-time">${dateStr}</div>` : ''}
                    <div class="status-desc">${step.desc}</div>
                </div>
            </div>
        `;

        // At exactly where it was cancelled, we add the cancellation mark
        if (isCancelledOrRefunded && isActive) {
            html += `
                <div class="detailed-timeline-item cancelled active">
                    <div class="status-dot"></div>
                    <div class="status-info">
                        <div class="status-name">${status === 'cancelled' ? 'Order Cancelled' : 'Order Refunded'}</div>
                        <div class="status-time">${formatTimelineDate(new Date(order.updated_at || order.updatedAt || Date.now()))}</div>
                        <div class="status-desc">${order.cancellation_reason || 'This order was cancelled.'}</div>
                    </div>
                </div>
            `;
        }

        // If we have live tracking and just finished "Shipped" step, inject live history
        if (step.id === 'shipped' && isCompleted && tracking && tracking.tracking_history && !isCancelledOrRefunded) {
            tracking.tracking_history.forEach(log => {
                const logDate = log.timestamp || log.date ? new Date(log.timestamp || log.date).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
                html += `
                    <div class="detailed-timeline-item completed">
                        <div class="status-dot" style="width: 8px; height: 8px; left: 1px;"></div>
                        <div class="status-info">
                            <div class="status-name" style="font-size: 13px;">${escapeHtml(log.message || log.status)}</div>
                            <div class="status-time">${logDate}</div>
                            ${log.location ? `<div class="status-desc">${escapeHtml(log.location)}</div>` : ''}
                        </div>
                    </div>
                `;
            });
        }
    });

    timeline.innerHTML = html;
}

function displayDeliveryOTP(order) {
    const otpContainer = document.getElementById('deliveryOTPContainer');
    const otpCodeDisplay = document.getElementById('otpCodeDisplay');
    const status = getOrderStatus(order);

    // Only show OTP if present AND order is NOT delivered/cancelled/refunded
    if (otpContainer && order.delivery_otp && !['delivered', 'cancelled', 'refunded'].includes(status)) {
        if (otpCodeDisplay) {
            otpCodeDisplay.textContent = order.delivery_otp;
        }
        otpContainer.style.display = 'block';
    } else if (otpContainer) {
        otpContainer.style.display = 'none';
    }
}

function updateMainStatusTitles(status) {
    const statusTitle = document.getElementById('statusTitle');
    const statusSubtitle = document.getElementById('statusSubtitle');
    const statusBoxCard = document.getElementById('statusBoxCard');

    // Reset status box theme
    if (statusBoxCard) {
        statusBoxCard.classList.remove('cancelled', 'refunded');
    }

    if (statusTitle) {
        statusTitle.textContent = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
    }
    if (statusSubtitle) {
        if (status === 'confirmed') statusSubtitle.textContent = 'Your Order has been placed.';
        else if (status === 'shipped') {
            if (orderData && orderData.shipping_company_name === 'Private Shipping' && orderData.seller_info && orderData.seller_info.company_name) {
                statusSubtitle.textContent = 'Shipped by ' + orderData.seller_info.company_name;
            } else {
                statusSubtitle.textContent = 'Your item has been shipped.';
            }
        }
        else if (status === 'delivered') statusSubtitle.textContent = 'Your item has been delivered.';
        else if (status === 'cancelled') {
            statusSubtitle.textContent = 'This order has been cancelled.';
            if (statusBoxCard) statusBoxCard.classList.add('cancelled');
        }
        else if (status === 'refunded') {
            statusSubtitle.textContent = 'This order has been refunded.';
            if (statusBoxCard) statusBoxCard.classList.add('refunded');
        }
        else statusSubtitle.textContent = 'Update on your order.';
    }
}

async function loadLiveTracking(orderNumber) {
    const container = document.getElementById('shiprocketTrackingContainer');
    if (!container) return;
    
    // Don't show loading on screen, just fetch background
    // container.innerHTML = `<div style="padding: 16px; text-align: center; color: #666; font-size: 14px;">Fetching live tracking details...</div>`;
    // container.style.display = 'block';

    const result = await ORDER_API.trackOrder(orderNumber);

    if (result.success && result.tracking_history && result.tracking_history.length > 0) {
        liveTrackingData = result; // Store for detailed view
        
        // Update horizontal overview if it's shipped but not yet delivered
        const status = getOrderStatus(orderData);
        if (status === 'shipped') {
            const deliveryDateLabel = document.getElementById('deliveryDateLabel');
            if (deliveryDateLabel && result.expected_delivery_date) {
                deliveryDateLabel.textContent = 'Expected ' + new Date(result.expected_delivery_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            }
        }
    }
}

// Recommendations Logic
async function loadRecentlyViewed() {
    const section = document.getElementById('recentlyViewedSection');
    const productsContainer = document.getElementById('recentlyViewedProducts');
    
    if (!section || !productsContainer || typeof getRecentlyViewedProductsLimited !== 'function') return;

    const products = getRecentlyViewedProductsLimited(10);
    
    if (products.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    productsContainer.innerHTML = '';

    products.forEach(product => {
        if (typeof ProductCard !== 'undefined') {
            const card = ProductCard.toElement(product, {
                extraClass: 'homepage-product-card'
            });
            productsContainer.appendChild(card);
        }
    });

    setupSectionScroll('recentlyViewedScroll', 'recentlyViewedScrollLeft', 'recentlyViewedScrollRight');
}

async function loadInterestedIn() {
    const section = document.getElementById('interestedInSection');
    const productsContainer = document.getElementById('interestedInProducts');
    
    if (!section || !productsContainer || typeof WISHLIST_API === 'undefined') return;

    try {
        const result = await WISHLIST_API.getWishlist();
        
        if (result.success && result.data && result.data.length > 0) {
            section.style.display = 'block';
            productsContainer.innerHTML = '';
            
            result.data.forEach(item => {
                const product = item.product || item;
                if (typeof ProductCard !== 'undefined') {
                    const card = ProductCard.toElement(product, {
                        extraClass: 'homepage-product-card'
                    });
                    
                    // Add "Add to cart" button similar to cart page
                    const btnWrapper = document.createElement('div');
                    btnWrapper.style.padding = '0 12px 12px';
                    btnWrapper.innerHTML = `
                        <button class="btn-shop-more" style="width: 100%; border-radius: 4px; padding: 8px; font-size: 12px;" onclick="addToCartFromRec(${product.id})">Add to cart</button>
                    `;
                    card.appendChild(btnWrapper);
                    
                    productsContainer.appendChild(card);
                }
            });
        } else {
            section.style.display = 'none';
        }
    } catch (error) {
        console.error('Wishlist load failed:', error);
        section.style.display = 'none';
    }
}

function setupSectionScroll(scrollId, leftBtnId, rightBtnId) {
    const container = document.getElementById(scrollId);
    const leftBtn = document.getElementById(leftBtnId);
    const rightBtn = document.getElementById(rightBtnId);

    if (!container || !leftBtn || !rightBtn) return;

    const updateBtns = () => {
        leftBtn.style.display = container.scrollLeft > 20 ? 'flex' : 'none';
        rightBtn.style.display = container.scrollLeft < (container.scrollWidth - container.clientWidth - 20) ? 'flex' : 'none';
    };

    leftBtn.onclick = () => container.scrollBy({ left: -300, behavior: 'smooth' });
    rightBtn.onclick = () => container.scrollBy({ left: 300, behavior: 'smooth' });
    
    container.onscroll = updateBtns;
    window.onresize = updateBtns;
    setTimeout(updateBtns, 100);
}

// Global helper for recommendation cards
window.addToCartFromRec = async function(productId) {
    if (typeof CART_API !== 'undefined') {
        const result = await CART_API.addToCart(productId, 1);
        if (result.success) {
            showNotification('Added to cart');
            updateCartCountInHeader();
        } else {
            showNotification(result.message || 'Failed to add', 'error');
        }
    }
};

function displayDeliveryExecutiveNote(order) {
    const deliveryInfoBox = document.getElementById('deliveryInfoBox');
    const status = getOrderStatus(order);

    if (deliveryInfoBox) {
        if (status === 'out_for_delivery') {
            deliveryInfoBox.innerHTML = `
                <i class="fas fa-truck-fast info-icon"></i>
                <div class="info-text">
                    <strong>Arriving Today</strong><br>
                    Your order is out for delivery with our executive.
                </div>
            `;
            deliveryInfoBox.style.display = 'flex';
        } else if (status === 'delivered') {
            deliveryInfoBox.style.display = 'none';
        } else {
            deliveryInfoBox.style.display = 'flex';
        }
    }
}

function displayOrderActions(order) {
    const cancelOrderBtn = document.getElementById('cancelOrderBtn');

    // Get normalized status
    const status = getOrderStatus(order);

    // Show cancel button if order can be cancelled
    if (cancelOrderBtn) {
        const canCancel = ['pending', 'confirmed', 'processing'].includes(status);
        cancelOrderBtn.style.display = canCancel ? 'block' : 'none';
    }
}

function displayOrderNumber(order) {
    const orderNumberDisplay = document.getElementById('orderNumberDisplay');

    if (orderNumberDisplay && order.order_number) {
        orderNumberDisplay.textContent = order.order_number;
    }
}

function displayDeliveryDetails(order) {
    const address = order.shipping_address;
    if (!address) return;

    const addressType = document.getElementById('addressType');
    const deliveryAddressText = document.getElementById('deliveryAddressText');
    const deliveryContactName = document.getElementById('deliveryContactName');
    const deliveryContactPhone = document.getElementById('deliveryContactPhone');

    if (addressType) {
        addressType.textContent = address.address_type === 'work' ? 'Work' : 'Home';
    }

    if (deliveryAddressText) {
        const addressLines = [
            address.address_line1,
            address.address_line2,
            `${address.city}, ${address.state} ${address.postal_code}`
        ].filter(Boolean);
        deliveryAddressText.textContent = addressLines.join(', ');
    }

    if (deliveryContactName) {
        deliveryContactName.textContent = address.name || '-';
    }

    if (deliveryContactPhone) {
        deliveryContactPhone.textContent = address.phone || '-';
    }

    const orderIdFooter = document.getElementById('orderIdFooter');
    if (orderIdFooter && order.order_number) {
        orderIdFooter.textContent = order.order_number;
    }
}

function displayPriceDetails(order) {
    const listingPrice = document.getElementById('listingPrice');
    const specialPrice = document.getElementById('specialPrice');
    const totalFees = document.getElementById('totalFees');
    const totalAmount = document.getElementById('totalAmount');
    const paymentMethodDisplay = document.getElementById('paymentMethodDisplay');

    // Calculate from items - same logic as displayOrderItems
    const items = order.items || [];
    let totalOriginalPrice = 0;  // Listing Price
    let totalCurrentPrice = 0;   // Special Price (itemCurrentTotal sum)

    items.forEach(item => {
        const product = item.product || {};

        // Item subtotal (total price for this item)
        const itemSubtotal = parseFloat(item.subtotal) ||
            parseFloat(item.total) || 0;

        // Original price (before discount) - MRP per unit
        let originalPrice = parseFloat(item.original_price) ||
            parseFloat(item.mrp) ||
            parseFloat(item.original_price_per_unit) ||
            parseFloat(product.original_price) ||
            parseFloat(product.mrp) ||
            parseFloat(product.maximum_retail_price) ||
            parseFloat(product.price) || 0;

        // Current price (after discount) - Selling Price per unit
        let currentPrice = parseFloat(item.price) ||
            parseFloat(item.selling_price) ||
            parseFloat(item.discounted_price) ||
            parseFloat(item.price_per_unit) ||
            parseFloat(product.price) ||
            parseFloat(product.selling_price) ||
            parseFloat(product.discounted_price) || 0;

        // If we have item subtotal, calculate unit price from it
        if (itemSubtotal > 0 && item.quantity > 0) {
            const calculatedUnitPrice = itemSubtotal / item.quantity;
            if (currentPrice === 0) {
                currentPrice = calculatedUnitPrice;
            }
            if (originalPrice === 0) {
                originalPrice = calculatedUnitPrice;
            }
        }

        // If current price is still 0, try to get from product
        if (currentPrice === 0) {
            currentPrice = parseFloat(product.price) ||
                parseFloat(product.selling_price) ||
                parseFloat(product.discounted_price) ||
                originalPrice;
        }

        // If original price is 0 but we have current price, use current as original
        if (originalPrice === 0 && currentPrice > 0) {
            originalPrice = currentPrice;
        }

        // Calculate totals - same logic as in displayOrderItems
        const quantity = item.quantity || 1;
        const itemCurrentTotal = itemSubtotal > 0 ? itemSubtotal : (currentPrice * quantity);
        const itemOriginalTotal = originalPrice * quantity;

        // Sum up totals
        totalOriginalPrice += itemOriginalTotal;
        totalCurrentPrice += itemCurrentTotal;
    });

    // Total Fees = ₹7 per item
    let totalQuantity = 0;
    items.forEach(item => {
        totalQuantity += (parseInt(item.quantity) || 1);
    });
    
    const platformFee = totalQuantity * 7;

    // Total Amount = Special Price + Total Fees
    const total = totalCurrentPrice + platformFee;

    // Display prices
    // Listing price = Total Original Price (sum of all item original prices)
    if (listingPrice) {
        listingPrice.textContent = `₹${formatPrice(totalOriginalPrice)}`;
    }

    // Special price = Total Current Price (sum of all itemCurrentTotal)
    if (specialPrice) {
        specialPrice.textContent = `₹${formatPrice(totalCurrentPrice)}`;
    }

    // Total fees = Platform fee from API
    if (totalFees) {
        totalFees.textContent = `₹${formatPrice(platformFee)}`;
    }

    // Total amount = Special price + Total fees
    if (totalAmount) {
        totalAmount.textContent = `₹${formatPrice(total)}`;
    }

    if (paymentMethodDisplay) {
        const paymentMethod = order.payment_method || 'cod';
        const methodText = paymentMethod === 'cod' ? 'Cash On Delivery' :
            paymentMethod === 'online' ? 'Online Payment' :
                paymentMethod === 'wallet' ? 'Wallet' : 'Cash On Delivery';
        paymentMethodDisplay.textContent = methodText;
    }

    // /* console.log */('Price Details Calculation:', {
    //     itemsCount: items.length,
    //     totalOriginalPrice: `₹${formatPrice(totalOriginalPrice)} (Listing Price)`,
    //     totalCurrentPrice: `₹${formatPrice(totalCurrentPrice)} (Special Price - sum of itemCurrentTotal)`,
    //     platformFee: `₹${formatPrice(platformFee)}`,
    //     total: `₹${formatPrice(total)} (Special Price + Fees)`,
    //     orderSummary: summary,
    //     orderTotal: order.total
    // });
}

function setupEventListeners() {
    // Pay now button
    const payNowBtn = document.getElementById('payNowBtn');
    if (payNowBtn) {
        payNowBtn.addEventListener('click', () => {
            showNotification('Payment functionality will be implemented soon', 'info');
        });
    }

    // Cancel order button
    const cancelOrderBtn = document.getElementById('cancelOrderBtn');
    if (cancelOrderBtn) {
        cancelOrderBtn.addEventListener('click', () => {
            showCancelConfirmationPopup(orderData);
        });
    }

    // Setup cancel popup handlers
    setupCancelPopup(orderData);

    // Setup review buttons for delivered products
    setupReviewButtons();

    // Chat button
    const chatBtn = document.getElementById('chatBtn');
    if (chatBtn) {
        chatBtn.addEventListener('click', () => {
            showNotification('Chat functionality will be implemented soon', 'info');
        });
    }

    // Copy order number
    const copyOrderBtn = document.getElementById('copyOrderBtn');
    if (copyOrderBtn) {
        copyOrderBtn.addEventListener('click', () => {
            if (orderData && orderData.order_number) {
                navigator.clipboard.writeText(orderData.order_number).then(() => {
                    showNotification('Order number copied to clipboard', 'success');
                });
            }
        });
    }

    // Help button
    const helpBtnTop = document.getElementById('helpBtnTop');
    if (helpBtnTop) {
        helpBtnTop.addEventListener('click', () => {
            showNotification('Help center will open soon', 'info');
        });
    }

    // Share button
    const shareBtnTop = document.getElementById('shareBtnTop');
    if (shareBtnTop) {
        shareBtnTop.addEventListener('click', () => {
            if (navigator.share) {
                navigator.share({
                    title: 'My Order Details',
                    text: `Check out my order ${orderData?.order_number || ''}`,
                    url: window.location.href
                }).catch(() => {
                    showNotification('Error sharing order details', 'error');
                });
            } else {
                showNotification('Sharing not supported on this browser', 'info');
            }
        });
    }

    // Send order details
    const sendDetailsBtn = document.getElementById('sendDetailsBtn');
    if (sendDetailsBtn) {
        sendDetailsBtn.addEventListener('click', () => {
            showNotification('Send order details functionality will be implemented soon', 'info');
        });
    }

    // Rate button
    const rateBtn = document.getElementById('rateBtn');
    if (rateBtn) {
        rateBtn.addEventListener('click', () => {
            showNotification('Rating functionality will be implemented soon', 'info');
        });
    }

    // See all updates
    const seeAllUpdatesBtn = document.getElementById('seeAllUpdatesBtn');
    if (seeAllUpdatesBtn) {
        seeAllUpdatesBtn.addEventListener('click', () => {
            showDetailedTracking();
        });
    }

    // Modal close button
    const closeTrackingModal = document.getElementById('closeTrackingModal');
    const detailedTrackingModal = document.getElementById('detailedTrackingModal');
    if (closeTrackingModal && detailedTrackingModal) {
        closeTrackingModal.addEventListener('click', () => {
            detailedTrackingModal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scroll
        });
    }

    // OTP Button & Popup
    const showOTPBtn = document.getElementById('showOTPBtn');
    const otpPopupOverlay = document.getElementById('otpPopupOverlay');
    const otpPopupClose = document.getElementById('otpPopupClose');

    if (showOTPBtn && otpPopupOverlay) {
        showOTPBtn.addEventListener('click', () => {
            otpPopupOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }

    if (otpPopupClose && otpPopupOverlay) {
        otpPopupClose.addEventListener('click', () => {
            otpPopupOverlay.style.display = 'none';
            document.body.style.overflow = '';
        });
    }

    if (otpPopupOverlay) {
        otpPopupOverlay.addEventListener('click', (e) => {
            if (e.target === otpPopupOverlay) {
                otpPopupOverlay.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
}

function showCancelConfirmationPopup(order) {
    const popupOverlay = document.getElementById('cancelPopupOverlay');
    const popupClose = document.getElementById('cancelPopupClose');
    const popupDontCancel = document.getElementById('cancelPopupDontCancel');
    const popupCancelOrder = document.getElementById('cancelPopupCancelOrder');
    const popupSavingsText = document.getElementById('cancelPopupSavingsText');
    const popupProductImage = document.getElementById('cancelPopupProductImage');

    if (!popupOverlay) return;

    // Calculate total savings
    const items = order.items || [];
    let totalOriginalPrice = 0;
    let totalCurrentPrice = 0;
    let firstProductImage = '/images/placeholder.svg';

    // Get first product image from the first item
    if (items.length > 0) {
        const firstItem = items[0];
        const product = firstItem.product || {};

        // Try multiple sources for product image
        if (product.image_url) {
            firstProductImage = product.image_url;
        } else if (firstItem.product_image_url) {
            firstProductImage = firstItem.product_image_url;
        } else if (product.images && product.images.length > 0) {
            firstProductImage = Array.isArray(product.images) ? product.images[0] : product.images;
        } else if (product.image) {
            firstProductImage = product.image;
        }

        // /* console.log */('Cancel Popup - Product Image:', {
        //     productImage: firstProductImage,
        //     product: product,
        //     item: firstItem
        // });
    }

    items.forEach(item => {
        const product = item.product || {};

        // Calculate prices (same logic as displayOrderItems)
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
        const itemOriginalTotal = originalPrice * quantity;

        totalOriginalPrice += itemOriginalTotal;
        totalCurrentPrice += itemCurrentTotal;
    });

    const totalSavings = totalOriginalPrice - totalCurrentPrice;

    // Update popup content
    if (popupSavingsText) {
        popupSavingsText.textContent = `You saved ₹${formatPrice(totalSavings)} on this product!`;
    }

    if (popupProductImage) {
        popupProductImage.src = firstProductImage;
        popupProductImage.alt = items[0]?.product?.name || 'Product';
        // Add error handler in case image fails to load
        popupProductImage.onerror = function () {
            this.src = '/images/placeholder.svg';
            this.onerror = null; // Prevent infinite loop
        };
    }

    // Show popup
    popupOverlay.style.display = 'flex';

    // Close handlers
    if (popupClose) {
        popupClose.onclick = () => {
            popupOverlay.style.display = 'none';
        };
    }

    if (popupDontCancel) {
        popupDontCancel.onclick = () => {
            popupOverlay.style.display = 'none';
        };
    }

    if (popupCancelOrder) {
        popupCancelOrder.onclick = () => {
            popupOverlay.style.display = 'none';
            // Redirect to cancel order page
            const orderNumber = order.order_number;
            const firstItem = items[0];
            const itemId = firstItem?.id || firstItem?.item_id || '';
            window.location.href = `/cancel-order.html?orderId=${orderNumber}&itemId=${itemId}`;
        };
    }

    // Close on overlay click
    popupOverlay.onclick = (e) => {
        if (e.target === popupOverlay) {
            popupOverlay.style.display = 'none';
        }
    };
}

function setupCancelPopup(order) {
    // This function is called to set up the popup, but the actual display is handled by showCancelConfirmationPopup
    // We can add any additional setup here if needed
}

async function cancelOrder(orderNumber, reason = '') {
    const result = await ORDER_API.cancelOrder(orderNumber, reason);

    if (result.success) {
        showNotification('Order cancelled successfully', 'success');
        // Reload order
        await loadOrder(orderNumber);
    } else {
        showNotification(result.message || 'Failed to cancel order', 'error');
    }
}

function formatTimelineDate(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();

    return `${dayName} ${monthName} ${day}`;
}

function formatExpectedDate(startDate, daysToAdd) {
    const expectedDate = new Date(startDate);
    expectedDate.setDate(startDate.getDate() + daysToAdd);
    return formatTimelineDate(expectedDate);
}

function formatPrice(price) {
    return parseFloat(price).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function showError(message) {
    const orderItemsSection = document.getElementById('orderItemsSection');
    if (orderItemsSection) {
        orderItemsSection.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <h2>${message}</h2>
                <a href="/orders.html" class="btn-primary">Back to Orders</a>
            </div>
        `;
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 120px;
        right: 20px;
        background: ${type === 'error' ? '#ff6161' : (type === 'info' ? '#2196f3' : '#388e3c')};
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10001;
        animation: slideIn 0.3s ease-out;
        min-width: 200px;
    `;

    // Add animation if not already added
    if (!document.getElementById('notification-styles-order')) {
        const style = document.createElement('style');
        style.id = 'notification-styles-order';
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

// Setup review buttons for delivered products
function setupReviewButtons() {
    // Use event delegation for dynamically added buttons
    document.addEventListener('click', async (e) => {
        const reviewBtn = e.target.closest('.btn-rate-product');
        if (!reviewBtn) return;

        e.preventDefault();
        e.stopPropagation();

        let productSlug = reviewBtn.dataset.productSlug;
        const productId = reviewBtn.dataset.productId;
        const productName = reviewBtn.dataset.productName || 'Product';

        // Check authentication first
        if (typeof isAuthenticated === 'undefined' || !isAuthenticated()) {
            showNotification('Please login to rate and review products', 'error');
            setTimeout(() => {
                window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
            }, 1500);
            return;
        }

        // If slug is not available but we have product ID, try to fetch it
        if (!productSlug && productId) {
            try {
                // Try to fetch product by ID to get slug
                if (typeof makeApiCall !== 'undefined' || typeof window.makeApiCall !== 'undefined') {
                    const apiCall = makeApiCall || window.makeApiCall;
                    const result = await apiCall(`/products/${productId}`);
                    if (result.success && result.data && result.data.slug) {
                        productSlug = result.data.slug;
                    }
                }
            } catch (error) {
                // /* console.error */('Failed to fetch product slug:', error);
            }
        }

        // If still no slug, try using product ID as fallback
        if (!productSlug && productId) {
            // Try to fetch product details to get slug
            try {
                const response = await fetch(`/api/products/${productId}`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data && result.data.slug) {
                        productSlug = result.data.slug;
                    }
                }
            } catch (error) {
                // /* console.error */('Failed to fetch product by ID:', error);
            }
        }

        if (!productSlug) {
            showNotification('Product information not available. Please visit the product page to leave a review.', 'error');
            return;
        }

        // Show review modal directly on order page
        await showOrderReviewModal(productSlug, productName);
    });
}

// Show review modal for order page
async function showOrderReviewModal(productSlug, productName) {
    // Load rating categories for this product
    let ratingCategories = [];
    try {
        const makeApiCallFunc = typeof makeApiCall !== 'undefined' ? makeApiCall : (typeof window.makeApiCall !== 'undefined' ? window.makeApiCall : null);
        if (makeApiCallFunc) {
            const result = await makeApiCallFunc(`/reviews/product/${productSlug}/rating-categories`);
            if (result.success && result.data && result.data.rating_categories) {
                ratingCategories = result.data.rating_categories;
            }
        }
    } catch (error) {
        // /* console.error */('Failed to load rating categories:', error);
        ratingCategories = [];
    }

    // Remove existing modal if any
    const existingModal = document.getElementById('orderReviewModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'orderReviewModal';
    modal.className = 'review-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        padding: 20px;
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'review-modal-content';
    modalContent.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
    `;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'review-modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: none;
        font-size: 28px;
        cursor: pointer;
        color: #878787;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    closeBtn.addEventListener('click', () => modal.remove());

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Rate & Review';
    title.style.cssText = 'margin: 0 0 8px 0; font-size: 20px; color: #212121;';

    // Product name
    const productNameDiv = document.createElement('div');
    productNameDiv.textContent = productName;
    productNameDiv.style.cssText = 'margin: 0 0 20px 0; font-size: 14px; color: #878787;';

    // Form
    const form = document.createElement('form');
    form.id = 'orderReviewForm';
    form.method = 'POST';
    form.action = '#';
    form.style.cssText = 'display: flex; flex-direction: column; gap: 20px;';

    // Overall Rating
    const overallRatingSection = document.createElement('div');
    overallRatingSection.innerHTML = `
        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #212121;">Overall Rating *</label>
        <div class="star-rating-input" style="display: flex; gap: 8px; font-size: 32px; cursor: pointer;">
            <span data-rating="1" style="color: #ddd;">★</span>
            <span data-rating="2" style="color: #ddd;">★</span>
            <span data-rating="3" style="color: #ddd;">★</span>
            <span data-rating="4" style="color: #ddd;">★</span>
            <span data-rating="5" style="color: #ddd;">★</span>
        </div>
        <input type="hidden" id="orderOverallRating" name="rating" value="0" required>
    `;

    // Star rating interaction
    const starInputs = overallRatingSection.querySelectorAll('.star-rating-input span');
    let selectedRating = 0;
    starInputs.forEach((star, index) => {
        star.addEventListener('click', () => {
            selectedRating = index + 1;
            document.getElementById('orderOverallRating').value = selectedRating;
            starInputs.forEach((s, i) => {
                s.style.color = i < selectedRating ? '#24db65' : '#ddd';
            });
        });
        star.addEventListener('mouseenter', () => {
            starInputs.forEach((s, i) => {
                s.style.color = i <= index ? '#24db65' : '#ddd';
            });
        });
    });
    overallRatingSection.querySelector('.star-rating-input').addEventListener('mouseleave', () => {
        starInputs.forEach((s, i) => {
            s.style.color = i < selectedRating ? '#24db65' : '#ddd';
        });
    });

    form.appendChild(overallRatingSection);

    // Category Ratings
    if (ratingCategories.length > 0) {
        const categorySection = document.createElement('div');
        categorySection.innerHTML = '<label style="display: block; margin-bottom: 12px; font-weight: 500; color: #212121;">Category Ratings</label>';

        ratingCategories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.style.cssText = 'margin-bottom: 16px;';

            const categoryLabel = document.createElement('label');
            categoryLabel.textContent = category.name;
            categoryLabel.style.cssText = 'display: block; margin-bottom: 8px; font-size: 14px; color: #878787;';

            const categoryStars = document.createElement('div');
            categoryStars.className = 'category-star-rating';
            categoryStars.dataset.categoryId = category.id;
            categoryStars.style.cssText = 'display: flex; gap: 4px; font-size: 20px; cursor: pointer;';

            for (let i = 1; i <= 5; i++) {
                const star = document.createElement('span');
                star.dataset.rating = i;
                star.textContent = '★';
                star.style.color = '#ddd';
                star.addEventListener('click', () => {
                    const categoryId = categoryStars.dataset.categoryId;
                    const stars = categoryStars.querySelectorAll('span');
                    stars.forEach((s, idx) => {
                        s.style.color = idx < i ? '#24db65' : '#ddd';
                    });
                    const hiddenInput = document.getElementById(`orderCategoryRating_${categoryId}`);
                    if (hiddenInput) {
                        hiddenInput.value = i;
                    }
                });
                categoryStars.appendChild(star);
            }

            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.id = `orderCategoryRating_${category.id}`;
            hiddenInput.name = `category_ratings[${category.id}]`;
            hiddenInput.value = '0';
            categoryDiv.appendChild(categoryLabel);
            categoryDiv.appendChild(categoryStars);
            categoryDiv.appendChild(hiddenInput);
            categorySection.appendChild(categoryDiv);
        });

        form.appendChild(categorySection);
    }

    // Customer Name
    const nameSection = document.createElement('div');
    let customerName = '';
    if (typeof getAuthUser !== 'undefined') {
        const user = getAuthUser();
        if (user) {
            customerName = user.name || user.mobile || '';
        }
    }
    nameSection.innerHTML = `
        <label for="orderCustomerName" style="display: block; margin-bottom: 8px; font-weight: 500; color: #212121;">Your Name *</label>
        <input type="text" id="orderCustomerName" name="customer_name" value="${escapeHtml(customerName)}" required
               style="width: 100%; padding: 10px; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 14px;">
    `;
    form.appendChild(nameSection);

    // Customer Email
    const emailSection = document.createElement('div');
    let customerEmail = '';
    if (typeof getAuthUser !== 'undefined') {
        const user = getAuthUser();
        if (user && user.email) {
            customerEmail = user.email;
        }
    }
    emailSection.innerHTML = `
        <label for="orderCustomerEmail" style="display: block; margin-bottom: 8px; font-weight: 500; color: #212121;">Your Email</label>
        <input type="email" id="orderCustomerEmail" name="customer_email" value="${escapeHtml(customerEmail)}"
               style="width: 100%; padding: 10px; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 14px;">
    `;
    form.appendChild(emailSection);

    // Review Text
    const reviewTextSection = document.createElement('div');
    reviewTextSection.innerHTML = `
        <label for="orderReviewText" style="display: block; margin-bottom: 8px; font-weight: 500; color: #212121;">Your Review</label>
        <textarea id="orderReviewText" name="review_text" rows="4" 
                  placeholder="Share your experience with this product..."
                  style="width: 100%; padding: 10px; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 14px; resize: vertical;"></textarea>
    `;
    form.appendChild(reviewTextSection);

    // Photo Upload
    const photoSection = document.createElement('div');
    photoSection.innerHTML = `
        <label for="orderReviewPhotos" style="display: block; margin-bottom: 8px; font-weight: 500; color: #212121;">Photos (Max 5)</label>
        <input type="file" id="orderReviewPhotos" name="photos[]" multiple accept="image/*" 
               style="width: 100%; padding: 10px; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 14px;">
        <small style="color: #878787; font-size: 12px; margin-top: 4px; display: block;">You can upload up to 5 photos</small>
    `;
    form.appendChild(photoSection);

    // Submit Button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.textContent = 'Submit Review';
    submitBtn.style.cssText = `
        background: #2874f0;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 4px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        margin-top: 8px;
    `;
    form.appendChild(submitBtn);

    // Handle button click
    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await submitOrderReview(form, productSlug, productName);
        } catch (error) {
            showNotification('Error submitting review. Please try again.', 'error');
        }
    });

    // Prevent form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await submitOrderReview(e.target, productSlug, productName);
    });

    modalContent.appendChild(closeBtn);
    modalContent.appendChild(title);
    modalContent.appendChild(productNameDiv);
    modalContent.appendChild(form);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Submit review from order page
async function submitOrderReview(form, productSlug, productName) {
    // Final authentication check
    if (typeof isAuthenticated === 'undefined' || !isAuthenticated()) {
        showNotification('Please login to submit a review', 'error');
        document.getElementById('orderReviewModal')?.remove();
        setTimeout(() => {
            window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
        }, 1500);
        return;
    }

    // Read values from input fields
    const overallRatingInput = document.getElementById('orderOverallRating');
    let overallRating = overallRatingInput ? overallRatingInput.value : '';
    if (overallRating) overallRating = overallRating.trim();

    const customerNameInput = document.getElementById('orderCustomerName');
    let customerName = customerNameInput ? customerNameInput.value : '';
    if (customerName) customerName = customerName.trim();

    const customerEmailInput = document.getElementById('orderCustomerEmail');
    let customerEmail = customerEmailInput ? customerEmailInput.value : '';
    if (customerEmail) customerEmail = customerEmail.trim();

    // Validate overall rating
    if (!overallRating || overallRating === '0' || overallRating === '') {
        showNotification('Please select an overall rating', 'error');
        if (overallRatingInput) {
            overallRatingInput.focus();
        }
        return;
    }

    // Use authenticated user's info as fallback
    if (typeof getAuthUser !== 'undefined') {
        const user = getAuthUser();
        if (user) {
            if (!customerName || customerName === '') {
                customerName = user.name || user.mobile || '';
                if (customerNameInput && customerName) {
                    customerNameInput.value = customerName;
                }
            }
            if ((!customerEmail || customerEmail === '') && user.email) {
                customerEmail = user.email;
                if (customerEmailInput) {
                    customerEmailInput.value = customerEmail;
                }
            }
        }
    }

    // Validate customer name
    if (!customerName || customerName === '') {
        showNotification('Please enter your name', 'error');
        if (customerNameInput) {
            customerNameInput.focus();
        }
        return;
    }

    // Create formData
    const formData = new FormData();
    formData.append('product_slug', productSlug);
    formData.append('customer_name', customerName.trim());
    formData.append('rating', overallRating.trim());

    if (customerEmail && customerEmail !== '') {
        formData.append('customer_email', customerEmail.trim());
    }

    const reviewTextInput = document.getElementById('orderReviewText');
    if (reviewTextInput && reviewTextInput.value.trim()) {
        formData.append('review_text', reviewTextInput.value.trim());
    }

    const photosInput = document.getElementById('orderReviewPhotos');
    if (photosInput && photosInput.files && photosInput.files.length > 0) {
        for (let i = 0; i < photosInput.files.length; i++) {
            formData.append('photos[]', photosInput.files[i]);
        }
    }

    // Collect category ratings
    const categoryRatings = [];
    const categoryInputs = form.querySelectorAll('input[id^="orderCategoryRating_"]');
    categoryInputs.forEach(input => {
        const rating = input.value;
        if (rating && rating !== '0' && rating !== '') {
            const categoryId = input.id.replace('orderCategoryRating_', '');
            categoryRatings.push({
                rating_category_id: parseInt(categoryId),
                rating: parseInt(rating)
            });
        }
    });

    categoryRatings.forEach((catRating, index) => {
        formData.append(`category_ratings[${index}][rating_category_id]`, catRating.rating_category_id.toString());
        formData.append(`category_ratings[${index}][rating]`, catRating.rating.toString());
    });

    try {
        const submitBtn = form.querySelector('button[type="button"]') || form.querySelector('button');
        let originalText = 'Submit Review';
        if (submitBtn) {
            originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
        }

        const headers = {
            'X-API-Key': '',
            'Accept': 'application/json'
        };

        if (typeof getAuthHeaders !== 'undefined') {
            const authHeaders = getAuthHeaders();
            if (authHeaders && authHeaders.Authorization) {
                headers['Authorization'] = authHeaders.Authorization;
            }
        }

        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: headers,
            body: formData
        });

        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            const text = await response.text();
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }

        if (result.success) {
            showNotification('Review submitted successfully! It will be visible after admin approval.', 'success');
            document.getElementById('orderReviewModal')?.remove();
            // Optionally reload the page or update UI
            setTimeout(() => {
                // You could reload the order page or just show a success message
                // window.location.reload();
            }, 1000);
        } else {
            let errorMsg = result.message || 'Failed to submit review';
            if (result.errors) {
                const errorList = Object.values(result.errors).flat().join(', ');
                errorMsg = errorList || errorMsg;
            }
            showNotification(errorMsg, 'error');
        }
    } catch (error) {
        const submitBtn = form.querySelector('button[type="button"]') || form.querySelector('button');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Review';
        }

        const errorMsg = error.message || 'Error submitting review. Please try again.';
        showNotification(errorMsg, 'error');
    }
}
