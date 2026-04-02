// Profile Page JavaScript

let profileData = null;
let isEditingPersonalInfo = false;
let isEditingEmail = false;
let isEditingPhone = false;

const urlParams = new URLSearchParams(window.location.search);
const allowedSections = new Set(['personal', 'addresses', 'pan', 'upi', 'reviews']);
let activeSection = urlParams.get('section') || 'personal';
if (!allowedSections.has(activeSection)) {
    activeSection = 'personal';
}
let addressList = [];
let editingAddressId = null;
let stateOptions = [];
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const UPI_REGEX = /^[^\s@]+@[^\s@]+$/;
let panDetails = null;
let panExists = false;
let panSubmitting = false;
let upiDetails = null;
let upiHandles = [];
let upiSubmitting = false;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '/login.html?return=/profile.html';
        return;
    }

    // Setup login dropdown
    setupLoginDropdown();
    updateAuthUI();
    await updateCartCountInHeader();
    applyActiveSection();
    updateSidebarActiveLink(activeSection);
    if (activeSection === 'addresses') {
        await ensureStatesLoaded();
        await initAddressSection();
    } else if (activeSection === 'pan') {
        await initPanSection();
    } else if (activeSection === 'upi') {
        await initUpiSection();
    } else if (activeSection === 'reviews') {
        await initReviewsSection();
    }

    // Load profile
    await loadProfile();

    // Setup event listeners
    setupEventListeners();
});

async function loadProfile() {
    // First try to get from API
    const result = await PROFILE_API.getProfile();

    if (result.success && result.data) {
        profileData = result.data;
        displayProfile(result.data);
    } else {
        // Fallback to localStorage user data
        const user = getAuthUser();
        if (user) {
            profileData = { user: user };
            displayProfile({ user: user });
        } else {
            showError('Failed to load profile');
        }
    }
}

function displayProfile(data) {
    const user = data.user || data;
    
    // Split name into first and last name
    const fullName = user.name || '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Update sidebar greeting
    const greetingText = document.querySelector('.user-greeting-text');
    if (greetingText) {
        const nameLine = firstName ? `${firstName} ${lastName}`.trim() : '';
        greetingText.innerHTML = nameLine ? `Hello<br>${nameLine}` : 'Hello';
    }

    // Display personal info
    displayPersonalInfo(user, firstName, lastName);
    
    // Display email
    displayEmail(user.email || '');
    
    // Display phone
    displayPhone(user.phone || '');
}

function displayPersonalInfo(user, firstName, lastName) {
    // Display mode - populate disabled inputs
    const displayFirstName = document.getElementById('displayFirstName');
    const displayLastName = document.getElementById('displayLastName');
    const displayGenderMale = document.getElementById('displayGenderMale');
    const displayGenderFemale = document.getElementById('displayGenderFemale');

    if (displayFirstName) displayFirstName.value = firstName;
    if (displayLastName) displayLastName.value = lastName;
    
    if (user.gender) {
        if (displayGenderMale) displayGenderMale.checked = user.gender.toLowerCase() === 'male';
        if (displayGenderFemale) displayGenderFemale.checked = user.gender.toLowerCase() === 'female';
    }

    // Edit mode - populate form
    const firstNameInput = document.getElementById('firstNameInput');
    const lastNameInput = document.getElementById('lastNameInput');
    const genderMale = document.getElementById('genderMale');
    const genderFemale = document.getElementById('genderFemale');

    if (firstNameInput) firstNameInput.value = firstName;
    if (lastNameInput) lastNameInput.value = lastName;
    
    if (user.gender) {
        if (genderMale) genderMale.checked = user.gender.toLowerCase() === 'male';
        if (genderFemale) genderFemale.checked = user.gender.toLowerCase() === 'female';
    }
}

function displayEmail(email) {
    const emailInput = document.getElementById('emailInput');
    if (emailInput) {
        emailInput.value = email;
    }
}

function displayPhone(phone) {
    const phoneInput = document.getElementById('phoneInput');
    if (phoneInput) {
        phoneInput.value = phone;
    }
}

