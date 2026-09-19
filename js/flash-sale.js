// Flash Sale Page JavaScript

// Global state to cache all loaded products across active flash sales
let allFlashSaleProducts = [];
let isDataLoaded = false;
const PRODUCTS_PER_PAGE = 20;

document.addEventListener('DOMContentLoaded', () => {
    // Check for page parameter
    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get('page')) || 1;

    loadFlashSaleProducts(page);
});

let timerInterval;

// Helper function to recursively load all products for a category
async function fetchAllProductsForCategory(categorySlug) {
    let allProducts = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        try {
            const response = await makeApiCall(`/categories/${categorySlug}/products?page=${page}&per_page=100`);
            if (!response || !response.success || !response.data) {
                break;
            }

            let products = [];
            let lastPage = 1;

            if (response.data.products) {
                if (Array.isArray(response.data.products)) {
                    products = response.data.products;
                    const pag = response.data.pagination || response.pagination || null;
                    if (pag) {
                        lastPage = pag.last_page || pag.total_pages || 1;
                    }
                } else if (response.data.products.data && Array.isArray(response.data.products.data)) {
                    products = response.data.products.data;
                    lastPage = response.data.products.last_page || response.data.products.total_pages || 1;
                }
            } else if (Array.isArray(response.data.data)) {
                products = response.data.data;
                lastPage = response.data.last_page || response.data.total_pages || 1;
            } else if (Array.isArray(response.data)) {
                products = response.data;
                const pag = response.pagination || null;
                if (pag) {
                    lastPage = pag.last_page || pag.total_pages || 1;
                }
            }

            allProducts.push(...products);

            if (page >= lastPage || products.length === 0) {
                hasMore = false;
            } else {
                page++;
            }
        } catch (error) {
            console.error(`Error fetching products for category ${categorySlug} page ${page}:`, error);
            break;
        }
    }
    return allProducts;
}

