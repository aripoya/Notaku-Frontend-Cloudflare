# 💾 localStorage Receipts Implementation

## 📋 **Overview**

Receipts are temporarily stored in browser localStorage until backend receipts API is ready. This allows users to view and manage their receipts locally while the data is indexed in RAG for chat queries.

---

## ✅ **Why This Works**

### **What Happens When You Upload a Receipt:**

```
1. User uploads receipt
   ↓
2. Backend (Integration Service) processes:
   - OCR extraction ✅
   - Vision analysis ✅
   - Structure extraction ✅
   - RAG indexing ✅  ← Receipt is queryable via chat!
   ↓
3. Frontend receives results
   ↓
4. User edits/confirms data
   ↓
5. User clicks Save
   ↓
6. Saved to localStorage ✅  ← Local reference for user
   ↓
7. Navigate to receipts list
   ↓
8. User sees their receipts ✅
```

**Key Point:** Receipt data exists in TWO places:
1. **RAG Database** (backend) - For chat queries ✅
2. **localStorage** (browser) - For user to view/manage ✅

---

## 🔧 **Implementation Details**

### **1. Save Receipt (Upload Page)**

**File:** `src/app/(dashboard)/dashboard/upload/page.tsx`

**Function:** `handleSaveReceipt()`

```typescript
const handleSaveReceipt = (receipt: Receipt) => {
  // Get existing receipts
  const savedReceipts = JSON.parse(
    localStorage.getItem('notaku_receipts') || '[]'
  );
  
  // Prepare receipt with both field formats
  const receiptToSave = {
    id: receipt.id || result?.receipt_id,
    merchant: receipt.merchant,
    merchant_name: receipt.merchant,  // For ReceiptCard
    total_amount: receipt.total_amount,
    date: receipt.date,
    category: receipt.category,
    notes: receipt.notes,
    ocr_text: receipt.ocr_text,
    ocr_confidence: receipt.ocr_confidence,
    is_edited: true,
    saved_at: new Date().toISOString(),
  };
  
  // Update if exists, add if new
  const existingIndex = savedReceipts.findIndex(r => r.id === receiptToSave.id);
  if (existingIndex >= 0) {
    savedReceipts[existingIndex] = receiptToSave;
  } else {
    savedReceipts.push(receiptToSave);
  }
  
  // Save to localStorage
  localStorage.setItem('notaku_receipts', JSON.stringify(savedReceipts));
  
  // Navigate to receipts list
  router.push('/dashboard/receipts');
};
```

---

### **2. Load Receipts (Receipts List Page)**

**File:** `src/app/(dashboard)/dashboard/receipts/page.tsx`

**Function:** `fetchReceipts()`

```typescript
const fetchReceipts = async () => {
  // Load from localStorage
  const saved = localStorage.getItem('notaku_receipts');
  
  if (saved) {
    const parsedReceipts = JSON.parse(saved);
    
    // Sort by date (newest first)
    const sorted = parsedReceipts.sort((a, b) => {
      return new Date(b.saved_at).getTime() - 
             new Date(a.saved_at).getTime();
    });
    
    setReceipts(sorted);
  } else {
    setReceipts([]);
  }
};
```

---

### **3. Delete Receipt**

**File:** `src/app/(dashboard)/dashboard/receipts/page.tsx`

**Function:** `handleDeleteReceipt()`

```typescript
const handleDeleteReceipt = async (id: string) => {
  // Get receipts
  const saved = localStorage.getItem('notaku_receipts');
  const receipts = JSON.parse(saved);
  
  // Filter out deleted receipt
  const filtered = receipts.filter(r => r.id !== id);
  
  // Save back
  localStorage.setItem('notaku_receipts', JSON.stringify(filtered));
  
  // Refresh list
  fetchReceipts();
};
```

---

## 📊 **Data Format**

### **localStorage Key:**
```
notaku_receipts
```

### **Data Structure:**
```json
[
  {
    "id": "receipt_1761686878",
    "user_id": "user_123",
    "merchant": "PET SHOP SIKUNING",
    "merchant_name": "PET SHOP SIKUNING",
    "total_amount": 26000,
    "date": "2025-09-13",
    "category": "shopping",
    "notes": "Pet supplies",
    "ocr_text": "Full OCR text...",
    "ocr_confidence": 0.8,
    "image_path": "",
    "is_edited": true,
    "created_at": "2025-10-29T04:00:00Z",
    "saved_at": "2025-10-29T04:50:00Z"
  }
]
```

