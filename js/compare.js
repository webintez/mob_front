// Compare Page JavaScript - Flipkart Style

const COMPARE_STORAGE_KEY = 'mobitez.compare_products';
const MAX_COMPARE_PRODUCTS = 4;

let compareProducts = [];
let productDetails = [];
let brands = [];
let allProducts = [];

// Get makeApiCall function from global scope or app.js
function getMakeApiCall() {
    if (typeof makeApiCall !== 'undefined') {
        return makeApiCall;
    } else if (typeof window.makeApiCall !== 'undefined') {
        return window.makeApiCall;
    } else {
        // Fallback API call function
        return async function (endpoint, options = {}) {
            const API_CONFIG = {
                baseUrl: '/api',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-API-Key': ''
                }
            };

            const url = `${API_CONFIG.baseUrl}${endpoint}`;
            const config = {
                method: options.method || 'GET',
                headers: {
                    ...API_CONFIG.headers,
                    ...(options.headers || {})
                }
            };

            if (options.body) {
                config.body = JSON.stringify(options.body);
            }

            const response = await fetch(url, config);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `API request failed with status ${response.status}`);
            }

            return result;
        };
    }
}

// Initialize compare page
document.addEventListener('DOMContentLoaded', () => {
    loadCompareProducts();
    loadBrands();
    setupAddProductHandlers();
});

// Get compare list from localStorage
function getCompareList() {
    try {
        const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        // /* console.error */('Error reading compare list:', error);
        return [];
    }
}

// Save compare list to localStorage
function saveCompareList(products) {
    try {
        localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
        // /* console.error */('Error saving compare list:', error);
    }
}

// Load compare products and display
async function loadCompareProducts() {
    compareProducts = getCompareList();

    if (compareProducts.length === 0) {
        showEmptyState();
        return;
    }

    // Load full product details for each product
    await loadProductDetails();

    // Display compare table
    displayCompareTable();
}

// Load full product details from API
async function loadProductDetails() {
    productDetails = [];
    const makeApiCallFunc = getMakeApiCall();

    for (const product of compareProducts) {
        try {
            const result = await makeApiCallFunc(`/products/${product.slug}`);

            if (result && result.success && result.data) {
                const productData = result.data;

                // Fetch linked_variations for color images - CRITICAL for displaying color images
                try {
                    const linkedVariationsResult = await makeApiCallFunc(`/linked-variations/product/${product.slug}`);
                    if (linkedVariationsResult && linkedVariationsResult.success && linkedVariationsResult.data) {
                        // Store linked_variations array directly from API response
                        productData.linked_variations = linkedVariationsResult.data.linked_variations || [];
                    } else {
                        productData.linked_variations = [];
                    }
                } catch (linkedVariationsError) {
                    // If linked_variations endpoint fails, set empty array
                    productData.linked_variations = [];
                }

                // Fetch reviews count if not available in product data
                if (!productData.reviews_count && !productData.review_count && !productData.rating_count) {
                    try {
                        const reviewsResult = await makeApiCallFunc(`/reviews/product/${product.slug}?page=1&per_page=1`);
                        if (reviewsResult && reviewsResult.success && reviewsResult.data) {
                            productData.reviews_count = reviewsResult.data.total_reviews || 0;
                            productData.rating_count = reviewsResult.data.total_reviews || 0;
                        }
                    } catch (reviewError) {
                        // Ignore review fetch errors, use product data as is
                    }
                }

                productDetails.push(productData);
            } else {
                // Fallback to stored data
                productDetails.push(product);
            }
        } catch (error) {
            // /* console.log */(`Product Fetch Failed: ${product.slug}`, error.message);
            // Fallback to stored data
            productDetails.push(product);
        }
    }
}

// Load brands for dropdown
async function loadBrands() {
    try {
        const makeApiCallFunc = getMakeApiCall();
        const result = await makeApiCallFunc('/brands');

        if (result && result.success && result.data) {
            brands = Array.isArray(result.data) ? result.data : (result.data.brands || []);
            populateBrandDropdowns();
        }
    } catch (error) {
        // /* console.log */('Brands Fetch Failed:', error.message);
    }
}

// Populate brand dropdowns
function populateBrandDropdowns() {
    for (let i = 1; i < MAX_COMPARE_PRODUCTS; i++) {
        const brandSelect = document.getElementById(`brandSelect${i}`);
        if (brandSelect) {
            brandSelect.innerHTML = '<option value="">Choose Brand</option>';
            brands.forEach(brand => {
                const option = document.createElement('option');
                // Use slug if available, otherwise use ID
                option.value = brand.slug || brand.id;
                option.textContent = brand.name;
                // Store both slug and ID as data attributes for flexibility
                if (brand.slug) option.dataset.slug = brand.slug;
                if (brand.id) option.dataset.id = brand.id;
                brandSelect.appendChild(option);
            });
        }
    }
}

