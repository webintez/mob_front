#!/bin/bash

# Script to install Node.js and npm
# Run with: bash install-node.sh

echo "Installing Node.js and npm..."

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    echo "Node.js and npm installed successfully!"
    node --version
    npm --version
else
    echo "This script needs sudo privileges."
    echo "Please run: sudo bash install-node.sh"
    echo ""
    echo "Or install Node.js manually:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
fi

