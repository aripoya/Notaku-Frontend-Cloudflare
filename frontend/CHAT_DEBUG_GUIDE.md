# Chat AI Debugging Guide

## ✅ Backend Status (CONFIRMED WORKING)

- **API:** `https://api.notaku.cloud/api/v1/chat`
- **Health:** `/api/v1/chat/health` ✅
- **Ollama:** Connected to `172.16.1.6:11434` ✅
- **Model:** `diajeng-v3:latest` ✅
- **Tested:** curl works perfectly ✅

---

## 🐛 Frontend Debugging Steps

### Step 1: Test API Connection

1. Go to `/dashboard/chat`
2. Click the **"Test API"** button in the header
3. Check the toast notification:
   - ✅ **Success:** Shows `{"status":"ok","ai_enabled":true,"ollama_connected":true}`
   - ❌ **Failed:** Shows error message

**Expected Console Log:**
```
[Chat] 🔍 Testing connection to: https://api.notaku.cloud/api/v1/chat/health
[Chat] ✅ Health check result: {status: "ok", ai_enabled: true, ollama_connected: true}
```

---

### Step 2: Send Test Message

1. Type a simple message: `"test"`
2. Click Send
3. Open browser console (F12 → Console tab)
4. Watch the logs

**Expected Console Logs:**
```
[Chat] 🚀 Starting handleSendMessage
[Chat] Message: test
[Chat] User: abc-123-def-456
[Chat] Current messages count: 0
[Chat] Checking AI permission...
[Chat] Permission result: {allowed: true, remaining: 100}
[Chat] ✅ Permission granted, remaining: 100
[Chat] 📡 API Configuration:
[Chat] API_URL: https://api.notaku.cloud
[Chat] Endpoint: https://api.notaku.cloud/api/v1/chat
[Chat] NEXT_PUBLIC_API_URL env: https://api.notaku.cloud
[Chat] Request body: {message: "test", context: []}
[Chat] Context length: 0
[Chat] Sending fetch request...
[Chat] ✅ Response received
[Chat] Response status: 200
[Chat] Response statusText: OK
[Chat] Response headers: {content-type: "application/json", ...}
[Chat] 📦 Response data: {response: "Halo! 👋 Ada yang bisa saya bantu?", context: [...]}
[Chat] Response keys: ["response", "context"]
[Chat] Response.response: Halo! 👋 Ada yang bisa saya bantu?
[Chat] ✨ AI Response: Halo! 👋 Ada yang bisa saya bantu?
[Chat] 🎬 Starting streaming animation...
[Chat] ✅ Streaming complete
[Chat] 🏁 handleSendMessage complete, setting isLoading to false
```

---

### Step 3: Identify the Error

If you see an error, check the console logs for:

#### A. Network Error
```
[Chat] ❌ Chat error: TypeError: Failed to fetch
[Chat] Error type: TypeError
[Chat] Network error - cannot reach server
```

**Solution:**
- Check internet connection
- Verify API URL is correct
- Check if backend is running

#### B. 401 Unauthorized
```
[Chat] ✅ Response received
[Chat] Response status: 401
[Chat] ❌ Error response body: {"detail": "Not authenticated"}
```

**Solution:**
- User not logged in
- Session expired
- Check cookies/auth token

#### C. 404 Not Found
```
[Chat] ✅ Response received
[Chat] Response status: 404
[Chat] ❌ Error response body: {"detail": "Not Found"}
```

**Solution:**
- Wrong endpoint URL
- Check NEXT_PUBLIC_API_URL environment variable
- Verify backend route exists

#### D. 500 Server Error
```
[Chat] ✅ Response received
[Chat] Response status: 500
[Chat] ❌ Error response body: {"detail": "Internal server error"}
```

**Solution:**
- Backend error
- Check backend logs
- Verify Ollama is running

#### E. CORS Error
```
Access to fetch at 'https://api.notaku.cloud/api/v1/chat' from origin 'https://notaku.cloud' has been blocked by CORS policy
```

**Solution:**
- Backend CORS not configured
- Add `allow_credentials=True` in backend
- Add frontend domain to `allow_origins`

---

