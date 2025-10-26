# 🔍 Save Receipt Debugging Guide - Frontend & Backend

## 📊 Status Saat Ini

**Problem:** Tombol "Save Changes" tidak bekerja

**Yang Sudah Fix:**
- ✅ Form auto-populate dengan OCR text parser
- ✅ Field mapping: merchant → merchant_name, date → transaction_date
- ✅ .env.local updated dengan production URLs

**Yang Belum Work:**
- ❌ Save operation masih gagal

---

## 🎯 Step 1: Debug Frontend (Yang Harus Anda Lakukan)

### A. Buka Browser Console

**Saat click "Save Changes", cari logs ini:**

```javascript
// 1. Save dimulai
[ReceiptEditForm] 💾 Starting save process
[ReceiptEditForm] Receipt ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
[ReceiptEditForm] Initial data: {...}

// 2. Determine operation type
[ReceiptEditForm] 🤔 Determining operation type:
[ReceiptEditForm]   - isNewReceipt: true/false

// 3. CREATE atau UPDATE?
[ReceiptEditForm] ✨ Creating NEW receipt (from OCR)
// ATAU
[ReceiptEditForm] 🔄 Updating existing receipt

// 4. API call
[ReceiptsAPI] 📝 Creating new receipt
[ReceiptsAPI] API_BASE_URL: https://api.notaku.cloud
[ReceiptsAPI] Full URL: https://api.notaku.cloud/api/v1/receipts
[ReceiptsAPI] Original frontend data: {...}
[ReceiptsAPI] ✅ Mapped to backend format: {...}
[ReceiptsAPI] Backend data JSON: {...}

// 5. Response atau Error
[ReceiptsAPI] Backend response: {...}
// ATAU
[ReceiptEditForm] ❌ Error saving receipt: ...
```

### B. Buka Network Tab

1. **Buka DevTools** (F12)
2. **Pilih tab "Network"**
3. **Click "Save Changes"**
4. **Cari request:** `POST /api/v1/receipts`

**Screenshot atau catat:**
- Request URL
- Request Method (POST/PUT)
- Request Headers
- Request Payload (Body)
- Status Code (200, 400, 404, 500?)
- Response Body

---

## 📋 Step 2: Backend Checklist - Yang Perlu Diperiksa

### ✅ Checklist 1: Endpoint Exists

**File Backend:** `app/routers/receipts.py` (atau similar)

```python
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/receipts", tags=["receipts"])

@router.post("/", response_model=ReceiptResponse, status_code=201)
async def create_receipt(data: ReceiptCreate):
    """Create new receipt"""
    # Implementation here
    pass
```

**Test:**
```bash
curl -X POST https://api.notaku.cloud/api/v1/receipts \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Expected:**
- ✅ 200/201 (Success)
- ✅ 400 (Bad Request - validation error)
- ❌ 404 (Endpoint tidak ada!)

---

### ✅ Checklist 2: Field Names Match

**Backend Schema Expected:**

```python
# app/schemas/receipt.py
class ReceiptCreate(BaseModel):
    merchant_name: str          # ✅ NOT "merchant"!
    transaction_date: str       # ✅ NOT "date"!
    total_amount: float         # ✅ OK
    currency: str = "IDR"       # ✅ Optional
    category: Optional[str]     # ✅ OK
    notes: Optional[str]        # ✅ OK
    user_id: str                # ✅ Required
    ocr_text: Optional[str]     # ✅ Optional
    ocr_confidence: Optional[float]  # ✅ Optional
    image_path: Optional[str]   # ✅ Optional
