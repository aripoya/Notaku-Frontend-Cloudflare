# 🔌 Backend API Specification - Notaku Platform

## 📋 **API Overview**

**Base URL**: `https://backend.notaku.cloud/api/v1`  
**Authentication**: JWT Bearer Token  
**Content-Type**: `application/json`

---

## 🔐 **Authentication**

### **Headers Required:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **JWT Token Payload:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "subscription_tier": "premium",
  "iat": 1698765432,
  "exp": 1698851832
}
```

---

## 👤 **Auth Endpoints**

### **POST /auth/register**
Create new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "subscription_tier": "free",
    "created_at": "2024-10-30T07:55:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **POST /auth/login**
Authenticate user and get JWT token.

**Request:**
```json
{
  "email": "user@example.com", 
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "subscription_tier": "premium"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **POST /auth/refresh**
Refresh JWT token.

**Request:**
```json
{
  "refresh_token": "refresh_token_here"
}
```

---

## 📄 **Receipt Endpoints**

### **POST /receipts**
Create new receipt.

**Request:**
```json
{
  "merchant_name": "Indomaret Kebon Jeruk",
  "total_amount": 25750.00,
  "currency": "IDR",
  "transaction_date": "2024-10-30",
  "category": "Groceries",
  "notes": "Belanja bulanan kebutuhan dapur",
  "ocr_text": "INDOMARET\nJl. Kebon Jeruk Raya No.27\nTanggal: 30/10/2024\nKasir: SARI\n\nBeras 5kg         Rp 75.000\nMinyak Goreng     Rp 25.000\nTelur 1kg         Rp 28.000\n\nTotal             Rp 128.000\nBayar Tunai       Rp 130.000\nKembali           Rp 2.000",
  "ocr_confidence": 0.95,
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
}
```

**Response (201):**
```json
{
  "id": "receipt-uuid-here",
  "user_id": "user-uuid-here",
  "merchant_name": "Indomaret Kebon Jeruk",
  "total_amount": 25750.00,
  "currency": "IDR", 
  "transaction_date": "2024-10-30",
  "category": "Groceries",
  "notes": "Belanja bulanan kebutuhan dapur",
  "ocr_text": "INDOMARET\nJl. Kebon Jeruk Raya...",
  "ocr_confidence": 0.95,
  "image_url": "https://storage.notaku.cloud/receipts/user-id/receipt-id.jpg",
  "is_edited": false,
  "rag_indexed": true,
  "created_at": "2024-10-30T07:55:00Z",
  "updated_at": "2024-10-30T07:55:00Z"
}
```

### **GET /receipts**
Get user's receipts with pagination and filters.

**Query Parameters:**
- `limit`: int (default: 50, max: 100)
- `offset`: int (default: 0)
- `category`: string (filter by category)
- `start_date`: YYYY-MM-DD (filter from date)
- `end_date`: YYYY-MM-DD (filter to date)
- `search`: string (search in merchant_name, notes, ocr_text)

**Example:**
```
GET /receipts?limit=20&offset=0&category=Groceries&start_date=2024-10-01&end_date=2024-10-31
```

**Response (200):**
```json
{
  "receipts": [
    {
      "id": "receipt-uuid-1",
      "user_id": "user-uuid",
      "merchant_name": "Indomaret Kebon Jeruk",
      "total_amount": 25750.00,
      "currency": "IDR",
      "transaction_date": "2024-10-30",
      "category": "Groceries",
      "notes": "Belanja bulanan",
      "image_url": "https://storage.notaku.cloud/receipts/user-id/receipt-1.jpg",
      "is_edited": false,
      "created_at": "2024-10-30T07:55:00Z",
      "updated_at": "2024-10-30T07:55:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

### **GET /receipts/{receipt_id}**
Get specific receipt by ID.

**Response (200):**
```json
{
  "id": "receipt-uuid-here",
  "user_id": "user-uuid-here", 
  "merchant_name": "Indomaret Kebon Jeruk",
  "total_amount": 25750.00,
  "currency": "IDR",
  "transaction_date": "2024-10-30",
  "category": "Groceries",
  "notes": "Belanja bulanan kebutuhan dapur",
  "ocr_text": "Full OCR text here...",
  "ocr_confidence": 0.95,
  "image_url": "https://storage.notaku.cloud/receipts/user-id/receipt-id.jpg",
  "is_edited": false,
  "rag_indexed": true,
  "created_at": "2024-10-30T07:55:00Z",
  "updated_at": "2024-10-30T07:55:00Z",
  "items": [
    {
      "id": "item-uuid-1",
      "item_name": "Beras 5kg",
      "quantity": 1,
      "unit_price": 75000.00,
      "total_price": 75000.00
    },
    {
      "id": "item-uuid-2", 
      "item_name": "Minyak Goreng",
      "quantity": 1,
      "unit_price": 25000.00,
      "total_price": 25000.00
    }
  ]
}
```

### **PUT /receipts/{receipt_id}**
Update existing receipt.

**Request:**
```json
{
  "merchant_name": "Indomaret Kebon Jeruk (Updated)",
  "total_amount": 26000.00,
  "transaction_date": "2024-10-30",
  "category": "Food & Dining",
  "notes": "Updated notes here"
}
```

**Response (200):**
```json
{
  "id": "receipt-uuid-here",
  "user_id": "user-uuid-here",
  "merchant_name": "Indomaret Kebon Jeruk (Updated)",
  "total_amount": 26000.00,
  "currency": "IDR",
  "transaction_date": "2024-10-30", 
  "category": "Food & Dining",
  "notes": "Updated notes here",
  "ocr_text": "Original OCR text...",
  "ocr_confidence": 0.95,
  "image_url": "https://storage.notaku.cloud/receipts/user-id/receipt-id.jpg",
  "is_edited": true,
  "rag_indexed": true,
  "created_at": "2024-10-30T07:55:00Z",
  "updated_at": "2024-10-30T08:15:00Z"
}
```

### **DELETE /receipts/{receipt_id}**
Delete receipt and associated image.

**Response (200):**
```json
{
  "success": true,
  "message": "Receipt deleted successfully"
}
```

---

## 📊 **Analytics Endpoints**

### **GET /analytics/summary**
Get user's expense summary.

**Query Parameters:**
- `start_date`: YYYY-MM-DD
- `end_date`: YYYY-MM-DD
- `group_by`: day|week|month|category

**Response (200):**
```json
{
  "summary": {
    "total_receipts": 45,
    "total_amount": 1250000.00,
    "average_amount": 27777.78,
    "currency": "IDR"
  },
  "by_category": [
    {
      "category": "Groceries",
      "count": 15,
      "total_amount": 450000.00,
      "percentage": 36.0
    },
    {
      "category": "Food & Dining", 
      "count": 12,
      "total_amount": 380000.00,
      "percentage": 30.4
    }
  ],
  "by_period": [
    {
      "date": "2024-10-01",
      "count": 3,
      "total_amount": 85000.00
    }
  ]
}
```

---

## ❌ **Error Responses**

### **Standard Error Format:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "total_amount",
      "issue": "Must be a positive number"
    }
  }
}
```

### **Common Error Codes:**
- `400` - `VALIDATION_ERROR`: Invalid request data
- `401` - `UNAUTHORIZED`: Invalid or missing token
- `403` - `FORBIDDEN`: Insufficient permissions
- `404` - `NOT_FOUND`: Resource not found
- `409` - `CONFLICT`: Resource already exists
- `413` - `PAYLOAD_TOO_LARGE`: File too large
- `429` - `RATE_LIMIT_EXCEEDED`: Too many requests
- `500` - `INTERNAL_ERROR`: Server error

---

## 📁 **File Upload Handling**

### **Image Processing:**
1. **Accept**: base64 encoded images in request body
2. **Validate**: JPEG, PNG, WebP formats only
3. **Process**: Resize to max 1920px width, compress to 85% quality
4. **Store**: Upload to S3/MinIO with unique filename
5. **Return**: Public URL in response

### **File Naming Convention:**
```
receipts/{user_id}/{receipt_id}.jpg
receipts/{user_id}/thumbnails/{receipt_id}_thumb.jpg
```

---

## 🔄 **External Service Integration**

### **RAG Service Indexing:**
After receipt creation, automatically index in RAG service:

```http
POST https://api.notaku.cloud/index/receipt
Content-Type: application/json

{
  "receipt_id": "receipt-uuid",
  "merchant": "Indomaret Kebon Jeruk",
  "total": 25750.00,
  "date": "2024-10-30",
  "category": "Groceries",
  "ocr_text": "Full OCR text...",
  "user_id": "user-uuid"
}
```

---

## 🧪 **Testing Examples**

### **cURL Examples:**

**Create Receipt:**
```bash
curl -X POST https://backend.notaku.cloud/api/v1/receipts \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_name": "Test Store",
    "total_amount": 10000,
    "currency": "IDR", 
    "transaction_date": "2024-10-30",
    "category": "Groceries"
  }'
```

**Get Receipts:**
```bash
curl -X GET "https://backend.notaku.cloud/api/v1/receipts?limit=10" \
  -H "Authorization: Bearer your_jwt_token"
```

### **Frontend Integration:**
The existing frontend API client in `src/lib/receipts-api.ts` is already configured to work with these endpoints.

---

## 📋 **Implementation Priority**

### **Phase 1 (Critical):**
- ✅ POST /auth/login
- ✅ POST /auth/register  
- ✅ POST /receipts
- ✅ GET /receipts
- ✅ GET /receipts/{id}
- ✅ PUT /receipts/{id}
- ✅ DELETE /receipts/{id}

### **Phase 2 (Important):**
- ✅ File upload handling
- ✅ RAG service integration
- ✅ Error handling
- ✅ Input validation

### **Phase 3 (Nice to have):**
- ✅ GET /analytics/summary
- ✅ POST /auth/refresh
- ✅ Rate limiting
- ✅ Logging & monitoring

---

**🎯 This API specification matches exactly with the existing frontend implementation for seamless integration!**
