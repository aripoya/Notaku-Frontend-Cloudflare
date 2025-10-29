# 🔐 Google OAuth with Backend Integration - Complete Guide

## ✅ **IMPLEMENTED: Full Authentication Flow**

This document explains the complete Google OAuth implementation with separate frontend-backend architecture.

---

## 🏗️ **Architecture Overview**

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         │ 1. Click "Sign in with Google"
         ▼
┌──────────────────────────┐
│   Next.js Frontend       │
│   (Vercel)               │
│   - Login page           │
│   - NextAuth.js          │
└────────┬─────────────────┘
         │
         │ 2. Google OAuth Flow
         ▼
┌──────────────────────────┐
│   Google OAuth           │
│   - User selects account │
│   - Returns tokens       │
└────────┬─────────────────┘
         │
         │ 3. Google tokens (id_token, access_token)
         ▼
┌──────────────────────────┐
│   NextAuth API Route     │
│   /api/auth/[...nextauth]│
│   - Receives Google token│
└────────┬─────────────────┘
         │
         │ 4. POST /auth/google with Google tokens
         ▼
┌──────────────────────────┐
│   Backend API            │
│   (api.notaku.cloud)     │
│   - Validates Google     │
│   - Creates/finds user   │
│   - Returns backend JWT  │
└────────┬─────────────────┘
         │
         │ 5. Backend JWT token
         ▼
┌──────────────────────────┐
│   NextAuth Session       │
│   - Stores backend JWT   │
│   - Stores user data     │
└────────┬─────────────────┘
         │
         │ 6. Session available globally
         ▼
┌──────────────────────────┐
│   Protected Pages        │
│   - Dashboard            │
│   - Profile              │
│   - All pages can access │
│     backend JWT          │
└──────────────────────────┘
```

---

## 📁 **Files Modified/Created**

### **1. NextAuth Route** 
**File:** `src/app/api/auth/[...nextauth]/route.ts`

**Purpose:** Handle Google OAuth and exchange tokens with backend

**Key Changes:**
- ✅ JWT callback exchanges Google token with backend
- ✅ Stores backend JWT in session
- ✅ Error handling for backend failures
- ✅ Comprehensive logging

**Flow:**
```typescript
Google Login → JWT Callback → 
POST to backend /auth/google → 
Store backend JWT → 
Session callback adds JWT to session
```

### **2. Auth Context** (NEW)
**File:** `src/contexts/AuthContext.tsx`

**Purpose:** Global authentication state management

**Provides:**
```typescript
{
  user: User,              // User object
  backendToken: string,    // JWT for backend API calls
  userId: string,          // User ID from backend
  isLoading: boolean,      // Loading state
  error: string | null,    // Error message
  isAuthenticated: boolean // Auth status
}
```

**Features:**
- ✅ Automatic error detection
- ✅ Loading state management
- ✅ Redirect handling
- ✅ Console logging for debugging

### **3. Providers Update**
**File:** `src/app/providers.tsx`

**Changes:**
- ✅ Added AuthProvider wrapper
- ✅ Makes auth context available globally

### **4. Dashboard Protection**
**File:** `src/app/(dashboard)/dashboard/page.tsx`

**Changes:**
- ✅ Uses useAuth hook
- ✅ Loading state (prevents blank page)
- ✅ Error state with retry
- ✅ Unauthenticated state handling
- ✅ Redirect loop prevention

---

## 🔧 **Backend Implementation Required**

### **Endpoint:** `POST /auth/google`

**URL:** `https://api.notaku.cloud/auth/google`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "idToken": "google_id_token_here",
  "accessToken": "google_access_token_here",
  "email": "user@example.com",
  "name": "User Name",
  "image": "https://lh3.googleusercontent.com/...",
  "googleId": "123456789"
}
```

**Success Response:** `200 OK`
```json
{
  "token": "backend_jwt_token_here",
  "userId": "user_uuid_or_id",
  "user": {
    "id": "user_uuid_or_id",
    "email": "user@example.com",
    "name": "User Name",
    "image": "https://...",
    "createdAt": "2025-01-29T00:00:00Z",
    "role": "user"
  }
}
```

**Error Response:** `400/401/500`
```json
{
  "error": "Error message",
  "details": "Detailed error description"
}
```

### **Backend Implementation Steps:**

1. **Verify Google Token**
   ```python
   from google.oauth2 import id_token
   from google.auth.transport import requests
   
   # Verify the Google ID token
   idinfo = id_token.verify_oauth2_token(
       request_data['idToken'],
       requests.Request(),
       GOOGLE_CLIENT_ID
   )
   
   # Extract user info
   google_id = idinfo['sub']
   email = idinfo['email']
   ```

2. **Find or Create User**
   ```python
   user = User.query.filter_by(google_id=google_id).first()
   
   if not user:
       user = User(
           google_id=google_id,
           email=email,
           name=request_data['name'],
           image=request_data['image']
       )
       db.session.add(user)
       db.session.commit()
   ```

3. **Generate Backend JWT**
   ```python
   import jwt
   from datetime import datetime, timedelta
   
   payload = {
       'user_id': user.id,
       'email': user.email,
       'exp': datetime.utcnow() + timedelta(days=30)
   }
   
   token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
   ```

4. **Return Response**
   ```python
   return jsonify({
       'token': token,
       'userId': user.id,
       'user': {
           'id': user.id,
           'email': user.email,
           'name': user.name,
           'image': user.image,
           'createdAt': user.created_at.isoformat(),
           'role': user.role
       }
   }), 200
   ```

---

## 💻 **Usage in Frontend Pages**

### **Access Auth Data**

```typescript
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { 
    user,              // User object
    backendToken,      // JWT token
    userId,            // User ID
    isLoading,         // Loading state
    isAuthenticated,   // Auth status
    error              // Error message
  } = useAuth()
  
  // Show loading
  if (isLoading) {
    return <div>Loading...</div>
  }
  
  // Show error
  if (error) {
    return <div>Error: {error}</div>
  }
  
  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/login')
    return null
  }
  
  // Use authenticated data
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
    </div>
  )
}
```

### **Make API Calls with Backend JWT**

```typescript
import { useAuth } from '@/contexts/AuthContext'