```

**Frontend Sends:**
```json
{
  "merchant_name": "Uniqlo Plaza Ambarrukmo",  ← Correct!
  "transaction_date": "2025-10-07",            ← Correct!
  "total_amount": 129000,
  "currency": "IDR",
  "category": "Food & Dining",
  "notes": null,
  "user_id": "799f0fe2-f28d-4556-9e32-221fcb78ba47",
  "ocr_text": "...",
  "ocr_confidence": 0.98,
  "image_path": "https://..."
}
```

**Test Backend Schema:**
```python
# In backend, log incoming data
@router.post("/")
async def create_receipt(data: ReceiptCreate):
    print(f"[Backend] Received data: {data}")
    print(f"[Backend] merchant_name: {data.merchant_name}")
    print(f"[Backend] transaction_date: {data.transaction_date}")
    # ... validate each field
```

---

### ✅ Checklist 3: CORS Configuration

**File Backend:** `app/main.py`

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",           # Dev
        "https://notaku.cloud",            # Production
        "https://www.notaku.cloud",        # Production www
    ],
    allow_credentials=True,
    allow_methods=["*"],                   # Allow POST, PUT, DELETE
    allow_headers=["*"],                   # Allow all headers
)
```

**Test CORS:**
```bash
curl -X OPTIONS https://api.notaku.cloud/api/v1/receipts \
  -H "Origin: https://notaku.cloud" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Expected Headers in Response:**
```
Access-Control-Allow-Origin: https://notaku.cloud
Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS
Access-Control-Allow-Credentials: true
```

---

### ✅ Checklist 4: Authentication

**Backend harus accept cookies/token:**

```python
from fastapi import Depends, HTTPException
from app.auth import get_current_user

@router.post("/")
async def create_receipt(
    data: ReceiptCreate,
    current_user = Depends(get_current_user)  # ✅ Auth check
):
    # Validate user_id matches current user
    if data.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Create receipt
    ...
```

**Test Auth:**
```bash
# Without token
curl -X POST https://api.notaku.cloud/api/v1/receipts \
  -H "Content-Type: application/json" \
  -d '{...}'
# Should return 401 Unauthorized

# With token
curl -X POST https://api.notaku.cloud/api/v1/receipts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{...}'
# Should work
```

---

### ✅ Checklist 5: Database Model

**Backend Model:**

```python
# app/models/receipt.py
from sqlalchemy import Column, String, Float, DateTime, Text, Boolean

class Receipt(Base):
    __tablename__ = "receipts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    merchant_name = Column(String, nullable=False)        # ✅ NOT merchant!
    transaction_date = Column(String, nullable=False)     # ✅ NOT date!
    total_amount = Column(Float, nullable=False)
    currency = Column(String, default="IDR")
    category = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    ocr_text = Column(Text, nullable=True)
    ocr_confidence = Column(Float, nullable=True)
    image_path = Column(String, nullable=True)
    is_edited = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
```

**Check Database:**
```sql
-- Check table structure
DESCRIBE receipts;

-- Check if table exists
SHOW TABLES LIKE 'receipts';

-- Check columns
SHOW COLUMNS FROM receipts;
```

---

### ✅ Checklist 6: Backend Logs

**Check backend server logs:**

```bash
# If using Docker
docker logs -f notaku-backend

# If using systemd
journalctl -u notaku-api -f

# If using PM2
pm2 logs notaku-api

# Or direct log file
tail -f /var/log/notaku/api.log
```

**Look for:**
```
POST /api/v1/receipts
Request body: {...}
Validation error: ...
Database error: ...
Response: 201 Created
```

---

## 🧪 Step 3: Testing Workflow

### Frontend Test (Browser)

1. **Upload receipt** di https://notaku.cloud
2. **Wait for OCR** to complete
3. **Verify form fields** terisi
4. **Click "Save Changes"**
5. **Open Console** - Copy ALL logs
6. **Open Network tab** - Screenshot POST request

### Backend Test (Server)

1. **SSH to backend server:**
   ```bash
   ssh user@api.notaku.cloud
   ```

2. **Check if backend running:**
   ```bash
   ps aux | grep python
   # or
   docker ps | grep notaku
   # or
   pm2 list
   ```

3. **Test endpoint directly:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/receipts \
     -H "Content-Type: application/json" \
     -d '{
       "merchant_name": "Test Merchant",
       "transaction_date": "2025-10-27",
       "total_amount": 100000,
       "currency": "IDR",
       "user_id": "test-user-id",
       "category": null,
       "notes": null,
       "ocr_text": "test",
       "ocr_confidence": 0.95,
       "image_path": "https://test.com/image.jpg"
     }'
   ```

