/**
 * All Categories Page JavaScript
 * Implements the Flipkart-style mobile category explorer
 */

(function() {
    'use strict';

    // State
    let categoryTree = [];
    let activeRootId = null;

    // API Config
    const API_CONFIG = window.API_CONFIG || {
        baseUrl: '/api',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };

    // Helper: Make API Call
    async function apiCall(endpoint) {
        if (window.makeApiCall) return window.makeApiCall(endpoint);
        
        const url = `${API_CONFIG.baseUrl}${endpoint}`;
        const response = await fetch(url, { headers: API_CONFIG.headers });
        if (!response.ok) throw new Error('API request failed');
        return response.json();
    }

    // Initialize
    async function init() {
        try {
            await loadCategories();
        } catch (error) {
            console.error('All Categories Init Error:', error);
            renderError('Unable to load categories. Please try again.');
        }
    }

    // Fetch and process category data
    async function loadCategories() {
        const CACHE_KEY = 'mobitez_categories_tree';
        const CACHE_TIME_KEY = 'mobitez_categories_tree_time';
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

        let loadedFromCache = false;

        // Try Cache First
        try {
            const cachedData = localStorage.getItem(CACHE_KEY);
            const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
            const now = Date.now();

            if (cachedData && cachedTime && (now - parseInt(cachedTime, 10) < CACHE_DURATION)) {
                const parsed = JSON.parse(cachedData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    categoryTree = parsed;
                    loadedFromCache = true;
                    console.log('Categories loaded from cache');
                }
            }
        } catch (cacheError) {
            console.warn('Categories cache read error:', cacheError);
        }

        if (!loadedFromCache) {
            // Fetch full tree to access L2 subcategories for layout rendering
            try {
                const indexResult = await apiCall('/categories/index');
                if (indexResult && indexResult.success && indexResult.data && indexResult.data.tree) {
                    categoryTree = indexResult.data.tree;
                    
                    // Save to Cache
                    try {
                        localStorage.setItem(CACHE_KEY, JSON.stringify(categoryTree));
                        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
                    } catch (cacheWriteError) {
                        console.warn('Categories cache write error:', cacheWriteError);
                    }
                } else {
                    renderError('Invalid category structure received.');
                    return;
                }
            } catch (error) {
                console.error('Failed to load categories:', error);
                renderError('Unable to load categories. Please try again.');
                return;
            }
        }

        if (categoryTree && categoryTree.length > 0) {
            renderSidebar();
            
            // Activate first category by default
            const firstCategory = categoryTree[0];
            if (firstCategory) {
                activeRootId = firstCategory.id;
                markSidebarActive(activeRootId);
                renderContent(firstCategory);
            }
        } else {
            renderError('No categories found.');
        }
    }

    // Render Left Sidebar (L0)
    function renderSidebar() {
        const sidebar = document.getElementById('categoriesSidebar');
        if (!sidebar) return;

        sidebar.innerHTML = '';
        
        categoryTree.forEach(category => {
            const item = document.createElement('div');
            item.className = 'sidebar-item';
            item.dataset.id = category.id;
            
            const iconClass = getIconClass(category);
            const imageUrl = category.image_url;

            item.innerHTML = `
                <div class="sidebar-icon-wrapper">
                    ${imageUrl ? `
                        <img src="${imageUrl}" alt="${category.name}" class="sidebar-icon-image" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <i class="${iconClass} sidebar-icon-fallback" style="display: none;"></i>
                    ` : `<i class="${iconClass} sidebar-icon-fallback"></i>`}
                </div>
                <div class="sidebar-name">${category.name}</div>
            `;

            item.addEventListener('click', () => {
                if (activeRootId === category.id) return;
                activeRootId = category.id;
                markSidebarActive(activeRootId);

                // Full tree is already loaded, render directly
                renderContent(category);
            });

            sidebar.appendChild(item);
        });
    }

    // Removed dynamically fetching subcatalogs since the full tree guarantees L1/L2 access


    // Render Right Panel (L1/L2)
    function renderContent(parentCategory) {
        const content = document.getElementById('categoriesContent');
        if (!content) return;

        content.innerHTML = '';
        
        // Redundant category name header removed per user feedback

        // If children exist, render them as sections (L1)
        if (parentCategory.children && parentCategory.children.length > 0) {
            
            // Check if we need a catch-all grid for L1s without children
            let childlessL1s = [];
            
            parentCategory.children.forEach(l1Category => {
                if (l1Category.children && l1Category.children.length > 0) {
                    // This L1 has children, render it as a section with a header and a grid of its children
                    const section = document.createElement('div');
                    section.className = 'content-section';

                    // L1 Header
                    const header = document.createElement('div');
                    header.className = 'section-header';
                    header.innerHTML = `
                        <h3 class="section-title">${l1Category.name}</h3>
                        <a href="${getCategoryUrl(l1Category)}" class="view-all-link">View All</a>
                    `;
                    section.appendChild(header);

                    // L2 Grid (Children of L1)
                    const grid = document.createElement('div');
                    grid.className = 'subcategory-grid';

                    l1Category.children.forEach(subcat => {
                        const item = createSubcategoryItem(subcat);
                        grid.appendChild(item);
                    });
                    
                    section.appendChild(grid);
                    content.appendChild(section);
                } else {
                    // This L1 has NO children. We collect them to render as generic boxes at the top.
                    childlessL1s.push(l1Category);
                }
            });

            // If we found L1 categories without children, render them in one unified grid at the top
            if (childlessL1s.length > 0) {
                const genericSection = document.createElement('div');
                genericSection.className = 'content-section';
                
                // Only add a generic header if there are other structured sections below it to separate them
                if (childlessL1s.length < parentCategory.children.length) {
                   const genericHeader = document.createElement('div');
                   genericHeader.className = 'section-header';
                   genericHeader.style.borderBottom = 'none'; // cleaner look for default items
                   genericHeader.innerHTML = `<h3 class="section-title">Explore More</h3>`;
                   genericSection.appendChild(genericHeader);
                }

                const grid = document.createElement('div');
                grid.className = 'subcategory-grid';
                
                childlessL1s.forEach(subcat => {
                    const item = createSubcategoryItem(subcat);
                    grid.appendChild(item);
                });
                
                genericSection.appendChild(grid);
                // Insert at the beginning of content so it acts like default categories
                content.insertBefore(genericSection, content.firstChild);
            }

        } else {
            // No children at all for this root category
            content.innerHTML = `
                <div class="content-placeholder">
                    <i class="fas fa-box-open"></i>
                    <p>Products for ${parentCategory.name} are coming soon!</p>
                    <a href="${getCategoryUrl(parentCategory)}" class="explore-btn">Explore Category</a>
                </div>
            `;
        }
    }

    // Helper to create the box-style item (Recursive for Level 3+)
    function createSubcategoryItem(category, level = 2) {
        const item = document.createElement('div');
        item.className = `subcategory-item level-${level}`;

        const hasChildren = category.children && category.children.length > 0;
        const imageUrl = category.image_url || '/images/placeholder.svg';

        // Trigger wrapper (acts like original box)
        const trigger = document.createElement('div');
        trigger.className = 'subcategory-trigger';
        
        trigger.innerHTML = `
            <div class="subcategory-image-wrapper">
                <img src="${imageUrl}" alt="${category.name}" class="subcategory-image" loading="lazy" onerror="this.src='/images/placeholder.svg'">
            </div>
            <div class="subcategory-name" style="display: flex; align-items: center; justify-content: center; gap: 4px; width: 100%;">
                <span>${category.name.length > 7 ? category.name.substring(0, 7) + '...' : category.name}</span>
                ${hasChildren ? '<i class="fas fa-chevron-down subcat-arrow" style="font-size: 10px; transition: transform 0.2s;"></i>' : ''}
            </div>
        `;
        item.appendChild(trigger);

        if (hasChildren) {
            // Expand downwards on Click instead of navigating
            trigger.style.cursor = 'pointer';
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const sublist = item.querySelector('.subcategory-children');
                if (sublist) {
                     const isOpen = sublist.style.display !== 'none';
                     sublist.style.display = isOpen ? 'none' : 'grid'; // changed from block to grid
                     trigger.querySelector('.subcat-arrow').style.transform = isOpen ? 'rotate(0)' : 'rotate(180deg)';
                     item.classList.toggle('expanded', !isOpen);
                }
            });

            // Create Sub-children List Container
            const sublist = document.createElement('div');
            sublist.className = 'subcategory-children subcategory-grid';
            sublist.style.display = 'none'; // hidden by default
            sublist.style.width = '100%';
            sublist.style.padding = '16px 8px';
            sublist.style.borderTop = '1px solid #f0f0f0';
            sublist.style.marginTop = '12px';
            // ensure the grid uses the full width properly inside the expanded item
            sublist.style.boxSizing = 'border-box';

            category.children.forEach(child => {
                // Use the same grid item generator recursively
                const childItem = createSubcategoryItem(child, level + 1);
                sublist.appendChild(childItem);
            });
            item.appendChild(sublist);
        } else {
            // No children, navigate on click
            trigger.style.cursor = 'pointer';
            trigger.addEventListener('click', () => {
                window.location.href = getCategoryUrl(category);
            });
        }

        return item;
    }

    // Helper to create inner lists for recursive levels (Level 3+)
    function createSubListItem(category, level) {
         const hasChildren = category.children && category.children.length > 0;
         const item = document.createElement('div');
         item.className = `sub-list-item level-${level}`;
         
         const trigger = document.createElement('div');
         trigger.className = 'sub-list-trigger';
         trigger.style.display = 'flex';
         trigger.style.justifyContent = 'space-between';
         trigger.style.alignItems = 'center';
         trigger.style.padding = '8px 10px';
         trigger.style.borderBottom = '1px solid #f5f5f5';
         trigger.style.fontSize = '12px';
         trigger.style.cursor = 'pointer';
         
         trigger.innerHTML = `
             <span style="color: #444; font-weight: normal;">${category.name}</span>
             ${hasChildren ? '<i class="fas fa-chevron-down subcat-arrow" style="font-size: 9px; transition: transform 0.2s;"></i>' : '<i class="fas fa-chevron-right" style="color: #ccc; font-size: 9px;"></i>'}
         `;
         item.appendChild(trigger);
         
         if (hasChildren) {
             trigger.addEventListener('click', (e) => {
                  e.stopPropagation();
                  const container = item.querySelector('.sub-list-children');
                  if (container) {
                       const isOpen = container.style.display !== 'none';
                       container.style.display = isOpen ? 'none' : 'block';
                       trigger.querySelector('.subcat-arrow').style.transform = isOpen ? 'rotate(0)' : 'rotate(180deg)';
                  }
             });
             
             const container = document.createElement('div');
             container.className = 'sub-list-children';
             container.style.display = 'none';
             container.style.backgroundColor = '#fafafa';
             container.style.paddingLeft = '10px'; 
             
             category.children.forEach(child => {
                  container.appendChild(createSubListItem(child, level + 1));
             });
             item.appendChild(container);
         } else {
             trigger.addEventListener('click', () => {
                  window.location.href = getCategoryUrl(category);
             });
         }
         
         return item;
    }

    function createShopAllHeader(category) {
        const header = document.createElement('div');
        header.className = 'content-section';
        header.style.marginBottom = '20px';
        
        let href = getCategoryUrl(category);
        
        header.innerHTML = `
            <a href="${href}" style="display: flex; justify-content: space-between; align-items: center; padding: 14px; background: #e8f0fe; border-radius: 8px; text-decoration: none; color: #1C471F; font-weight: 600;">
                <span>Shop All ${category.name}</span>
                <i class="fas fa-chevron-right"></i>
            </a>
        `;
        return header;
    }

    // Helper: Mark active sidebar item
    function markSidebarActive(id) {
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id == id);
        });
    }

    // Helper: Get Category URL
    function getCategoryUrl(category) {
        if (category.slug === 'mobiles' || category.slug === 'smartphones') {
            return '/group.html?slug=mobile-page';
        }
        return `/categories.html?category=${encodeURIComponent(category.slug)}`;
    }

    // Helper: Get Icon Class (Reuse from app.js logic)
    function getIconClass(category) {
        if (category.icon) return category.icon;
        
        const slug = category.slug || '';
        if (slug.includes('mobiles') || slug.includes('smartphones')) return 'fas fa-mobile-alt';
        if (slug.includes('accessories')) return 'fas fa-headphones';
        if (slug.includes('watch')) return 'fas fa-clock';
        if (slug.includes('laptop')) return 'fas fa-laptop';
        if (slug.includes('fashion')) return 'fas fa-tshirt';
        if (slug.includes('home')) return 'fas fa-home';
        if (slug.includes('appliance')) return 'fas fa-tv';
        if (slug.includes('beauty')) return 'fas fa-smile';
        if (slug.includes('furniture')) return 'fas fa-couch';
        if (slug.includes('grocery')) return 'fas fa-shopping-basket';
        if (slug.includes('electronics')) return 'fas fa-plug';
        
        return 'fas fa-tag';
    }

    function renderError(message) {
        const content = document.getElementById('categoriesContent');
        if (content) content.innerHTML = `<div class="error-message"><p>${message}</p></div>`;
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