### **Field Explanation:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique receipt ID (from backend) |
| `user_id` | string | User who uploaded |
| `merchant` | string | Store/merchant name |
| `merchant_name` | string | Same as merchant (for ReceiptCard) |
| `total_amount` | number | Total in IDR |
| `date` | string | Transaction date (YYYY-MM-DD) |
| `category` | string\|null | Category (shopping, food, etc) |
| `notes` | string\|null | User notes |
| `ocr_text` | string | Full OCR extracted text |
| `ocr_confidence` | number | OCR confidence (0-1) |
| `image_path` | string | Image path (usually empty) |
| `is_edited` | boolean | User edited data |
| `created_at` | string | Upload timestamp |
| `saved_at` | string | Save timestamp |

---

## 🎯 **Features**

### **✅ What Works:**

1. **Save Receipt**
   - After upload & edit
   - Stores in localStorage
   - Navigates to list

2. **View Receipts List**
   - Shows all saved receipts
   - Sorted newest first
   - Search/filter works

3. **Delete Receipt**
   - Removes from localStorage
   - Refreshes list
   - Shows success toast

4. **Search & Filter**
   - Client-side filtering
   - By merchant name
   - By category
   - By notes

5. **Stats Display**
   - Total receipts
   - Total amount
   - Average amount
   - (All calculated from localStorage)

---

## ⚠️ **Limitations**

### **Browser-Only Storage:**

1. **Not Synced Across Devices**
   - Data only in current browser
   - Login from phone won't see same receipts
   - Each device has separate data

2. **Can Be Lost**
   - If browser data cleared
   - If user clears localStorage
   - If localStorage quota exceeded

3. **No Backup**
   - Not stored on server
   - Can't recover if lost
   - User responsible for data

4. **Storage Limit**
   - ~5-10MB per domain
   - Could fill up with many receipts
   - No warning when full

---

## 🔒 **Data Persistence**

### **Where Data Actually Lives:**

| Location | Purpose | Persistence |
|----------|---------|-------------|
| **RAG Database** | Chat queries | ✅ Permanent (backend) |
| **localStorage** | User view/manage | ⚠️ Browser only |

### **What Happens If localStorage Cleared:**

```
✅ Receipt data still in RAG (chat still works)
❌ User can't see receipts list
❌ User loses local reference
✅ Can re-upload if needed
```

### **Important:**
> Receipt data is NOT lost when localStorage is cleared - it's still indexed in RAG and queryable via chat. Only the local reference is lost.

---

## 🧪 **Testing**

### **Test 1: Save Receipt**

```
Steps:
1. Upload receipt
2. Edit data
3. Click Save
4. Check localStorage

Expected:
✅ Redirected to /dashboard/receipts
✅ Toast: "Nota berhasil disimpan!"
✅ Receipt visible in list

Console:
[Save] 💾 Saving receipt to localStorage
[Save] 📂 Existing receipts: 0
[Save] ➕ Adding new receipt
[Save] ✅ Saved! Total receipts: 1

localStorage:
Key: notaku_receipts
Value: [{...}]  (1 receipt)
```

---

### **Test 2: View Receipts List**

```
Steps:
1. Navigate to /dashboard/receipts
2. Check list displays

Expected:
✅ Receipts shown (if any saved)
✅ Sorted newest first
✅ Shows merchant, total, date
✅ Search works
✅ Filter by category works

Console:
[ReceiptsList] 📂 Loading receipts from localStorage
[ReceiptsList] ✅ Loaded receipts: 1
```

---

### **Test 3: Delete Receipt**

```
Steps:
1. Go to receipts list
2. Click delete on a receipt
3. Check localStorage

Expected:
✅ Receipt removed from list
✅ Toast: "Terhapus"
✅ Other receipts still visible

Console:
[ReceiptsList] 🗑️ Deleting receipt: receipt_123
[ReceiptsList] 📊 Before: 1 After: 0
```

---

### **Test 4: Multiple Receipts**

```
Steps:
1. Upload 3 receipts
2. Save each one
3. View list

Expected:
✅ All 3 receipts shown
✅ Sorted by date (newest first)
✅ Search finds receipts
✅ Stats show correct totals
```

---

### **Test 5: Browser DevTools**

```bash
# Open Console (F12)
# Check localStorage:

localStorage.getItem('notaku_receipts')
# Should return: '[{...}, {...}]'

JSON.parse(localStorage.getItem('notaku_receipts'))
# Should return: Array of receipt objects

# Clear localStorage:
localStorage.removeItem('notaku_receipts')

# Receipts list will be empty
# But chat can still query receipts! (RAG)
```

---

## 🔄 **Migration to Backend API**

### **When Backend Ready:**

