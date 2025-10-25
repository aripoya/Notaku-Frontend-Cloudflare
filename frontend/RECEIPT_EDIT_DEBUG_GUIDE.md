# Receipt Edit Form - Debugging Guide

## 🐛 Issues Identified

### Issue 1: Form Fields Not Auto-Populating
**Symptom:** After OCR completes, ReceiptEditForm renders but all fields are empty

**Root Cause:** Form state wasn't updating when `initialData` prop changed

**Fix Applied:** Added `useEffect` hook that watches `initialData` and updates form fields when it changes

### Issue 2: Save Failing with "Failed to fetch undefined"
**Symptom:** Click save → Error: "TypeError: Failed to fetch with detail undefined"

**Root Cause:** 
- `receiptId` might be undefined or invalid
- API URL construction failing
- Missing validation before API call

**Fix Applied:**
- Added receiptId validation before save
- Added comprehensive logging to track values
- Added validation in receipts-api.ts

---

## 🔍 Debugging Steps

### Step 1: Check Console Logs

After uploading a receipt, you should see these logs in order:

```
[Upload] 🚀 Starting upload process
[Upload] Selected file: receipt.jpg
[Upload] User ID: abc-123
[Upload] ✅ Upload response received
[Upload] Starting poll for job: 9bacfaca-...
[Poll] 🔄 Starting to poll job status
[Poll] Status response: {status: "processing"}
[Poll] ✅ Job finished! Fetching result...
[Poll] ✨ Result data received
[MapResult] 🗺️ Mapping result to Receipt format
[MapResult] ✅ Mapped receipt
[MapResult] Receipt ID: 9bacfaca-...
[MapResult] Merchant: UNIQLO
[MapResult] Total: 259000
[ReceiptEditForm] 🎬 Component mounted
[ReceiptEditForm] Props received:
[ReceiptEditForm]   - receiptId: 9bacfaca-...
[ReceiptEditForm]   - initialData: {merchant: "UNIQLO", ...}
[ReceiptEditForm] 🔄 initialData changed, updating form fields
[ReceiptEditForm] ✅ Form populated:
[ReceiptEditForm]   - merchant: UNIQLO
[ReceiptEditForm]   - totalAmount: 259000
[ReceiptEditForm]   - date: 2025-10-25
```

### Step 2: Verify Form Population

**Check these in console:**
1. `initialData` is not null/undefined
2. `initialData.merchant` has a value
3. `initialData.total_amount` has a value
4. `initialData.date` has a value
5. Form fields update after useEffect runs

**Visual Check:**
- Merchant field should show the extracted merchant name
- Total Amount field should show the extracted amount
- Date field should show the extracted date

### Step 3: Test Save Operation

Click "Save Changes" and watch console:

```
[ReceiptEditForm] 💾 Starting save process
[ReceiptEditForm] Receipt ID: 9bacfaca-...
[ReceiptEditForm] Initial data: {merchant: "UNIQLO", ...}
[ReceiptEditForm] Current receipt state: {id: "9bacfaca-...", ...}
[ReceiptEditForm] API_URL: https://api.notaku.cloud
[ReceiptEditForm] 🤔 Determining operation type:
[ReceiptEditForm]   - initialData exists: true
[ReceiptEditForm]   - receipt?.id: 9bacfaca-...
[ReceiptEditForm]   - receiptId: 9bacfaca-...
[ReceiptEditForm]   - isNewReceipt: true
[ReceiptEditForm] ✨ Creating NEW receipt (from OCR)
[ReceiptsAPI] 📝 Creating new receipt
[ReceiptsAPI] API_BASE_URL: https://api.notaku.cloud
[ReceiptsAPI] Full URL: https://api.notaku.cloud/api/v1/receipts
[ReceiptsAPI] Data: {merchant: "UNIQLO", total_amount: 259000, ...}
[Receipts API] POST https://api.notaku.cloud/api/v1/receipts
[Receipts API] Body: {merchant: "UNIQLO", ...}
[ReceiptEditForm] ✅ Receipt created: {id: "550e8400-...", ...}
```

---

## ❌ Common Errors & Solutions

### Error 1: "receiptId is undefined"

**Console Output:**
```
[ReceiptEditForm] ❌ ERROR: receiptId is undefined or empty!
```

**Cause:** Upload page didn't pass a valid receiptId

**Solution:**
1. Check upload page `mapResultToReceipt()` function
2. Verify `result.job_id || result.id || result.receipt_id` exists
3. Check OCR response format

