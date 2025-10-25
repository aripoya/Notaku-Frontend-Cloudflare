# Analytics Backend Implementation Guide

## Overview
This guide provides complete instructions for implementing the Analytics API endpoints for the NotaKu receipt management system.

## Database Schema

### Required Table: `receipts`

```sql
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    merchant VARCHAR(255),
    total_amount DECIMAL(15, 2),
    date DATE,
    category VARCHAR(100),
    ocr_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_date ON receipts(date);
CREATE INDEX idx_receipts_user_date ON receipts(user_id, date);
```

## API Endpoints

### Base URL
- Development: `http://localhost:8000/api/v1/analytics`
- Production: `https://api.notaku.cloud/api/v1/analytics`

### Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer {token}
```

---

## 1. Get Analytics Summary

**Endpoint:** `GET /api/v1/analytics/summary`

**Query Parameters:**
- `user_id` (required): UUID of the user
- `start_date` (required): Start date in ISO format (YYYY-MM-DD)
- `end_date` (required): End date in ISO format (YYYY-MM-DD)

**Response:**
```json
{
  "total_spending": 12450000.00,
  "total_receipts": 84,
  "average_per_transaction": 148214.29,
  "biggest_expense": {
    "merchant": "Supplier A",
    "amount": 2500000.00,
    "date": "2025-10-15"
  }
}
```

**SQL Query:**
```sql
-- Total spending
SELECT COALESCE(SUM(total_amount), 0) as total_spending
FROM receipts
WHERE user_id = $1 AND date BETWEEN $2 AND $3;

-- Total receipts
SELECT COUNT(*) as total_receipts
FROM receipts
WHERE user_id = $1 AND date BETWEEN $2 AND $3;

-- Average per transaction
SELECT COALESCE(AVG(total_amount), 0) as average_per_transaction
FROM receipts
WHERE user_id = $1 AND date BETWEEN $2 AND $3;

-- Biggest expense
SELECT merchant, total_amount as amount, date
FROM receipts
WHERE user_id = $1 AND date BETWEEN $2 AND $3
ORDER BY total_amount DESC
LIMIT 1;
```

**Python Implementation:**
```python
from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import date
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

class BiggestExpense(BaseModel):
    merchant: str
    amount: float
    date: str

class AnalyticsSummary(BaseModel):
    total_spending: float
    total_receipts: int
    average_per_transaction: float
    biggest_expense: BiggestExpense

@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    user_id: str = Query(...),
    start_date: str = Query(...),
    end_date: str = Query(...),
    db: Session = Depends(get_db)
):
    # Total spending
    total_spending = db.query(func.coalesce(func.sum(Receipt.total_amount), 0)) \\
        .filter(
            Receipt.user_id == user_id,
            Receipt.date >= start_date,
            Receipt.date <= end_date
        ).scalar() or 0.0
    
    # Total receipts
    total_receipts = db.query(func.count(Receipt.id)) \\
        .filter(
            Receipt.user_id == user_id,
            Receipt.date >= start_date,
            Receipt.date <= end_date
        ).scalar() or 0
    
    # Average per transaction
    average_per_transaction = total_spending / total_receipts if total_receipts > 0 else 0.0
    
    # Biggest expense
    biggest = db.query(Receipt) \\
        .filter(
            Receipt.user_id == user_id,
            Receipt.date >= start_date,
            Receipt.date <= end_date
        ) \\
        .order_by(Receipt.total_amount.desc()) \\
        .first()
    
    biggest_expense = BiggestExpense(
        merchant=biggest.merchant or "Unknown",
        amount=float(biggest.total_amount or 0),
        date=biggest.date.isoformat() if biggest and biggest.date else start_date
    ) if biggest else BiggestExpense(merchant="N/A", amount=0, date=start_date)
    
    return AnalyticsSummary(
        total_spending=float(total_spending),
        total_receipts=total_receipts,
        average_per_transaction=average_per_transaction,
        biggest_expense=biggest_expense
    )
