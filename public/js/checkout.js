// Checkout Page JavaScript

let cartData = null;
let userData = null;
let billingAddressVisible = false;
let selectedAddressType = 'home';

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '/login.html?return=/checkout.html';
        return;
    }

    // Setup login dropdown
    setupLoginDropdown();
    updateAuthUI();
    await updateCartCountInHeader();

    // Get user data
    userData = getAuthUser();
    if (userData) {
        populateUserData();
    }

    // Load cart
    await loadCart();

    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Address type buttons
    const addressTypeBtns = document.querySelectorAll('.address-type-btn');
    addressTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            addressTypeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedAddressType = btn.dataset.type;
        });
    });

    // Save delivery address button
    const saveDeliveryAddressBtn = document.getElementById('saveDeliveryAddressBtn');
    if (saveDeliveryAddressBtn) {
        saveDeliveryAddressBtn.addEventListener('click', () => {
            if (validateDeliveryAddress()) {
                showNotification('Delivery address saved');
            }
        });
    }

    // Add billing address button
    const addBillingAddressBtn = document.getElementById('addBillingAddressBtn');
    if (addBillingAddressBtn) {
        addBillingAddressBtn.addEventListener('click', () => {
            showBillingAddress();
        });
    }

    // Place order button
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', handlePlaceOrder);
    }
}

function showBillingAddress() {
    const billingAddressSection = document.getElementById('billingAddressSection');
    const addBillingAddressSection = document.getElementById('addBillingAddressSection');
    
    if (billingAddressSection && addBillingAddressSection) {
        // Copy delivery address to billing address
        copyDeliveryToBilling();
        
        // Show billing address section
        billingAddressSection.style.display = 'block';
        
        // Hide add billing address button
        addBillingAddressSection.style.display = 'none';
        
        billingAddressVisible = true;
    }
}

function copyDeliveryToBilling() {
    const fields = [
        { delivery: 'deliveryName', billing: 'billingName' },
        { delivery: 'deliveryPhone', billing: 'billingPhone' },
        { delivery: 'deliveryPincode', billing: 'billingPincode' },
        { delivery: 'deliveryLocality', billing: 'billingLocality' },
        { delivery: 'deliveryAddress1', billing: 'billingAddress1' },
        { delivery: 'deliveryCity', billing: 'billingCity' },
        { delivery: 'deliveryState', billing: 'billingState' },
        { delivery: 'deliveryLandmark', billing: 'billingLandmark' },
        { delivery: 'deliveryAlternatePhone', billing: 'billingAlternatePhone' }
    ];
    
    fields.forEach(field => {
        const deliveryField = document.getElementById(field.delivery);
        const billingField = document.getElementById(field.billing);
        
        if (deliveryField && billingField) {
            billingField.value = deliveryField.value;
        }
    });
}

function populateUserData() {
    if (!userData) return;

    // Populate delivery address with user data if available
    const deliveryName = document.getElementById('deliveryName');
    const deliveryPhone = document.getElementById('deliveryPhone');
    
    if (deliveryName && userData.name) {
        deliveryName.value = userData.name;
    }
    if (deliveryPhone && userData.phone) {
        deliveryPhone.value = userData.phone;
    }
}

function validateDeliveryAddress() {
    const requiredFields = [
        'deliveryName',
        'deliveryPhone',
        'deliveryPincode',
        'deliveryLocality',
        'deliveryAddress1',
        'deliveryCity',
        'deliveryState'
    ];

    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field || !field.value.trim()) {
            showNotification(`Please fill in ${fieldId.replace('delivery', '').toLowerCase()}`, 'error');
            field?.focus();
            return false;
        }
    }

    // Validate phone
    const phone = document.getElementById('deliveryPhone').value;
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
        showNotification('Please enter a valid 10-digit mobile number', 'error');
        return false;
    }

    // Validate pincode
    const pincode = document.getElementById('deliveryPincode').value;
    if (pincode.length !== 6 || !/^\d+$/.test(pincode)) {
        showNotification('Please enter a valid 6-digit pincode', 'error');
        return false;
    }

    return true;
}