function setupEventListeners() {
    // Edit personal info
    const editPersonalInfoBtn = document.getElementById('editPersonalInfoBtn');
    const cancelPersonalInfoBtn = document.getElementById('cancelPersonalInfoBtn');
    const personalInfoForm = document.getElementById('personalInfoForm');
    const personalInfoDisplay = document.getElementById('personalInfoDisplay');

    if (editPersonalInfoBtn) {
        editPersonalInfoBtn.addEventListener('click', () => {
            isEditingPersonalInfo = true;
            if (personalInfoForm) personalInfoForm.style.display = 'block';
            if (personalInfoDisplay) personalInfoDisplay.style.display = 'none';
            if (editPersonalInfoBtn) editPersonalInfoBtn.style.display = 'none';
        });
    }

    if (cancelPersonalInfoBtn) {
        cancelPersonalInfoBtn.addEventListener('click', () => {
            isEditingPersonalInfo = false;
            if (personalInfoForm) personalInfoForm.style.display = 'none';
            if (personalInfoDisplay) personalInfoDisplay.style.display = 'block';
            if (editPersonalInfoBtn) editPersonalInfoBtn.style.display = 'block';
            // Reset form
            const user = profileData.user || profileData;
            const fullName = user.name || '';
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            displayPersonalInfo(user, firstName, lastName);
        });
    }

    // Personal info form submit
    if (personalInfoForm) {
        personalInfoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await savePersonalInfo();
        });
    }

    // Edit email
    const editEmailBtn = document.getElementById('editEmailBtn');
    const emailInput = document.getElementById('emailInput');
    if (editEmailBtn && emailInput) {
        editEmailBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isEditingEmail) {
                // Save email
                saveEmail();
            } else {
                // Enable editing
                isEditingEmail = true;
                emailInput.disabled = false;
                emailInput.focus();
                editEmailBtn.textContent = 'Save';
            }
        });
    }

    // Edit phone
    const editPhoneBtn = document.getElementById('editPhoneBtn');
    const phoneInput = document.getElementById('phoneInput');
    if (editPhoneBtn && phoneInput) {
        editPhoneBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isEditingPhone) {
                // Save phone
                savePhone();
            } else {
                // Enable editing
                isEditingPhone = true;
                phoneInput.disabled = false;
                phoneInput.focus();
                editPhoneBtn.textContent = 'Save';
            }
        });
    }

    // Deactivate account
    const deactivateAccountBtn = document.getElementById('deactivateAccountBtn');
    if (deactivateAccountBtn) {
        deactivateAccountBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to deactivate your account? This action can be reversed later.')) {
                // TODO: Implement deactivate account API
                showNotification('Account deactivation feature coming soon', 'error');
            }
        });
    }

    // Delete account
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                // TODO: Implement delete account API
                showNotification('Account deletion feature coming soon', 'error');
            }
        });
    }
}

async function savePersonalInfo() {
    const firstName = document.getElementById('firstNameInput').value;
    const lastName = document.getElementById('lastNameInput').value;
    const genderMale = document.getElementById('genderMale');
    const genderFemale = document.getElementById('genderFemale');
    
    let gender = '';
    if (genderMale && genderMale.checked) gender = 'male';
    if (genderFemale && genderFemale.checked) gender = 'female';

    const fullName = `${firstName} ${lastName}`.trim();

    const profileData = {
        name: fullName,
        gender: gender || undefined
    };

    const result = await PROFILE_API.updateProfile(profileData);

    if (result.success) {
        showNotification('Profile updated successfully');
        // Update auth user data
        const user = getAuthUser();
        if (user) {
            const updatedUser = { ...user, ...profileData };
            setAuth(getAuthToken(), updatedUser);
        }
        // Reload profile
        await loadProfile();
        // Switch back to display mode
        const editPersonalInfoBtn = document.getElementById('editPersonalInfoBtn');
        const personalInfoForm = document.getElementById('personalInfoForm');
        const personalInfoDisplay = document.getElementById('personalInfoDisplay');
        if (personalInfoForm) personalInfoForm.style.display = 'none';
        if (personalInfoDisplay) personalInfoDisplay.style.display = 'block';
        if (editPersonalInfoBtn) editPersonalInfoBtn.style.display = 'block';
        isEditingPersonalInfo = false;
    } else {
        showNotification(result.message || 'Failed to update profile', 'error');
    }
}

async function saveEmail() {
    const emailInput = document.getElementById('emailInput');
    const editEmailBtn = document.getElementById('editEmailBtn');
    
    if (!emailInput || !emailInput.value) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    // Get current user name to include with email update
    const user = profileData?.user || profileData;
    const currentName = user?.name || '';

    const result = await PROFILE_API.updateEmail(emailInput.value, currentName);

    if (result.success) {
        showNotification('Email updated successfully');
        isEditingEmail = false;
        emailInput.disabled = true;
        if (editEmailBtn) editEmailBtn.textContent = 'Edit';
        
        // Update local auth data
        const authUser = getAuthUser();
        if (authUser) {
            authUser.email = emailInput.value;
            setAuth(getAuthToken(), authUser);
        }
    } else {
        showNotification(result.message || 'Failed to update email', 'error');
    }
}