// Setup add product handlers
function setupAddProductHandlers() {
    for (let i = 1; i < MAX_COMPARE_PRODUCTS; i++) {
        const addProductDiv = document.getElementById(`addProduct${i}`);
        const placeholder = addProductDiv?.querySelector('.add-product-placeholder');
        const dropdown = addProductDiv?.querySelector('.add-product-dropdown');
        const brandSelect = document.getElementById(`brandSelect${i}`);
        const productSelect = document.getElementById(`productSelect${i}`);

        if (placeholder && dropdown) {
            placeholder.addEventListener('click', () => {
                if (productDetails.length >= MAX_COMPARE_PRODUCTS) {
                    showNotification(`You can compare maximum ${MAX_COMPARE_PRODUCTS} products`, 'error');
                    return;
                }
                placeholder.style.display = 'none';
                dropdown.style.display = 'block';
            });
        }

        if (brandSelect) {
            brandSelect.addEventListener('change', async (e) => {
                const brandId = e.target.value;
                const productSelect = document.getElementById(`productSelect${i}`);

                if (brandId) {
                    // Load products for selected brand
                    await loadProductsByBrand(brandId, i);
                } else {
                    // Reset product dropdown if no brand selected
                    if (productSelect) {
                        productSelect.innerHTML = '<option value="">Choose a Product</option>';
                        productSelect.disabled = false;
                    }
                }
            });
        }

        if (productSelect) {
            productSelect.addEventListener('change', async (e) => {
                const productSlug = e.target.value;
                if (productSlug) {
                    await addProductToCompare(productSlug, i);
                }
            });
        }
    }
}

// Load products by brand
async function loadProductsByBrand(brandId, columnIndex) {
    const productSelect = document.getElementById(`productSelect${columnIndex}`);
    if (!productSelect) return;

    // Show loading state
    productSelect.innerHTML = '<option value="">Loading products...</option>';
    productSelect.disabled = true;

    try {
        const makeApiCallFunc = getMakeApiCall();
        const result = await makeApiCallFunc(`/brands/${brandId}/products?per_page=100`);

        if (result && result.success && result.data) {
            productSelect.innerHTML = '<option value="">Choose a Product</option>';

            // Handle different response structures
            let products = [];
            if (Array.isArray(result.data)) {
                products = result.data;
            } else if (result.data.data && Array.isArray(result.data.data)) {
                products = result.data.data;
            } else if (result.data.products && Array.isArray(result.data.products)) {
                products = result.data.products;
            }

            if (products.length === 0) {
                productSelect.innerHTML = '<option value="">No products found</option>';
                showNotification('No products found for this brand', 'info');
            } else {
                // Populate dropdown with products
                products.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.slug || product.id;
                    option.textContent = product.name || 'Unnamed Product';
                    productSelect.appendChild(option);
                });

                // Show success message if many products loaded
                if (products.length > 50) {
                    // /* console.log */(`Loaded ${products.length} products for brand ${brandId}`);
                }
            }
        } else {
            productSelect.innerHTML = '<option value="">Failed to load products</option>';
            showNotification('Failed to load products. Please try again.', 'error');
        }
    } catch (error) {
        // /* console.error */('Products by Brand Fetch Failed:', error);
        productSelect.innerHTML = '<option value="">Error loading products</option>';
        showNotification('Error loading products. Please try again.', 'error');
    } finally {
        productSelect.disabled = false;
    }
}

// Add product to compare from dropdown
async function addProductToCompare(productSlug, columnIndex) {
    try {
        const makeApiCallFunc = getMakeApiCall();
        const result = await makeApiCallFunc(`/products/${productSlug}`);

        if (result && result.success && result.data) {
            const product = result.data;

            // Check if already in compare
            const exists = compareProducts.some(p => p.id === product.id);
            if (exists) {
                showNotification('Product already in compare list', 'info');
                return;
            }

            // Add to compare list
            const compareProduct = {
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                originalPrice: product.original_price,
                image: product.image_url || (product.gallery_images && product.gallery_images.length > 0 ? product.gallery_images[0].image_url : null),
                rating: product.rating,
                ratingCount: product.rating_count
            };

            compareProducts.push(compareProduct);
            saveCompareList(compareProducts);

            // Reload page to refresh display
            location.reload();
        }
    } catch (error) {
        // /* console.log */('Add Product Failed:', error.message);
        showNotification('Failed to add product', 'error');
    }
}

