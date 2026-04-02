# Mobitez - Flipkart-like E-commerce Frontend

A modern, responsive e-commerce frontend built with Node.js and Express, designed to match Flipkart's user interface and experience.

## Features

- 🎨 Flipkart-like UI/UX design
- 📱 Fully responsive design
- 🔄 Infinite scroll for products
- 🛍️ Product browsing and cart functionality
- 🔍 Search functionality
- 🎯 Featured products section
- 🖼️ Banner carousel support
- ⚡ Fast and optimized performance

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure API (optional):
   - Create a `.env` file in the root directory
   - Add your API key if required:
   ```
   PORT=3000
   API_KEY=your-secret-api-key-here
   API_BASE_URL=https://mobitezapi.valuerkkda.com/api
   ```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
amigpl.com/
├── public/
│   ├── css/
│   │   └── style.css          # Main stylesheet
│   ├── js/
│   │   └── app.js             # Main JavaScript with API integration
│   ├── images/                # Image assets
│   └── index.html             # Homepage
├── server.js                  # Express server
├── package.json               # Dependencies
└── README.md                  # This file
```

## API Integration

The frontend integrates with the Mobitez API at `https://mobitezapi.valuerkkda.com/api`

### API Endpoints Used:

- `GET /api/products/featured` - Featured products
- `GET /api/products?page=1&per_page=20` - Paginated products
- `GET /api/banners` - Banner images
- `GET /api/categories/tree` - Category tree (optional)

### API Configuration

Update the API configuration in `public/js/app.js`:

```javascript
const API_CONFIG = {
    baseUrl: 'https://mobitezapi.valuerkkda.com/api',
    apiKey: '', // Add your API key here if required
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
};
```

## Nginx Configuration

If you're using Nginx as a reverse proxy, update your nginx configuration:

```nginx
server {
    listen 80;
    server_name amigpl.com www.amigpl.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Features Implementation

### Infinite Scroll
- Uses Intersection Observer API for better performance
- Automatically loads more products as user scrolls
- Shows loading indicators and end-of-list message

### Product Cards
- Displays product image, title, price, discount, and rating
- Add to cart and quick view buttons
- Responsive grid layout

### Search
- Search bar in header
- Enter key or button click to search
- (Search API integration can be added)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

To run in development mode with auto-reload:

```bash
npm run dev
```

## Production Deployment

1. Set environment variables
2. Build and optimize assets (if needed)
3. Start the server with PM2 or similar:
```bash
pm2 start server.js --name mobitez-frontend
```

## License

ISC

## Support

For API documentation, visit: https://mobitezapi.valuerkkda.com/

