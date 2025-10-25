# Receipt Edit Backend Implementation Guide

## Overview
This guide provides complete instructions for implementing the Receipt CRUD API endpoints for the NotaKu receipt management system.

## Database Schema

### Check Existing `receipts` Table

```sql
-- Check current schema
\d receipts;
```

### Required Columns

```sql
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant TEXT,
    total_amount DECIMAL(15, 2),
    date DATE,
    category TEXT,
    notes TEXT,
    ocr_text TEXT,
    ocr_confidence FLOAT DEFAULT 0.0,
    ocr_data JSONB,
    image_path TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(date);
CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category);
CREATE INDEX IF NOT EXISTS idx_receipts_user_date ON receipts(user_id, date);
```

### Migration Script (if columns missing)

**File:** `/var/www/notaku-api/alembic/versions/XXXXX_add_receipt_edit_fields.py`

```python
"""add receipt edit fields

Revision ID: XXXXX
Revises: YYYYY
Create Date: 2025-10-25

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'XXXXX'
down_revision = 'YYYYY'
branch_labels = None
depends_on = None

def upgrade():
    # Add category column if not exists
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='receipts' AND column_name='category'
            ) THEN
                ALTER TABLE receipts ADD COLUMN category TEXT;
            END IF;
        END $$;
    """)
    
    # Add notes column if not exists
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='receipts' AND column_name='notes'
            ) THEN
                ALTER TABLE receipts ADD COLUMN notes TEXT;
            END IF;
        END $$;
    """)
    
    # Add is_edited column if not exists
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='receipts' AND column_name='is_edited'
            ) THEN
                ALTER TABLE receipts ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;
            END IF;
        END $$;
    """)
    
    # Add updated_at column if not exists
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='receipts' AND column_name='updated_at'
            ) THEN
                ALTER TABLE receipts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            END IF;
        END $$;
    """)
    
    # Create indexes
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category);
    """)

def downgrade():
    op.drop_index('idx_receipts_category', table_name='receipts', if_exists=True)
    op.drop_column('receipts', 'is_edited', if_exists=True)
    op.drop_column('receipts', 'notes', if_exists=True)
    op.drop_column('receipts', 'category', if_exists=True)
    op.drop_column('receipts', 'updated_at', if_exists=True)
```

**Run Migration:**

```bash
cd /var/www/notaku-api
alembic revision --autogenerate -m "add receipt edit fields"
alembic upgrade head
```

---

## API Endpoints

### Base URL
- Development: `http://localhost:8000/api/v1/receipts`
- Production: `https://api.notaku.cloud/api/v1/receipts`

### Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer {token}
```

---

## 1. Create Receipt (NEW - IMPORTANT!)

**Endpoint:** `POST /api/v1/receipts`

**Request Body:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "merchant": "Gramedia Yogya Sudirman",
  "total_amount": 125000.00,
  "date": "2025-10-24",
  "category": "Shopping",
  "notes": "Bought some books",
  "ocr_text": "GRAMEDIA\nTotal: Rp 125.000",
  "ocr_confidence": 0.95,
  "image_path": "/uploads/receipts/abc123.jpg"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "merchant": "Gramedia Yogya Sudirman",
  "total_amount": 125000.00,
  "date": "2025-10-24",
  "category": "Shopping",
  "notes": "Bought some books",
  "ocr_text": "GRAMEDIA\nTotal: Rp 125.000",
  "ocr_confidence": 0.95,
  "image_path": "/uploads/receipts/abc123.jpg",
  "is_edited": false,
  "created_at": "2025-10-24T10:30:00Z",
  "updated_at": "2025-10-24T10:30:00Z"
}
```

**Python Implementation:**
```python
@router.post("", response_model=ReceiptResponse, status_code=status.HTTP_201_CREATED)
async def create_receipt(
    data: ReceiptCreateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new receipt"""
    
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
        date=datetime.strptime(data.date, '%Y-%m-%d').date(),
        category=data.category,
        notes=data.notes,
        ocr_text=data.ocr_text or "",
        ocr_confidence=data.ocr_confidence or 0.0,
        image_path=data.image_path,
        is_edited=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    
    return receipt
```

---

## 2. Get Single Receipt

**Endpoint:** `GET /api/v1/receipts/{receipt_id}`

**Path Parameters:**
- `receipt_id` (required): UUID of the receipt

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "merchant": "Gramedia Yogya Sudirman",
  "total_amount": 125000.00,
  "date": "2025-10-24",
  "category": "Shopping",
  "notes": "Bought some books",
  "ocr_text": "GRAMEDIA\nTotal: Rp 125.000",
  "ocr_confidence": 0.95,
  "ocr_data": {...},
  "image_path": "/uploads/receipts/abc123.jpg",
  "is_edited": false,
  "created_at": "2025-10-24T10:30:00Z",
  "updated_at": "2025-10-24T10:30:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Receipt not found
- `403 Forbidden`: User not authorized to view this receipt
- `401 Unauthorized`: Invalid or missing token