// Display compare table
function displayCompareTable() {
    const compareEmpty = document.getElementById('compareEmpty');
    const compareContent = document.getElementById('compareContent');
    const tableBody = document.getElementById('compareTableBody');
    const comparePageTitle = document.getElementById('comparePageTitle');
    const compareItemCount = document.getElementById('compareItemCount');

    if (compareEmpty) compareEmpty.style.display = 'none';
    if (compareContent) compareContent.style.display = 'block';

    // Update title
    if (comparePageTitle && productDetails.length > 0) {
        comparePageTitle.textContent = `Compare ${productDetails[0].name} vs others`;
    }

    if (compareItemCount) {
        compareItemCount.textContent = `${productDetails.length} item${productDetails.length > 1 ? 's' : ''}`;
    }

    // Display product columns
    for (let i = 0; i < MAX_COMPARE_PRODUCTS; i++) {
        const productCol = document.getElementById(`productCol${i}`);
        const addProductDiv = document.getElementById(`addProduct${i}`);

        if (i < productDetails.length) {
            // Show product
            if (productCol) {
                productCol.style.display = 'table-cell';
                displayProductHeader(i, productDetails[i]);
            }
            if (addProductDiv) {
                addProductDiv.style.display = 'none';
            }
        } else {
            // Show add product placeholder
            if (productCol) {
                productCol.style.display = 'table-cell';
            }
            if (addProductDiv) {
                addProductDiv.style.display = 'block';
                const placeholder = addProductDiv.querySelector('.add-product-placeholder');
                const dropdown = addProductDiv.querySelector('.add-product-dropdown');
                if (placeholder) placeholder.style.display = 'block';
                if (dropdown) dropdown.style.display = 'none';
            }
        }
    }

    // Generate comparison rows dynamically from API data
    if (tableBody) {
        tableBody.innerHTML = '';

        // Price row (always show)
        addCompareRow('Price', productDetails.map(p => formatPrice(p.price || p.original_price || 0)));

        // Original Price and Discount
        const hasDiscount = productDetails.some(p => p.original_price && p.original_price > p.price);
        if (hasDiscount) {
            addCompareRow('Original Price', productDetails.map(p => {
                if (p.original_price && p.original_price > p.price) {
                    return formatPrice(p.original_price);
                }
                return 'N/A';
            }));

            addCompareRow('Discount', productDetails.map(p => {
                if (p.original_price && p.original_price > p.price) {
                    const discount = Math.round(((p.original_price - p.price) / p.original_price) * 100);
                    return `${discount}% off`;
                }
                return 'N/A';
            }));
        }

        // Brand (if available)
        const hasBrand = productDetails.some(p => p.brand || p.brand_name || (p.brand && p.brand.name));
        if (hasBrand) {
            addCompareRow('Brand', productDetails.map(p => {
                if (p.brand && p.brand.name) return p.brand.name;
                if (p.brand_name) return p.brand_name;
                if (p.brand && typeof p.brand === 'string') return p.brand;
                return 'N/A';
            }));
        }

        // Model Number (if available)
        const hasModel = productDetails.some(p => p.model_number || p.model || p.sku);
        if (hasModel) {
            addCompareRow('Model Number', productDetails.map(p => p.model_number || p.model || p.sku || 'N/A'));
        }

        // Rating row (always show)
        addCompareRow('Rating', productDetails.map(p => {
            if (p.rating) {
                const reviewCount = getReviewsCount(p);
                return `${p.rating} ⭐ (${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})`;
            }
            return 'Not rated';
        }));

        // Stock Availability (if available)
        const hasStock = productDetails.some(p => p.stock_status !== undefined || p.in_stock !== undefined || p.quantity !== undefined);
        if (hasStock) {
            addCompareRow('Availability', productDetails.map(p => {
                if (p.stock_status !== undefined) {
                    return p.stock_status === 'in_stock' || p.stock_status === true ? 'In Stock' : 'Out of Stock';
                }
                if (p.in_stock !== undefined) {
                    return p.in_stock ? 'In Stock' : 'Out of Stock';
                }
                if (p.quantity !== undefined) {
                    return p.quantity > 0 ? `In Stock (${p.quantity} available)` : 'Out of Stock';
                }
                return 'N/A';
            }));
        }

        // Short Description section
        const hasDescription = productDetails.some(p => p.description || p.short_description);
        if (hasDescription) {
            addCompareRow('Description', productDetails.map(p => {
                const desc = p.description || p.short_description || '';
                // Limit description length for comparison table
                return desc.length > 150 ? desc.substring(0, 150) + '...' : desc || 'N/A';
            }));
        }

        // Highlights section
        const hasHighlights = productDetails.some(p => (p.highlights && (Array.isArray(p.highlights) ? p.highlights.length > 0 : p.highlights)) || getHighlightsFromAttributes(p).length > 0);
        if (hasHighlights) {
            addCategorySection('Highlights', [
                { label: 'Key Features', getValue: (p) => getHighlights(p) }
            ]);
        }

        // Payment Options (EMI, COD, etc.)
        const hasPaymentOptions = productDetails.some(p =>
            p.easy_payment_options || p.payment_options || p.price
        );
        if (hasPaymentOptions) {
            addCategorySection('Payment Options', [
                { label: 'Payment Methods', getValue: (p) => getPaymentOptions(p) },
                { label: 'EMI Available', getValue: (p) => getEMIInfo(p) }
            ]);
        }

        // Dynamically generate comparison rows from product specifications/attributes
        generateDynamicComparisonRows();
    }

    // Setup remove buttons
    setupRemoveButtons();
}

// Add category section
function addCategorySection(categoryName, fields) {
    // Category header row
    const headerRow = document.createElement('tr');
    headerRow.className = 'compare-category-header';
    const headerCell = document.createElement('td');
    headerCell.className = 'compare-feature-col';
    headerCell.colSpan = MAX_COMPARE_PRODUCTS + 1;
    headerCell.textContent = categoryName;
    headerRow.appendChild(headerCell);
    document.getElementById('compareTableBody').appendChild(headerRow);

    // Fields in category
    fields.forEach(field => {
        addCompareRow(field.label, productDetails.map(p => field.getValue(p) || 'N/A'));
    });
}

