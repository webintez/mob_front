// EMI Checkout Page Logic

let selectedAddressType = 'home';
let currentProductPrice = 0;
let emiProductIdVal = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check Authentication
    if (typeof isAuthenticated === 'undefined' || !isAuthenticated()) {
        window.location.href = '/login.html?return=' + encodeURIComponent(window.location.href);
        return;
    }

    // 2. Fetch query params
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    if (!productId) {
        showNotification('Invalid Product ID. Redirecting to home...', 'error');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        return;
    }
    emiProductIdVal = productId;

    // 3. Load product details
    await loadProductDetails(productId);

    // 4. Populate User details from session
    populateApplicantDetails();

    // 5. Load Saved Addresses
    await loadSavedAddresses();

    // 6. Bind all Event Listeners
    setupEventListeners();
});

// Load Product Details by ID
async function loadProductDetails(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            const product = result.data;
            currentProductPrice = parseFloat(product.price || 0);

            // Update DOM elements
            const sidebarImg = document.getElementById('sidebarProductImage');
            const sidebarTitle = document.getElementById('sidebarProductTitle');
            const sidebarPrice = document.getElementById('sidebarProductPrice');
            const summaryPrice = document.getElementById('summaryProductPrice');
            const hiddenProductId = document.getElementById('emiProductId');

            if (sidebarImg) sidebarImg.src = product.image_url || '/images/placeholder.jpg';
            if (sidebarTitle) sidebarTitle.textContent = product.name;
            if (sidebarPrice) sidebarPrice.textContent = `₹${formatPrice(currentProductPrice)}`;
            if (summaryPrice) summaryPrice.textContent = `₹${formatPrice(currentProductPrice)}`;
            if (hiddenProductId) hiddenProductId.value = product.id;

            // Compute initial EMI
            updateEmiCalculations();
        } else {
            throw new Error('Product not found');
        }
    } catch (e) {
        showNotification('Failed to load product details: ' + e.message, 'error');
    }
}

// Populate Applicant Name and Phone
function populateApplicantDetails() {
    if (typeof getAuthUser === 'function') {
        const user = getAuthUser();
        if (user) {
            const deliveryName = document.getElementById('deliveryName');
            const deliveryPhone = document.getElementById('deliveryPhone');
            if (deliveryName && user.name) deliveryName.value = user.name;
            if (deliveryPhone && user.phone) deliveryPhone.value = user.phone;
        }
    }
}

// Bind Page and Form Event Listeners
function setupEventListeners() {
    // Address type buttons
    const addressTypeBtns = document.querySelectorAll('.address-type-btn');
    addressTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            addressTypeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedAddressType = btn.dataset.type || 'home';
        });
    });

    // Save and Continue (Step 1 -> Step 2)
    const saveDeliverBtn = document.getElementById('saveDeliverBtn');
    saveDeliverBtn?.addEventListener('click', () => {
        if (validateStep1Address()) {
            collapseStep1();
        }
    });

    // Change Address (Step 2 -> Step 1)
    const changeAddressBtn = document.getElementById('changeAddressBtn');
    const emiBackBtn = document.getElementById('emiBackBtn');
    
    const revertToStep1 = () => {
        document.getElementById('addressActive').style.display = 'block';
        document.getElementById('addressCollapsed').style.display = 'none';
        document.getElementById('emiDetailsSection').style.display = 'none';
        document.getElementById('emiStep2').classList.remove('active');
    };

    changeAddressBtn?.addEventListener('click', revertToStep1);
    emiBackBtn?.addEventListener('click', revertToStep1);

    // Downpayment input calculation listener
    const downpaymentInput = document.getElementById('emiDownpayment');
    downpaymentInput?.addEventListener('input', () => {
        updateEmiCalculations();
    });

    // Tenure input calculation listener
    const tenureSelect = document.getElementById('emiTenureSelect');
    tenureSelect?.addEventListener('change', () => {
        updateEmiCalculations();
    });

    // Setup file upload zones
    setupFileUploadZone('zoneAadhaarFront', 'emiAadhaarFront', 'previewAadhaarFront');
    setupFileUploadZone('zoneAadhaarBack', 'emiAadhaarBack', 'previewAadhaarBack');
    setupFileUploadZone('zonePan', 'emiPanCard', 'previewPan');
    setupFileUploadZone('zonePassbook', 'emiBankPassbook', 'previewPassbook');

    // EMI Form Submission
    const emiSubmitForm = document.getElementById('emiSubmitForm');
    emiSubmitForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitEmiRequest();
    });
}

