// Profile Page JavaScript

let profileData = null;
let isEditingPersonalInfo = false;
let isEditingEmail = false;
let isEditingPhone = false;

const urlParams = new URLSearchParams(window.location.search);
const allowedSections = new Set(['landing', 'personal', 'addresses', 'pan', 'upi', 'reviews', 'giftcards', 'cards', 'coupons', 'notifications', 'emi']);
let activeSection = urlParams.get('section') || (window.innerWidth < 768 ? 'landing' : 'personal');

if (!allowedSections.has(activeSection)) {
    console.warn(`Profile Page - Section '${activeSection}' not allowed. Defaulting to 'personal'. Allowed:`, [...allowedSections]);
    activeSection = 'personal';
} else {
    // Active Section log removed
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

    // Setup header UI updates
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
    } else if (activeSection === 'emi') {
        await initEmiSection();
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
            console.error('Failed to load profile data from API and localStorage');
            // Don't call showError here as it wipes the entire content area, 
            // breaking static sections like "Gift Cards"
            showNotification('Failed to load profile data. Some features may be limited.', 'error');
        }
    }

    // Final call to ensure the correct section is visible after potential data loading side effects
    applyActiveSection();
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

    // Update mobile landing page name display
    const mobileProfilePhone = document.getElementById('mobileProfilePhone');
    if (mobileProfilePhone) {
        const nameToUse = user.name || user.phone || 'Customer';
        mobileProfilePhone.innerHTML = `Hi 👋 ${nameToUse}`;
    }

    // Hide/Show email action banner based on user.email
    const profileActionBanner = document.querySelector('.profile-action-banner');
    if (profileActionBanner) {
        if (user.email && user.email.trim() !== '') {
            profileActionBanner.style.setProperty('display', 'none', 'important');
        } else {
            profileActionBanner.style.setProperty('display', 'flex', 'important');
        }
    }

    // Check account deletion status
    checkDeletionRequestStatus(data);
}

function checkDeletionRequestStatus(data) {
    const user = data.user || data;
    const deletionRequest = data.deletion_request || user.deletion_request;
    const isPending = (deletionRequest && deletionRequest.status === 'pending') || 
                      data.deletion_pending === true || 
                      user.deletion_pending === true ||
                      data.has_pending_deletion === true ||
                      user.has_pending_deletion === true ||
                      (data.deletion_status && data.deletion_status === 'pending') ||
                      (user.deletion_status && user.deletion_status === 'pending');
                      
    if (isPending) {
        showDeletionPendingUI();
    } else {
        const banner = document.getElementById('deletionPendingBanner');
        if (banner) {
            banner.style.display = 'none';
        }
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');
        if (deleteAccountBtn) {
            deleteAccountBtn.style.display = 'inline-block';
        }
        const deactivateAccountBtn = document.getElementById('deactivateAccountBtn');
        if (deactivateAccountBtn) {
            deactivateAccountBtn.disabled = false;
            deactivateAccountBtn.style.opacity = '1';
            deactivateAccountBtn.style.cursor = 'pointer';
        }
    }
}