**Step 1: Backend implements endpoints:**
```python
@app.get("/api/v1/receipts/")
def list_receipts(user_id: str):
    return {"receipts": [...]}

@app.post("/api/v1/receipts/")
def create_receipt(data: ReceiptCreate):
    return {"id": "...", "success": true}

@app.put("/api/v1/receipts/{id}")
def update_receipt(id: str, data: ReceiptUpdate):
    return {"success": true}

@app.delete("/api/v1/receipts/{id}")
def delete_receipt(id: str):
    return {"success": true}
```

**Step 2: Frontend uncomment API calls:**
```typescript
// In src/app/(dashboard)/dashboard/receipts/page.tsx
// Uncomment the fetch() calls
// Remove localStorage.getItem()

// In src/app/(dashboard)/dashboard/upload/page.tsx
// Uncomment the POST to /api/v1/receipts/
// Remove localStorage.setItem()
```

**Step 3: Optional migration script:**
```typescript
// Migrate localStorage → Backend
const migrateToBackend = async () => {
  const saved = localStorage.getItem('notaku_receipts');
  if (!saved) return;
  
  const receipts = JSON.parse(saved);
  
  for (const receipt of receipts) {
    await fetch('/api/v1/receipts/', {
      method: 'POST',
      body: JSON.stringify(receipt),
    });
  }
  
  // Clear localStorage after migration
  localStorage.removeItem('notaku_receipts');
};
```

---

## 📝 **Console Logs**

### **Save Receipt:**
```javascript
[Save] 💾 Saving receipt to localStorage: {merchant: "...", total: 26000}
[Save] 📂 Existing receipts: 2
[Save] ➕ Adding new receipt
[Save] ✅ Saved! Total receipts: 3
```

### **Load Receipts:**
```javascript
[ReceiptsList] 📂 Loading receipts from localStorage
[ReceiptsList] ✅ Loaded receipts: 3
```

### **Delete Receipt:**
```javascript
[ReceiptsList] 🗑️ Deleting receipt: receipt_1761686878
[ReceiptsList] 📊 Before: 3 After: 2
```

---

## 🎉 **Benefits**

### **For Users:**
- ✅ Can view uploaded receipts
- ✅ Can delete receipts
- ✅ Can search/filter receipts
- ✅ Works immediately (no backend wait)
- ✅ Fast (no API calls)

### **For Developers:**
- ✅ No backend changes needed
- ✅ Works with current architecture
- ✅ Easy to implement
- ✅ Easy to migrate later
- ✅ Temporary solution that works

### **For Business:**
- ✅ Core features work now
- ✅ Users can use app immediately
- ✅ Buy time to build proper backend
- ✅ No blockers

---

## 🚨 **Important Notes**

### **1. This is Temporary**

localStorage is a **stopgap solution**. Plan to implement proper backend API for:
- Multi-device sync
- Data backup
- Advanced features (export, analytics, etc)

### **2. RAG Still Works**

Even though receipts are in localStorage, they're **still indexed in RAG**:
- Chat can query receipts ✅
- Search works via Diajeng ✅
- Data not lost ✅

### **3. Inform Users**

Consider showing a banner:
```
"⚠️ Receipts stored locally in browser. 
Data not synced across devices yet."
```

### **4. Storage Limits**

Monitor localStorage usage:
```typescript
// Check size
const size = new Blob([localStorage.getItem('notaku_receipts')]).size;
console.log('localStorage size:', size, 'bytes');

// Warn if getting full (> 4MB)
if (size > 4 * 1024 * 1024) {
  toast.warning('Storage almost full', {
    description: 'Consider deleting old receipts'
  });
}
```

---

## 📚 **Related Files**

- `src/app/(dashboard)/dashboard/upload/page.tsx` - Save handler
- `src/app/(dashboard)/dashboard/receipts/page.tsx` - List & delete
- `DISABLED_ENDPOINTS.md` - Why localStorage needed
- `SYNCHRONOUS_PROCESSING_FIX.md` - Upload flow

---

## ✅ **Quick Reference**

**Save receipt:**
```typescript
localStorage.setItem('notaku_receipts', JSON.stringify(receipts));
```

**Load receipts:**
```typescript
const receipts = JSON.parse(localStorage.getItem('notaku_receipts') || '[]');
```

**Delete receipt:**
```typescript
const filtered = receipts.filter(r => r.id !== receiptId);
localStorage.setItem('notaku_receipts', JSON.stringify(filtered));
```

**Clear all:**
```typescript
localStorage.removeItem('notaku_receipts');
```

---

**Status:** ✅ Implemented  
**Last Updated:** October 29, 2025  
**Commit:** `5b1176c - feat: implement localStorage for receipts`  
**Type:** Temporary (until backend API ready)  
**Works:** ✅ Yes, fully functional
