// Search Results Page JavaScript - Flipkart Style

const API_CONFIG = {
    baseUrl: '/api',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key': ''
    }
};

let currentPage = 1;
window.currentPage = currentPage;
let isLoading = false;
let searchQuery = '';
let selectedFilters = {
    category: null,
    brand: [],
    brands: [],
    categories: [],
    minPrice: null,
    maxPrice: null,
    rating: null,
    ratings: [],
    discounts: [],
    includeOutOfStock: false,
    sort: 'relevance'
};

// Global state for suggestion pagination
let searchPageSuggestionState = {
    currentPage: 1,
    currentQuery: '',
    isLoadingMore: false,
    hasMore: true,
    perPage: 10
};

// Make selectedFilters globally accessible for search-filters.js
window.selectedFilters = selectedFilters;

// Initialize search page
document.addEventListener('DOMContentLoaded', () => {
    // Get search query from URL
    const urlParams = new URLSearchParams(window.location.search);
    searchQuery = urlParams.get('q') || '';

    if (!searchQuery) {
        window.location.href = '/';
        return;
    }

    // Set search input value
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = searchQuery;
    }

    // Display search query
    const searchQueryText = document.getElementById('searchQueryText');
    if (searchQueryText) {
        searchQueryText.textContent = searchQuery;
    }

    // Setup search functionality
    setupSearch();

    // Load search results
    loadSearchResults();

    // Setup sort handler
    setupSort();

    // Note: Filters are now handled by search-filters.js
});

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    let searchSuggestions = document.getElementById('searchSuggestions');

    // Dynamically create suggestions container if it was wiped out by header-common.js
    if (!searchSuggestions && searchInput) {
        const searchContainer = searchInput.closest('.search-container');
        if (searchContainer) {
            searchSuggestions = document.createElement('div');
            searchSuggestions.className = 'search-suggestions';
            searchSuggestions.id = 'searchSuggestions';
            searchSuggestions.style.display = 'none';
            searchSuggestions.innerHTML = '<div class="search-suggestions-content" id="searchSuggestionsContent"></div>';
            searchContainer.appendChild(searchSuggestions);
        }
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
            }
        });

        // Handle input for suggestions
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            clearTimeout(searchTimeout);

            if (!query) {
                if (searchSuggestions) searchSuggestions.style.display = 'none';
                return;
            }

            searchTimeout = setTimeout(() => {
                loadSearchSuggestions(query);
            }, 300);
        });

        document.addEventListener('click', (e) => {
            if (searchSuggestions && !searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
                searchSuggestions.style.display = 'none';
            }
        });

        // Handle scroll for infinite loading in suggestions
        searchSuggestions.addEventListener('scroll', () => {
            if (!searchPageSuggestionState.hasMore || searchPageSuggestionState.isLoadingMore) return;

            const { scrollTop, scrollHeight, clientHeight } = searchSuggestions;
            if (scrollTop + clientHeight >= scrollHeight - 20) {
                loadSearchSuggestions(searchPageSuggestionState.currentQuery, searchPageSuggestionState.currentPage + 1);
            }
        });
    }
}