async function loadFlashSaleProducts(page = 1) {
    const allProducts = document.getElementById('allProducts');
    if (!allProducts) return;

    // Use original console.log to bypass global override if present
    const logFn = window.originalConsoleLog || console.log;

    try {
        if (!isDataLoaded) {
            allProducts.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading amazing deals...</p></div>';

            // Fetch all active flash sales
            const result = await makeApiCall('/flash-sales/active');
            logFn('Flash Sale Page Active Sales Response:', result);

            const salesArray = Array.isArray(result) ? result : (result && result.data && Array.isArray(result.data) ? result.data : []);

            if (salesArray.length > 0) {
                let productScopeProducts = [];
                let categoryScopeProducts = [];
                const now = Date.now();

                // Group all category promises to fetch products in parallel
                let categoryFetchPromises = [];

                for (const sale of salesArray) {
                    // Keep only sales that have not ended yet
                    const endTime = sale.end_time ? new Date(sale.end_time).getTime() : 0;
                    if (endTime > 0 && endTime <= now) {
                        continue; 
                    }

                    const isCat = sale.scope === 'category';
                    if (isCat) {
                        if (sale.categories && sale.categories.length > 0) {
                            for (const cat of sale.categories) {
                                categoryFetchPromises.push((async () => {
                                    const products = await fetchAllProductsForCategory(cat.slug);
                                    return {
                                        products: products,
                                        sale: sale,
                                        category: cat
                                    };
                                })());
                            }
                        }
                    } else {
                        if (sale.products && sale.products.length > 0) {
                            for (const product of sale.products) {
                                productScopeProducts.push({
                                    product: product,
                                    sale: sale,
                                    isCategoryScoped: false
                                });
                            }
                        }
                    }
                }

                // Resolve all category product fetches in parallel
                const categoryResults = await Promise.all(categoryFetchPromises);

                for (const catRes of categoryResults) {
                    const { products, sale, category } = catRes;
                    for (const product of products) {
                        categoryScopeProducts.push({
                            product: product,
                            sale: sale,
                            category: category,
                            isCategoryScoped: true
                        });
                    }
                }

                // Deduplicate products across both groups, prioritizing product scope
                const seenIds = new Set();
                const resolvedProducts = [];

                // Helper to resolve flash sale details for a product
                const resolveProductFlashData = (itemObj) => {
                    const p = itemObj.product;
                    const sale = itemObj.sale;
                    const isCat = itemObj.isCategoryScoped;
                    const category = itemObj.category;

                    const originalPrice = Math.round(parseFloat(p.price) || parseFloat(p.original_price) || 0);
                    let flashPrice = originalPrice;
                    let discount = 0;

                    // 1. If backend has already injected flash_sale_data, prioritize it
                    if (p.flash_sale_data) {
                        flashPrice = parseFloat(p.flash_sale_data.flash_price) || originalPrice;
                        discount = Math.round(parseFloat(p.flash_sale_data.discount_percentage)) || 0;
                    } 
                    // 2. Otherwise calculate on the fly for category-scoped sale
                    else if (isCat && category && category.pivot) {
                        discount = Math.round(parseFloat(category.pivot.discount_percentage)) || 0;
                        flashPrice = originalPrice * (1 - discount / 100);
                    } 
                    // 3. Otherwise calculate for product-scoped sale from pivot
                    else if (!isCat && p.pivot) {
                        flashPrice = parseFloat(p.pivot.flash_price) || originalPrice;
                        discount = originalPrice > flashPrice ? Math.round(((originalPrice - flashPrice) / originalPrice) * 100) : 0;
                    }

                    return {
                        ...p,
                        resolved_flash_sale_data: {
                            flashPrice: Math.round(flashPrice),
                            originalPrice: originalPrice,
                            discount: discount,
                            startTime: sale.start_time || '',
                            endTime: sale.end_time || '',
                            saleName: sale.name,
                            isCategoryScoped: isCat
                        }
                    };
                };

                // Add product-scoped products first
                for (const item of productScopeProducts) {
                    const resolvedProduct = resolveProductFlashData(item);
                    if (!seenIds.has(resolvedProduct.id)) {
                        seenIds.add(resolvedProduct.id);
                        resolvedProducts.push(resolvedProduct);
                    }
                }

                // Add category-scoped products next
                for (const item of categoryScopeProducts) {
                    const resolvedProduct = resolveProductFlashData(item);
                    if (!seenIds.has(resolvedProduct.id)) {
                        seenIds.add(resolvedProduct.id);
                        resolvedProducts.push(resolvedProduct);
                    }
                }

                allFlashSaleProducts = resolvedProducts;
                isDataLoaded = true;
            }
        }

        if (allFlashSaleProducts.length > 0) {
            allProducts.innerHTML = '';

            // Update Banner Title if available using the first item's sale
            const bannerH1 = document.querySelector('.flash-sale-banner h1');
            if (bannerH1 && allFlashSaleProducts[0].resolved_flash_sale_data && allFlashSaleProducts[0].resolved_flash_sale_data.saleName) {
                bannerH1.innerHTML = `<i class="fas fa-bolt"></i> ${allFlashSaleProducts[0].resolved_flash_sale_data.saleName}`;
            }

            // Calculate pagination parameters
            const totalProducts = allFlashSaleProducts.length;
            const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
            
            // Adjust page bounds
            const currentPage = Math.max(1, Math.min(page, totalPages));
            const startIdx = (currentPage - 1) * PRODUCTS_PER_PAGE;
            const endIdx = startIdx + PRODUCTS_PER_PAGE;

            const pageProducts = allFlashSaleProducts.slice(startIdx, endIdx);

            // Render products for the current page
            pageProducts.forEach(product => {
                const fd = product.resolved_flash_sale_data;
                const card = document.createElement('a');
                card.className = 'mega-card';
                card.href = `/product.html?slug=${product.slug}`;

                card.innerHTML = `
                    ${fd.discount > 0 ? `<div class="offer-badge">${fd.discount}% OFF</div>` : ''}

                    <div class="mega-product-img">
                        <img src="${product.image_url || '/images/placeholder.svg'}" alt="${escapeHtml(product.name || 'Product')}" onerror="this.src='/images/placeholder.svg'">
                    </div>

                    <div class="mega-product-name">
                        ${escapeHtml(product.name || 'Product Name')}
                    </div>

                    <div class="price-line">
                        <span class="main-price">₹${fd.flashPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        ${fd.originalPrice > fd.flashPrice ? `<span class="cut-price">₹${fd.originalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>` : ''}
                    </div>

                    <div class="mega-timer" data-starttime="${fd.startTime}" data-endtime="${fd.endTime}">⏰ Ends Soon: Loading...</div>

                    <button class="buy-btn">Grab Deal Now</button>
                `;
                allProducts.appendChild(card);
            });

            // Start page timer logic
            setupFlashSalePageTimer();

            // Update results count
            const paginationObj = {
                current_page: currentPage,
                last_page: totalPages,
                per_page: PRODUCTS_PER_PAGE,
                total: totalProducts
            };
            updateResultsCount(paginationObj);

            // Render pagination controls
            displayPagination(paginationObj);

        } else {
            showNoFlashSalesMessage(allProducts);
        }
    } catch (error) {
        logFn('Error loading flash sales:', error);
        allProducts.innerHTML = `<div class="error-message"><p>Error loading flash sales: ${error.message}</p><button onclick="isDataLoaded=false; loadFlashSaleProducts(1)">Retry</button></div>`;
    }
}

function showNoFlashSalesMessage(container) {
    container.innerHTML = `
        <div class="no-results-message" style="text-align: center; padding: 60px 20px; width: 100%; grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #fff; border-radius: 4px; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.1); margin-top: 10px;">
            <div style="font-size: 64px; color: #ff3e6c; margin-bottom: 20px;">
                <i class="fas fa-clock"></i>
            </div>
            <h3 style="font-size: 20px; font-weight: 500; color: #212121; margin: 0 0 10px 0;">No Active Flash Sales</h3>
            <p style="font-size: 14px; color: #878787; margin: 0 0 24px 0;">Check back later for amazing deals and discounts.</p>
            <a href="/" class="browse-btn" style="display: inline-block; background: #2874f0; color: #fff; padding: 12px 32px; border-radius: 2px; text-decoration: none; font-weight: 500; font-size: 14px; box-shadow: 0 2px 4px 0 rgba(0,0,0,0.2);">Continue Shopping</a>
        </div>
    `;
    
    // Hide the banner if no sales
    const banner = document.querySelector('.flash-sale-banner');
    if (banner) banner.style.display = 'none';
    
    // Hide pagination
    const paginationEl = document.getElementById('pagination');
    if (paginationEl) paginationEl.style.display = 'none';
    
    // Update count
    const resultsCountEl = document.getElementById('resultsCount');
    if (resultsCountEl) resultsCountEl.textContent = '0 products';
}

function setupFlashSalePageTimer() {
    if (timerInterval) clearInterval(timerInterval);

    function updateTimer() {
        const timers = document.querySelectorAll('.mega-timer');
        if (timers.length === 0) return;

        const now = new Date().getTime();
        let allEnded = true;

        timers.forEach(timerElement => {
            const elStartTimeStr = timerElement.getAttribute('data-starttime');
            const elEndTimeStr = timerElement.getAttribute('data-endtime');
            if (!elEndTimeStr) return;

            const startTime = elStartTimeStr ? new Date(elStartTimeStr).getTime() : 0;
            const endTime = new Date(elEndTimeStr).getTime();

            if (startTime > now) {
                allEnded = false;
                const distance = startTime - now;
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                let timeString = '';
                if (days > 0) timeString += days + "d ";
                
                const h = hours < 10 ? "0" + hours : hours;
                const m = minutes < 10 ? "0" + minutes : minutes;
                const s = seconds < 10 ? "0" + seconds : seconds;
                
                timerElement.innerHTML = `⏰ Starts in: ${timeString}${h}:${m}:${s}`;
            } else if (endTime > now) {
                allEnded = false;
                const distance = endTime - now;
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                let timeString = '';
                if (days > 0) timeString += days + "d ";
                
                const h = hours < 10 ? "0" + hours : hours;
                const m = minutes < 10 ? "0" + minutes : minutes;
                const s = seconds < 10 ? "0" + seconds : seconds;
                
                timerElement.innerHTML = `⏰ Ends Soon: ${timeString}${h}:${m}:${s}`;
            } else {
                timerElement.innerHTML = "Sale Ended";
            }
        });

        if (allEnded && timerInterval) {
            clearInterval(timerInterval);
        }
    }

    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

function updateResultsCount(pagination) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount && pagination) {
        if (pagination.total === 0) {
            resultsCount.textContent = '0 products';
            return;
        }
        const start = ((pagination.current_page - 1) * pagination.per_page) + 1;
        const end = Math.min(start + pagination.per_page - 1, pagination.total);
        resultsCount.textContent = `Showing ${start} - ${end} of ${pagination.total} deals`;
    }
}

