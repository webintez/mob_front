# Graph Report - mobitez_frontend  (2026-09-19)

## Corpus Check
- Large corpus: 142 files · ~1,661,179 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 843 nodes · 1543 edges · 71 communities (58 shown, 13 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 56
- Community 57
- Community 58
- Community 62
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69

## God Nodes (most connected - your core abstractions)
1. `showNotification()` - 20 edges
2. `displayProduct()` - 19 edges
3. `setupEventListeners()` - 18 edges
4. `loadProduct()` - 15 edges
5. `displayOrder()` - 14 edges
6. `showNotification()` - 14 edges
7. `displayCompareTable()` - 13 edges
8. `initApp()` - 12 edges
9. `makeApiCall()` - 12 edges
10. `makeApiCall()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `setupEventListeners()` --indirect_call--> `addToCart()`  [INFERRED]
  js/product.js → js/product.js  _Bridges community 6 → community 33_
- `setupEventListeners()` --indirect_call--> `toggleWishlist()`  [INFERRED]
  js/product.js → js/product.js  _Bridges community 6 → community 39_
- `initProductPage()` --calls--> `forceMobileLayout()`  [EXTRACTED]
  js/product.js → js/product.js  _Bridges community 13 → community 20_
- `initProductPage()` --calls--> `getProductSlugFromURL()`  [EXTRACTED]
  js/product.js → js/product.js  _Bridges community 13 → community 27_
- `initProductPage()` --calls--> `setupEventListeners()`  [EXTRACTED]
  js/product.js → js/product.js  _Bridges community 13 → community 6_

## Import Cycles
- None detected.

## Communities (71 total, 13 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (64): addToCart(), addToCartAndRedirect(), animateProductPrice(), API_CONFIG, brands, buildCategoryBreadcrumb(), categories, categoryIcons (+56 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (63): addressList, allowedSections, applyActiveSection(), capitalize(), checkDeletionRequestStatus(), clearPanForm(), createAddressCardMarkup(), createReviewCard() (+55 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (42): addCategorySection(), addCompareRow(), addProductToCompare(), allProducts, brands, clearAll(), compareProducts, displayCompareTable() (+34 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (37): cancelOrder(), displayDeliveryDetails(), displayDeliveryExecutiveNote(), displayDeliveryOTP(), displayOrder(), displayOrderActions(), displayOrderItems(), displayOrderNumber() (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (34): allBoughtTogetherProducts, API_CONFIG, boughtTogetherCategories, closeTermsConditionsModal(), closeWarrantyModal(), createReviewItem(), createTermsConditionsModal(), createWarrantyModal() (+26 more)

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (20): createOrderCard(), currentFilters, displayOrders(), escapeHtml(), getOrderStatus(), getPaymentStatus(), getStatusMessage(), highlightStars() (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (23): calculateDeliveryDate(), calculateInstallationDate(), checkDelivery(), checkIfUserOrderedProduct(), copyToClipboardFallback(), createReviewModal(), fallbackCopyTextToClipboard(), handleImageZoom() (+15 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (20): API_CONFIG, createProductCard(), displayNoResults(), displayPagination(), displayProducts(), escapeHtml(), formatPrice(), fuzzyMatch() (+12 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (22): dotenv, express, get-image-colors, nodemon, outline-image, author, dependencies, dotenv (+14 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (16): checkDeliveryTime(), createCartItemElement(), displayCartItems(), formatPrice(), getProductSpecs(), loadCart(), loadRecentlyViewed(), processingProducts (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.20
Nodes (17): buildOrderData(), confirmAddress(), copyDeliveryToBilling(), createOrderItemElement(), displayOrderItems(), formatPrice(), handlePlaceOrder(), loadCart() (+9 more)

### Community 11 - "Community 11"
Cohesion: 0.24
Nodes (17): applyFilters(), buildTreeFromFlat(), clearAllFilters(), displayFilteredProducts(), flattenCategoryTree(), getMakeApiCallFunc(), handleBrandSearch(), handleFilterChange() (+9 more)

### Community 12 - "Community 12"
Cohesion: 0.16
Nodes (10): AUTH_CONFIG, clearAuth(), getAuthHeaders(), getAuthToken(), getAuthUser(), isAuthenticated(), logout(), setAuth() (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (18): checkWishlistStatus(), createQAItem(), displayQuestionsAndAnswers(), displaySimilarProducts(), flattenCategoryTree(), hideLoading(), initProductPage(), loadCategories() (+10 more)

### Community 14 - "Community 14"
Cohesion: 0.26
Nodes (14): applyStyles(), decodeHTML(), displayPage(), displaySectionGroup(), escapeHtml(), extractBodyContent(), extractStyles(), getPageSlugFromURL() (+6 more)

### Community 15 - "Community 15"
Cohesion: 0.29
Nodes (14): clearAllFilters(), displayBrandsForFilter(), escapeHtml(), getMakeApiCallFunc(), handleBrandSearch(), handleFilterChange(), handlePriceChange(), handlePriceRangeChange() (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.32
Nodes (13): apiCall(), createShopAllHeader(), createSubcategoryItem(), createSubListItem(), getCategoryUrl(), getIconClass(), init(), loadCategories() (+5 more)

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (12): createCategoryDropdown(), getApiConfig(), getCategoryIcon(), initCategoryNav(), isHomepagePage(), loadBrands(), loadCategoryNavigationCommon(), loadSubcategories() (+4 more)

### Community 18 - "Community 18"
Cohesion: 0.31
Nodes (12): collapseStep1(), escapeHtml(), formatPrice(), handleFileSelect(), loadProductDetails(), loadSavedAddresses(), setupEventListeners(), setupFileUploadZone() (+4 more)

### Community 19 - "Community 19"
Cohesion: 0.19
Nodes (14): animateProductDetailsPrice(), step(), createBuyTogetherProductItem(), createProductCard(), displayBuyTogetherSection(), displayCategoryTabs(), displayFrequentlyBoughtWithCategories(), filterBoughtTogetherProducts() (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.21
Nodes (14): applyCollapseToggle(), buildCategoryBreadcrumb(), displayGroupedSpecifications(), displayLongDescription(), displayProduct(), displaySpecifications(), displaySpecificationsInDetails(), ensureStickyParentContainers() (+6 more)

### Community 21 - "Community 21"
Cohesion: 0.26
Nodes (11): API_CONFIG, displayItemDetails(), formatPrice(), handleCancelOrder(), loadOrderDetails(), positionDropdown(), setupFormHandlers(), setupLoginDropdown() (+3 more)

### Community 22 - "Community 22"
Cohesion: 0.29
Nodes (10): buildHeaderMenuItems(), closeMobileMenu(), createMobileNavMenu(), escapeHtml(), initMobileMenu(), loadMobileMenuItems(), openMobileMenu(), setupMobileMenuExpandables() (+2 more)

### Community 23 - "Community 23"
Cohesion: 0.35
Nodes (12): handleScroll(), initHeaderResizeObserver(), isKeyboardOpen(), isMobileViewport(), moveCategoriesNavOnMobile(), onScroll(), NOTE: category item padding/gap is now controlled purely by CSS., IMPORTANT: isKeyboardOpen() must be defined BEFORE scroll/resize listeners (+4 more)

### Community 24 - "Community 24"
Cohesion: 0.26
Nodes (9): createCategoryCard(), displayPagination(), getMakeApiCall(), loadCategoriesDisplay(), loadCategoryNavigation(), loadCategoryProductsDirect(), setupLoginDropdown(), setupMoreDropdown() (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.26
Nodes (9): addToCartFromWishlist(), createWishlistItemElement(), displayWishlistItems(), formatPrice(), loadWishlist(), removeFromWishlist(), setupLoginDropdown(), showNotification() (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.17
Nodes (8): API_CONFIG, app, categoriesCache, express, fs, http, https, path

### Community 27 - "Community 27"
Cohesion: 0.27
Nodes (11): autoSelectVariationsFromProduct(), displayVariationAttributes(), createVariationDetailRow(), createVariationItem(), findMatchingVariationProduct(), findVariationProductByAttributeValue(), getColorValue(), getProductSlugFromURL() (+3 more)

### Community 28 - "Community 28"
Cohesion: 0.33
Nodes (8): allFlashSaleProducts, displayPagination(), escapeHtml(), fetchAllProductsForCategory(), loadFlashSaleProducts(), setupFlashSalePageTimer(), showNoFlashSalesMessage(), updateResultsCount()

### Community 29 - "Community 29"
Cohesion: 0.40
Nodes (9): formatPrice(), handleOrderPlacement(), initFallbackCart(), onOrderSuccess(), openRazorpayCheckout(), populatePriceSummary(), setupMethodSwitching(), setupPaymentButtons() (+1 more)

### Community 30 - "Community 30"
Cohesion: 0.31
Nodes (8): escapeHtmlCommon(), handleSearchCommon(), highlightMatch(), initSearch(), loadSearchSuggestionsCommon(), processAndRenderSuggestions(), SEARCH_API_CONFIG, suggestionState

### Community 31 - "Community 31"
Cohesion: 0.38
Nodes (9): displayFilteredProducts(), displayFlatTags(), displayPagination(), displayTagGroups(), loadTagProducts(), loadTagsDisplay(), makeApiCall(), updateDynamicMetaTags() (+1 more)

### Community 32 - "Community 32"
Cohesion: 0.33
Nodes (5): clearOTPInputs(), showError(), showOTPSection(), startTimers(), updateCountdown()

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (8): addToCart(), buyNow(), handleStockStatus(), makeButtonsStickyOnMobile(), setupFlashSaleTimerUI(), setupProductPageFlashSaleTimer(), updateDigit(), updateTimer()

### Community 34 - "Community 34"
Cohesion: 0.33
Nodes (5): clearOTPInputs(), showError(), showOTPSection(), startTimers(), updateCountdown()

### Community 35 - "Community 35"
Cohesion: 0.43
Nodes (7): BLOG_API, fetchBlogs(), fetchCategories(), renderBlogs(), renderCategories(), renderPagination(), stripHtml()

### Community 36 - "Community 36"
Cohesion: 0.46
Nodes (7): displayBrandProducts(), displayBrandsList(), displayPagination(), loadBrandProducts(), loadBrandsDisplay(), makeApiCall(), updateResultsCount()

### Community 37 - "Community 37"
Cohesion: 0.46
Nodes (7): fetchMobileCategories(), initSimpleSlider(), renderBanner(), renderCategoryGrid(), renderHeroSlider(), renderSecondaryMenuGrid(), renderSection()

### Community 38 - "Community 38"
Cohesion: 0.39
Nodes (8): addToCompare(), getCompareList(), handleCompare(), initCompareCheckbox(), isInCompareList(), removeFromCompare(), saveCompareList(), updateCompareBar()

### Community 39 - "Community 39"
Cohesion: 0.36
Nodes (8): createMobileBannerSlider(), displayProductImages(), goToSlide(), nextSlide(), previousSlide(), selectImage(), toggleWishlist(), updateMobileWishlistButton()

### Community 40 - "Community 40"
Cohesion: 0.52
Nodes (6): attachAccordion(), attachSearch(), escapeHtml(), initFaq(), renderEmpty(), renderFaqs()

### Community 41 - "Community 41"
Cohesion: 0.48
Nodes (6): closeVideoModal(), fetchVideos(), openVideoModal(), renderVideoCards(), renderVideosSection(), VIDEO_API

### Community 42 - "Community 42"
Cohesion: 0.47
Nodes (5): BLOG_API, fetchBlogDetail(), fetchRecentPosts(), renderBlogDetail(), renderRecentPosts()

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (5): displayGroup(), getSlugFromURL(), initGroupPage(), loadGroupContent(), showError()

### Community 44 - "Community 44"
Cohesion: 0.60
Nodes (5): fetchCategoryTree(), initCategoryMenu(), renderCategoryItem(), renderStaticList(), sortCategoryTree()

### Community 45 - "Community 45"
Cohesion: 0.60
Nodes (5): fetchSeoContent(), fetchSeoDirectoryData(), flattenCategoryTreeUpToLevel(), renderFallbackSeoContent(), renderSeoFooter()

### Community 46 - "Community 46"
Cohesion: 0.40
Nodes (3): DIRECTORIES, fs, path

### Community 47 - "Community 47"
Cohesion: 0.70
Nodes (4): clearErrors(), handleSubmit(), showFeedback(), showFieldErrors()

### Community 48 - "Community 48"
Cohesion: 0.60
Nodes (3): getRecentlyViewedProducts(), getRecentlyViewedProductsLimited(), trackProductView()

### Community 49 - "Community 49"
Cohesion: 0.83
Nodes (3): add_url(), extract_slugs(), generate_sitemap.sh script

## Knowledge Gaps
- **76 isolated node(s):** `fs`, `path`, `DIRECTORIES`, `install-node.sh script`, `API_CONFIG` (+71 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `setupProductPageFlashSaleTimer()` connect `Community 33` to `Community 4`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `setupEventListeners()` (e.g. with `addToCart()` and `buyNow()`) actually correct?**
  _`setupEventListeners()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `fs`, `path`, `DIRECTORIES` to the rest of the system?**
  _76 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05962732919254658 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07019230769230769 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.10188261351052048 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1141025641025641 - nodes in this community are weakly interconnected._