// Load search suggestions with pagination
async function loadSearchSuggestions(query, page = 1) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    const searchSuggestionsContent = document.getElementById('searchSuggestionsContent');

    if (!searchSuggestions || !searchSuggestionsContent) return;

    if (page === 1) {
        searchPageSuggestionState.currentPage = 1;
        searchPageSuggestionState.currentQuery = query;
        searchPageSuggestionState.hasMore = true;
        searchSuggestionsContent.innerHTML = '<div class="suggestion-loading">Searching for items...</div>';
    }

    if (searchPageSuggestionState.isLoadingMore || !searchPageSuggestionState.hasMore) return;

    searchPageSuggestionState.isLoadingMore = true;
    searchPageSuggestionState.currentPage = page;

    try {
        searchSuggestions.style.display = 'block';

        if (page > 1) {
            const loader = document.createElement('div');
            loader.id = 'suggestionLoaderPage';
            loader.className = 'suggestion-loading-more';
            loader.textContent = 'Loading more results...';
            searchSuggestionsContent.appendChild(loader);
        }

        // Search by product name
        const response = await fetch(`${API_CONFIG.baseUrl}/products?name=${encodeURIComponent(query)}&search=${encodeURIComponent(query)}&page=${page}&per_page=${searchPageSuggestionState.perPage}`, {
            headers: API_CONFIG.headers
        });

        const oldLoader = document.getElementById('suggestionLoaderPage');
        if (oldLoader) oldLoader.remove();

        if (response.ok) {
            const result = await response.json();

            if (result.success && result.data) {
                let products = [];
                if (Array.isArray(result.data)) {
                    products = result.data;
                } else if (result.data && Array.isArray(result.data.data)) {
                    products = result.data.data;
                } else if (result.data && Array.isArray(result.data.products)) {
                    products = result.data.products;
                }

                if (products.length > 0) {
                    if (page === 1) searchSuggestionsContent.innerHTML = '';
                    
                    products.forEach(product => {
                        const suggestionItem = document.createElement('div');
                        suggestionItem.className = 'search-suggestion-item';
                        suggestionItem.style.padding = '10px 16px';
                        suggestionItem.style.cursor = 'pointer';
                        suggestionItem.style.display = 'flex';
                        suggestionItem.style.alignItems = 'center';

                        const imgUrl = product.image_url || '/images/placeholder.jpg';
                        const highlightedName = highlightMatchInSearch(escapeHtml(product.name), query);

                        suggestionItem.innerHTML = `
                            <div style="width: 32px; height: 32px; margin-right: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                                <img src="${imgUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.src='/images/placeholder.jpg'">
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div class="suggestion-text" style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden; font-size: 14px; color: #212121;">${highlightedName}</div>
                                <div style="font-size: 12px; color: #878787;">in ${product.category ? (typeof product.category === 'object' ? (product.category.name || 'Category') : product.category) : 'All Categories'}</div>
                            </div>
                        `;
                        
                        suggestionItem.addEventListener('click', () => {
                            window.location.href = `/product.html?slug=${product.slug}`;
                        });
                        searchSuggestionsContent.appendChild(suggestionItem);
                    });

                    if (products.length < searchPageSuggestionState.perPage) {
                        searchPageSuggestionState.hasMore = false;
                    }
                } else {
                    searchPageSuggestionState.hasMore = false;
                    if (page === 1) {
                        searchSuggestionsContent.innerHTML = '<div class="suggestion-empty">No products found matching your search.</div>';
                    }
                }
            } else {
                searchPageSuggestionState.hasMore = false;
                if (page === 1) {
                    searchSuggestionsContent.innerHTML = '<div class="suggestion-empty">No products found matching your search.</div>';
                }
            }
        }
    } catch (error) {
        // console.error('Error loading search suggestions:', error);
    } finally {
        searchPageSuggestionState.isLoadingMore = false;
    }
}

// Handle search
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();

    if (query) {
        window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
    }
}

// Setup sort
function setupSort() {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            selectedFilters.sort = e.target.value;
            currentPage = 1;
            window.currentPage = currentPage;
            loadSearchResults();
        });
    }
}

