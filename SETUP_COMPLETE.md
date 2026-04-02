# Setup Complete! ✅

Your Node.js frontend is now set up and running. Here's what has been done:

## ✅ Completed Steps

1. **Node.js Installed** - Node.js v18.20.8 installed via nvm
2. **Dependencies Installed** - All npm packages installed successfully
3. **Server Running** - Node.js server is running on port 3001
4. **Nginx Configured** - nginx.conf updated to proxy to Node.js server

## 🔧 Final Steps Required

### 1. Reload Nginx Configuration

You need to reload nginx to apply the new configuration. Run:

```bash
sudo nginx -t          # Test configuration
sudo nginx -s reload   # Reload nginx
```

Or if using systemctl:
```bash
sudo systemctl reload nginx
```

### 2. Verify Server is Running

Check if the server is running:
```bash
ps aux | grep "node server.js"
```

If it's not running, start it:
```bash
cd /home/webintez/amigpl.com
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nohup node server.js > server.log 2>&1 &
```

### 3. Test the Website

After reloading nginx, test the website:
- Open http://www.amigpl.com/ in your browser
- You should see the Mobitez homepage

## 📝 Server Management

### Start Server
```bash
cd /home/webintez/amigpl.com
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
node server.js
```

### Stop Server
```bash
pkill -f "node server.js"
```

### View Logs
```bash
tail -f /home/webintez/amigpl.com/server.log
```

## 🔄 Keep Server Running (Optional)

### Option 1: Use PM2 (Recommended)

Install PM2:
```bash
npm install -g pm2
```

Start with PM2:
```bash
cd /home/webintez/amigpl.com
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
pm2 start server.js --name mobitez-frontend
pm2 save
pm2 startup
```

### Option 2: Use Systemd Service

Copy the service file:
```bash
sudo cp /home/webintez/amigpl.com/mobitez-frontend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mobitez-frontend
sudo systemctl start mobitez-frontend
```

### Option 3: Use Cron (Simple)

Add to crontab to check every 5 minutes:
```bash
crontab -e
# Add this line:
*/5 * * * * /home/webintez/amigpl.com/keep-alive.sh
```

## 🔑 API Key Configuration (If Required)

If your API requires an API key, edit `/home/webintez/amigpl.com/public/js/app.js`:

```javascript
const API_CONFIG = {
    baseUrl: 'https://mobitezapi.valuerkkda.com/api',
    apiKey: 'your-api-key-here',  // Add your API key here
    // ...
};
```

## 🌐 Current Configuration

- **Server Port**: 3001 (changed from 3000 because port 3000 was in use)
- **Nginx Proxy**: Configured to proxy http://localhost:3001
- **API Base URL**: https://mobitezapi.valuerkkda.com/api
- **Document Root**: /home/webintez/amigpl.com/public

## 📊 Server Status

Check server status:
```bash
curl http://localhost:3001
```

## 🐛 Troubleshooting

### Server not responding?
1. Check if server is running: `ps aux | grep "node server.js"`
2. Check server logs: `tail -f /home/webintez/amigpl.com/server.log`
3. Check port: `netstat -tuln | grep 3001`

### Nginx not proxying?
1. Test nginx config: `sudo nginx -t`
2. Check nginx error logs: `sudo tail -f /www/wwwlogs/amigpl.com.error.log`
3. Verify nginx is reloaded: `sudo nginx -s reload`

### Website shows old content?
1. Clear browser cache
2. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

## 📞 Support

For issues, check:
- Server logs: `/home/webintez/amigpl.com/server.log`
- Nginx logs: `/www/wwwlogs/amigpl.com.log` and `/www/wwwlogs/amigpl.com.error.log`

---

**Next Step**: Reload nginx and test http://www.amigpl.com/