// Validate Address Input fields (Step 1)
function validateStep1Address() {
    const requiredFields = [
        { id: 'deliveryName', name: 'Name' },
        { id: 'deliveryPhone', name: 'Phone' },
        { id: 'deliveryPincode', name: 'Pincode' },
        { id: 'deliveryLocality', name: 'Locality' },
        { id: 'deliveryAddress1', name: 'Address Line 1' },
        { id: 'deliveryCity', name: 'City' },
        { id: 'deliveryState', name: 'State' }
    ];

    for (const field of requiredFields) {
        const input = document.getElementById(field.id);
        if (!input || !input.value.trim()) {
            showNotification(`Please enter ${field.name}`, 'error');
            input?.focus();
            return false;
        }
    }

    // Phone validation
    const phone = document.getElementById('deliveryPhone').value.trim();
    if (!/^[6-9]\d{9}$/.test(phone)) {
        showNotification('Please enter a valid 10-digit mobile number', 'error');
        document.getElementById('deliveryPhone').focus();
        return false;
    }

    // Pincode validation
    const pincode = document.getElementById('deliveryPincode').value.trim();
    if (!/^\d{6}$/.test(pincode)) {
        showNotification('Please enter a valid 6-digit PIN code', 'error');
        document.getElementById('deliveryPincode').focus();
        return false;
    }

    return true;
}

// Collapse Step 1 form and show summary
function collapseStep1() {
    const name = document.getElementById('deliveryName').value.trim();
    const phone = document.getElementById('deliveryPhone').value.trim();
    const address = document.getElementById('deliveryAddress1').value.trim();
    const locality = document.getElementById('deliveryLocality').value.trim();
    const city = document.getElementById('deliveryCity').value.trim();
    const state = document.getElementById('deliveryState').value;
    const pincode = document.getElementById('deliveryPincode').value.trim();

    const combinedAddress = `${address}, ${locality}, ${city}, ${state}`;

    // Fill collapsed preview box
    document.getElementById('displayUserName').textContent = name;
    document.getElementById('displayAddressType').textContent = selectedAddressType.toUpperCase();
    document.getElementById('displayUserPhone').textContent = phone;
    document.getElementById('displayFullAddress').textContent = `${combinedAddress} - ${pincode}`;

    // Fill hidden inputs in Step 2 form
    document.getElementById('emiCustomerName').value = name;
    document.getElementById('emiCustomerPhone').value = phone;
    document.getElementById('emiCustomerAddress').value = combinedAddress;
    document.getElementById('emiCustomerPincode').value = pincode;

    // Toggle views
    document.getElementById('addressActive').style.display = 'none';
    document.getElementById('addressCollapsed').style.display = 'block';
    document.getElementById('emiDetailsSection').style.display = 'block';

    // Update stepper
    document.getElementById('emiStep2').classList.add('active');

    // Scroll down to details
    document.getElementById('emiDetailsSection').scrollIntoView({ behavior: 'smooth' });
}

