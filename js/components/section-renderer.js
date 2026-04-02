/**
 * SectionRenderer - A reusable component for rendering dynamic sections and section groups.
 */
const SectionRenderer = {
    // State for carousels
    carouselState: {},

    /**
     * Renders a section into the specified container.
     */
    /**
     * Renders a section into the specified container.
     * @param {Object} section 
     * @param {HTMLElement} container 
     * @param {Number} index - The position of the section (0-indexed) for eager threshold.
     */
    async render(section, container, index = -1) {
        if (!section) return;

        const sectionWrapper = document.createElement('div');
        sectionWrapper.className = `dynamic-section section-type-${section.type} section-id-${section.id}`;
        sectionWrapper.dataset.sectionId = section.id;

        // Apply layout/style background (style takes priority over layout, carousel handles its own BG)
        if (section.type !== 'product_carousel') {
            const combined = { ...(section.layout || {}), ...(section.style || {}) };
            this.applyLayoutStyles(sectionWrapper, combined);
        }

        container.appendChild(sectionWrapper);

        // --- LAZY LOAD LOGIC ---
        // Eager load if index is < 2 (usually above fold) or if it's a Hero Slider
        const isEager = (index >= 0 && index < 2) || section.type === 'hero_slider';

        if (isEager) {
            await this.renderContent(section, sectionWrapper);
        } else {
            // Placeholder styles to prevent folding and shift layout
            sectionWrapper.style.minHeight = '150px';
            sectionWrapper.innerHTML = `
                <div class="section-lazy-placeholder" style="display: flex; align-items: center; justify-content: center; height: 100%; min-height: 150px; color: #888; font-size: 14px; font-family: sans-serif;">
                    <div class="lazy-spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #004700; border-radius: 50%; width: 22px; height: 22px; animation: lazy-spin 0.8s linear infinite; margin-right: 12px;"></div>
                    <span>Loading section...</span>
                </div>
                <style>
                    @keyframes lazy-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
            `;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(async entry => {
                    if (entry.isIntersecting) {
                        sectionWrapper.style.minHeight = ''; // Remove minimum height
                        sectionWrapper.innerHTML = ''; // Clear placeholder
                        await this.renderContent(section, sectionWrapper);
                        observer.unobserve(sectionWrapper);
                    }
                });
            }, { rootMargin: '350px' }); // Trigger load beforehand
            
            observer.observe(sectionWrapper);
        }
    },

    /**
     * Renders the actual content of the section.
     */
    async renderContent(section, sectionWrapper) {
        if (window.innerWidth <= 768) {
            console.log(`[Loaded Section Data] ${section.name || section.type} (ID: ${section.id}):`, section);
        }
        switch (section.type) {
            case 'hero_slider':
                await this.renderHeroSlider(section, sectionWrapper);
                break;
            case 'product_carousel':
                await this.renderProductCarousel(section, sectionWrapper);
                break;
            case 'product_grid':
                await this.renderProductGrid(section, sectionWrapper);
                break;
            case 'category_grid':
                await this.renderCategoryGrid(section, sectionWrapper);
                break;
            case 'banner':
                await this.renderBanner(section, sectionWrapper);
                break;
            case 'image_carousel':
                await this.renderImageCarousel(section, sectionWrapper);
                break;
            case 'section_group':
                await this.renderSectionGroup(section, sectionWrapper);
                break;
            case 'custom':
                await this.renderCustom(section, sectionWrapper);
                break;
            default:
                console.warn('Unsupported section type:', section.type);
                sectionWrapper.remove();
                break;
        }
    },


    /**
     * Applies layout and background styles to a section wrapper.
     */
    /**
     * Resolves background CSS from a background config object.
     * Supported types: 'color', 'image', 'gradient'
     */
    _resolveBackground(bg) {
        if (!bg || !bg.type) return null;

        switch (bg.type) {
            case 'color':
                // Use `color` field only — ignore color_hex
                return bg.color ? { backgroundColor: bg.color } : null;

            case 'image':
                if (!bg.image) return null;
                return {
                    backgroundImage: `url('${bg.image}')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: bg.cover === '1' || bg.cover === true ? 'cover' : 'contain',
                    backgroundPosition: 'center',
                };

            case 'gradient': {
                const dir = bg.gradient_direction || '90';
                const start = bg.gradient_start || '#ffffff';
                const end = bg.gradient_end || '#000000';
                const grad = bg.gradient_type === 'radial'
                    ? `radial-gradient(circle, ${start}, ${end})`
                    : `linear-gradient(${dir}deg, ${start}, ${end})`;
                return { background: grad };
            }

            default:
                return null;
        }
    },

    applyLayoutStyles(element, layout, skipBackground = false) {
        if (!layout) return;

        // Apply background from section config — style.background takes priority
        if (!skipBackground) {
            const bg = layout.background;
            const resolved = bg ? this._resolveBackground(bg) : null;
            if (resolved) {
                Object.assign(element.style, resolved);
            }
        }

        // Apply optional spacing
        if (layout.padding) element.style.padding = layout.padding;
        if (layout.margin) element.style.margin = layout.margin;
    },

    /**
     * Renders a Hero Slider section.
     */
    async renderHeroSlider(section, container) {
        const items = section.payload || section.items || [];
        if (!items || items.length === 0) return;

        const slidesData = Array.isArray(items) ? items : Object.values(items);
        const layout = section.layout || {};
        const carouselId = `hero-slider-${section.id}`;
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            // New Flipkart Style for Mobile
            const outer = document.createElement('div');
            outer.className = 'hero-slider-flipkart';
            outer.id = carouselId;

            const sliderOuter = document.createElement('div');
            sliderOuter.className = 'flipkart-slider-outer';

            const containerEl = document.createElement('div');
            containerEl.className = 'flipkart-slider-container';

            slidesData.forEach((slide, index) => {
                if (!slide.image) return; // Skip slides without images

                const slideItem = document.createElement('div');
                slideItem.className = 'flipkart-slide-item';
                slideItem.dataset.index = index;

                const content = document.createElement('div');
                content.className = 'flipkart-slide-content';

                const link = document.createElement('a');
                link.href = slide.cta_url || slide.url || '#';
                link.className = 'flipkart-aspect-ratio';

                const img = document.createElement('img');
                img.src = slide.image;
                img.alt = slide.heading || 'Banner';
                img.loading = index === 0 ? 'eager' : 'lazy';

                link.appendChild(img);
                content.appendChild(link);
                slideItem.appendChild(content);
                containerEl.appendChild(slideItem);
            });

            sliderOuter.appendChild(containerEl);
            outer.appendChild(sliderOuter);

            // State
            this.carouselState[carouselId] = {
                currentIndex: 0,
                totalSlides: slidesData.length,
                autoplay: layout.autoplay !== false,
                delay: parseInt(layout.autoplay_delay || 3000),
                interval: null,
                type: 'flipkart'
            };

            // Dots
            if (layout.dots !== false && slidesData.length > 1) {
                this.addFlipkartDots(outer, carouselId, slidesData.length);
            }

            container.appendChild(outer);

            if (this.carouselState[carouselId].autoplay) {
                this.startAutoplay(carouselId);
            }

            // Sync dots on scroll
            let scrollTimeout;
            containerEl.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    const index = Math.round(containerEl.scrollLeft / containerEl.clientWidth);
                    if (index !== this.carouselState[carouselId].currentIndex) {
                        this.goToSlide(carouselId, index, true);
                    }
                }, 100);
            }, { passive: true });

            return;
        }

        const carouselEl = document.createElement('div');
        carouselEl.className = 'hero-slider';
        carouselEl.id = carouselId;
        carouselEl.style.cssText = `position: relative; width: 100%; overflow: hidden; background: #f0f0f0;`;

        const slidesWrapper = document.createElement('div');
        slidesWrapper.className = 'hero-slides-wrapper';
        slidesWrapper.style.cssText = `display: flex; width: 100%; transition: transform 0.5s ease-in-out;`;

        slidesData.forEach((slide) => {
            const slideEl = document.createElement('div');
            slideEl.className = 'hero-slide';
            slideEl.style.cssText = `min-width: 100%; position: relative;`;

            let contentWrapper = slideEl;
            if (slide.cta_url || slide.url) {
                const link = document.createElement('a');
                link.href = slide.cta_url || slide.url;
                link.style.cssText = 'display: block; width: 100%; text-decoration: none; color: inherit;';
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

            // Text Overlay
            if (slide.heading || slide.subheading) {
                const overlay = document.createElement('div');
                overlay.className = 'hero-text-overlay';
                overlay.style.cssText = `position: absolute; top: 50%; left: 10%; transform: translateY(-50%); color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.3); max-width: 50%;`;

                if (slide.heading && slide.heading !== 'null') {
                    const h2 = document.createElement('h2');
                    h2.textContent = slide.heading;
                    h2.style.fontSize = isMobile ? '1.5rem' : '2.5rem';
                    overlay.appendChild(h2);
                }
                if (slide.subheading && slide.subheading !== 'null') {
                    const p = document.createElement('p');
                    p.textContent = slide.subheading;
                    p.style.fontSize = isMobile ? '0.9rem' : '1.2rem';
                    overlay.appendChild(p);
                }
                contentWrapper.appendChild(overlay);
            }

            slidesWrapper.appendChild(slideEl);
        });

        carouselEl.appendChild(slidesWrapper);

        // Arrows & Dots
        if (layout.arrows !== false && slidesData.length > 1) {
            this.addCarouselArrows(carouselEl, carouselId, slidesData.length, isMobile);
        }
        if (layout.dots !== false && slidesData.length > 1) {
            this.addCarouselDots(carouselEl, carouselId, slidesData.length);
        }

        container.appendChild(carouselEl);

        // State & Autoplay
        this.carouselState[carouselId] = {
            currentIndex: 0,
            totalSlides: slidesData.length,
            autoplay: layout.autoplay !== false,
            delay: parseInt(layout.autoplay_delay || 5000),
            interval: null
        };

        if (this.carouselState[carouselId].autoplay) {
            this.startAutoplay(carouselId);
        }

        this.initTouchEvents(slidesWrapper, carouselId);
    },

    addCarouselArrows(container, carouselId, count, isMobile) {
        const prev = document.createElement('button');
        const next = document.createElement('button');
        prev.className = 'hero-arrow hero-arrow-prev';
        next.className = 'hero-arrow hero-arrow-next';
        prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
        next.innerHTML = '<i class="fas fa-chevron-right"></i>';

        const arrowStyle = isMobile ?
            'position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.3); border: none; color: #fff; width: 30px; height: 30px; border-radius: 50%; z-index: 10;' :
            'position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.7); border: none; color: #333; width: 44px; height: 44px; border-radius: 50%; z-index: 10; cursor: pointer;';

        prev.style.cssText = arrowStyle + 'left: 10px;';
        next.style.cssText = arrowStyle + 'right: 10px;';

        prev.onclick = (e) => { e.preventDefault(); this.moveSlider(carouselId, -1); };
        next.onclick = (e) => { e.preventDefault(); this.moveSlider(carouselId, 1); };

        container.appendChild(prev);
        container.appendChild(next);
    },

    addCarouselDots(container, carouselId, count) {
        const dots = document.createElement('div');
        dots.className = 'hero-dots';
        dots.style.cssText = 'position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 10;';

        for (let i = 0; i < count; i++) {
            const dot = document.createElement('span');
            dot.className = `hero-dot ${i === 0 ? 'active' : ''}`;
            dot.dataset.index = i;
            dot.style.cssText = `width: 10px; height: 10px; border-radius: 50%; border: 1px solid white; cursor: pointer; transition: 0.3s; background: ${i === 0 ? 'white' : 'rgba(255,255,255,0.5)'};`;
            dot.onclick = () => this.goToSlide(carouselId, i);
            dots.appendChild(dot);
        }
        container.appendChild(dots);
    },

    moveSlider(carouselId, direction) {
        const state = this.carouselState[carouselId];
        if (!state) return;
        let nextIndex = state.currentIndex + direction;
        if (nextIndex < 0) nextIndex = state.totalSlides - 1;
        if (nextIndex >= state.totalSlides) nextIndex = 0;
        this.goToSlide(carouselId, nextIndex);
    },

    goToSlide(carouselId, index, isFromScroll = false) {
        const state = this.carouselState[carouselId];
        if (!state) return;

        state.currentIndex = index;

        if (state.type === 'flipkart') {
            const container = document.querySelector(`#${carouselId} .flipkart-slider-container`);
            if (container && !isFromScroll) {
                container.scrollTo({
                    left: index * container.clientWidth,
                    behavior: 'smooth'
                });
            }
            this.updateFlipkartDots(carouselId, index);
        } else {
            const wrapper = document.querySelector(`#${carouselId} .hero-slides-wrapper`);
            if (wrapper) wrapper.style.transform = `translateX(-${index * 100}%)`;

            // Update dots
            const dots = document.querySelectorAll(`#${carouselId} .hero-dot`);
            dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === index);
                dot.style.background = idx === index ? 'white' : 'rgba(255,255,255,0.5)';
            });
        }

        // Reset autoplay on manual interaction (if not from auto-scroll)
        if (state.autoplay && !isFromScroll) {
            clearInterval(state.interval);
            state.interval = null;
            this.startAutoplay(carouselId);
        }
    },

    addFlipkartDots(container, carouselId, count) {
        const dots = document.createElement('div');
        dots.className = 'flipkart-pagination';

        for (let i = 0; i < count; i++) {
            const dot = document.createElement('div');
            dot.className = `flipkart-dot ${i === 0 ? 'active' : ''}`;
            dot.dataset.index = i;

            const progress = document.createElement('div');
            progress.className = 'flipkart-progress';
            if (i === 0 && this.carouselState[carouselId].autoplay) {
                progress.style.transition = `width ${this.carouselState[carouselId].delay}ms linear`;
                // Trigger reflow to ensure transition runs
                setTimeout(() => progress.style.width = '100%', 10);
            }

            dot.appendChild(progress);
            dot.onclick = () => this.goToSlide(carouselId, i);
            dots.appendChild(dot);
        }
        container.appendChild(dots);
    },

    updateFlipkartDots(carouselId, index) {
        const state = this.carouselState[carouselId];
        const dots = document.querySelectorAll(`#${carouselId} .flipkart-dot`);

        dots.forEach((dot, idx) => {
            const isActive = idx === index;
            dot.classList.toggle('active', isActive);

            const progress = dot.querySelector('.flipkart-progress');
            if (progress) {
                progress.style.transition = 'none';
                progress.style.width = '0%';

                if (isActive && state.autoplay) {
                    // Trigger reflow
                    void progress.offsetWidth;
                    progress.style.transition = `width ${state.delay}ms linear`;
                    progress.style.width = '100%';
                }
            }
        });
    },

    startAutoplay(carouselId) {
        const state = this.carouselState[carouselId];
        if (!state || state.interval) return;
        state.interval = setInterval(() => this.moveSlider(carouselId, 1), state.delay);
    },

    initTouchEvents(wrapper, carouselId) {
        let startX = 0;
        wrapper.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
        wrapper.addEventListener('touchend', (e) => {
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) this.moveSlider(carouselId, diff > 0 ? 1 : -1);
        }, { passive: true });
    },

    /**
     * Renders a Product Carousel section.
     */
    async renderProductCarousel(section, container) {
        const products = section.payload || [];
        if (!products || products.length === 0) return;

        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            this.renderFlipkartMobileCarousel(section, container);
            return;
        }

        const layout = section.layout || {};
        const style = section.style || layout;
        const title = ''; // Hidden per user request
        const isDesktop = window.innerWidth > 1024;
        const bg = layout.background || {};
        const sectionId = section.id;

        // Prepare CSS Variables for items per view
        const ipv = style.items_per_view || layout.items_per_view || { desktop: 5, tablet: 4, mobile: 3 };
        container.style.setProperty('--items-desktop', ipv.desktop);
        container.style.setProperty('--items-tablet', ipv.tablet);
        container.style.setProperty('--items-mobile', ipv.mobile);

        let wrapperClass = 'dynamic-section-wrapper';
        let showSideImage = false;

        // Background Logic:
        // Desktop: Image -> side. Background -> none.
        // Mobile: Image -> background.
        if (isDesktop && bg.type === 'image' && bg.image) {
            wrapperClass += ' two-column';
            showSideImage = true;
            this.applyLayoutStyles(container, layout, true); // Apply padding etc without BG
            container.style.backgroundImage = 'none';
        } else {
            this.applyLayoutStyles(container, layout);
        }

        let html = `<div class="${wrapperClass}">`;

        // Left Side (Carousel)
        html += `
            <div class="carousel-main-side">
                <div class="product-carousel-header">
                    <h3>${title}</h3>
                    <div class="header-right">
                        <a href="${layout.view_all_url || '/products.html'}" class="view-all-btn">VIEW ALL</a>
                    </div>
                </div>
                <div class="product-carousel-container" id="carousel-container-${sectionId}">
                    <button class="carousel-nav-btn prev" onclick="SectionRenderer.scrollProductCarousel(${sectionId}, -1)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="product-carousel-scroll" id="carousel-scroll-${sectionId}">
        `;

        products.forEach(product => {
            html += this.getProductCardHtml(product, style);
        });

        html += `
                    </div>
                    <button class="carousel-nav-btn next" onclick="SectionRenderer.scrollProductCarousel(${sectionId}, 1)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;

        // Right Side (Image) - only on desktop if configured
        if (showSideImage) {
            html += `
                <div class="carousel-image-side">
                    <img src="${bg.image}" alt="Feature Image">
                </div>
            `;
        }

        html += `</div>`;
        container.innerHTML = html;
    },

    /**
     * Scrolls the product carousel.
     */
    scrollProductCarousel(sectionId, direction) {
        const scrollEl = document.getElementById(`carousel-scroll-${sectionId}`);
        if (!scrollEl) return;

        const firstCard = scrollEl.querySelector('.product-card');
        if (!firstCard) return;

        const scrollAmount = (firstCard.offsetWidth + 15) * direction; // Card width + gap
        scrollEl.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    },

    /**
     * Generates HTML for a single product card.
     * Delegates to the shared ProductCard component.
     */
    getProductCardHtml(product, layout = {}) {
        return ProductCard.toHTML(product, {
            showPrice: layout.show_price !== false,
            showRating: layout.show_rating !== false,
        });
    },

    /**
     * Renders a specialized horizontal scrolling carousel for mobile.
     */
    renderFlipkartMobileCarousel(section, container) {
        const products = section.payload || [];
        const layout = section.layout || {};
        const style = section.style || {};
        const combined = { ...layout, ...style };
        
        const title = ''; // Hidden per user request
        const viewAllUrl = layout.view_all_url || '/products.html';

        // Background styling
        let bgStyle = '';
        if (combined.background) {
            const resolved = this._resolveBackground(combined.background);
            if (resolved) {
                if (resolved.background) bgStyle += `background: ${resolved.background};`;
                if (resolved.backgroundColor) bgStyle += `background-color: ${resolved.backgroundColor};`;
                if (resolved.backgroundImage) bgStyle += `background-image: ${resolved.backgroundImage}; background-size: ${resolved.backgroundSize}; background-position: ${resolved.backgroundPosition}; background-repeat: ${resolved.backgroundRepeat};`;
            }
        } else {
            bgStyle = 'background-color: #f1f3f6;'; // Fallback
        }
        
        container.style.setProperty('padding', '0', 'important');
        container.style.setProperty('margin', '0', 'important');
        container.classList.add('flipkart-mobile-carousel-outer');

        container.innerHTML = `
            <div class="flipkart-mobile-carousel-container" style="${bgStyle}">
                <div class="flipkart-carousel-scroll">
                    ${products.map(p => {
                        const name = p.name || 'Product';
                        const rating = parseFloat(p.rating) || 0;
                        const reviewCountRaw = p.review_count || p.reviews || 0;
                        const reviewCount = Number(reviewCountRaw).toLocaleString('en-IN');
                        const mrp = p.mrp || p.compare_at_price || Math.round((p.price || 1249) * 1.25);
                        const price = p.price || 994;
                        const formattedMrp = Number(mrp).toLocaleString('en-IN');
                        const formattedPrice = `₹${Number(price).toLocaleString('en-IN')}`;

                        return `
                        <a href="/product.html?slug=${p.slug}" class="flipkart-carousel-item">
                            <div class="trends-item-image-wrapper">
                                <img src="${p.image_url}" alt="${p.name}" class="trends-item-image" loading="lazy">
                                ${rating > 0 ? `
                                <div class="trends-item-rating-overlay">
                                    <div class="trends-item-rating-badge">
                                        <span>${rating.toFixed(1)}</span>
                                        <i class="fas fa-star"></i>
                                        <span class="rating-count">(${reviewCount})</span>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                            <div class="trends-item-text-container">
                                <div class="trends-item-title-row">
                                    <span class="trends-item-name">${name}</span>
                                </div>
                                <div class="trends-item-price-row">
                                    <span class="trends-item-old-price">${formattedMrp}</span>
                                    <span class="trends-item-new-price">${formattedPrice}</span>
                                </div>
                            </div>
                        </a>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Renders a Product Grid section.
     */
    async renderProductGrid(section, container) {
        const products = section.payload || [];
        if (!products || products.length === 0) return;

        const isMobile = window.innerWidth <= 768;
        const layout = section.layout || {};
        const style = section.style || layout;

        // If it's mobile view, we use the Flipkart Trends style as requested
        if (isMobile) {
            this.renderFlipkartTrendsGrid(section, container);
            return;
        }

        const ipv = style.items_per_view || layout.items_per_view || { desktop: 4, tablet: 3, mobile: 2 };
        const gap = style.gap || layout.gap || '15';

        // Apply background and layout styles
        this.applyLayoutStyles(container, layout);

        container.innerHTML = `
            <div class="product-grid" style="--cols-desktop: ${ipv.desktop}; --cols-tablet: ${ipv.tablet}; --cols-mobile: ${ipv.mobile}; gap: ${gap}px; padding: ${gap}px;">
                ${products.map(p => this.getProductCardHtml(p, {
            ...style,
            show_price: true,   // Always show price in product grid
            show_rating: true,  // Always show rating in product grid
        })).join('')}
            </div>
        `;
    },

    /**
     * Renders a specialized 2x2 grid for mobile in Trends style.
     */
    renderFlipkartTrendsGrid(section, container) {
        const products = section.payload || [];
        const layout = section.layout || {};
        const style = section.style || {};
        const combined = { ...layout, ...style };
        
        let bgColor = '#f24040';
        if (combined.background && combined.background.type === 'color') {
            if (combined.background.color && combined.background.color !== 'none') {
                bgColor = combined.background.color;
            } else if (combined.background.color_hex) {
                 bgColor = combined.background.color_hex;
            }
        }
        
        const title = ''; // Hidden per user request

        // Limit to 4 products for a 2x2 grid
        const gridProducts = products.slice(0, 4);

        container.style.setProperty('padding', '0', 'important');
        container.style.setProperty('margin', '0', 'important');
        container.classList.add('trends-grid-outer');
        container.innerHTML = `
            <div class="trends-grid-container" style="background-color: ${bgColor};">
                <div class="trends-grid-header">
                    <h3 class="trends-grid-title">${title}</h3>
                </div>
                <div class="trends-grid-body">
                    <div class="trends-grid-inner">
                        ${gridProducts.map((p, idx) => {
                            const name = p.name || 'Product';
                            const rating = parseFloat(p.rating) || 0;
                            const reviewCountRaw = p.review_count || p.reviews || 0;
                            const reviewCount = Number(reviewCountRaw).toLocaleString('en-IN');
                            const mrp = p.mrp || p.compare_at_price || Math.round((p.price || 1249) * 1.25);
                            const price = p.price || 994;
                            const formattedMrp = Number(mrp).toLocaleString('en-IN');
                            const formattedPrice = `₹${Number(price).toLocaleString('en-IN')}`;

                            return `
                            <a href="/product.html?slug=${p.slug}" class="trends-grid-item">
                                <div class="trends-item-image-wrapper">
                                    <img src="${p.image_url}" alt="${p.name}" class="trends-item-image" loading="lazy">
                                    ${rating > 0 ? `
                                    <div class="trends-item-rating-overlay">
                                        <div class="trends-item-rating-badge">
                                            <span>${rating.toFixed(1)}</span>
                                            <i class="fas fa-star"></i>
                                            <span class="rating-count">(${reviewCount})</span>
                                        </div>
                                    </div>
                                    ` : ''}
                                </div>
                                <div class="trends-item-text-container">
                                    <div class="trends-item-title-row">
                                        <span class="trends-item-name">${name}</span>
                                    </div>
                                    <div class="trends-item-price-row">
                                        <span class="trends-item-old-price">${formattedMrp}</span>
                                        <span class="trends-item-new-price">${formattedPrice}</span>
                                    </div>
                                </div>
                            </a>
                        `}).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Helper to get a short version of product name for grid labels.
     */
    getShortProductName(name) {
        if (!name) return '';
        // Look for brand or main product type (e.g., "Samsung", "Vivo", "iPhone")
        const keywords = ['Samsung', 'Vivo', 'iPhone', 'Oppo', 'Mi', 'Realme', 'POCO', 'Nothing', 'Google'];
        for (const kw of keywords) {
            if (name.toLowerCase().includes(kw.toLowerCase())) {
                return kw + ' ' + (name.split(' ').slice(1, 3).join(' '));
            }
        }
        // Fallback: first 2-3 words
        return name.split(' ').slice(0, 2).join(' ');
    },

    /**
     * Renders a Category Grid section.
     */
    async renderCategoryGrid(section, container) {
        const categories = section.payload || [];
        if (!categories || categories.length === 0) return;

        // Merge layout + style (style takes priority), same pattern as other section types
        const layout = section.layout || {};
        const style = section.style || {};
        const combined = { ...layout, ...style };

        // Apply background, padding, margin to the outer wrapper
        this.applyLayoutStyles(container, combined);

        // Responsive items-per-view via CSS variables
        const ipv = combined.items_per_view || { desktop: '6', tablet: '4', mobile: '4' };
        container.style.setProperty('--cat-cols-desktop', ipv.desktop || '6');
        container.style.setProperty('--cat-cols-tablet', ipv.tablet || '4');
        container.style.setProperty('--cat-cols-mobile', ipv.mobile || '4');

        // Optional section title + view-all link (skip generic placeholder names)
        const title = ''; // Hidden per user request
        const viewAllUrl = combined.view_all_url || '';
        let headerHtml = '';
        if (title) {
            headerHtml = `
                <div class="category-grid-header">
                    <h3 class="category-grid-title">${title}</h3>
                    ${viewAllUrl ? `<a href="${viewAllUrl}" class="view-all-btn">VIEW ALL</a>` : ''}
                </div>
            `;
        }

        container.innerHTML = `
            ${headerHtml}
            <div class="category-grid">
                ${categories.map(cat => `
                    <a href="/products.html?category=${cat.slug}" class="category-item">
                        <div class="category-icon">
                            <img src="${cat.image_url || cat.icon}" alt="${cat.name}">
                        </div>
                        <span class="category-name">${cat.name}</span>
                    </a>
                `).join('')}
            </div>
        `;
    },

    /**
     * Renders a Banner section.
     */
    async renderBanner(section, container) {
        const layout = section.layout || {};
        const style = layout.style || 'single';
        const banners = section.payload || [];
        if (banners.length === 0) return;

        let bannerClass = `banner-layout banner-style-${style}`;
        let html = `<div class="${bannerClass}">`;

        banners.forEach(banner => {
            const img = banner.image || banner.url; // Fallback for various payload structures
            if (!img) return; // Skip "ghost" sections without images

            const url = banner.url || banner.cta_url || banner.link || '#';

            if (style === 'overlay') {
                const isMobile = window.innerWidth <= 768;
                
                if (isMobile) {
                    html += `
                        <div class="banner-item overlay flipkart-mobile-banner" style="position: relative; border-radius: 12px; overflow: hidden; margin: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); min-height: 180px;">
                            <img src="${img}" alt="${banner.title || ''}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; z-index: 1;">
                            <div class="banner-overlay-gradient" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%); z-index: 2;"></div>
                            <div class="banner-content" style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 20px; z-index: 3; display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-start; box-sizing: border-box;">
                                ${banner.title ? `<h2 style="color: #fff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; line-height: 1.2; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${banner.title}</h2>` : ''}
                                ${banner.subtitle ? `<p style="color: #f0f0f0; font-size: 14px; margin: 0 0 16px 0; line-height: 1.4; opacity: 0.9; max-width: 90%; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${banner.subtitle}</p>` : ''}
                                ${banner.cta_text ? `<a href="${url}" class="btn" style="background: #fff; color: #2874f0; padding: 10px 24px; border-radius: 20px; font-weight: 600; font-size: 14px; text-decoration: none; text-transform: uppercase; box-shadow: 0 4px 8px rgba(0,0,0,0.2); transition: transform 0.2s;">${banner.cta_text}</a>` : ''}
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="banner-item overlay" style="position: relative;">
                            <img src="${img}" alt="${banner.title || ''}" style="width: 100%; display: block;">
                            <div class="banner-content" style="position: absolute; top: 50%; left: 50px; transform: translateY(-50%); z-index: 2;">
                                ${banner.title ? `<h2>${banner.title}</h2>` : ''}
                                ${banner.subtitle ? `<p>${banner.subtitle}</p>` : ''}
                                ${banner.cta_text ? `<a href="${url}" class="btn">${banner.cta_text}</a>` : ''}
                            </div>
                        </div>
                    `;
                }
            } else if (style === 'grid_gallery') {
                // Support col_span and row_span (1-12)
                const colSpan = banner.col_span || 12;
                const rowSpan = banner.row_span || 1;
                html += `
                    <div class="banner-item grid-item" style="grid-column: span ${colSpan}; grid-row: span ${rowSpan}">
                        <a href="${url}">
                            <img src="${img}" alt="${banner.alt || ''}">
                        </a>
                    </div>
                `;
            } else {
                html += `
                    <div class="banner-item">
                        <a href="${url}">
                            <img src="${img}" alt="${banner.alt || ''}">
                        </a>
                    </div>
                `;
            }
        });

        html += `</div>`;
        container.innerHTML = html;

        // Apply grid gallery specific style if needed
        if (style === 'grid_gallery') {
            const grid = container.querySelector('.banner-layout');
            const gap = layout.gap || '10px';
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = 'repeat(12, 1fr)';
            grid.style.gap = gap;
            // Same spacing on all four sides so background fills uniformly
            grid.style.padding = gap;
        }
    },

    /**
     * Renders an Image Carousel section.
     */
    async renderImageCarousel(section, container) {
        const items = section.payload || [];
        if (items.length === 0) return;

        const layout = section.layout || {};
        const style = section.style || {};
        const combined = { ...layout, ...style };
        
        const isMobile = window.innerWidth <= 768;
        this.applyLayoutStyles(container, combined);

        // Define items per view and gap
        let ipvMobile = combined.items_per_view?.mobile || 2;
        let ipvDesktop = combined.items_per_view?.desktop || 4;
        
        // Add 0.2 to mobile to show peek-a-boo effect
        const effectiveIpvMobile = parseFloat(ipvMobile) > 1 && parseFloat(ipvMobile) < 3 
            ? parseFloat(ipvMobile) + 0.2 
            : parseFloat(ipvMobile);
            
        const ipv = isMobile ? effectiveIpvMobile : ipvDesktop;
        const gap = parseInt(combined.gap) || 16;
        const title = ''; // Hidden per user request
        
        // Remove padding from container to give edge-to-edge scroll
        container.style.padding = '0';
        container.style.overflow = 'hidden'; // Ensure no x-scroll on body
        container.style.backgroundColor = '#FFFFFF';
        container.style.setProperty('background', '#FFFFFF', 'important');
        
        let html = '<div class="flipkart-img-carousel-container" style="background: transparent; margin: 12px 0; width: 100%;">';
        
        // Only show title if there is one and not a placeholder
        if (title && title.toLowerCase() !== 'untitled section' && title.toLowerCase() !== 'banner') {
            html += `
                <div class="flipkart-img-carousel-header" style="padding: 0 16px 12px; text-align: center;">
                    <h2 style="font-size: 16px; font-weight: 500; color: #212121; margin: 0; font-family: inherit; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</h2>
                </div>
            `;
        }

        const flexBasisCalc = `calc((100% - (${gap}px * (${ipv} - 1))) / ${ipv})`;

        html += `
            <div class="flipkart-img-carousel-wrapper" style="width: 100%; box-sizing: border-box; padding-left: 0px; padding-right: 0px;">
                <div class="flipkart-img-carousel-scroll" style="display: flex; width: 100%; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; -ms-overflow-style: none; gap: ${gap}px; padding: 0 16px 2px 16px; box-sizing: border-box; scroll-padding-inline: 16px;">
        `;
        
        items.forEach((item) => {
            const imgUrl = item.image || item.url || '';
            if (!imgUrl) return; // Skip items without images

            const url = item.cta_url || item.link || item.url || '#';
            
            html += `
                    <div class="flipkart-img-carousel-item" style="scroll-snap-align: center; flex: 0 0 ${flexBasisCalc}; min-width: 0;">
                        <a href="${url}" style="display: flex; align-items: center; justify-content: center; border-radius: 16px; overflow: hidden; position: relative; width: 100%; height: 100%;">
                            <img src="${imgUrl}" loading="lazy" style="width: 100%; height: 100%; object-fit: contain; display: block; margin: 0 auto;">
                        </a>
                    </div>
            `;
        });
        
        html += `
                </div>
            </div>
        </div>
        `;
        
        container.innerHTML = html;
        
        // Add CSS to hide scrollbar for webkit browsers
        if (!document.getElementById('flipkart-img-carousel-css')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'flipkart-img-carousel-css';
            styleEl.textContent = `
                .flipkart-img-carousel-scroll::-webkit-scrollbar {
                    display: none;
                }
            `;
            document.head.appendChild(styleEl);
        }
    },

    /**
     * Renders a Section Group recursively.
     */
    async renderSectionGroup(section, container) {
        const children = section.payload || [];
        if (!children || children.length === 0) return;

        let index = 0;
        for (const child of children) {
            await this.render(child, container, index++);
        }
    },

    /**
     * Renders Custom HTML/CSS/JS.
     */
    async renderCustom(section, container) {
        const payload = section.payload || {};
        if (payload.html) {
            container.innerHTML = payload.html;
        }
        if (payload.css) {
            const style = document.createElement('style');
            style.textContent = payload.css;
            document.head.appendChild(style);
        }
        if (payload.js) {
            const script = document.createElement('script');
            script.textContent = payload.js;
            document.body.appendChild(script);
        }
    }
};

window.SectionRenderer = SectionRenderer;