async function savePhone() {
    const phoneInput = document.getElementById('phoneInput');
    const editPhoneBtn = document.getElementById('editPhoneBtn');
    
    if (!phoneInput || !phoneInput.value) {
        showNotification('Please enter a valid phone number', 'error');
        return;
    }

    const result = await PROFILE_API.updateProfile({ phone: phoneInput.value });

    if (result.success) {
        showNotification('Phone number updated successfully');
        isEditingPhone = false;
        phoneInput.disabled = true;
        if (editPhoneBtn) editPhoneBtn.textContent = 'Edit';
        
        // Update local auth data
        const authUser = getAuthUser();
        if (authUser) {
            authUser.phone = phoneInput.value;
            setAuth(getAuthToken(), authUser);
        }
    } else {
        showNotification(result.message || 'Failed to update phone number', 'error');
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showError(message) {
    const profileMain = document.querySelector('.profile-main-content');
    if (profileMain) {
        profileMain.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <h2>${message}</h2>
                <a href="/" class="btn-primary">Go to Home</a>
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
    if (!document.getElementById('notification-styles-profile')) {
        const style = document.createElement('style');
        style.id = 'notification-styles-profile';
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

async function ensureStatesLoaded() {
    if (stateOptions.length) {
        populateStateSelect();
        return;
    }
    const result = await PROFILE_API.getStates();
    if (result.success && Array.isArray(result.data)) {
        stateOptions = result.data;
        populateStateSelect();
    } else if (!result.unauthorized) {
        showNotification(result.message || 'Failed to load state list', 'error');
    }
}

function populateStateSelect(selectedState = '') {
    const select = document.getElementById('formState');
    if (!select) return;
    const options = ['<option value="">--Select State--</option>']
        .concat(stateOptions.map(state => `<option value="${escapeHtml(state)}">${escapeHtml(state)}</option>`));
    select.innerHTML = options.join('');
    if (selectedState) {
        select.value = selectedState;
    }
}

function applyActiveSection() {
    const sections = document.querySelectorAll('[data-profile-section]');
    sections.forEach(section => {
        if (section.dataset.profileSection === activeSection) {
            section.style.display = '';
        } else {
            section.style.display = 'none';
        }
    });
}

function updateSidebarActiveLink(section) {
    const sidebarLinks = document.querySelectorAll('.sidebar-submenu-item');
    sidebarLinks.forEach(link => {
        const targetSection = resolveSectionFromLink(link);
        if (targetSection) {
            link.classList.toggle('active', targetSection === section);
        } else {
            link.classList.remove('active');
        }
    });
}

function resolveSectionFromLink(link) {
    const href = link.getAttribute('href') || '';
    if (!href.includes('/profile.html')) {
        return null;
    }
    try {
        const url = new URL(href, window.location.origin);
        return url.searchParams.get('section') || 'personal';
    } catch (error) {
        return 'personal';
    }
}

async function initAddressSection() {
    const toggleBtn = document.getElementById('toggleAddAddressBtn');
    const cancelBtn = document.getElementById('cancelAddressBtn');
    const form = document.getElementById('addressForm');
    const list = document.getElementById('addressesList');
    const locationBtn = document.getElementById('currentLocationBtn');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            editingAddressId = null;
            resetAddressForm();
            showAddressForm(false);
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', (event) => {
            event.preventDefault();
            editingAddressId = null;
            hideAddressForm();
        });
    }

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            await saveAddressForm();
        });
    }

    if (locationBtn) {
        locationBtn.addEventListener('click', () => {
            showNotification('Location lookup is coming soon', 'error');
        });
    }

    if (list) {
        list.addEventListener('click', async (event) => {
            const button = event.target.closest('button[data-action]');
            if (!button) return;
            const action = button.dataset.action;
            const card = button.closest('.address-card');
            if (!card) return;
            const addressId = card.dataset.addressId;
            if (!addressId) return;
            if (action === 'edit') {
                handleAddressEdit(addressId);
            } else if (action === 'delete') {
                await handleAddressDelete(addressId);
            } else if (action === 'set-default') {
                await handleSetDefault(addressId);
            }
        });
    }

    await loadAddresses();
}