// Generate dynamic comparison rows from product attributes/specifications
function generateDynamicComparisonRows() {
    if (productDetails.length === 0) return;

    // First, check if we have grouped specifications
    const hasGroupedSpecs = productDetails.some(p =>
        p.specifications && Array.isArray(p.specifications) && p.specifications.length > 0
    );

    // Collect attributes that are NOT in grouped specifications (to avoid duplication)
    const allAttributes = new Map();
    const groupedSpecAttributes = new Set();

    // If we have grouped specs, collect all attribute names from them first
    if (hasGroupedSpecs) {
        productDetails.forEach(product => {
            if (product.specifications && Array.isArray(product.specifications)) {
                product.specifications.forEach(section => {
                    if (section.rows && Array.isArray(section.rows)) {
                        section.rows.forEach(row => {
                            const rowLabel = row.label || '';
                            if (rowLabel) {
                                groupedSpecAttributes.add(rowLabel.toLowerCase());
                            }
                        });
                    }
                });
            }
        });
    }

    // Only collect simple_attributes and simple_attribute_values if they're NOT in grouped specs
    // or if there are no grouped specs at all
    if (!hasGroupedSpecs) {
        productDetails.forEach(product => {
            // Check for simple_attributes
            if (product.simple_attributes && Array.isArray(product.simple_attributes)) {
                product.simple_attributes.forEach(attr => {
                    const attrName = attr.name || attr.attribute_name || '';
                    if (attrName && !allAttributes.has(attrName)) {
                        allAttributes.set(attrName, {
                            name: attrName,
                            values: []
                        });
                    }
                });
            }

            // Check for simple_attribute_values
            if (product.simple_attribute_values && Array.isArray(product.simple_attribute_values)) {
                product.simple_attribute_values.forEach(attr => {
                    const attrName = attr.attribute?.name || attr.attribute_name || '';
                    if (attrName && !allAttributes.has(attrName)) {
                        allAttributes.set(attrName, {
                            name: attrName,
                            values: []
                        });
                    }
                });
            }
        });
    }

    // Group attributes by category (if available)
    const categories = new Map();
    const uncategorized = [];

    allAttributes.forEach((attr, attrName) => {
        // Skip warranty-related attributes (they will be handled separately or excluded)
        const lowerName = attrName.toLowerCase();
        if (lowerName.includes('warranty') || lowerName.includes('warranty summary') ||
            lowerName.includes('domestic warranty') || lowerName.includes('warranty period')) {
            return; // Skip warranty attributes
        }

        // Try to determine category from attribute name
        let category = 'GENERAL';

        if (lowerName.includes('ram') || lowerName.includes('storage') || lowerName.includes('memory') ||
            lowerName.includes('rom') || lowerName.includes('display') || lowerName.includes('screen') ||
            lowerName.includes('camera') || lowerName.includes('battery') || lowerName.includes('processor') ||
            lowerName.includes('cpu') || lowerName.includes('chipset')) {
            category = 'Highlights';
        } else if (lowerName.includes('sim') || lowerName.includes('network') || lowerName.includes('connectivity') ||
            lowerName.includes('wifi') || lowerName.includes('bluetooth') || lowerName.includes('gps')) {
            category = 'GENERAL FEATURES';
        } else if (lowerName.includes('return') || lowerName.includes('seller')) {
            category = 'Seller & Support';
        } else if (lowerName.includes('color') || lowerName.includes('variant') || lowerName.includes('size')) {
            category = 'Variants';
        } else {
            category = 'GENERAL FEATURES';
        }

        if (!categories.has(category)) {
            categories.set(category, []);
        }
        categories.get(category).push(attrName);
    });

    // Display categorized attributes
    categories.forEach((attributes, categoryName) => {
        if (attributes.length > 0) {
            const fields = attributes.map(attrName => ({
                label: attrName,
                getValue: (p) => getSpecValue(p, attrName)
            }));
            addCategorySection(categoryName, fields);
        }
    });

    // Add seller information if available
    const hasSellerInfo = productDetails.some(p => p.seller || p.seller_name);
    if (hasSellerInfo) {
        addCategorySection('Seller', [
            { label: 'Seller', getValue: (p) => getSeller(p) }
        ]);
    }

    // Add variants if available
    const hasVariants = productDetails.some(p => (p.variations && p.variations.length > 0) || (p.variants && p.variants.length > 0));
    if (hasVariants) {
        addCategorySection('Variants', [
            { label: 'Available Options', getValue: (p) => getVariants(p) }
        ]);
    }

    // Add Bank Offers section if available
    const hasBankOffers = productDetails.some(p => p.bank_offers && Array.isArray(p.bank_offers) && p.bank_offers.length > 0);
    if (hasBankOffers) {
        addCategorySection('Available Offers', [
            { label: 'Bank Offers', getValue: (p) => getBankOffers(p) }
        ]);
    }

    // Add delivery information if available
    const hasDeliveryInfo = productDetails.some(p => p.delivery_info || p.estimated_delivery || p.shipping_info || p.delivery_date);
    if (hasDeliveryInfo) {
        addCategorySection('Delivery', [
            { label: 'Estimated Delivery', getValue: (p) => getDeliveryInfo(p) },
            { label: 'Delivery Type', getValue: (p) => getDeliveryType(p) }
        ]);
    }

    // Add Specifications sections - prioritize grouped specifications from API
    if (hasGroupedSpecs) {
        // Track which attributes are already covered by grouped specifications
        const coveredAttributes = new Set();

        // Display each specification group as a separate section
        const specGroups = new Map();

        // Collect all specification groups from all products
        productDetails.forEach(p => {
            if (p.specifications && Array.isArray(p.specifications)) {
                p.specifications.forEach(spec => {
                    if (spec.title && spec.rows && Array.isArray(spec.rows)) {
                        // Skip warranty-related specification groups
                        const lowerTitle = spec.title.toLowerCase();
                        if (lowerTitle.includes('warranty')) {
                            return; // Skip warranty groups
                        }

                        if (!specGroups.has(spec.title)) {
                            specGroups.set(spec.title, new Set());
                        }

                        // Collect all row labels from this group
                        spec.rows.forEach(row => {
                            const rowLabel = row.label || '';
                            // Skip warranty-related rows
                            const lowerRowLabel = rowLabel.toLowerCase();
                            if (!lowerRowLabel.includes('warranty') && rowLabel) {
                                specGroups.get(spec.title).add(rowLabel);
                                // Mark this attribute as covered
                                coveredAttributes.add(rowLabel.toLowerCase());
                            }
                        });
                    }
                });
            }
        });

        // Display each specification group
        specGroups.forEach((rowLabels, groupTitle) => {
            if (rowLabels.size > 0) {
                const groupFields = Array.from(rowLabels).map(rowLabel => ({
                    label: rowLabel,
                    getValue: (p) => {
                        if (p.specifications && Array.isArray(p.specifications)) {
                            const group = p.specifications.find(s => s.title === groupTitle);
                            if (group && group.rows && Array.isArray(group.rows)) {
                                const row = group.rows.find(r => r.label === rowLabel);
                                if (row) {
                                    return row.value || row.display_value || row.text || 'N/A';
                                }
                            }
                        }
                        return 'N/A';
                    }
                }));

                if (groupFields.length > 0) {
                    addCategorySection(groupTitle, groupFields);
                }
            }
        });
    }

    // Add any remaining simple_attributes or simple_attribute_values that weren't covered by grouped specs
    // Only add them if they're not already displayed in grouped specifications
    const hasSimpleAttributes = productDetails.some(p =>
        (p.simple_attributes && p.simple_attributes.length > 0) ||
        (p.simple_attribute_values && p.simple_attribute_values.length > 0)
    );

    if (hasSimpleAttributes && !hasGroupedSpecs) {
        // Only show simple attributes if there are no grouped specifications
        // (to avoid duplication)
        const remainingAttributes = new Map();

        productDetails.forEach(product => {
            // Check simple_attributes
            if (product.simple_attributes && Array.isArray(product.simple_attributes)) {
                product.simple_attributes.forEach(attr => {
                    const attrName = attr.name || attr.attribute_name || '';
                    if (attrName && !coveredAttributes.has(attrName.toLowerCase())) {
                        remainingAttributes.set(attrName, {
                            name: attrName,
                            source: 'simple_attributes'
                        });
                    }
                });
            }

            // Check simple_attribute_values
            if (product.simple_attribute_values && Array.isArray(product.simple_attribute_values)) {
                product.simple_attribute_values.forEach(attr => {
                    const attrName = attr.attribute?.name || attr.attribute_name || '';
                    if (attrName && !coveredAttributes.has(attrName.toLowerCase())) {
                        remainingAttributes.set(attrName, {
                            name: attrName,
                            source: 'simple_attribute_values'
                        });
                    }
                });
            }
        });

        // Group remaining attributes by category
        const remainingCategories = new Map();
        remainingAttributes.forEach((attr, attrName) => {
            const lowerName = attrName.toLowerCase();
            let category = 'Specifications';

            // Categorize based on attribute name
            if (lowerName.includes('ram') || lowerName.includes('storage') || lowerName.includes('memory') ||
                lowerName.includes('rom') || lowerName.includes('display') || lowerName.includes('screen') ||
                lowerName.includes('camera') || lowerName.includes('battery') || lowerName.includes('processor') ||
                lowerName.includes('cpu') || lowerName.includes('chipset')) {
                category = 'Technical Specifications';
            } else if (lowerName.includes('sim') || lowerName.includes('network') || lowerName.includes('connectivity') ||
                lowerName.includes('wifi') || lowerName.includes('bluetooth') || lowerName.includes('gps')) {
                category = 'Connectivity';
            } else if (lowerName.includes('dimension') || lowerName.includes('weight') || lowerName.includes('size')) {
                category = 'Physical Specifications';
            } else {
                category = 'General Specifications';
            }

            if (!remainingCategories.has(category)) {
                remainingCategories.set(category, []);
            }
            remainingCategories.get(category).push(attrName);
        });

        // Display remaining attributes grouped by category
        remainingCategories.forEach((attributes, categoryName) => {
            if (attributes.length > 0) {
                const fields = attributes.map(attrName => ({
                    label: attrName,
                    getValue: (p) => getSpecValue(p, attrName)
                }));
                addCategorySection(categoryName, fields);
            }
        });
    }
}

