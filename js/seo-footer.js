// SEO Footer / Brand Directory Renderer

// Flatten category tree up to a maximum depth level (0-indexed)
function flattenCategoryTreeUpToLevel(nodes, maxLevel = 5, currentLevel = 0) {
    let result = [];
    if (!Array.isArray(nodes)) return result;
    for (const node of nodes) {
        if (node.is_active === false) continue;
        result.push({ name: node.name, slug: node.slug });
        if (currentLevel < maxLevel && node.children && node.children.length > 0) {
            result = result.concat(flattenCategoryTreeUpToLevel(node.children, maxLevel, currentLevel + 1));
        }
    }
    return result;
}

async function fetchSeoDirectoryData() {
    let dynamicData = [];
    try {
        const [categoriesRes, brandsRes, tagsRes] = await Promise.all([
            fetch('/api/categories/index', { headers: { 'Accept': 'application/json' } }).catch(() => null),
            fetch('/api/brands', { headers: { 'Accept': 'application/json' } }).catch(() => null),
            fetch('/api/tags', { headers: { 'Accept': 'application/json' } }).catch(() => null)
        ]);

        if (categoriesRes && categoriesRes.ok) {
            const categoriesData = await categoriesRes.json();
            // /api/categories/index returns { success, data: { tree: [...], flat: [...] } }
            const tree = categoriesData && categoriesData.success && categoriesData.data && categoriesData.data.tree;
            if (tree && tree.length > 0) {
                // Flatten tree up to level 6 (maxLevel = 5, 0-indexed → levels 0..5 = 6 levels)
                const allCategories = flattenCategoryTreeUpToLevel(tree, 5);
                if (allCategories.length > 0) {
                    dynamicData.push({
                        label: "CATEGORIES",
                        links: allCategories.map(c => ({ text: c.name, url: `/categories.html?category=${encodeURIComponent(c.slug)}` }))
                    });
                }
            }
        }

        if (brandsRes && brandsRes.ok) {
            const brandsData = await brandsRes.json();
            if (brandsData.success && brandsData.data && brandsData.data.length > 0) {
                dynamicData.push({
                    label: "BRANDS",
                    links: brandsData.data.map(b => ({ text: b.name, url: `/brands.html?brand=${encodeURIComponent(b.slug)}` }))
                });
            }
        }

        if (tagsRes && tagsRes.ok) {
            const tagsData = await tagsRes.json();
            if (tagsData.success && tagsData.data && tagsData.data.length > 0) {
                dynamicData.push({
                    label: "TAGS",
                    links: tagsData.data.map(t => ({ text: t.name, url: `/tags.html?tag=${encodeURIComponent(t.slug)}` }))
                });
            }
        }
    } catch (e) {
        console.error('Failed to fetch SEO directory data:', e);
    }
    return dynamicData;
}

async function renderSeoFooter() {
    const seoData = await fetchSeoDirectoryData();

    // Create section element
    const section = document.createElement('section');
    section.className = 'seo-footer-section';

    // Create container
    const container = document.createElement('div');
    container.className = 'seo-footer-container';

    // Header
    const header = document.createElement('h2');
    header.className = 'seo-footer-header';
    header.textContent = 'Top Stories : Brand Directory';
    if (seoData.length === 0) {
        header.style.display = 'none';
    }
    container.appendChild(header);

    // Content wrapper
    const content = document.createElement('div');
    content.className = 'seo-footer-content';

    // Generate groups
    seoData.forEach(group => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'seo-footer-group';

        // Label
        const label = document.createElement('span');
        label.className = 'seo-footer-label';
        label.textContent = group.label + ':';
        groupDiv.appendChild(label);

        // Links
        const linksContainer = document.createElement('div');
        linksContainer.className = 'seo-footer-links';

        group.links.forEach((linkItem, index) => {
            const link = document.createElement('a');
            link.className = 'seo-footer-link';
            link.href = linkItem.url;
            link.textContent = linkItem.text;
            linksContainer.appendChild(link);

            // Add separator if not last item
            if (index < group.links.length - 1) {
                const sep = document.createElement('span');
                sep.className = 'seo-footer-separator';
                sep.textContent = ' | ';
                linksContainer.appendChild(sep);
            }
        });

        groupDiv.appendChild(linksContainer);
        content.appendChild(groupDiv);
    });

    container.appendChild(content);

    // Add Narrative Content Section (Dynamic Fetch)
    const narrativeContent = document.createElement('div');
    narrativeContent.className = 'seo-footer-narrative';
    narrativeContent.id = 'seoFooterNarrative';
    container.appendChild(narrativeContent);

    // Initial Loading/Fallback State
    renderFallbackSeoContent(narrativeContent);

    section.appendChild(container);

    // Append to body, preferably before the main footer script
    const mainFooter = document.querySelector('footer') || document.querySelector('#footer');
    const mainMain = document.querySelector('main');


    // Try to insert after <main> but before common footer logic/scripts
    if (mainMain) {
        mainMain.parentNode.insertBefore(section, mainMain.nextSibling);
    } else {
        document.body.appendChild(section);
    }

    // Fetch dynamic content
    fetchSeoContent();
}

