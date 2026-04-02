#!/bin/bash

# Setup script for Mobitez Frontend
# This script will:
# 1. Install dependencies
# 2. Start the Node.js server
# 3. Install systemd service
# 4. Update Nginx configuration

cd /home/webintez/amigpl.com

echo "=== Setting up Mobitez Frontend ==="
echo ""

# Step 1: Install dependencies
echo "1. Installing dependencies..."
npm install

# Step 2: Check if Node.js server is running
echo ""
echo "2. Checking Node.js server..."
if pgrep -f "node.*server.js" > /dev/null; then
    echo "   ✓ Node.js server is already running"
else
    echo "   Starting Node.js server..."
    nohup node server.js > /tmp/mobitez-server.log 2>&1 &
    sleep 2
    if pgrep -f "node.*server.js" > /dev/null; then
        echo "   ✓ Node.js server started successfully"
    else
        echo "   ✗ Failed to start Node.js server. Check /tmp/mobitez-server.log"
    fi
fi

# Step 3: Install systemd service
echo ""
echo "3. Installing systemd service..."
if [ -f "mobitez-frontend.service" ]; then
    sudo cp mobitez-frontend.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable mobitez-frontend
    sudo systemctl restart mobitez-frontend
    echo "   ✓ Systemd service installed and started"
else
    echo "   ✗ Service file not found"
fi

# Step 4: Update Nginx configuration
echo ""
echo "4. Updating Nginx configuration..."
if [ -f "nginx.conf" ]; then
    # Check if aaPanel is being used
    if [ -f "/etc/nginx/sites-available/amigpl.com" ]; then
        echo "   Found aaPanel Nginx config, updating..."
        sudo cp nginx.conf /etc/nginx/sites-available/amigpl.com
        sudo nginx -t && sudo systemctl reload nginx
        echo "   ✓ Nginx configuration updated and reloaded"
    else
        echo "   Creating new Nginx configuration..."
        sudo cp nginx.conf /etc/nginx/sites-available/amigpl.com
        sudo ln -sf /etc/nginx/sites-available/amigpl.com /etc/nginx/sites-enabled/amigpl.com
        sudo nginx -t && sudo systemctl reload nginx
        echo "   ✓ Nginx configuration created and enabled"
    fi
else
    echo "   ✗ nginx.conf not found"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "The website should now be accessible at:"
echo "  http://www.amigpl.com/"
echo "  http://amigpl.com/"
echo ""
echo "To check server status:"
echo "  sudo systemctl status mobitez-frontend"
echo ""
echo "To view server logs:"
echo "  tail -f /tmp/mobitez-server.log"



