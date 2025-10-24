# SSH Tunnel Setup for OCR Backend

## Problem

Frontend (172.16.1.8) cannot reach OCR backend (172.16.1.7) due to network routing.

```
Error: connect EHOSTUNREACH 172.16.1.7:8001
ping: sendto: No route to host
```

## Solution: SSH Tunnel

Create an SSH tunnel to forward local port to remote OCR backend.

---

## Quick Setup

### 1. Create SSH Tunnel

```bash
# Forward local port 8001 to remote server's port 8001
ssh -L 8001:localhost:8001 user@172.16.1.7 -N

# Or if using different username
ssh -L 8001:localhost:8001 api-server-notaku@172.16.1.7 -N
```

**Explanation:**
- `-L 8001:localhost:8001` - Forward local 8001 to remote localhost:8001
- `-N` - Don't execute remote command, just forward
- Keep this terminal open!

### 2. Update Frontend Config

```bash
# In frontend directory
echo "OCR_BACKEND_URL=http://localhost:8001" > .env.local
```

### 3. Restart Frontend

```bash
pkill -f "next dev"
npm run dev
```

### 4. Test

```bash
# Should now work!
curl http://localhost:8001/health
```

---

## Alternative Solutions

### Option 1: SSH Tunnel (Recommended for Development)

**Pros:**
- ✅ Secure (encrypted)
- ✅ No firewall changes needed
- ✅ Easy to setup
- ✅ Works across networks

**Cons:**
- ⚠️ Need SSH access
- ⚠️ Must keep tunnel open

**Setup:**
```bash
# Terminal 1: SSH Tunnel
ssh -L 8001:localhost:8001 api-server-notaku@172.16.1.7 -N

# Terminal 2: Frontend
npm run dev
```

### Option 2: Expose Backend Publicly

**Pros:**
- ✅ No tunnel needed
- ✅ Direct connection

**Cons:**
- ⚠️ Security risk
- ⚠️ Need firewall configuration
- ⚠️ Requires server admin access

**Setup:**
```bash
# On backend server (172.16.1.7)
# Allow port 8001 in firewall
sudo ufw allow 8001

# Or iptables
sudo iptables -A INPUT -p tcp --dport 8001 -j ACCEPT
```

### Option 3: VPN

**Pros:**
- ✅ Secure
- ✅ Full network access

**Cons:**
- ⚠️ Complex setup
- ⚠️ Requires VPN server

### Option 4: Run Backend Locally

**Pros:**
- ✅ No network issues
- ✅ Fastest development

**Cons:**
- ⚠️ Need to clone backend repo
- ⚠️ Need to setup dependencies

**Setup:**
```bash
# Clone backend
git clone <backend-repo>
cd backend/ocr-service

# Install dependencies
pip install -r requirements.txt

# Start backend
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

---

## Recommended Workflow

### For Development (SSH Tunnel)

**Terminal 1: SSH Tunnel**
```bash
ssh -L 8001:localhost:8001 api-server-notaku@172.16.1.7 -N
# Keep this running!
```

**Terminal 2: Frontend**
```bash
cd /path/to/frontend
npm run dev
```

**Terminal 3: Testing**
```bash
# Test tunnel
curl http://localhost:8001/health

# Should return:
# {"status":"healthy","redis":"ok","workers":1,...}
```

---

## Troubleshooting

### Error: "Connection refused" after tunnel

**Cause:** Tunnel not established or backend not running

**Solution:**
```bash
# Check if tunnel is running
ps aux | grep "ssh -L"

# Check if backend is running on remote
ssh api-server-notaku@172.16.1.7 "curl http://localhost:8001/health"
```

### Error: "Address already in use"

**Cause:** Port 8001 already used locally

**Solution:**
```bash
# Find process using port 8001
lsof -ti:8001

# Kill it
lsof -ti:8001 | xargs kill -9

# Or use different port
ssh -L 9001:localhost:8001 api-server-notaku@172.16.1.7 -N

# Update .env.local
echo "OCR_BACKEND_URL=http://localhost:9001" > .env.local
```

### Tunnel keeps disconnecting

**Solution:** Add keep-alive
```bash
ssh -L 8001:localhost:8001 api-server-notaku@172.16.1.7 -N \
  -o ServerAliveInterval=60 \
  -o ServerAliveCountMax=3
```

### Can't SSH to server

**Cause:** No SSH access or wrong credentials

**Solutions:**
1. Get SSH access from server admin
2. Use VPN if available
3. Ask admin to expose port 8001
4. Run backend locally

---

## Permanent Setup (Optional)

### SSH Config

Create `~/.ssh/config`:

```
Host ocr-backend
    HostName 172.16.1.7
    User api-server-notaku
    LocalForward 8001 localhost:8001
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

Then simply:
```bash
ssh -N ocr-backend
```

### Auto-start Tunnel (macOS)

Create `~/Library/LaunchAgents/com.ocr.tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ocr.tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>-L</string>
        <string>8001:localhost:8001</string>
        <string>api-server-notaku@172.16.1.7</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.ocr.tunnel.plist
```

---

## Production Deployment

For production (Cloudflare Pages), use public URL:

```bash
# Environment variable in Cloudflare
NEXT_PUBLIC_OCR_API_URL=https://ocr-api.yourdomain.com
```

Backend must:
- ✅ Be publicly accessible
- ✅ Have HTTPS
- ✅ Allow CORS from Cloudflare domain

---

## Quick Commands

### Start Tunnel
```bash
ssh -L 8001:localhost:8001 api-server-notaku@172.16.1.7 -N
```

### Test Tunnel
```bash
curl http://localhost:8001/health
```

### Update Frontend
```bash
echo "OCR_BACKEND_URL=http://localhost:8001" > .env.local
npm run dev
```

### Stop Tunnel
```bash
# Find SSH process
ps aux | grep "ssh -L"

# Kill it
pkill -f "ssh -L 8001"
```

---

## Summary

**Problem:** Network routing prevents frontend from reaching backend

**Solution:** SSH tunnel to forward local port to remote backend

**Commands:**
```bash
# 1. Create tunnel (keep running)
ssh -L 8001:localhost:8001 api-server-notaku@172.16.1.7 -N

# 2. Configure frontend
echo "OCR_BACKEND_URL=http://localhost:8001" > .env.local

# 3. Start frontend
npm run dev

# 4. Test
curl http://localhost:8001/health
```

**Now upload should work!** 🚀
