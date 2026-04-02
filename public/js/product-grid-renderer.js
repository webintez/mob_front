// Render Product Grid (with background image)
function renderProductGrid(section) {
    const container = document.getElementById('dynamic-sections-container');
    if (!container) return;

    const products = section.payload || [];
    if (!Array.isArray(products) || products.length === 0) return;

    const layout = section.layout || {};
    const desktopCols = parseInt(layout.items_per_view?.desktop || 4);
    const tabletCols = parseInt(layout.items_per_view?.tablet || 3);
    const mobileCols = parseInt(layout.items_per_view?.mobile || 2);
    const gap = parseInt(layout.gap || 16);
    const hasBackgroundImage = layout.background && layout.background.type === 'image' && layout.background.image;

    // Create section wrapper
    const sectionWrapper = document.createElement('section');
    sectionWrapper.className = 'product-grid-section';
    sectionWrapper.id = `product-grid-${section.id}`;
    sectionWrapper.style.cssText = `
        padding: 40px 0;
        background: #fff;
        margin: 20px 0;
    `;

    // Inner container
    const innerContainer = document.createElement('div');
    innerContainer.className = 'container';

    // Section title
    if (section.name) {
        const titleEl = document.createElement('h2');
        titleEl.className = 'section-title';
        titleEl.textContent = section.name;
        titleEl.style.cssText = `
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 24px 0;
            color: #212121;
        `;
        innerContainer.appendChild(titleEl);
    }

    // Main flex container (grid + background)
    const mainContainer = document.createElement('div');
    mainContainer.className = 'product-grid-main';
    mainContainer.style.cssText = `
        display: flex;
        gap: ${gap}px;
        align-items: flex-start;
    `;

    // Grid container
    const gridContainer = document.createElement('div');
    gridContainer.className = 'product-grid-container';
    gridContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(${desktopCols}, 1fr);
        gap: ${gap}px;
        flex: ${hasBackgroundImage ? '1' : '1 1 auto'};
    `;

    // Render products
    products.forEach(product => {
        const card = createProductCard(product);

        // Hide price if show_price is false
        if (layout.show_price === false) {
            const priceEl = card.querySelector('.product-price');
            if (priceEl) priceEl.style.display = 'none';
        }

        // Hide rating if show_rating is false
        if (layout.show_rating === false) {
            const ratingEl = card.querySelector('.product-rating');
            if (ratingEl) ratingEl.style.display = 'none';
        }

        gridContainer.appendChild(card);
    });

    mainContainer.appendChild(gridContainer);

    // Add background image if provided
    if (hasBackgroundImage) {
        const bgImageContainer = document.createElement('div');
        bgImageContainer.className = 'product-grid-background-image';
        bgImageContainer.style.cssText = `
            flex: 0 0 auto;
            width: 350px;
            min-width: 350px;
            min-height: 400px;
            border-radius: 8px;
            overflow: hidden;
            cursor: ${layout.background.url ? 'pointer' : 'default'};
            transition: transform 0.3s ease;
        `;

        const bgImage = document.createElement('img');
        bgImage.src = layout.background.image;
        bgImage.alt = section.name || 'Promotional Banner';
        bgImage.loading = 'lazy';
        bgImage.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: ${layout.background.cover === '1' ? 'cover' : 'contain'};
            display: block;
        `;

        // Add click handler if URL is provided
        if (layout.background.url) {
            bgImageContainer.onclick = () => {
                window.location.href = layout.background.url;
            };
            bgImageContainer.onmouseenter = () => {
                bgImageContainer.style.transform = 'scale(1.02)';
            };
            bgImageContainer.onmouseleave = () => {
                bgImageContainer.style.transform = 'scale(1)';
            };
        }

        bgImageContainer.appendChild(bgImage);
        mainContainer.appendChild(bgImageContainer);
    }

    innerContainer.appendChild(mainContainer);
    sectionWrapper.appendChild(innerContainer);
    container.appendChild(sectionWrapper);

    // Add responsive styles
    if (!document.getElementById('product-grid-responsive-styles')) {
        const style = document.createElement('style');
        style.id = 'product-grid-responsive-styles';
        style.textContent = `
            @media (max-width: 1024px) {
                .product-grid-container {
                    grid-template-columns: repeat(${tabletCols}, 1fr) !important;
                }
            }
            @media (max-width: 768px) {
                .product-grid-container {
                    grid-template-columns: repeat(${mobileCols}, 1fr) !important;
                }
                .product-grid-background-image {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
}
