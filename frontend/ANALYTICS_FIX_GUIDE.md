# Analytics Dashboard 401 Error Fix Guide

## Problem Summary
Analytics Dashboard menampilkan error 401 (Unauthorized) karena:
1. Backend accessToken tidak tersimpan ke session/localStorage saat OAuth
2. Analytics API tidak dapat mengambil token untuk Authorization header
3. Dashboard stuck di loading state jika user.id tidak tersedia

## Changes Made

### 1. NextAuth Route Fix (`src/app/api/auth/[...nextauth]/route.ts`)
**Problem**: Hanya mencari `data.access_token`, tapi backend bisa mengirim `data.token`

**Solution**:
```typescript
// OLD:
if (data.access_token) {
  (account as any).backendAccessToken = data.access_token
}

// NEW:
const accessToken = data.access_token || data.token
if (accessToken) {
  (account as any).backendAccessToken = accessToken
  console.log("[Backend] Access token received:", accessToken.substring(0, 20) + "...")
} else {
  console.warn("[Backend] No access token in response!")
}
```

### 2. AuthContext Token Storage (`src/contexts/AuthContext.tsx`)
**Problem**: Token dari session tidak disimpan ke localStorage/zustand

**Solution**:
```typescript
if (status === 'authenticated' && session?.user) {
  // ... existing code ...
  
  // Store backend accessToken to localStorage and zustand
  if ((session as any).accessToken) {
    const token = (session as any).accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      console.log('[AuthContext] Stored accessToken to localStorage');
    }
    // Also update zustand store with token
    setAuth(u ?? {}, token);
  }
}
```

**Also added cleanup on logout**:
```typescript
// Clear token from localStorage
if (typeof window !== 'undefined') {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('current_user');
}
```

### 3. Analytics API Logging (`src/lib/analytics-api.ts`)
**Added debug logging** untuk track token resolution:
```typescript
if (DEBUG && token) {
  console.log('[Analytics API] Token from session:', token.substring(0, 20) + '...');
}
if (DEBUG && !token) {
  console.warn('[Analytics API] No token found in session or localStorage!');
}
if (!token && DEBUG) {
  console.warn('[Analytics API] Making request WITHOUT Authorization header');
}
```

### 4. Analytics Page Improvements (`src/app/(dashboard)/dashboard/analytics/page.tsx`)
**Fixed loading state** when user.id is not available:
```typescript
const fetchAnalytics = async () => {
  if (!user?.id) {
    console.warn("[Analytics] No user.id available, skipping fetch");
    setLoading(false);
    setError("User not authenticated");
    return;
  }
  // ... rest of the code
}
```

**Added debug logging**:
```typescript
useEffect(() => {
  console.log("[Analytics Page] User object:", user);
  console.log("[Analytics Page] User ID:", user?.id);
}, [user]);
```

### 5. Environment Variable
Added `NEXT_PUBLIC_DEBUG=true` to `.env.local` for detailed logging

## Testing Steps

### Step 1: Restart Dev Server
```bash
cd /data/workspace/notaku-frontend/frontend
# Kill existing dev server if running
# Then start fresh:
npm run dev
```

### Step 2: Clear Browser State
1. Open DevTools (F12)
2. Go to **Application** tab
3. Clear **Local Storage** for `notaku.cloud`
4. Clear **Session Storage**
5. Go to **Network** tab and check "Disable cache"

### Step 3: Fresh Login
1. Navigate to the app
2. **Logout** if already logged in
3. **Login** with Google OAuth
4. Check console for these logs:
   ```
   [Backend] Success! User authenticated
   [Backend] Response data: {...}
   [Backend] Access token received: eyJhbGciOiJSUzI1NiIs...
   [Backend] User data received: your-email@gmail.com
   [AuthContext] Stored accessToken to localStorage
   ```

### Step 4: Verify Token Storage
1. Open DevTools → **Application** → **Local Storage**
2. Check for key `auth_token` with JWT value
3. Open **Console** and run:
   ```javascript
   localStorage.getItem('auth_token')
   // Should show JWT token
   
   JSON.parse(localStorage.getItem('auth-storage'))
   // Should show: { state: { token: "...", user: {...} } }
   ```

### Step 5: Test Analytics Dashboard
1. Navigate to `/dashboard/analytics`
2. Check console logs:
   ```
   [Analytics Page] User object: {id: "...", email: "...", ...}
   [Analytics Page] User ID: 5b55b08d-df54-43ce-8d4e-0994a9c39a8c
   [Analytics] Fetching data: {userId: "...", dateRange: {...}, interval: "daily"}
   [Analytics API] Token from session: eyJhbGciOiJSUzI1NiIs...
   [Analytics API] GET https://api.notaku.cloud/api/v1/analytics/...
   ```

3. Check **Network** tab:
   - Request to `/api/v1/analytics/*` should have:
   - Header: `Authorization: Bearer eyJhbG...`
   - Status: `200 OK` (not 401)

### Step 6: Expected Results
✅ **Success indicators**:
- No 401 errors in Network tab
- Analytics data loads successfully OR shows mock data with friendly error
- Console shows token being found and sent
- localStorage has `auth_token` key

❌ **If still failing**:
- Check backend logs for token validation errors
- Verify backend `/api/v1/auth/google` returns `token` or `access_token`
- Check if backend analytics endpoints require specific token format
- Verify backend CORS/cookie settings

## Debugging Commands

### Check if token exists in localStorage
```javascript
// In browser console:
localStorage.getItem('auth_token')
```

### Check NextAuth session
```javascript
// In browser console:
fetch('/api/auth/session')
  .then(r => r.json())
  .then(s => console.log('Session:', s))
```

### Manual analytics API test
```javascript
// In browser console:
const token = localStorage.getItem('auth_token');
fetch('https://api.notaku.cloud/api/v1/analytics/summary?user_id=YOUR_USER_ID&start_date=2025-10-01&end_date=2025-11-06', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  credentials: 'include'
})
  .then(r => r.json())
  .then(d => console.log('Analytics data:', d))
  .catch(e => console.error('Error:', e))
```

## Rollback Plan

If the changes cause issues, revert with:
```bash
cd /data/workspace/notaku-frontend/frontend
git diff src/app/api/auth/[...nextauth]/route.ts
git checkout src/app/api/auth/[...nextauth]/route.ts
git checkout src/contexts/AuthContext.tsx
git checkout src/lib/analytics-api.ts
git checkout src/app/\(dashboard\)/dashboard/analytics/page.tsx
```

## Related Files Modified
1. `src/app/api/auth/[...nextauth]/route.ts` - Token extraction from backend
2. `src/contexts/AuthContext.tsx` - Token storage to localStorage/zustand
3. `src/lib/analytics-api.ts` - Debug logging for token resolution
4. `src/app/(dashboard)/dashboard/analytics/page.tsx` - Loading state fix
5. `.env.local` - Added DEBUG flag

## Next Steps After Fix

1. Once confirmed working, remove or reduce debug logging
2. Consider adding token refresh logic if tokens expire
3. Add error boundary for analytics page
4. Monitor backend logs for 401 patterns
5. Set `NEXT_PUBLIC_DEBUG=false` in production

## Contact
If issues persist, check:
- Backend logs: `docker logs notaku-backend`
- Backend token validation: Check JWT signature/expiry
- Network: Ensure `api.notaku.cloud` is reachable