// Compute loan deductions and estimate installments
function updateEmiCalculations() {
    const downpaymentInput = document.getElementById('emiDownpayment');
    const downpaymentVal = parseFloat(downpaymentInput?.value || 0);

    const summaryDownpaymentRow = document.getElementById('summaryDownpaymentRow');
    const summaryDownpayment = document.getElementById('summaryDownpayment');
    const summaryLoanAmount = document.getElementById('summaryLoanAmount');
    const summaryEmiMonthly = document.getElementById('summaryEmiMonthly');

    // Validate downpayment range
    if (downpaymentVal > currentProductPrice) {
        showNotification('Downpayment cannot exceed product base price', 'error');
        downpaymentInput.value = 0;
        updateEmiCalculations();
        return;
    }

    const loanAmount = Math.max(0, currentProductPrice - downpaymentVal);
    const tenureSelect = document.getElementById('emiTenureSelect');
    const tenureMonths = parseInt(tenureSelect?.value || 12);
    const monthlyEmi = Math.round(loanAmount / tenureMonths);

    // Update sidebar calculations display
    if (downpaymentVal > 0) {
        if (summaryDownpaymentRow) summaryDownpaymentRow.style.display = 'flex';
        if (summaryDownpayment) summaryDownpayment.textContent = `− ₹${formatPrice(downpaymentVal)}`;
    } else {
        if (summaryDownpaymentRow) summaryDownpaymentRow.style.display = 'none';
    }

    if (summaryLoanAmount) summaryLoanAmount.textContent = `₹${formatPrice(loanAmount)}`;
    if (summaryEmiMonthly) summaryEmiMonthly.textContent = `₹${formatPrice(monthlyEmi)} / month`;
}