**Fix:**
```typescript
// In upload page
const mappedReceipt = {
  id: result.job_id || result.id || result.receipt_id || "",
  // ... other fields
};

// Make sure id is not empty string
if (!mappedReceipt.id) {
  console.error('[MapResult] ❌ No valid ID found in result!');
}
```

### Error 2: "Invalid receipt ID"

**Console Output:**
```
[ReceiptsAPI] ❌ ERROR: Invalid receiptId: undefined
```

**Cause:** receiptId is literally the string "undefined"

**Solution:**
Check where receiptId is being set - likely a string interpolation issue

**Fix:**
```typescript
// ❌ Wrong
receiptId={`${result.id}`}  // If result.id is undefined, becomes "undefined"

// ✅ Correct
receiptId={result.id || ""}
```

### Error 3: "Failed to fetch"

**Console Output:**
```
TypeError: Failed to fetch
```

**Possible Causes:**
1. **Network issue** - Backend not reachable
2. **CORS issue** - Backend not allowing requests
3. **Invalid URL** - API_URL misconfigured

**Solution:**
1. Check `NEXT_PUBLIC_API_URL` in `.env.local`
2. Verify backend is running
3. Check browser Network tab for actual request
4. Verify CORS headers in backend

**Fix:**
```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.notaku.cloud

# Restart dev server after changing .env
npm run dev
```

### Error 4: Form Fields Empty

**Console Output:**
```
[ReceiptEditForm] Initial form state:
[ReceiptEditForm]   - merchant: 
[ReceiptEditForm]   - totalAmount: 
[ReceiptEditForm]   - date: 
```

**Cause:** `initialData` is null or fields are missing

**Solution:**
Check `mapResultToReceipt()` in upload page

**Fix:**
```typescript
const mapResultToReceipt = (): Receipt => {
  console.log('[MapResult] Input result:', result);
  
  // Check different response formats
  const extracted = result.extracted || {};
  
  const mappedReceipt = {
    id: result.job_id || result.id || "",
    merchant: extracted.merchant || result.supplier || result.merchant || null,
    total_amount: extracted.total_amount || result.total || null,
    date: extracted.date || result.date || null,
    // ... other fields
  };
  
  console.log('[MapResult] Mapped receipt:', mappedReceipt);
  return mappedReceipt;
};
```

### Error 5: "Validation Error"

**Console Output:**
```
[ReceiptEditForm] Validation failed
```

**Cause:** Required fields are empty or invalid

**Check:**
- Merchant: Must be at least 2 characters
- Total Amount: Must be greater than 0
- Date: Must be valid and not in future

**Solution:**
Fill in required fields or check validation logic

---

## 🎯 Testing Checklist

### Basic Flow Test
- [ ] Upload receipt image
- [ ] OCR processes successfully
- [ ] Success card appears
- [ ] ReceiptEditForm renders
- [ ] Form fields are populated with OCR data
- [ ] Can edit fields
- [ ] Click "Save Changes"
- [ ] Loading indicator shows
- [ ] Success toast appears
- [ ] Receipt saved to database

### Console Logs Test
- [ ] All upload logs appear
- [ ] Polling logs show progress
- [ ] MapResult logs show correct data
- [ ] ReceiptEditForm mount logs appear
- [ ] initialData logs show populated data
- [ ] Form population logs appear
- [ ] Save process logs appear
- [ ] API call logs show correct URL
- [ ] Success logs appear

### Error Handling Test
- [ ] Try saving with empty merchant → Shows validation error
- [ ] Try saving with zero amount → Shows validation error
- [ ] Try saving with future date → Shows validation error
- [ ] Disconnect internet → Shows network error
- [ ] Invalid receiptId → Shows ID error

---

## 🔧 Manual Debugging

### Check Props in React DevTools

1. Open React DevTools
2. Find `ReceiptEditForm` component
3. Check props:
   - `receiptId`: Should be a UUID string
   - `initialData`: Should be an object with merchant, total_amount, date
4. Check state:
   - `merchant`: Should match initialData.merchant
   - `totalAmount`: Should match initialData.total_amount
   - `date`: Should be formatted date

### Check Network Tab

1. Open DevTools → Network tab
2. Upload a receipt
3. Look for these requests:
   - `POST /api/v1/ocr/upload` → Should return job_id
   - `GET /api/v1/ocr/status/{job_id}` → Should eventually return "finished"
   - `GET /api/v1/ocr/result/{job_id}` → Should return extracted data
