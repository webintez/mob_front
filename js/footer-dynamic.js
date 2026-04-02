// Dynamically load footer links from Pages API
// This script updates footer links to match pages available in the API

async function loadFooterLinks() {
    try {
        const response = await fetch('/api/pages');
        if (!response.ok) {
            return; // Silently fail if API is not available
        }
        
        const data = await response.json();

        if (data.success && data.data && Array.isArray(data.data)) {
            updateFooterLinks(data.data);
        }
    } catch (error) {
        // Silently fail - footer will use default links
        // /* console.log */('Footer links: Using default links');
    }
}

function updateFooterLinks(pages) {
    // Create a map of page names to slugs (case-insensitive)
    const pageMap = {};
    pages.forEach(page => {
        if (page.name && page.slug) {
            // Map various name formats to slug
            const nameLower = page.name.toLowerCase().trim();
            pageMap[nameLower] = page.slug;
            
            // Also map common variations
            if (nameLower.includes('contact')) {
                pageMap['contact us'] = page.slug;
            }
            if (nameLower.includes('about')) {
                pageMap['about us'] = page.slug;
            }
            if (nameLower.includes('career')) {
                pageMap['careers'] = page.slug;
            }
            if (nameLower.includes('story')) {
                pageMap['mobitez stories'] = page.slug;
            }
            if (nameLower.includes('payment')) {
                pageMap['payments'] = page.slug;
            }
            if (nameLower.includes('shipping')) {
                pageMap['shipping'] = page.slug;
            }
            if (nameLower.includes('cancellation') || nameLower.includes('return')) {
                pageMap['cancellation & returns'] = page.slug;
            }
            if (nameLower.includes('faq') || nameLower.includes('frequently')) {
                pageMap['faq'] = page.slug;
            }
            if (nameLower.includes('infringement') || nameLower.includes('report')) {
                pageMap['report infringement'] = page.slug;
            }
            if (nameLower.includes('term')) {
                pageMap['terms of use'] = page.slug;
            }
            if (nameLower.includes('security')) {
                pageMap['security'] = page.slug;
            }
            if (nameLower.includes('privacy')) {
                pageMap['privacy'] = page.slug;
            }
            if (nameLower.includes('sitemap')) {
                pageMap['sitemap'] = page.slug;
            }
        }
    });

    // Update footer links
    const footerLinks = document.querySelectorAll('.footer a');
    footerLinks.forEach(link => {
        const linkText = link.textContent.trim().toLowerCase();
        const href = link.getAttribute('href');
        
        // Update links that point to /page/, /contact, or are placeholders
        if (href && (href.startsWith('/page/') || href.startsWith('/contact') || href === '#' || href === '')) {
            // Try to find matching page
            if (pageMap[linkText]) {
                link.href = `/page/${pageMap[linkText]}`;
            } else {
                // If link points to /contact, try to convert to /page/contact-us
                if (href.startsWith('/contact')) {
                    const contactPage = pages.find(p => p.slug === 'contact-us' || p.name.toLowerCase().includes('contact'));
                    if (contactPage) {
                        link.href = `/page/${contactPage.slug}`;
                    } else {
                        link.href = '/page/contact-us'; // Default fallback
                    }
                } else {
                    // Try to match by slug if link already has /page/slug format
                    const existingSlug = href.replace('/page/', '');
                    const pageExists = pages.some(p => p.slug === existingSlug);
                    if (!pageExists && href.startsWith('/page/')) {
                        // Page doesn't exist, keep link but it will show error
                        link.style.opacity = '0.7';
                    }
                }
            }
        }
    });
}

// Load footer links when footer is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Wait a bit for footer to be loaded
        setTimeout(loadFooterLinks, 500);
    });
} else {
    // Footer might already be loaded
    setTimeout(loadFooterLinks, 500);
}

// Also try loading after footer-common.js loads the footer
window.addEventListener('load', function() {
    setTimeout(loadFooterLinks, 1000);
});