async function fetchSeoContent() {
    const container = document.getElementById('seoFooterNarrative');
    if (!container) return;

    try {
        const response = await fetch('/api/pages/footer-content', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-API-Key': ''
            }
        });
        const data = await response.json();

        if (response.ok && data.success && data.data && data.data.content) {
            container.innerHTML = data.data.content;

            // Apply classes to dynamic content for styling consistency
            const headers = container.querySelectorAll('h1, h2, h3, h4');
            headers.forEach(h => {
                if (!h.classList.contains('seo-narrative-header')) h.classList.add('seo-narrative-header');
            });
            const paras = container.querySelectorAll('p');
            paras.forEach(p => {
                if (!p.classList.contains('seo-narrative-text')) p.classList.add('seo-narrative-text');
            });
            const links = container.querySelectorAll('a');
            links.forEach(link => {
                if (!link.classList.contains('seo-narrative-link')) link.classList.add('seo-narrative-link');
            });

        } else {
            // /* console.warn */('SEO Footer: API content empty or invalid, keeping fallback.');
            // No action needed, fallback already rendered
        }
    } catch (error) {
        // /* console.error */('SEO Footer: Error fetching content', error);
        // No action needed, fallback already rendered
    }
}

function renderFallbackSeoContent(container) {
    container.innerHTML = `
        <div class="seo-narrative-block">
            <h1 class="seo-narrative-header" style="font-size: 16px;">Mobitez Private Limited: India’s Smart Destination for Mobiles, Gadgets & Accessories</h1>
            <p class="seo-narrative-text">
                Welcome to Mobitez Private Limited, India’s fast-growing mobile and gadget marketplace built for today’s digital lifestyle. At Mobitez Private Limited, we bring together the latest smartphones, cutting-edge electronics, must-have accessories, and everyday tech essentials — all in one seamless platform. Whether you shop on the Mobitez Private Limited app or website, you get curated products, competitive prices, trusted sellers, and a smooth buying experience designed for modern Indian consumers. From flagship smartphones to budget-friendly gadgets, stylish accessories to smart devices, Mobitez Private Limited is your reliable companion for buying technology online — smarter, faster, and simpler.
            </p>
        </div>

        <div class="seo-narrative-block">
            <h2 class="seo-narrative-header" style="font-size: 16px;">What Can You Buy from Mobitez Private Limited?</h2>
            <p class="seo-narrative-text">
                Mobitez Private Limited offers a carefully selected range of products that balance innovation, affordability, and reliability. Explore categories built for every tech need and budget:
            </p>
        </div>

        <div class="seo-narrative-block">
            <h3 class="seo-narrative-header" style="font-size: 16px;">Mobiles & Smartphones</h3>
            <p class="seo-narrative-text">
                Discover the latest smartphones from top brands with powerful processors, advanced cameras, long-lasting batteries, and sleek designs. Mobitez Private Limited brings you flagship devices, mid-range performers, budget smartphones, 5G-ready phones, gaming mobiles, and refurbished options — all verified for quality. Compare models, check specifications, and choose the perfect phone that matches your lifestyle.
            </p>
        </div>

        <div class="seo-narrative-block">
            <h3 class="seo-narrative-header" style="font-size: 16px;">Mobile Accessories</h3>
            <p class="seo-narrative-text">
                Upgrade and protect your devices with high-quality accessories. Shop for durable back covers, tempered glass, fast chargers, power banks, wireless earbuds, headphones, Bluetooth speakers, smartwatches, fitness bands, phone holders, cables, adapters, and more. Mobitez Private Limited ensures compatibility, performance, and value with every accessory.
            </p>
        </div>

        <div class="seo-narrative-block">
            <h3 class="seo-narrative-header" style="font-size: 16px;">Laptops, Tablets & Computing</h3>
            <p class="seo-narrative-text">
                Power your work, study, and entertainment with laptops and tablets suited for every purpose. From lightweight notebooks and gaming laptops to tablets for learning and creativity, Mobitez Private Limited offers reliable computing solutions at competitive prices. Explore accessories like keyboards, mice, laptop bags, cooling pads, and monitors to complete your setup.
            </p>
        </div>

        <div class="seo-narrative-block">
            <h3 class="seo-narrative-header" style="font-size: 16px;">Smart Gadgets & Wearables</h3>
            <p class="seo-narrative-text">
                Step into the future with smart gadgets designed to simplify life. Browse smartwatches, fitness trackers, smart home devices, security cameras, streaming devices, and personal tech products that enhance convenience and productivity.
            </p>
        </div>

        <div class="seo-narrative-block">
            <h3 class="seo-narrative-header" style="font-size: 16px;">Home Tech & Electronics</h3>
            <p class="seo-narrative-text">
                Mobitez Private Limited also brings essential home electronics including smart TVs, soundbars, home audio systems, routers, printers, and everyday electronic accessories. Designed for performance and durability, these products add comfort and entertainment to your home.
            </p>
        </div>

        <div class="seo-narrative-block">
            <h3 class="seo-narrative-header" style="font-size: 16px;">Mobitez Private Limited Deals, Offers & Savings</h3>
            <p class="seo-narrative-text">
                Mobitez Private Limited believes great technology should be affordable. Enjoy regular deals, flash sales, festive discounts, combo offers, and exclusive app-only prices. Our pricing engine ensures you always get maximum value for your money, whether you’re upgrading your phone or buying everyday accessories.
            </p>
        </div>

        <div class="seo-narrative-block">
            <h3 class="seo-narrative-header" style="font-size: 16px;">Payment Options: Flexible & Secure</h3>
            <p class="seo-narrative-text">
                Shop confidently with multiple payment options:
            </p>
            <p class="seo-narrative-text">1. UPI, Credit & Debit Cards, Net Banking</p>
            <p class="seo-narrative-text">2. No Cost EMI on select smartphones and gadgets</p>
            <p class="seo-narrative-text">3. Pay Later options for flexible purchases</p>
            <p class="seo-narrative-text">
                All transactions on Mobitez Private Limited are protected with secure payment gateways and data encryption.
            </p>
        </div>

        <div class="seo-narrative-block">
            <h3 class="seo-narrative-header" style="font-size: 16px;">Fast Delivery & Easy Returns</h3>
            <p class="seo-narrative-text">
                Mobitez Private Limited partners with trusted logistics providers to ensure quick and reliable delivery across India. Enjoy doorstep delivery, order tracking, and hassle-free returns on eligible products. Customer satisfaction is at the core of everything we do.
            </p>
        </div>

        <div class="seo-narrative-block">
            <h3 class="seo-narrative-header" style="font-size: 16px;">Why Choose Mobitez Private Limited?</h3>
            <p class="seo-narrative-text">1. Curated Tech Selection: Only quality-checked mobiles, gadgets, and accessories</p>
            <p class="seo-narrative-text">2. Competitive Pricing: Best value with frequent offers and deals</p>
            <p class="seo-narrative-text">3. Mobile-First Experience: Clean, fast, and intuitive platform</p>
            <p class="seo-narrative-text">4. Trusted Sellers: Verified partners and transparent policies</p>
            <p class="seo-narrative-text">5. Secure Payments & Easy Returns</p>
            <p class="seo-narrative-text">6. Customer-Focused Support</p>
        </div>

        <div class="seo-narrative-block">
            <p class="seo-narrative-text">
                Mobitez Private Limited isn’t just an online store — it’s a smarter way to buy technology. Whether you’re upgrading your smartphone, accessorising your device, or exploring the latest gadgets, Mobitez Private Limited is here to power your digital life.
            </p>
            <p class="seo-narrative-text" style="font-weight: 500; margin-top: 10px;">
                Experience Smart Shopping. Experience Mobitez Private Limited.
            </p>
        </div>
    `;
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSeoFooter);
} else {
    renderSeoFooter();
}
