// Common Search Functionality - Robust Implementation

const SEARCH_API_CONFIG = {
    baseUrl: '/api',
    minChars: 2,
    debounceTime: 300,
    perPage: 10, // Initial 10 results, then lazy load
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key': ''
    }
};

// Global state for suggestion pagination
let suggestionState = {
    currentPage: 1,
    currentQuery: '',
    isLoadingMore: false,
    hasMore: true
};

// Initialize search on any page
function initSearch() {
    // If we are on the search page, let search.js handle it to avoid conflicts
    if (window.location.pathname.includes('/search.html')) {
        return;
    }

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (!searchInput) {
        // If not found, try again in a bit (dynamic header might still be loading)
        if (!window._searchInitRetryCount) window._searchInitRetryCount = 0;
        if (window._searchInitRetryCount < 10) {
            window._searchInitRetryCount++;
            setTimeout(initSearch, 200);
        }
        return;
    }

    // Reset retry count once found
    window._searchInitRetryCount = 0;

    // Remove existing suggestions container if it exists (to start fresh and avoid duplicates)
    const existingSuggestions = document.getElementById('searchSuggestions');
    if (existingSuggestions) {
        existingSuggestions.remove();
    }

    // Create a new suggestions container appended to BODY to avoid overflow clipping
    const searchSuggestions = document.createElement('div');
    searchSuggestions.className = 'search-suggestions';
    searchSuggestions.id = 'searchSuggestions';
    searchSuggestions.style.display = 'none';
    searchSuggestions.style.position = 'absolute';

    // Initial content container
    searchSuggestions.innerHTML = '<div class="search-suggestions-content" id="searchSuggestionsContent"></div>';
    document.body.appendChild(searchSuggestions);

    // Function to position the suggestions dropdown
    function positionSuggestions() {
        // Use the current input element (newSearchInput)
        if (!newSearchInput || !searchSuggestions) return;
        const rect = newSearchInput.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        let width = rect.width;
        if (searchBtn && searchBtn.getBoundingClientRect().left > rect.left) {
            const btnRect = searchBtn.getBoundingClientRect();
            width += btnRect.width;
        }

        searchSuggestions.style.top = (rect.bottom + scrollTop) + 'px';
        searchSuggestions.style.left = (rect.left + scrollLeft) + 'px';
        searchSuggestions.style.width = width + 'px';
    }

    // Reposition on resize and scroll
    window.removeEventListener('resize', positionSuggestions);
    window.removeEventListener('scroll', positionSuggestions);
    window.addEventListener('resize', positionSuggestions);
    window.addEventListener('scroll', positionSuggestions);

    // Search button handler - remove existing listener via clone to avoid duplicates
    if (searchBtn) {
        const newBtn = searchBtn.cloneNode(true);
        searchBtn.parentNode.replaceChild(newBtn, searchBtn);
        newBtn.addEventListener('click', handleSearchCommon);
    }

    // Remove old listener if any and add new one
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);

    newSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearchCommon();
        }
    });

    // Handle input with debounce
    let searchTimeout;
    newSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(searchTimeout);

        if (!query || query.length < SEARCH_API_CONFIG.minChars) {
            searchSuggestions.style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(() => {
            positionSuggestions();
            loadSearchSuggestionsCommon(query);
        }, SEARCH_API_CONFIG.debounceTime);
    });

    // Hide when clicking outside
    document.removeEventListener('click', window._searchOutsideClick);
    window._searchOutsideClick = (e) => {
        if (searchSuggestions.style.display !== 'none' &&
            !newSearchInput.contains(e.target) &&
            !searchSuggestions.contains(e.target)) {
            searchSuggestions.style.display = 'none';
        }
    };
    document.addEventListener('click', window._searchOutsideClick);

    // Show on focus
    newSearchInput.addEventListener('focus', () => {
        const query = newSearchInput.value.trim();
        if (query && query.length >= SEARCH_API_CONFIG.minChars) {
            positionSuggestions();
            loadSearchSuggestionsCommon(query, 1); // Reset to page 1
        }
    });

    // Handle scroll for infinite loading
    searchSuggestions.addEventListener('scroll', () => {
        if (!suggestionState.hasMore || suggestionState.isLoadingMore) return;

        const { scrollTop, scrollHeight, clientHeight } = searchSuggestions;
        // Trigger if within 20px of bottom
        if (scrollTop + clientHeight >= scrollHeight - 20) {
            loadSearchSuggestionsCommon(suggestionState.currentQuery, suggestionState.currentPage + 1);
        }
    });
}

// Alias for compatibility with head-common.js
window.initializeSearch = initSearch;

