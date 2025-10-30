# 🏗️ Backend Development Guide - Notaku Platform

## 📋 **Project Overview**

Notaku adalah platform AI-powered expense tracking yang membutuhkan backend untuk:
- 💾 **Persistent storage** untuk receipts/nota
- 🔐 **User authentication & authorization** 
- 📊 **Analytics & reporting**
- 🔄 **Multi-device synchronization**

---

## 🎯 **Current Architecture**

### **Existing Services:**
- ✅ **Frontend**: Next.js (https://www.notaku.cloud)
- ✅ **Integration Service**: https://upload.notaku.cloud (OCR Pipeline)
- ✅ **RAG Service**: https://api.notaku.cloud (AI Chat)
- ✅ **Compression Service**: https://compress.notaku.cloud (Image Optimization)

### **Missing: Backend API Service**
- ❌ **Database**: PostgreSQL for receipts storage
- ❌ **REST API**: CRUD operations for receipts
- ❌ **File Storage**: S3/MinIO for images
- ❌ **Authentication**: JWT-based auth system

---

## 🗄️ **Database Schema**

### **1. Users Table**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255), -- bcrypt hashed
    subscription_tier VARCHAR(50) DEFAULT 'free', -- free, premium
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
```

### **2. Receipts Table**
```sql
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Receipt Data
    merchant_name VARCHAR(255) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    transaction_date DATE NOT NULL,
    category VARCHAR(100),
    notes TEXT,
    
    -- OCR Data
    ocr_text TEXT,
    ocr_confidence DECIMAL(3,2), -- 0.00 to 1.00
    
    -- File Storage
    image_path VARCHAR(500),
    image_url VARCHAR(500), -- Public URL
    
    -- Metadata
    is_edited BOOLEAN DEFAULT FALSE,
    rag_indexed BOOLEAN DEFAULT FALSE, -- Indexed in RAG service
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_date ON receipts(transaction_date);
CREATE INDEX idx_receipts_category ON receipts(category);
```

### **3. Receipt Items Table**
```sql
CREATE TABLE receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    
    item_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(12,2),
    total_price DECIMAL(12,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_receipt_items_receipt_id ON receipt_items(receipt_id);
```

---

## 🚀 **API Endpoints Specification**

### **Base URL**: `https://backend.notaku.cloud/api/v1`

### **Authentication Endpoints**

#### **POST /auth/register**
```json
{
  "email": "user@example.com",
  "name": "John Doe", 
  "password": "securepassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "subscription_tier": "free"
  },
  "token": "jwt_token_here"
}
```

#### **POST /auth/login**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### **Receipt Endpoints**

#### **POST /receipts** - Create Receipt
```json
{
  "merchant_name": "Indomaret",
  "total_amount": 25000,
  "currency": "IDR",
  "transaction_date": "2024-10-30",
  "category": "Groceries",
  "notes": "Belanja bulanan",
  "ocr_text": "Raw OCR text...",
  "ocr_confidence": 0.95,
  "image_base64": "data:image/jpeg;base64,..."
}
```

#### **GET /receipts** - List Receipts
**Query Parameters:**
- `limit`: int (default: 50)
- `offset`: int (default: 0) 
- `category`: string
- `start_date`: YYYY-MM-DD
- `end_date`: YYYY-MM-DD

**Response:**
```json
{
  "receipts": [...],
  "total": 150,
  "has_more": true
}
```

#### **GET /receipts/{id}** - Get Receipt
#### **PUT /receipts/{id}** - Update Receipt  
#### **DELETE /receipts/{id}** - Delete Receipt

---

## 🔧 **Technical Stack Recommendations**

### **Option 1: FastAPI + PostgreSQL (Recommended)**
```bash
# Dependencies
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.12.1
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
boto3==1.34.0
pillow==10.1.0
```

### **Option 2: Node.js + Express + Prisma**
```bash
# Dependencies
npm install express prisma @prisma/client
npm install bcryptjs jsonwebtoken multer
npm install aws-sdk sharp cors helmet
```

---

## 📁 **Project Structure (FastAPI)**

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── config.py            # Environment config
│   ├── database.py          # DB connection
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── models.py        # User model
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── routes.py        # Auth endpoints
│   │   └── utils.py         # JWT, password utils
│   ├── receipts/
│   │   ├── __init__.py
│   │   ├── models.py        # Receipt models
│   │   ├── schemas.py       # Receipt schemas
│   │   ├── routes.py        # Receipt endpoints
│   │   └── utils.py         # Receipt utilities
│   ├── storage/
│   │   ├── __init__.py
│   │   └── s3.py           # File storage
│   └── utils/
│       ├── __init__.py
│       └── dependencies.py  # Common dependencies
├── alembic/                 # DB migrations
├── tests/
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🔐 **Authentication Flow**

### **JWT Token Structure:**
```json
{
  "user_id": "uuid",
  "email": "user@example.com", 
  "subscription_tier": "premium",
  "exp": 1698765432
}
```

### **Frontend Integration:**
```typescript
// Headers for authenticated requests
{
  "Authorization": "Bearer jwt_token_here",
  "Content-Type": "application/json"
}
```

---

## 📊 **File Storage Strategy**

### **Image Processing Pipeline:**
1. **Receive** base64 image from frontend
2. **Decode** and validate image format
3. **Compress** using Pillow (JPEG, quality=85)
4. **Resize** if width > 1920px
5. **Upload** to S3/MinIO with unique filename
6. **Return** public URL for database storage

### **Storage Structure:**
```
s3://notaku-receipts/
├── receipts/
│   ├── {user_id}/
│   │   ├── {receipt_id}.jpg
│   │   └── thumbnails/
│   │       └── {receipt_id}_thumb.jpg
└── temp/
    └── uploads/
```

---

## 🔄 **Integration with Existing Services**

### **RAG Service Integration:**
```python
async def index_receipt_in_rag(receipt: Receipt):
    """Index receipt in RAG service after creation"""
    
    rag_data = {
        "receipt_id": receipt.id,
        "merchant": receipt.merchant_name,
        "total": receipt.total_amount,
        "date": receipt.transaction_date.isoformat(),
        "category": receipt.category,
        "ocr_text": receipt.ocr_text
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.notaku.cloud/index/receipt",
            json=rag_data
        )
        
    return response.status_code == 200
```

### **Frontend API Client (Already Exists):**
The frontend already has `ReceiptsAPI` client in `src/lib/receipts-api.ts` that's ready to use once backend is deployed.

---

## 🚀 **Deployment Strategy**

### **Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/notaku

# JWT
SECRET_KEY=your-super-secret-jwt-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# File Storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET=notaku-receipts
S3_REGION=us-east-1

# External Services
RAG_SERVICE_URL=https://api.notaku.cloud
INTEGRATION_SERVICE_URL=https://upload.notaku.cloud

# CORS
ALLOWED_ORIGINS=https://www.notaku.cloud,https://notaku.cloud
```

### **Docker Deployment:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### **Cloudflare Tunnel:**
```bash
# Expose backend via Cloudflare Tunnel
cloudflared tunnel create notaku-backend
cloudflared tunnel route dns notaku-backend backend.notaku.cloud
```

---

## 📋 **Development Checklist**

### **Phase 1: Core API (Week 1)**
- [ ] Setup FastAPI project structure
- [ ] Database models and migrations
- [ ] Authentication system (register/login)
- [ ] Basic CRUD for receipts
- [ ] File upload handling

### **Phase 2: Integration (Week 2)** 
- [ ] S3/MinIO file storage
- [ ] RAG service integration
- [ ] Frontend API integration testing
- [ ] Error handling and validation

### **Phase 3: Production (Week 3)**
- [ ] Docker containerization
- [ ] Cloudflare Tunnel setup
- [ ] Environment configuration
- [ ] Performance optimization
- [ ] Monitoring and logging

---

## 🧪 **Testing Strategy**

### **API Testing:**
```python
# tests/test_receipts.py
def test_create_receipt():
    response = client.post("/api/v1/receipts", json={
        "merchant_name": "Test Store",
        "total_amount": 10000,
        "transaction_date": "2024-10-30"
    }, headers={"Authorization": f"Bearer {token}"})
    
    assert response.status_code == 201
    assert response.json()["merchant_name"] == "Test Store"
```

### **Frontend Integration Testing:**
```typescript
// Test existing frontend API client
const receipt = await ReceiptsAPI.createReceipt({
  merchant: "Test Store",
  total_amount: 10000,
  date: "2024-10-30",
  user_id: "test-user-id"
});
```

---

## 📞 **Support & Communication**

### **Frontend Team Contact:**
- **API Client**: Already implemented in `src/lib/receipts-api.ts`
- **Types**: Defined in `src/types/receipt.ts`
- **UI Components**: Ready for backend integration

### **Expected Response Format:**
Backend should match the existing frontend interfaces exactly as defined in the TypeScript types.

---

**🎯 Goal: Complete backend implementation within 3 weeks for full Notaku platform functionality!**