async function loadAddresses() {
    const list = document.getElementById('addressesList');
    if (list) {
        list.innerHTML = '<div class="addresses-loading">Loading addresses…</div>';
    }
    const result = await PROFILE_API.getAddresses();
    if (result.success && Array.isArray(result.data)) {
        addressList = result.data;
    } else {
        addressList = [];
        if (!result.unauthorized) {
            showNotification(result.message || 'Failed to load addresses', 'error');
        }
    }
    renderAddresses();
}

function renderAddresses() {
    const list = document.getElementById('addressesList');
    if (!list) return;
    if (!addressList.length) {
        list.innerHTML = '<div class="addresses-empty">You have not added any addresses yet.</div>';
        return;
    }
    list.innerHTML = addressList.map(createAddressCardMarkup).join('');
}

async function initUpiSection() {
    const upiForm = document.getElementById('upiForm');
    if (upiForm) {
        upiForm.addEventListener('submit', handleUpiSubmit);
    }
    await loadUpiDetails();
}

async function loadUpiDetails() {
    const statusEl = document.getElementById('upiStatus');
    setUpiStatus('', 'info');
    const result = await PROFILE_API.getUpi();
    if (result.success && result.data) {
        upiDetails = result.data;
        renderUpiList(result.data);
        const statusText = result.data.is_verified ? 'UPI verified' : 'UPI pending verification';
        setUpiStatus(statusText, result.data.is_verified ? 'success' : 'info');
    } else {
        upiDetails = null;
        renderUpiList(null);
        setUpiStatus(result.message || 'No UPI saved yet.', 'info');
    }
}

function renderUpiList(data) {
    const list = document.getElementById('upiList');
    if (!list) return;
    if (!data) {
        list.innerHTML = '<div class="upi-empty">You have not saved any UPI yet.</div>';
        return;
    }
    list.innerHTML = `
        <div class="upi-card">
            <div>
                <span>${escapeHtml(data.masked_upi_id || data.upi_id || 'UPI')}</span>
                <div class="upi-meta">${escapeHtml(data.holder_name || '')}</div>
            </div>
            <div class="upi-actions">
                <button type="button" id="upiDeleteBtn">Delete</button>
            </div>
        </div>
    `;
    const deleteBtn = document.getElementById('upiDeleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!confirm('Remove this UPI ID?')) return;
            const result = await PROFILE_API.deleteUpi();
            if (result.success) {
                upiDetails = null;
                renderUpiList(null);
                setUpiStatus('UPI ID removed', 'info');
            } else if (!result.unauthorized) {
                setUpiStatus(result.message || 'Failed to delete UPI', 'error');
            }
        });
    }
}

function setUpiStatus(message, type = 'info') {
    const statusEl = document.getElementById('upiStatus');
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `upi-status ${type}`;
}

async function handleUpiSubmit(event) {
    event.preventDefault();
    if (upiSubmitting) return;
    const upiIdInput = document.getElementById('upiIdInput');
    const upiNameInput = document.getElementById('upiNameInput');
    const submitBtn = document.getElementById('upiSaveBtn');
    if (!upiIdInput || !upiNameInput) return;
    const upiId = (upiIdInput.value || '').trim();
    const name = (upiNameInput.value || '').trim();
    if (!UPI_REGEX.test(upiId)) {
        setUpiStatus('Invalid UPI ID format', 'error');
        return;
    }
    if (!name) {
        setUpiStatus('Holder name is required', 'error');
        return;
    }
    upiSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = upiDetails ? 'Updating...' : 'Saving...';

    const payload = { upi_id: upiId, holder_name: name };
    const result = upiDetails ? await PROFILE_API.updateUpi(payload) : await PROFILE_API.addUpi(payload);

    upiSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save UPI';

    if (result.success && result.data) {
        upiDetails = result.data;
        renderUpiList(result.data);
        setUpiStatus(result.message || 'UPI saved successfully', 'success');
        await loadUpiStatus();
    } else if (!result.unauthorized) {
        setUpiStatus(result.message || 'Failed to save UPI', 'error');
    }
}

async function loadUpiStatus() {
    const result = await PROFILE_API.getUpiStatus();
    if (result.success && result.data) {
        const statusText = result.data.verification_status === 'verified'
            ? 'UPI verified'
            : result.data.verification_status === 'rejected'
                ? `Rejected: ${result.data.rejection_reason || 'Reason not available'}`
                : 'UPI pending verification';
        setUpiStatus(statusText, result.data.verification_status === 'verified' ? 'success' : 'info');
    }
}


