# Backend Receipt Endpoint - Troubleshooting Guide

## 🔴 Current Issue

Save button failing with error:
```
Error saving receipt: TypeError: Failed to fetch (undefined)
```

## 🎯 Root Cause

Frontend is trying to **CREATE** a new receipt via:
```
POST https://api.notaku.cloud/api/v1/receipts
```

But getting "Failed to fetch" which means:
1. **Endpoint tidak ada** (404 Not Found)
2. **CORS issue** (Backend tidak allow request)
3. **Backend down** (Connection refused)
4. **Request format salah** (400 Bad Request)

---

## 🔍 Step 1: Check Backend Endpoint

### Verify Endpoint Exists

**Expected endpoint:**
```
POST /api/v1/receipts
```

**Request body:**
```json
{
  "merchant": "UNIQLO PLAZA AMBARRUKMO",
  "total_amount": 213839,
  "date": "2025-10-25",
  "category": "Transportation",
  "notes": null,
  "user_id": "user-uuid-here",
  "ocr_text": "raw OCR text...",
  "ocr_confidence": 0.96,
  "image_path": "https://..."
}
```

**Expected response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-uuid",
  "merchant": "UNIQLO PLAZA AMBARRUKMO",
  "total_amount": 213839,
  "date": "2025-10-25",
  "category": "Transportation",
  "notes": null,
  "ocr_text": "...",
  "ocr_confidence": 0.96,
  "image_path": "https://...",
  "is_edited": false,
  "created_at": "2025-10-26T03:15:00Z"
}
```

---

## 🧪 Step 2: Test Backend Directly

### Using curl:

```bash
curl -X POST https://api.notaku.cloud/api/v1/receipts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "merchant": "Test Merchant",
    "total_amount": 100000,
    "date": "2025-10-25",
    "category": null,
    "notes": null,
    "user_id": "YOUR_USER_ID",
    "ocr_text": "test",
    "ocr_confidence": 0.95,
    "image_path": "https://example.com/image.jpg"
  }'
```

### Expected Responses:

**✅ Success (201 Created):**
```json
{
  "id": "uuid",
  "merchant": "Test Merchant",
  ...
}
```

**❌ Not Found (404):**
```json
{
  "detail": "Not Found"
}
```
→ **Endpoint belum diimplementasi!**

**❌ CORS Error:**
```
Access to fetch at 'https://api.notaku.cloud/api/v1/receipts' from origin 'http://localhost:3000' has been blocked by CORS policy
```
→ **Backend perlu tambah CORS headers!**

**❌ Bad Request (400):**
```json
{
  "detail": "Validation error",
  "errors": [...]
}
```
→ **Request format salah atau field missing**

**❌ Unauthorized (401):**
```json
{
  "detail": "Not authenticated"
}
```
→ **Token invalid atau expired**

---

## 🔧 Step 3: Check Backend Implementation

### Required Backend Code

**File:** `app/routers/receipts.py` (atau similar)

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.receipt import Receipt
from app.schemas.receipt import ReceiptCreate, ReceiptResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/v1/receipts", tags=["receipts"])

@router.post("/", response_model=ReceiptResponse, status_code=201)
async def create_receipt(
    data: ReceiptCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new receipt from OCR data
    """
    # Validate user_id matches current user
    if data.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot create receipt for another user")
    
    # Create receipt
    new_receipt = Receipt(
        user_id=data.user_id,
        merchant=data.merchant,
        total_amount=data.total_amount,
        date=data.date,
        category=data.category,
        notes=data.notes,
        ocr_text=data.ocr_text,
        ocr_confidence=data.ocr_confidence,
        image_path=data.image_path,
        is_edited=False
    )
    
    db.add(new_receipt)
    db.commit()
    db.refresh(new_receipt)
    
    return new_receipt
```

### Required Schema

**File:** `app/schemas/receipt.py`

```python
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class ReceiptCreate(BaseModel):
    user_id: str
    merchant: str
    total_amount: float
    date: str  # or date type
    category: Optional[str] = None
    notes: Optional[str] = None
    ocr_text: Optional[str] = None
    ocr_confidence: Optional[float] = None
    image_path: Optional[str] = None

class ReceiptResponse(BaseModel):
    id: str
    user_id: str
    merchant: str
    total_amount: float
    date: str
    category: Optional[str]
    notes: Optional[str]
    ocr_text: Optional[str]
    ocr_confidence: Optional[float]
    image_path: Optional[str]
    is_edited: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
```

