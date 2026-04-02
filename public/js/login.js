// Login Page JavaScript - OTP Based (Existing Users Only)

document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (isAuthenticated()) {
        window.location.href = '/';
        return;
    }

    // Elements
    const phoneFormSection = document.getElementById('phoneFormSection');
    const otpFormSection = document.getElementById('otpFormSection');
    const phoneForm = document.getElementById('phoneForm');
    const otpForm = document.getElementById('otpForm');
    const phoneInput = document.getElementById('phoneInput');
    const sendOTPBtn = document.getElementById('sendOTPBtn');
    const verifyOTPBtn = document.getElementById('verifyOTPBtn');
    const backBtn = document.getElementById('backBtn');
    const resendOTPBtn = document.getElementById('resendOTPBtn');
    const displayPhone = document.getElementById('displayPhone');
    const otpCountdown = document.getElementById('otpCountdown');
    const otpDigits = document.querySelectorAll('.otp-digit');

    let currentPhone = '';
    let otpTimer = null;
    let resendTimer = null;

    // Phone input - only allow digits
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
            clearError('phone');
        });
    }

    // Phone form submission - Send OTP
    if (phoneForm) {
        phoneForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const phone = phoneInput.value.trim();
            
            if (!isValidMobile(phone)) {
                showError('phone', 'Please enter a valid 10-digit mobile number');
                return;
            }
            
            sendOTPBtn.disabled = true;
            sendOTPBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            
            const result = await sendLoginOTP(phone);
            
            if (result.success) {
                currentPhone = phone;
                showOTPSection(phone, result.data?.otp);
                showNotification('OTP sent successfully!', 'success');
            } else {
                // Check if user is not registered
                if (result.isRegistered === false) {
                    showError('phone', 'Mobile number not registered. Please sign up first.');
                } else {
                    showError('phone', result.message);
                }
            }
            
            sendOTPBtn.disabled = false;
            sendOTPBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send OTP';
        });
    }

    // OTP digit inputs handling
    otpDigits.forEach((digit, index) => {
        digit.addEventListener('input', (e) => {
            const value = e.target.value.replace(/\D/g, '');
            e.target.value = value;
            
            if (value && index < 5) {
                otpDigits[index + 1].focus();
            }
            clearError('otp');
        });
        
        digit.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpDigits[index - 1].focus();
            }
        });
        
        digit.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
            for (let i = 0; i < 6 && i < pastedData.length; i++) {
                otpDigits[i].value = pastedData[i];
            }
            if (pastedData.length > 0) {
                otpDigits[Math.min(pastedData.length - 1, 5)].focus();
            }
        });
    });

    // Get OTP value from inputs
    function getOTPValue() {
        return Array.from(otpDigits).map(d => d.value).join('');
    }

    // Clear OTP inputs
    function clearOTPInputs() {
        otpDigits.forEach(d => d.value = '');
    }

    // OTP form submission - Verify OTP
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const otp = getOTPValue();
            
            if (!isValidOTP(otp)) {
                showError('otp', 'Please enter a valid 6-digit OTP');
                return;
            }
            
            verifyOTPBtn.disabled = true;
            verifyOTPBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
            
            const result = await verifyOTP(currentPhone, otp);
            
            if (result.success) {
                showNotification('Login successful!', 'success');
                clearInterval(otpTimer);
                clearInterval(resendTimer);
                
                setTimeout(() => {
                    const returnUrl = new URLSearchParams(window.location.search).get('return') || '/';
                    window.location.href = returnUrl;
                }, 1000);
            } else {
                showError('otp', result.message);
                verifyOTPBtn.disabled = false;
                verifyOTPBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verify & Login';
                
                if (result.message.includes('Invalid') || result.message.includes('expired')) {
                    clearOTPInputs();
                    otpDigits[0].focus();
                }
            }
        });
    }

    // Back button
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            otpFormSection.style.display = 'none';
            phoneFormSection.style.display = 'block';
            clearInterval(otpTimer);
            clearInterval(resendTimer);
            phoneInput.focus();
        });
    }

    // Resend OTP
    if (resendOTPBtn) {
        resendOTPBtn.addEventListener('click', async () => {
            if (resendOTPBtn.disabled) return;
            
            resendOTPBtn.disabled = true;
            resendOTPBtn.textContent = 'Sending...';
            
            const result = await resendOTP(currentPhone, 'login');
            
            if (result.success) {
                showNotification('OTP resent successfully!', 'success');
                startTimers();
                clearOTPInputs();
                otpDigits[0].focus();
                
                if (result.data?.otp) {
                    // /* console.log */('OTP for testing:', result.data.otp);
                }
            } else {
                showNotification(result.message || 'Failed to resend OTP', 'error');
                resendOTPBtn.disabled = false;
                resendOTPBtn.textContent = 'Resend OTP';
            }
        });
    }

    // Show OTP section
    function showOTPSection(phone, otp = null) {
        phoneFormSection.style.display = 'none';
        otpFormSection.style.display = 'block';
        displayPhone.textContent = '+91 ' + formatMobile(phone);
        clearOTPInputs();
        setTimeout(() => otpDigits[0].focus(), 100);
        startTimers();
        
        if (otp) {
            // /* console.log */('OTP for testing:', otp);
        }
    }

    // Start countdown timers
    function startTimers() {
        // OTP expiry timer (5 minutes)
        let timeLeft = 300;
        clearInterval(otpTimer);
        updateCountdown(timeLeft);
        
        otpTimer = setInterval(() => {
            timeLeft--;
            updateCountdown(timeLeft);
            if (timeLeft <= 0) {
                clearInterval(otpTimer);
                showError('otp', 'OTP expired. Please request a new OTP.');
            }
        }, 1000);

        // Resend cooldown (30 seconds)
        let resendTime = 30;
        clearInterval(resendTimer);
        resendOTPBtn.disabled = true;
        resendOTPBtn.textContent = `Resend in ${resendTime}s`;
        
        resendTimer = setInterval(() => {
            resendTime--;
            if (resendTime <= 0) {
                clearInterval(resendTimer);
                resendOTPBtn.disabled = false;
                resendOTPBtn.textContent = 'Resend OTP';
            } else {
                resendOTPBtn.textContent = `Resend in ${resendTime}s`;
            }
        }, 1000);
    }

    function updateCountdown(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        otpCountdown.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Error handling
    function showError(field, message) {
        const errorEl = document.getElementById(`${field}Error`);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    function clearError(field) {
        const errorEl = document.getElementById(`${field}Error`);
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
    }

    // Notifications
    function showNotification(message, type = 'success') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
});