function createAddressCardMarkup(address) {
    const streetLines = [address.address_line1, address.address_line2].filter(Boolean);
    const cityLine = [address.city, address.state, address.postal_code].filter(Boolean).join(', ');
    const locality = address.locality ? `<p class="address-meta">${escapeHtml(address.locality)}</p>` : '';
    const phone = address.phone ? `<p class="address-meta">Phone: ${escapeHtml(address.phone)}</p>` : '';
    const altPhone = address.alternate_phone ? `<p class="address-meta-small">Alternate: ${escapeHtml(address.alternate_phone)}</p>` : '';
    const typeBadge = address.address_type ? `<span class="address-badge">${capitalize(address.address_type)}</span>` : '';
    const landmark = address.landmark ? `<p class="address-meta-small">Landmark: ${escapeHtml(address.landmark)}</p>` : '';
    const defaultBadge = address.is_default ? '<span class="address-badge">Default</span>' : '';

    return `
        <div class="address-card" data-address-id="${address.id}">
            <div class="address-card-head">
                <div>
                    <div class="address-title-row">
                        <h4>${escapeHtml(address.name || 'Address')}</h4>
                        ${typeBadge}
                        ${defaultBadge}
                    </div>
                    ${phone}
                    ${locality}
                    ${landmark}
                </div>
                <div class="address-card-actions">
                    <button type="button" data-action="edit">Edit</button>
                    <button type="button" data-action="delete">Delete</button>
                    ${address.is_default ? '' : '<button type="button" data-action="set-default">Set Default</button>'}
                </div>
            </div>
            ${streetLines.length ? `<p class="address-line">${escapeHtml(streetLines.join(', '))}</p>` : ''}
            ${cityLine ? `<p class="address-meta-small">${escapeHtml(cityLine)}</p>` : ''}
            ${altPhone}
        </div>
    `;
}

async function saveAddressForm() {
    const payload = getAddressPayloadFromForm();
    if (!payload) return;
    toggleAddressFormButtons(true);
    const result = editingAddressId
        ? await PROFILE_API.updateAddress(editingAddressId, payload)
        : await PROFILE_API.addAddress(payload);
    toggleAddressFormButtons(false);
    if (result.success) {
        showNotification(editingAddressId ? 'Address updated successfully' : 'Address saved successfully');
        editingAddressId = null;
        resetAddressForm();
        hideAddressForm();
        await loadAddresses();
    } else if (!result.unauthorized) {
        showNotification(result.message || 'Failed to save address', 'error');
    }
}

function getAddressPayloadFromForm() {
    const form = document.getElementById('addressForm');
    if (!form) return null;
    const formData = new FormData(form);
    const payload = {
        name: (formData.get('name') || '').trim(),
        phone: (formData.get('phone') || '').trim(),
        postal_code: (formData.get('postal_code') || '').trim(),
        locality: (formData.get('locality') || '').trim(),
        address_line1: (formData.get('address_line1') || '').trim(),
        city: (formData.get('city') || '').trim(),
        state: (formData.get('state') || '').trim(),
        landmark: (formData.get('landmark') || '').trim(),
        alternate_phone: (formData.get('alternate_phone') || '').trim(),
        address_type: formData.get('address_type') || 'home',
        is_default: formData.has('is_default')
    };

    const requiredFields = ['name', 'phone', 'postal_code', 'locality', 'address_line1', 'city', 'state'];
    for (const field of requiredFields) {
        if (!payload[field]) {
            showNotification('Please fill all required fields', 'error');
            return null;
        }
    }

    payload.is_default = !!payload.is_default;
    if (!payload.landmark) {
        delete payload.landmark;
    }
    if (!payload.alternate_phone) {
        delete payload.alternate_phone;
    }
    payload.country = 'India';

    return payload;
}

function populateAddressForm(address) {
    const form = document.getElementById('addressForm');
    if (!form || !address) return;
    form.elements['name'].value = address.name || '';
    form.elements['phone'].value = address.phone || '';
    form.elements['postal_code'].value = address.postal_code || '';
    form.elements['locality'].value = address.locality || '';
    form.elements['address_line1'].value = address.address_line1 || '';
    form.elements['city'].value = address.city || '';
    populateStateSelect(address.state || '');
    form.elements['landmark'].value = address.landmark || '';
    form.elements['alternate_phone'].value = address.alternate_phone || '';
    const addressType = form.querySelector(`input[name="address_type"][value="${address.address_type || 'home'}"]`);
    if (addressType) {
        addressType.checked = true;
    }
    form.elements['is_default'].checked = !!address.is_default;
    editingAddressId = address.id;
    showAddressForm(true);
}

