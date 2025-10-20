# 🔌 Setup API Connection - Notaku Frontend

Complete guide to connect Notaku Frontend to Backend API Server

**API Server:** https://api.notaku.cloud  
**Workflows:** https://workflows.notaku.cloud (n8n)  
**Storage:** https://storage.notaku.cloud (MinIO)  
**Status:** ✅ Running (FastAPI + PostgreSQL + Redis + MinIO)  
**Infrastructure:** Cloudflare Tunnel

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Verify Connection](#verify-connection)
4. [Test Authentication](#test-authentication)
5. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### ✅ Backend Services Running

Your backend infrastructure is ready via **Cloudflare Tunnel**:

**Public URLs (via Cloudflare):**
```
✅ FastAPI:    https://api.notaku.cloud       → localhost:8000
✅ n8n:        https://workflows.notaku.cloud → localhost:5678
✅ MinIO:      https://storage.notaku.cloud   → localhost:9001
```

**Local Services:**
```
✅ PostgreSQL: localhost:5432 (optimized for 314GB RAM)
✅ Redis:      localhost:6379 (32GB cache)
✅ MinIO:      localhost:9000 (S3-compatible storage)
✅ n8n:        localhost:5678 (workflow automation)
✅ FastAPI:    localhost:8000 (main API)
```

**API Base URL:** `https://api.notaku.cloud`  
**Infrastructure:** Cloudflare Tunnel (secure tunnel to local services)

### ✅ CORS Configuration

CORS is properly configured:
- ✅ Credentials: Enabled
- ✅ Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- ✅ Origin: `http://localhost:3000` (development)
- ✅ Max Age: 600 seconds

---

## 2. Environment Setup

### Step 1: Create Environment Files

Create `.env.development` in `/frontend` directory:

```bash
cd /Users/ipoy/Documents/Expense\ AI\ Platform/expense-ai/frontend
```

**Create `.env.development`:**
```bash
# Development Environment

# API Server (FastAPI)
VITE_API_URL=https://api.notaku.cloud

# Workflows (n8n)
VITE_WORKFLOWS_URL=https://workflows.notaku.cloud

# Storage (MinIO)
VITE_STORAGE_URL=https://storage.notaku.cloud

# Optional: Enable debug mode
VITE_DEBUG=true
```

**Create `.env.production`:**
```bash
# Production Environment

# API Server (FastAPI)
VITE_API_URL=https://api.notaku.cloud

# Workflows (n8n)
VITE_WORKFLOWS_URL=https://workflows.notaku.cloud

# Storage (MinIO)
VITE_STORAGE_URL=https://storage.notaku.cloud

# Debug Mode
VITE_DEBUG=false
```

### Step 2: Verify Environment Variables

Check if environment variables are loaded:

```typescript
// In any component
console.log('API URL:', import.meta.env.VITE_API_URL);
// Should output: https://api.notaku.cloud
```

### Step 3: Install Dependencies

```bash
npm install
# or
yarn install
```

---

## 3. Verify Connection

### Test 1: Health Check

Create a test file `src/test-api.ts`:

```typescript
import ApiClient from '@/lib/api-client';

async function testConnection() {
  try {
    console.log('🔍 Testing API connection...');
    console.log('API URL:', import.meta.env.VITE_API_URL);
    
    // Test health endpoint
    const health = await ApiClient.getHealth();
    console.log('✅ Health Check:', health);
    
    // Test system info
    const info = await ApiClient.getSystemInfo();
    console.log('✅ System Info:', info);
    
    console.log('🎉 API Connection Successful!');
  } catch (error) {
    console.error('❌ API Connection Failed:', error);
  }
}

testConnection();
```

Run the test:
```bash
npm run dev
# Open browser console to see results
```

### Test 2: Browser Console Test

Open browser console (F12) and run:

```javascript
// Test health endpoint
fetch('https://api.notaku.cloud/health')
  .then(res => res.json())
  .then(data => console.log('✅ Health:', data))
  .catch(err => console.error('❌ Error:', err));

// Test system info
fetch('https://api.notaku.cloud/')
  .then(res => res.json())
  .then(data => console.log('✅ System:', data))
  .catch(err => console.error('❌ Error:', err));
```

Expected responses:

**Health Check:**
```json
{
  "status": "healthy",
  "app": "Notaku API",
  "environment": "production"
}
```

**System Info:**
```json
{
  "message": "Notaku API - Backend Infrastructure",
  "version": "1.0.0",
  "status": "running",
  "services": {
    "postgresql": "connected",
    "redis": "connected",
    "minio": "connected",
    "ocr": "http://172.16.1.2:8000",
    "ai": "http://172.16.1.6:8000"
  }
}
```

---

## 4. Test Authentication

### Test Registration

```typescript
import ApiClient from '@/lib/api-client';

async function testRegistration() {
  try {
    const user = await ApiClient.register({
      email: 'test@example.com',
      username: 'testuser',
      password: 'SecurePass123!'
    });
    console.log('✅ Registration successful:', user);
  } catch (error) {
    console.error('❌ Registration failed:', error);
  }
}
```

### Test Login

```typescript
async function testLogin() {
  try {
    const response = await ApiClient.login({
      email: 'test@example.com',
      password: 'SecurePass123!'
    });
    console.log('✅ Login successful:', response);
    
    // Get current user
    const user = await ApiClient.getCurrentUser();
    console.log('✅ Current user:', user);
  } catch (error) {
    console.error('❌ Login failed:', error);
  }
}
```

### Test with React Hook

```typescript
import { useAuth } from '@/hooks/useAuth';

function TestAuth() {
  const { login, user, isAuthenticated, loading, error } = useAuth();
  
  const handleTest = async () => {
    try {
      await login({
        email: 'test@example.com',
        password: 'SecurePass123!'
      });
      console.log('✅ Logged in:', user);
    } catch (err) {
      console.error('❌ Login failed:', err);
    }
  };
  
  return (
    <div>
      <button onClick={handleTest}>Test Login</button>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {isAuthenticated && <p>Welcome, {user?.username}!</p>}
    </div>
  );
}
```

---

## 5. Troubleshooting

### Issue 1: CORS Error

**Error:**
```
Access to fetch at 'https://api.notaku.cloud' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solution:**
- ✅ CORS is already enabled on API server
- Check if you're using correct origin: `http://localhost:3000`
- Verify API server is running

### Issue 2: Network Error

**Error:**
```
Failed to fetch
TypeError: NetworkError when attempting to fetch resource
```

**Solution:**
1. Check API server is running:
   ```bash
   curl https://api.notaku.cloud/health
   ```

2. Check internet connection

3. Verify API URL in `.env.development`:
   ```bash
   VITE_API_URL=https://api.notaku.cloud
   ```

### Issue 3: 401 Unauthorized

**Error:**
```
401 Unauthorized - Authentication required
```

**Solution:**
- Login first before accessing protected endpoints
- Check if session cookie is being sent
- Verify credentials are correct

### Issue 4: Environment Variables Not Loading

**Error:**
```
import.meta.env.VITE_API_URL is undefined
```

**Solution:**
1. Restart dev server:
   ```bash
   npm run dev
   ```

2. Verify file name is exactly `.env.development`

3. Check variable starts with `VITE_` prefix

4. Clear cache:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

### Issue 5: SSL Certificate Error

**Error:**
```
SSL certificate problem: unable to get local issuer certificate
```

**Solution:**
- API uses Cloudflare SSL (should work)
- Cloudflare Tunnel provides automatic SSL/TLS
- If testing locally, use HTTP instead of HTTPS
- Update `.env.development`:
  ```bash
  VITE_API_URL=http://localhost:8000
  ```

### Issue 6: Cloudflare Tunnel Not Working

**Error:**
```
Failed to connect to api.notaku.cloud
```

**Solution:**
1. Check if Cloudflare Tunnel is running:
   ```bash
   # Check tunnel status in Cloudflare dashboard
   # Or check local cloudflared process
   ps aux | grep cloudflared
   ```

2. Verify tunnel routes are configured:
   - api.notaku.cloud → localhost:8000
   - workflows.notaku.cloud → localhost:5678
   - storage.notaku.cloud → localhost:9001

3. Check local services are running:
   ```bash
   # Check FastAPI
   curl http://localhost:8000/health
   
   # Check n8n
   curl http://localhost:5678
   
   # Check MinIO
   curl http://localhost:9001
   ```

4. Restart Cloudflare Tunnel if needed

### Issue 7: 404 Not Found

**Error:**
```
404 Not Found - Endpoint does not exist
```

**Solution:**
- Check endpoint URL is correct
- Verify API version: `/api/v1/...`
- Check Cloudflare catch-all rule (returns 404 for unknown routes)
- Review API documentation: https://api.notaku.cloud/docs

---

## 🎯 Quick Start Checklist

- [ ] Create `.env.development` with `VITE_API_URL=https://api.notaku.cloud`
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Open browser console (F12)
- [ ] Test health endpoint: `fetch('https://api.notaku.cloud/health')`
- [ ] Verify response: `{ status: "healthy" }`
- [ ] Test login with `useAuth` hook
- [ ] Check session cookie in DevTools → Application → Cookies

---

## 📚 Next Steps

Once connection is verified:

1. **Read API Documentation:**
   - [API Integration Guide](./API_INTEGRATION.md)
   - [React Hooks Guide](./API_INTEGRATION_PART2.md)
   - [Best Practices](./API_INTEGRATION_PART3.md)

2. **Implement Features:**
   - Authentication (Login/Register)
   - Notes Management
   - Receipt Upload with OCR
   - AI Chat Integration

3. **Testing:**
   - Unit tests: `npm run test`
   - E2E tests: `npm run test:e2e`

---

## 🔗 Useful Links

### API Server
- **Base URL:** https://api.notaku.cloud
- **API Docs:** https://api.notaku.cloud/docs
- **OpenAPI Spec:** https://api.notaku.cloud/openapi.json
- **Health Check:** https://api.notaku.cloud/health

### Workflows (n8n)
- **Base URL:** https://workflows.notaku.cloud
- **Dashboard:** https://workflows.notaku.cloud/
- **Webhooks:** https://workflows.notaku.cloud/webhook/

### Storage (MinIO)
- **Base URL:** https://storage.notaku.cloud
- **Console:** https://storage.notaku.cloud/
- **S3 API:** https://storage.notaku.cloud/

### Infrastructure
- **Cloudflare Tunnel:** Secure tunnel to local services
- **Catch-all Rule:** `http_status:404` (configured)

---

## 🆘 Need Help?

If you encounter issues:

1. Check browser console for errors
2. Verify API server is running: `curl https://api.notaku.cloud/health`
3. Check environment variables: `console.log(import.meta.env.VITE_API_URL)`
4. Review [Troubleshooting](#troubleshooting) section
5. Check API documentation: [API_INTEGRATION.md](./API_INTEGRATION.md)

---

**Status:** ✅ Ready to connect!  
**Last Updated:** October 21, 2025
