// SEO Footer / Brand Directory Renderer

const SEO_FOOTER_DATA = [
    {
        label: "MOST SEARCHED FOR ON MOBITEZ",
        links: [
            "iPhone 15 Pro", "Samsung S24 Ultra", "Pixel 8 Pro", "OnePlus 12", "Realme 12 Pro+", "Redmi Note 13 Pro",
            "Vivo X100", "Oppo Reno 11", "Nothing Phone 2a", "Motorola Edge 40", "Poco X6 Pro", "Infinix Note 40",
            "Apple Watch Ultra 2", "Samsung Galaxy Watch 6", "AirPods Pro 2", "Sony WH-1000XM5", "JBL Flip 6",
            "boAt Airdopes", "Noise Smartwatch", "Laptop deals", "Gaming Laptops", "Asus ROG", "MacBook Air M2",
            "HP Pavilion", "Dell Inspiron", "Acer Nitro", "Lenovo Legion", "iPad Air 5", "Samsung Galaxy Tab S9"
        ]
    },
    {
        label: "MOBILES",
        links: [
            "iPhone 15", "iPhone 14", "iPhone 13", "Samsung Galaxy S23 FE", "Samsung Galaxy A54", "Samsung Galaxy M34",
            "Realme 11 Pro", "Realme Narzo 60", "Redmi 13C", "Redmi 12 5G", "Poco C65", "Poco M6 Pro", "Vivo V29",
            "Vivo T2 Pro", "Oppo F25 Pro", "Oppo A79", "Motorola G84", "Motorola G54", "Infinix Smart 8", "Infinix Hot 40i",
            "Tecno Spark 20", "Tecno Pova 6", "Google Pixel 7a", "Google Pixel 8", "OnePlus 12R", "OnePlus Nord CE 3"
        ]
    },
    {
        label: "CAMERA",
        links: [
            "GoPro Hero 12", "Insta360 Ace Pro", "DJI Osmo Action 4", "Sony Alpha a7 IV", "Canon EOS R6 Mark II",
            "Nikon Z8", "Fujifilm X-T5", "Panasonic Lumix S5II", "Sony ZV-E10", "Canon EOS R50", "Nikon Z fc",
            "Action Cameras", "DSLR Cameras", "Mirrorless Cameras", "Camera Tripods", "Camera Lenses", "Camera Bags"
        ]
    },
    {
        label: "LAPTOPS",
        links: [
            "MacBook Pro M3", "MacBook Air M1", "Asus Vivobook", "Asus Zenbook", "Asus TUF Gaming", "HP Victus",
            "HP Spectre x360", "HP Envy", "Dell XPS 13", "Dell Alienware", "Acer Predator Helios", "Acer Swift",
            "Lenovo Yoga", "Lenovo ThinkPad", "Lenovo IdeaPad", "MSI Katana", "MSI Cyborg", "Samsung Galaxy Book 4",
            "Microsoft Surface Laptop 5", "Microsoft Surface Pro 9", "Gaming Laptops beneath 50000", "Student Laptops"
        ]
    },
    {
        label: "TVS",
        links: [
            "Samsung QLED TV", "Samsung Neo QLED", "LG OLED TV", "Sony Bravia XR", "Sony OLED TV", "OnePlus TV Q2 Pro",
            "Xiaomi Smart TV X Pro", "Redmi Smart TV Fire", "Realme Smart TV", "TCL QLED TV", "Hisense Laser TV",
            "Vu GloLED TV", "Acer Support TV", "Toshiba TV", "Infinix TV", "Thomson TV", "Blaupunkt TV", "32 Inch Smart TV",
            "43 Inch 4K TV", "55 Inch 4K TV", "65 Inch Big Screen TV", "8K TV", "Android TV", "Google TV"
        ]
    },
    {
        label: "AUDIO",
        links: [
            "Sony Headphones", "Bose QuietComfort", "Sennheiser Momentum", "JBL Tour One", "Sony WF-1000XM5",
            "Apple AirPods 3", "Samsung Galaxy Buds 2 Pro", "OnePlus Buds 3", "Realme Buds Air 5", "Oppo Enco Air 3",
            "boAt Rockerz", "Noise Buds", "Boult Audio", "Mivi DuoPods", "Bluetooth Speakers", "Soundbars",
            "Home Theatre Systems", "Party Speakers", "Wired Earphones", "True Wireless Earbuds"
        ]
    },
    {
        label: "SMART WATCHES",
        links: [
            "Apple Watch Series 9", "Apple Watch SE", "Samsung Galaxy Watch 6 Classic", "Pixel Watch 2", "Garmin Fenix 7",
            "Garmin Epix Gen 2", "Fitbit Charge 6", "Amazfit GTR 4", "Amazfit Active", "Noise ColorFit Pro 5",
            "boAt Ultima Chronos", "Fire-Boltt Oracle", "Fastrack Reflex", "Titan Smart", "Fossil Gen 6",
            "Smart Watches for Men", "Smart Watches for Women", "Kids Smart Watches", "Fitness Bands"
        ]
    },
    {
        label: "FURNITURE",
        links: [
            "Furniture", "Beds", "Dining sets", "Wardrobes", "TV Units", "Tables", "Chairs", "Shelves", "Bean Bags",
            "Office Chairs", "Computer Table", "Office Tables", "Red Sofa", "Wakefit Beds", "White Sofa",
            "Wakefit Mattress", "Green Sofa", "Black Sofa", "Brown Sofa"
        ]
    },
    {
        label: "BGMH",
        links: [
            "Car Accessories", "Bike Accessories", "Car Dashcams", "Vehicle Battery", "Engine Oil", "Car Air Fresheners",
            "Shampoo", "Whey Protein", "Homeopathy", "Cricket", "Cycles", "Footballs", "Treadmills", "Fitness Accessories",
            "Online Guitar", "Books Store", "Musical Instrument Store", "Energy Drinks", "Milk Drink Mixes", "Protein Supplements"
        ]
    }
];