// Load search results
async function loadSearchResults() {
    if (isLoading) return;

    isLoading = true;
    const productsGrid = document.getElementById('productsGrid');
    const loadingSpinner = document.getElementById('loadingSpinner');

    if (loadingSpinner) loadingSpinner.style.display = 'block';

    try {
        // Build query parameters - search by product name
        const params = new URLSearchParams();
        // Search by product name - API should filter products where name contains the search query
        // We use 'search' parameter to get products from API, then filter client-side for fuzzy matching
        params.append('search', searchQuery.trim());
        // Also try name parameter if API supports it
        params.append('name', searchQuery.trim());
        // Fetch more products per page to allow for better fuzzy matching
        params.append('page', currentPage);
        params.append('per_page', '20'); // Matches backend pagination

        // /* console.log */('Searching for products with query:', searchQuery);
        // /* console.log */('API URL:', `${API_CONFIG.baseUrl}/products?${params.toString()}`);

        if (selectedFilters.category) {
            params.append('category_id', selectedFilters.category);
        }

        if (selectedFilters.brand.length > 0) {
            params.append('brand_id', selectedFilters.brand.join(','));
        }

        if (selectedFilters.minPrice !== null) {
            params.append('min_price', selectedFilters.minPrice);
        }

        if (selectedFilters.maxPrice !== null) {
            params.append('max_price', selectedFilters.maxPrice);
        }

        if (selectedFilters.rating !== null) {
            params.append('min_rating', selectedFilters.rating);
        }

        if (selectedFilters.sort !== 'relevance') {
            params.append('sort', selectedFilters.sort);
        }

        // Note: Discount and availability filters are applied client-side after fetching

        const response = await fetch(`${API_CONFIG.baseUrl}/products?${params.toString()}`, {
            headers: API_CONFIG.headers
        });

        if (response.ok) {
            const result = await response.json();
            let products = [];
            let pagination = null;

            console.log('Search Results API Response:', result);

            if (result.success && result.data) {
                // Handle different API response structures
                // API might return: {success: true, data: [...]} or {success: true, data: {data: [...], pagination: {...}}}
                // Robust data extraction for search results
                if (result.data) {
                    if (Array.isArray(result.data)) {
                        products = result.data;
                        pagination = result.pagination || null;
                    } else if (Array.isArray(result.data.data)) {
                        products = result.data.data;
                        pagination = result.data;
                    } else if (result.data.products) {
                        if (Array.isArray(result.data.products)) {
                            products = result.data.products;
                            pagination = result.data.pagination || result.pagination || null;
                        } else if (result.data.products.data && Array.isArray(result.data.products.data)) {
                            products = result.data.products.data;
                            pagination = result.data.products;
                        }
                    } else {
                        // Fallback: try to extract array from result.data
                        for (const key in result.data) {
                            if (Array.isArray(result.data[key])) {
                                products = result.data[key];
                                break;
                            }
                        }
                    }
                }

                console.log(`Extracted ${products.length} products for search query: ${searchQuery}`);

                // Ensure products match the search query in their name (with typo tolerance)
                if (searchQuery.trim() && products.length > 0) {
                    const queryLower = searchQuery.trim().toLowerCase();
                    products = products.filter(product => {
                        if (!product || !product.name) return false;
                        const match = matchesProductName(product.name, queryLower);
                        if (!match) {
                            // console.log(`Filtered out by name match: ${product.name}`);
                        }
                        return match;
                    });
                }
                // /* console.log */(`Found ${products.length} products matching "${searchQuery}"`);

                // Apply client-side filters (discounts, availability)
                if (selectedFilters.discounts && selectedFilters.discounts.length > 0) {
                    products = products.filter(product => {
                        const originalPrice = parseFloat(product.original_price) || parseFloat(product.price) || 0;
                        const currentPrice = parseFloat(product.price) || 0;
                        const discount = originalPrice > 0 ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
                        return selectedFilters.discounts.some(d => discount >= d);
                    });
                }

                // All products shown regardless of stock status

                // If no results with fuzzy matching, try fetching all products and filtering client-side
                if (products.length === 0 && searchQuery.trim()) {
                    // /* console.log */('No results with search filter, trying broader search...');
                    try {
                        // Try fetching products without search filter to allow client-side fuzzy matching
                        const broaderResponse = await fetch(`${API_CONFIG.baseUrl}/products?page=1&per_page=100`, {
                            headers: API_CONFIG.headers
                        });

                        if (broaderResponse.ok) {
                            const broaderResult = await broaderResponse.json();
                            let broaderProducts = [];

                            // Handle different response structures
                            if (Array.isArray(broaderResult.data)) {
                                broaderProducts = broaderResult.data;
                            } else if (broaderResult.data && Array.isArray(broaderResult.data.data)) {
                                broaderProducts = broaderResult.data.data;
                            } else if (broaderResult.data && Array.isArray(broaderResult.data.products)) {
                                broaderProducts = broaderResult.data.products;
                            }

                            if (broaderProducts.length > 0) {
                                const queryLower = searchQuery.trim().toLowerCase();
                                products = broaderProducts.filter(product => {
                                    if (!product || !product.name) return false;
                                    return matchesProductName(product.name, queryLower);
                                });
                                // /* console.log */(`Found ${products.length} products with broader search`);
                            }
                        }
                    } catch (error) {
                        // /* console.error */('Error in broader search:', error);
                    }
                }

                if (products.length > 0) {
                    const paginationFallback = {
                        current_page: currentPage,
                        per_page: 20,
                        total: products.length,
                        last_page: 1
                    };
                    displayProducts(products, pagination || paginationFallback);
                    updateResultsCount(pagination || paginationFallback);
                } else {
                    displayNoResults();
                }
            } else {
                displayNoResults();
            }
        } else {
            // /* console.error */('Search API Error:', response.status, response.statusText);
            displayNoResults();
        }
    } catch (error) {
        console.error('Error loading search results:', error);
        displayNoResults();
    } finally {
        isLoading = false;
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }
}

