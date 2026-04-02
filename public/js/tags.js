/**
 * Tags Page Functionality
 * Handles display of all tags and product listings for specific tags
 */

// Global state for tags page
let currentTagSlug = null;
let currentTagName = '';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentTagSlug = urlParams.get('tag');

    if (currentTagSlug) {
        // Load products for specific tag
        loadTagProducts(currentTagSlug);
    } else {
        // Load all tags display (grouped by tag groups)
        loadTagsDisplay();
    }
});

/**
 * Fetch and display all tags, grouped by tag groups
 */
async function loadTagsDisplay() {
    const tagsDisplay = document.getElementById('tagsDisplay');
    const tagsDisplaySection = document.getElementById('tagsDisplaySection');
    const productsSection = document.getElementById('productsSection');

    if (!tagsDisplay) return;

    // Show tags section, hide products section
    tagsDisplaySection.style.display = 'block';
    productsSection.style.display = 'none';

    try {
        // Fetch tag groups first to show structure
        const [groupsResult, tagsResult] = await Promise.all([
            makeApiCall('/tag-groups', { timeout: 8000 }),
            makeApiCall('/tags', { timeout: 8000 })
        ]);

        if (groupsResult && groupsResult.success && groupsResult.data && groupsResult.data.length > 0) {
            displayTagGroups(groupsResult.data);
        } else if (tagsResult && tagsResult.success && tagsResult.data && tagsResult.data.length > 0) {
            // Fallback to flat tag list if groups are empty
            displayFlatTags(tagsResult.data);
        } else {
            tagsDisplay.innerHTML = '<p class="error-message">No tags found.</p>';
        }
    } catch (error) {
        console.error('Error loading tags:', error);
        tagsDisplay.innerHTML = `
            <div class="error-container">
                <p>Unable to load tags. Please try again later.</p>
                <button onclick="loadTagsDisplay()" class="retry-btn">Retry</button>
            </div>
        `;
    }
}

/**
 * Render tags grouped by Tag Groups
 */
function displayTagGroups(groups) {
    const tagsDisplay = document.getElementById('tagsDisplay');
    if (!tagsDisplay) return;

    tagsDisplay.innerHTML = '';
    tagsDisplay.className = 'tag-groups-container'; // Special class for grouped layout

    groups.forEach(group => {
        if (!group.tags || group.tags.length === 0) return;

        const groupSection = document.createElement('div');
        groupSection.className = 'tag-group-section';
        groupSection.style.marginBottom = '40px';

        groupSection.innerHTML = `
            <h3 class="tag-group-title" style="font-size: 20px; color: #331C08; border-bottom: 2px solid #ddd; padding-bottom: 10px; margin-bottom: 20px;">${group.name}</h3>
            <div class="tags-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">
                ${group.tags.map(tag => `
                    <a href="/tags.html?tag=${tag.slug}" class="tag-item-card" style="display: flex; flex-direction: column; align-items: center; padding: 15px; background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; text-decoration: none; transition: box-shadow 0.3s;">
                        <span style="color: #2874f0; font-weight: 500; text-align: center;">${tag.name}</span>
                    </a>
                `).join('')}
            </div>
        `;

        tagsDisplay.appendChild(groupSection);
    });
}

/**
 * Render flat tag list
 */
function displayFlatTags(tags) {
    const tagsDisplay = document.getElementById('tagsDisplay');
    if (!tagsDisplay) return;

    tagsDisplay.innerHTML = `
        <div class="tags-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">
            ${tags.map(tag => `
                <a href="/tags.html?tag=${tag.slug}" class="tag-item-card" style="display: flex; flex-direction: column; align-items: center; padding: 15px; background: #fff; border: 1px solid #e0e0e0; border-radius: 4px; text-decoration: none;">
                    <span style="color: #2874f0; font-weight: 500; text-align: center;">${tag.name}</span>
                </a>
            `).join('')}
        </div>
    `;
}

/**
 * Load products for a specific tag
 */
