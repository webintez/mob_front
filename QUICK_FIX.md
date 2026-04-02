# Quick Fix - Update Nginx Configuration

The issue is that the nginx configuration file in this directory is not the one being used by nginx. The actual configuration file is at `/etc/nginx/sites-available/amigpl.com`.

## Run this command to fix it:

```bash
sudo bash /home/webintez/amigpl.com/update-nginx-config.sh
```

This script will:
1. ✅ Backup the current nginx configuration
2. ✅ Update it to proxy to the Node.js server (port 3001)
3. ✅ Test the configuration
4. ✅ Reload nginx automatically

After running this, your website at http://www.amigpl.com/ should show the new Mobitez frontend!

---

## Alternative: Manual Update

If you prefer to do it manually:

1. Edit the file:
   ```bash
   sudo nano /etc/nginx/sites-available/amigpl.com
   ```

2. Replace the content with:
   ```nginx
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
   ```

3. Test and reload:
   ```bash
   sudo nginx -t
   sudo nginx -s reload
   ```

