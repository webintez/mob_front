document.addEventListener('DOMContentLoaded', () => {
    fetchMobileCategories();
});

async function fetchMobileCategories() {
    const container = document.getElementById('mobile-page-content');
    if (!container) return;

    // Show loading skeleton
    container.innerHTML = `
        <div class="row">
            ${Array(4).fill().map(() => `
                <div class="col-6 col-md-4 col-lg-3 mb-4">
                    <div class="skeleton-box" style="height: 150px; border-radius: 8px;"></div>
                </div>
            `).join('')}
        </div>
    `;

    try {
        const baseUrl = (typeof API_CONFIG !== 'undefined' && API_CONFIG.baseUrl) ? API_CONFIG.baseUrl : '/api';
        const headers = (typeof API_CONFIG !== 'undefined' && API_CONFIG.headers) ? API_CONFIG.headers : {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-API-Key': ''
        };

        const response = await fetch(`${baseUrl}/sections`, { headers });

        if (!response.ok) throw new Error(`API returned ${response.status}`);

        const data = await response.json();

        if (!data || !data.sections) throw new Error("Invalid API response structure");

        // Find the "Mobile Category (Desktopview)" group
        const mobileCategoryGroup = data.sections.find(sec =>
            sec.name === "Mobile Category (Desktopview)" || sec.slug === "mobile-category-desktopview"
        );

        if (!mobileCategoryGroup || !mobileCategoryGroup.children || mobileCategoryGroup.children.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No mobile sections found at this time.</div>';
            return;
        }

        container.innerHTML = ''; // Clear loading

        // Sort children by position if available
        const sortedSections = [...mobileCategoryGroup.children].sort((a, b) => (a.position || 0) - (b.position || 0));

        // Render each child section based on its type
        sortedSections.forEach(section => {
            renderSection(section, container);
        });

    } catch (error) {
        console.error("Error fetching mobile sections:", error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Failed to load sections. Please try again later.
                <br><small>${error.message}</small>
            </div>
        `;
    }
}

function renderSection(section, container) {
    if (!section || !section.status || section.status !== 'active') return;

    switch (section.type) {
        case 'category_grid':
            renderCategoryGrid(section, container);
            break;
        case 'secondary_menu_grid':
            renderSecondaryMenuGrid(section, container);
            break;
        case 'hero_slider':
            renderHeroSlider(section, container);
            break;
        case 'banner':
            renderBanner(section, container);
            break;
        case 'product_carousel':
            // If needed in future
            break;
        case 'product_grid':
            if (typeof SectionRenderer !== 'undefined' && SectionRenderer.renderProductGrid) {
                SectionRenderer.renderProductGrid(section, container);
            }
            break;
        default:
            // Skipping unsupported section type log removed
            break;
    }
}

function renderCategoryGrid(section, parentContainer) {
    const sectionTitle = section.name && !section.name.includes('(category section)') && section.name !== 'Untitled Section' ? section.name : null;
    const items = section.payload || [];
    if (items.length === 0) return;

    // Read style and layout for items_per_view and background
    const layout = section.layout || {};
    const style = section.style || {};
    const combined = { ...layout, ...style };
    const ipv = combined.items_per_view || { desktop: '6', tablet: '4', mobile: '4' };

    // Build background style string
    let bgStyle = 'background: #fff;';
    const bg = combined.background;
    if (bg && bg.type === 'color' && bg.color && bg.color !== 'none') {
        bgStyle = `background: ${bg.color};`;
    }

    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'categories-display-section mt-4 mb-5 shadow-sm';
    sectionDiv.style.cssText = `${bgStyle} padding: 15px; border-radius: 8px;`;

    // Set CSS variables for responsive columns
    sectionDiv.style.setProperty('--cat-cols-desktop', ipv.desktop || '6');
    sectionDiv.style.setProperty('--cat-cols-tablet', ipv.tablet || '4');
    sectionDiv.style.setProperty('--cat-cols-mobile', ipv.mobile || '4');

    let html = `
        ${sectionTitle ? `<h3 class="mb-3" style="font-weight: 600; font-size: 18px;">${sectionTitle}</h3>` : ''}
        <div class="category-grid">
    `;

    items.forEach(item => {
        const url = item.slug ? `/categories.html?category=${item.slug}` : 'javascript:void(0)';
        const imageUrl = item.image_url || item.icon;

        html += `
            <a href="${url}" class="category-item">
                <div class="category-icon">
                    ${imageUrl ?
                `<img src="${imageUrl}" alt="${item.name}" loading="lazy" onerror="this.outerHTML='<i class=&quot;fas fa-mobile-alt&quot; style=&quot;font-size:32px;color:#666;&quot;></i>'">` :
                `<i class="fas fa-mobile-alt" style="font-size:32px;color:#666;"></i>`
            }
                </div>
                <span class="category-name">${item.name}</span>
            </a>
        `;
    });

    html += `</div>`;
    sectionDiv.innerHTML = html;
    parentContainer.appendChild(sectionDiv);
}

function renderSecondaryMenuGrid(section, parentContainer) {
    const sectionTitle = section.name && !section.name.includes('(category section)') && section.name !== 'Untitled Section' ? section.name : null;
    const items = section.payload || [];
    if (items.length === 0) return;

    // Read style and layout for items_per_view and background
    const layout = section.layout || {};
    const style = section.style || {};
    const combined = { ...layout, ...style };
    const ipv = combined.items_per_view || { desktop: '6', tablet: '4', mobile: '4' };

    // Build background style string
    let bgStyle = 'background: #fff;';
    const bg = combined.background;
    if (bg && bg.type === 'color' && bg.color && bg.color !== 'none') {
        bgStyle = `background: ${bg.color};`;
    }

    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'secondary-menu-display-section mt-4 mb-5 shadow-sm';
    sectionDiv.style.cssText = `${bgStyle} padding: 15px; border-radius: 8px;`;

    // Set CSS variables for responsive columns
    sectionDiv.style.setProperty('--cat-cols-desktop', ipv.desktop || '6');
    sectionDiv.style.setProperty('--cat-cols-tablet', ipv.tablet || '4');
    sectionDiv.style.setProperty('--cat-cols-mobile', ipv.mobile || '4');

    let html = `
        ${sectionTitle ? `<h3 class="mb-3" style="font-weight: 600; font-size: 18px;">${sectionTitle}</h3>` : ''}
        <div class="secondary-menu-grid category-grid">
    `;

    items.forEach(item => {
        const url = item.value || 'javascript:void(0)';
        const imageUrl = item.image;

        html += `
            <a href="${url}" class="secondary-menu-item category-item">
                <div class="secondary-menu-icon category-icon">
                    ${imageUrl ?
                `<img src="${imageUrl}" alt="${item.name}" loading="lazy" onerror="this.outerHTML='<i class=&quot;fas fa-th-large&quot; style=&quot;font-size:32px;color:#666;&quot;></i>'">` :
                `<i class="fas fa-th-large" style="font-size:32px;color:#666;"></i>`
            }
                </div>
                <span class="secondary-menu-name category-name">${item.name}</span>
            </a>
        `;
    });

    html += `</div>`;
    sectionDiv.innerHTML = html;
    parentContainer.appendChild(sectionDiv);
}

function renderHeroSlider(section, parentContainer) {
    if (typeof SectionRenderer !== 'undefined' && SectionRenderer.renderHeroSlider) {
        SectionRenderer.renderHeroSlider(section, parentContainer);
    } else {
        // Fallback or old logic if SectionRenderer is unavailable
        const items = section.payload || section.items || [];
        if (!items || items.length === 0) return;

        const slidesData = Array.isArray(items) ? items : Object.values(items);
        if (slidesData.length === 0) return;

        const carouselId = `hero-slider-${section.id}`;
        const sectionWrapper = document.createElement('div');
        sectionWrapper.className = 'mb-5 shadow-sm overflow-hidden';
        sectionWrapper.style.borderRadius = '8px';
        sectionWrapper.style.background = '#f0f0f0';

        const carouselDiv = document.createElement('div');
        carouselDiv.className = 'hero-slider';
        carouselDiv.id = carouselId;
        carouselDiv.style.cssText = `position: relative; width: 100%; overflow: hidden;`;

        const slidesWrapper = document.createElement('div');
        slidesWrapper.className = 'hero-slides-wrapper';
        slidesWrapper.style.cssText = `display: flex; width: 100%; transition: transform 0.5s ease-in-out;`;

        slidesData.forEach((slide) => {
            const slideEl = document.createElement('div');
            slideEl.className = 'hero-slide';
            slideEl.style.cssText = `min-width: 100%; position: relative;`;

            let contentWrapper = slideEl;
            if (slide.cta_url) {
                const link = document.createElement('a');
                link.href = slide.cta_url;
                link.style.cssText = 'display: block; width: 100%; text-decoration: none;';
                slideEl.appendChild(link);
                contentWrapper = link;
            }

            if (slide.image) {
                const img = document.createElement('img');
                img.src = slide.image;
                img.alt = slide.heading || 'Banner';
                img.style.cssText = `width: 100%; height: auto; display: block;`;
                contentWrapper.appendChild(img);
            }

            slidesWrapper.appendChild(slideEl);
        });

        carouselDiv.appendChild(slidesWrapper);
        sectionWrapper.appendChild(carouselDiv);
        parentContainer.appendChild(sectionWrapper);

        // Initialize slider logic if there's more than one slide
        if (slidesData.length > 1) {
            initSimpleSlider(carouselId, slidesData.length);
        }
    }
}

function renderBanner(section, parentContainer) {
    const layout = section.layout || {};
    const items = section.items || section.payload || [];
    const bannerItems = Array.isArray(items) ? items : Object.values(items);
    if (bannerItems.length === 0) return;

    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'banner-section mt-4 mb-5';

    let html = '';
    if (layout.style === 'grid_gallery' || bannerItems.length > 1) {
        html = `<div class="row g-3">`;
        bannerItems.forEach(item => {
            const colClass = bannerItems.length === 2 ? 'col-md-6' : (bannerItems.length >= 3 ? 'col-md-4' : 'col-12');
            html += `
                <div class="${colClass}">
                    <a href="${item.cta_url || '#'}" class="d-block overflow-hidden rounded shadow-sm">
                        <img src="${item.image}" alt="Banner" class="img-fluid w-100 hover-zoom" style="transition: transform 0.3s;">
                    </a>
                </div>
            `;
        });
        html += `</div>`;
    } else {
        const item = bannerItems[0];
        html = `
            <a href="${item.cta_url || '#'}" class="d-block overflow-hidden rounded shadow-sm">
                <img src="${item.image}" alt="Banner" class="img-fluid w-100 hover-zoom" style="transition: transform 0.3s;">
            </a>
        `;
    }

    sectionDiv.innerHTML = html;
    parentContainer.appendChild(sectionDiv);
}

function initSimpleSlider(carouselId, count) {
    let currentIndex = 0;
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;

    const wrapper = carousel.querySelector('.hero-slides-wrapper');

    setInterval(() => {
        currentIndex = (currentIndex + 1) % count;
        if (wrapper) {
            wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
        }
    }, 5000);
}