// Helper functions to extract product details
function getSeller(product) {
    if (product.seller && product.seller.name) {
        return product.seller.name;
    }
    if (product.seller_name) {
        return product.seller_name;
    }
    if (product.seller && typeof product.seller === 'string') {
        return product.seller;
    }
    return 'N/A';
}

function getVariants(product) {
    if (product.variations && product.variations.length > 0) {
        const variantNames = product.variations
            .map(v => v.name || v.value || v.display_value)
            .filter(v => v);
        return variantNames.length > 0 ? variantNames.join(', ') : 'N/A';
    }
    if (product.variants && product.variants.length > 0) {
        const variantNames = product.variants
            .map(v => v.name || v.value || v.display_value)
            .filter(v => v);
        return variantNames.length > 0 ? variantNames.join(', ') : 'N/A';
    }
    return 'N/A';
}

// Get reviews count from product data
function getReviewsCount(product) {
    // Try multiple possible field names
    if (product.reviews_count !== undefined && product.reviews_count !== null) {
        return parseInt(product.reviews_count, 10);
    }
    if (product.review_count !== undefined && product.review_count !== null) {
        return parseInt(product.review_count, 10);
    }
    if (product.rating_count !== undefined && product.rating_count !== null) {
        return parseInt(product.rating_count, 10);
    }
    if (product.total_reviews !== undefined && product.total_reviews !== null) {
        return parseInt(product.total_reviews, 10);
    }
    // Check if reviews array exists
    if (product.reviews && Array.isArray(product.reviews)) {
        return product.reviews.length;
    }
    return 0;
}

