# OCR Backend Setup Guide

## Issue: OCR Offline

### Error Message
```
OCR Offline
Cannot connect to OCR service at Next.js proxy (/api/ocr). 
Please check if the service is running and accessible.
```

### Root Cause
OCR backend service is not running or not accessible.

---

## Quick Fix

### 1. Check if OCR Backend is Running

```bash
# Test OCR backend health
curl http://localhost:8001/health

# Expected response:
{
  "status": "healthy",
  "redis": "ok",
  "workers": 1,
  "queue_size": 0,
  "timestamp": "..."
}
```

### 2. If Not Running, Start OCR Backend

```bash
# Navigate to OCR backend directory
cd /path/to/ocr-backend

# Start the service
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Or if using different command
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### 3. Verify Connection

```bash
# Test from frontend
curl http://localhost:8001/health

# Should return healthy status
```

### 4. Restart Frontend Dev Server

```bash
# In frontend directory
npm run dev
```

---

## Configuration

### Environment Variables

Create `.env.local` in frontend directory:

```bash
# OCR Backend URL for development
OCR_BACKEND_URL=http://localhost:8001

# Or if backend is on different machine
# OCR_BACKEND_URL=http://172.16.1.7:8001
```

### Default Configuration

**Development (next.config.ts):**
```typescript
const ocrBackendUrl = process.env.OCR_BACKEND_URL || 'http://localhost:8001';
```

**Production:**
```typescript
const OCR_BASE_URL = process.env.NEXT_PUBLIC_OCR_API_URL || 'http://172.16.1.7:8001';
```

---

## Troubleshooting

### Error: "No route to host"

**Symptom:**
```
Failed to proxy http://172.16.1.7:8001/health
Error: connect EHOSTUNREACH 172.16.1.7:8001
```

**Causes:**
1. OCR backend not running
2. Wrong IP address
3. Firewall blocking connection
4. Network issue

**Solutions:**

#### Solution 1: Use localhost
```bash
# In .env.local
OCR_BACKEND_URL=http://localhost:8001
```

#### Solution 2: Check correct IP
```bash
# Find your machine's IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or on Linux
ip addr show | grep "inet " | grep -v 127.0.0.1
```

#### Solution 3: Start OCR backend
```bash
cd /path/to/ocr-backend
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### Error: "Connection refused"

**Symptom:**
```
curl: (7) Failed to connect to localhost port 8001: Connection refused
```

**Cause:** OCR backend not running

**Solution:**
```bash
# Start OCR backend
cd /path/to/ocr-backend
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### Error: "OCR Offline" in UI

**Symptom:** Red indicator showing "OCR Offline"

**Causes:**
1. Backend not running
2. Wrong URL configuration
3. CORS issues (production only)

**Solutions:**

1. **Check backend:**
   ```bash
   curl http://localhost:8001/health
   ```

2. **Check frontend logs:**
   - Open browser DevTools (F12)
   - Look for network errors
   - Check console for [OCR API] logs

3. **Restart both services:**
   ```bash
   # Terminal 1: OCR Backend
   cd /path/to/ocr-backend
   uvicorn app.main:app --host 0.0.0.0 --port 8001
   
   # Terminal 2: Frontend
   cd /path/to/frontend
   npm run dev
   ```

---

## Development Workflow

### Recommended Setup

**Terminal 1: OCR Backend**
```bash
cd /path/to/ocr-backend
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2: Frontend**
```bash
cd /path/to/frontend
npm run dev
```

**Terminal 3: Redis (if needed)**
```bash
redis-server
```

### Verify All Services

```bash
# 1. Check Redis
redis-cli ping
# Should return: PONG

# 2. Check OCR Backend
curl http://localhost:8001/health
# Should return: {"status": "healthy", ...}

# 3. Check Frontend
curl http://localhost:3000
# Should return: HTML

# 4. Check Proxy
curl http://localhost:3000/api/ocr-health
# Should return: {"status": "healthy", ...}
```

---

## Network Configuration

### Local Development (Same Machine)

```bash
# .env.local
OCR_BACKEND_URL=http://localhost:8001
```

**Pros:**
- ✅ No network issues
- ✅ Fast
- ✅ No CORS

**Cons:**
- ❌ Backend must run on same machine

### Remote Backend (Different Machine)

```bash
# .env.local
OCR_BACKEND_URL=http://192.168.1.100:8001
```

**Pros:**
- ✅ Can use remote backend
- ✅ Share backend across team

**Cons:**
- ⚠️ Network must be accessible
- ⚠️ Firewall must allow connections

---

## Port Configuration

### Default Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| OCR Backend | 8001 | http://localhost:8001 |
| Main Backend | 8000 | http://localhost:8000 |
| Redis | 6379 | localhost:6379 |

### Change Ports

**OCR Backend:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 9001
```

**Frontend:**
```bash
# .env.local
OCR_BACKEND_URL=http://localhost:9001
```

---

## Production Deployment

### Cloudflare Pages

**Environment Variables:**
```
NEXT_PUBLIC_OCR_API_URL=https://ocr-api.yourdomain.com
```

**Requirements:**
- ✅ OCR backend must be publicly accessible
- ✅ HTTPS recommended
- ✅ CORS must be configured

### Backend CORS

```python
# In OCR backend
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Development
        "https://your-app.pages.dev",  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Quick Reference

### Start Everything

```bash
# 1. Redis
redis-server &

# 2. OCR Backend
cd /path/to/ocr-backend && uvicorn app.main:app --host 0.0.0.0 --port 8001 &

# 3. Frontend
cd /path/to/frontend && npm run dev
```

### Stop Everything

```bash
# Stop all Node processes
pkill -f "next dev"

# Stop OCR backend
pkill -f "uvicorn"

# Stop Redis
redis-cli shutdown
```

### Health Check All

```bash
# Redis
redis-cli ping

# OCR Backend
curl http://localhost:8001/health

# Frontend
curl http://localhost:3000

# Proxy
curl http://localhost:3000/api/ocr-health
```

---

## Summary

**Problem:** OCR backend not accessible

**Solutions:**
1. ✅ Start OCR backend: `uvicorn app.main:app --host 0.0.0.0 --port 8001`
2. ✅ Use localhost: `OCR_BACKEND_URL=http://localhost:8001`
3. ✅ Verify health: `curl http://localhost:8001/health`
4. ✅ Restart frontend: `npm run dev`

**For immediate fix:**
```bash
# Start OCR backend first!
cd /path/to/ocr-backend
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

Then refresh browser and try upload again! 🚀
