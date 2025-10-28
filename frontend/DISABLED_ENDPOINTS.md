# 🔇 Temporarily Disabled API Endpoints

## 📋 **Overview**

Several API endpoints have been temporarily disabled because they don't exist in the current backend yet. This stops 404 errors in the console and allows core functionality (Upload + Chat) to work.

---

## ❌ **Disabled Endpoints**

### **1. Receipts List & Management**

**Endpoint:** `/api/v1/receipts/`

**Status:** ❌ Not implemented in backend

**What was disabled:**
- Fetching receipts list
- Deleting receipts
- Receipt detail page (partially)

**Current behavior:**
- Receipts page shows empty state
- Delete button shows "Fitur Belum Tersedia"
- No 404 errors in console

**File:** `src/app/(dashboard)/dashboard/receipts/page.tsx`

**Code:**
```typescript
// ❌ DISABLED: /api/v1/receipts/ endpoint doesn't exist
console.log('[ReceiptsList] ⚠️ Receipts list endpoint not available yet');
setReceipts([]);  // Show empty state

/* DISABLED UNTIL BACKEND READY:
const response = await fetch(`${API_BASE_URL}/api/v1/receipts/`, {
  method: "GET",
  ...
});
*/
```

---

### **2. Subscription Quota**

**Endpoint:** `/api/v1/subscription/quota/{userId}`

**Status:** ❌ Not implemented in backend

**What was disabled:**
- Fetching user quota
- Displaying receipts remaining
- Displaying AI queries remaining

**Current behavior:**
- Returns mock data (Free tier)
- Shows 10 receipts remaining
- Shows 50 AI queries remaining
- No quota blocking

**File:** `src/lib/subscription-api.ts`

**Mock data:**
```typescript
return {
  tier: SubscriptionTier.FREE,
  status: SubscriptionStatus.ACTIVE,
  monthly_limit: 10,
  used: 0,
  remaining: 10,
  can_use_google_vision: false,
  ai_queries_limit: 50,
  ai_queries_used: 0,
  total_cost: 0,
  price: 0,
};
```

---

### **3. OCR Permission Check**

**Endpoint:** `/api/v1/subscription/check-permission`

**Status:** ❌ Not implemented in backend

**What was disabled:**
- Checking if user can upload receipts
- Checking if user can use Google Vision
- Quota enforcement before upload

**Current behavior:**
- Always allows uploads
- No quota blocking
- Upload always works

**File:** `src/lib/subscription-api.ts`

**Mock response:**
```typescript
return {
  allowed: true,
  message: 'Permission check temporarily disabled - allowing all uploads',
};
```

---

### **4. AI Permission Check**

**Endpoint:** `/api/v1/subscription/ai-permission/{userId}`

**Status:** ❌ Not implemented in backend

**What was disabled:**
- Checking if user can send chat messages
- Checking AI queries remaining
- Quota enforcement before chat

**Current behavior:**
- Always allows chat
- No quota blocking
- Chat always works

**File:** `src/lib/subscription-api.ts`

**Mock response:**
```typescript
return {
  allowed: true,
  remaining: 999,
  message: 'AI permission check temporarily disabled - allowing all queries',
};
```

---

## ✅ **What Still Works**

### **Core Functionality:**
- ✅ Upload receipts (via Integration Service)
- ✅ Chat/query (via RAG Service)
- ✅ OCR processing
- ✅ RAG indexing
- ✅ Authentication
- ✅ Dashboard

### **Mock Data:**
- ✅ Quota display (fake data)
- ✅ Receipts remaining (shows 10)
- ✅ AI queries remaining (shows 50)
- ✅ Empty receipts list

---

## 🔧 **How to Re-Enable**

When backend implements these endpoints, follow these steps:

### **Step 1: Receipts List**

**Backend task:**
```python
# Implement at Integration Service (port 8005)
@app.get("/api/v1/receipts/")
async def list_receipts(user_id: str):
    return {"receipts": [...]}
```

**Frontend task:**
```typescript
// File: src/app/(dashboard)/dashboard/receipts/page.tsx
// Line 43-86

// 1. Uncomment the fetch code:
const response = await fetch(`${API_BASE_URL}/api/v1/receipts/`, {
  method: "GET",
  credentials: "include",
});
const data = await response.json();
setReceipts(Array.isArray(data) ? data : []);

// 2. Remove the empty state line:
// DELETE: setReceipts([]);

// 3. Remove console warnings
```

---