function handleAddressEdit(addressId) {
    const address = addressList.find(addr => String(addr.id) === String(addressId));
    if (!address) return;
    populateAddressForm(address);
}

async function handleAddressDelete(addressId) {
    if (!confirm('Are you sure you want to delete this address?')) {
        return;
    }
    const result = await PROFILE_API.deleteAddress(addressId);
    if (result.success) {
        showNotification('Address deleted successfully');
        await loadAddresses();
    } else if (!result.unauthorized) {
        showNotification(result.message || 'Failed to delete address', 'error');
    }
}

async function handleSetDefault(addressId) {
    const result = await PROFILE_API.updateAddress(addressId, { is_default: true });
    if (result.success) {
        showNotification('Default address updated');
        await loadAddresses();
    } else if (!result.unauthorized) {
        showNotification(result.message || 'Failed to update default address', 'error');
    }
}

function resetAddressForm() {
    const form = document.getElementById('addressForm');
    if (form) {
        form.reset();
    }
    editingAddressId = null;
    const title = document.getElementById('addressFormTitle');
    if (title) {
        title.textContent = 'Add a new address';
    }

    const defaultRadio = document.querySelector('input[name="address_type"][value="home"]');
    if (defaultRadio) {
        defaultRadio.checked = true;
    }
    const defaultCheckbox = document.getElementById('addressDefault');
    if (defaultCheckbox) {
        defaultCheckbox.checked = false;
    }
    populateStateSelect();
}

