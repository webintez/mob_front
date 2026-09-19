const express = require('express');
const compression = require('compression');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3055;
const PUBLIC_DIR = fs.existsSync(path.join(__dirname, 'public')) ? path.join(__dirname, 'public') : __dirname;

// 0. Enable Gzip / Deflate Compression for all responses
app.use(compression());

// API Configuration
const API_CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'https://seller.mobitez.com/api',
  apiKey: process.env.API_KEY || 'mHRT3jvUD7tqSVy+iPIn3DE+wyuJXcBeLaPIjBGVHMo='
};

// Memory cache for pre-rendered category HTML fragment
const categoriesCache = {
  html: null,
  timestamp: 0
};
const CACHE_TTL = 3600000; // 1 hour Cache duration (in milliseconds)

// Helper function to fetch menus from API using standard Node https
function fetchMenusFromApi() {
  return new Promise((resolve, reject) => {
    // Extract hostname and path from API_CONFIG.baseUrl
    let hostname = 'seller.mobitez.com';
    let apiPath = '/api/menus';
    
    try {
      const urlObj = new URL(`${API_CONFIG.baseUrl}/menus`);
      hostname = urlObj.hostname;
      apiPath = urlObj.pathname + urlObj.search;
    } catch (err) {
      console.error('URL Parsing Error:', err);
    }

    const options = {
      hostname: hostname,
      port: 443,
      path: apiPath,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': API_CONFIG.apiKey
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`API responded with status code: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
}

// Helper to resolve dynamic icons matching js/app.js rules
function getMenuIcon(menu) {
  const nameLower = (menu.name || '').toLowerCase();
  const iconMap = {
    'home': 'fas fa-home',
    'smartphones': 'fas fa-mobile-alt',
    'mobile accessories': 'fas fa-headphones',
    'smart watches': 'fas fa-clock',
    'laptops': 'fas fa-laptop',
    'tablets': 'fas fa-tablet-alt',
    'brands': 'fas fa-tags',
    'sell': 'fas fa-mobile-alt',
    'repair': 'fas fa-tools',
    'stores': 'fas fa-store'
  };
  return iconMap[nameLower] || 'fas fa-box';
}

// Escape HTML utility (prevents XSS)
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 1. SSR Homepage Categories Injection — MUST be registered BEFORE express.static middleware
app.get(['/', '/index.html'], async (req, res) => {
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  try {
    const now = Date.now();
    let renderedHtml = '';

    // Check memory cache first
    if (categoriesCache.html && (now - categoriesCache.timestamp < CACHE_TTL)) {
      renderedHtml = categoriesCache.html;
    } else {
      console.log(`[SSR] Fetching fresh homepage menus at ${new Date().toISOString()}`);
      const result = await fetchMenusFromApi();
      if (result && result.success && Array.isArray(result.data)) {
        renderedHtml = result.data.map((menu, index) => {
          const isActive = index === 0 ? 'active' : '';
          const name = menu.name || '';
          const nameLower = name.toLowerCase();

          let href = '#';
          if (nameLower === 'mobiles' || nameLower === 'smartphones') {
            href = '/group.html?slug=mobile-page';
          } else if (menu.url && menu.url.trim() !== '') {
            href = menu.url;
          } else {
            const slug = nameLower.replace(/\s+/g, '-');
            if (menu.type === 'category') {
              href = `/categories.html?category=${encodeURIComponent(slug)}`;
            } else if (menu.type === 'page') {
              href = `/page/${encodeURIComponent(slug)}`;
            } else {
              href = menu.url || '/';
            }
          }

          const icon = getMenuIcon(menu);
          let iconHtml = '';
          if (menu.image_url) {
            iconHtml = `
              <img src="${escapeHtml(menu.image_url)}" 
                   alt="${escapeHtml(menu.name)}" 
                   class="homepage-category-icon-image" 
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <i class="${icon} homepage-category-icon-fallback" style="display: none;"></i>
            `;
          } else {
            iconHtml = `<i class="${icon} homepage-category-icon-fallback"></i>`;
          }

          const hasDropdown = menu.type === 'category' || nameLower.includes('brand');
          const dropdownIcon = hasDropdown ? '<i class="fas fa-chevron-down" style="font-size: 10px; margin-left: 4px;"></i>' : '';

          return `
            <a href="${href}" class="homepage-category-item ${isActive}" data-menu-id="${menu.id}" data-menu-type="${menu.type || 'link'}">
              <div class="homepage-category-icon-wrapper">
                ${iconHtml}
              </div>
              <span class="homepage-category-name">${escapeHtml(name)}${dropdownIcon}</span>
            </a>
          `;
        }).join('\n');

        // Cache the output
        categoriesCache.html = renderedHtml;
        categoriesCache.timestamp = now;
      }
    }

    // Read index.html template and inject renderedHtml
    let htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // Cleanly replace entire skeleton within homepageCategoriesNav container
    const categoriesContainerPattern = /<div class="homepage-categories-container" id="homepageCategoriesNav">[\s\S]*?<\/section>/;

    if (renderedHtml) {
      if (categoriesContainerPattern.test(htmlContent)) {
        htmlContent = htmlContent.replace(
          categoriesContainerPattern,
          `<div class="homepage-categories-container" id="homepageCategoriesNav">\n${renderedHtml}\n            </div>\n        </section>`
        );
      }
    }

    res.send(htmlContent);
  } catch (error) {
    console.error('[SSR] Generation Failed:', error.message);
    res.sendFile(indexPath); // Fallback: Serve static skeleton layout on failure
  }
});

// Middleware
app.use(express.static(PUBLIC_DIR, {
  maxAge: '7d',
  etag: true
}));

// Handle JSON and URL-encoded bodies, but skip for multipart/form-data
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    // Skip body parsing for multipart/form-data - we'll stream it directly
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    // Skip URL-encoded parsing for multipart/form-data
    next();
  } else {
    express.urlencoded({ extended: true })(req, res, next);
  }
});

// CORS middleware for API proxy
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Mock Videos API - Returning empty data to prevent 404 errors on homepage
app.get('/api/videos', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        title: "Galaxy S24 Ultra Review",
        thumbnail_url: "https://images.unsplash.com/photo-1610945415295-d9baf060e871?auto=format&fit=crop&w=400&h=700",
        video_url: "https://www.youtube.com/shorts/dQw4w9WgXcQ"
      },
      {
        id: 2,
        title: "iPhone 15 Pro Max Hands-on",
        thumbnail_url: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=400&h=700",
        video_url: "https://www.youtube.com/shorts/dQw4w9WgXcQ"
      },
      {
        id: 3,
        title: "Nothing Phone (2) aesthetic",
        thumbnail_url: "https://images.unsplash.com/photo-1533228100845-08145b01de14?auto=format&fit=crop&w=400&h=700",
        video_url: "https://www.youtube.com/shorts/dQw4w9WgXcQ"
      }
    ]
  });
});

// Mock SEO Footer Content API
app.get('/api/pages/footer-content', (req, res) => {
  res.json({
    success: true,
    data: {
      content: `
        <div class="seo-narrative-block">
          <h1 class="seo-narrative-header">Mobitez: The Ultimate Destination for Tech Enthusiasts</h1>
          <p class="seo-narrative-text">Welcome to Mobitez, your one-stop shop for the latest in mobile technology. We pride ourselves on offering a wide selection of smartphones, tablets, and accessories from the world's leading brands.</p>
          <h2 class="seo-narrative-header">Why Choose Us?</h2>
          <p class="seo-narrative-text">With over a decade of experience in the mobile industry, we understand what our customers need: quality products, competitive prices, and exceptional service.</p>
        </div>
      `
    }
  });
});

// In-memory catalog cache for heavy read-only API proxy endpoints
const apiProxyCache = new Map();
const API_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isCacheableApiRequest(req) {
  if (req.method !== 'GET') return false;
  // Do not cache authenticated or user-specific requests
  if (req.headers['authorization'] || req.headers['Authorization']) return false;
  const p = req.path;
  return (
    p.startsWith('/categories') ||
    p.startsWith('/menus') ||
    p.startsWith('/brands') ||
    p.startsWith('/tags') ||
    p.startsWith('/section-groups') ||
    p.startsWith('/flash-sales')
  );
}

// API Proxy - Forward all /api/* requests to the actual API
app.use('/api', async (req, res) => {
  try {
    const apiPath = req.path;
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const apiUrl = `${API_CONFIG.baseUrl}${apiPath}${queryString}`;
    const cacheKey = `${req.method}:${req.originalUrl}`;

    // Return cached response if available
    if (isCacheableApiRequest(req)) {
      const cached = apiProxyCache.get(cacheKey);
      if (cached && (Date.now() - cached.time < API_CACHE_TTL)) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Content-Type', 'application/json');
        res.header('X-Proxy-Cache', 'HIT');
        return res.status(cached.status).send(cached.data);
      }
    }

    // Log incoming request
    console.log(`[${new Date().toISOString()}] Proxying: ${req.method} ${apiPath}${queryString}`);

    // Prepare request options
    const url = new URL(apiUrl);
    const isMultipart = req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data');

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'X-API-Key': API_CONFIG.apiKey
      }
    };

    // Add Content-Type if provided (for multipart, preserve the boundary)
    if (req.headers['content-type']) {
      options.headers['Content-Type'] = req.headers['content-type'];
    } else if (!isMultipart) {
      options.headers['Content-Type'] = 'application/json';
    }

    // Add Authorization header if provided (case-insensitive check)
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader) {
      options.headers['Authorization'] = authHeader;
      console.log('Forwarding Authorization header to API');
    }

    // Add Content-Length if provided
    if (req.headers['content-length']) {
      options.headers['Content-Length'] = req.headers['content-length'];
    }

    // Set timeout for the request (30 seconds)
    const requestTimeout = 30000;
    let requestTimedOut = false;
    let timeout = null;

    // Make request to API
    const apiReq = https.request(options, (apiRes) => {
      if (requestTimedOut) {
        return; // Don't process response if already timed out
      }
      let data = '';

      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        if (timeout) {
          clearTimeout(timeout);
        }
        if (requestTimedOut || res.headersSent) {
          return;
        }

        // Set CORS headers
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Content-Type', 'application/json');

        // Log API response for debugging
        if (apiRes.statusCode >= 400) {
          console.error(`API Error [${apiRes.statusCode}]: ${req.method} ${apiPath}${queryString}`);
          console.error(`Full API URL: ${apiUrl}`);
        } else {
          console.log(`API Success [${apiRes.statusCode}]: ${req.method} ${apiPath}${queryString}`);
        }

        // Cache successful read-only catalog responses
        if (apiRes.statusCode === 200 && isCacheableApiRequest(req)) {
          apiProxyCache.set(cacheKey, {
            data: data,
            status: 200,
            time: Date.now()
          });
        }

        // Forward status code
        res.status(apiRes.statusCode);

        // Send response
        res.send(data);
      });
    });

    // Set timeout
    timeout = setTimeout(() => {
      requestTimedOut = true;
      apiReq.destroy();
      console.error('API Request Timeout:', `${req.method} ${apiPath}${queryString}`);
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          message: 'API request timeout',
          error: 'Request took too long to complete'
        });
      }
    }, requestTimeout);

    apiReq.on('error', (error) => {
      clearTimeout(timeout);
      if (requestTimedOut || res.headersSent) {
        return;
      }
      console.error('API Proxy Connection Error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error connecting to API server',
        error: error.message
      });
    });

    // Handle request body
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      if (isMultipart) {
        req.pipe(apiReq);
      } else {
        if (req.body && Object.keys(req.body).length > 0) {
          const jsonBody = JSON.stringify(req.body);
          apiReq.write(jsonBody);
        }
        apiReq.end();
      }
    } else {
      apiReq.end();
    }

  } catch (error) {
    console.error('Proxy Error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
});

// Serve categories page
app.get('/categories.html', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'categories.html'));
});

// Serve category page
app.get('/category/:slug', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'categories.html'));
});

// Serve specific HTML files
app.get('/product.html', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'product.html'));
});

// Serve product page for /product/:slug routes
app.get('/product/:slug', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'product.html'));
});

// Serve cart page
app.get('/cart.html', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'cart.html'));
});

// Serve wishlist page
app.get('/wishlist.html', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'wishlist.html'));
});

// Serve login page
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
});

// Serve checkout page
app.get('/checkout.html', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'checkout.html'));
});

// Serve orders list page
app.get('/orders.html', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'orders.html'));
});

// Serve order details page
app.get('/order.html', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'order.html'));
});

// Serve profile page
app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'profile.html'));
});

// Serve signup page
app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'signup.html'));
});

// Serve cancel order page
app.get('/cancel-order.html', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'cancel-order.html'));
});

// Serve compare page
app.get('/compare.html', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'compare.html'));
});

// Serve search page
app.get('/search.html', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'search.html'));
});

// Serve dynamic page for /page/:slug routes
app.get('/page/:slug', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'page.html'));
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API Proxy configured for: ${API_CONFIG.baseUrl}`);
});
