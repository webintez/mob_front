/**
 * Contact Form – API Submission Handler
 * Submits to /api/contact-messages with validation feedback
 */

document.addEventListener('DOMContentLoaded', () => {
    // Category tab toggle
    const tabCustomer = document.getElementById('tab-customer');
    const tabSeller = document.getElementById('tab-seller');
    const categoryInput = document.getElementById('category');

    if (tabCustomer && tabSeller) {
        [tabCustomer, tabSeller].forEach(tab => {
            tab.addEventListener('click', () => {
                tabCustomer.classList.remove('active');
                tabSeller.classList.remove('active');
                tab.classList.add('active');
                if (categoryInput) categoryInput.value = tab.dataset.value;
            });
        });
    }

    // Form submit
    const form = document.getElementById('contactForm');
    if (form) form.addEventListener('submit', handleSubmit);
});

async function handleSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const feedback = document.getElementById('form-feedback');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    // Reset state
    feedback.style.display = 'none';
    feedback.className = 'form-feedback';
    clearErrors();

    const data = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        subject: document.getElementById('subject').value.trim(),
        message: document.getElementById('message').value.trim(),
        category: document.getElementById('category').value || 'customer',
    };

    // Loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';

    try {
        const baseUrl = (typeof AUTH_CONFIG !== 'undefined' && AUTH_CONFIG.baseUrl)
            ? AUTH_CONFIG.baseUrl
            : '/api';
        const apiKey = (typeof AUTH_CONFIG !== 'undefined' && AUTH_CONFIG.headers?.['X-API-Key'])
            ? AUTH_CONFIG.headers['X-API-Key']
            : '';

        const res = await fetch(`${baseUrl}/contact-messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (res.ok && result.status === 'success') {
            e.target.reset();
            // Reset category tabs
            const tabCustomer = document.getElementById('tab-customer');
            const tabSeller = document.getElementById('tab-seller');
            if (tabCustomer && tabSeller) {
                tabSeller.classList.remove('active');
                tabCustomer.classList.add('active');
            }
            const cat = document.getElementById('category');
            if (cat) cat.value = 'customer';

            showFeedback('success', '<i class="fas fa-check-circle"></i> Your message has been sent! We\'ll get back to you within 24 hours.');
        } else if (res.status === 422 && result.errors) {
            showFieldErrors(result.errors);
            showFeedback('error', '<i class="fas fa-exclamation-circle"></i> Please fix the errors highlighted below.');
        } else {
            showFeedback('error', `<i class="fas fa-times-circle"></i> ${result.message || 'Something went wrong. Please try again.'}`);
        }

    } catch (err) {
        console.error('Contact submission error:', err);
        showFeedback('error', '<i class="fas fa-wifi"></i> Connection error. Please check your internet and try again.');
    } finally {
        submitBtn.disabled = false;
        btnText.style.display = 'inline-block';
        btnLoader.style.display = 'none';
    }
}

function showFieldErrors(errors) {
    for (const field in errors) {
        const errorEl = document.getElementById(`${field}-error`);
        const group = document.getElementById(`grp-${field}`);
        if (errorEl) errorEl.textContent = errors[field][0];
        if (group) group.classList.add('has-error');
    }
}

function clearErrors() {
    document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-group.has-error').forEach(el => el.classList.remove('has-error'));
}

function showFeedback(type, html) {
    const feedback = document.getElementById('form-feedback');
    feedback.innerHTML = html;
    feedback.className = `form-feedback ${type}`;
    feedback.style.display = 'flex';
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
