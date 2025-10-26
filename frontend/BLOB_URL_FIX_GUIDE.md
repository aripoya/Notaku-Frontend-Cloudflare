# 🐛 BLOB URL Bug - FIXED!

## ❌ The Problem

**Database was showing:**
```
blob:https://notaku.cloud/db556b68-02ca-4a4a-953c-...
```

**Should have been:**
```
https://api.notaku.cloud/storage/receipts/799f.../image.jpg
```

---

## 🔍 Root Cause Analysis

### What Happened:

1. **User uploads image** → File object created
2. **Frontend creates preview** → `URL.createObjectURL(file)` 
   - Creates: `blob:https://notaku.cloud/abc123...`
   - This is a **TEMPORARY** URL that only works in current browser session
3. **Frontend sends to backend** → Sent blob URL in `image_path` field ❌
4. **Backend saves to database** → Stored blob URL ❌
5. **User refreshes page** → Blob URL no longer exists! Image broken ❌

### Why Blob URLs Don't Work:

```javascript
// Blob URLs are TEMPORARY and LOCAL ONLY
const blobUrl = URL.createObjectURL(file);
// Returns: "blob:https://notaku.cloud/51c69987-..."

// ❌ This URL:
// - Only exists in current browser session
// - Cannot be accessed from other devices
// - Disappears after page refresh
// - Cannot be stored in database
// - Cannot be shared
```

---

## ✅ The Fix

### Frontend Changes

#### 1. **Convert File to Base64**

```typescript
// ✅ BEFORE (WRONG):
const blobUrl = URL.createObjectURL(file);
setImagePath(blobUrl); // ❌ Sends blob URL to backend

// ✅ AFTER (CORRECT):
const reader = new FileReader();
reader.onloadend = () => {
  const base64String = reader.result; // data:image/jpeg;base64,/9j/...
  setImageBase64(base64String); // ✅ Store base64 for backend
};
reader.readAsDataURL(file);

// Keep blob URL ONLY for preview
const previewUrl = URL.createObjectURL(file);
setImagePreview(previewUrl); // ✅ Only for display
```

#### 2. **Send Base64 to Backend**

```typescript
// ✅ Payload structure:
const payload = {
  merchant_name: "Uniqlo",
  total_amount: 129000,
  transaction_date: "2025-10-02",
  currency: "IDR",
  user_id: "user-123",
  ocr_text: "UNIQLO\n...",
  ocr_confidence: 0.95,
  image_base64: "data:image/jpeg;base64,/9j/4AAQSkZJRg...", // ✅ Send this!
  // ❌ DO NOT send: image_path with blob URL
};
```

#### 3. **Use Backend's Response**

```typescript
// Backend response should contain permanent URL:
{
  "id": "receipt-uuid",
  "image_path": "https://api.notaku.cloud/storage/receipts/799f.../abc.jpg" // ✅ Use this!
}

// ❌ DO NOT use local blob URL after save
```

---

## 🎯 Backend Requirements

### What Backend Must Do:

#### 1. **Accept image_base64 Field**

```python
# Backend schema (Pydantic):
class ReceiptCreate(BaseModel):
    merchant_name: str
    total_amount: Decimal
    transaction_date: date
    currency: str = "IDR"
    user_id: str
    ocr_text: Optional[str] = ""
    ocr_confidence: Optional[float] = 0
    image_base64: Optional[str] = None  # ✅ Add this field
```

#### 2. **Decode and Save Base64 Image**

```python
import base64
import uuid
from pathlib import Path

def save_base64_image(base64_string: str, user_id: str) -> str:
    """
    Save base64 image to storage and return permanent URL
    """
    # Remove data URI prefix
    if ',' in base64_string:
        header, encoded = base64_string.split(',', 1)
    else:
        encoded = base64_string
    
    # Decode base64
    image_data = base64.b64decode(encoded)
    
    # Generate unique filename
    filename = f"{user_id}/{uuid.uuid4()}.jpg"
    
    # Save to storage (S3 or local)
    if USE_S3:
        # Upload to S3
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=filename,
            Body=image_data,
            ContentType='image/jpeg'
        )
        image_url = f"https://storage.notaku.cloud/{filename}"
    else:
        # Save locally
        filepath = Path(UPLOAD_DIR) / filename
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, 'wb') as f:
            f.write(image_data)
        image_url = f"https://api.notaku.cloud/storage/{filename}"
    
    return image_url
```

#### 3. **Update Endpoint**

```python
@router.post("/api/v1/receipts/")
async def create_receipt(receipt_data: ReceiptCreate, db: Session = Depends(get_db)):
    # Save image if base64 provided
    image_path = None
    if receipt_data.image_base64:
        image_path = save_base64_image(receipt_data.image_base64, receipt_data.user_id)
    
    # Create receipt in database
    receipt = Receipt(
        id=str(uuid.uuid4()),
        user_id=receipt_data.user_id,
        merchant_name=receipt_data.merchant_name,
        total_amount=receipt_data.total_amount,
        transaction_date=receipt_data.transaction_date,
        currency=receipt_data.currency,
        category=receipt_data.category,
        notes=receipt_data.notes,
        ocr_text=receipt_data.ocr_text,
        ocr_confidence=receipt_data.ocr_confidence,
        image_path=image_path,  # ✅ Save permanent URL
        created_at=datetime.now()
    )
    
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    
    return receipt
```