4. **Check logs immediately:**
   ```bash
   tail -50 /var/log/notaku/api.log
   ```

---

## 📊 Common Issues & Solutions

### Issue 1: 404 Not Found

**Cause:** Endpoint tidak exist atau router tidak registered

**Check:**
```python
# app/main.py
from app.routers import receipts

app.include_router(receipts.router)  # ✅ Must include!
```

**Solution:** Implement endpoint or register router

---

### Issue 2: 422 Validation Error

**Cause:** Field name mismatch atau missing required field

**Error Response:**
```json
{
  "detail": [
    {
      "loc": ["body", "merchant_name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Solution:** 
- Frontend sudah send `merchant_name` ✅
- Check backend schema accepts it

---

### Issue 3: 401 Unauthorized

**Cause:** Authentication token invalid atau missing

**Check:**
- User logged in?
- Cookie being sent?
- Token valid?

**Solution:** Implement proper auth or make endpoint public for testing

---

### Issue 4: 500 Internal Server Error

**Cause:** Backend code error atau database error

**Check backend logs for:**
```
Traceback (most recent call last):
  File "...", line X, in create_receipt
    ...
Error: ...
```

**Solution:** Fix backend code based on error

---

### Issue 5: CORS Error

**Error in Browser:**
```
Access to fetch at 'https://api.notaku.cloud/api/v1/receipts' 
from origin 'https://notaku.cloud' has been blocked by CORS policy
```

**Solution:** Add CORS middleware in backend

---

## 🎯 What You Need to Share

**Untuk saya bisa help debug, tolong share:**

### From Frontend (Browser):

1. **Console logs** - Semua dari `[ReceiptEditForm]` dan `[ReceiptsAPI]`
2. **Network tab screenshot:**
   - Request URL
   - Request Headers
   - Request Payload
   - Response Status
   - Response Body
3. **Error message** yang muncul di toast/alert

### From Backend (Server):

1. **Backend logs** saat request terjadi
2. **Endpoint implementation** - `receipts.py` file
3. **Schema definition** - `ReceiptCreate` model
4. **Database table structure** - `DESCRIBE receipts`
5. **CORS configuration** - `main.py` middleware

---

## 🚀 Quick Test Script

**Save this as `test-save.sh`:**

```bash
#!/bin/bash

echo "🧪 Testing Receipt Save Endpoint"
echo ""

# Test 1: Check if endpoint exists
echo "📍 Test 1: Endpoint exists?"
curl -I https://api.notaku.cloud/api/v1/receipts
echo ""

# Test 2: POST with minimal data
echo "📍 Test 2: POST request"
curl -X POST https://api.notaku.cloud/api/v1/receipts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "merchant_name": "Test Merchant",
    "transaction_date": "2025-10-27",
    "total_amount": 100000,
    "currency": "IDR",
    "user_id": "test-user-id"
  }' \
  -v
echo ""

# Test 3: Check CORS
echo "📍 Test 3: CORS preflight"
curl -X OPTIONS https://api.notaku.cloud/api/v1/receipts \
  -H "Origin: https://notaku.cloud" \
  -H "Access-Control-Request-Method: POST" \
  -v
echo ""

echo "✅ Test complete!"
```

**Run:**
```bash
chmod +x test-save.sh
./test-save.sh
```

---

## 📞 Next Steps

1. ✅ **Lakukan testing frontend** - Share console logs & network screenshot
2. ✅ **Check backend logs** - Share error messages
3. ✅ **Test endpoint** langsung dengan curl
4. ✅ **Verify CORS** configuration
5. ✅ **Share findings** untuk saya analyze

**Dengan informasi ini, saya bisa identify exact problem dan provide solution!** 🎯