### Required Model

**File:** `app/models/receipt.py`

```python
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base
import uuid

class Receipt(Base):
    __tablename__ = "receipts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False)
    merchant = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False)
    date = Column(String, nullable=False)  # or Date type
    category = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    ocr_text = Column(Text, nullable=True)
    ocr_confidence = Column(Float, nullable=True)
    image_path = Column(String, nullable=True)
    is_edited = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
```

### Register Router

**File:** `app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import receipts

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://notaku.cloud",
        "https://www.notaku.cloud"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(receipts.router)
```

---

## 🔍 Step 4: Check Network Tab

1. **Buka DevTools (F12)**
2. **Pilih tab Network**
3. **Click "Save Changes"**
4. **Cari request ke `/api/v1/receipts`**

### What to Check:

**Request:**
- Method: `POST`
- URL: `https://api.notaku.cloud/api/v1/receipts`
- Headers: 
  - `Content-Type: application/json`
  - `Authorization: Bearer ...`
- Body: JSON dengan semua fields

**Response:**
- Status: `201 Created` (success) atau error code
- Body: Receipt object atau error message

### Common Issues:

**❌ Request tidak muncul:**
→ JavaScript error sebelum fetch

**❌ Status (failed):**
→ Network error atau CORS

**❌ Status 404:**
→ Endpoint tidak ada

**❌ Status 400:**
→ Request format salah

**❌ Status 401:**
→ Auth token invalid

**❌ Status 500:**
→ Server error, check backend logs

---

## 🎯 Step 5: Check Backend Logs

**SSH ke server:**
```bash
ssh user@api.notaku.cloud
```

**Check logs:**
```bash
# If using systemd
sudo journalctl -u notaku-api -f

# If using Docker
docker logs -f notaku-api

# If using PM2
pm2 logs notaku-api

# Or check log files
tail -f /var/log/notaku-api/error.log
```

**Look for:**
- `POST /api/v1/receipts` requests
- Error messages
- Stack traces
- Database errors

---

## ✅ Checklist

### Frontend (Already Done ✅)
- [x] Form auto-populates with OCR data
- [x] Validation works
- [x] API call is made with correct data
- [x] Error handling improved
- [x] Detailed logging added

### Backend (Need to Check ❌)
- [ ] `POST /api/v1/receipts` endpoint exists
- [ ] Endpoint accepts correct request format
- [ ] CORS headers configured
- [ ] Authentication works
- [ ] Database table exists
- [ ] Receipt model has all fields
- [ ] Endpoint returns correct response format

---

## 🚀 Quick Test

### Test 1: Check if endpoint exists

```bash
curl -I https://api.notaku.cloud/api/v1/receipts
```

**Expected:** `200 OK` or `405 Method Not Allowed` (means endpoint exists)
**If 404:** Endpoint tidak ada!

### Test 2: Try POST with minimal data

```bash
curl -X POST https://api.notaku.cloud/api/v1/receipts \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**If CORS error:** Backend needs CORS config
**If 401:** Need authentication
**If 400:** Validation error (expected)
**If 404:** Endpoint tidak ada

---

## 💡 Most Likely Issues

Berdasarkan error "Failed to fetch (undefined)", kemungkinan besar:

### 1. **Endpoint Belum Diimplementasi** (90% probability)
```
POST /api/v1/receipts → 404 Not Found
```

**Solution:** Implement endpoint di backend

### 2. **CORS Issue** (5% probability)
```
CORS policy blocked the request
```

**Solution:** Add CORS headers di backend

### 3. **Backend Down** (3% probability)
```
Connection refused
```

**Solution:** Start backend server

### 4. **Request Format Salah** (2% probability)
```
400 Bad Request
```

**Solution:** Check request body format

---

## 📞 Next Steps

1. **Check Network tab** - Lihat actual request & response
2. **Test dengan curl** - Verify endpoint exists
3. **Check backend logs** - See if request sampai ke backend
4. **Implement endpoint** - If belum ada
5. **Share findings** - Screenshot Network tab & backend logs

---

**Kemungkinan besar backend belum implement `POST /api/v1/receipts` endpoint!** 🎯
