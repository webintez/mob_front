/**
 * Secondary Menu Renderer
 * Replaces the default category navigation on non-homepage pages.
 * Fetches menu structure from `GET /api/menus/secondary`.
 */

(function () {
    'use strict';

    // API Config
    const API_ENDPOINT = '/menus/secondary';
    const API_KEY = '';

    // Helper: Make API Call
    async function fetchSecondaryMenus() {
        try {
            // Check if global API config exists (e.g. from auth.js or other modules)
            const baseUrl = (typeof AUTH_CONFIG !== 'undefined' && AUTH_CONFIG.baseUrl) ? AUTH_CONFIG.baseUrl : '/api';

            const response = await fetch(`${baseUrl}${API_ENDPOINT}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-API-Key': API_KEY
                }
            });

            if (!response.ok) throw new Error('Network response was not ok');
            const result = await response.json();

            // Display API log for secondary menus as requested
            if (result.success) {
                console.log('Secondary Menu API Response:', result.data);
            }

            return result.success ? result.data : null;
        } catch (error) {
            return null;
        }
    }

    // Helper: Render individual menu item
    function renderMenuItem(item) {
        const li = document.createElement('li');
        li.className = 'secondary-menu-item';

        // Determine Href
        let href = item.link || '#';
        if (item.type === 'category') {
            const categorySlug = item.value || (item.name ? item.name.toLowerCase().replace(/\s+/g, '-') : null);

            if (categorySlug) {
                // If it has a parent_id, it's a sub-category
                if (item.parent_id) {
                    href = `/categories.html?category=${encodeURIComponent(categorySlug)}&subcategory=${encodeURIComponent(item.name)}`;
                } else {
                    href = `/categories.html?category=${encodeURIComponent(categorySlug)}`;
                }
            }
        } else if (item.type === 'tag') {
            href = `/search.html?tag=${encodeURIComponent(item.value)}`;
        }

        // Link Element
        const a = document.createElement('a');
        a.href = href;
        a.className = 'secondary-menu-link';
        a.textContent = item.name;

        // Recursive: Check for children (using all_active_children per documentation)
        const children = item.all_active_children;
        const hasChildren = children && Array.isArray(children) && children.length > 0;

        if (hasChildren) {
            const icon = document.createElement('i');
            icon.className = 'fas fa-chevron-down';
            a.appendChild(icon);

            const dropdown = document.createElement('ul');
            dropdown.className = 'secondary-menu-dropdown';

            children.forEach(child => {
                dropdown.appendChild(renderMenuItem(child));
            });

            li.appendChild(dropdown);
            li.classList.add('has-children');
        }

        li.insertBefore(a, li.firstChild);

        return li;
    }

    // Main Renderer
    async function renderSecondaryMenu() {
        // Skip on homepage
        if (document.body.classList.contains('homepage') ||
            window.location.pathname === '/' ||
            window.location.pathname === '/index.html') {
            return;
        }

        const navContainer = document.getElementById('navContainer');
        if (!navContainer) return;

        // Fetch Data
        const menuData = await fetchSecondaryMenus();
        if (!menuData || !Array.isArray(menuData)) return;

        // Clear existing content
        navContainer.innerHTML = '';
        navContainer.classList.add('secondary-menu-container');

        const menuList = document.createElement('ul');
        menuList.className = 'secondary-menu-list';

        menuData.forEach(item => {
            menuList.appendChild(renderMenuItem(item));
        });

        navContainer.appendChild(menuList);

        // Prevent other nav scripts from overwriting
        window.categoryNavLoaded = true;
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderSecondaryMenu);
    } else {
        renderSecondaryMenu();
    }

})();