// Display products
function displayProducts(products, pagination) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    // Always clear the grid for general pagination
    productsGrid.innerHTML = '';

    products.forEach(product => {
        // Only display products that have a name
        if (!product.name) {
            // /* console.warn */('Skipping product without name:', product);
            return;
        }

        const productCard = createProductCard(product);
        if (productCard) {
            productsGrid.appendChild(productCard);
        }
    });

    // Display pagination
    const totalPages = pagination.total_pages || pagination.last_page || 1;
    if (totalPages > 1) {
        displayPagination(pagination);
    } else {
        const paginationDiv = document.getElementById('pagination');
        if (paginationDiv) paginationDiv.style.display = 'none';
    }
}

// Create product card
function createProductCard(product) {
    const card = document.createElement('a');
    card.href = `/product.html?slug=${product.slug}`;
    // Use desktop-product-card class for specific desktop grid styles if needed, 
    // but the base structure is now the same for both.
    card.className = window.innerWidth > 768 ? 'product-card desktop-product-card' : 'product-card';

    // Get image URL from various possible API response structures
    const imageUrl = product.image_url ||
        (product.gallery_images && product.gallery_images.length > 0 ? product.gallery_images[0].image_url : null) ||
        (product.images && product.images.length > 0 ? product.images[0].url : null) ||
        '/images/placeholder.svg';

    const title = product.name || 'Product Name';
    const currentPrice = parseInt(product.price || 0);
    const originalPrice = parseInt(product.original_price || product.originalPrice || 0);
    const discountPercentage = originalPrice > currentPrice
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;

    card.innerHTML = `
        <img src="${imageUrl}" alt="${escapeHtml(title)}" class="product-image" onerror="this.src='/images/placeholder.svg'">
        <div class="product-info">
            <div class="product-title">${escapeHtml(title)}</div>
            <div class="product-price">
                <span class="price-current">${formatPrice(currentPrice)}</span>
                ${originalPrice > currentPrice ? `
                    <span class="price-original">${formatPrice(originalPrice)}</span>
                ` : ''}
                ${discountPercentage ? `
                    <span class="discount-badge">${discountPercentage}% off</span>
                ` : ''}
            </div>
        </div>
    `;

    return card;
}

// Get product specs
function getProductSpecs(product) {
    const specs = [];

    if (product.simple_attributes) {
        const ram = product.simple_attributes.find(a =>
            (a.name || a.attribute_name || '').toLowerCase().includes('ram')
        );
        const storage = product.simple_attributes.find(a =>
            (a.name || a.attribute_name || '').toLowerCase().includes('storage') ||
            (a.name || a.attribute_name || '').toLowerCase().includes('rom')
        );

        if (ram && storage) {
            specs.push(`${ram.value || ram.attribute_value} RAM | ${storage.value || storage.attribute_value} ROM`);
        }
    }

    return specs.length > 0 ? specs.join('<br>') : '';
}

// Get product specs as list
function getProductSpecsList(product) {
    const specs = [];

    if (product.simple_attributes) {
        const ram = product.simple_attributes.find(a =>
            (a.name || a.attribute_name || '').toLowerCase().includes('ram')
        );
        const storage = product.simple_attributes.find(a =>
            (a.name || a.attribute_name || '').toLowerCase().includes('storage') ||
            (a.name || a.attribute_name || '').toLowerCase().includes('rom')
        );
        const display = product.simple_attributes.find(a =>
            (a.name || a.attribute_name || '').toLowerCase().includes('display') ||
            (a.name || a.attribute_name || '').toLowerCase().includes('screen')
        );
        const battery = product.simple_attributes.find(a =>
            (a.name || a.attribute_name || '').toLowerCase().includes('battery')
        );
        const camera = product.simple_attributes.find(a =>
            (a.name || a.attribute_name || '').toLowerCase().includes('camera')
        );
        const processor = product.simple_attributes.find(a =>
            (a.name || a.attribute_name || '').toLowerCase().includes('processor')
        );

        // Prioritize RAM/ROM
        if (ram && storage) {
            specs.push(`${ram.value || ram.attribute_value} RAM | ${storage.value || storage.attribute_value} ROM`);
        } else if (ram) {
            specs.push(`${ram.value || ram.attribute_value} RAM`);
        } else if (storage) {
            specs.push(`${storage.value || storage.attribute_value} ROM`);
        }

        if (display) specs.push(display.value || display.attribute_value);
        if (camera) specs.push(camera.value || camera.attribute_value);
        if (battery) specs.push(battery.value || battery.attribute_value);
        if (processor) specs.push(processor.value || processor.attribute_value);
    }

    // Fallback if no structured attributes but specifications string exists (JSON or pipe-separated)
    if (specs.length === 0 && product.specifications) {
        if (typeof product.specifications === 'string') {
            // Try to parse if it looks like JSON
            if (product.specifications.trim().startsWith('[') || product.specifications.trim().startsWith('{')) {
                try {
                    const parsed = JSON.parse(product.specifications);
                    // Assuming structure like [{key: 'General', rows: [{key: 'RAM', value: '...'}]}]
                    if (Array.isArray(parsed)) {
                        parsed.forEach(section => {
                            if (section.rows) {
                                section.rows.slice(0, 3).forEach(row => {
                                    if (row.value) specs.push(row.value);
                                });
                            }
                        });
                    }
                } catch (e) {
                    // Not JSON, try pipe split
                    const parts = product.specifications.split('|');
                    parts.forEach(p => {
                        if (p.trim()) specs.push(p.trim());
                    });
                }
            } else {
                // Simple string split
                const parts = product.specifications.split('|');
                parts.forEach(p => {
                    if (p.trim()) specs.push(p.trim());
                });
            }
        } else if (Array.isArray(product.specifications)) {
            // Already an array
            return product.specifications;
        }
    }

    return specs;
}