---

## 📊 Data Flow

### ✅ Correct Flow (After Fix):

```
1. User selects image file
   ↓
2. Frontend converts to base64
   - Store base64 in state (for backend)
   - Create blob URL (for preview only)
   ↓
3. User clicks save
   ↓
4. Frontend sends to backend:
   POST /api/v1/receipts/
   {
     "image_base64": "data:image/jpeg;base64,..."
   }
   ↓
5. Backend receives request
   ↓
6. Backend decodes base64
   ↓
7. Backend saves to storage (S3/local)
   → Returns: "https://api.notaku.cloud/storage/receipts/abc.jpg"
   ↓
8. Backend saves to database:
   image_path = "https://api.notaku.cloud/storage/receipts/abc.jpg"
   ↓
9. Backend returns response:
   {
     "id": "uuid",
     "image_path": "https://api.notaku.cloud/storage/receipts/abc.jpg"
   }
   ↓
10. Frontend stores permanent URL
    ↓
11. ✅ Image loads correctly after refresh!
```

---

## 🧪 Testing & Validation

### Frontend Test:

1. **Open DevTools → Network Tab**
2. **Upload a receipt with image**
3. **Find POST request to `/receipts/`**
4. **Check Request Payload:**

```json
{
  "merchant_name": "Test Store",
  "total_amount": 50000,
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
  // ✅ Should see base64 string (very long!)
  // ❌ Should NOT see: "image_path": "blob:https://..."
}
```

5. **Check Response:**

```json
{
  "id": "abc-123",
  "image_path": "https://api.notaku.cloud/storage/receipts/xyz.jpg"
  // ✅ Should be permanent URL
  // ❌ NOT blob URL
}
```

### Backend Test:

```bash
# 1. Check database
SELECT id, merchant_name, image_path 
FROM receipts 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

# Expected:
# image_path should start with "https://"
# NOT "blob:"

# 2. Test image URL
curl -I https://api.notaku.cloud/storage/receipts/abc.jpg
# Should return: 200 OK
# Should have Content-Type: image/jpeg
```

### Full Integration Test:

```bash
# Test script
1. Upload new receipt with image
2. Open browser console
3. Check logs:
   [Upload] 📦 Image converted to base64, length: 123456
   [ReceiptsAPI] ✅ Sending image_base64 to backend
   [ReceiptsAPI] ⚠️ SKIPPING blob URL image_path: blob:https://...
   
4. Save receipt
5. Check database → image_path should be https:// URL
6. Refresh page
7. ✅ Image should display correctly!
```

---

## ⚠️ Common Issues

### Issue 1: Backend Still Returns Blob URL

**Symptom:** Database has blob URL

**Cause:** Backend not processing image_base64

**Fix:** Implement save_base64_image() function in backend

### Issue 2: Image Too Large Error

**Symptom:** 413 Request Entity Too Large

**Cause:** Base64 encoded images are ~33% larger than original

**Fix:** Increase max request size:

```python
# FastAPI
from fastapi import FastAPI

app = FastAPI()
app.add_middleware(
    middleware_class=...,
    max_request_size=10 * 1024 * 1024  # 10MB
)
```

```nginx
# Nginx
client_max_body_size 10M;
```

### Issue 3: CORS Error on Image

**Symptom:** Image URL returns CORS error

**Fix:** Configure CORS on storage:

```python
# S3 CORS
{
  "CORSRules": [{
    "AllowedOrigins": ["https://notaku.cloud"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"]
  }]
}
```

---

## 📝 Checklist

### Frontend ✅
- [x] Convert file to base64
- [x] Store base64 in state
- [x] Send base64 to backend
- [x] Skip blob URLs
- [x] Use backend's image_path in response

### Backend ⚠️ (TODO)
- [ ] Accept image_base64 field
- [ ] Implement base64 decode
- [ ] Save to storage (S3 or local)
- [ ] Return permanent URL
- [ ] Save URL to database
- [ ] Configure CORS for storage

### Testing
- [ ] Upload receipt with image
- [ ] Check Network tab for base64
- [ ] Check database for https:// URL
- [ ] Refresh page
- [ ] Verify image displays

---

## 🎉 Success Criteria

After implementing the fix:

✅ **No more blob URLs in database**
```sql
SELECT * FROM receipts WHERE image_path LIKE 'blob:%';
-- Should return 0 rows
```

✅ **All images have permanent URLs**
```sql
SELECT * FROM receipts WHERE image_path LIKE 'https://%';
-- All receipts should have this
```

✅ **Images display after refresh**
- Upload receipt → Image shows ✅
- Refresh page → Image still shows ✅
- Open on different device → Image shows ✅

---

## 📚 References

- **FileReader API**: https://developer.mozilla.org/en-US/docs/Web/API/FileReader
- **Base64 Encoding**: https://developer.mozilla.org/en-US/docs/Glossary/Base64
- **Blob URLs**: https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL

---

**Updated:** 2025-10-27
**Status:** ✅ Frontend FIXED | ⚠️ Backend PENDING
