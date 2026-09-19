/**
 * Secondary Category Menu Renderer
 * Replaces the default menu with a 3-level category navigation.
 * Fetches data from `GET /api/categories/index`.
 */

(function () {
    'use strict';

    const API_ENDPOINT = '/categories/index';
    
    // Helper: Make API Call
    async function fetchCategoryTree() {
        try {
            const baseUrl = (typeof AUTH_CONFIG !== 'undefined' && AUTH_CONFIG.baseUrl) ? AUTH_CONFIG.baseUrl : '/api';
            const apiKey = (typeof AUTH_CONFIG !== 'undefined' && AUTH_CONFIG.headers['X-API-Key']) ? AUTH_CONFIG.headers['X-API-Key'] : '';

            const response = await fetch(`${baseUrl}${API_ENDPOINT}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                }
            });

            if (!response.ok) throw new Error('Network response was not ok');
            const result = await response.json();

            return (result.success && result.data && result.data.tree) ? result.data.tree : null;
        } catch (error) {
            console.error('Error fetching categories:', error);
            return null;
        }
    }

    // Helper: Render a static list of items (Level 3+)
    function renderStaticList(items, level) {
        const ul = document.createElement('ul');
        ul.className = level === 3 ? 'column-list' : 'nested-level-list';

        items.forEach(child => {
            const li = document.createElement('li');
            li.className = 'column-item';
            
            const hasChildren = child.children && Array.isArray(child.children) && child.children.length > 0;
            if (hasChildren) li.classList.add('has-children');

            const container = document.createElement('div');
            container.className = 'column-link-container';

            const a = document.createElement('a');
            a.href = `/categories.html?category=${encodeURIComponent(child.slug)}`;
            a.className = 'column-link';
            a.textContent = child.name;
            
            if (hasChildren) {
                container.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    li.classList.toggle('expanded');
                });

                const icon = document.createElement('i');
                icon.className = 'fas fa-chevron-down column-chevron';
                container.appendChild(a);
                container.appendChild(icon);
            } else {
                container.appendChild(a);
            }

            li.appendChild(container);

            if (hasChildren) {
                li.appendChild(renderStaticList(child.children, level + 1));
            }

            ul.appendChild(li);
        });

        return ul;
    }

    // Helper: Render Category Item (Root Level with Mega Menu)
    function renderCategoryItem(category) {
        const li = document.createElement('li');
        li.className = 'secondary-menu-item';

        const hasChildren = category.children && Array.isArray(category.children) && category.children.length > 0;
        
        let href = `/categories.html?category=${encodeURIComponent(category.slug)}`;
        if (category.slug === 'mobiles' || category.slug === 'smartphones') {
            href = '/group.html?slug=mobile-page';
        }

        const a = document.createElement('a');
        a.href = href;
        a.className = 'secondary-menu-link';
        
        const span = document.createElement('span');
        span.textContent = category.name;
        a.appendChild(span);

        if (hasChildren) {
            const icon = document.createElement('i');
            icon.className = 'fas fa-chevron-down';
            a.appendChild(icon);
            
            // Toggle Mega Menu on click
            a.addEventListener('click', (e) => {
                if (!li.classList.contains('active')) {
                    e.preventDefault();
                    e.stopPropagation();
                    document.querySelectorAll('.secondary-menu-item.active').forEach(item => {
                        if (item !== li) item.classList.remove('active');
                    });
                    li.classList.add('active');
                }
            });

            const dropdown = document.createElement('div');
            dropdown.className = 'secondary-menu-dropdown';
            
            // Flattened rendering loop for dynamic CSS wrapping
            category.children.forEach(level2 => {
                const level3Items = level2.children || [];

                // Add Level 2 Heading
                const heading = document.createElement('a');
                heading.href = `/categories.html?category=${encodeURIComponent(level2.slug)}`;
                heading.className = 'column-heading';
                heading.textContent = level2.name;
                dropdown.appendChild(heading);

                // Add Level 3 Items directly to flow
                if (level3Items.length > 0) {
                    dropdown.appendChild(renderStaticList(level3Items, 3));
                }
            });
            
            li.appendChild(dropdown);
        }

        li.appendChild(a);
        return li;
    }

    // Helper: Sort Category Tree Recursively
    function sortCategoryTree(tree) {
        if (!Array.isArray(tree)) return [];
        return [...tree]
            .sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999))
            .map(category => {
                if (category.children && Array.isArray(category.children) && category.children.length > 0) {
                    return {
                        ...category,
                        children: sortCategoryTree(category.children)
                    };
                }
                return category;
            });
    }

    // Main Renderer
    async function initCategoryMenu() {
        // Skip on homepage
        if (document.body.classList.contains('homepage') ||
            window.location.pathname === '/' ||
            window.location.pathname === '/index.html') {
            return;
        }

        const navContainer = document.getElementById('navContainer');
        if (!navContainer) return;

        // Fetch Tree Data
        const rawCategoryTree = await fetchCategoryTree();
        if (!rawCategoryTree || !Array.isArray(rawCategoryTree)) return;

        // Sort categories by sort_order
        const categoryTree = sortCategoryTree(rawCategoryTree);

        // Clear and mark as loaded
        navContainer.innerHTML = '';
        navContainer.classList.add('secondary-menu-container');

        const menuList = document.createElement('ul');
        menuList.className = 'secondary-menu-list';

        // Render first 10 root categories for layout consistency
        categoryTree.slice(0, 10).forEach(category => {
            menuList.appendChild(renderCategoryItem(category, 1));
        });

        navContainer.appendChild(menuList);


        // Global click listener to close menus
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.secondary-menu-item')) {
                document.querySelectorAll('.secondary-menu-item.active').forEach(item => {
                    item.classList.remove('active');
                });
            }
        });

        window.categoryNavLoaded = true;
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCategoryMenu);
    } else {
        initCategoryMenu();
    }

})();