### **Step 2: Subscription Endpoints**

**Backend task:**
```python
# Implement subscription service endpoints
@app.get("/api/v1/subscription/quota/{user_id}")
@app.post("/api/v1/subscription/check-permission")
@app.get("/api/v1/subscription/ai-permission/{user_id}")
```

**Frontend task:**
```typescript
// File: src/lib/subscription-api.ts

// For getQuota() - line 137-162:
// 1. Delete mock return
// 2. Uncomment the fetch code

// For checkOCRPermission() - line 171-198:
// 1. Delete mock return
// 2. Uncomment the fetch code

// For checkAIPermission() - line 207-226:
// 1. Delete mock return
// 2. Uncomment the fetch code
```

---

## 📊 **Console Messages**

When these features are disabled, you'll see these warnings:

```javascript
[ReceiptsList] ⚠️ Receipts list endpoint not available yet
[ReceiptsList] Showing empty state until backend is ready

[Subscription API] ⚠️ Quota endpoint not available - returning mock data

[Subscription API] ⚠️ Permission check not available - allowing upload

[Subscription API] ⚠️ AI permission check not available - allowing chat
```

**These are normal and expected!** They mean the temporary disabling is working correctly.

---

## 🎯 **Testing Checklist**

### **Before Re-Enabling:**
- [ ] Backend implements `/api/v1/receipts/`
- [ ] Backend implements quota endpoints
- [ ] Test endpoints with curl
- [ ] Verify response format matches types

### **After Re-Enabling:**
- [ ] No 404 errors in console
- [ ] Receipts list loads correctly
- [ ] Quota displays real data
- [ ] Permission checks work
- [ ] Upload still works
- [ ] Chat still works

---

## 🚨 **Important Notes**

### **1. Upload & Chat Always Work**

Even with these endpoints disabled, **core functionality still works:**
- Upload uses Integration Service directly
- Chat uses RAG Service directly
- No quota blocking
- No permission blocking

### **2. Mock Data is Safe**

The mock data is **generous:**
- Free tier (not blocking anything)
- 10 receipts remaining (won't hit limit)
- 50 AI queries remaining (won't hit limit)
- Always allows uploads and chat

### **3. Easy to Re-Enable**

All disabled code is **commented out** with `/* DISABLED UNTIL BACKEND READY: ... */`

Just:
1. Uncomment the code
2. Delete the mock returns
3. Test

### **4. No Data Loss**

Disabling these endpoints **doesn't affect:**
- Uploaded receipts (still processed)
- Chat history (still works)
- RAG indexing (still happens)
- User data (untouched)

---

## 📁 **Files Modified**

| File | Lines | What Changed |
|------|-------|--------------|
| `src/app/(dashboard)/dashboard/receipts/page.tsx` | 43-86 | Disabled receipts list fetch |
| `src/app/(dashboard)/dashboard/receipts/page.tsx` | 144-169 | Disabled delete receipt |
| `src/lib/subscription-api.ts` | 130-162 | Disabled getQuota() |
| `src/lib/subscription-api.ts` | 163-198 | Disabled checkOCRPermission() |
| `src/lib/subscription-api.ts` | 200-226 | Disabled checkAIPermission() |

---

## 🎉 **Benefits**

### **User Experience:**
- ✅ No scary 404 errors
- ✅ Upload works smoothly
- ✅ Chat works smoothly
- ✅ Clear "feature coming soon" messages

### **Developer Experience:**
- ✅ Clean console logs
- ✅ Easy to re-enable
- ✅ Clear TODO comments
- ✅ Type-safe mock data

### **Production Ready:**
- ✅ No breaking changes
- ✅ Graceful degradation
- ✅ Core features work
- ✅ Easy maintenance

---

## 📞 **Quick Reference**

**To check what's disabled:**
```bash
# Search for disabled code
grep -r "DISABLED UNTIL BACKEND READY" src/
```

**To re-enable receipts list:**
```bash
# Edit this file
vim src/app/(dashboard)/dashboard/receipts/page.tsx
# Uncomment lines 62-75
```

**To re-enable subscription:**
```bash
# Edit this file
vim src/lib/subscription-api.ts
# Uncomment lines 151-159, 183-197, 216-225
```

---

**Status:** ✅ Temporarily disabled  
**Last Updated:** October 29, 2025  
**Commit:** `7902d75 - fix: disable unavailable API endpoints temporarily`  
**Priority:** Medium (re-enable when backend ready)
