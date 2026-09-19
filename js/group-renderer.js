/**
 * Group Renderer - Handles smart slug resolution and rendering for section groups.
 */

document.addEventListener('DOMContentLoaded', function () {
    initGroupPage();
});

async function initGroupPage() {
    const slug = getSlugFromURL();

    if (!slug) {
        showError('Group not found', 'Invalid group slug in the URL.');
        return;
    }

    await loadGroupContent(slug);
}

/**
 * Extracts slug from URL parameters.
 * Supports ?slug=xyz or /group.html?slug=xyz
 */
function getSlugFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('slug') || urlParams.get('group');
}

/**
 * Loads group content from API using smart slug resolution.
 */
async function loadGroupContent(baseSlug) {
    const container = document.getElementById('group-content-container');
    const isMobile = window.innerWidth <= 768;

    // Clean base slug if it already contains device-specific suffixes
    const cleanedSlug = baseSlug.replace(/-for-(mobile|desktop)-view$/, '');

    // Construct device-specific slug
    const deviceSuffix = isMobile ? '-for-mobile-view' : '-for-desktop-view';
    const deviceSlug = `${cleanedSlug}${deviceSuffix}`;

    const baseUrl = (typeof AUTH_CONFIG !== 'undefined' && AUTH_CONFIG.baseUrl) ? AUTH_CONFIG.baseUrl : '/api';
    const apiKey = (typeof AUTH_CONFIG !== 'undefined' && AUTH_CONFIG.headers['X-API-Key']) ? AUTH_CONFIG.headers['X-API-Key'] : '';

    try {
        // 1. Try device-specific slug first
        let response = await fetch(`${baseUrl}/section-groups/${deviceSlug}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            }
        });
        let data = await response.json();

        // 2. Fallback to cleaned base slug if device-specific version is not found
        if (!response.ok || !data.success) {
            // Device-specific group fallback log removed
            response = await fetch(`${baseUrl}/section-groups/${cleanedSlug}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                }
            });
            data = await response.json();
        }

        if (response.ok && data.success && data.data) {
            displayGroup(data.data);
        } else {
            showError('Group not found', data.message || 'The requested section group could not be found.');
        }
    } catch (error) {
        console.error('Error loading group:', error);
        showError('Error', 'Unable to load the section group. Please try again later.');
    }
}

/**
 * Renders the group data into the container.
 */
function displayGroup(groupData) {
    // Update page title
    document.title = `${groupData.name} - Mobitez Private Limited`;

    // Update group title in header if needed
    const titleEl = document.getElementById('group-title');
    const headerEl = document.getElementById('group-header');
    if (titleEl && groupData.name && !groupData.name.includes('Untitled')) {
        titleEl.textContent = groupData.name;
        headerEl.style.display = 'flex';
    }

    const container = document.getElementById('group-content-container');
    container.innerHTML = '';

    const dynamicContainer = document.createElement('div');
    dynamicContainer.className = 'dynamic-sections-container';
    container.appendChild(dynamicContainer);

    if (groupData.sections && Array.isArray(groupData.sections)) {
        groupData.sections.forEach((section, index) => {
            if (typeof SectionRenderer !== 'undefined') {
                SectionRenderer.render(section, dynamicContainer, index);
            } else {
                console.error('SectionRenderer is not defined');
            }
        });
    } else if (groupData.payload && Array.isArray(groupData.payload)) {
        // Some APIs return children in payload
        groupData.payload.forEach((section, index) => {
            if (typeof SectionRenderer !== 'undefined') {
                SectionRenderer.render(section, dynamicContainer, index);
            }
        });
    } else {
        dynamicContainer.innerHTML = '<p style="text-align:center; padding: 20px;">No sections found in this group.</p>';
    }
}

/**
 * Shows error message in the container.
 */
function showError(title, message) {
    const container = document.getElementById('group-content-container');
    if (container) {
        container.innerHTML = `
            <div class="error-container">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>${title}</h2>
                <p>${message}</p>
                <a href="/" class="back-link">
                    <i class="fas fa-arrow-left"></i> Back to Home
                </a>
            </div>
        `;
    }
}
