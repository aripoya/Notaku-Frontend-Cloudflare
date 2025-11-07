# Rebuild Production - Fix Mixed Content Error

## Problem
Mixed Content error terjadi karena build lama tidak include environment variable `NEXT_PUBLIC_API_URL=https://api.notaku.cloud` yang sudah di-set di `.env.local`.

Next.js embed environment variables pada saat **build time**, bukan runtime. Jadi meskipun `.env.local` sudah benar, aplikasi masih menggunakan build lama.

## Solution: Rebuild Aplikasi

### Step 1: Stop Current Application

```bash
# Find the PID
ps aux | grep "next-server" | grep -v grep

# Kill the process (replace PID with actual PID)
kill 3585477

# Or kill all next processes
pkill -f "next-server"
```

### Step 2: Verify Environment Variable

```bash
cd /data/workspace/notaku-frontend/frontend

# Check .env.local
cat .env.local | grep NEXT_PUBLIC_API_URL

# Should show:
# NEXT_PUBLIC_API_URL=https://api.notaku.cloud
```

### Step 3: Clean Old Build

```bash
cd /data/workspace/notaku-frontend/frontend

# Remove old build artifacts
rm -rf .next
rm -rf out

echo "✅ Old build cleaned"
```

### Step 4: Rebuild Application

```bash
cd /data/workspace/notaku-frontend/frontend

# Build for production
npm run build

# This will:
# 1. Read environment variables from .env.local
# 2. Embed them into the build
# 3. Create optimized production bundle
```

### Step 5: Start Production Server

```bash
cd /data/workspace/notaku-frontend/frontend

# Start in production mode
npm run start

# Or with PM2 (recommended for production)
pm2 start npm --name "notaku-frontend" -- start
pm2 save
```

### Step 6: Verify Fix

1. Open browser: https://www.notaku.cloud/dashboard/upload
2. Open DevTools → Network tab
3. Upload receipt → Click save
4. **Check request URL**: Should be `https://api.notaku.cloud/api/v1/receipts` ✅

**Also check console:**
```javascript
// Should show HTTPS URL
console.log('API URL:', 'https://api.notaku.cloud')
```

## Quick Command Sequence

```bash
# All in one
cd /data/workspace/notaku-frontend/frontend
pkill -f "next-server"
rm -rf .next
npm run build
npm run start
```

## Using PM2 (Recommended for Production)

### Install PM2
```bash
npm install -g pm2
```

### PM2 Commands
```bash
cd /data/workspace/notaku-frontend/frontend

# Stop old instance
pm2 stop notaku-frontend
pm2 delete notaku-frontend

# Rebuild
rm -rf .next
npm run build

# Start with PM2
pm2 start npm --name "notaku-frontend" -- start

# Save PM2 config
pm2 save

# Setup auto-restart on reboot
pm2 startup

# Monitor
pm2 logs notaku-frontend
pm2 monit
```

### PM2 Useful Commands
```bash
# Status
pm2 status

# Logs
pm2 logs notaku-frontend --lines 100

# Restart
pm2 restart notaku-frontend

# Stop
pm2 stop notaku-frontend

# Delete
pm2 delete notaku-frontend
```

## Using systemd (Alternative)

Create systemd service file:

```bash
sudo nano /etc/systemd/system/notaku-frontend.service
```

Content:
```ini
[Unit]
Description=Notaku Frontend Next.js App
After=network.target

[Service]
Type=simple
User=rtx3090
WorkingDirectory=/data/workspace/notaku-frontend/frontend
Environment=NODE_ENV=production
Environment=NEXT_PUBLIC_API_URL=https://api.notaku.cloud
Environment=NEXTAUTH_URL=https://www.notaku.cloud
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable notaku-frontend
sudo systemctl start notaku-frontend

# Check status
sudo systemctl status notaku-frontend

# View logs
sudo journalctl -u notaku-frontend -f
```

## Nginx/Reverse Proxy Configuration

If you're using Nginx reverse proxy, ensure SSL is configured:

```nginx
server {
    listen 443 ssl http2;
    server_name www.notaku.cloud;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Issue: Still seeing HTTP requests after rebuild
**Solution**:
1. Hard refresh browser: Ctrl+Shift+R
2. Clear browser cache
3. Check if build actually completed
4. Verify .env.local is in the correct directory

### Issue: Build fails
**Solution**:
```bash
# Clean node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Port 3000 already in use
**Solution**:
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port
PORT=3001 npm run start
```

### Issue: Environment variable not loading
**Solution**:
1. Ensure variable starts with `NEXT_PUBLIC_`
2. Ensure .env.local is in frontend directory (not root)
3. Restart build process completely
4. Check no other .env files override it

## Verification Checklist

After rebuild, verify:

- [ ] Build completed successfully (check for errors)
- [ ] Server started on port 3000
- [ ] Can access https://www.notaku.cloud
- [ ] Network requests use HTTPS (not HTTP)
- [ ] No Mixed Content errors in console
- [ ] Receipt save works correctly
- [ ] All API calls return 200/201 (not 4xx/5xx)

## Environment Variables Reference

Required in `.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://api.notaku.cloud
NEXTAUTH_URL=https://www.notaku.cloud
NEXTAUTH_SECRET=<your-secret>
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-client-id>
```

## Auto-Deploy Script

Create a deploy script for easy updates:

```bash
#!/bin/bash
# deploy.sh

cd /data/workspace/notaku-frontend/frontend

echo "🛑 Stopping application..."
pm2 stop notaku-frontend

echo "📦 Pulling latest changes..."
git pull origin main

echo "📚 Installing dependencies..."
npm install

echo "🧹 Cleaning old build..."
rm -rf .next

echo "🏗️  Building application..."
npm run build

echo "🚀 Starting application..."
pm2 restart notaku-frontend

echo "✅ Deployment complete!"
pm2 logs notaku-frontend --lines 50
```

Make it executable:
```bash
chmod +x deploy.sh
```

Use it:
```bash
./deploy.sh
```

## Monitoring

Check logs for any errors:
```bash
# PM2 logs
pm2 logs notaku-frontend --lines 100

# Or if using npm start directly
# Check terminal output

# Check for Mixed Content errors in browser DevTools
```

## Next Steps

After successful rebuild:
1. Test all major features
2. Monitor error logs
3. Check backend API connectivity
4. Verify HTTPS is working for all requests
5. Update DNS if needed

## Contact

If issues persist after rebuild:
- Check `.next/server/pages/dashboard/upload.js` for hardcoded URLs
- Verify reverse proxy (nginx/caddy) is forwarding HTTPS correctly
- Check firewall rules
- Review SSL certificate validity