// Get highlights from product
function getHighlights(product) {
    let highlights = [];

    // First, try to get highlights directly from API response
    if (product.highlights) {
        if (Array.isArray(product.highlights) && product.highlights.length > 0) {
            // Extract text from array of objects: [{text: "..."}, {text: "..."}]
            highlights = product.highlights.map(h => {
                // If it's an object with text property, extract the text
                if (h && typeof h === 'object' && h.text) {
                    return h.text;
                }
                // If it's already a string, use it directly
                if (typeof h === 'string') {
                    return h;
                }
                return '';
            }).filter(h => h && h.trim && h.trim().length > 0);
        } else if (typeof product.highlights === 'string') {
            // If highlights is a string, try to parse it as JSON or split by newlines
            try {
                const parsed = JSON.parse(product.highlights);
                highlights = Array.isArray(parsed) ? parsed : [product.highlights];
            } catch (e) {
                highlights = product.highlights.split('\n').filter(h => h.trim());
            }
        }
    }

    // If no highlights found, try to get from attributes
    if (highlights.length === 0) {
        highlights = getHighlightsFromAttributes(product);
    }

    return highlights.length > 0 ? highlights.join(', ') : 'N/A';
}

// Get highlights from product attributes (fallback)
function getHighlightsFromAttributes(product) {
    const highlights = [];

    if (product.simple_attribute_values && Array.isArray(product.simple_attribute_values)) {
        // Get key attributes as highlights
        const keyAttributes = ['storage', 'display', 'camera', 'processor', 'ram', 'battery'];

        keyAttributes.forEach(keyAttr => {
            const attr = product.simple_attribute_values.find(a => {
                const attrSlug = a.attribute?.slug?.toLowerCase() || '';
                const attrName = (a.attribute?.name || a.attribute_name || '').toLowerCase();
                return attrSlug.includes(keyAttr) || attrName.includes(keyAttr);
            });

            if (attr) {
                const value = attr.display_value || attr.value || attr.attribute_value;
                if (value) {
                    highlights.push(value);
                }
            }
        });
    }

    // Also check simple_attributes
    if (product.simple_attributes && Array.isArray(product.simple_attributes)) {
        const keyAttributes = ['storage', 'display', 'camera', 'processor', 'ram', 'battery'];

        keyAttributes.forEach(keyAttr => {
            const attr = product.simple_attributes.find(a => {
                const attrName = (a.name || a.attribute_name || '').toLowerCase();
                return attrName.includes(keyAttr);
            });

            if (attr) {
                const value = attr.value || attr.attribute_value;
                if (value) {
                    highlights.push(value);
                }
            }
        });
    }

    return highlights;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Get color with image from linked_variations
function getColorWithImage(product) {
    // Check if product has linked_variations
    if (!product.linked_variations || !Array.isArray(product.linked_variations) || product.linked_variations.length === 0) {
        return null;
    }

    // Use the first variation (as per user's example structure)
    const variation = product.linked_variations[0];

    if (!variation) {
        return null;
    }

    // Get image URL from the API - this is the primary requirement
    // Try multiple possible field names to ensure we get the image
    const imageUrl = variation.image_url || variation.image || variation.imageUrl ||
        (variation.images && variation.images[0] && (variation.images[0].url || variation.images[0].image_url)) ||
        null;

    // Get color name from values array - this will be shown on hover
    let colorName = 'Color';
    if (variation.values && Array.isArray(variation.values) && variation.values.length > 0) {
        const firstValue = variation.values[0];
        // Get the color name (e.g., "Lily White")
        colorName = firstValue.value || firstValue.display_value || firstValue.name || 'Color';
    }

    // Escape color name for safe HTML insertion
    const escapedColorName = escapeHtml(colorName);
    const escapedImageUrl = escapeHtml(imageUrl || '');

    // ALWAYS return HTML with image box if image URL exists from API
    if (imageUrl && imageUrl.trim() !== '') {
        const html = `<div class="color-variation-box" title="${escapedColorName}">
            <img src="${escapedImageUrl}" alt="${escapedColorName}" class="color-variation-image" onerror="this.style.display='none'; this.parentElement.textContent='${escapedColorName}'">
        </div>`;
        return html;
    }

    // If no image URL but we have color name, return just the name as fallback
    if (colorName && colorName !== 'Color' && colorName !== 'N/A') {
        return escapeHtml(colorName);
    }

    return null;
}

function getSpecValue(product, specName) {
    const lowerSpecName = specName.toLowerCase();
    const isColorAttribute = lowerSpecName.includes('color') || lowerSpecName === 'color' || lowerSpecName.includes('colour');

    // For Color attributes, ALWAYS prioritize linked_variations FIRST before checking anything else
    if (isColorAttribute) {
        // First check if product has linked_variations
        if (product.linked_variations && Array.isArray(product.linked_variations) && product.linked_variations.length > 0) {
            const colorWithImage = getColorWithImage(product);
            if (colorWithImage) {
                // Always return the HTML (which includes the image box with image URL from API)
                // This will display the image from linked_variations[0].image_url
                return colorWithImage;
            }
        }
        // If no linked_variations or no image, fall through to check other sources
    }

    // Try simple_attributes
    if (product.simple_attributes && Array.isArray(product.simple_attributes)) {
        const attr = product.simple_attributes.find(a => {
            const attrName = (a.name || a.attribute_name || '').toLowerCase();
            return attrName === specName.toLowerCase() || attrName.includes(specName.toLowerCase());
        });
        if (attr) {
            // For color, we already checked linked_variations above, so just return the text value
            return attr.value || attr.attribute_value || attr.display_value || 'N/A';
        }
    }

    // Try simple_attribute_values
    if (product.simple_attribute_values && Array.isArray(product.simple_attribute_values)) {
        const attr = product.simple_attribute_values.find(a => {
            const attrName = (a.attribute?.name || a.attribute_name || '').toLowerCase();
            return attrName === specName.toLowerCase() || attrName.includes(specName.toLowerCase());
        });
        if (attr) {
            // For color, we already checked linked_variations above, so just return the text value
            return attr.display_value || attr.value || attr.attribute_value || 'N/A';
        }
    }

    // Try grouped specifications (prioritize this for grouped specs)
    if (product.specifications && Array.isArray(product.specifications)) {
        for (const section of product.specifications) {
            if (section.rows && Array.isArray(section.rows)) {
                const row = section.rows.find(r => {
                    const rowLabel = (r.label || '').toLowerCase();
                    return rowLabel === specName.toLowerCase() || rowLabel.includes(specName.toLowerCase());
                });
                if (row) {
                    // For color, we already checked linked_variations above, so just return the text value
                    return row.value || row.display_value || row.text || row.content || 'N/A';
                }
            }
        }
    }

    // Try flat specifications object
    if (product.specifications && typeof product.specifications === 'object' && !Array.isArray(product.specifications)) {
        const value = product.specifications[specName];
        if (value) return value;
    }

    return 'N/A';
}

// Display product header in table
function displayProductHeader(index, product) {
    const productCol = document.getElementById(`productCol${index}`);
    if (!productCol) return;

    // Create product header HTML
    const headerHTML = `
        <button class="compare-remove-btn" data-product-id="${product.id}">
            <i class="fas fa-times"></i>
        </button>
        <div class="compare-product-image">
            <img src="${getProductImage(product)}" alt="${product.name || 'Product'}" onerror="this.src='/images/placeholder.png'">
        </div>
        <h3 class="compare-product-name">${product.name || 'Product'}</h3>
        <div class="compare-product-rating">${generateRatingHTML(product)}</div>
        <div class="compare-product-price">${generatePriceHTML(product)}</div>
        <a href="/product.html?slug=${product.slug}" class="compare-product-link">View Details</a>
    `;

    const headerDiv = document.getElementById(`productHeader${index}`);
    if (headerDiv) {
        headerDiv.innerHTML = headerHTML;
        headerDiv.className = 'compare-product-header';
    } else {
        // Create header div if it doesn't exist
        const newHeader = document.createElement('div');
        newHeader.id = `productHeader${index}`;
        newHeader.className = 'compare-product-header';
        newHeader.innerHTML = headerHTML;
        productCol.innerHTML = '';
        productCol.appendChild(newHeader);
    }

    // Setup remove button
    const removeBtn = productCol.querySelector('.compare-remove-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            removeProduct(product.id);
        });
    }
}