**SQL Query:**
```sql
SELECT * FROM receipts 
WHERE id = $1 AND user_id = $2;
```

**Python Implementation:**
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel
from uuid import UUID

from app.database import get_db
from app.models import Receipt as ReceiptModel
from app.auth import get_current_user

router = APIRouter(prefix="/api/v1/receipts", tags=["receipts"])

# Pydantic Models
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
    ocr_data: Optional[dict]
    image_path: str
    is_edited: bool
    created_at: str
    updated_at: Optional[str]

    class Config:
        from_attributes = True

@router.get("/{receipt_id}", response_model=ReceiptResponse)
async def get_receipt(
    receipt_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a single receipt by ID"""
    
    # Fetch receipt
    receipt = db.query(ReceiptModel).filter(
        ReceiptModel.id == receipt_id
    ).first()
    
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )
    
    # Check authorization
    if str(receipt.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this receipt"
        )
    
    return receipt
```

---

## 2. Update Receipt

**Endpoint:** `PUT /api/v1/receipts/{receipt_id}`

**Path Parameters:**
- `receipt_id` (required): UUID of the receipt

**Request Body:**
```json
{
  "merchant": "Gramedia Yogya Sudirman",
  "total_amount": 125000.00,
  "date": "2025-10-24",
  "category": "Shopping",
  "notes": "Bought some books"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "receipt": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "merchant": "Gramedia Yogya Sudirman",
    "total_amount": 125000.00,
    "date": "2025-10-24",
    "category": "Shopping",
    "notes": "Bought some books",
    "is_edited": true,
    "updated_at": "2025-10-24T15:45:00Z",
    ...
  }
}
```

**Validation Rules:**
- `merchant`: Required, min 2 characters
- `total_amount`: Required, must be > 0
- `date`: Required, valid date format, not future date
- `category`: Optional, nullable
- `notes`: Optional, nullable, max 500 characters

**Error Responses:**
- `400 Bad Request`: Validation error
- `404 Not Found`: Receipt not found
- `403 Forbidden`: User not authorized
- `401 Unauthorized`: Invalid token

**SQL Query:**
```sql
UPDATE receipts 
SET 
    merchant = $1,
    total_amount = $2,
    date = $3,
    category = $4,
    notes = $5,
    is_edited = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $6 AND user_id = $7
RETURNING *;
```

**Python Implementation:**
```python
from pydantic import BaseModel, validator
from typing import Optional

class ReceiptUpdateRequest(BaseModel):
    merchant: str
    total_amount: float
    date: str
    category: Optional[str] = None
    notes: Optional[str] = None
    
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
    
    @validator('date')
    def validate_date(cls, v):
        try:
            date_obj = datetime.strptime(v, '%Y-%m-%d').date()
            if date_obj > date.today():
                raise ValueError('Date cannot be in the future')
            return v
        except ValueError as e:
            raise ValueError(f'Invalid date format: {str(e)}')
    
    @validator('notes')
    def validate_notes(cls, v):
        if v and len(v) > 500:
            raise ValueError('Notes cannot exceed 500 characters')
        return v.strip() if v else None

class ReceiptUpdateResponse(BaseModel):
    success: bool
    receipt: ReceiptResponse

@router.put("/{receipt_id}", response_model=ReceiptUpdateResponse)
async def update_receipt(
    receipt_id: str,
    data: ReceiptUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a receipt"""
    
    # Fetch receipt
    receipt = db.query(ReceiptModel).filter(
        ReceiptModel.id == receipt_id
    ).first()
    
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )
    
    # Check authorization
    if str(receipt.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this receipt"
        )
    
    # Update fields
    receipt.merchant = data.merchant
    receipt.total_amount = data.total_amount
    receipt.date = datetime.strptime(data.date, '%Y-%m-%d').date()
    receipt.category = data.category
    receipt.notes = data.notes
    receipt.is_edited = True
    receipt.updated_at = datetime.utcnow()
    
    # Commit changes
    db.commit()
    db.refresh(receipt)
    
    return ReceiptUpdateResponse(
        success=True,
        receipt=receipt
    )
```

---

## 3. Delete Receipt

**Endpoint:** `DELETE /api/v1/receipts/{receipt_id}`

**Path Parameters:**
- `receipt_id` (required): UUID of the receipt

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Receipt deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`: Receipt not found
- `403 Forbidden`: User not authorized
- `401 Unauthorized`: Invalid token

**SQL Query:**
```sql
DELETE FROM receipts 
WHERE id = $1 AND user_id = $2
RETURNING id;
```

**Python Implementation:**
```python
class DeleteResponse(BaseModel):
    success: bool
    message: str

@router.delete("/{receipt_id}", response_model=DeleteResponse)
async def delete_receipt(
    receipt_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a receipt"""
    
    # Fetch receipt
    receipt = db.query(ReceiptModel).filter(
        ReceiptModel.id == receipt_id
    ).first()
    
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )
    
    # Check authorization
    if str(receipt.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this receipt"
        )
    
    # Optional: Delete image file from storage
    # import os
    # if receipt.image_path and os.path.exists(receipt.image_path):
    #     os.remove(receipt.image_path)
    
    # Delete receipt
    db.delete(receipt)
    db.commit()
    
    return DeleteResponse(
        success=True,
        message="Receipt deleted successfully"
    )
```

