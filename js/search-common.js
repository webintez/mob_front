// Common Search Functionality - Robust Implementation

const SEARCH_API_CONFIG = {
    baseUrl: '/api',
    minChars: 2,
    debounceTime: 300,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key': ''
    }
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
    searchSuggestions.style.zIndex = '999999';
    searchSuggestions.style.backgroundColor = '#ffffff';
    searchSuggestions.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    searchSuggestions.style.borderRadius = '0 0 4px 4px';
    searchSuggestions.style.maxHeight = '400px';
    searchSuggestions.style.overflowY = 'auto';

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
            loadSearchSuggestionsCommon(query);
        }
    });
}

// Alias for compatibility with head-common.js
window.initializeSearch = initSearch;

// Alias for common usage
window.initSearch = initSearch;

// Load suggestions
async function loadSearchSuggestionsCommon(query) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    const searchSuggestionsContent = document.getElementById('searchSuggestionsContent');

    if (!searchSuggestions || !searchSuggestionsContent) return;

    try {
        searchSuggestionsContent.innerHTML = '<div class="suggestion-loading" style="padding: 12px; color: #878787;">Searching...</div>';
        searchSuggestions.style.display = 'block';

        const params = new URLSearchParams();
        params.append('search', query);
        params.append('name', query);
        params.append('per_page', '10');

        const response = await fetch(`${SEARCH_API_CONFIG.baseUrl}/products?${params.toString()}`, {
            headers: SEARCH_API_CONFIG.headers
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`Search API Response [GET /products?search=${query}]:`, result);

            if (result.success && result.data) {
                let products = [];
                if (Array.isArray(result.data)) {
                    products = result.data;
                } else if (result.data && Array.isArray(result.data.data)) {
                    products = result.data.data;
                }

                if (products.length > 0) {
                    processAndRenderSuggestions(products, query, searchSuggestionsContent);
                } else {
                    searchSuggestionsContent.innerHTML = '<div class="suggestion-empty" style="padding: 12px; color: #878787;">No suggestions found</div>';
                }
            } else {
                searchSuggestionsContent.innerHTML = '<div class="suggestion-empty" style="padding: 12px; color: #878787;">No suggestions found</div>';
            }
        }
    } catch (error) {
        console.error('Search Suggestions Error:', error);
    }
}

// Process and Render
function processAndRenderSuggestions(products, query, container) {
    const queryLower = query.toLowerCase().trim();
    container.innerHTML = '';

    // Render Products
    products.slice(0, 8).forEach(p => {
        const item = document.createElement('div');
        item.className = 'search-suggestion-item product';
        item.style.padding = '10px 16px';
        item.style.cursor = 'pointer';
        item.style.borderBottom = '1px solid #f0f0f0';
        item.style.display = 'flex';
        item.style.alignItems = 'center';

        item.addEventListener('mouseenter', () => item.style.backgroundColor = '#f5f5f5');
        item.addEventListener('mouseleave', () => item.style.backgroundColor = 'transparent');

        const imgUrl = p.image_url || '/images/placeholder.jpg';

        item.onclick = (e) => {
            e.stopPropagation();
            window.location.href = `/product.html?slug=${p.slug}`;
        };

        item.innerHTML = `
            <div style="width: 32px; height: 32px; margin-right: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                <img src="${imgUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.src='/images/placeholder.jpg'">
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden; font-size: 14px; color: #212121;">${escapeHtmlCommon(p.name)}</div>
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
