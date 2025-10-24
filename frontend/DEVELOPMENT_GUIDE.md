# Development Guide - Expense AI Frontend

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
./start-dev.sh
```

This script will:
1. ✅ Create SSH tunnel to OCR backend
2. ✅ Test connection
3. ✅ Start Next.js dev server
4. ✅ Auto-cleanup on exit (Ctrl+C)

### Option 2: Manual Setup

**Terminal 1: SSH Tunnel**
```bash
ssh -L 8001:localhost:8001 api-server-notaku@172.16.1.7 -N
```

**Terminal 2: Dev Server**
```bash
npm run dev
```

---

## Environment Configuration

### Development (.env.local)

```bash
# OCR Backend (via SSH tunnel)
OCR_BACKEND_URL=http://localhost:8001
```

### Production (Cloudflare Pages)

```bash
# OCR Backend (public URL)
NEXT_PUBLIC_OCR_API_URL=https://ocr.notaku.cloud
```

---

## How It Works

### Development Flow

```
Your Browser (localhost:3000)
  ↓
Next.js Dev Server
  ↓ /api/ocr/* (rewrite)
  ↓
localhost:8001 (SSH tunnel)
  ↓ SSH (encrypted)
  ↓
172.16.1.7:8001 (OCR Backend)
```

### Production Flow

```
Browser
  ↓
Cloudflare Pages (notaku.cloud)
  ↓ Direct HTTPS call
  ↓
ocr.notaku.cloud (Cloudflare Tunnel)
  ↓
172.16.1.7:8001 (OCR Backend)
```

---

## Troubleshooting

### Issue: "OCR Offline" in localhost

**Cause:** SSH tunnel not running

**Solution:**
```bash
# Check if tunnel is running
ps aux | grep "ssh -L 8001"

# If not, start it
ssh -L 8001:localhost:8001 api-server-notaku@172.16.1.7 -N
```

### Issue: "Port 8001 already in use"

**Cause:** Previous tunnel still running or port occupied

**Solution:**
```bash
# Find process using port 8001
lsof -ti:8001

# Kill it
lsof -ti:8001 | xargs kill -9

# Start tunnel again
ssh -L 8001:localhost:8001 api-server-notaku@172.16.1.7 -N
```

### Issue: "Connection refused"

**Cause:** OCR backend not running on server

**Solution:**
```bash
# SSH to server and check
ssh api-server-notaku@172.16.1.7

# On server, check OCR backend
curl http://localhost:8001/health

# If not running, start it
cd /home/ocr
# Start OCR backend command here
```

### Issue: Works in production but not localhost

**Cause:** Different configurations

**Check:**
```bash
# Development uses tunnel
cat .env.local
# Should show: OCR_BACKEND_URL=http://localhost:8001

# Production uses public URL
# In Cloudflare Pages: NEXT_PUBLIC_OCR_API_URL=https://ocr.notaku.cloud
```

---

## Testing

### Test SSH Tunnel

```bash
# Should return health status
curl http://localhost:8001/health

# Expected:
# {"status":"healthy","redis":"ok","workers":1,...}
```

### Test Frontend Proxy

```bash
# Should return same health status
curl http://localhost:3000/api/ocr-health

# Expected:
# {"status":"healthy","redis":"ok","workers":1,...}
```

### Test Upload

1. Open http://localhost:3000/dashboard/upload
2. Upload receipt image
3. Check browser console (F12)
4. Should see: `[OCR API] Uploading to /api/ocr/upload`

---

## Development Workflow

### Daily Workflow

**Morning:**
```bash
# Start everything
./start-dev.sh
```

**During Development:**
- Frontend auto-reloads on file changes
- SSH tunnel stays connected
- Backend processes uploads

**Evening:**
```bash
# Stop with Ctrl+C
# Script auto-cleans up SSH tunnel
```

### If Tunnel Disconnects

```bash
# Kill dev server (Ctrl+C)

# Restart tunnel
ssh -L 8001:localhost:8001 api-server-notaku@172.16.1.7 -N &

# Restart dev server
npm run dev
```

---

## Port Configuration

| Service | Port | URL |
|---------|------|-----|
| Frontend Dev | 3000 | http://localhost:3000 |
| OCR Backend (tunnel) | 8001 | http://localhost:8001 |
| OCR Backend (remote) | 8001 | http://172.16.1.7:8001 |
| OCR Backend (prod) | 443 | https://ocr.notaku.cloud |

---

## Scripts

### start-dev.sh

Automated development setup:
- Creates SSH tunnel
- Tests connection
- Starts dev server
- Auto-cleanup on exit

**Usage:**
```bash
./start-dev.sh
```

### Manual Commands

**Start tunnel:**
```bash
ssh -L 8001:localhost:8001 api-server-notaku@172.16.1.7 -N
```

**Start dev server:**
```bash
npm run dev
```

**Stop tunnel:**
```bash
pkill -f "ssh -L 8001"
```

**Stop dev server:**
```bash
pkill -f "next dev"
```

---

## Environment Variables

### .env.local (Development)

```bash
# OCR Backend URL (via SSH tunnel)
OCR_BACKEND_URL=http://localhost:8001

# Optional: Main Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Cloudflare Pages (Production)

```bash
# OCR Backend URL (public)
NEXT_PUBLIC_OCR_API_URL=https://ocr.notaku.cloud

# Main Backend API
NEXT_PUBLIC_API_URL=https://api.notaku.cloud
```

---

## Common Tasks

### Update Dependencies

```bash
npm install
```

### Run Tests

```bash
npm test
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run build
npx serve@latest out
```

---

## Tips

### Keep Tunnel Alive

Add to `~/.ssh/config`:

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

### Auto-start Tunnel

Use `start-dev.sh` script - it handles everything!

### Multiple Terminals

**Recommended setup:**
- Terminal 1: `./start-dev.sh` (tunnel + dev server)
- Terminal 2: Git commands
- Terminal 3: Testing/debugging

---

## Summary

**For Development:**
1. Run `./start-dev.sh`
2. Wait for "Ready in Xms"
3. Open http://localhost:3000
4. Start coding!

**For Production:**
- Push to GitHub
- Cloudflare Pages auto-deploys
- Uses `https://ocr.notaku.cloud`

**Key Difference:**
- Dev: Uses SSH tunnel (localhost:8001)
- Prod: Uses public URL (https://ocr.notaku.cloud)

---

## Need Help?

Check documentation:
- `SSH_TUNNEL_SETUP.md` - SSH tunnel details
- `OCR_BACKEND_SETUP.md` - Backend setup
- `CLOUDFLARE_DEPLOYMENT.md` - Production deployment

Or run:
```bash
./start-dev.sh
```

It will show you what's wrong! 🚀
