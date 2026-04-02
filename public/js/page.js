// Page Loader - Dynamically loads page content from API
let currentPageSlug = '';

// Initialize page on load
document.addEventListener('DOMContentLoaded', function() {
    loadPageContent();
});

// Get page slug from URL
function getPageSlugFromURL() {
    const path = window.location.pathname;
    // Handle /page/:slug format
    const match = path.match(/\/page\/([^\/]+)/);
    if (match) {
        return match[1];
    }
    // Handle direct slug (e.g., /about-us)
    const slugMatch = path.match(/\/([^\/]+)$/);
    if (slugMatch && slugMatch[1] !== '' && !slugMatch[1].includes('.')) {
        return slugMatch[1];
    }
    return null;
}

// Load page content from API
async function loadPageContent() {
    const slug = getPageSlugFromURL();
    
    if (!slug) {
        showError('Page not found', 'Invalid page URL');
        return;
    }

    currentPageSlug = slug;

    try {
        const response = await fetch(`/api/pages/${slug}`);
        const data = await response.json();

        if (response.ok && data.success && data.data) {
            displayPage(data.data);
        } else {
            showError('Page not found', data.message || 'The requested page could not be found.');
        }
    } catch (error) {
        // /* console.error */('Error loading page:', error);
        showError('Error loading page', 'Unable to load the page. Please try again later.');
    }
}

// Display page content
function displayPage(pageData) {
    // Update page title
    document.title = pageData.meta_title || `${pageData.name} - Mobitez`;

    // Update meta tags if available
    if (pageData.meta_description) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = pageData.meta_description;
    }

    if (pageData.meta_keywords) {
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
            metaKeywords = document.createElement('meta');
            metaKeywords.name = 'keywords';
            document.head.appendChild(metaKeywords);
        }
        metaKeywords.content = pageData.meta_keywords;
    }

    // Update page header
    const pageHeader = document.getElementById('page-header');
    if (pageHeader) {
        const pageName = pageData.name || 'Page';
        // Remove loading container if it exists
        const loadingContainer = pageHeader.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.remove();
        }
        // Clear any existing content
        pageHeader.innerHTML = '';
        // Create and append h1 element with explicit styling
        const h1 = document.createElement('h1');
        h1.textContent = pageName;
        h1.setAttribute('style', 'color: white !important; font-size: 42px !important; font-weight: 600 !important; margin: 0 !important; padding: 0 !important; display: block !important; visibility: visible !important; opacity: 1 !important;');
        pageHeader.appendChild(h1);
        // Force display
        pageHeader.style.display = 'flex';
        pageHeader.style.visibility = 'visible';
        pageHeader.style.opacity = '1';
        // /* console.log */('Page header updated with:', pageName);
        // /* console.log */('Page header innerHTML:', pageHeader.innerHTML);
        // /* console.log */('Page header children:', pageHeader.children.length);
    } else {
        // /* console.error */('Page header element not found!');
    }

    // Update page content
    const contentContainer = document.getElementById('page-content-container');
    if (contentContainer) {
        if (pageData.content) {
            // Parse and render HTML content
            parseAndDisplayHTML(contentContainer, pageData.content);
        } else {
            contentContainer.innerHTML = `
                <div class="page-content">
                    <p>No content available for this page.</p>
                </div>
            `;
        }
    }
}

// Show error message
function showError(title, message) {
    const pageHeader = document.getElementById('page-header');
    if (pageHeader) {
        pageHeader.innerHTML = `
            <h1>${escapeHtml(title)}</h1>
        `;
    }

    const contentContainer = document.getElementById('page-content-container');
    if (contentContainer) {
        contentContainer.innerHTML = `
            <div class="error-container">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>${escapeHtml(title)}</h2>
                <p>${escapeHtml(message)}</p>
                <a href="/" class="back-link">
                    <i class="fas fa-arrow-left"></i> Back to Home
                </a>
            </div>
        `;
    }
}

