// Flipkart Footer Loader & Resource Manager
// Ensures consistent footer across all pages by loading necessary CSS and JS

(function injectFooterResources() {
    const isHomepage = window.location.pathname === '/' || window.location.pathname === '/index.html';

    // 1. Inject CSS Dependencies
    const cssResources = [
        '/css/mobitez-footer.css?v=' + Date.now(), // Global footer styles with cache busting
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
    if (document.querySelector('.mobitez-footer')) return;

    // Defines the precise HTML structure matching the image
    const footerHtml = `
    <footer class="mobitez-footer">
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
                        <p>hi@mobitez.com</p>
                    </div>
                    
                    <div class="social-links">
                        <div class="footer-col-header">Social:</div>
                        <a href="https://www.facebook.com/mobitez.in" target="_blank" rel="noopener noreferrer"><i class="fab fa-facebook-f"></i></a>
                        <a href="/coming-soon.html"><i class="fab fa-twitter"></i></a>
                        <a href="https://www.youtube.com/@MobiTez" target="_blank" rel="noopener noreferrer"><i class="fab fa-youtube"></i></a>
                    </div>
                </div>

                <!-- Column 6: Registered Office -->
                <div class="footer-links-column footer-address-column">
                    <div class="footer-col-header">Registered Office Address:</div>
                    <div class="address-content">
                        <p>Mobitez Private Limited 
                        Bamangachi Chowmatha, Barasat, Barasat, West Bengal 743294
                        
                        Telephone: +91 9748006859</p>
                    </div>
                </div>
            </div>

            <!-- Bottom Section -->
            <div class="footer-bottom">
                <div class="footer-bottom-links">
                    <a href="https://seller.mobitez.com" class="bottom-link">
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
    <a href="https://wa.me/919748006859?text=Hi%2C%20I%20have%20a%20query%20regarding%20Mobitez" class="mobitez-whatsapp-float" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
        <i class="fab fa-whatsapp"></i>
        <span class="whatsapp-float-tooltip">Chat with us</span>
    </a>
    `;

    // Insert into body
    document.body.insertAdjacentHTML('beforeend', footerHtml);

    // CRITICAL: Inject Mobile Hide Style Universal Fix & WhatsApp Floating Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .mobitez-whatsapp-float {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background-color: #25d366;
            color: #ffffff !important;
            width: 58px;
            height: 58px;
            border-radius: 50px;
            text-align: center;
            font-size: 32px;
            box-shadow: 2px 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none !important;
            transition: all 0.3s ease;
            animation: mobitez-whatsapp-pulse 2s infinite;
        }
        .mobitez-whatsapp-float:hover {
            background-color: #128c7e;
            transform: scale(1.1);
            color: #ffffff !important;
        }
        .whatsapp-float-tooltip {
            visibility: hidden;
            width: 90px;
            background-color: #222;
            color: #fff;
            text-align: center;
            border-radius: 6px;
            padding: 5px 8px;
            position: absolute;
            z-index: 1;
            right: 68px;
            font-size: 12px;
            font-family: sans-serif;
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
            white-space: nowrap;
        }
        .mobitez-whatsapp-float:hover .whatsapp-float-tooltip {
            visibility: visible;
            opacity: 1;
        }
        @keyframes mobitez-whatsapp-pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7);
            }
            70% {
                box-shadow: 0 0 0 14px rgba(37, 211, 102, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(37, 211, 102, 0);
            }
        }
        @media (max-width: 768px) {
            .mobitez-footer {
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
            .mobitez-whatsapp-float {
                bottom: 75px; /* Above mobile bottom nav */
                right: 18px;
                width: 48px;
                height: 48px;
                font-size: 26px;
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
