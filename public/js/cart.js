// Cart Page JavaScript

let cartData = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '/login.html?return=/cart.html';
        return;
    }

    // Setup login dropdown
    setupLoginDropdown();
    updateAuthUI();
    await updateCartCountInHeader();

    // Load cart
    await loadCart();

    // Setup event listeners
    setupEventListeners();
});

// Custom confirmation modal
function showConfirmModal(title, message) {
    return new Promise((resolve) => {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'confirm-modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease-out;
        `;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        modal.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease-out;
        `;

        modal.innerHTML = `
            <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #212121;">${title}</h3>
            <p style="margin: 0 0 24px 0; color: #666; font-size: 14px; line-height: 1.5;">${message}</p>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="confirm-cancel-btn" style="
                    padding: 10px 24px;
                    border: 1px solid #ddd;
                    background: white;
                    color: #212121;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s;
                ">Cancel</button>
                <button class="confirm-remove-btn" style="
                    padding: 10px 24px;
                    border: none;
                    background: #ff6161;
                    color: white;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s;
                ">Remove</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Add animations if not already added
        if (!document.getElementById('confirm-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'confirm-modal-styles';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to { 
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .confirm-cancel-btn:hover {
                    background: #f5f5f5 !important;
                }
                .confirm-remove-btn:hover {
                    background: #ff4444 !important;
                }
            `;
            document.head.appendChild(style);
        }

        // Handle button clicks
        const cancelBtn = modal.querySelector('.confirm-cancel-btn');
        const removeBtn = modal.querySelector('.confirm-remove-btn');

        function closeModal(result) {
            overlay.style.animation = 'fadeIn 0.2s ease-out reverse';
            modal.style.animation = 'slideUp 0.3s ease-out reverse';
            setTimeout(() => {
                overlay.remove();
                resolve(result);
            }, 200);
        }

        cancelBtn.addEventListener('click', () => closeModal(false));
        removeBtn.addEventListener('click', () => closeModal(true));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(false);
        });

        // Focus on remove button
        setTimeout(() => removeBtn.focus(), 100);
    });
}


