#!/bin/bash

# Script to update the actual nginx configuration file
# Run with: sudo bash update-nginx-config.sh

NGINX_CONFIG="/etc/nginx/sites-available/amigpl.com"
BACKUP_FILE="/etc/nginx/sites-available/amigpl.com.backup"

echo "Updating nginx configuration for amigpl.com..."

# Backup existing config
if [ -f "$NGINX_CONFIG" ]; then
    cp "$NGINX_CONFIG" "$BACKUP_FILE"
    echo "Backup created at: $BACKUP_FILE"
fi

# Write new configuration
cat > "$NGINX_CONFIG" << 'EOF'
server {
    listen 80;
    listen [::]:80;
    
    server_name amigpl.com www.amigpl.com;
    
    access_log /www/wwwlogs/amigpl.com.log;
    error_log /www/wwwlogs/amigpl.com.error.log;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Security: deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

echo "Configuration updated!"

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "Configuration is valid. Reloading nginx..."
    nginx -s reload
    echo ""
    echo "✅ Nginx configuration updated and reloaded successfully!"
    echo "Your website should now be accessible at http://www.amigpl.com/"
else
    echo ""
    echo "❌ Nginx configuration has errors. Restoring backup..."
    if [ -f "$BACKUP_FILE" ]; then
        cp "$BACKUP_FILE" "$NGINX_CONFIG"
        echo "Backup restored."
    fi
    exit 1
fi

