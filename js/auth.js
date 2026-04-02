// Authentication Module
// Handles OTP-based login, logout, and JWT token management

const AUTH_CONFIG = {
    baseUrl: '/api',
    tokenKey: 'mobitez_auth_token',
    userKey: 'mobitez_user',
    headers: {}
};

// ============================================
// Token & User Storage Functions
// ============================================

// Get stored token
function getAuthToken() {
    return localStorage.getItem(AUTH_CONFIG.tokenKey);
}

// Get stored user
function getAuthUser() {
    const userStr = localStorage.getItem(AUTH_CONFIG.userKey);
    return userStr ? JSON.parse(userStr) : null;
}

// Set auth token and user
function setAuth(token, user) {
    localStorage.setItem(AUTH_CONFIG.tokenKey, token);
    localStorage.setItem(AUTH_CONFIG.userKey, JSON.stringify(user));
}

// Clear auth
function clearAuth() {
    localStorage.removeItem(AUTH_CONFIG.tokenKey);
    localStorage.removeItem(AUTH_CONFIG.userKey);
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getAuthToken();
}

// Get auth headers
function getAuthHeaders() {
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

// ============================================
// OTP Authentication Functions
// ============================================

/**
 * Send OTP for Login (existing user only)
 * @param {string} mobile - 10-digit mobile number
 * @returns {Promise<Object>} - API response
 */
async function sendLoginOTP(mobile) {
    try {
        const response = await fetch(`${AUTH_CONFIG.baseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-API-Key': AUTH_CONFIG.headers['X-API-Key']
            },
            body: JSON.stringify({ mobile })
        });

        const data = await response.json();

        return {
            success: data.success,
            message: data.message,
            data: data.data || {},
            isRegistered: data.data?.is_registered
        };
    } catch (error) {
        // /* console.error */('Send Login OTP error:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

/**
 * Send OTP for Registration (new user)
 * @param {string} mobile - 10-digit mobile number
 * @param {string} name - Optional user name
 * @returns {Promise<Object>} - API response
 */
async function sendRegisterOTP(mobile, name = '') {
    try {
        const body = { mobile };
        if (name) {
            body.name = name;
        }

        const response = await fetch(`${AUTH_CONFIG.baseUrl}/auth/register`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-API-Key': AUTH_CONFIG.headers['X-API-Key']
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        return {
            success: data.success,
            message: data.message,
            data: data.data || {},
            isRegistered: data.data?.is_registered
        };
    } catch (error) {
        // /* console.error */('Send Register OTP error:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

/**
 * Verify OTP and complete authentication
 * @param {string} mobile - 10-digit mobile number
 * @param {string} otp - 6-digit OTP
 * @param {string} name - Optional name (for registration)
 * @returns {Promise<Object>} - API response with token
 */
async function verifyOTP(mobile, otp, name = '') {
    try {
        const body = { mobile, otp };
        if (name) {
            body.name = name;
        }

        const response = await fetch(`${AUTH_CONFIG.baseUrl}/auth/verify-otp`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-API-Key': AUTH_CONFIG.headers['X-API-Key']
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (data.success && data.data && data.data.token) {
            setAuth(data.data.token, data.data.user);
            return {
                success: true,
                message: data.message,
                data: data.data,
                isNewUser: data.data.is_new_user || false
            };
        } else {
            return {
                success: false,
                message: data.message || 'OTP verification failed',
                data: data.data || {}
            };
        }
    } catch (error) {
        // /* console.error */('Verify OTP error:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

/**
 * Resend OTP
 * @param {string} mobile - 10-digit mobile number
 * @param {string} action - 'login' or 'register'
 * @returns {Promise<Object>} - API response
 */
async function resendOTP(mobile, action) {
    try {
        const response = await fetch(`${AUTH_CONFIG.baseUrl}/auth/resend-otp`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-API-Key': AUTH_CONFIG.headers['X-API-Key']
            },
            body: JSON.stringify({ mobile, action })
        });

        const data = await response.json();

        return {
            success: data.success,
            message: data.message,
            data: data.data || {}
        };
    } catch (error) {
        // /* console.error */('Resend OTP error:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

/**
 * Check if mobile number is registered
 * @param {string} mobile - 10-digit mobile number
 * @returns {Promise<Object>} - API response with is_registered flag
 */
async function checkMobile(mobile) {
    try {
        const response = await fetch(`${AUTH_CONFIG.baseUrl}/auth/check-mobile`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-API-Key': AUTH_CONFIG.headers['X-API-Key']
            },
            body: JSON.stringify({ mobile })
        });

        const data = await response.json();

        return {
            success: data.success,
            message: data.message,
            isRegistered: data.data?.is_registered || false,
            suggestedAction: data.data?.suggested_action || 'register'
        };
    } catch (error) {
        // /* console.error */('Check mobile error:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

// ============================================
// Logout Function
// ============================================

/**
 * Logout - Invalidate token and clear local storage
 */
async function logout() {
    try {
        await fetch(`${AUTH_CONFIG.baseUrl}/auth/logout`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
    } catch (error) {
        // /* console.error */('Logout API error:', error);
    }

    clearAuth();
    window.location.href = '/';
}

// ============================================
// Helper Functions
// ============================================

/**
 * Validate mobile number format (Indian)
 * @param {string} mobile - Mobile number to validate
 * @returns {boolean} - Whether mobile is valid
 */
function isValidMobile(mobile) {
    const cleaned = mobile.replace(/\s/g, '');
    return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Validate OTP format
 * @param {string} otp - OTP to validate
 * @returns {boolean} - Whether OTP is valid
 */
function isValidOTP(otp) {
    return /^\d{6}$/.test(otp);
}

/**
 * Format mobile number for display
 * @param {string} mobile - Mobile number
 * @returns {string} - Formatted mobile number
 */
function formatMobile(mobile) {
    const cleaned = mobile.replace(/\s/g, '');
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return mobile;
}

/**
 * Update auth UI (show user name, logout option, etc.)
 */
function updateAuthUI() {
    const user = getAuthUser();
    const loginBtn = document.getElementById('loginBtn');
    const loginDropdown = document.getElementById('loginDropdown');

    if (user && loginBtn) {
        const displayName = user.name || user.phone || user.email;
        loginBtn.innerHTML = `
            ${displayName}
            <i class="fas fa-chevron-down"></i>
        `;

        if (loginDropdown) {
            const loginItem = loginDropdown.querySelector('.dropdown-item:first-child');
            if (loginItem) {
                loginItem.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
                loginItem.onclick = (e) => {
                    e.preventDefault();
                    logout();
                };
            }
        }
    }
}

// Initialize auth on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        updateAuthUI();
    });
}
