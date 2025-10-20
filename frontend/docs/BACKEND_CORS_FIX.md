# 🔧 Backend CORS Configuration Fix

## ❌ Current Issue

Frontend getting CORS error:
```
Access to fetch at 'https://api.notaku.cloud/api/v1/auth/register' from origin 'http://localhost:3000' 
has been blocked by CORS policy: The value of the 'Access-Control-Allow-Origin' header in the response 
must not be the wildcard '*' when the request's credentials mode is 'include'.
```

## 🔍 Current API Response

```bash
access-control-allow-credentials: true
access-control-allow-origin: *  # ❌ PROBLEM: Wildcard tidak bisa dengan credentials
```

## ⚠️ Why This Fails

When using `credentials: 'include'` (for cookies/sessions):
- Browser requires **specific origin** in `Access-Control-Allow-Origin`
- **Wildcard `*` is NOT allowed** with credentials
- This is a security feature to prevent credential leakage

---

## ✅ Solution: Update FastAPI CORS Configuration

### Location
File: `main.py` or `app.py` (FastAPI backend)

### Current Code (WRONG)
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ❌ WRONG: Wildcard with credentials
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Fixed Code (CORRECT)
```python
from fastapi.middleware.cors import CORSMiddleware

# Define allowed origins
ALLOWED_ORIGINS = [
    "http://localhost:3000",           # Local development
    "http://127.0.0.1:3000",           # Local development (alternative)
    "http://172.16.1.5:3000",          # Network access
    "https://notaku.cloud",            # Production frontend (if deployed)
    "https://www.notaku.cloud",        # Production frontend with www
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,     # ✅ CORRECT: Specific origins
    allow_credentials=True,            # ✅ Required for cookies/sessions
    allow_methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
    allow_headers=["*"],
    max_age=600,                       # Cache preflight for 10 minutes
)
```

### Alternative: Environment-Based Configuration
```python
import os
from typing import List

# Get allowed origins from environment variable
ALLOWED_ORIGINS: List[str] = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then set in `.env`:
```bash
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://notaku.cloud
```

---

## 🧪 Testing After Fix

### 1. Restart FastAPI Server
```bash
# Stop current server
# Start server again to apply changes
```

### 2. Test CORS Headers
```bash
curl -X OPTIONS https://api.notaku.cloud/api/v1/auth/register \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep -i "access-control"
```

**Expected Response:**
```
access-control-allow-credentials: true
access-control-allow-origin: http://localhost:3000  # ✅ Specific origin, not *
access-control-allow-methods: DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT
```

### 3. Test from Frontend
```bash
# Open browser: http://localhost:3000/register
# Fill form and submit
# Should work without CORS error
```

---

## 📝 Additional Notes

### Why We Need Credentials
Frontend uses session-based authentication:
- Login creates HTTP-only cookie
- Cookie sent automatically with each request
- Requires `credentials: 'include'` in fetch

### Security Considerations
- Only add trusted origins to `allow_origins`
- Never use wildcard `*` with `allow_credentials=True`
- Use HTTPS in production
- Consider using environment variables for flexibility

### Cloudflare Tunnel
Since API is behind Cloudflare Tunnel:
- CORS must be configured in FastAPI, not Cloudflare
- Cloudflare passes through CORS headers from origin
- Make sure FastAPI CORS middleware is properly configured

---

## 🔗 References

- [FastAPI CORS Documentation](https://fastapi.tiangolo.com/tutorial/cors/)
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [MDN: Credentials Mode](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials)

---

## ✅ Checklist

- [ ] Update FastAPI CORS configuration
- [ ] Add specific origins (not wildcard)
- [ ] Keep `allow_credentials=True`
- [ ] Restart FastAPI server
- [ ] Test with curl command
- [ ] Test from frontend browser
- [ ] Verify cookies are being set
- [ ] Test login/register flow

---

**Status:** Waiting for backend CORS fix 🔧
