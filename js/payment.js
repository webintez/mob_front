// Payment Page JavaScript

let orderData = null;
let cartData = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Recover data from session storage
    let storedOrder = null;
    let storedCart = null;

    try {
        storedOrder = sessionStorage.getItem('pendingOrderData');
        storedCart = sessionStorage.getItem('cartData');

        if (storedOrder) orderData = JSON.parse(storedOrder);
        if (storedCart) cartData = JSON.parse(storedCart);
    } catch (e) {
        console.error('Error parsing session storage data:', e);
    }

    if (!orderData || !cartData || !cartData.items) {
        // Fallback: try to load cart if items missing
        console.warn('Missing order or cart data in session storage. Attempting to reload cart...');
        initFallbackCart();
        return;
    }

    // 2. Setup UI
    populatePriceSummary();
    setupMethodSwitching();
    setupPaymentButtons();
});

async function initFallbackCart() {
    try {
        const result = await CART_API.getCart();
        if (result.success && result.data) {
            // Handle different response structures
            let cartItems = [];
            let cartTotal = 0;
            if (result.data.items && Array.isArray(result.data.items)) {
                cartItems = result.data.items;
                cartTotal = result.data.total || 0;
            } else if (Array.isArray(result.data)) {
                cartItems = result.data;
                cartTotal = cartItems.reduce((sum, item) => sum + (item.subtotal || (item.product?.price || 0) * (item.quantity || 1)), 0);
            }

            if (cartItems.length > 0) {
                cartData = {
                    items: cartItems,
                    total: cartTotal,
                    subtotal: cartItems.reduce((sum, item) => sum + ((parseFloat(item.product?.original_price) || parseFloat(item.product?.price) || 0) * item.quantity), 0),
                    discount: 0 // Will be recalculated in populatePriceSummary
                };
                cartData.discount = Math.max(0, cartData.subtotal - cartData.total);

                // We still need orderData (address etc), if missing redirect to checkout
                if (!orderData) {
                    alert('Delivery details missing. Redirecting to checkout.');
                    window.location.href = '/checkout.html';
                    return;
                }

                populatePriceSummary();
                setupMethodSwitching();
                setupPaymentButtons();
                return;
            }
        }
    } catch (e) {
        console.error('Fallback cart load failed:', e);
    }

    alert('No pending order or items found. Redirecting to cart.');
    window.location.href = '/cart.html';
}

function populatePriceSummary() {
    if (!cartData || !cartData.items) return;

    const totalItems = cartData.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const platformFee = 7 * totalItems;
    const totalPayable = (parseFloat(cartData.total) || 0) + platformFee;

    document.getElementById('summaryItemCount').textContent = totalItems;
    document.getElementById('summaryPrice').textContent = `₹${formatPrice(cartData.subtotal || 0)}`;

    const platformFeeElement = document.getElementById('summaryPlatformFee');
    if (platformFeeElement) platformFeeElement.textContent = `₹${formatPrice(platformFee)}`;

    document.getElementById('summaryTotal').textContent = `₹${formatPrice(totalPayable)}`;

    const summaryDiscount = document.getElementById('summaryDiscount');
    const discountRow = document.getElementById('discountRow');
    const savingsSection = document.getElementById('savingsSection');
    const savingsAmount = document.getElementById('savingsAmount');

    if (cartData.discount > 0.01) {
        if (summaryDiscount) summaryDiscount.textContent = `− ₹${formatPrice(cartData.discount)}`;
        if (savingsAmount) savingsAmount.textContent = `₹${formatPrice(cartData.discount)}`;
        if (discountRow) discountRow.style.display = 'flex';
        if (savingsSection) savingsSection.style.display = 'block';
    } else {
        if (discountRow) discountRow.style.display = 'none';
        if (savingsSection) savingsSection.style.display = 'none';
    }

    // Update Pay button labels
    const payBtnOnline = document.getElementById('payBtnOnline');
    const payBtnCod = document.getElementById('payBtnCod');

    if (payBtnOnline) payBtnOnline.textContent = `Proceed to Pay ₹${formatPrice(totalPayable)}`;
    if (payBtnCod) payBtnCod.textContent = `CONFIRM ORDER (₹${formatPrice(totalPayable)})`;
}

function setupMethodSwitching() {
    const pmItems = document.querySelectorAll('.pm-item');
    const contentSections = document.querySelectorAll('.pm-content-section');

    pmItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.target;

            // Update sidebar active state
            pmItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Show relevant content
            contentSections.forEach(s => s.classList.remove('active'));
            const targetSec = document.getElementById(target) || document.getElementById('others');
            targetSec.classList.add('active');
        });
    });
}

function setupPaymentButtons() {
    // Collect all pay buttons
    const payButtons = [
        { id: 'payBtnOnline', method: 'razorpay' },
        { id: 'payBtnCod', method: 'cod' }
    ];

    payButtons.forEach(btnInfo => {
        const btn = document.getElementById(btnInfo.id);
        if (btn) {
            btn.addEventListener('click', () => handleOrderPlacement(btnInfo.method));
        }
    });
}

async function handleOrderPlacement(method) {
    // Update order data with final method
    orderData.payment_method = method;

    // Show loading on button
    const activeBtn = document.querySelector('.pm-content-section.active .btn-pay-f');
    const originalText = activeBtn.textContent;
    activeBtn.disabled = true;
    activeBtn.textContent = 'Processing...';

    const result = await ORDER_API.createOrder(orderData);

    if (result.success && result.data) {
        const orderInfo = Array.isArray(result.data) ? result.data[0] : result.data;
        const orderNumber = orderInfo.order_number || orderInfo.orderNumber || orderInfo.id;

        if (method === 'razorpay' && result.payment) {
            openRazorpayCheckout(orderData, result.payment, orderNumber);
        } else {
            // Success for COD
            onOrderSuccess(orderNumber);
        }
    } else {
        alert('Order creation failed: ' + (result.message || 'Unknown error'));
        activeBtn.disabled = false;
        activeBtn.textContent = originalText;
    }
}

function openRazorpayCheckout(orderData, paymentData, orderNumber) {
    const options = {
        "key": paymentData.key_id,
        "amount": paymentData.amount,
        "currency": paymentData.currency,
        "name": "Mobitez Private Limited",
        "description": "Order #" + orderNumber,
        "image": "/2.png",
        "order_id": paymentData.id,
        "handler": function (response) {
            verifyPayment(orderNumber, response);
        },
        "prefill": {
            "name": orderData.shipping_address.name,
            "email": orderData.shipping_address.email,
            "contact": orderData.shipping_address.phone
        },
        "theme": { "color": "#2874f0" },
        "modal": {
            "ondismiss": function () {
                alert('Payment cancelled');
                location.reload();
            }
        }
    };

    const rzp1 = new Razorpay(options);
    rzp1.open();
}

async function verifyPayment(orderNumber, response) {
    const result = await ORDER_API.updatePaymentStatus(orderNumber, 'paid', response);
    if (result.success) {
        onOrderSuccess(orderNumber);
    } else {
        alert('Payment verification failed. Please contact support.');
    }
}

async function onOrderSuccess(orderNumber) {
    // Clear cart
    try { await CART_API.clearCart(); } catch (e) { }

    // Clear session storage
    sessionStorage.removeItem('pendingOrderData');

    // Redirect
    window.location.href = `/order.html?order=${orderNumber}`;
}

function formatPrice(price) {
    return parseFloat(price).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
