#!/bin/bash

# Script to reload nginx configuration
# Run with: sudo bash reload-nginx.sh

echo "Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Configuration is valid. Reloading nginx..."
    nginx -s reload
    echo "Nginx reloaded successfully!"
    echo ""
    echo "Your website should now be accessible at http://www.amigpl.com/"
else
    echo "Nginx configuration has errors. Please fix them before reloading."
    exit 1
fi