// Fetch saved addresses from profile and populate lists
async function loadSavedAddresses() {
    const savedWrapper = document.getElementById('emiSavedAddressesWrapper');
    const addressesGrid = document.getElementById('emiAddressesGrid');
    
    // Inputs in address active form
    const deliveryName = document.getElementById('deliveryName');
    const deliveryPhone = document.getElementById('deliveryPhone');
    const deliveryAddress1 = document.getElementById('deliveryAddress1');
    const deliveryLocality = document.getElementById('deliveryLocality');
    const deliveryCity = document.getElementById('deliveryCity');
    const deliveryState = document.getElementById('deliveryState');
    const deliveryPincode = document.getElementById('deliveryPincode');
    const saveCheckboxGroup = document.getElementById('saveAddressCheckboxGroup');

    if (!addressesGrid) return;

    addressesGrid.innerHTML = '<div style="grid-column: 1/-1; padding: 10px 0; text-align: center; color: #878787;">Loading saved addresses...</div>';

    try {
        if (typeof PROFILE_API === 'undefined' || typeof PROFILE_API.getAddresses !== 'function') {
            throw new Error('Profile API not loaded');
        }

        const result = await PROFILE_API.getAddresses();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            const addresses = result.data;
            if (savedWrapper) savedWrapper.style.display = 'block';
            addressesGrid.innerHTML = '';

            // Render selectable address cards
            addresses.forEach(addr => {
                const isDefault = addr.is_default;
                const card = document.createElement('div');
                card.className = `emi-address-card ${isDefault ? 'selected' : ''}`;
                card.dataset.addressJson = JSON.stringify(addr);

                card.innerHTML = `
                    <div class="emi-address-card-header">
                        <h5>${escapeHtml(addr.name)}</h5>
                        ${addr.address_type ? `<span class="emi-address-badge">${addr.address_type}</span>` : ''}
                    </div>
                    <p class="phone">Phone: ${escapeHtml(addr.phone)}</p>
                    <p>${escapeHtml(addr.address_line1)}</p>
                    <p>${escapeHtml(addr.city)}, ${escapeHtml(addr.state)} - ${escapeHtml(addr.postal_code)}</p>
                `;

                // Card click bindings
                card.addEventListener('click', () => {
                    document.querySelectorAll('.emi-address-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');

                    // Populate fields
                    if (deliveryName) deliveryName.value = addr.name || '';
                    if (deliveryPhone) deliveryPhone.value = addr.phone || '';
                    if (deliveryAddress1) deliveryAddress1.value = addr.address_line1 || '';
                    if (deliveryLocality) deliveryLocality.value = addr.locality || addr.address_line2 || '';
                    if (deliveryCity) deliveryCity.value = addr.city || '';
                    if (deliveryState) deliveryState.value = addr.state || '';
                    if (deliveryPincode) deliveryPincode.value = addr.postal_code || '';
                    
                    // Set active type badge
                    const type = addr.address_type || 'home';
                    selectedAddressType = type;
                    const typeBtns = document.querySelectorAll('.address-type-btn');
                    typeBtns.forEach(btn => {
                        if (btn.dataset.type === type) {
                            btn.classList.add('active');
                        } else {
                            btn.classList.remove('active');
                        }
                    });

                    // Hide checkbox group
                    if (saveCheckboxGroup) saveCheckboxGroup.style.display = 'none';
                });

                addressesGrid.appendChild(card);

                // If default address, select immediately
                if (isDefault) {
                    if (deliveryName) deliveryName.value = addr.name || '';
                    if (deliveryPhone) deliveryPhone.value = addr.phone || '';
                    if (deliveryAddress1) deliveryAddress1.value = addr.address_line1 || '';
                    if (deliveryLocality) deliveryLocality.value = addr.locality || addr.address_line2 || '';
                    if (deliveryCity) deliveryCity.value = addr.city || '';
                    if (deliveryState) deliveryState.value = addr.state || '';
                    if (deliveryPincode) deliveryPincode.value = addr.postal_code || '';
                    
                    const type = addr.address_type || 'home';
                    selectedAddressType = type;
                    const typeBtns = document.querySelectorAll('.address-type-btn');
                    typeBtns.forEach(btn => {
                        if (btn.dataset.type === type) {
                            btn.classList.add('active');
                        } else {
                            btn.classList.remove('active');
                        }
                    });
                }
            });

            // Fallback selection of first address card
            const selectedCards = addressesGrid.querySelectorAll('.emi-address-card.selected');
            if (selectedCards.length === 0 && addresses.length > 0) {
                const firstCard = addressesGrid.querySelector('.emi-address-card');
                if (firstCard) firstCard.click();
            }

            // "Use different address" card
            const newAddressCard = document.createElement('div');
            newAddressCard.className = 'emi-address-card';
            newAddressCard.style.cssText = 'border-style: dashed; display: flex; align-items: center; justify-content: center; min-height: 100px;';
            newAddressCard.innerHTML = `
                <div style="text-align: center; color: #2874f0;">
                    <i class="fas fa-plus" style="font-size: 20px; margin-bottom: 6px;"></i>
                    <h5 style="margin:0; font-size:13px; font-weight:500;">Use a different address</h5>
                </div>
            `;

            newAddressCard.addEventListener('click', () => {
                document.querySelectorAll('.emi-address-card').forEach(c => c.classList.remove('selected'));
                newAddressCard.classList.add('selected');

                // Clear fields
                if (deliveryName) deliveryName.value = '';
                if (deliveryPhone) deliveryPhone.value = '';
                if (deliveryAddress1) deliveryAddress1.value = '';
                if (deliveryLocality) deliveryLocality.value = '';
                if (deliveryCity) deliveryCity.value = '';
                if (deliveryState) deliveryState.value = '';
                if (deliveryPincode) deliveryPincode.value = '';
                
                // Reset address type to home
                selectedAddressType = 'home';
                const typeBtns = document.querySelectorAll('.address-type-btn');
                typeBtns.forEach(btn => {
                    if (btn.dataset.type === 'home') {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });

                // Show Save checkbox
                if (saveCheckboxGroup) saveCheckboxGroup.style.display = 'block';
            });

            addressesGrid.appendChild(newAddressCard);
        } else {
            // No saved address found
            if (savedWrapper) savedWrapper.style.display = 'none';
            if (saveCheckboxGroup) saveCheckboxGroup.style.display = 'block';
        }
    } catch (e) {
        if (savedWrapper) savedWrapper.style.display = 'none';
        if (saveCheckboxGroup) saveCheckboxGroup.style.display = 'block';
    }
}

// Setup Drag & Drop and Preview zones for uploads
function setupFileUploadZone(zoneId, inputId, previewId) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (!zone || !input || !preview) return;

    zone.addEventListener('click', () => {
        input.click();
    });

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            input.files = e.dataTransfer.files;
            handleFileSelect(input.files[0], zone, preview, input);
        }
    });

    input.addEventListener('change', () => {
        if (input.files.length) {
            handleFileSelect(input.files[0], zone, preview, input);
        }
    });
}

