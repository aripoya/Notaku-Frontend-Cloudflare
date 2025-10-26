# 🖼️ Receipt Image Debug Guide

## 🔍 Problem: Image Not Showing

Jika gambar nota tidak muncul (menampilkan "No Image Available"), ikuti langkah debugging ini.

---

## 📊 Step 1: Check Console Logs

### Buka Browser Console
1. **Chrome/Edge**: Press `F12` atau `Cmd+Option+I` (Mac)
2. **Firefox**: Press `F12` atau `Cmd+Option+K` (Mac)
3. Pilih tab **Console**

### Cari Logs Ini:

```javascript
// Saat page load, cari logs ini:
[ReceiptDetail] ✅ Fetched receipt data: {object}
[ReceiptDetail] 🖼️ Image path: "..."
[ReceiptDetail] 📊 All keys: [array]
[ReceiptDetail] 🎨 Rendering with imageUrl: "..."
```

### Screenshot atau Copy Logs:
- Copy semua logs yang dimulai dengan `[ReceiptDetail]`
- Khusus perhatikan nilai `image_path`

---

## 🎯 Step 2: Identify Issue

### Case 1: `image_path: null` atau `undefined`
**Problem:** Backend tidak return image path

**Solusi Backend:**
```python
# Check backend response
{
  "id": "uuid",
  "merchant_name": "...",
  "image_path": null,  # ❌ This is the problem!
  ...
}
```

**Action:**
1. Check database - apakah `image_path` column ada value?
2. Check backend API response - include `image_path` in response

**SQL Check:**
```sql
SELECT id, merchant_name, image_path 
FROM receipts 
WHERE id = 'your-receipt-id';
```

### Case 2: `image_path: "blob:https://..."`
**Problem:** Blob URL dari upload, bukan permanent URL

**Explanation:**
```javascript
// Blob URL (temporary, local only)
"blob:https://notaku.cloud/51c69987-..."  // ❌ Won't work after refresh

// Permanent URL (correct)
"https://storage.notaku.cloud/receipts/abc123.jpg"  // ✅ Works always
```

**Solusi:**
- Backend harus save image ke permanent storage (S3, Cloud Storage, etc)
- Return permanent URL, bukan blob URL

### Case 3: Field Name Different
**Problem:** Backend uses different field name

**Check logs for:**
```javascript
[ReceiptDetail] 📊 All keys: ["id", "merchant_name", "image_url", ...]
                                                      ^^^^^^^^^^
                                                      different name!
```

**If field is `image_url` instead of `image_path`:**
- Code sudah handle ini! (checks both `image_path` and `image_url`)
- Tapi masih perlu verify di backend response

### Case 4: Image URL Invalid
**Look for:**
```javascript
[ReceiptDetail] ❌ Image load error: "https://..."
```

**Possible Issues:**
- URL tidak valid
- CORS issue (domain blocked)
- Image file tidak exist di storage
- Authentication required

**Test URL manually:**
1. Copy image URL dari console
2. Paste di browser address bar
3. Check if image loads

---

## 🛠️ Step 3: Backend Checklist

### ✅ Database Check
```sql
-- Check if image_path column exists
DESCRIBE receipts;

-- Check image_path values
SELECT id, merchant_name, image_path, created_at 
FROM receipts 
ORDER BY created_at DESC 
LIMIT 10;
```

**Expected:**
- `image_path` column exists
- Values are permanent URLs (not null, not blob:)
- URLs are accessible

### ✅ API Response Check

**Test endpoint:**
```bash
curl -X GET https://api.notaku.cloud/api/v1/receipts/{id} \
  -H "Cookie: your-auth-cookie" \
  -v
```

**Expected response:**
```json
{
  "id": "uuid",
  "merchant_name": "Uniqlo Plaza Ambarrukmo",
  "image_path": "https://storage.notaku.cloud/receipts/abc123.jpg",
  "transaction_date": "2025-10-02",
  ...
}
```

**Check:**
- [ ] `image_path` field exists in response
- [ ] Value is not null
- [ ] Value is permanent URL (not blob:)
- [ ] URL is accessible (test in browser)

### ✅ Storage Check

**If using S3/Cloud Storage:**
```python
# Backend should save image to permanent storage
def upload_receipt_image(file):
    # Upload to S3/Cloud Storage
    url = storage.upload(file, bucket="receipts")
    
    # Save URL to database
    receipt.image_path = url
    db.commit()
    
    return url
```

**Verify:**
- [ ] Images are uploaded to permanent storage
- [ ] URLs are public or have signed URLs
- [ ] CORS is configured for your domain