function showAddressForm(isEditing = false) {
    const container = document.getElementById('addressFormContainer');
    const title = document.getElementById('addressFormTitle');
    if (title) {
        title.textContent = isEditing ? 'Edit address' : 'Add a new address';
    }
    if (container) {
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function hideAddressForm() {
    const container = document.getElementById('addressFormContainer');
    if (container) {
        container.style.display = 'none';
    }
    resetAddressForm();
}

function toggleAddressFormButtons(disabled) {
    const saveBtn = document.getElementById('saveAddressBtn');
    const cancelBtn = document.getElementById('cancelAddressBtn');
    if (saveBtn) {
        saveBtn.disabled = disabled;
    }
    if (cancelBtn) {
        cancelBtn.disabled = disabled;
    }
}

function escapeHtml(value) {
    if (!value) return '';
    return String(value).replace(/[&<>"']/g, (match) => {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return map[match] || match;
    });
}

async function initPanSection() {
    const panForm = document.getElementById('panForm');
    if (panForm) {
        panForm.addEventListener('submit', handlePanSubmit);
    }
    await loadPanDetails();
}

async function loadPanDetails() {
    setPanStatus('', 'info');
    const result = await PROFILE_API.getPanCard();
    if (result.success && result.data) {
        panDetails = result.data;
        panExists = true;
        populatePanForm(result.data);
        updatePanStatus(result.data.verification_status, result.data);
    } else {
        panDetails = null;
        panExists = false;
        clearPanForm();
        setPanStatus(result.message || 'You have not uploaded your PAN card yet.', 'info');
    }
}

function setPanStatus(message, type = 'info') {
    const statusEl = document.getElementById('panStatus');
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `pan-status ${type}`;
}

function updatePanStatus(status, data = {}) {
    const statusEl = document.getElementById('panStatus');
    if (!statusEl || !status) return;
    if (status === 'verified') {
        statusEl.textContent = `Verified on ${formatDate(data.verified_at)}`;
        statusEl.className = 'pan-status success';
    } else if (status === 'rejected') {
        statusEl.textContent = `Rejected: ${data.rejection_reason || 'Please resubmit.'}`;
        statusEl.className = 'pan-status error';
    } else if (status === 'pending') {
        statusEl.textContent = 'Verification is pending';
        statusEl.className = 'pan-status info';
    } else {
        statusEl.textContent = '';
        statusEl.className = 'pan-status';
    }
}

function populatePanForm(data) {
    const panNumberInput = document.getElementById('panNumberInput');
    const panNameInput = document.getElementById('panNameInput');
    const declaration = document.getElementById('panDeclaration');
    if (panNumberInput) panNumberInput.value = data?.pan_number || '';
    if (panNameInput) panNameInput.value = data?.full_name || '';
    if (declaration) declaration.checked = !!data?.declaration_accepted;
}

function clearPanForm() {
    const panNumberInput = document.getElementById('panNumberInput');
    const panFileInput = document.getElementById('panFileInput');
    const declaration = document.getElementById('panDeclaration');
    if (panNumberInput) panNumberInput.value = '';
    if (panFileInput) panFileInput.value = '';
    if (declaration) declaration.checked = false;
}

async function handlePanSubmit(event) {
    event.preventDefault();
    if (panSubmitting) return;
    const panNumberInput = document.getElementById('panNumberInput');
    const panNameInput = document.getElementById('panNameInput');
    const panFileInput = document.getElementById('panFileInput');
    const declaration = document.getElementById('panDeclaration');
    const submitBtn = document.getElementById('panSubmitBtn');
    if (!panNumberInput || !panNameInput || !panFileInput || !declaration) return;
    const panVal = (panNumberInput.value || '').trim().toUpperCase();
    if (!PAN_REGEX.test(panVal)) {
        setPanStatus('Invalid PAN format. Example: ABCDE1234F', 'error');
        return;
    }
    const fullName = (panNameInput.value || '').trim();
    if (!fullName) {
        setPanStatus('Full name is required', 'error');
        return;
    }
    if (!declaration.checked) {
        setPanStatus('Please accept the declaration', 'error');
        return;
    }
    const file = panFileInput.files[0];
    if (!file && !panExists) {
        setPanStatus('PAN image is required', 'error');
        return;
    }
    if (file) {
        if (!['image/jpeg', 'image/jpg'].includes(file.type)) {
            setPanStatus('Only JPEG files are allowed', 'error');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setPanStatus('File size must be under 2MB', 'error');
            return;
        }
    }

    const formData = new FormData();
    formData.append('pan_number', panVal);
    formData.append('full_name', fullName);
    formData.append('declaration_accepted', 'true');
    if (file) {
        formData.append('pan_image', file);
    }

    panSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = panExists ? 'Updating…' : 'Uploading…';

    const result = await PROFILE_API.savePanCard(formData, panExists);

    panSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Upload';

    if (result.success && result.data) {
        panExists = true;
        panDetails = result.data;
        populatePanForm(result.data);
        updatePanStatus(result.data.verification_status, result.data);
        setPanStatus(result.message || 'PAN submitted successfully', 'success');
    } else if (!result.unauthorized) {
        setPanStatus(result.message || 'Failed to submit PAN', 'error');
    }
}

// Reviews Section
let userReviews = [];
let reviewsPage = 1;
let reviewsPerPage = 20;
let reviewsHasMore = true;

async function initReviewsSection() {
    await loadUserReviews();
}

async function loadUserReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) {
        // /* console.error */('Reviews container not found');
        return;
    }
    
    container.innerHTML = '<div class="reviews-loading">Loading your reviews...</div>';
    
    // /* console.log */('Loading user reviews, page:', reviewsPage);
    
    const result = await PROFILE_API.getUserReviews(reviewsPage, reviewsPerPage);
    
    // /* console.log */('User reviews API result:', {
        success: result.success,
        message: result.message,
        reviewsCount: result.data?.reviews?.length || result.data?.total_reviews || 0,
        data: result.data
    });
    
    if (result.success && result.data) {
        const reviews = result.data.reviews || result.data || [];
        const pagination = result.data.pagination || {};
        
        // /* console.log */('Loaded reviews:', reviews.length, 'Total:', result.data.total_reviews || reviews.length);
        
        if (reviewsPage === 1) {
            userReviews = reviews;
        } else {
            userReviews = [...userReviews, ...reviews];
        }
        
        reviewsHasMore = pagination.has_more || pagination.next_page || false;
        
        renderReviews();
    } else {
        // /* console.error */('Failed to load reviews:', result);
        if (result.unauthorized) {
            container.innerHTML = '<div class="reviews-empty">Please login to view your reviews.</div>';
        } else {
            container.innerHTML = `<div class="reviews-empty">${result.message || 'Failed to load reviews'}</div>`;
        }
    }
}

function renderReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;
    
    if (!userReviews || userReviews.length === 0) {
        container.innerHTML = `
            <div class="reviews-empty">
                <i class="fas fa-star"></i>
                <h3>No Reviews Yet</h3>
                <p>You haven't submitted any reviews yet. Start reviewing products you've purchased!</p>
                <a href="/" class="btn-primary">Browse Products</a>
            </div>
        `;
        return;
    }
    
    let html = '<div class="reviews-list">';
    
    userReviews.forEach(review => {
        html += createReviewCard(review);
    });
    
    html += '</div>';
    
    if (reviewsHasMore) {
        html += `
            <div class="reviews-load-more-container">
                <button class="btn-secondary" id="loadMoreReviewsBtn">Load More Reviews</button>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Add load more button event listener
    const loadMoreBtn = document.getElementById('loadMoreReviewsBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', async () => {
            reviewsPage++;
            loadMoreBtn.disabled = true;
            loadMoreBtn.textContent = 'Loading...';
            await loadUserReviews();
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = 'Load More Reviews';
        });
    }
}

function createReviewCard(review) {
    const rating = parseFloat(review.rating) || 0;
    const ratingStars = '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '☆' : '');
    const reviewDate = formatReviewDate(review.created_at || review.date);
    const productName = review.product?.name || review.product_name || 'Product';
    const productSlug = review.product?.slug || review.product_slug || '#';
    // Try multiple image sources
    const productImage = review.product?.image_url || 
                        review.product?.image || 
                        review.product_image || 
                        (review.product?.gallery_images && Array.isArray(review.product.gallery_images) && review.product.gallery_images.length > 0 ? review.product.gallery_images[0] : null) ||
                        '/images/placeholder-product.png';
    const reviewText = review.review_text || review.body || review.comment || '';
    const customerName = review.customer_name || review.user?.name || 'Anonymous';
    const photos = review.photos || [];
    
    let categoryRatingsHtml = '';
    if (review.category_ratings && Array.isArray(review.category_ratings) && review.category_ratings.length > 0) {
        categoryRatingsHtml = '<div class="review-category-ratings">';
        review.category_ratings.forEach(catRating => {
            categoryRatingsHtml += `
                <div class="review-category-rating-item">
                    <span class="category-name">${escapeHtml(catRating.name || '')}</span>
                    <span class="category-rating">${catRating.rating}★</span>
                </div>
            `;
        });
        categoryRatingsHtml += '</div>';
    }
    
    let photosHtml = '';
    if (photos.length > 0) {
        photosHtml = '<div class="review-photos">';
        photos.slice(0, 5).forEach(photoUrl => {
            photosHtml += `
                <div class="review-photo-item">
                    <img src="${escapeHtml(photoUrl)}" alt="Review photo" onerror="this.parentElement.style.display='none'">
                </div>
            `;
        });
        photosHtml += '</div>';
    }
    
    return `
        <div class="review-card">
            <div class="review-product-info">
                <a href="/product.html?slug=${escapeHtml(productSlug)}" class="review-product-link">
                    <img src="${escapeHtml(productImage)}" alt="${escapeHtml(productName)}" class="review-product-image" onerror="this.src='/images/placeholder-product.png'">
                    <div class="review-product-details">
                        <h4 class="review-product-name">${escapeHtml(productName)}</h4>
                        <span class="review-product-link-text">View Product</span>
                    </div>
                </a>
            </div>
            <div class="review-content">
                <div class="review-header">
                    <div class="review-rating">
                        <span class="review-rating-stars">${ratingStars}</span>
                        <span class="review-rating-value">${rating.toFixed(1)}</span>
                    </div>
                    ${categoryRatingsHtml}
                    <div class="review-date">${reviewDate}</div>
                </div>
                ${reviewText ? `<div class="review-text">${escapeHtml(reviewText).replace(/\n/g, '<br>')}</div>` : ''}
                ${photosHtml}
                <div class="review-footer">
                    <span class="review-author">${escapeHtml(customerName)}</span>
                    ${review.certified_buyer ? '<span class="review-badge">✓ Certified Buyer</span>' : ''}
                </div>
            </div>
        </div>
    `;
}

function formatReviewDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffDays === 0) {
        return 'Just now';
    } else if (diffDays === 1) {
        return '1 day ago';
    } else if (diffDays < 30) {
        return `${diffDays} days ago`;
    } else if (diffMonths === 1) {
        return '1 month ago';
    } else if (diffMonths < 12) {
        return `${diffMonths} months ago`;
    } else if (diffYears === 1) {
        return '1 year ago';
    } else {
        return `${diffYears} years ago`;
    }
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