// File select handler
function handleFileSelect(file, zone, preview, input) {
    // 1. Validate Image Type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
        showNotification('Invalid file type. Only JPEG, JPG, and PNG are allowed.', 'error');
        input.value = '';
        return;
    }

    // 2. Validate Image Size (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
        showNotification('File exceeds the 2MB size limit.', 'error');
        input.value = '';
        return;
    }

    // 3. Render Preview
    const reader = new FileReader();
    reader.onload = (e) => {
        zone.style.display = 'none';
        preview.style.display = 'flex';
        preview.innerHTML = `
            <img src="${e.target.result}" class="emi-preview-img" alt="Document Preview" style="max-width: 100%; max-height: 100%; object-fit: contain;">
            <button type="button" class="emi-preview-remove" title="Remove image" style="position: absolute; top: 6px; right: 6px; background: rgba(0, 0, 0, 0.7); color: white; border: none; border-radius: 50%; width: 26px; height: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: background 0.2s; z-index: 2;">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;

        // Bind Remove Click
        const removeBtn = preview.querySelector('.emi-preview-remove');
        removeBtn.addEventListener('click', () => {
            input.value = '';
            preview.innerHTML = '';
            preview.style.display = 'none';
            zone.style.display = 'flex';
        });
    };
    reader.readAsDataURL(file);
}

// Final Submit EMI Request API caller
async function submitEmiRequest() {
    const submitBtn = document.getElementById('emiSubmitBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting Application...';
    }

    try {
        const emiForm = document.getElementById('emiSubmitForm');
        
        // Save address in background if user requested
        const saveCheckbox = document.getElementById('emiSaveNewAddress');
        if (saveCheckbox && saveCheckbox.checked && saveCheckbox.style.display !== 'none') {
            const address1 = document.getElementById('deliveryAddress1').value.trim();
            const locality = document.getElementById('deliveryLocality').value.trim();
            const city = document.getElementById('deliveryCity').value.trim();
            const state = document.getElementById('deliveryState').value;
            const pincode = document.getElementById('deliveryPincode').value.trim();
            const name = document.getElementById('deliveryName').value.trim();
            const phone = document.getElementById('deliveryPhone').value.trim();

            const addressPayload = {
                name: name,
                phone: phone,
                postal_code: pincode,
                address_line1: address1,
                address_line2: locality,
                city: city,
                state: state,
                locality: locality,
                address_type: selectedAddressType,
                is_default: false,
                country: 'India'
            };

            if (typeof PROFILE_API !== 'undefined' && typeof PROFILE_API.addAddress === 'function') {
                PROFILE_API.addAddress(addressPayload).catch(() => {});
            }
        }

        const formData = new FormData(emiForm);

        if (typeof PROFILE_API !== 'undefined' && typeof PROFILE_API.submitEmiRequest === 'function') {
            const result = await PROFILE_API.submitEmiRequest(formData);
            if (result.success) {
                showNotification(result.message || 'EMI request submitted successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '/profile.html?tab=emi';
                }, 1500);
            } else {
                showNotification(result.message || 'Failed to submit EMI request. Please check verification constraints.', 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'SUBMIT EMI REQUEST';
                }
            }
        } else {
            throw new Error('EMI Request API module not loaded');
        }
    } catch (e) {
        showNotification(e.message || 'Failed to submit EMI request. Please try again.', 'error');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'SUBMIT EMI REQUEST';
        }
    }
}

// Utility formatting functions
function formatPrice(price) {
    return parseFloat(price).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
        z-index: 10005;
        animation: emiSlideIn 0.3s ease-out;
        min-width: 200px;
    `;

    if (!document.getElementById('notification-styles-emi')) {
        const style = document.createElement('style');
        style.id = 'notification-styles-emi';
        style.textContent = `
            @keyframes emiSlideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
