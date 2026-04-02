// Render Grid Gallery (Banner type with grid_gallery style)
function renderGridGallery(section) {
    const container = document.getElementById('dynamic-sections-container');
    if (!container) return;

    const items = section.items || [];
    if (!Array.isArray(items) || items.length === 0) return;

    // Create section wrapper
    const sectionWrapper = document.createElement('section');
    sectionWrapper.className = 'grid-gallery-section';
    sectionWrapper.id = `gallery-${section.id}`;
    sectionWrapper.style.cssText = `
        padding: 20px 0;
        background: #fff;
        margin: 20px 0;
    `;

    // Create title if section has a name
    if (section.name && section.name !== 'gallery') {
        const title = document.createElement('h2');
        title.className = 'section-title';
        title.textContent = section.name;
        title.style.cssText = `
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 20px 0;
            padding: 0 20px;
            color: #212121;
        `;
        sectionWrapper.appendChild(title);
    }

    // Create grid container
    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-gallery-container';
    gridContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 10px;
        padding: 0 20px;
    `;

    // Render each item
    items.forEach((item, index) => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-gallery-item';

        // Calculate grid position
        const colSpan = item.col_span || 4;
        const rowSpan = item.row_span || 1;

        gridItem.style.cssText = `
            grid-column: span ${colSpan};
            grid-row: span ${rowSpan};
            position: relative;
            overflow: hidden;
            border-radius: 8px;
            cursor: ${item.url ? 'pointer' : 'default'};
            transition: transform 0.3s ease;
        `;

        // Create image
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.title || `Gallery image ${index + 1}`;
        img.loading = 'lazy';
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        `;

        // Add click handler if URL exists
        if (item.url) {
            gridItem.onclick = () => {
                window.location.href = item.url;
            };
            gridItem.onmouseenter = () => {
                gridItem.style.transform = 'scale(1.02)';
            };
            gridItem.onmouseleave = () => {
                gridItem.style.transform = 'scale(1)';
            };
        }

        gridItem.appendChild(img);
        gridContainer.appendChild(gridItem);
    });

    sectionWrapper.appendChild(gridContainer);
    container.appendChild(sectionWrapper);

    // Add responsive styles
    if (!document.getElementById('grid-gallery-responsive-styles')) {
        const style = document.createElement('style');
        style.id = 'grid-gallery-responsive-styles';
        style.textContent = `
            @media (max-width: 768px) {
                .grid-gallery-container {
                    grid-template-columns: repeat(6, 1fr) !important;
                    gap: 8px !important;
                    padding: 0 10px !important;
                }
                .grid-gallery-item {
                    grid-column: span 6 !important;
                }
                .section-title {
                    font-size: 18px !important;
                    padding: 0 10px !important;
                }
            }
            @media (max-width: 480px) {
                .grid-gallery-container {
                    gap: 5px !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
}
