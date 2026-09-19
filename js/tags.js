/**
 * Tags Page Functionality
 * Handles display of all tags and product listings for specific tags
 */

// Global state for tags page
let currentTagSlug = null;
let currentTagName = '';
let listingCurrentPage = 1;

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
async function loadTagProducts(tagSlug, page = 1) {
    const tagsDisplaySection = document.getElementById('tagsDisplaySection');
    const productsSection = document.getElementById('productsSection');
    const productsGrid = document.getElementById('allProducts');
    const sectionTitle = document.getElementById('productsSectionTitle');
    const tagBreadcrumb = document.getElementById('tagBreadcrumb');

    if (!productsGrid) return;

    // Show products section, hide tags display
    tagsDisplaySection.style.display = 'none';
    productsSection.style.display = 'block';

    if (page === 1) {
        productsGrid.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading products for tag: ${tagSlug}...</p>
            </div>
        `;
    }

    try {
        // API call to get tag details and products
        const result = await makeApiCall(`/tags/${tagSlug}/products?page=${page}&per_page=20`, { timeout: 10000 });
        console.log('Tag Products API Response:', result);
        
        if (result && result.success && result.data) {
            let products = [];
            let pagination = null;

            // Robust data extraction for tag products
            if (result.data) {
                if (result.data.products) {
                    if (Array.isArray(result.data.products)) {
                        products = result.data.products;
                        pagination = result.data.pagination || result.pagination || null;
                    } else if (result.data.products.data && Array.isArray(result.data.products.data)) {
                        products = result.data.products.data;
                        pagination = result.data.products;
                    }
                } else if (Array.isArray(result.data.data)) {
                    products = result.data.data;
                    pagination = result.data;
                } else if (Array.isArray(result.data)) {
                    products = result.data;
                    pagination = result.pagination || null;
                }
            }

            console.log(`Extracted ${products.length} products for tag ${tagSlug}`);

            const tagInfo = result.data.tag || { name: tagSlug };
            currentTagName = tagInfo.name || tagSlug;

            // Update UI title and breadcrumbs
            if (sectionTitle) sectionTitle.textContent = `Tag: ${currentTagName}`;
            if (tagBreadcrumb) {
                tagBreadcrumb.innerHTML = `
                    <a href="/tags.html">Tags</a>
                    <i class="fas fa-chevron-right" style="font-size: 10px; margin: 0 8px; color: #878787;"></i>
                    <span>${currentTagName}</span>
                `;
            }

            document.title = `${currentTagName} - Mobitez Private Limited`;

            // Clear loading spinner and render products
            productsGrid.innerHTML = '';
            
            if (products.length > 0) {
                displayFilteredProducts(products);
                
                // Initialize filters (already loaded by app.js correctly)
                if (typeof loadBrandsForFilter === 'function') loadBrandsForFilter();
                if (typeof loadCategoriesForFilter === 'function') loadCategoriesForFilter();

                // Update results count and display pagination
                const paginationData = pagination || {
                    current_page: page,
                    per_page: 20,
                    total: products.length,
                    total_pages: 1
                };

                updateResultsCount(paginationData);
                if (paginationData.total_pages > 1) {
                    displayPagination(paginationData, tagSlug);
                } else {
                    const paginationDiv = document.getElementById('pagination');
                    if (paginationDiv) paginationDiv.style.display = 'none';
                }
            } else {
                productsGrid.innerHTML = `
                    <div class="no-results-message" style="text-align: center; padding: 60px 20px; width: 100%; grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #fff; border-radius: 4px; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.1); margin-top: 10px;">
                        <div style="font-size: 64px; color: #f0f0f0; margin-bottom: 20px;">
                            <i class="fas fa-box-open"></i>
                        </div>
                        <h3 style="font-size: 20px; font-weight: 500; color: #212121; margin: 0 0 10px 0;">Coming Soon</h3>
                        <p style="font-size: 14px; color: #878787; margin: 0 0 24px 0;">We are currently adding new products with this tag.</p>
                        <a href="/" class="browse-btn" style="display: inline-block; background: #1b5e20; color: #fff; padding: 12px 32px; border-radius: 2px; text-decoration: none; font-weight: 500; font-size: 14px; box-shadow: 0 2px 4px 0 rgba(0,0,0,0.2);">Explore Other Products</a>
                    </div>
                `;
            }

            // Update dynamic meta tags (SEO/OG)
            const totalCount = paginationData ? paginationData.total : products.length;
            const firstProductImage = products.length > 0 ? (products[0].image_url || products[0].image) : null;
            updateDynamicMetaTags(currentTagName, totalCount, firstProductImage);

        } else {
            throw new Error('Failed to load tag products');
        }
    } catch (error) {
        console.error('Error loading tag products:', error);
        productsGrid.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
    }
}

/**
 * Update results count
 */
function updateResultsCount(pagination) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount && pagination) {
        const start = ((pagination.current_page - 1) * pagination.per_page) + 1;
        const end = Math.min(start + pagination.per_page - 1, pagination.total);
        resultsCount.textContent = `Showing ${start} - ${end} of ${pagination.total} results`;
    }
}

/**
 * Display pagination
 */
function displayPagination(pagination, tagSlug) {
    const paginationDiv = document.getElementById('pagination');
    if (!paginationDiv) return;

    paginationDiv.style.display = 'flex';
    paginationDiv.innerHTML = '';

    // Previous button
    if (pagination.current_page > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.textContent = 'Previous';
        prevBtn.addEventListener('click', () => {
            listingCurrentPage--;
            loadTagProducts(tagSlug, listingCurrentPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        paginationDiv.appendChild(prevBtn);
    }

    // Page numbers
    for (let i = 1; i <= pagination.total_pages; i++) {
        if (i === 1 || i === pagination.total_pages || (i >= pagination.current_page - 2 && i <= pagination.current_page + 2)) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-btn ${i === pagination.current_page ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                listingCurrentPage = i;
                loadTagProducts(tagSlug, listingCurrentPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            paginationDiv.appendChild(pageBtn);
        } else if (i === pagination.current_page - 3 || i === pagination.current_page + 3) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationDiv.appendChild(ellipsis);
        }
    }

    // Next button
    if (pagination.current_page < pagination.total_pages) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.textContent = 'Next';
        nextBtn.addEventListener('click', () => {
            listingCurrentPage++;
            loadTagProducts(tagSlug, listingCurrentPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        paginationDiv.appendChild(nextBtn);
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

/**
 * Update dynamic meta tags for SEO and Social Sharing
 * @param {string} tagName - The name of the tag
 * @param {number} count - Number of products
 * @param {string} imageUrl - Optional image URL from first product
 */
function updateDynamicMetaTags(tagName, count, imageUrl = null) {
    const title = `${tagName} - Shop ${count} Products on Mobitez Private Limited`;
    const description = `Discover ${count} best deals for ${tagName} at Mobitez Private Limited. High-quality products and accessories at affordable prices.`;
    const url = window.location.href;
    const defaultImage = '/PNG/logo-yw.png';
    const finalImage = imageUrl || defaultImage;

    // Update standard meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', description);

    // Update OG tags
    const ogTags = {
        'og:title': title,
        'og:description': description,
        'og:url': url,
        'og:image': finalImage,
        'og:type': 'website'
    };

    for (const [property, content] of Object.entries(ogTags)) {
        let tag = document.querySelector(`meta[property="${property}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute('property', property);
            document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
    }

    // Also update Twitter/X tags for good measure
    const twitterTags = {
        'twitter:card': 'summary_large_image',
        'twitter:title': title,
        'twitter:description': description,
        'twitter:image': finalImage
    };

    for (const [name, content] of Object.entries(twitterTags)) {
        let tag = document.querySelector(`meta[name="${name}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute('name', name);
            document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
    }
}