```

---

## 2. Get Spending Trend

**Endpoint:** `GET /api/v1/analytics/trend`

**Query Parameters:**
- `user_id` (required): UUID of the user
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)
- `interval` (optional): `daily` | `weekly` | `monthly` (default: `daily`)

**Response:**
```json
{
  "data": [
    {"date": "2025-10-01", "amount": 450000.00},
    {"date": "2025-10-02", "amount": 320000.00},
    {"date": "2025-10-03", "amount": 580000.00}
  ]
}
```

**SQL Query (Daily):**
```sql
SELECT 
    date,
    COALESCE(SUM(total_amount), 0) as amount
FROM receipts
WHERE user_id = $1 AND date BETWEEN $2 AND $3
GROUP BY date
ORDER BY date ASC;
```

**SQL Query (Weekly):**
```sql
SELECT 
    DATE_TRUNC('week', date) as date,
    COALESCE(SUM(total_amount), 0) as amount
FROM receipts
WHERE user_id = $1 AND date BETWEEN $2 AND $3
GROUP BY DATE_TRUNC('week', date)
ORDER BY date ASC;
```

**SQL Query (Monthly):**
```sql
SELECT 
    DATE_TRUNC('month', date) as date,
    COALESCE(SUM(total_amount), 0) as amount
FROM receipts
WHERE user_id = $1 AND date BETWEEN $2 AND $3
GROUP BY DATE_TRUNC('month', date)
ORDER BY date ASC;
```

**Python Implementation:**
```python
from pydantic import BaseModel
from typing import List

class TrendDataPoint(BaseModel):
    date: str
    amount: float

class TrendResponse(BaseModel):
    data: List[TrendDataPoint]

@router.get("/trend", response_model=TrendResponse)
async def get_spending_trend(
    user_id: str = Query(...),
    start_date: str = Query(...),
    end_date: str = Query(...),
    interval: str = Query("daily"),
    db: Session = Depends(get_db)
):
    # Determine truncation function
    if interval == "weekly":
        trunc_func = func.date_trunc('week', Receipt.date)
    elif interval == "monthly":
        trunc_func = func.date_trunc('month', Receipt.date)
    else:  # daily
        trunc_func = Receipt.date
    
    # Query
    results = db.query(
        trunc_func.label('date'),
        func.coalesce(func.sum(Receipt.total_amount), 0).label('amount')
    ).filter(
        Receipt.user_id == user_id,
        Receipt.date >= start_date,
        Receipt.date <= end_date
    ).group_by('date').order_by('date').all()
    
    # Format response
    data = [
        TrendDataPoint(
            date=row.date.isoformat() if hasattr(row.date, 'isoformat') else str(row.date),
            amount=float(row.amount)
        )
        for row in results
    ]
    
    return TrendResponse(data=data)
```

---

## 3. Get Spending by Category

**Endpoint:** `GET /api/v1/analytics/by-category`

**Query Parameters:**
- `user_id` (required): UUID of the user
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)

**Response:**
```json
{
  "categories": [
    {
      "name": "Bahan Baku",
      "amount": 5200000.00,
      "count": 32,
      "percentage": 41.8
    },
    {
      "name": "Operasional",
      "amount": 3100000.00,
      "count": 25,
      "percentage": 24.9
    }
  ]
}
```

**SQL Query:**
```sql
WITH total AS (
    SELECT COALESCE(SUM(total_amount), 0) as total_spending
    FROM receipts
    WHERE user_id = $1 AND date BETWEEN $2 AND $3
)
SELECT 
    COALESCE(category, 'Uncategorized') as name,
    COALESCE(SUM(total_amount), 0) as amount,
    COUNT(*) as count,
    CASE 
        WHEN (SELECT total_spending FROM total) > 0 
        THEN (COALESCE(SUM(total_amount), 0) / (SELECT total_spending FROM total) * 100)
        ELSE 0 
    END as percentage
FROM receipts
WHERE user_id = $1 AND date BETWEEN $2 AND $3
GROUP BY category
ORDER BY amount DESC;
```

**Python Implementation:**
```python
class CategoryData(BaseModel):
    name: str
    amount: float
    count: int
    percentage: float