// Generate stars
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHTML = '';

    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }

    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }

    return starsHTML;
}

// Format price
function formatPrice(price) {
    return `₹${parseInt(price).toLocaleString('en-IN')} `;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Fuzzy match product name - handles typos like "Mackbook" -> "Macbook"
function matchesProductName(productName, searchQuery) {
    if (!productName || !searchQuery) return false;

    const nameLower = productName.toLowerCase();
    const queryLower = searchQuery.toLowerCase().trim();

    // Exact match (case-insensitive)
    if (nameLower.includes(queryLower)) {
        return true;
    }

    // Split into words for better matching
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
    const nameWords = nameLower.split(/\s+/).filter(w => w.length > 0);

    // If single word query, try fuzzy matching
    if (queryWords.length === 1) {
        const queryWord = queryWords[0];

        // Check if any word in product name matches (handles typos)
        for (const nameWord of nameWords) {
            // Exact substring match
            if (nameWord.includes(queryWord) || queryWord.includes(nameWord)) {
                return true;
            }

            // Fuzzy match for typos (e.g., "Mackbook" -> "Macbook")
            if (fuzzyMatch(nameWord, queryWord)) {
                return true;
            }
        }

        // Check if query is contained in any word (for partial matches)
        if (nameLower.includes(queryWord)) {
            return true;
        }
    } else {
        // Multiple words - check if all query words appear somewhere in product name
        return queryWords.every(queryWord => {
            // Check if query word appears in any product word
            return nameWords.some(nameWord => {
                if (nameWord.includes(queryWord) || queryWord.includes(nameWord)) {
                    return true;
                }
                return fuzzyMatch(nameWord, queryWord);
            }) || nameLower.includes(queryWord);
        });
    }

    return false;
}

// Fuzzy string matching for typo tolerance (handles "Mackbook" -> "Macbook")
function fuzzyMatch(str1, str2) {
    if (!str1 || !str2) return false;

    // If strings are very different in length, unlikely match
    const lengthDiff = Math.abs(str1.length - str2.length);
    if (lengthDiff > Math.max(str1.length, str2.length) * 0.3) {
        return false;
    }

    // Check if strings are similar (Levenshtein-like but simpler)
    const minLength = Math.min(str1.length, str2.length);
    const maxLength = Math.max(str1.length, str2.length);

    // If one is much shorter, check if longer contains shorter
    if (maxLength > minLength * 1.5) {
        return str1.includes(str2) || str2.includes(str1);
    }

    // Check character similarity
    let matches = 0;
    const shorter = str1.length <= str2.length ? str1 : str2;
    const longer = str1.length > str2.length ? str1 : str2;

    // Check if most characters match (allowing for 1-2 character differences)
    for (let i = 0; i < shorter.length; i++) {
        if (i < longer.length && shorter[i] === longer[i]) {
            matches++;
        }
    }

    // Also check if strings start similarly (handles "Mackbook" -> "Macbook")
    const startLength = Math.min(3, shorter.length);
    if (shorter.substring(0, startLength) === longer.substring(0, startLength)) {
        matches += startLength;
    }

    // Consider it a match if at least 70% of characters match
    const similarity = matches / Math.max(shorter.length, longer.length);
    return similarity >= 0.7;
}

// Update results count
function updateResultsCount(pagination) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount && pagination) {
        const start = ((pagination.current_page - 1) * pagination.per_page) + 1;
        const end = Math.min(start + pagination.per_page - 1, pagination.total);
        resultsCount.textContent = `Showing ${start} - ${end} of ${pagination.total} results`;
    }
}