// Get product image URL
function getProductImage(product) {
    if (product.image_url) return product.image_url;
    if (product.gallery_images && product.gallery_images.length > 0) {
        return product.gallery_images[0].image_url || product.gallery_images[0];
    }
    if (product.images && product.images.length > 0) {
        return product.images[0].url || product.images[0].image_url || product.images[0];
    }
    if (product.image) return product.image;
    return '/images/placeholder.png';
}

// Generate rating HTML
function generateRatingHTML(product) {
    if (product.rating) {
        return generateStars(product.rating) + ` <span>${product.rating}</span>`;
    }
    return '<span>Not rated</span>';
}

// Generate price HTML
function generatePriceHTML(product) {
    const currentPrice = product.price || 0;
    const originalPrice = product.original_price || product.originalPrice || 0;

    if (originalPrice > currentPrice) {
        const discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
        return `
            <span class="price-current">${formatPrice(currentPrice)}</span>
            <span class="price-original">${formatPrice(originalPrice)}</span>
            <span class="discount-badge">${discount}% off</span>
        `;
    }
    return `<span class="price-current">${formatPrice(currentPrice)}</span>`;
}

// Add a row to compare table
function addCompareRow(feature, values) {
    const tableBody = document.getElementById('compareTableBody');
    if (!tableBody) return;

    const row = document.createElement('tr');
    row.className = 'compare-row';

    // Feature column
    const featureCell = document.createElement('td');
    featureCell.className = 'compare-feature-col';
    featureCell.textContent = feature;
    row.appendChild(featureCell);

    // Value columns
    for (let i = 0; i < MAX_COMPARE_PRODUCTS; i++) {
        const valueCell = document.createElement('td');
        valueCell.className = 'compare-product-col';

        if (i < values.length) {
            valueCell.innerHTML = values[i];
        } else {
            valueCell.innerHTML = '-';
        }

        row.appendChild(valueCell);
    }

    tableBody.appendChild(row);
}

// Setup remove buttons
function setupRemoveButtons() {
    const removeButtons = document.querySelectorAll('.compare-remove-btn');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(btn.dataset.productId);
            removeProduct(productId);
        });
    });
}

// Remove product from compare
function removeProduct(productId) {
    const updated = compareProducts.filter(p => p.id !== productId);
    saveCompareList(updated);

    // Reload page to refresh display
    location.reload();
}

// Show empty state
function showEmptyState() {
    const compareEmpty = document.getElementById('compareEmpty');
    const compareContent = document.getElementById('compareContent');

    if (compareEmpty) compareEmpty.style.display = 'block';
    if (compareContent) compareContent.style.display = 'none';
}

// Clear all products
function clearAll() {
    if (confirm('Clear all products from compare list?')) {
        saveCompareList([]);
        showEmptyState();
    }
}

// Format price
function formatPrice(price) {
    return `₹${parseInt(price).toLocaleString('en-IN')}`;
}

// Generate stars HTML
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

