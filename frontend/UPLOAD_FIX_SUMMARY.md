# Upload Receipt Save Fix - Summary

## Problem
Setelah proses OCR selesai di `/dashboard/upload`, nota tidak bisa disimpan ke `/dashboard/receipts`. Receipt hanya tersimpan di localStorage tanpa dikirim ke backend API.

## Root Cause
Fungsi `handleSaveReceipt` hanya menyimpan data ke localStorage saja, tidak memanggil backend API endpoint untuk persist data ke database.

## Solution Implemented

### Changes Made:
1. **Import ReceiptsAPI** - Added import for backend API client
2. **Update handleSaveReceipt** - Changed from sync to async function
3. **Backend API Integration** - Call `ReceiptsAPI.createReceipt()` with proper data format
4. **Fallback Strategy** - Keep localStorage save as fallback if backend fails
5. **User Feedback** - Show different toast messages for backend vs localStorage save

### Code Flow:
```
1. User completes OCR processing
2. User edits receipt details in ReceiptEditForm
3. User clicks "Simpan Nota"
4. handleSaveReceipt is called
5. Try to save to backend API first:
   ├─ Success → Show success toast → Navigate to /dashboard/receipts
   └─ Failed → Save to localStorage → Show warning toast → Navigate to /dashboard/receipts
```

### API Payload Format:
```typescript
{
  merchant_name: string,
  total_amount: number,
  currency: string,        // default: "IDR"
  transaction_date: string, // ISO date format
  category: string | null,
  notes: string | null,
}
```

### Toast Messages:
- **Success (Backend)**: "Nota berhasil disimpan ke server!"
- **Fallback (localStorage)**: "Nota disimpan secara lokal" (warning)
- **Error**: "Gagal menyimpan nota"

## Testing Steps

### Step 1: Test Backend Save (Happy Path)
1. Go to https://www.notaku.cloud/dashboard/upload
2. Upload a receipt image
3. Wait for OCR processing to complete
4. Verify OCR results in ReceiptEditForm
5. Edit fields if needed (merchant, amount, date, category)
6. Click "Simpan Nota" button
7. **Expected**:
   - Toast: "Nota berhasil disimpan ke server!"
   - Console log: `[Save] ✅ Successfully saved to backend`
   - Redirect to /dashboard/receipts after 1.5s
   - Receipt appears in receipts list

### Step 2: Verify Backend Saved Data
1. Go to /dashboard/receipts
2. Find the newly saved receipt in the list
3. Click to view details
4. Verify all fields are correct:
   - Merchant name
   - Total amount
   - Transaction date
   - Category
   - Notes

### Step 3: Test Fallback to localStorage
1. **Simulate backend failure**: Stop backend server or block network
2. Go to /dashboard/upload
3. Upload and process a receipt
4. Click "Simpan Nota"
5. **Expected**:
   - Console log: `[Save] ❌ Backend API error`
   - Console log: `[Save] 💾 Falling back to localStorage...`
   - Toast: "Nota disimpan secara lokal" (warning)
   - Redirect to /dashboard/receipts
   - Receipt appears in list (from localStorage)

## Console Logs for Debugging

```javascript
// Check what's being saved
[Save] 💾 Starting save process: {merchant, total_amount, ...}
[Save] 📤 Saving to backend API: {merchant_name, total_amount, ...}

// Success path
[Save] ✅ Successfully saved to backend: {id, user_id, ...}

// Fallback path
[Save] ❌ Backend API error: <error details>
[Save] 💾 Falling back to localStorage...
[Save] ✅ Saved to localStorage! Total receipts: 5
```

## API Endpoint Details

**Endpoint**: `POST /api/v1/receipts`

**Headers**:
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (if authenticated)

**Request Body**:
```json
{
  "merchant_name": "Indomaret",
  "total_amount": 25000,
  "currency": "IDR",
  "transaction_date": "2025-11-06",
  "category": "Groceries",
  "notes": "Weekly shopping"
}
```

**Response** (201 Created):
```json
{
  "id": "receipt_123abc",
  "user_id": "user_456def",
  "merchant_name": "Indomaret",
  "total_amount": 25000,
  "currency": "IDR",
  "transaction_date": "2025-11-06",
  "category": "Groceries",
  "notes": "Weekly shopping",
  "created_at": "2025-11-06T10:30:00Z",
  "updated_at": "2025-11-06T10:30:00Z"
}
```

## Related Files Modified
- `frontend/src/app/(dashboard)/dashboard/upload/page.tsx`
  - Added `ReceiptsAPI` import
  - Updated `handleSaveReceipt` function

## Backend Requirements

The backend must have the following endpoint implemented:
- `POST /api/v1/receipts` - Create new receipt

Expected behavior:
- Accept the payload format shown above
- Return 201 Created with receipt object
- Handle authentication via Bearer token
- Validate required fields (merchant_name, total_amount, transaction_date)

## Future Improvements

1. **Sync localStorage to backend**: Add background sync for offline-saved receipts
2. **Retry logic**: Implement automatic retry with exponential backoff
3. **Optimistic UI**: Show receipt in list immediately, sync in background
4. **Conflict resolution**: Handle cases where same receipt exists in both localStorage and backend
5. **Batch upload**: Allow uploading multiple localStorage receipts at once

## Rollback Plan

If this causes issues:
```bash
git revert 1c39719
git push origin main
```

Or restore previous behavior:
```typescript
const handleSaveReceipt = (receipt: Receipt) => {
  // Remove async, remove backend API call
  // Keep only localStorage logic
}
```

## Monitoring

After deployment, monitor:
1. Backend logs: Check for `POST /api/v1/receipts` requests
2. Success rate: Track 201 vs 4xx/5xx responses
3. Error patterns: Common validation errors
4. User feedback: Reports of missing receipts

## Contact
For issues or questions, check:
- Backend API logs: `docker logs notaku-backend`
- Frontend console: Browser DevTools → Console
- Network tab: Check API request/response