// Display pagination
function displayPagination(pagination) {
    const paginationDiv = document.getElementById('pagination');
    if (!paginationDiv) return;

    paginationDiv.style.display = 'flex';
    paginationDiv.innerHTML = '';

    const totalPages = pagination.total_pages || pagination.last_page || 1;
    const currentPageValue = pagination.current_page || 1;

    // Previous button
    if (currentPageValue > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.textContent = 'Previous';
        prevBtn.addEventListener('click', () => {
            currentPage = currentPageValue - 1;
            window.currentPage = currentPage;
            loadSearchResults();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        paginationDiv.appendChild(prevBtn);
    }

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        // Show first, last, and pages around current
        if (i === 1 || i === totalPages || (i >= currentPageValue - 2 && i <= currentPageValue + 2)) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-btn ${i === currentPageValue ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                window.currentPage = currentPage;
                loadSearchResults();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            paginationDiv.appendChild(pageBtn);
        } else if (i === currentPageValue - 3 || i === currentPageValue + 3) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationDiv.appendChild(ellipsis);
        }
    }

    // Next button
    if (currentPageValue < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.textContent = 'Next';
        nextBtn.addEventListener('click', () => {
            currentPage = currentPageValue + 1;
            window.currentPage = currentPage;
            loadSearchResults();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        paginationDiv.appendChild(nextBtn);
    }
}

// Display no results
function displayNoResults() {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
    <div class="no-results" style="text-align: center; padding: 60px 20px; width: 100%; grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #fff; border-radius: 4px; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.1); margin-top: 10px;">
                <i class="fas fa-search" style="font-size: 64px; color: #f0f0f0; margin-bottom: 20px;"></i>
                <h2 style="font-size: 20px; font-weight: 500; color: #212121; margin: 0 0 10px 0;">No products found</h2>
                <p style="font-size: 14px; color: #878787; margin: 0 0 24px 0;">Try adjusting your search or filters</p>
                <a href="/" class="browse-btn" style="display: inline-block; background: #1b5e20; color: #fff; padding: 12px 32px; border-radius: 2px; text-decoration: none; font-weight: 500; font-size: 14px; box-shadow: 0 2px 4px 0 rgba(0,0,0,0.2);">Explore Other Products</a>
            </div>
    `;
    }
}

// Handle compare toggle
function handleCompareToggle(product, isChecked) {
    const COMPARE_STORAGE_KEY = 'mobitez.compare_products';
    const MAX_COMPARE_PRODUCTS = 4;

    let compareList = [];
    try {
        const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
        compareList = stored ? JSON.parse(stored) : [];
    } catch (error) {
        // /* console.error */('Error reading compare list:', error);
    }

    if (isChecked) {
        // Check if already exists
        if (compareList.some(p => p.id === product.id)) {
            return;
        }

        // Check max limit
        if (compareList.length >= MAX_COMPARE_PRODUCTS) {
            showNotification(`You can compare maximum ${MAX_COMPARE_PRODUCTS} products`, 'error');
            return;
        }

        // Add to compare
        compareList.push({
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            originalPrice: product.original_price,
            image: product.image_url || (product.gallery_images && product.gallery_images.length > 0 ? product.gallery_images[0].image_url : null),
            rating: product.rating,
            ratingCount: product.rating_count
        });

        localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareList));
    } else {
        // Remove from compare
        compareList = compareList.filter(p => p.id !== product.id);
        localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareList));
    }
}

// Show notification with auto-dismiss
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type} `;
    notification.textContent = message;
    notification.style.cssText = `
position: fixed;
top: 120px;
right: 20px;
background: ${type === 'error' ? '#ff6161' : type === 'info' ? '#2874f0' : '#388e3c'};
color: white;
padding: 12px 24px;
border - radius: 4px;
box - shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
z - index: 10001;
animation: slideIn 0.3s ease - out;
min - width: 200px;
`;

    // Add animation if not already added
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
@keyframes slideIn {
                from {
        transform: translateX(100 %);
        opacity: 0;
    }
                to {
        transform: translateX(0);
        opacity: 1;
    }
}
`;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Highlight match in search suggestions
function highlightMatchInSearch(text, query) {
    if (!query) return text;
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeQuery})`, 'gi');
    return text.replace(regex, '<b>$1</b>');
}