// Get bank offers from product
function getBankOffers(product) {
    if (!product.bank_offers || !Array.isArray(product.bank_offers) || product.bank_offers.length === 0) {
        return 'N/A';
    }

    const offers = product.bank_offers.map(offer => {
        let offerText = '';

        if (offer.bank_name) {
            offerText += `${offer.bank_name}: `;
        }

        // Use formatted_offer if available, otherwise build from offer details
        if (offer.formatted_offer) {
            offerText += offer.formatted_offer;
        } else if (offer.offer_title) {
            offerText += offer.offer_title;
            if (offer.offer_description) {
                offerText += ` ${offer.offer_description}`;
            }
        } else if (offer.offer_description) {
            offerText += offer.offer_description;
        }

        // Add discount info if available
        if (offer.discount_percentage) {
            offerText += ` ${offer.discount_percentage}% off`;
            if (offer.max_discount_amount) {
                offerText += ` up to ₹${parseFloat(offer.max_discount_amount).toFixed(2)}`;
            }
        }

        // Add min order amount if available
        if (offer.min_order_amount) {
            offerText += `. Min Order Value ₹${parseFloat(offer.min_order_amount).toFixed(2)}`;
        }

        return offerText;
    });

    return offers.length > 0 ? offers.join('<br>') : 'N/A';
}

// Get delivery information from product
function getDeliveryInfo(product) {
    // Check if product has delivery information
    if (product.delivery_info) {
        return product.delivery_info;
    }
    if (product.estimated_delivery) {
        return product.estimated_delivery;
    }
    if (product.shipping_info) {
        return product.shipping_info;
    }
    if (product.delivery_date) {
        return product.delivery_date;
    }

    // Check if delivery info is in attributes
    const deliveryAttr = getSpecValue(product, 'Delivery') || getSpecValue(product, 'Estimated Delivery');
    if (deliveryAttr && deliveryAttr !== 'N/A') {
        return deliveryAttr;
    }

    // Calculate default delivery date (3 days from today)
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 3);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const day = deliveryDate.getDate();
    const month = months[deliveryDate.getMonth()];
    const dayName = days[deliveryDate.getDay()];

    return `Estimated delivery on ${day} ${month}, ${dayName}`;
}

// Get delivery type from product
function getDeliveryType(product) {
    if (product.delivery_type) {
        return product.delivery_type;
    }
    if (product.shipping_type) {
        return product.shipping_type;
    }
    if (product.free_delivery) {
        return 'Free Delivery';
    }
    const deliveryTypeAttr = getSpecValue(product, 'Delivery Type') || getSpecValue(product, 'Shipping Type');
    if (deliveryTypeAttr && deliveryTypeAttr !== 'N/A') {
        return deliveryTypeAttr;
    }
    return 'Standard Delivery';
}

// Get payment options from product
function getPaymentOptions(product) {
    let paymentOptions = [];

    // Try to get payment options from API response
    const apiPaymentOptions = product.easy_payment_options || product.payment_options;

    if (apiPaymentOptions && Array.isArray(apiPaymentOptions) && apiPaymentOptions.length > 0) {
        paymentOptions = apiPaymentOptions.map(opt => {
            if (typeof opt === 'object' && opt.text) {
                return opt.text;
            } else if (typeof opt === 'string') {
                return opt;
            }
            return String(opt);
        }).filter(opt => opt);
    } else if (apiPaymentOptions && typeof apiPaymentOptions === 'string') {
        try {
            const parsed = JSON.parse(apiPaymentOptions);
            if (Array.isArray(parsed)) {
                paymentOptions = parsed.map(opt => {
                    if (opt && typeof opt === 'object' && opt.text) {
                        return opt.text;
                    }
                    return typeof opt === 'string' ? opt : String(opt);
                }).filter(opt => opt && opt.trim && opt.trim().length > 0);
            } else {
                paymentOptions = [apiPaymentOptions];
            }
        } catch (e) {
            paymentOptions = apiPaymentOptions.split('\n').filter(p => p.trim());
        }
    } else {
        // Default payment options
        paymentOptions = [
            'Cash on Delivery',
            'Net banking & Credit/ Debit/ ATM card',
            'UPI'
        ];
    }

    return paymentOptions.length > 0 ? paymentOptions.join(', ') : 'N/A';
}

// Get EMI information from product
function getEMIInfo(product) {
    const price = parseFloat(product.price) || 0;
    if (price > 0) {
        const monthlyEMI = Math.round(price / 12);
        return `EMI starting from ${formatPrice(monthlyEMI)}/month`;
    }

    // Check if EMI info is in payment options
    const paymentOptions = product.easy_payment_options || product.payment_options;
    if (paymentOptions) {
        if (Array.isArray(paymentOptions)) {
            const emiOption = paymentOptions.find(opt => {
                const optText = typeof opt === 'object' ? opt.text : opt;
                return optText && optText.toLowerCase().includes('emi');
            });
            if (emiOption) {
                return typeof emiOption === 'object' ? emiOption.text : emiOption;
            }
        } else if (typeof paymentOptions === 'string') {
            if (paymentOptions.toLowerCase().includes('emi')) {
                return paymentOptions;
            }
        }
    }

    return price > 0 ? `EMI available from ${formatPrice(Math.round(price / 12))}/month` : 'N/A';
}

// Show notification with auto-dismiss
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 120px;
        right: 20px;
        background: ${type === 'error' ? '#ff6161' : type === 'info' ? '#2874f0' : '#388e3c'};
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10001;
        animation: slideIn 0.3s ease-out;
        min-width: 200px;
    `;

    // Add animation if not already added
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
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

// Setup event listeners
document.addEventListener('DOMContentLoaded', () => {
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAll);
    }
});