async function loadCart() {
    const cartItemsList = document.getElementById('cartItemsList');
    const emptyCart = document.getElementById('emptyCart');
    const cartActions = document.getElementById('cartActions');
    const placeOrderBtn = document.getElementById('placeOrderBtn');

    // Show loading
    if (cartItemsList) {
        cartItemsList.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading cart...</p>
            </div>
        `;
    }

    const result = await CART_API.getCart();

    // /* console.log */('Cart API Response:', result);

    // Handle different response structures
    let cartItems = [];
    let cartTotal = 0;
    let cartCount = 0;

    if (result.success && result.data) {
        // Check if items are in result.data.items or result.data directly
        if (result.data.items && Array.isArray(result.data.items)) {
            cartItems = result.data.items;
            cartTotal = result.data.total || 0;
            cartCount = result.data.count || cartItems.length;
        } else if (Array.isArray(result.data)) {
            // If data is directly an array
            cartItems = result.data;
            cartTotal = cartItems.reduce((sum, item) => sum + (item.subtotal || (item.product?.price || 0) * (item.quantity || 1)), 0);
            cartCount = cartItems.length;
        }
    }

    if (cartItems.length > 0) {
        cartData = {
            items: cartItems,
            total: cartTotal,
            count: cartCount
        };
        displayCartItems(cartItems);
        updatePriceSummary(cartData);

        if (emptyCart) emptyCart.style.display = 'none';
        if (cartItemsList) cartItemsList.style.display = 'block';
        if (cartActions) cartActions.style.display = 'block';
        if (placeOrderBtn) placeOrderBtn.disabled = false;
    } else {
        // Empty cart
        // /* console.log */('Cart is empty or no items found');
        if (emptyCart) emptyCart.style.display = 'block';
        if (cartItemsList) cartItemsList.style.display = 'none';
        if (cartActions) cartActions.style.display = 'none';
        if (placeOrderBtn) placeOrderBtn.disabled = true;
        updatePriceSummary({ items: [], total: 0, count: 0 });
    }
}

function displayCartItems(items) {
    const cartItemsList = document.getElementById('cartItemsList');
    if (!cartItemsList) return;

    cartItemsList.innerHTML = '';

    items.forEach(item => {
        const cartItem = createCartItemElement(item);
        cartItemsList.appendChild(cartItem);
    });
}

function createCartItemElement(item) {
    const product = item.product;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.dataset.productId = product.id;

    // Get original price (MRP) - check multiple possible fields
    const originalPrice = product.original_price ||
        product.mrp ||
        product.maximum_retail_price ||
        product.price;

    // Get current selling price
    const currentPrice = product.price ||
        product.selling_price ||
        product.discounted_price ||
        originalPrice;

    // Calculate discount percentage
    const discount = originalPrice > currentPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
    const itemTotal = currentPrice * item.quantity;
    const itemOriginalTotal = originalPrice * item.quantity;

    // Log for debugging
    // /* console.log */('Cart Item:', {
        productId: product.id,
        productName: product.name,
        originalPrice,
        currentPrice,
        discount,
        quantity: item.quantity
    });

    // Calculate delivery date (3-5 days from now)
    const deliveryDate = calculateDeliveryDate();

    // Get product specs/variations
    const specs = getProductSpecs(product);

    div.innerHTML = `
        <div class="cart-item-main">
            <div class="cart-item-image-wrapper">
                <a href="/product.html?slug=${product.slug}">
                    <img src="${product.image_url || '/images/placeholder.jpg'}" alt="${product.name}" class="cart-item-image" onerror="this.src='/images/placeholder.jpg'">
                </a>
            </div>
            <div class="cart-item-info">
                <a href="/product.html?slug=${product.slug}" class="cart-item-name">${product.name}</a>
                ${specs ? `<div class="cart-item-specs">${specs}</div>` : ''}
                <div class="cart-item-seller">
                    <i class="fas fa-store"></i>
                    Seller: Mobitez
                </div>
                <div class="cart-item-pricing">
                    <span class="cart-item-price">₹${formatPrice(itemTotal)}</span>
                    ${itemOriginalTotal > itemTotal ? `<span class="cart-item-original-price">₹${formatPrice(itemOriginalTotal)}</span>` : ''}
                    ${discount > 0 ? `<span class="cart-item-discount">${discount}% off</span>` : ''}
                </div>
                ${itemOriginalTotal > itemTotal ? `<div class="cart-item-emi">Or Pay ₹${formatPrice(Math.round(itemTotal / 3))} + ₹${formatPrice(itemTotal - Math.round(itemTotal / 3))}</div>` : ''}
                <div class="cart-item-delivery">
                    <div class="delivery-info">
                        <i class="fas fa-truck"></i>
                        <span>Delivery by ${deliveryDate}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="cart-item-actions">
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateQuantity(${product.id}, ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>
                    –
                </button>
                <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="10" 
                       onchange="updateQuantity(${product.id}, parseInt(this.value))">
                <button class="quantity-btn" onclick="updateQuantity(${product.id}, ${item.quantity + 1})" ${item.quantity >= 10 ? 'disabled' : ''}>
                    +
                </button>
            </div>
            <div class="cart-item-action-links">
                <a href="#" class="cart-action-link" onclick="saveForLater(${product.id}); return false;">Save for later</a>
                <a href="#" class="cart-action-link" onclick="removeItem(${product.id}); return false;">Remove</a>
            </div>
        </div>
    `;

    return div;
}

function getProductSpecs(product) {
    // Extract specs from product variations or attributes
    const specs = [];

    if (product.variations) {
        Object.keys(product.variations).forEach(key => {
            if (product.variations[key] && product.variations[key].value) {
                specs.push(`${product.variations[key].value}`);
            }
        });
    }

    // If no variations, try to get from product attributes
    if (specs.length === 0 && product.attributes) {
        if (product.attributes.ram) specs.push(`${product.attributes.ram} RAM`);
        if (product.attributes.storage) specs.push(`${product.attributes.storage} Storage`);
        if (product.attributes.color) specs.push(product.attributes.color);
    }

    return specs.length > 0 ? specs.join(', ') : null;
}

function calculateDeliveryDate() {
    const today = new Date();
    const deliveryDays = 3 + Math.floor(Math.random() * 3); // 3-5 days
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + deliveryDays);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return `${days[deliveryDate.getDay()]} ${months[deliveryDate.getMonth()]} ${deliveryDate.getDate()}`;
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
    const summarySavings = document.getElementById('summarySavings');
    const savingsAmount = document.getElementById('savingsAmount');

    if (!data.items || data.items.length === 0) {
        if (summaryItemCount) summaryItemCount.textContent = '0';
        if (summaryItemPlural) summaryItemPlural.textContent = 's';
        if (summaryPrice) summaryPrice.textContent = '₹0';
        if (summaryTotal) summaryTotal.textContent = '₹0';
        if (discountRow) discountRow.style.display = 'none';
        if (platformFeeRow) platformFeeRow.style.display = 'none';
        if (protectFeeRow) protectFeeRow.style.display = 'none';
        if (summarySavings) summarySavings.style.display = 'none';
        return;
    }

    // Calculate totals with proper discount calculation
    const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);

    // Calculate original price (MRP) and current price for each item
    let totalOriginalPrice = 0;
    let totalCurrentPrice = 0;

    data.items.forEach(item => {
        const product = item.product || {};
        // Get original price (MRP) - check multiple possible fields
        const originalPrice = parseFloat(product.original_price) ||
            parseFloat(product.mrp) ||
            parseFloat(product.maximum_retail_price) ||
            parseFloat(product.price) || 0;

        // Get current selling price
        const currentPrice = parseFloat(product.price) ||
            parseFloat(product.selling_price) ||
            parseFloat(product.discounted_price) ||
            originalPrice || 0;

        // Calculate totals
        totalOriginalPrice += (originalPrice * item.quantity);
        totalCurrentPrice += (currentPrice * item.quantity);

        // Log each item's pricing
        // /* console.log */(`Item: ${product.name}`, {
            originalPrice,
            currentPrice,
            quantity: item.quantity,
            itemOriginalTotal: originalPrice * item.quantity,
            itemCurrentTotal: currentPrice * item.quantity,
            itemDiscount: (originalPrice - currentPrice) * item.quantity
        });
    });

    // Calculate discount amount
    const discount = Math.max(0, totalOriginalPrice - totalCurrentPrice);
    const platformFee = 7; // Fixed platform fee
    const protectFee = 0; // Can be added if protection plans are selected
    const total = (data.total || totalCurrentPrice) + platformFee + protectFee;

    // Log for debugging
    // /* console.log */('Cart Price Summary:', {
        totalItems,
        totalOriginalPrice,
        totalCurrentPrice,
        discount,
        discountPercentage: totalOriginalPrice > 0 ? Math.round((discount / totalOriginalPrice) * 100) : 0,
        platformFee,
        total
    });

    // Update item count
    if (summaryItemCount) {
        summaryItemCount.textContent = totalItems;
    }
    if (summaryItemPlural) {
        summaryItemPlural.textContent = totalItems === 1 ? '' : 's';
    }

    // Update price
    if (summaryPrice) {
        summaryPrice.textContent = `₹${formatPrice(totalOriginalPrice)}`;
    }

    // Calculate discount percentage
    const discountPercentage = totalOriginalPrice > 0 ? Math.round((discount / totalOriginalPrice) * 100) : 0;

    // Update discount - Always show if there's any discount (even small amounts)
    if (discount > 0.01) {
        if (summaryDiscount) {
            summaryDiscount.innerHTML = `− ₹${formatPrice(discount)} <span style="color: #388e3c; font-size: 12px;">(${discountPercentage}% off)</span>`;
        }
        if (discountRow) {
            discountRow.style.display = 'flex';
        }
    } else {
        // Hide discount row if no discount
        if (discountRow) {
            discountRow.style.display = 'none';
        }
        if (summaryDiscount) {
            summaryDiscount.textContent = '− ₹0';
        }
    }

    // Update platform fee
    if (platformFeeRow) {
        platformFeeRow.style.display = 'flex';
        if (summaryPlatformFee) {
            summaryPlatformFee.textContent = `₹${formatPrice(platformFee)}`;
        }
    }

    // Update protect fee (if applicable)
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
    const savings = discount;
    if (savings > 0 && summarySavings && savingsAmount) {
        savingsAmount.textContent = `₹${formatPrice(savings)}`;
        summarySavings.style.display = 'block';
    } else if (summarySavings) {
        summarySavings.style.display = 'none';
    }
}

async function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        await removeItem(productId);
        return;
    }
    if (newQuantity > 10) {
        newQuantity = 10;
        showNotification('Maximum quantity is 10', 'error');
    }

    const result = await CART_API.updateCartItem(productId, newQuantity);

    if (result.success) {
        await loadCart();
        await updateCartCountInHeader();
        showNotification('Cart updated');
    } else {
        showNotification(result.message || 'Failed to update cart', 'error');
    }
}

async function removeItem(productId) {
    const confirmed = await showConfirmModal(
        'Remove Item?',
        'Are you sure you want to remove this item from your cart?'
    );

    if (!confirmed) {
        return;
    }

    const result = await CART_API.removeFromCart(productId);

    if (result.success) {
        await loadCart();
        await updateCartCountInHeader();
        showNotification('Item removed from cart');
    } else {
        showNotification(result.message || 'Failed to remove item', 'error');
    }
}

async function saveForLater(productId) {
    // TODO: Implement save for later functionality
    showNotification('Save for later feature coming soon', 'error');
}

function setupEventListeners() {
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', () => {
            window.location.href = '/checkout.html';
        });
    }

    const enterPincodeBtn = document.getElementById('enterPincodeBtn');
    if (enterPincodeBtn) {
        enterPincodeBtn.addEventListener('click', () => {
            const pincode = prompt('Enter your delivery pincode:');
            if (pincode && pincode.length === 6) {
                showNotification('Pincode updated successfully');
                // TODO: Update delivery date based on pincode
            } else if (pincode) {
                showNotification('Please enter a valid 6-digit pincode', 'error');
            }
        });
    }
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
    if (!document.getElementById('notification-styles-cart')) {
        const style = document.createElement('style');
        style.id = 'notification-styles-cart';
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

// Make functions global for onclick handlers
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
window.saveForLater = saveForLater;

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