// Parse and display HTML content
function parseAndDisplayHTML(container, htmlContent) {
    if (!htmlContent) {
        container.innerHTML = '<div class="page-content"><p>No content available.</p></div>';
        return;
    }

    // Clean and prepare HTML content
    let cleanedContent = htmlContent.trim();
    
    // Check if content is wrapped in <p> tags with escaped HTML (common issue from API)
    // If content contains &lt;!DOCTYPE or &lt;html, it's escaped HTML
    if (cleanedContent.includes('&lt;!DOCTYPE') || cleanedContent.includes('&lt;html') || cleanedContent.includes('&lt;body')) {
        // Remove all wrapping <p> tags and their content, then extract the escaped HTML
        // The pattern is: <p>&lt;!DOCTYPE...&lt;/html&gt;</p> or multiple <p> tags
        let extractedHTML = '';
        
        // Match all <p> tags that contain escaped HTML
        const pTagMatches = cleanedContent.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
        if (pTagMatches) {
            pTagMatches.forEach(match => {
                // Extract content between <p> tags
                const contentMatch = match.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
                if (contentMatch) {
                    let pContent = contentMatch[1];
                    // Replace <br> with newlines
                    pContent = pContent.replace(/<br\s*\/?>/gi, '\n');
                    // Remove &nbsp; entities
                    pContent = pContent.replace(/&nbsp;/g, ' ');
                    extractedHTML += pContent;
                }
            });
        }
        
        if (extractedHTML) {
            cleanedContent = extractedHTML;
        }
        
        // Decode HTML entities (convert &lt; to <, &gt; to >, etc.)
        cleanedContent = decodeHTML(cleanedContent);
    } else {
        // Content is not escaped, just decode normally
        cleanedContent = decodeHTML(cleanedContent);
    }
    
    // Check if this is a full HTML document (has DOCTYPE, html, head, body tags)
    const isFullDocument = /<!DOCTYPE|<\s*html|<\s*head|<\s*body/i.test(cleanedContent);
    
    if (isFullDocument) {
        // Extract content from full HTML document
        cleanedContent = extractBodyContent(cleanedContent);
        
        // Extract and apply styles if present
        const styles = extractStyles(htmlContent);
        if (styles) {
            applyStyles(decodeHTML(styles));
        }
    }
    
    // Remove any script tags for security (content should already be sanitized by backend)
    cleanedContent = cleanedContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove header, navigation, and footer elements that are already in our template
    // Remove all header elements (case-insensitive, with any attributes)
    cleanedContent = cleanedContent.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
    cleanedContent = cleanedContent.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
    cleanedContent = cleanedContent.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
    
    // Remove any divs with header-related classes (header, page-header, header-container, etc.)
    // Match divs with class="header" or class containing "header" or "header-container"
    cleanedContent = cleanedContent.replace(/<div[^>]*class\s*=\s*["'][^"']*\bheader\b[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');
    cleanedContent = cleanedContent.replace(/<div[^>]*class\s*=\s*["'][^"']*\bheader-container\b[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');
    cleanedContent = cleanedContent.replace(/<div[^>]*class\s*=\s*["'][^"']*\bpage-header\b[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');
    
    // Also remove any elements with id="header" or similar
    cleanedContent = cleanedContent.replace(/<[^>]+\bid\s*=\s*["']header["'][^>]*>[\s\S]*?<\/[^>]+>/gi, '');
    cleanedContent = cleanedContent.replace(/<[^>]+\bid\s*=\s*["']page-header["'][^>]*>[\s\S]*?<\/[^>]+>/gi, '');
    
    // Create a temporary container to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanedContent;

    // Process the HTML content
    processHTMLContent(tempDiv);

    // Wrap in page-content div and insert
    const pageContentDiv = document.createElement('div');
    pageContentDiv.className = 'page-content';
    
    // Move all children from tempDiv to pageContentDiv
    while (tempDiv.firstChild) {
        pageContentDiv.appendChild(tempDiv.firstChild);
    }

    // Clear container and add processed content
    container.innerHTML = '';
    container.appendChild(pageContentDiv);
    
    // Remove any header elements that might have slipped through (post-insertion cleanup)
    const allHeaders = pageContentDiv.querySelectorAll('header, [class*="header"], [id*="header"], [class*="Header"], [id*="Header"]');
    allHeaders.forEach(header => {
        // Check if it's a header element or has header-related classes/ids
        const tagName = header.tagName.toLowerCase();
        const className = (header.className || '').toLowerCase();
        const id = (header.id || '').toLowerCase();
        
        if (tagName === 'header' || 
            className.includes('header') || 
            className.includes('page-header') ||
            id.includes('header') ||
            id.includes('page-header')) {
            // /* console.log */('Removing header element:', header);
            header.remove();
        }
    });
    
    // Process any dynamic content after insertion
    processDynamicContent(pageContentDiv);
    
    // Debug: Log if content was inserted
    // /* console.log */('Page content inserted, children count:', pageContentDiv.children.length);
}

// Extract body content from full HTML document
function extractBodyContent(fullHTML) {
    // Create a temporary document to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(fullHTML, 'text/html');
    
    // Get the body element
    const body = doc.body || doc.querySelector('body');
    
    if (body && body.children.length > 0) {
        // Get all children of body except header, nav, footer
        let content = '';
        Array.from(body.children).forEach(child => {
            const tagName = child.tagName.toLowerCase();
            const className = child.className || '';
            // Skip header, nav, footer, script, style tags, and page-header divs
            if (!['header', 'nav', 'footer', 'script', 'style'].includes(tagName) &&
                !className.includes('page-header')) {
                content += child.outerHTML;
            }
        });
        // If we got content, return it; otherwise return body innerHTML
        if (content.trim()) {
            return content;
        }
        // Fallback: return body innerHTML but remove header/nav/footer
        let bodyHTML = body.innerHTML;
        bodyHTML = bodyHTML.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
        bodyHTML = bodyHTML.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
        bodyHTML = bodyHTML.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
        bodyHTML = bodyHTML.replace(/<div[^>]*class="[^"]*page-header[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
        bodyHTML = bodyHTML.replace(/<div[^>]*class="[^"]*\b(header|header-container)\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
        bodyHTML = bodyHTML.replace(/<[^>]+\bid\s*=\s*["']header["'][^>]*>[\s\S]*?<\/[^>]+>/gi, '');
        bodyHTML = bodyHTML.replace(/<[^>]+\bid\s*=\s*["']page-header["'][^>]*>[\s\S]*?<\/[^>]+>/gi, '');
        return bodyHTML;
    } else if (body) {
        // Body exists but has no children, return innerHTML
        let bodyHTML = body.innerHTML;
        bodyHTML = bodyHTML.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
        bodyHTML = bodyHTML.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
        bodyHTML = bodyHTML.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
        bodyHTML = bodyHTML.replace(/<div[^>]*class="[^"]*page-header[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
        bodyHTML = bodyHTML.replace(/<div[^>]*class="[^"]*\b(header|header-container)\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
        bodyHTML = bodyHTML.replace(/<[^>]+\bid\s*=\s*["']header["'][^>]*>[\s\S]*?<\/[^>]+>/gi, '');
        bodyHTML = bodyHTML.replace(/<[^>]+\bid\s*=\s*["']page-header["'][^>]*>[\s\S]*?<\/[^>]+>/gi, '');
        return bodyHTML;
    }
    
    // Fallback: try to extract content between <body> tags using regex
    const bodyMatch = fullHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
        let bodyContent = bodyMatch[1];
        // Remove header, nav, footer, page-header, and any header-related elements
        bodyContent = bodyContent.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
        bodyContent = bodyContent.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
        bodyContent = bodyContent.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
        bodyContent = bodyContent.replace(/<div[^>]*class="[^"]*page-header[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
        bodyContent = bodyContent.replace(/<div[^>]*class="[^"]*\b(header|header-container)\b[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
        bodyContent = bodyContent.replace(/<[^>]+\bid\s*=\s*["']header["'][^>]*>[\s\S]*?<\/[^>]+>/gi, '');
        bodyContent = bodyContent.replace(/<[^>]+\bid\s*=\s*["']page-header["'][^>]*>[\s\S]*?<\/[^>]+>/gi, '');
        return bodyContent;
    }
    
    // If no body tag found, try to extract content after head or html tag
    const contentMatch = fullHTML.match(/<\/head>([\s\S]*?)(?:<\/html>|$)/i);
    if (contentMatch) {
        let content = contentMatch[1].replace(/<\/?html[^>]*>/gi, '').replace(/<\/?body[^>]*>/gi, '');
        // Remove header, nav, footer, page-header
        content = content.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
        content = content.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
        content = content.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
        content = content.replace(/<div[^>]*class="[^"]*page-header[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
        return content;
    }
    
    // Last resort: return the original content
    return fullHTML;
}

// Extract styles from HTML content
function extractStyles(htmlContent) {
    // Try to extract <style> tags
    const styleMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (styleMatch) {
        return styleMatch.map(style => {
            const contentMatch = style.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
            return contentMatch ? contentMatch[1] : '';
        }).join('\n');
    }
    return null;
}

// Apply extracted styles to the page
function applyStyles(cssContent) {
    if (!cssContent) return;
    
    // Check if we already have a style element for this
    let styleElement = document.getElementById('dynamic-page-styles');
    
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'dynamic-page-styles';
        document.head.appendChild(styleElement);
    }
    
    // Scope the styles to .page-content to avoid conflicts
    const scopedCSS = scopeStyles(cssContent);
    styleElement.textContent = scopedCSS;
}

// Scope CSS styles to .page-content container
function scopeStyles(css) {
    let scoped = css;
    
    // Remove body, html selectors and scope others
    scoped = scoped.replace(/\bbody\b/g, '.page-content');
    scoped = scoped.replace(/\bhtml\b/g, '.page-content');
    
    // Remove header, nav, footer specific styles (we have our own in the template)
    scoped = scoped.replace(/\.header[^,{]*\{[^}]*\}/g, '');
    scoped = scoped.replace(/\.header-container[^,{]*\{[^}]*\}/g, '');
    scoped = scoped.replace(/\.logo[^,{]*\{[^}]*\}/g, '');
    
    // Scope container styles
    scoped = scoped.replace(/\.container\b/g, '.page-content .container');
    
    // Keep page-header styles but scope them (though we remove the element, keep styles for content sections)
    // Actually, remove page-header styles since we have our own
    scoped = scoped.replace(/\.page-header[^,{]*\{[^}]*\}/g, '');
    
    // Scope content-section
    scoped = scoped.replace(/\.content-section\b/g, '.page-content .content-section');
    
    // Scope stats-grid
    scoped = scoped.replace(/\.stats-grid\b/g, '.page-content .stats-grid');
    
    // Scope stat-card
    scoped = scoped.replace(/\.stat-card\b/g, '.page-content .stat-card');
    
    // Scope team-section
    scoped = scoped.replace(/\.team-section\b/g, '.page-content .team-section');
    
    // Scope team-member
    scoped = scoped.replace(/\.team-member\b/g, '.page-content .team-member');
    
    // Scope back-link
    scoped = scoped.replace(/\.back-link\b/g, '.page-content .back-link');
    
    // Handle media queries - add .page-content scope
    scoped = scoped.replace(/@media\s+([^{]+)\{/g, '@media $1 { .page-content ');
    
    // Handle @keyframes (keep as is)
    scoped = scoped.replace(/@keyframes\s+([^{]+)\{/g, '@keyframes $1 {');
    
    // Add .page-content prefix to main selectors (simple approach)
    const lines = scoped.split('\n');
    const scopedLines = lines.map(line => {
        const trimmed = line.trim();
        // Skip comments, @rules, empty lines, closing braces
        if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('@') || 
            trimmed === '' || trimmed.startsWith('}') || trimmed.startsWith('{')) {
            return line;
        }
        // If it's a selector (not a property), scope it
        if (trimmed && !trimmed.startsWith('--') && trimmed.includes('{')) {
            const selectorMatch = trimmed.match(/^([^{]+)\{/);
            if (selectorMatch) {
                const selector = selectorMatch[1].trim();
                // Don't scope if already scoped or is a special selector
                if (!selector.startsWith('.page-content') && 
                    !selector.startsWith('@') && 
                    selector !== '' &&
                    !selector.startsWith('.header') &&
                    !selector.startsWith('.logo')) {
                    // Scope the selector
                    return line.replace(/^([^{]+)\{/, `.page-content $1 {`);
                }
            }
        }
        return line;
    });
    
    return scopedLines.join('\n');
}

// Process HTML content to enhance display
function processHTMLContent(element) {
    // Process all images
    const images = element.querySelectorAll('img');
    images.forEach(img => {
        // Ensure images are responsive
        if (!img.hasAttribute('style')) {
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
        }
        // Add loading attribute for better performance
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        // Handle broken images
        img.onerror = function() {
            this.style.display = 'none';
        };
    });

    // Process all links
    const links = element.querySelectorAll('a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        // Open external links in new tab
        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });

    // Process tables to ensure they're responsive
    const tables = element.querySelectorAll('table');
    tables.forEach(table => {
        // Wrap table in a scrollable container if it's too wide
        if (!table.parentElement.classList.contains('table-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });

    // Process iframes (videos, embeds)
    const iframes = element.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        iframe.style.maxWidth = '100%';
        iframe.style.height = 'auto';
        // Make YouTube/Vimeo embeds responsive
        if (iframe.src && (iframe.src.includes('youtube.com') || iframe.src.includes('youtu.be') || iframe.src.includes('vimeo.com'))) {
            const wrapper = document.createElement('div');
            wrapper.className = 'video-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.paddingBottom = '56.25%'; // 16:9 aspect ratio
            wrapper.style.height = '0';
            wrapper.style.overflow = 'hidden';
            iframe.style.position = 'absolute';
            iframe.style.top = '0';
            iframe.style.left = '0';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.parentNode.insertBefore(wrapper, iframe);
            wrapper.appendChild(iframe);
        }
    });

    // Process code blocks
    const codeBlocks = element.querySelectorAll('pre, code');
    codeBlocks.forEach(code => {
        if (!code.classList.contains('formatted')) {
            if (code.tagName === 'PRE') {
                code.style.backgroundColor = '#f5f5f5';
                code.style.padding = '15px';
                code.style.borderRadius = '4px';
                code.style.overflowX = 'auto';
                code.style.borderLeft = '4px solid #2874f0';
            } else {
                code.style.backgroundColor = '#f5f5f5';
                code.style.padding = '2px 6px';
                code.style.borderRadius = '3px';
            }
        }
    });

    // Process lists to ensure proper spacing
    const lists = element.querySelectorAll('ul, ol');
    lists.forEach(list => {
        if (!list.style.margin) {
            list.style.margin = '20px 0';
        }
    });

    // Process headings to ensure they have proper styling
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
        if (!heading.style.color && !heading.classList.contains('styled')) {
            heading.classList.add('styled');
        }
    });

    // Process paragraphs
    const paragraphs = element.querySelectorAll('p');
    paragraphs.forEach(p => {
        if (p.innerHTML.trim() === '') {
            p.style.display = 'none'; // Hide empty paragraphs
        }
    });

    // Process horizontal rules
    const hrElements = element.querySelectorAll('hr');
    hrElements.forEach(hr => {
        if (!hr.style.border) {
            hr.style.border = 'none';
            hr.style.borderTop = '2px solid #e0e0e0';
            hr.style.margin = '30px 0';
        }
    });
}

// Process dynamic content after insertion
function processDynamicContent(element) {
    // Re-process images that might have been loaded after initial processing
    const images = element.querySelectorAll('img');
    images.forEach(img => {
        // Ensure images load properly
        if (img.complete && img.naturalHeight === 0) {
            // Image failed to load
            img.style.display = 'none';
        }
    });

    // Process any embedded content
    const embeds = element.querySelectorAll('embed, object');
    embeds.forEach(embed => {
        embed.style.maxWidth = '100%';
        embed.style.height = 'auto';
    });
}

// Decode HTML entities
function decodeHTML(html) {
    if (!html) return '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    return textarea.value;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