## 🔧 Common Fixes

### Fix 1: Wrong API URL

**Check environment variable:**
```bash
# In .env.local
NEXT_PUBLIC_API_URL=https://api.notaku.cloud
```

**Verify in console:**
```
[Chat] NEXT_PUBLIC_API_URL env: https://api.notaku.cloud
```

### Fix 2: Missing Credentials

The code already includes `credentials: "include"` ✅

```typescript
fetch(endpoint, {
  method: "POST",
  credentials: "include", // ✅ Sends cookies
  ...
})
```

### Fix 3: Wrong Response Format

Backend returns:
```json
{
  "response": "AI message here",
  "context": [...]
}
```

Frontend extracts:
```typescript
const aiResponse = data.response; // ✅ Correct
```

---

## 📊 What Each Log Means

| Log | Meaning |
|-----|---------|
| `🚀 Starting handleSendMessage` | User clicked send |
| `📡 API Configuration` | Shows endpoint URL |
| `✅ Response received` | Server responded |
| `📦 Response data` | Shows full response |
| `✨ AI Response` | Extracted AI message |
| `🎬 Starting streaming` | Animating response |
| `✅ Streaming complete` | Animation done |
| `❌ Chat error` | Something went wrong |
| `🏁 handleSendMessage complete` | Function finished |

---

## 🎯 Testing Checklist

- [ ] Test API button shows "Connection OK"
- [ ] Health check returns `{"status":"ok"}`
- [ ] Send message shows all console logs
- [ ] Response status is 200
- [ ] Response data has `response` field
- [ ] AI message appears in chat
- [ ] Streaming animation works
- [ ] No errors in console

---

## 🚨 If Still Not Working

### 1. Check Backend Logs

```bash
# On backend server
tail -f /var/log/notaku-api/app.log
```

Look for:
- Incoming POST /api/v1/chat requests
- Ollama API calls
- Any errors

### 2. Test Backend Directly

```bash
# Test health endpoint
curl https://api.notaku.cloud/api/v1/chat/health

# Test chat endpoint (with auth cookie)
curl -X POST https://api.notaku.cloud/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_COOKIE" \
  -d '{"message":"test","context":[]}'
```

### 3. Check Network Tab

1. Open DevTools → Network tab
2. Send a chat message
3. Find the `/api/v1/chat` request
4. Check:
   - Request URL
   - Request Headers (Cookie present?)
   - Request Payload
   - Response Status
   - Response Body

### 4. Verify Environment

```bash
# Check .env.local
cat .env.local | grep NEXT_PUBLIC_API_URL

# Should show:
# NEXT_PUBLIC_API_URL=https://api.notaku.cloud
```

---

## 💡 Expected Behavior

**When working correctly:**

1. User types "Berapa total belanja bulan ini?"
2. Console shows all logs (🚀 → 📡 → ✅ → 📦 → ✨ → 🎬 → ✅ → 🏁)
3. Loading indicator appears
4. AI response streams word by word
5. Final message shows: "Halo! 👋 Untuk mengetahui total belanja bulan ini, saya perlu mengakses data transaksi Anda..."

**Diajeng's Response Style:**
- Indonesian language ✅
- Friendly tone ✅
- Uses emoji ✅
- Helpful and informative ✅

---

## 📝 Summary

**Changes Made:**
1. ✅ Removed trailing slash from endpoint (`/api/v1/chat/` → `/api/v1/chat`)
2. ✅ Added comprehensive console logging
3. ✅ Added specific error messages for each status code
4. ✅ Added "Test API" button for quick debugging
5. ✅ Added toast notifications for errors

**Next Steps:**
1. Test the chat page
2. Check console logs
3. Identify exact error from logs
4. Apply appropriate fix
5. Report findings

---

## 🔗 Related Files

- **Frontend:** `/src/app/(dashboard)/dashboard/chat/page.tsx`
- **Backend:** `/var/www/notaku-api/app/routers/chat.py`
- **Backend Health:** `https://api.notaku.cloud/api/v1/chat/health`

---

**Status:** Frontend debugging complete, ready for testing! 🚀

Check console logs to see exactly where the issue is.