// Alias for common usage
window.initSearch = initSearch;

// Load suggestions with pagination support
async function loadSearchSuggestionsCommon(query, page = 1) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    const searchSuggestionsContent = document.getElementById('searchSuggestionsContent');

    if (!searchSuggestions || !searchSuggestionsContent) return;

    // Reset state if it's a new query
    if (page === 1) {
        suggestionState.currentPage = 1;
        suggestionState.currentQuery = query;
        suggestionState.hasMore = true;
        searchSuggestionsContent.innerHTML = '<div class="suggestion-loading">Searching for items...</div>';
    }

    if (suggestionState.isLoadingMore || !suggestionState.hasMore) return;
    
    suggestionState.isLoadingMore = true;
    suggestionState.currentPage = page;

    try {
        searchSuggestions.style.display = 'block';

        const params = new URLSearchParams();
        params.append('search', query);
        params.append('name', query);
        params.append('page', page);
        params.append('per_page', SEARCH_API_CONFIG.perPage);

        // Show loading more indicator at bottom if not page 1
        if (page > 1) {
            const loader = document.createElement('div');
            loader.id = 'suggestionLoader';
            loader.className = 'suggestion-loading-more';
            loader.textContent = 'Loading more results...';
            searchSuggestionsContent.appendChild(loader);
        }

        const response = await fetch(`${SEARCH_API_CONFIG.baseUrl}/products?${params.toString()}`, {
            headers: SEARCH_API_CONFIG.headers
        });

        // Remove loading indicator
        const oldLoader = document.getElementById('suggestionLoader');
        if (oldLoader) oldLoader.remove();

        if (response.ok) {
            const result = await response.json();

            if (result.success && result.data) {
                let products = [];
                if (Array.isArray(result.data)) {
                    products = result.data;
                } else if (result.data && Array.isArray(result.data.data)) {
                    products = result.data.data;
                }

                if (products.length > 0) {
                    processAndRenderSuggestions(products, query, searchSuggestionsContent, page);
                    
                    // Update hasMore based on pagination or results length
                    if (products.length < SEARCH_API_CONFIG.perPage) {
                        suggestionState.hasMore = false;
                    }
                } else {
                    suggestionState.hasMore = false;
                    if (page === 1) {
                        searchSuggestionsContent.innerHTML = '<div class="suggestion-empty">No products found matching your search.</div>';
                    }
                }
            } else {
                suggestionState.hasMore = false;
                if (page === 1) {
                    searchSuggestionsContent.innerHTML = '<div class="suggestion-empty">No products found matching your search.</div>';
                }
            }
        }
    } catch (error) {
        console.error('Search Suggestions Error:', error);
    } finally {
        suggestionState.isLoadingMore = false;
    }
}

// Process and Render Suggestions (Supports Appending)
function processAndRenderSuggestions(products, query, container, page = 1) {
    const queryLower = query.toLowerCase().trim();
    if (page === 1) container.innerHTML = '';

    // Render Products
    products.forEach(p => {
        const item = document.createElement('div');
        item.className = 'search-suggestion-item product';
        item.style.padding = '10px 16px';
        item.style.cursor = 'pointer';
        item.style.display = 'flex';
        item.style.alignItems = 'center';

        const imgUrl = p.image_url || '/images/placeholder.jpg';

        item.onclick = (e) => {
            e.stopPropagation();
            window.location.href = `/product.html?slug=${p.slug}`;
        };

        const highlightedName = highlightMatch(escapeHtmlCommon(p.name), query);

        item.innerHTML = `
            <div style="width: 32px; height: 32px; margin-right: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                <img src="${imgUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.src='/images/placeholder.jpg'">
            </div>
            <div style="flex: 1; min-width: 0;">
                <div class="suggestion-text" style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden; font-size: 14px; color: #212121;">${highlightedName}</div>
                <div style="font-size: 12px; color: #878787;">in ${p.category ? (typeof p.category === 'object' ? (p.category.name || 'Category') : p.category) : 'All Categories'}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

function handleSearchCommon() {
    const searchInput = document.getElementById('searchInput');
    const searchSuggestions = document.getElementById('searchSuggestions');
    const query = searchInput ? searchInput.value.trim() : '';
    if (searchSuggestions) searchSuggestions.style.display = 'none';
    if (query) window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
}

function escapeHtmlCommon(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function highlightMatch(text, query) {
    if (!query) return text;
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeQuery})`, 'gi');
    return text.replace(regex, '<b>$1</b>');
}

// Ensure execution
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
} else {
    setTimeout(initSearch, 500);
}