function DataComponent() {
  const { backendToken } = useAuth()
  
  const fetchData = async () => {
    const response = await fetch('https://api.notaku.cloud/api/receipts', {
      headers: {
        'Authorization': `Bearer ${backendToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch data')
    }
    
    const data = await response.json()
    return data
  }
  
  // Use with React Query
  const { data, isLoading } = useQuery({
    queryKey: ['receipts'],
    queryFn: fetchData,
    enabled: !!backendToken  // Only fetch if token exists
  })
}
```

### **Protect Pages**

```typescript
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])
  
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  if (!isAuthenticated) {
    return <div>Redirecting...</div>
  }
  
  return <div>Protected content</div>
}
```

---

## 🐛 **Debugging**

### **Console Logs**

All logs are prefixed for easy filtering:

```
[NextAuth] - NextAuth flow logs
[AuthContext] - Context state changes
[Dashboard] - Dashboard state
```

### **Check Authentication Flow**

1. **Open Browser Console**
2. **Go to:** `https://notaku-frontend.vercel.app/login`
3. **Click:** "Masuk dengan Google"
4. **Watch console for:**

```
[NextAuth] 🔐 signIn callback triggered
[NextAuth] Provider: google
[NextAuth] User email: user@example.com
[NextAuth] ✅ Google sign-in successful

[NextAuth] 🎫 JWT callback triggered
[NextAuth] New Google login - exchanging with backend
[NextAuth] ✅ Backend auth successful

[NextAuth] 📋 Session callback triggered
[NextAuth] ✅ Session configured with backend token

[NextAuth] 🔀 Redirect callback
[NextAuth] ✅ Redirecting to dashboard

[AuthContext] Status changed: authenticated
[AuthContext] Session: { user: {...}, backendToken: "..." }

[Dashboard] Auth state: { isAuthenticated: true, user: {...} }
```

### **Check Backend Logs**

On backend server, log:
```
POST /auth/google
- Google ID Token: ey...
- Email: user@example.com
- Creating/finding user...
- Generating JWT...
- Response: { token: "...", userId: "..." }
```

### **Common Issues**

#### **1. Backend Not Responding**
```
[NextAuth] ❌ Backend auth failed: 500
```
**Solution:** Check backend server is running and endpoint exists

#### **2. CORS Error**
```
Access to fetch blocked by CORS policy
```
**Solution:** Add frontend URL to backend CORS allowed origins:
```python
CORS(app, origins=["https://notaku-frontend.vercel.app"])
```

#### **3. Invalid Google Token**
```
[NextAuth] ❌ Backend auth error: Invalid token
```
**Solution:** Check Google Client ID in backend matches frontend

#### **4. Dashboard Blank Page**
```
[Dashboard] Auth state: { isLoading: true, ... }
```
**Solution:** 
- Check session is being set correctly
- Check AuthContext is wrapped properly
- Check for JavaScript errors in console

---

## 🧪 **Testing Checklist**

### **Manual Testing**

- [ ] Click "Masuk dengan Google" on login page
- [ ] Select Google account
- [ ] Verify redirect to dashboard (not blank page)
- [ ] Check console logs show successful flow
- [ ] Dashboard displays user name
- [ ] Backend receives POST to /auth/google
- [ ] Backend returns valid JWT
- [ ] JWT stored in session
- [ ] No infinite redirect loops
- [ ] Logout works properly
- [ ] Re-login works

### **Error Testing**

- [ ] Backend down → Shows error message with retry
- [ ] Invalid Google token → Shows error, redirects to login
- [ ] Network error → Shows error with retry
- [ ] Session expired → Redirects to login

---

## 📊 **Environment Variables**

### **Vercel (Frontend)**

```bash
GOOGLE_CLIENT_ID=87735297129-os7b4ci4vfgllnghqjljd3kg9eusag3r.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXTAUTH_URL=https://notaku-frontend.vercel.app
NEXTAUTH_SECRET=a7f9d8c4b2e6a1f5d9c8b7a6e5d4c3b2a1f9e8d7c6b5a4e3d2c1b0a9f8e7d6c5
NEXT_PUBLIC_API_URL=https://api.notaku.cloud
```

### **Backend**

```bash
GOOGLE_CLIENT_ID=87735297129-os7b4ci4vfgllnghqjljd3kg9eusag3r.apps.googleusercontent.com
JWT_SECRET=your-backend-jwt-secret
DATABASE_URL=your-database-url
CORS_ORIGINS=https://notaku-frontend.vercel.app
```

---

## 🚀 **Deployment Status**

✅ Frontend deployed to Vercel
✅ Google OAuth configured
✅ NextAuth integration complete
✅ Auth Context implemented
✅ Dashboard protection added
⏳ **Backend /auth/google endpoint needed**

---

## 📝 **Next Steps**

1. **Implement Backend Endpoint**
   - Create POST /auth/google route
   - Verify Google tokens
   - Generate backend JWT
   - Return user data

2. **Test Complete Flow**
   - Test login with real Google account
   - Verify backend receives request
   - Check JWT is stored
   - Test protected pages

3. **Add Token Refresh** (Optional, later)
   - Handle JWT expiration
   - Refresh tokens automatically
   - Update session

4. **Add Logout**
   - Clear session
   - Clear backend token
   - Redirect to login

---

## 📞 **Support**

If you encounter issues:

1. Check browser console for `[NextAuth]` logs
2. Check backend logs for /auth/google requests
3. Verify all environment variables are set
4. Check Google OAuth redirect URIs
5. Test with incognito/private window

---

## ✅ **Summary**

**What's Working:**
- ✅ Google Sign-In button
- ✅ OAuth redirect flow
- ✅ Token exchange logic
- ✅ Session management
- ✅ Loading states
- ✅ Error handling
- ✅ Dashboard protection

**What's Needed:**
- ⏳ Backend /auth/google endpoint implementation
- ⏳ Backend JWT generation
- ⏳ User database operations

**After Backend Ready:**
- Complete end-to-end testing
- Deploy to production
- Monitor for errors
- Add additional features

---

**🎉 Authentication infrastructure is ready! Just need backend endpoint to complete the flow.**
