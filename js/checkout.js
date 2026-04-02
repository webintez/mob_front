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
    const saveDeliverBtn = document.getElementById('saveDeliverBtn');
    if (saveDeliverBtn) {
        saveDeliverBtn.addEventListener('click', async () => {
            if (validateDeliveryAddress()) {
                confirmAddress();
                await saveAddressToProfileDirectly();
            }
        });
    }

    // Change address button
    const changeAddressBtn = document.getElementById('changeAddressBtn');
    if (changeAddressBtn) {
        changeAddressBtn.addEventListener('click', () => {
            document.getElementById('addressActive').style.display = 'block';
            document.getElementById('addressCollapsed').style.display = 'none';
            document.getElementById('checkoutFooter').style.display = 'none';
            document.getElementById('step3').classList.remove('active');
        });
    }

    // Final Continue button (was placeOrderBtn)
    const finalContinueBtn = document.getElementById('finalContinueBtn');
    if (finalContinueBtn) {
        finalContinueBtn.addEventListener('click', () => {
            // Save order data to session storage for payment page
            const orderData = buildOrderData();
            if (orderData) {
                sessionStorage.setItem('pendingOrderData', JSON.stringify(orderData));
                sessionStorage.setItem('cartData', JSON.stringify(cartData));
                window.location.href = '/payment.html';
            }
        });
    }
}

function confirmAddress() {
    // Collect data
    const name = document.getElementById('deliveryName').value;
    const phone = document.getElementById('deliveryPhone').value;
    const address = document.getElementById('deliveryAddress1').value;
    const city = document.getElementById('deliveryCity').value;
    const pincode = document.getElementById('deliveryPincode').value;
    const locality = document.getElementById('deliveryLocality').value;

    // Update preview
    document.getElementById('displayUserName').textContent = name;
    document.getElementById('displayUserPhone').textContent = phone;
    document.getElementById('displayFullAddress').textContent = `${address}, ${locality}, ${city}, ${pincode}`;
    document.getElementById('displayAddressType').textContent = selectedAddressType.toUpperCase();

    // Toggle view
    document.getElementById('addressActive').style.display = 'none';
    document.getElementById('addressCollapsed').style.display = 'block';

    // Show footer and next step
    document.getElementById('checkoutFooter').style.display = 'flex';
    document.getElementById('step3').classList.add('active');

    // Scroll to next section
    document.getElementById('orderSummarySection').scrollIntoView({ behavior: 'smooth' });
}

