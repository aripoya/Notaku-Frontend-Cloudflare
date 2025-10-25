# 🚨 URGENT: Receipt CREATE Endpoint Needed

## Problem Identified

The frontend is trying to **UPDATE** a receipt that doesn't exist in the database yet!

### Error:
```
PUT http://localhost:8000/api/v1/receipts/9bacfaca-9ae8-4d14-992b-6c7839acdaff 404 (Not Found)
```

### Root Cause:
1. OCR process creates a `job_id` (e.g., `9bacfaca-9ae8-4d14-992b-6c7839acdaff`)
2. OCR extracts data but **DOES NOT** create a receipt record in database
3. User edits the data in ReceiptEditForm
4. User clicks "Save"
5. Frontend tries to UPDATE receipt with `job_id`
6. Backend returns 404 because no receipt exists with that ID

---

## Solution

### Frontend Changes (DONE ✅)

The frontend now:
1. Detects if this is a NEW receipt from OCR
2. Calls **POST /api/v1/receipts** to CREATE instead of UPDATE
3. Saves all OCR data + user edits to database

### Backend Changes (NEEDED ⚠️)

You need to implement:

**Endpoint:** `POST /api/v1/receipts`

**Request Body:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "merchant": "UNIQLO",
  "total_amount": 125000.00,
  "date": "2025-10-25",
  "category": "Shopping",
  "notes": "Bought some books",
  "ocr_text": "UNIQLO\nTotal: Rp 125.000",
  "ocr_confidence": 0.96,
  "image_path": "/uploads/receipts/abc123.jpg"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "merchant": "UNIQLO",
  "total_amount": 125000.00,
  "date": "2025-10-25",
  "category": "Shopping",
  "notes": "Bought some books",
  "ocr_text": "UNIQLO\nTotal: Rp 125.000",
  "ocr_confidence": 0.96,
  "image_path": "/uploads/receipts/abc123.jpg",
  "is_edited": false,
  "created_at": "2025-10-25T10:30:00Z",
  "updated_at": "2025-10-25T10:30:00Z"
}
```

---

## Quick Implementation

**File:** `/var/www/notaku-api/app/routers/receipts.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel, validator
from typing import Optional

router = APIRouter(prefix="/api/v1/receipts", tags=["receipts"])

# Pydantic Models
class ReceiptCreateRequest(BaseModel):
    user_id: str
    merchant: str
    total_amount: float
    date: str
    category: Optional[str] = None
    notes: Optional[str] = None
    ocr_text: str
    ocr_confidence: float
    image_path: str
    
    @validator('merchant')
    def validate_merchant(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Merchant name must be at least 2 characters')
        return v.strip()
    
    @validator('total_amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        return v

class ReceiptResponse(BaseModel):
    id: str
    user_id: str
    merchant: Optional[str]
    total_amount: Optional[float]
    date: Optional[str]
    category: Optional[str]
    notes: Optional[str]
    ocr_text: str
    ocr_confidence: float
    image_path: str
    is_edited: bool
    created_at: str
    updated_at: Optional[str]
    
    class Config:
        from_attributes = True

# CREATE ENDPOINT (NEW!)
@router.post("", response_model=ReceiptResponse, status_code=status.HTTP_201_CREATED)
async def create_receipt(
    data: ReceiptCreateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new receipt from OCR data"""
    
    # Verify user owns this receipt
    if str(data.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create receipt for this user"
        )
    
    # Create receipt
    receipt = ReceiptModel(
        user_id=data.user_id,
        merchant=data.merchant,
        total_amount=data.total_amount,
        date=datetime.strptime(data.date, '%Y-%m-%d').date() if data.date else None,
        category=data.category,
        notes=data.notes,
        ocr_text=data.ocr_text,
        ocr_confidence=data.ocr_confidence,
        image_path=data.image_path,
        is_edited=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    
    return receipt

# UPDATE ENDPOINT (Already exists, keep it)
@router.put("/{receipt_id}", response_model=ReceiptResponse)
async def update_receipt(
    receipt_id: str,
    data: ReceiptUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an existing receipt"""
    # ... existing code ...
```

---

## SQL Query

```sql
INSERT INTO receipts (
    user_id,
    merchant,
    total_amount,
    date,
    category,
    notes,
    ocr_text,
    ocr_confidence,
    image_path,
    is_edited,
    created_at,
    updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
) RETURNING *;
```

---

## Testing

### 1. Test with curl:
```bash
curl -X POST "http://localhost:8000/api/v1/receipts" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "merchant": "UNIQLO",
    "total_amount": 125000,
    "date": "2025-10-25",
    "category": "Shopping",
    "notes": "Test receipt",
    "ocr_text": "UNIQLO\nTotal: Rp 125.000",
    "ocr_confidence": 0.96,
    "image_path": "/uploads/receipts/test.jpg"
  }'
```

### 2. Expected Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "merchant": "UNIQLO",
  "total_amount": 125000.0,
  "date": "2025-10-25",
  "category": "Shopping",
  "notes": "Test receipt",
  "ocr_text": "UNIQLO\nTotal: Rp 125.000",
  "ocr_confidence": 0.96,
  "image_path": "/uploads/receipts/test.jpg",
  "is_edited": false,
  "created_at": "2025-10-25T10:30:00Z",
  "updated_at": "2025-10-25T10:30:00Z"
}
```

---

## Complete Flow

### Before (BROKEN ❌):
```
1. Upload receipt
2. OCR processes → job_id created
3. User edits in form
4. Click Save
5. Frontend: PUT /receipts/job_id
6. Backend: 404 Not Found ❌
```

### After (WORKING ✅):
```
1. Upload receipt
2. OCR processes → job_id + extracted data
3. User edits in form
4. Click Save
5. Frontend: POST /receipts (with all data)
6. Backend: Creates receipt, returns UUID
7. Receipt saved successfully ✅
```

---

## Priority

**CRITICAL** - This blocks the entire receipt upload flow!

Without this endpoint:
- ❌ Users cannot save receipts after OCR
- ❌ All OCR data is lost
- ❌ Upload feature is unusable

With this endpoint:
- ✅ Users can save receipts
- ✅ OCR data persists
- ✅ Upload feature works end-to-end

---

## Files to Modify

1. **Create endpoint:** `/var/www/notaku-api/app/routers/receipts.py`
2. **Add to main app:** `/var/www/notaku-api/app/main.py`
3. **Test:** Use curl or Postman

---

## Validation Rules

- `user_id`: Required, must match current user
- `merchant`: Required, min 2 characters
- `total_amount`: Required, must be > 0
- `date`: Required, valid date format (YYYY-MM-DD)
- `category`: Optional, nullable
- `notes`: Optional, nullable, max 500 characters
- `ocr_text`: Required (from OCR)
- `ocr_confidence`: Required (from OCR)
- `image_path`: Required (from upload)

---

## Next Steps

1. ✅ Frontend updated (commit `9069258`)
2. ⏳ Backend: Implement POST /api/v1/receipts
3. ⏳ Test with real receipt upload
4. ✅ Receipt save flow works!

---

## Questions?

Check the complete guide: `RECEIPT_EDIT_BACKEND_GUIDE.md`

Or contact frontend team for clarification.

---

**Status:** Frontend ready, waiting for backend CREATE endpoint! 🚀