---

## 4. Get All Receipts (Bonus)

**Endpoint:** `GET /api/v1/receipts`

**Query Parameters:**
- `user_id` (required): UUID of the user
- `limit` (optional): Number of receipts to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `category` (optional): Filter by category
- `start_date` (optional): Filter by start date (YYYY-MM-DD)
- `end_date` (optional): Filter by end date (YYYY-MM-DD)

**Response:**
```json
{
  "receipts": [...],
  "total": 42
}
```

**Python Implementation:**
```python
from typing import List

class ReceiptsListResponse(BaseModel):
    receipts: List[ReceiptResponse]
    total: int

@router.get("", response_model=ReceiptsListResponse)
async def get_receipts(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all receipts for a user"""
    
    # Check authorization
    if user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Build query
    query = db.query(ReceiptModel).filter(ReceiptModel.user_id == user_id)
    
    if category:
        query = query.filter(ReceiptModel.category == category)
    
    if start_date:
        query = query.filter(ReceiptModel.date >= start_date)
    
    if end_date:
        query = query.filter(ReceiptModel.date <= end_date)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    receipts = query.order_by(ReceiptModel.date.desc()).offset(offset).limit(limit).all()
    
    return ReceiptsListResponse(
        receipts=receipts,
        total=total
    )
```

---

## Complete Router File

**File:** `/var/www/notaku-api/app/routers/receipts.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, validator
from uuid import UUID

from app.database import get_db
from app.models import Receipt as ReceiptModel
from app.auth import get_current_user

router = APIRouter(prefix="/api/v1/receipts", tags=["receipts"])

# ... (include all models and endpoints from above)
```

---

## Add to Main App

**File:** `/var/www/notaku-api/app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import receipts

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3002", "https://notaku.cloud"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(receipts.router)
```

---

## Testing

### 1. Test with curl

```bash
# Get receipt
curl -X GET "http://localhost:8000/api/v1/receipts/RECEIPT_ID" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Update receipt
curl -X PUT "http://localhost:8000/api/v1/receipts/RECEIPT_ID" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "merchant": "Test Store",
    "total_amount": 50000,
    "date": "2025-10-24",
    "category": "Shopping",
    "notes": "Test note"
  }'

# Delete receipt
curl -X DELETE "http://localhost:8000/api/v1/receipts/RECEIPT_ID" \\
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test with Python

```python
import requests

BASE_URL = "http://localhost:8000/api/v1/receipts"
TOKEN = "your_auth_token"
RECEIPT_ID = "receipt_uuid"

headers = {"Authorization": f"Bearer {TOKEN}"}

# Get receipt
response = requests.get(f"{BASE_URL}/{RECEIPT_ID}", headers=headers)
print(response.json())

# Update receipt
data = {
    "merchant": "Updated Store",
    "total_amount": 75000,
    "date": "2025-10-24",
    "category": "Food & Dining",
    "notes": "Updated note"
}
response = requests.put(f"{BASE_URL}/{RECEIPT_ID}", json=data, headers=headers)
print(response.json())

# Delete receipt
response = requests.delete(f"{BASE_URL}/{RECEIPT_ID}", headers=headers)
print(response.json())
```

---

## Error Handling

```python
from fastapi import HTTPException, status

# Common error responses
def receipt_not_found():
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Receipt not found"
    )

def not_authorized():
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not authorized to access this receipt"
    )

def validation_error(message: str):
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=message
    )
```

---

## Performance Optimization

### 1. Database Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(date);
CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category);
CREATE INDEX IF NOT EXISTS idx_receipts_user_date ON receipts(user_id, date);
```

### 2. Add Caching (Optional)

```python
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache

@router.get("/{receipt_id}")
@cache(expire=60)  # Cache for 1 minute
async def get_receipt(...):
    pass
```

---

## Deployment Checklist

- [ ] Database migration completed
- [ ] All 3 endpoints implemented (GET, PUT, DELETE)
- [ ] CORS configured correctly
- [ ] Authentication working
- [ ] Validation working
- [ ] Error handling in place
- [ ] Tested with real data
- [ ] Performance optimized
- [ ] Documented in API docs

---

## Frontend Integration

Once backend is ready, frontend will automatically connect to:
- `http://localhost:8000/api/v1/receipts/*` (development)
- `https://api.notaku.cloud/api/v1/receipts/*` (production)

No frontend changes needed - it's already implemented and ready!

---

## Support

For questions or issues, contact the frontend team or refer to:
- Frontend API client: `/src/lib/receipts-api.ts`
- Types: `/src/types/receipt.ts`
- Component: `/src/components/ReceiptEditForm.tsx`
