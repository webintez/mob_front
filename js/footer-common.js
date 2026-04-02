// Flipkart Footer Loader & Resource Manager
// Ensures consistent footer across all pages by loading necessary CSS and JS

(function injectFooterResources() {
    const isHomepage = window.location.pathname === '/' || window.location.pathname === '/index.html';

    // 1. Inject CSS Dependencies
    const cssResources = [
        '/css/flipkart-footer.css?v=' + Date.now(), // Global footer styles with cache busting
    ];

    // Only add SEO footer styles on homepage
    if (isHomepage) {
        cssResources.push('/css/seo-footer.css?v=' + Date.now());
    }

    cssResources.forEach(href => {
        // Simple check to avoid duplicates
        if (!document.querySelector(`link[href*="${href.split('/').pop()}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
        }
    });

    // 2. Inject SEO Footer Script (ONLY on Homepage)
    if (isHomepage) {
        const seoScriptSrc = '/js/seo-footer.js';
        const scripts = Array.from(document.getElementsByTagName('script'));
        const hasSeoScript = scripts.some(s => s.src && s.src.includes('seo-footer.js'));

        if (!hasSeoScript) {
            const script = document.createElement('script');
            script.src = seoScriptSrc;
            script.defer = true;
            document.head.appendChild(script);
        }
    }
})();

function loadFooter() {
    // Check if footer already exists
    if (document.querySelector('.flipkart-footer')) return;

    // Defines the precise HTML structure matching the image
    const footerHtml = `
    <footer class="flipkart-footer">
        <div class="footer-wrapper">
            <!-- Top Section: Links & Address -->
            <div class="footer-top">
                <!-- Column 1: ABOUT -->
                <div class="footer-links-column">
                    <div class="footer-col-header">ABOUT</div>
                    <a href="/contact.html" class="footer-link">Contact Us</a>
                    <a href="/page.html?slug=about-us" class="footer-link">About Us</a>
                    <a href="/page.html?slug=careers" class="footer-link">Careers</a>
                    <a href="/page.html?slug=corporate" class="footer-link">Corporate Information</a>
                    <a href="/blog.html" class="footer-link">Blogs</a>
                </div>


                <!-- Column 3: HELP -->
                <div class="footer-links-column">
                    <div class="footer-col-header">HELP</div>
                    <a href="/page.html?slug=payments" class="footer-link">Payments</a>
                    <a href="/page.html?slug=shipping" class="footer-link">Shipping</a>
                    <a href="/page.html?slug=cancellation-returns" class="footer-link">Cancellation & Returns</a>
                    <a href="/faq.html" class="footer-link">FAQ</a>
                </div>

                <!-- Column 4: CONSUMER POLICY -->
                <div class="footer-links-column">
                    <div class="footer-col-header">CONSUMER POLICY</div>
                    <a href="/page.html?slug=cancellation-returns" class="footer-link">Cancellation & Returns</a>
                    <a href="/page.html?slug=terms-of-use" class="footer-link">Terms Of Use</a>
                    <a href="/page.html?slug=security" class="footer-link">Security</a>
                    <a href="/page.html?slug=privacy" class="footer-link">Privacy</a>
                    <a href="/page.html?slug=sitemap" class="footer-link">Sitemap</a>
                </div>

                <!-- Vertical Divider -->
                <div class="footer-divider-vertical"></div>

                <!-- Column 5: Mail Us -->
                <div class="footer-links-column footer-address-column">
                    <div class="footer-col-header">Mail Us:</div>
                    <div class="address-content">
                        <p>hi@mobitez.webintez.com</p>
                    </div>
                    
                    <div class="social-links">
                        <div class="footer-col-header">Social:</div>
                        <a href="/coming-soon.html"><i class="fab fa-facebook-f"></i></a>
                        <a href="/coming-soon.html"><i class="fab fa-twitter"></i></a>
                        <a href="/coming-soon.html"><i class="fab fa-youtube"></i></a>
                    </div>
                </div>

                <!-- Column 6: Registered Office -->
                <div class="footer-links-column footer-address-column">
                    <div class="footer-col-header">Registered Office Address:</div>
                    <div class="address-content">
                        <p>Mobitez 
                        Bamangachi Chowmatha, Barasat, Barasat, West Bengal 743294
                        
                        Telephone: +91 9748006859</p>
                    </div>
                </div>
            </div>

            <!-- Bottom Section -->
            <div class="footer-bottom">
                <div class="footer-bottom-links">
                    <a href="https://seller.mobitez.webintez.com" class="bottom-link">
                        <i class="fas fa-store bottom-icon"></i>
                        Sell With Us
                    </a>
                    <!-- <a href="/coming-soon.html" class="bottom-link">
                        <i class="fas fa-gift bottom-icon"></i>
                        Gift Cards
                    </a> -->
                     <a href="https://wa.me/919748006859" class="bottom-link">
                        <i class="fas fa-question-circle bottom-icon"></i>
                        Help Center
                    </a>
                </div>

                <div class="copyright-text">
                    &copy; 2007-2026 Mobitez.com
                </div>

                <div class="payment-methods">
                     <!-- Using SVG placeholders or images -->
                     <img src="https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/payment-method-c454fb.svg" alt="Payment Methods" style="height: 18px;">
                </div>
            </div>
        </div>
    </footer>
    `;

    // Insert into body
    document.body.insertAdjacentHTML('beforeend', footerHtml);

    // CRITICAL: Inject Mobile Hide Style Universal Fix
    const style = document.createElement('style');
    style.innerHTML = `
        @media (max-width: 768px) {
            .flipkart-footer {
                display: none !important;
            }
            /* Also hide generic footer class if used */
            .footer {
                display: none !important;
            }
            /* Hide SEO footer if present */
            .seo-footer-section, .seo-footer-container {
                display: none !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFooter);
} else {
    loadFooter();
}