function renderSeoFooter() {
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
    container.appendChild(header);

    // Content wrapper
    const content = document.createElement('div');
    content.className = 'seo-footer-content';

    // Generate groups
    SEO_FOOTER_DATA.forEach(group => {
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

        group.links.forEach((linkText, index) => {
            const link = document.createElement('a');
            link.className = 'seo-footer-link';
            link.href = `/search.html?q=${encodeURIComponent(linkText)}`; // Link to search
            link.textContent = linkText;
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
        const response = await fetch('/api/pages/footer-content');
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
            <h1 class="seo-narrative-header" style="font-size: 16px;">Mobitez: India’s Smart Destination for Mobiles, Gadgets & Accessories</h1>
            <p class="seo-narrative-text">
                Welcome to Mobitez, India’s fast-growing mobile and gadget marketplace built for today’s digital lifestyle. At Mobitez, we bring together the latest smartphones, cutting-edge electronics, must-have accessories, and everyday tech essentials — all in one seamless platform. Whether you shop on the Mobitez app or website, you get curated products, competitive prices, trusted sellers, and a smooth buying experience designed for modern Indian consumers. From flagship smartphones to budget-friendly gadgets, stylish accessories to smart devices, Mobitez is your reliable companion for buying technology online — smarter, faster, and simpler.
            </p>
        </div>

        <div class="seo-narrative-block">
            <h2 class="seo-narrative-header" style="font-size: 16px;">What Can You Buy from Mobitez?</h2>
            <p class="seo-narrative-text">
                Mobitez offers a carefully selected range of products that balance innovation, affordability, and reliability. Explore categories built for every tech need and budget:
            </p>
        </div>

        <div class="seo-narrative-block">
            <h3 class="seo-narrative-header" style="font-size: 16px;">Mobiles & Smartphones</h3>
            <p class="seo-narrative-text">
                Discover the latest smartphones from top brands with powerful processors, advanced cameras, long-lasting batteries, and sleek designs. Mobitez brings you flagship devices, mid-range performers, budget smartphones, 5G-ready phones, gaming mobiles, and refurbished options — all verified for quality. Compare models, check specifications, and choose the perfect phone that matches your lifestyle.
            </p>
        </div>

        <div class="seo-narrative-block">
            <h3 class="seo-narrative-header" style="font-size: 16px;">Mobile Accessories</h3>
            <p class="seo-narrative-text">
                Upgrade and protect your devices with high-quality accessories. Shop for durable back covers, tempered glass, fast chargers, power banks, wireless earbuds, headphones, Bluetooth speakers, smartwatches, fitness bands, phone holders, cables, adapters, and more. Mobitez ensures compatibility, performance, and value with every accessory.
            </p>
        </div>

        <div class="seo-narrative-block">
            <h3 class="seo-narrative-header" style="font-size: 16px;">Laptops, Tablets & Computing</h3>
            <p class="seo-narrative-text">
                Power your work, study, and entertainment with laptops and tablets suited for every purpose. From lightweight notebooks and gaming laptops to tablets for learning and creativity, Mobitez offers reliable computing solutions at competitive prices. Explore accessories like keyboards, mice, laptop bags, cooling pads, and monitors to complete your setup.
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
                Mobitez also brings essential home electronics including smart TVs, soundbars, home audio systems, routers, printers, and everyday electronic accessories. Designed for performance and durability, these products add comfort and entertainment to your home.
            </p>
        </div>

        <div class="seo-narrative-block">
            <h3 class="seo-narrative-header" style="font-size: 16px;">Mobitez Deals, Offers & Savings</h3>
            <p class="seo-narrative-text">
                Mobitez believes great technology should be affordable. Enjoy regular deals, flash sales, festive discounts, combo offers, and exclusive app-only prices. Our pricing engine ensures you always get maximum value for your money, whether you’re upgrading your phone or buying everyday accessories.
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
                All transactions on Mobitez are protected with secure payment gateways and data encryption.
            </p>
        </div>

        <div class="seo-narrative-block">
            <h3 class="seo-narrative-header" style="font-size: 16px;">Fast Delivery & Easy Returns</h3>
            <p class="seo-narrative-text">
                Mobitez partners with trusted logistics providers to ensure quick and reliable delivery across India. Enjoy doorstep delivery, order tracking, and hassle-free returns on eligible products. Customer satisfaction is at the core of everything we do.
            </p>
        </div>

        <div class="seo-narrative-block">
            <h3 class="seo-narrative-header" style="font-size: 16px;">Why Choose Mobitez?</h3>
            <p class="seo-narrative-text">1. Curated Tech Selection: Only quality-checked mobiles, gadgets, and accessories</p>
            <p class="seo-narrative-text">2. Competitive Pricing: Best value with frequent offers and deals</p>
            <p class="seo-narrative-text">3. Mobile-First Experience: Clean, fast, and intuitive platform</p>
            <p class="seo-narrative-text">4. Trusted Sellers: Verified partners and transparent policies</p>
            <p class="seo-narrative-text">5. Secure Payments & Easy Returns</p>
            <p class="seo-narrative-text">6. Customer-Focused Support</p>
        </div>

        <div class="seo-narrative-block">
            <p class="seo-narrative-text">
                Mobitez isn’t just an online store — it’s a smarter way to buy technology. Whether you’re upgrading your smartphone, accessorising your device, or exploring the latest gadgets, Mobitez is here to power your digital life.
            </p>
            <p class="seo-narrative-text" style="font-weight: 500; margin-top: 10px;">
                Experience Smart Shopping. Experience Mobitez.
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