class CategoryResponse(BaseModel):
    categories: List[CategoryData]

@router.get("/by-category", response_model=CategoryResponse)
async def get_by_category(
    user_id: str = Query(...),
    start_date: str = Query(...),
    end_date: str = Query(...),
    db: Session = Depends(get_db)
):
    # Get total spending
    total_spending = db.query(func.coalesce(func.sum(Receipt.total_amount), 0)) \\
        .filter(
            Receipt.user_id == user_id,
            Receipt.date >= start_date,
            Receipt.date <= end_date
        ).scalar() or 0.0
    
    # Get by category
    results = db.query(
        func.coalesce(Receipt.category, 'Uncategorized').label('name'),
        func.coalesce(func.sum(Receipt.total_amount), 0).label('amount'),
        func.count(Receipt.id).label('count')
    ).filter(
        Receipt.user_id == user_id,
        Receipt.date >= start_date,
        Receipt.date <= end_date
    ).group_by('name').order_by(text('amount DESC')).all()
    
    # Calculate percentages
    categories = [
        CategoryData(
            name=row.name,
            amount=float(row.amount),
            count=row.count,
            percentage=(float(row.amount) / total_spending * 100) if total_spending > 0 else 0.0
        )
        for row in results
    ]
    
    return CategoryResponse(categories=categories)
```

---

## 4. Get Top Merchants

**Endpoint:** `GET /api/v1/analytics/top-merchants`

**Query Parameters:**
- `user_id` (required): UUID of the user
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)
- `limit` (optional): Number of merchants to return (default: 10)

**Response:**
```json
{
  "merchants": [
    {
      "name": "Supplier A",
      "amount": 2500000.00,
      "count": 15
    },
    {
      "name": "Supplier B",
      "amount": 1800000.00,
      "count": 12
    }
  ]
}
```

**SQL Query:**
```sql
SELECT 
    COALESCE(merchant, 'Unknown') as name,
    COALESCE(SUM(total_amount), 0) as amount,
    COUNT(*) as count
FROM receipts
WHERE user_id = $1 AND date BETWEEN $2 AND $3
GROUP BY merchant
ORDER BY amount DESC
LIMIT $4;
```

**Python Implementation:**
```python
class MerchantData(BaseModel):
    name: str
    amount: float
    count: int

class MerchantResponse(BaseModel):
    merchants: List[MerchantData]

@router.get("/top-merchants", response_model=MerchantResponse)
async def get_top_merchants(
    user_id: str = Query(...),
    start_date: str = Query(...),
    end_date: str = Query(...),
    limit: int = Query(10),
    db: Session = Depends(get_db)
):
    results = db.query(
        func.coalesce(Receipt.merchant, 'Unknown').label('name'),
        func.coalesce(func.sum(Receipt.total_amount), 0).label('amount'),
        func.count(Receipt.id).label('count')
    ).filter(
        Receipt.user_id == user_id,
        Receipt.date >= start_date,
        Receipt.date <= end_date
    ).group_by('name').order_by(text('amount DESC')).limit(limit).all()
    
    merchants = [
        MerchantData(
            name=row.name,
            amount=float(row.amount),
            count=row.count
        )
        for row in results
    ]
    
    return MerchantResponse(merchants=merchants)
```

---

## Complete Router File

**File:** `/var/www/notaku-api/app/routers/analytics.py`

```python
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List
from pydantic import BaseModel
from datetime import date

from app.database import get_db
from app.models import Receipt
from app.auth import get_current_user

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

# Models
class BiggestExpense(BaseModel):
    merchant: str
    amount: float
    date: str

class AnalyticsSummary(BaseModel):
    total_spending: float
    total_receipts: int
    average_per_transaction: float
    biggest_expense: BiggestExpense

class TrendDataPoint(BaseModel):
    date: str
    amount: float

class TrendResponse(BaseModel):
    data: List[TrendDataPoint]

class CategoryData(BaseModel):
    name: str
    amount: float
    count: int
    percentage: float

class CategoryResponse(BaseModel):
    categories: List[CategoryData]