4. Click Save
5. Look for:
   - `POST /api/v1/receipts` → Should return created receipt with new UUID
   - OR `PUT /api/v1/receipts/{id}` → Should return updated receipt

### Check Environment Variables

```bash
# In terminal
echo $NEXT_PUBLIC_API_URL

# Or in browser console
console.log(process.env.NEXT_PUBLIC_API_URL)
```

Should output: `https://api.notaku.cloud` (or your backend URL)

If undefined, check `.env.local` file exists and restart dev server.

---

## 📊 Expected Data Flow

### 1. Upload Stage
```
User selects file
  ↓
handleUpload() called
  ↓
OCRApiClient.uploadReceipt()
  ↓
Returns: {job_id: "abc-123", status: "processing"}
  ↓
pollJobStatus() starts
```

### 2. Processing Stage
```
Poll every 1 second
  ↓
OCRApiClient.checkStatus(job_id)
  ↓
Returns: {status: "processing"} or {status: "finished"}
  ↓
When finished: OCRApiClient.getResult(job_id)
  ↓
Returns: {
  job_id: "abc-123",
  ocr_text: "...",
  ocr_confidence: 0.96,
  extracted: {
    merchant: "UNIQLO",
    total_amount: 259000,
    date: "2025-10-25"
  }
}
```

### 3. Result Stage
```
setResult(resultData)
  ↓
setStage("result")
  ↓
mapResultToReceipt() called
  ↓
Returns: Receipt object with all fields
  ↓
<ReceiptEditForm
  receiptId={result.job_id}
  initialData={mappedReceipt}
/>
```

### 4. Form Population
```
ReceiptEditForm mounts
  ↓
useState initializes with initialData
  ↓
useEffect detects initialData
  ↓
Updates all form fields:
  - setMerchant(initialData.merchant)
  - setTotalAmount(initialData.total_amount)
  - setDate(initialData.date)
  ↓
Form fields now populated ✅
```

### 5. Save Stage
```
User clicks "Save Changes"
  ↓
handleSave() called
  ↓
Validation runs
  ↓
Determines: CREATE or UPDATE?
  ↓
If NEW (from OCR):
  ReceiptsAPI.createReceipt()
  POST /api/v1/receipts
  ↓
Backend creates receipt
  ↓
Returns: {id: "new-uuid", ...}
  ↓
Success toast ✅
```

---

## 🚀 Quick Fixes

### Fix 1: Form Not Populating

Add this to `ReceiptEditForm.tsx` after line 83:

```typescript
useEffect(() => {
  console.log('[DEBUG] initialData changed:', initialData);
  if (initialData) {
    console.log('[DEBUG] Updating form fields...');
    setMerchant(initialData.merchant || "");
    setTotalAmount(initialData.total_amount?.toString() || "");
    setDate(formatDateForInput(initialData.date));
    setCategory(initialData.category || "");
    setNotes(initialData.notes || "");
    console.log('[DEBUG] Form fields updated');
  }
}, [initialData]);
```

### Fix 2: Invalid receiptId

Add this validation in `handleSave()`:

```typescript
const handleSave = async () => {
  console.log('[DEBUG] receiptId:', receiptId);
  
  if (!receiptId || receiptId === 'undefined' || receiptId === '') {
    console.error('[ERROR] Invalid receiptId!');
    toast.error('Error: Receipt ID tidak valid');
    return;
  }
  
  // ... rest of save logic
};
```

### Fix 3: API URL Missing

Create/update `.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://api.notaku.cloud
```

Then restart dev server:

```bash
npm run dev
```

---

## ✅ Success Criteria

After all fixes, you should see:

1. **Upload completes** → OCR processes → Success card appears
2. **Form renders** → All fields populated with OCR data
3. **Console shows** → All expected logs in correct order
4. **Can edit** → Change any field value
5. **Click Save** → Loading indicator appears
6. **API call** → POST /api/v1/receipts succeeds
7. **Success** → Toast notification appears
8. **Receipt saved** → Can view in receipts list

---

## 📞 Still Having Issues?

If problems persist after following this guide:

1. **Share console logs** - Copy all logs from upload to save
2. **Share Network tab** - Screenshot of API requests
3. **Share result object** - The OCR result data structure
4. **Share error message** - Exact error text and stack trace

---

**Last Updated:** 2025-10-26  
**Commit:** `840bab0` - debug: Add comprehensive logging to ReceiptEditForm