async function loadTagProducts(tagSlug) {
    const tagsDisplaySection = document.getElementById('tagsDisplaySection');
    const productsSection = document.getElementById('productsSection');
    const productsGrid = document.getElementById('allProducts');
    const sectionTitle = document.getElementById('productsSectionTitle');
    const tagBreadcrumb = document.getElementById('tagBreadcrumb');

    if (!productsGrid) return;

    // Show products section, hide tags display
    tagsDisplaySection.style.display = 'none';
    productsSection.style.display = 'block';

    productsGrid.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading products for tag: ${tagSlug}...</p>
        </div>
    `;

    try {
        // Use app.js loadProductsByTag to ensure centralized state
        if (typeof loadProductsByTag === 'function') {
            await loadProductsByTag(tagSlug);
        }

        // API call to get tag details
        const result = await makeApiCall(`/tags/${tagSlug}`, { timeout: 10000 });

        if (result && result.success && result.data) {
            // Depending on API structure, data might be a flat array or { tag: {...}, products: [...] }
            const products = Array.isArray(result.data) ? result.data : (result.data.products || []);
            const tagInfo = Array.isArray(result.data) ? { name: tagSlug } : (result.data.tag || { name: tagSlug });

            currentTagName = tagInfo.name;

            // Update UI
            if (sectionTitle) sectionTitle.textContent = `Tag: ${currentTagName}`;
            if (tagBreadcrumb) {
                tagBreadcrumb.innerHTML = `
                    <a href="/tags.html">Tags</a>
                    <i class="fas fa-chevron-right" style="font-size: 10px; margin: 0 8px; color: #878787;"></i>
                    <span>${currentTagName}</span>
                `;
            }

            document.title = `${currentTagName} - Mobitez`;

            if (products.length > 0) {
                displayFilteredProducts(products);
                
                // Initialize filters
                if (typeof loadBrandsForFilter === 'function') loadBrandsForFilter();
                if (typeof loadCategoriesForFilter === 'function') loadCategoriesForFilter();
            } else {
                productsGrid.innerHTML = `
                    <div class="no-results-message" style="text-align: center; padding: 60px 20px; width: 100%; grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #fff; border-radius: 4px; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.1); margin-top: 10px;">
                        <div style="font-size: 64px; color: #f0f0f0; margin-bottom: 20px;">
                            <i class="fas fa-box-open"></i>
                        </div>
                        <h3 style="font-size: 20px; font-weight: 500; color: #212121; margin: 0 0 10px 0;">Coming Soon</h3>
                        <p style="font-size: 14px; color: #878787; margin: 0 0 24px 0;">We are currently adding new products with this tag.</p>
                        <a href="/" class="browse-btn" style="display: inline-block; background: #2874f0; color: #fff; padding: 12px 32px; border-radius: 2px; text-decoration: none; font-weight: 500; font-size: 14px; box-shadow: 0 2px 4px 0 rgba(0,0,0,0.2);">Explore Other Products</a>
                    </div>
                `;
            }

            // Update results count
            const resultsCount = document.getElementById('resultsCount');
            if (resultsCount) {
                resultsCount.textContent = `Showing 1 – ${products.length} of ${result.data.count || products.length} results`;
            }

        } else {
            throw new Error('Failed to load tag products');
        }
    } catch (error) {
        console.error('Error loading tag products:', error);
        productsGrid.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
    }
}

/**
 * Display filtered products
 * Renamed to match category-filters.js expectation
 */
function displayFilteredProducts(products) {
    const productsGrid = document.getElementById('allProducts');
    if (!productsGrid) return;

    productsGrid.innerHTML = '';

    if (products.length === 0) {
        productsGrid.innerHTML = '<div class="no-results">No products match your filters.</div>';
        return;
    }

    products.forEach(product => {
        if (typeof createProductCard === 'function') {
            const productCard = createProductCard(product);
            productsGrid.appendChild(productCard);
        } else {
            // Fallback
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `<div class="p-4 border"><h3>${product.name}</h3><p>₹${product.price}</p></div>`;
            productsGrid.appendChild(card);
        }
    });
}

/**
 * API Wrapper
 */
async function makeApiCall(endpoint, options = {}) {
    if (window.makeApiCall && window.makeApiCall !== makeApiCall) {
        return window.makeApiCall(endpoint, options);
    }
    const baseUrl = '/api';
    const response = await fetch(`${baseUrl}${endpoint}`, {
        method: options.method || 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    return response.json();
}