class MerchantData(BaseModel):
    name: str
    amount: float
    count: int

class MerchantResponse(BaseModel):
    merchants: List[MerchantData]

# Endpoints
@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    user_id: str = Query(...),
    start_date: str = Query(...),
    end_date: str = Query(...),
    db: Session = Depends(get_db)
):
    # Implementation from above
    pass

@router.get("/trend", response_model=TrendResponse)
async def get_spending_trend(
    user_id: str = Query(...),
    start_date: str = Query(...),
    end_date: str = Query(...),
    interval: str = Query("daily"),
    db: Session = Depends(get_db)
):
    # Implementation from above
    pass

@router.get("/by-category", response_model=CategoryResponse)
async def get_by_category(
    user_id: str = Query(...),
    start_date: str = Query(...),
    end_date: str = Query(...),
    db: Session = Depends(get_db)
):
    # Implementation from above
    pass

@router.get("/top-merchants", response_model=MerchantResponse)
async def get_top_merchants(
    user_id: str = Query(...),
    start_date: str = Query(...),
    end_date: str = Query(...),
    limit: int = Query(10),
    db: Session = Depends(get_db)
):
    # Implementation from above
    pass
```

---

## Add to Main App

**File:** `/var/www/notaku-api/app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analytics

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
app.include_router(analytics.router)
```

---

## Testing

### 1. Test with curl

```bash
# Get summary
curl -X GET "http://localhost:8000/api/v1/analytics/summary?user_id=USER_ID&start_date=2025-10-01&end_date=2025-10-31" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Get trend
curl -X GET "http://localhost:8000/api/v1/analytics/trend?user_id=USER_ID&start_date=2025-10-01&end_date=2025-10-31&interval=daily" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Get by category
curl -X GET "http://localhost:8000/api/v1/analytics/by-category?user_id=USER_ID&start_date=2025-10-01&end_date=2025-10-31" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Get top merchants
curl -X GET "http://localhost:8000/api/v1/analytics/top-merchants?user_id=USER_ID&start_date=2025-10-01&end_date=2025-10-31&limit=10" \\
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test with Python

```python
import requests

BASE_URL = "http://localhost:8000/api/v1/analytics"
TOKEN = "your_auth_token"
USER_ID = "user_uuid"

headers = {"Authorization": f"Bearer {TOKEN}"}

# Test summary
response = requests.get(
    f"{BASE_URL}/summary",
    params={
        "user_id": USER_ID,
        "start_date": "2025-10-01",
        "end_date": "2025-10-31"
    },
    headers=headers
)
print(response.json())
```

---

## Performance Optimization

### 1. Add Database Indexes

```sql
CREATE INDEX idx_receipts_user_date ON receipts(user_id, date);
CREATE INDEX idx_receipts_category ON receipts(category);
CREATE INDEX idx_receipts_merchant ON receipts(merchant);
```

### 2. Add Caching (Optional)

```python
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache

@router.get("/summary")
@cache(expire=300)  # Cache for 5 minutes
async def get_analytics_summary(...):
    pass
```

---

## Error Handling

```python
from fastapi import HTTPException

@router.get("/summary")
async def get_analytics_summary(...):
    try:
        # Your logic here
        pass
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch analytics: {str(e)}"
        )
```

---

## Deployment Checklist

- [ ] Database indexes created
- [ ] All 4 endpoints implemented
- [ ] CORS configured correctly
- [ ] Authentication working
- [ ] Tested with real data
- [ ] Error handling in place
- [ ] Performance optimized
- [ ] Documented in API docs

---

## Frontend Integration

Once backend is ready, frontend will automatically connect to:
- `http://localhost:8000/api/v1/analytics/*` (development)
- `https://api.notaku.cloud/api/v1/analytics/*` (production)

No frontend changes needed - it's already implemented and ready!

---

## Support

For questions or issues, contact the frontend team or refer to:
- Frontend code: `/src/lib/analytics-api.ts`
- Types: `/src/types/analytics.ts`
- Page: `/src/app/(dashboard)/dashboard/analytics/page.tsx`
