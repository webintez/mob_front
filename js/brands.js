/**
 * Brands Page Functionality
 * Handles display of all brands and product listings for specific brands
 */

// Global state for brands page
let currentBrandSlug = null;
let currentBrandName = '';
let listingCurrentPage = 1;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentBrandSlug = urlParams.get('brand');

    if (currentBrandSlug) {
        // Load products for specific brand
        loadBrandProducts(currentBrandSlug);
    } else {
        // Load all brands display
        loadBrandsDisplay();
    }
});

/**
 * Fetch and display all brands in a grid
 */
async function loadBrandsDisplay() {
    const brandsDisplay = document.getElementById('brandsDisplay');
    const brandsDisplaySection = document.getElementById('brandsDisplaySection');
    const productsSection = document.getElementById('productsSection');

    if (!brandsDisplay) return;

    // Show brands section, hide products section
    brandsDisplaySection.style.display = 'block';
    productsSection.style.display = 'none';

    try {
        const result = await makeApiCall('/brands', { timeout: 8000 });

        if (result && result.success && result.data && result.data.length > 0) {
            displayBrandsList(result.data);
        } else {
            brandsDisplay.innerHTML = '<p class="error-message">No brands found.</p>';
        }
    } catch (error) {
        console.error('Error loading brands:', error);
        brandsDisplay.innerHTML = `
            <div class="error-container">
                <p>Unable to load brands. Please try again later.</p>
                <button onclick="loadBrandsDisplay()" class="retry-btn">Retry</button>
            </div>
        `;
    }
}

/**
 * Render brand cards
 */
function displayBrandsList(brands) {
    const brandsDisplay = document.getElementById('brandsDisplay');
    if (!brandsDisplay) return;

    brandsDisplay.innerHTML = '';

    // Sort brands alphabetically
    const sortedBrands = [...brands].sort((a, b) => a.name.localeCompare(b.name));

    sortedBrands.forEach(brand => {
        const brandCard = document.createElement('a');
        brandCard.href = `/brands.html?brand=${brand.slug}`;
        brandCard.className = 'category-card'; // Reuse category-card styling

        const imageUrl = brand.image_url || '/images/brand-placeholder.png';

        brandCard.innerHTML = `
            <div class="category-image">
                <img src="${imageUrl}" alt="${brand.name}" onerror="this.src='/images/brand-placeholder.png'">
            </div>
            <div class="category-name">${brand.name}</div>
        `;

        brandsDisplay.appendChild(brandCard);
    });
}

/**
 * Load products for a specific brand
 */
async function loadBrandProducts(brandSlug, page = 1) {
    const brandsDisplaySection = document.getElementById('brandsDisplaySection');
    const productsSection = document.getElementById('productsSection');
    const productsGrid = document.getElementById('allProducts');
    const sectionTitle = document.getElementById('productsSectionTitle');
    const brandBreadcrumb = document.getElementById('brandBreadcrumb');

    if (!productsGrid) return;

    // Show products section, hide brands display
    brandsDisplaySection.style.display = 'none';
    productsSection.style.display = 'block';

    if (page === 1) {
        productsGrid.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading products for ${brandSlug}...</p>
            </div>
        `;
    }

    try {
        // Fetch brand details for UI
        const result = await makeApiCall(`/brands/${brandSlug}?page=${page}&per_page=20`, { timeout: 10000 });
        console.log('Brand Products API Response:', result);

        if (result && result.success && result.data) {
            const brandInfo = result.data.brand || { name: brandSlug, slug: brandSlug };
            let products = [];
            let pagination = null;

            // Robust data extraction for brand products
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

            console.log(`Extracted ${products.length} products for brand ${brandSlug}`);

            currentBrandName = brandInfo.name;

            // Update UI elements
            if (sectionTitle) sectionTitle.textContent = `${currentBrandName} Products`;
            if (brandBreadcrumb) {
                brandBreadcrumb.innerHTML = `
                    <a href="/brands.html">Brands</a>
                    <i class="fas fa-chevron-right" style="font-size: 10px; margin: 0 8px; color: #878787;"></i>
                    <span>${currentBrandName}</span>
                `;
            }

            document.title = `${currentBrandName} - Mobitez Private Limited`;

            if (products.length > 0) {
                displayBrandProducts(products);
                
                // Load filter options
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
                    displayPagination(paginationData, brandSlug);
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
                        <p style="font-size: 14px; color: #878787; margin: 0 0 24px 0;">We are currently adding new products for this brand.</p>
                        <a href="/" class="browse-btn" style="display: inline-block; background: #1b5e20; color: #fff; padding: 12px 32px; border-radius: 2px; text-decoration: none; font-weight: 500; font-size: 14px; box-shadow: 0 2px 4px 0 rgba(0,0,0,0.2);">Explore Other Products</a>
                    </div>
                `;
            }
        } else {
            throw new Error('Failed to load brand products');
        }
    } catch (error) {
        console.error('Error loading brand products:', error);
        productsGrid.innerHTML = `
            <div class="error-container" style="text-align: center; padding: 40px; width: 100%;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f44336; margin-bottom: 20px;"></i>
                <p>Failed to load products. ${error.message}</p>
                <button onclick="loadBrandProducts('${brandSlug}')" class="retry-btn" style="margin-top: 20px; background: #2874f0; color: #fff; border: none; padding: 8px 20px; cursor: pointer;">Retry</button>
            </div>
        `;
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
function displayPagination(pagination, brandSlug) {
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
            loadBrandProducts(brandSlug, listingCurrentPage);
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
                loadBrandProducts(brandSlug, listingCurrentPage);
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
            loadBrandProducts(brandSlug, listingCurrentPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        paginationDiv.appendChild(nextBtn);
    }
}


/**
 * Display filtered products
 * This is called by category-filters.js and initial load
 */
function displayBrandProducts(products) {
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
            // Fallback product card creation
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <a href="/product.html?product=${product.slug}" class="product-link">
                    <div class="product-image">
                        <img src="${product.main_image || product.image_url}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-price">₹${product.price}</div>
                    </div>
                </a>
            `;
            productsGrid.appendChild(card);
        }
    });
}

/**
 * API Wrapper (matches app.js logic if not available globally)
 */
async function makeApiCall(endpoint, options = {}) {
    // If global makeApiCall exists and is not this function, use it
    if (window.makeApiCall && window.makeApiCall !== makeApiCall) {
        return window.makeApiCall(endpoint, options);
    }

    const baseUrl = '/api';
    const config = {
        method: options.method || 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    };

    if (options.body) config.body = JSON.stringify(options.body);

    const response = await fetch(`${baseUrl}${endpoint}`, config);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'API call failed');
    return result;
}