async function loadCart() {
    const orderItemsList = document.getElementById('orderItemsList');
    
    // Show loading
    if (orderItemsList) {
        orderItemsList.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading order summary...</p>
            </div>
        `;
    }

    const result = await CART_API.getCart();

    // Handle different response structures
    let cartItems = [];
    let cartTotal = 0;
    let cartSubtotal = 0;
    let cartDiscount = 0;
    
    if (result.success && result.data) {
        if (result.data.items && Array.isArray(result.data.items)) {
            cartItems = result.data.items;
            cartTotal = result.data.total || 0;
            cartSubtotal = cartItems.reduce((sum, item) => {
                const originalPrice = parseFloat(item.product.original_price) || 
                                     parseFloat(item.product.mrp) || 
                                     parseFloat(item.product.price) || 0;
                return sum + (originalPrice * item.quantity);
            }, 0);
            cartDiscount = Math.max(0, cartSubtotal - cartTotal);
        } else if (Array.isArray(result.data)) {
            cartItems = result.data;
            cartTotal = cartItems.reduce((sum, item) => sum + (item.subtotal || (item.product?.price || 0) * (item.quantity || 1)), 0);
            cartSubtotal = cartItems.reduce((sum, item) => {
                const originalPrice = parseFloat(item.product?.original_price) || 
                                     parseFloat(item.product?.mrp) || 
                                     parseFloat(item.product?.price) || 0;
                return sum + (originalPrice * item.quantity);
            }, 0);
            cartDiscount = Math.max(0, cartSubtotal - cartTotal);
        }
    }

    if (cartItems.length === 0) {
        // Empty cart - redirect to cart page
        showNotification('Your cart is empty', 'error');
        setTimeout(() => {
            window.location.href = '/cart.html';
        }, 2000);
        return;
    }

    cartData = {
        items: cartItems,
        total: cartTotal,
        subtotal: cartSubtotal,
        discount: cartDiscount
    };

    displayOrderItems(cartItems);
    updatePriceSummary(cartData);
}

function displayOrderItems(items) {
    const orderItemsList = document.getElementById('orderItemsList');
    if (!orderItemsList) return;

    orderItemsList.innerHTML = '';

    items.forEach(item => {
        const orderItem = createOrderItemElement(item);
        orderItemsList.appendChild(orderItem);
    });
}

function createOrderItemElement(item) {
    const product = item.product;
    const div = document.createElement('div');
    div.className = 'order-item';

    const originalPrice = parseFloat(product.original_price) || 
                         parseFloat(product.mrp) || 
                         parseFloat(product.price) || 0;
    const currentPrice = parseFloat(product.price) || originalPrice;
    const discount = originalPrice > currentPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
    const itemTotal = currentPrice * item.quantity;
    const itemOriginalTotal = originalPrice * item.quantity;

    div.innerHTML = `
        <img src="${product.image_url || '/images/placeholder.jpg'}" alt="${product.name}" class="order-item-image" onerror="this.src='/images/placeholder.jpg'">
        <div class="order-item-details">
            <div class="order-item-name">${product.name}</div>
            <div class="order-item-quantity">Qty: ${item.quantity}</div>
            <div class="order-item-price-section">
                <span class="order-item-price">₹${formatPrice(itemTotal)}</span>
                ${itemOriginalTotal > itemTotal ? `<span class="order-item-original-price">₹${formatPrice(itemOriginalTotal)}</span>` : ''}
                ${discount > 0 ? `<span class="order-item-discount">${discount}% off</span>` : ''}
            </div>
        </div>
    `;

    return div;
}

function updatePriceSummary(data) {
    const summaryItemCount = document.getElementById('summaryItemCount');
    const summaryItemPlural = document.getElementById('summaryItemPlural');
    const summaryPrice = document.getElementById('summaryPrice');
    const summaryDiscount = document.getElementById('summaryDiscount');
    const discountRow = document.getElementById('discountRow');
    const summaryPlatformFee = document.getElementById('summaryPlatformFee');
    const platformFeeRow = document.getElementById('platformFeeRow');
    const summaryProtectFee = document.getElementById('summaryProtectFee');
    const protectFeeRow = document.getElementById('protectFeeRow');
    const summaryTotal = document.getElementById('summaryTotal');
    const savingsSection = document.getElementById('savingsSection');
    const savingsAmount = document.getElementById('savingsAmount');

    if (!data.items || data.items.length === 0) {
        if (summaryItemCount) summaryItemCount.textContent = '0';
        if (summaryItemPlural) summaryItemPlural.textContent = 's';
        if (summaryPrice) summaryPrice.textContent = '₹0';
        if (summaryTotal) summaryTotal.textContent = '₹0';
        return;
    }

    const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
    const platformFee = 7;
    const protectFee = 0;
    const total = (data.total || 0) + platformFee + protectFee;
    const discount = data.discount || 0;

    // Update item count
    if (summaryItemCount) {
        summaryItemCount.textContent = totalItems;
    }
    if (summaryItemPlural) {
        summaryItemPlural.textContent = totalItems === 1 ? '' : 's';
    }

    // Update price
    if (summaryPrice) {
        summaryPrice.textContent = `₹${formatPrice(data.subtotal || 0)}`;
    }

    // Update discount
    if (discount > 0.01) {
        const discountPercentage = data.subtotal > 0 ? Math.round((discount / data.subtotal) * 100) : 0;
        if (summaryDiscount) {
            summaryDiscount.innerHTML = `− ₹${formatPrice(discount)} <span style="color: #388e3c; font-size: 12px; margin-left: 4px;">(${discountPercentage}% off)</span>`;
        }
        if (discountRow) {
            discountRow.style.display = 'flex';
        }
    } else {
        if (discountRow) {
            discountRow.style.display = 'none';
        }
    }

    // Update platform fee
    if (platformFeeRow) {
        platformFeeRow.style.display = 'flex';
        if (summaryPlatformFee) {
            summaryPlatformFee.textContent = `₹${formatPrice(platformFee)}`;
        }
    }

    // Update protect fee
    if (protectFee > 0) {
        if (protectFeeRow) {
            protectFeeRow.style.display = 'flex';
            if (summaryProtectFee) {
                summaryProtectFee.textContent = `₹${formatPrice(protectFee)}`;
            }
        }
    } else {
        if (protectFeeRow) {
            protectFeeRow.style.display = 'none';
        }
    }

    // Update total
    if (summaryTotal) {
        summaryTotal.textContent = `₹${formatPrice(total)}`;
    }

    // Update savings
    if (discount > 0 && savingsSection && savingsAmount) {
        savingsAmount.textContent = `₹${formatPrice(discount)}`;
        savingsSection.style.display = 'flex';
    } else if (savingsSection) {
        savingsSection.style.display = 'none';
    }
}

async function handlePlaceOrder() {
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = 'Placing Order...';
    }

    // Validate delivery address
    if (!validateDeliveryAddress()) {
        if (placeOrderBtn) {
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = 'Continue';
        }
        return;
    }

    // Validate billing address if visible
    if (billingAddressVisible) {
        const requiredBillingFields = [
            'billingName',
            'billingPhone',
            'billingPincode',
            'billingLocality',
            'billingAddress1',
            'billingCity',
            'billingState'
        ];

        for (const fieldId of requiredBillingFields) {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                showNotification(`Please fill in billing ${fieldId.replace('billing', '').toLowerCase()}`, 'error');
                field?.focus();
                if (placeOrderBtn) {
                    placeOrderBtn.disabled = false;
                    placeOrderBtn.textContent = 'Continue';
                }
                return;
            }
        }
    }

    // Get form data
    const orderData = buildOrderData();
    
    if (!orderData) {
        showNotification('Please fill in all required address fields', 'error');
        if (placeOrderBtn) {
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = 'Continue';
        }
        return;
    }
    
    // Log order data before sending
    // /* console.log */('Order Data to be sent:', JSON.stringify(orderData, null, 2));

    // Create order
    const result = await ORDER_API.createOrder(orderData);

    if (result.success && result.data) {
        // Order created successfully
        const orderNumber = result.data.order_number || result.data.orderNumber || result.data.id;
        
        if (!orderNumber) {
            // /* console.error */('Order created but order_number not found in response:', result);
            showNotification('Order placed successfully, but order number not found. Please check your orders.', 'success');
            setTimeout(() => {
                window.location.href = '/orders.html';
            }, 2000);
            return;
        }
        
        showNotification('Order placed successfully!', 'success');
        
        // Redirect to order details page
        setTimeout(() => {
            window.location.href = `/order.html?order=${orderNumber}`;
        }, 1500);
    } else {
        // Error - show detailed error message
        let errorMessage = result.message || 'Failed to place order';
        
        // If validation error, show field-specific errors
        if (result.validationError && result.errors) {
            const errorFields = Object.keys(result.errors);
            if (errorFields.length > 0) {
                const firstError = result.errors[errorFields[0]];
                errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
            }
        }
        
        // /* console.error */('Order creation failed:', result);
        showNotification(errorMessage, 'error');
        
        if (placeOrderBtn) {
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = 'Continue';
        }
    }
}

function buildOrderData() {
    // Get cart items
    const items = cartData.items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
    }));

    // Get user email (required for addresses)
    const userEmail = userData?.email || '';

    // Get delivery address - ensure all required fields are present
    const deliveryName = document.getElementById('deliveryName')?.value.trim();
    const deliveryPhone = document.getElementById('deliveryPhone')?.value.trim();
    const deliveryAddress1 = document.getElementById('deliveryAddress1')?.value.trim();
    const deliveryLocality = document.getElementById('deliveryLocality')?.value.trim() || '';
    const deliveryCity = document.getElementById('deliveryCity')?.value.trim();
    const deliveryState = document.getElementById('deliveryState')?.value.trim();
    const deliveryPincode = document.getElementById('deliveryPincode')?.value.trim();
    
    if (!deliveryName || !deliveryPhone || !deliveryAddress1 || !deliveryCity || !deliveryState || !deliveryPincode) {
        // /* console.error */('Missing required delivery address fields');
        return null;
    }

    const shippingAddress = {
        name: deliveryName,
        email: userEmail || '',
        phone: deliveryPhone,
        address_line1: deliveryAddress1,
        address_line2: deliveryLocality,
        city: deliveryCity,
        state: deliveryState,
        postal_code: deliveryPincode,
        country: 'India'
    };

    // Get billing address (use delivery if billing not added)
    let billingAddress;
    if (billingAddressVisible) {
        const billingName = document.getElementById('billingName')?.value.trim();
        const billingPhone = document.getElementById('billingPhone')?.value.trim();
        const billingAddress1 = document.getElementById('billingAddress1')?.value.trim();
        const billingLocality = document.getElementById('billingLocality')?.value.trim() || '';
        const billingCity = document.getElementById('billingCity')?.value.trim();
        const billingState = document.getElementById('billingState')?.value.trim();
        const billingPincode = document.getElementById('billingPincode')?.value.trim();
        
        if (!billingName || !billingPhone || !billingAddress1 || !billingCity || !billingState || !billingPincode) {
            // /* console.error */('Missing required billing address fields');
            return null;
        }
        
        billingAddress = {
            name: billingName,
            email: userEmail || '',
            phone: billingPhone,
            address_line1: billingAddress1,
            address_line2: billingLocality,
            city: billingCity,
            state: billingState,
            postal_code: billingPincode,
            country: 'India'
        };
    } else {
        // Use delivery address as billing address
        billingAddress = { ...shippingAddress };
    }

    // Get payment method
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cod';

    const orderData = {
        items: items,
        shipping_address: shippingAddress,
        billing_address: billingAddress,
        payment_method: paymentMethod
    };

    // /* console.log */('Building order data:', orderData);
    return orderData;
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
    if (!document.getElementById('notification-styles-checkout')) {
        const style = document.createElement('style');
        style.id = 'notification-styles-checkout';
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
