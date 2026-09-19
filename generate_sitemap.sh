#!/bin/bash

# =================================================================
# Mobitez Sitemap Generator (API-Based)
# This script fetches dynamic slugs from /api/sitemap and 
# combines them with static pages to generate sitemap.xml.
# =================================================================

# Configuration
BASE_URL="https://mobitez.com"
API_URL="${BASE_URL}/api/sitemap"
OUTPUT_FILE="/home/u934861248/domains/mobitez.com/public_html/sitemap.xml"
ROBOTS_FILE="/home/u934861248/domains/mobitez.com/public_html/robots.txt"
DATE=$(date +%Y-%m-%d)

echo "[$DATE] Starting sitemap generation..."

# Fetch API data with error checking
JSON_DATA=$(curl -sL "$API_URL")

if [[ $? -ne 0 ]] || [[ -z "$JSON_DATA" ]] || [[ "$JSON_DATA" != *"\"success\":true"* ]]; then
    echo "[$DATE] Error: Failed to fetch data from API. Response empty or success=false."
    echo "[$DATE] Debug: API URL is $API_URL"
    # Fallback to local files if API fails (Optional)
    exit 1
fi

# Start sitemap
cat <<EOF > "$OUTPUT_FILE"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
EOF

# Function to add a URL to the sitemap
add_url() {
    local path=$1
    local priority=$2
    local changefreq=$3
    
    echo "  <url>" >> "$OUTPUT_FILE"
    echo "    <loc>${BASE_URL}${path}</loc>" >> "$OUTPUT_FILE"
    echo "    <lastmod>${DATE}</lastmod>" >> "$OUTPUT_FILE"
    echo "    <changefreq>${changefreq}</changefreq>" >> "$OUTPUT_FILE"
    echo "    <priority>${priority}</priority>" >> "$OUTPUT_FILE"
    echo "  </url>" >> "$OUTPUT_FILE"
}

# Function to extract slugs from JSON array
extract_slugs() {
    local key=$1
    echo "$JSON_DATA" | grep -o "\"$key\":\[[^]]*\]" | grep -o '"[^"]*"' | sed 's/"//g' | grep -v "^$key$"
}

# 1. FIXED STATIC PAGES
# -----------------------------------------------------------------
echo "Adding static pages..."
add_url "/" "1.0" "daily"
add_url "/all-categories.html" "0.9" "daily"
add_url "/brands.html" "0.9" "daily"
add_url "/tags.html" "0.9" "daily"
add_url "/blog.html" "0.8" "daily"
add_url "/contact.html" "0.5" "monthly"
add_url "/faq.html" "0.5" "monthly"

# 2. DYNAMIC PAGES FROM API
# -----------------------------------------------------------------

# Products
echo "Adding products..."
extract_slugs "products" | while read -r slug; do
    if [[ -n "$slug" ]]; then
        add_url "/product.html?slug=$slug" "0.9" "daily"
    fi
done

# Categories
echo "Adding categories..."
extract_slugs "categories" | while read -r slug; do
    if [[ -n "$slug" ]]; then
        add_url "/categories.html?category=$slug" "0.8" "weekly"
    fi
done

# Brands
echo "Adding brand filters..."
extract_slugs "brands" | while read -r slug; do
    if [[ -n "$slug" ]]; then
        add_url "/brands.html?brand=$slug" "0.8" "weekly"
    fi
done

# Tags
echo "Adding tag filters..."
extract_slugs "tags" | while read -r slug; do
    if [[ -n "$slug" ]]; then
        add_url "/tags.html?tag=$slug" "0.7" "weekly"
    fi
done

# Section Groups
echo "Adding section groups..."
extract_slugs "section_groups" | while read -r slug; do
    if [[ -n "$slug" ]]; then
        add_url "/group.html?slug=$slug" "0.8" "weekly"
    fi
done

# Close sitemap
echo "</urlset>" >> "$OUTPUT_FILE"

# 3. UPDATE ROBOTS.TXT
# -----------------------------------------------------------------
if [[ ! -f "$ROBOTS_FILE" ]] || ! grep -q "Sitemap:" "$ROBOTS_FILE"; then
    echo "Updating robots.txt..."
    cat <<EOF > "$ROBOTS_FILE"
User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
EOF
fi

echo "[$DATE] Sitemap generation complete. Output: $OUTPUT_FILE"
chmod +x "$0" 2>/dev/null