function showDeletionPendingUI() {
    const banner = document.getElementById('deletionPendingBanner');
    if (banner) {
        banner.style.display = 'flex';
    }
    
    // Hide Delete Account button
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.style.display = 'none';
    }

    // Disable Deactivate Account button as well
    const deactivateAccountBtn = document.getElementById('deactivateAccountBtn');
    if (deactivateAccountBtn) {
        deactivateAccountBtn.disabled = true;
        deactivateAccountBtn.style.opacity = '0.5';
        deactivateAccountBtn.style.cursor = 'not-allowed';
    }
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

    // Delete account - Open Custom Modal
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const deleteAccountModal = document.getElementById('deleteAccountModal');
    if (deleteAccountBtn && deleteAccountModal) {
        deleteAccountBtn.addEventListener('click', () => {
            // Reset textarea and counter
            const reasonTextarea = document.getElementById('deleteAccountReason');
            const counter = document.getElementById('deleteReasonCounter');
            if (reasonTextarea) reasonTextarea.value = '';
            if (counter) counter.textContent = '0 / 1000';
            
            // Open modal
            deleteAccountModal.classList.add('open');
        });
    }

    // Close Delete Account Modal
    const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
    const cancelDeleteModalBtn = document.getElementById('cancelDeleteModalBtn');
    if (closeDeleteModalBtn && deleteAccountModal) {
        closeDeleteModalBtn.addEventListener('click', () => {
            deleteAccountModal.classList.remove('open');
        });
    }
    if (cancelDeleteModalBtn && deleteAccountModal) {
        cancelDeleteModalBtn.addEventListener('click', () => {
            deleteAccountModal.classList.remove('open');
        });
    }
    if (deleteAccountModal) {
        deleteAccountModal.addEventListener('click', (e) => {
            if (e.target === deleteAccountModal) {
                deleteAccountModal.classList.remove('open');
            }
        });
    }

    // Character counter for textarea
    const deleteAccountReason = document.getElementById('deleteAccountReason');
    const deleteReasonCounter = document.getElementById('deleteReasonCounter');
    if (deleteAccountReason && deleteReasonCounter) {
        deleteAccountReason.addEventListener('input', () => {
            const length = deleteAccountReason.value.length;
            deleteReasonCounter.textContent = `${length} / 1000`;
        });
    }

    // Confirm Delete Account Request
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn && deleteAccountModal) {
        confirmDeleteBtn.addEventListener('click', async () => {
            const reason = deleteAccountReason ? deleteAccountReason.value.trim() : '';
            
            // Show loading state
            const btnText = confirmDeleteBtn.querySelector('.btn-text');
            const btnSpinner = confirmDeleteBtn.querySelector('.btn-spinner');
            
            if (btnText) btnText.style.display = 'none';
            if (btnSpinner) btnSpinner.style.display = 'inline-block';
            confirmDeleteBtn.disabled = true;
            if (cancelDeleteModalBtn) cancelDeleteModalBtn.disabled = true;
            if (closeDeleteModalBtn) closeDeleteModalBtn.disabled = true;

            try {
                const result = await PROFILE_API.submitDeletionRequest(reason);
                
                if (result.success || result.status === 201) {
                    showNotification(result.message || 'Your account deletion request has been submitted successfully.');
                    deleteAccountModal.classList.remove('open');
                    showDeletionPendingUI();
                } else if (result.status === 422) {
                    showNotification(result.message || 'A deletion request is already pending.', 'error');
                    deleteAccountModal.classList.remove('open');
                    showDeletionPendingUI();
                } else if (result.status === 401 || result.unauthorized) {
                    showNotification('Session expired. Please log in again.', 'error');
                    deleteAccountModal.classList.remove('open');
                    if (typeof logout === 'function') {
                        logout();
                    }
                } else {
                    showNotification(result.message || 'Something went wrong. Please try again.', 'error');
                }
            } catch (err) {
                console.error(err);
                showNotification('Connection error. Please try again.', 'error');
            } finally {
                // Restore state
                if (btnText) btnText.style.display = 'inline-block';
                if (btnSpinner) btnSpinner.style.display = 'none';
                confirmDeleteBtn.disabled = false;
                if (cancelDeleteModalBtn) cancelDeleteModalBtn.disabled = false;
                if (closeDeleteModalBtn) closeDeleteModalBtn.disabled = false;
            }
        });
    }

    // Mobile Terms & Policies Dropdown Toggle
    const termsPoliciesTrigger = document.getElementById('termsPoliciesTrigger');
    const termsPoliciesContent = document.getElementById('termsPoliciesContent');
    if (termsPoliciesTrigger && termsPoliciesContent) {
        termsPoliciesTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            termsPoliciesTrigger.classList.toggle('active');
            termsPoliciesContent.classList.toggle('open');
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
    const personalInfoSection = document.getElementById('personalInfoSection');
    if (personalInfoSection) {
        personalInfoSection.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-circle" style="font-size: 32px; color: #f44336; margin-bottom: 16px;"></i>
                <h2 style="font-size: 18px; margin-bottom: 16px;">${message}</h2>
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
    const mainContent = document.querySelector('main.main-content');
    if (mainContent) {
        // Remove any previous section classes to avoid accumulation
        const sectionClasses = Array.from(mainContent.classList).filter(cls => cls.startsWith('section-'));
        sectionClasses.forEach(cls => mainContent.classList.remove(cls));
        // Add current section class
        mainContent.classList.add(`section-${activeSection}`);
    }

    const sections = document.querySelectorAll('[data-profile-section]');
    sections.forEach(section => {
        if (section.dataset.profileSection === activeSection) {
            section.style.display = section.id === 'mobileLandingSection' ? 'flex' : 'block';
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
    //     success: result.success,
    //     message: result.message,
    //     reviewsCount: result.data?.reviews?.length || result.data?.total_reviews || 0,
    //     data: result.data
    // });

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

// setupLoginDropdown removed as it is now handled centrally in header-common.js


// ==========================================================================
// EMI APPLICATIONS DASHBOARD
// ==========================================================================

let emiApplicationsList = [];

async function initEmiSection() {
    await loadEmiApplications();
}

async function loadEmiApplications() {
    const container = document.getElementById('emiContainer');
    if (!container) return;

    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #878787;"><i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 12px;"></i><p>Loading your EMI applications...</p></div>';

    try {
        if (typeof PROFILE_API === 'undefined' || typeof PROFILE_API.getEmiRequests !== 'function') {
            throw new Error('EMI API not loaded');
        }

        const result = await PROFILE_API.getEmiRequests(1, 50);
        if (result.success && Array.isArray(result.data)) {
            emiApplicationsList = result.data;
            renderEmiApplications();
        } else {
            container.innerHTML = `<div style="text-align: center; padding: 40px; color: #f44336;"><i class="fas fa-exclamation-circle" style="font-size: 32px; margin-bottom: 12px;"></i><p>${result.message || 'Failed to load EMI applications'}</p></div>`;
        }
    } catch (error) {
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: #f44336;"><i class="fas fa-exclamation-circle" style="font-size: 32px; margin-bottom: 12px;"></i><p>${error.message || 'Failed to load EMI applications'}</p></div>`;
    }
}

function renderEmiApplications() {
    const container = document.getElementById('emiContainer');
    if (!container) return;

    if (emiApplicationsList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: #fff; border-radius: 2px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, .1);">
                <i class="fas fa-file-invoice-dollar" style="font-size: 48px; color: #878787; margin-bottom: 20px;"></i>
                <h3 style="font-size: 20px; margin-bottom: 10px; color: #212121;">No EMI Applications Found</h3>
                <p style="color: #666; font-size: 14px; margin-bottom: 20px;">You have not applied for EMI on any products yet.</p>
                <a href="/" class="btn-primary" style="display: inline-block; text-decoration: none; padding: 10px 24px; border-radius: 2px;">Shop Now</a>
            </div>
        `;
        return;
    }

    const listHtml = emiApplicationsList.map(app => {
        const product = app.product || {};
        const status = (app.status || 'pending').toLowerCase();
        let statusClass = 'emi-status-pending';
        let statusLabel = 'Pending';
        
        if (status === 'processing') {
            statusClass = 'emi-status-processing';
            statusLabel = 'Under Verification';
        } else if (status === 'approved') {
            statusClass = 'emi-status-approved';
            statusLabel = 'Approved';
        } else if (status === 'rejected') {
            statusClass = 'emi-status-rejected';
            statusLabel = 'Rejected';
        } else if (status === 'cancelled') {
            statusClass = 'emi-status-cancelled';
            statusLabel = 'Cancelled';
        } else if (status === 'forwarded') {
            statusClass = 'emi-status-processing';
            statusLabel = 'Forwarded';
        }

        const canCancel = status === 'pending' || status === 'processing';
        const cancelBtnHtml = canCancel 
            ? `<button class="btn-emi-cancel" data-id="${app.id}">Cancel Request</button>`
            : '';

        const financialsHtml = status === 'approved' && app.tenure && app.emi_amount
            ? `
                <div class="emi-detail-financials" style="margin-top: 15px; padding: 12px; background: #eef7ee; border: 1px solid #c2e2c2; border-radius: 4px;">
                    <p style="margin: 0; font-weight: 500; color: #2e7d32; font-size: 14px;">
                        Approved Plan: ${app.tenure} Months EMI @ ₹${app.emi_amount}/month
                    </p>
                </div>
            `
            : '';

        const notesHtml = app.status_notes
            ? `
                <div class="emi-detail-notes" style="margin-top: 15px; padding: 12px; background: #fdf6f6; border: 1px solid #f9e2e2; border-radius: 4px;">
                    <p style="margin: 0; font-size: 13px; color: #c62828;">
                        <strong>Notes:</strong> ${escapeHtml(app.status_notes)}
                    </p>
                </div>
            `
            : '';

        return `
            <div class="emi-card" data-app-id="${app.id}" style="background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 16px; transition: box-shadow 0.2s; font-family: 'Roboto', sans-serif;">
                <div class="emi-card-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 15px;">
                    <div>
                        <span style="font-size: 12px; color: #878787; font-weight: 500;">Application ID: #${app.id}</span>
                        <h4 style="margin: 4px 0 0 0; font-size: 16px; color: #212121; font-weight: 500;">Applied on: ${formatDate(app.created_at)}</h4>
                    </div>
                    <span class="emi-status-badge ${statusClass}" style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; text-transform: uppercase;">
                        ${statusLabel}
                    </span>
                </div>
                
                <div class="emi-card-product" style="display: flex; align-items: center; gap: 15px; padding: 15px 0; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0;">
                    <img src="${product.image_url || '/images/placeholder.jpg'}" alt="Product Image" style="width: 50px; height: 50px; object-fit: contain; background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; padding: 2px;">
                    <div>
                        <h5 style="margin: 0; font-size: 14px; color: #212121; font-weight: 500;">${product.name || 'Product'}</h5>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #212121;">Price: <strong>₹${product.price ? parseFloat(product.price).toFixed(2) : '0.00'}</strong></p>
                        <p style="margin: 2px 0 0 0; font-size: 13px; color: #878787;">Downpayment: <strong>₹${app.downpayment}</strong></p>
                    </div>
                </div>

                <div class="emi-card-expandable" style="margin-top: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="toggleEmiDetails(this)">
                        <span style="font-size: 13px; color: #2874f0; font-weight: 500;"><i class="fas fa-info-circle"></i> View Application Details</span>
                        <i class="fas fa-chevron-down toggle-chevron" style="font-size: 12px; color: #878787; transition: transform 0.2s;"></i>
                    </div>
                    
                    <div class="emi-details-drawer" style="display: none; padding-top: 15px; margin-top: 10px; border-top: 1px dashed #e0e0e0; font-size: 13px; color: #666; line-height: 1.5;">
                        <p style="margin: 3px 0;"><strong>Applicant Name:</strong> ${escapeHtml(app.customer_name)}</p>
                        <p style="margin: 3px 0;"><strong>Applicant Phone:</strong> +91 ${escapeHtml(app.customer_phone)}</p>
                        <p style="margin: 3px 0;"><strong>Shipping Address:</strong> ${escapeHtml(app.customer_address)} - ${escapeHtml(app.customer_pincode)}</p>
                        
                        ${financialsHtml}
                        ${notesHtml}
                        
                        <div style="margin-top: 15px; display: flex; justify-content: flex-end;">
                            ${cancelBtnHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (!document.getElementById('emi-status-badge-styles')) {
        const style = document.createElement('style');
        style.id = 'emi-status-badge-styles';
        style.textContent = `
            .emi-status-badge.emi-status-pending { background: #fff3e0; color: #ef6c00; }
            .emi-status-badge.emi-status-processing { background: #e3f2fd; color: #1565c0; }
            .emi-status-badge.emi-status-approved { background: #e8f5e9; color: #2e7d32; }
            .emi-status-badge.emi-status-rejected { background: #ffebee; color: #c62828; }
            .emi-status-badge.emi-status-cancelled { background: #f5f5f5; color: #757575; }
            
            .btn-emi-cancel {
                background: #ffffff;
                color: #c62828;
                border: 1px solid #c62828;
                padding: 6px 14px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.2s;
                font-family: 'Roboto', sans-serif;
            }
            .btn-emi-cancel:hover {
                background: #ffebee;
            }
            .btn-emi-cancel:disabled {
                border-color: #cccccc;
                color: #cccccc;
                cursor: not-allowed;
                background: #ffffff;
            }
        `;
        document.head.appendChild(style);
    }

    container.innerHTML = listHtml;

    container.querySelectorAll('.btn-emi-cancel').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            if (!id) return;
            
            if (!confirm('Are you sure you want to cancel this EMI Request?')) {
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Cancelling...';

            try {
                if (typeof PROFILE_API === 'undefined' || typeof PROFILE_API.cancelEmiRequest !== 'function') {
                    throw new Error('EMI API not loaded');
                }

                const result = await PROFILE_API.cancelEmiRequest(id);
                if (result.success) {
                    showNotification('EMI request cancelled successfully');
                    await loadEmiApplications();
                } else {
                    showNotification(result.message || 'Failed to cancel request', 'error');
                    btn.disabled = false;
                    btn.textContent = 'Cancel Request';
                }
            } catch (err) {
                showNotification(err.message || 'Failed to cancel request', 'error');
                btn.disabled = false;
                btn.textContent = 'Cancel Request';
            }
        });
    });
}

window.toggleEmiDetails = function(trigger) {
    const drawer = trigger.nextElementSibling;
    const chevron = trigger.querySelector('.toggle-chevron');
    
    if (drawer) {
        const isCollapsed = drawer.style.display === 'none';
        drawer.style.display = isCollapsed ? 'block' : 'none';
        
        if (chevron) {
            chevron.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }
};