async function saveAddressToProfileDirectly() {
    try {
        if (typeof getAuthHeaders !== 'function') return;
        
        const loc = document.getElementById('deliveryLocality')?.value?.trim() || '';
        const addrType = selectedAddressType || 'home';
        
        const addressData = {
            name: document.getElementById('deliveryName')?.value?.trim() || '',
            phone: document.getElementById('deliveryPhone')?.value?.trim() || '',
            address_line1: document.getElementById('deliveryAddress1')?.value?.trim() || '',
            address_line2: loc,
            locality: loc, // Backend requires this field
            city: document.getElementById('deliveryCity')?.value?.trim() || '',
            state: document.getElementById('deliveryState')?.value?.trim() || '',
            postal_code: document.getElementById('deliveryPincode')?.value?.trim() || '',
            country: 'India',
            address_type: addrType,
            is_default: true
        };
        
        // Basic validation before saving
        if (!addressData.name || !addressData.phone || !addressData.address_line1 || !addressData.city || !addressData.postal_code || !addressData.state || !addressData.locality) {
            return;
        }

        // Send to backend quietly
        const response = await fetch('/api/user/addresses', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(addressData)
        });
        
    } catch (e) {
        console.error('Failed to auto-save address to profile:', e);
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
    div.className = 'checkout-item';

    const originalPrice = parseFloat(product.original_price) ||
        parseFloat(product.mrp) ||
        parseFloat(product.price) || 0;
    const currentPrice = parseFloat(product.price) || originalPrice;
    const discount = originalPrice > currentPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

    // Detect mobile for targeted changes to follow "Only change the mobile view" rule
    const isMobile = window.innerWidth <= 768;

    let ratingHtml = '';
    if (isMobile) {
        // Mobile View: Remove Assured image and conditionally show rating if provided in product data
        const productRating = parseFloat(product.rating) || 0;
        const productRatingCount = parseInt(product.ratings_count || product.review_count || 0, 10);
        
        // Only show rating if it's greater than 0
        if (productRating > 0) {
            ratingHtml = `
                <div class="item-rating">
                    <span class="rating-badge">${productRating.toFixed(1)} <i class="fas fa-star" style="font-size: 8px;"></i></span>
                    <span class="rating-count">(${productRatingCount.toLocaleString('en-IN')})</span>
                </div>
            `;
        }
    } else {
        // Desktop View: Keep original placeholder/random behavior and Assured image to avoid affecting desktop look
        const rating = (Math.random() * (4.8 - 4.1) + 4.1).toFixed(1);
        const ratingCount = Math.floor(Math.random() * 20000 + 5000).toLocaleString();
        ratingHtml = `
            <div class="item-rating">
                <span class="rating-badge">${rating} <i class="fas fa-star" style="font-size: 8px;"></i></span>
                <span class="rating-count">(${ratingCount})</span>
                <img src="/2.png" style="height: 15px; margin-left: 10px;" alt="Assured">
            </div>
        `;
    }

    div.innerHTML = `
        <div class="item-img-container">
            <img src="${product.image_url || '/images/placeholder.jpg'}" alt="${product.name}" onerror="this.src='/images/placeholder.jpg'">
        </div>
        <div class="item-details">
            <div class="item-name">${product.name}</div>
            ${ratingHtml}
            <div class="item-price-row">
                <span class="item-price-f">₹${formatPrice(currentPrice * item.quantity)}</span>
                ${originalPrice > currentPrice ? `
                    <span class="orig-price-f">₹${formatPrice(originalPrice * item.quantity)}</span>
                    <span class="disc-percent-f">${discount}% Off</span>
                ` : ''}
            </div>
            <div class="delivery-info-f">
                Delivery by Tomorrow, 11 PM | <span class="delivery-fee-f">FREE</span>
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
    const platformFee = 7 * totalItems;
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

    // Update Sticky Footer price
    const fixedTotalPrice = document.getElementById('fixedTotalPrice');
    const checkoutFooter = document.getElementById('checkoutFooter');
    if (fixedTotalPrice) {
        fixedTotalPrice.textContent = `₹${formatPrice(total)}`;
    }

    // Show footer on mobile even if address confirm is pending (optional, but requested layout fix)
    if (checkoutFooter && window.innerWidth < 768 && data.items && data.items.length > 0) {
        checkoutFooter.style.display = 'flex';
    }

    // Update savings
    if (discount > 0 && savingsSection && savingsAmount) {
        savingsAmount.textContent = `₹${formatPrice(discount)}`;
        savingsSection.style.display = 'block';
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
        // Check for order data in result (can be in result.data list or direct)
        const orderInfo = Array.isArray(result.data) ? result.data[0] : result.data;
        const orderNumber = orderInfo.order_number || orderInfo.orderNumber || orderInfo.id;

        if (!orderNumber) {
            // /* console.error */('Order created but order_number not found in response:', result);
            showNotification('Order placed successfully, but order number not found. Please check your orders.', 'success');
            setTimeout(() => {
                window.location.href = '/orders.html';
            }, 2000);
            return;
        }

        // Check for Razorpay payment details
        if (result.payment && result.payment.id) {
            // Initiate Razorpay Payment
            const orderDataForPayment = {
                order_number: orderNumber,
                shipping_address: orderData.shipping_address
            };
            openRazorpayCheckout(orderDataForPayment, result.payment);
            return; // Stop redirection until payment is done
        }

        showNotification('Order placed successfully!', 'success');

        // Clear cart after successful order
        try {
            await CART_API.clearCart();
            // Also update header count immediately
            const cartCountEl = document.querySelector('.cart-count');
            if (cartCountEl) {
                cartCountEl.textContent = '0';
                cartCountEl.style.display = 'none';
            }
        } catch (e) {
            console.error('Failed to clear cart:', e);
        }

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
            country: 'India',
            address_type: selectedAddressType
        };
    } else {
        // Use delivery address as billing address
        billingAddress = { ...shippingAddress };
    }

    // Get payment method
    let paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cod';
    if (paymentMethod === 'online') {
        paymentMethod = 'razorpay';
    }

    const orderData = {
        items: items,
        shipping_address: {
            ...shippingAddress,
            address_type: selectedAddressType
        },
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

// Open Razorpay Checkout
function openRazorpayCheckout(orderData, paymentData) {
    const options = {
        "key": paymentData.key_id, // Received from backend
        "amount": paymentData.amount, // Amount in paisa
        "currency": paymentData.currency,
        "name": "Mobitez",
        "description": "Order #" + orderData.order_number,
        "image": "/2.png", // Use site logo
        "order_id": paymentData.id, // The Razorpay Order ID
        "handler": function (response) {
            // Payment Successful!
            // Now verify with backend
            verifyPayment(orderData.order_number, response);
        },
        "prefill": {
            "name": orderData.shipping_address.name,
            "email": orderData.shipping_address.email,
            "contact": orderData.shipping_address.phone
        },
        "theme": {
            "color": "#2874f0" // Mobitez blue
        },
        "modal": {
            "ondismiss": function () {
                showNotification('Payment cancelled', 'error');
                const placeOrderBtn = document.getElementById('placeOrderBtn');
                if (placeOrderBtn) {
                    placeOrderBtn.disabled = false;
                    placeOrderBtn.textContent = 'Retry Payment';
                }
            }
        }
    };

    try {
        const rzp1 = new Razorpay(options);
        rzp1.on('payment.failed', function (response) {
            showNotification("Payment Failed: " + response.error.description, 'error');
            const placeOrderBtn = document.getElementById('placeOrderBtn');
            if (placeOrderBtn) {
                placeOrderBtn.disabled = false;
                placeOrderBtn.textContent = 'Retry Payment';
            }
        });
        rzp1.open();
    } catch (e) {
        console.error('Razorpay Error:', e);
        showNotification('Failed to open payment gateway. Please try again.', 'error');
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        if (placeOrderBtn) {
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = 'Retry Payment';
        }
    }
}

// Verify Payment
async function verifyPayment(orderNumber, paymentResponse) {
    showNotification('Verifying payment...', 'success');

    /* 
       Expected payload from paymentResponse:
       {
           razorpay_payment_id: "pay_...",
           razorpay_order_id: "order_...",
           razorpay_signature: "..."
       }
    */

    // Call backend to verify
    const result = await ORDER_API.updatePaymentStatus(orderNumber, 'paid', paymentResponse);

    if (result.success) {
        showNotification('Payment successful! Order placed.', 'success');

        // Clear cart after successful payment
        try {
            await CART_API.clearCart();
            // Also update header count immediately
            const cartCountEl = document.querySelector('.cart-count');
            if (cartCountEl) {
                cartCountEl.textContent = '0';
                cartCountEl.style.display = 'none';
            }
        } catch (e) {
            console.error('Failed to clear cart:', e);
        }

        setTimeout(() => {
            window.location.href = `/order.html?order=${orderNumber}`;
        }, 1500);
    } else {
        showNotification('Payment verification failed: ' + (result.message || 'Unknown error'), 'error');
        // Even if verification fails endpoint-side, the money might be deducted.
        // Usually, we'd advise the user to contact support or retry verification.
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        if (placeOrderBtn) {
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = 'Verify Again';
            placeOrderBtn.onclick = function () {
                verifyPayment(orderNumber, paymentResponse);
            };
        }
    }
}