---

## 🔧 Step 4: Fix Implementation

### Frontend (Already Done ✅)
```typescript
// Code checks both field names
const imageUrl = receipt.image_path || receipt.image_url;

// Shows debug info when missing
{imageUrl ? `Path: ${imageUrl}` : "No image path in database"}
```

### Backend Fix Options

#### Option 1: Return Permanent URL
```python
# app/routers/receipts.py
@router.get("/{receipt_id}")
async def get_receipt(receipt_id: str):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    
    return {
        "id": receipt.id,
        "merchant_name": receipt.merchant_name,
        "image_path": receipt.image_path,  # ✅ Include this!
        "transaction_date": receipt.transaction_date,
        ...
    }
```

#### Option 2: Generate Signed URL
```python
# If using S3 with private buckets
from boto3 import client

s3 = client('s3')

def get_signed_url(image_path):
    if not image_path:
        return None
    
    # Generate signed URL (valid for 1 hour)
    url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': 'receipts', 'Key': image_path},
        ExpiresIn=3600
    )
    return url

@router.get("/{receipt_id}")
async def get_receipt(receipt_id: str):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    
    # Generate signed URL if image exists
    image_url = get_signed_url(receipt.image_path) if receipt.image_path else None
    
    return {
        ...
        "image_path": image_url,  # Return signed URL
        ...
    }
```

---

## 🧪 Step 5: Test Flow

### Complete Test:
1. **Upload new receipt**
   - Go to `/dashboard/upload`
   - Upload image file
   - Check console for upload success

2. **Check upload response**
   ```javascript
   // Should see in console:
   {
     "image_path": "https://storage.../abc123.jpg",  // ✅ Permanent URL
     ...
   }
   ```

3. **View receipt detail**
   - Go to receipt list
   - Click receipt card
   - Check console logs:
     ```javascript
     [ReceiptDetail] 🖼️ Image path: "https://..."
     [ReceiptDetail] ✅ Image loaded successfully
     ```

4. **Verify image shows**
   - Image should display in left panel
   - No "No Image Available" message
   - Download button works

---

## 📋 Common Issues & Solutions

### Issue 1: Blob URL After Refresh
**Symptom:** Image shows on upload, disappears after refresh

**Cause:** Using temporary blob URL

**Solution:** Save to permanent storage, return permanent URL

---

### Issue 2: CORS Error
**Symptom:** 
```
Access to image at 'https://storage....' from origin 'https://notaku.cloud' 
has been blocked by CORS policy
```

**Solution:** Configure CORS on storage:
```xml
<!-- S3 CORS Configuration -->
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>https://notaku.cloud</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
  </CORSRule>
</CORSConfiguration>
```

---

### Issue 3: 403 Forbidden
**Symptom:** Image URL returns 403

**Cause:** Private storage without signed URL

**Solution:** Either:
- Make bucket/folder public for receipt images
- Or generate signed URLs in backend

---

### Issue 4: Wrong Domain
**Symptom:** Image URL has wrong domain

**Example:**
```javascript
// Wrong
"http://localhost:9000/receipts/abc.jpg"

// Correct  
"https://storage.notaku.cloud/receipts/abc.jpg"
```

**Solution:** Configure storage URL in backend:
```python
STORAGE_BASE_URL = "https://storage.notaku.cloud"
image_url = f"{STORAGE_BASE_URL}/receipts/{filename}"
```

---

## 🎯 Quick Diagnostic

**Run this in browser console on detail page:**
```javascript
// Copy this entire block and run in console:
console.log("=== IMAGE DIAGNOSTIC ===");
console.log("Receipt ID:", new URLSearchParams(window.location.search).get('id'));

// This will show all the debug info:
// - What data was fetched
// - What image URL is being used
// - Whether image loaded or failed
```

**Look for:**
- ✅ Green checkmarks = working
- ❌ Red X = errors
- ⚠️ Warning = missing data

---

## 📞 What to Share for Support

If masih belum solved, share these:

1. **Console logs** (all `[ReceiptDetail]` logs)
2. **API response** (curl output or network tab)
3. **Database query** result for that receipt ID
4. **Image URL** that's not loading
5. **Storage configuration** (S3, local, etc)

---

## ✅ Success Checklist

After fixing, verify:

- [ ] Upload new receipt → image shows immediately
- [ ] Refresh page → image still shows
- [ ] Navigate to detail → image shows
- [ ] Download button works
- [ ] No console errors
- [ ] No "No Image Available" message

---

**Updated:** 2025-10-27
**Status:** Debug tools implemented ✅