function displayPagination(pagination) {
    const paginationDiv = document.getElementById('pagination');
    if (!paginationDiv) return;

    const totalPages = pagination.last_page || 1;
    if (totalPages <= 1) {
        paginationDiv.style.display = 'none';
        return;
    }

    paginationDiv.style.display = 'flex';
    paginationDiv.innerHTML = '';

    const currentPageValue = pagination.current_page || 1;

    // Previous button
    if (currentPageValue > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.textContent = 'Previous';
        prevBtn.addEventListener('click', () => {
            loadFlashSaleProducts(currentPageValue - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Update URL without reloading
            const url = new URL(window.location);
            url.searchParams.set('page', currentPageValue - 1);
            window.history.pushState({}, '', url);
        });
        paginationDiv.appendChild(prevBtn);
    }

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPageValue - 2 && i <= currentPageValue + 2)) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-btn ${i === currentPageValue ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                loadFlashSaleProducts(i);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Update URL without reloading
                const url = new URL(window.location);
                url.searchParams.set('page', i);
                window.history.pushState({}, '', url);
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
            loadFlashSaleProducts(currentPageValue + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Update URL without reloading
            const url = new URL(window.location);
            url.searchParams.set('page', currentPageValue + 1);
            window.history.pushState({}, '', url);
        });
        paginationDiv.appendChild(nextBtn);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
