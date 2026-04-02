/**
 * FAQ Page – Dynamic Loader & Accordion (Flat, no categories)
 */

document.addEventListener('DOMContentLoaded', initFaq);

async function initFaq() {
    const container = document.getElementById('faq-container');
    if (!container) return;

    // Hide the category tabs since we don't want them
    const tabsEl = document.getElementById('faqTabs');
    if (tabsEl) tabsEl.style.display = 'none';

    try {
        const baseUrl = (typeof AUTH_CONFIG !== 'undefined' && AUTH_CONFIG.baseUrl)
            ? AUTH_CONFIG.baseUrl
            : '/api';
        const apiKey = (typeof AUTH_CONFIG !== 'undefined' && AUTH_CONFIG.headers?.['X-API-Key'])
            ? AUTH_CONFIG.headers['X-API-Key']
            : '';

        const res = await fetch(`${baseUrl}/faqs`, {
            headers: { 'Accept': 'application/json', 'X-API-Key': apiKey }
        });
        const json = await res.json();

        if (!res.ok || json.status !== 'success' || !Array.isArray(json.data)) {
            renderEmpty(container, 'Unable to load FAQs', 'Please try again later.');
            return;
        }

        const faqs = json.data.filter(f => f.is_active !== 0);

        if (faqs.length === 0) {
            renderEmpty(container, 'No FAQs Yet', 'Check back soon!');
            return;
        }

        renderFaqs(container, faqs);
        attachSearch();

    } catch (err) {
        console.error('FAQ load error:', err);
        renderEmpty(container, 'Connection Error', 'Please refresh the page.');
    }
}

/* ---- Render flat accordion ---- */
function renderFaqs(container, faqs) {
    const items = faqs.map(faq => `
    <div class="faq-item" id="faq-${faq.id}">
        <button class="faq-question-btn" aria-expanded="false">
            <h3>${escapeHtml(faq.question)}</h3>
            <div class="faq-icon-wrap">
                <i class="fas fa-chevron-down faq-icon"></i>
            </div>
        </button>
        <div class="faq-answer-wrapper">
            <div class="faq-answer">${faq.answer}</div>
        </div>
    </div>`).join('');

    container.innerHTML = `<div class="faq-accordion">${items}</div>`;
    attachAccordion();
}

/* ---- Accordion toggle ---- */
function attachAccordion() {
    document.querySelectorAll('.faq-question-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const isOpen = item.classList.contains('active');

            // Close all
            document.querySelectorAll('.faq-item.active').forEach(i => {
                i.classList.remove('active');
                i.querySelector('.faq-question-btn').setAttribute('aria-expanded', 'false');
            });

            if (!isOpen) {
                item.classList.add('active');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

/* ---- Search ---- */
function attachSearch() {
    const input = document.getElementById('faqSearchInput');
    if (!input) return;

    input.addEventListener('input', () => {
        const q = input.value.toLowerCase().trim();
        document.querySelectorAll('.faq-item').forEach(item => {
            item.style.display = (!q || item.textContent.toLowerCase().includes(q)) ? '' : 'none';
        });
    });
}

/* ---- Helpers ---- */
function renderEmpty(container, title, message) {
    container.innerHTML = `
    <div class="faq-empty">
        <i class="fas fa-question-circle"></i>
        <h2>${title}</h2>
        <p>${message}</p>
        <a href="/contact.html" class="back-btn">Contact Support</a>
    </div>`;
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}
