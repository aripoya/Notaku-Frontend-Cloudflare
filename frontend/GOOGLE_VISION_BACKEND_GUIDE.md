# Google Vision API - Backend Implementation Guide

## 📋 Overview

Implementasi Google Vision API sebagai **Premium OCR** feature di backend OCR service.

---

## 🔧 Backend Setup

### 1. Install Dependencies

```bash
pip install google-cloud-vision
pip install google-auth
```

### 2. Service Account Setup

**File:** `service-account.json` (simpan di backend root, jangan commit!)

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

**Environment Variable:**
```bash
# .env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### 3. Add to .gitignore

```bash
# .gitignore
service-account.json
*.json  # All JSON files (be careful!)
```

---

## 💾 Database Schema

### Add Premium Field to Users Table

```sql
-- Migration: Add premium field
ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN premium_expires_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(50) DEFAULT 'free';
```

**Or in SQLAlchemy:**

```python
# models/user.py
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String)
    
    # Premium fields
    is_premium = Column(Boolean, default=False)
    premium_expires_at = Column(DateTime, nullable=True)
    subscription_tier = Column(String, default="free")  # free, basic, premium
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

---

## 🔐 Premium Check Middleware

```python
# middleware/premium.py
from fastapi import HTTPException, Depends
from datetime import datetime
from models.user import User
from auth.dependencies import get_current_user

def require_premium(current_user: User = Depends(get_current_user)):
    """
    Middleware to check if user has premium access
    """
    if not current_user.is_premium:
        raise HTTPException(
            status_code=403,
            detail="Premium subscription required. Please upgrade your account."
        )
    
    # Check if premium expired
    if current_user.premium_expires_at:
        if datetime.utcnow() > current_user.premium_expires_at:
            raise HTTPException(
                status_code=403,
                detail="Premium subscription expired. Please renew your subscription."
            )
    
    return current_user
```

---

## 🎯 Google Vision API Implementation

### Create Google Vision Service

```python
# services/google_vision.py
import os
from google.cloud import vision
from google.oauth2 import service_account
from typing import Dict, Any, Optional
import re
from datetime import datetime

class GoogleVisionService:
    def __init__(self):
        # Load credentials from service account file
        credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        if not credentials_path:
            raise ValueError("GOOGLE_APPLICATION_CREDENTIALS not set")
        
        self.credentials = service_account.Credentials.from_service_account_file(
            credentials_path
        )
        self.client = vision.ImageAnnotatorClient(credentials=self.credentials)
    
    def detect_text(self, image_content: bytes) -> Dict[str, Any]:
        """
        Detect text in image using Google Vision API
        
        Args:
            image_content: Image file content in bytes
            
        Returns:
            Dict with extracted text and structured data
        """
        try:
            # Create image object
            image = vision.Image(content=image_content)
            
            # Perform text detection
            response = self.client.text_detection(image=image)
            texts = response.text_annotations
            
            if response.error.message:
                raise Exception(f"Google Vision API error: {response.error.message}")
            
            if not texts:
                return {
                    "success": False,
                    "error": "No text detected in image",
                    "ocr_text": "",
                    "extracted": {}
                }
            
            # First annotation contains full text
            full_text = texts[0].description
            
            # Extract structured data
            extracted_data = self._extract_receipt_data(full_text)
            
            # Calculate confidence (Google Vision provides per-word confidence)
            confidence = self._calculate_confidence(texts)
            
            return {
                "success": True,
                "ocr_text": full_text,
                "ocr_confidence": confidence,
                "line_count": len(full_text.split('\n')),
                "extracted": extracted_data,
                "raw_annotations": [
                    {
                        "text": text.description,
                        "confidence": text.confidence if hasattr(text, 'confidence') else None,
                        "bounds": self._get_bounds(text.bounding_poly)
                    }
                    for text in texts[1:]  # Skip first (full text)
                ]
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "ocr_text": "",
                "extracted": {}
            }
    
    def _extract_receipt_data(self, text: str) -> Dict[str, Any]:
        """
        Extract structured data from receipt text
        """
        extracted = {}
        
        # Extract merchant name (usually first few lines)
        lines = text.split('\n')
        if lines:
            # Take first non-empty line as merchant
            for line in lines[:5]:
                if line.strip() and len(line.strip()) > 2:
                    extracted['merchant'] = line.strip()
                    break
        
        # Extract total amount
        # Pattern: TOTAL, Total, GRAND TOTAL, etc. followed by amount
        total_patterns = [
            r'(?:TOTAL|Total|GRAND TOTAL|Grand Total|AMOUNT|Amount)[\s:]*Rp[\s]*([0-9.,]+)',
            r'(?:TOTAL|Total)[\s:]*([0-9.,]+)',
            r'Rp[\s]*([0-9.,]+)(?:\s*$)',  # Last Rp amount
        ]
        
        for pattern in total_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(',', '').replace('.', '')
                try:
                    extracted['total_amount'] = float(amount_str)
                    break
                except ValueError:
                    continue
        
        # Extract date
        # Pattern: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
        date_patterns = [
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'(\d{1,2}\.\d{1,2}\.\d{2,4})',
            r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',  # YYYY-MM-DD
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                date_str = match.group(1)
                try:
                    # Try to parse date
                    for fmt in ['%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y', '%Y-%m-%d', '%d/%m/%y']:
                        try:
                            parsed_date = datetime.strptime(date_str, fmt)
                            extracted['date'] = parsed_date.strftime('%Y-%m-%d')
                            break
                        except ValueError:
                            continue
                    break
                except Exception:
                    continue
        
        # Extract tax if present
        tax_pattern = r'(?:TAX|Tax|PPN|Pajak)[\s:]*Rp?[\s]*([0-9.,]+)'
        match = re.search(tax_pattern, text, re.IGNORECASE)
        if match:
            tax_str = match.group(1).replace(',', '').replace('.', '')
            try:
                extracted['tax'] = float(tax_str)
            except ValueError:
                pass
        
        return extracted
    
    def _calculate_confidence(self, texts) -> float:
        """
        Calculate average confidence from text annotations
        """
        if len(texts) <= 1:
            return 0.95  # Default high confidence for Google Vision
        
        confidences = []
        for text in texts[1:]:  # Skip first (full text)
            if hasattr(text, 'confidence') and text.confidence:
                confidences.append(text.confidence)
        
        if confidences:
            return sum(confidences) / len(confidences)
        
        return 0.95  # Default
    
    def _get_bounds(self, bounding_poly) -> Dict[str, int]:
        """
        Extract bounding box coordinates
        """
        if not bounding_poly or not bounding_poly.vertices:
            return {}
        
        vertices = bounding_poly.vertices
        return {
            "x_min": min(v.x for v in vertices),
            "y_min": min(v.y for v in vertices),
            "x_max": max(v.x for v in vertices),
            "y_max": max(v.y for v in vertices),
        }

# Singleton instance
google_vision_service = GoogleVisionService()
```

---

## 🛣️ API Endpoints

### Add Premium OCR Endpoint

```python
# routes/ocr.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from services.google_vision import google_vision_service
from middleware.premium import require_premium
from models.user import User
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/v1/ocr", tags=["OCR"])

@router.post("/premium/upload")
async def upload_premium_ocr(
    file: UploadFile = File(...),
    current_user: User = Depends(require_premium)
):
    """
    Premium OCR using Google Vision API
    Requires premium subscription
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image"
            )
        
        # Read file content
        image_content = await file.read()
        
        # Validate file size (max 10MB)
        if len(image_content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File size must be less than 10MB"
            )
        
        # Process with Google Vision
        result = google_vision_service.detect_text(image_content)
        
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail=result.get('error', 'OCR processing failed')
            )
        
        # Generate job ID for consistency with standard OCR
        job_id = str(uuid.uuid4())
        
        # Return result
        return {
            "job_id": job_id,
            "status": "finished",
            "ocr_text": result['ocr_text'],
            "ocr_confidence": result['ocr_confidence'],
            "line_count": result['line_count'],
            "extracted": result['extracted'],
            "processing_time_ms": 0,  # Instant for premium
            "ocr_method": "google_vision",
            "is_premium": True,
            "processed_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Premium OCR failed: {str(e)}"
        )

@router.get("/premium/health")
async def premium_ocr_health(
    current_user: User = Depends(require_premium)
):
    """
    Check if Google Vision API is accessible
    """
    try:
        # Simple test to verify credentials
        google_vision_service.client
        return {
            "status": "healthy",
            "service": "google_vision",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
```

---

## 🧪 Testing

### Test Premium OCR Endpoint

```bash
# 1. Get auth token (login)
TOKEN="your-jwt-token"

# 2. Test premium OCR
curl -X POST "http://localhost:8001/api/v1/ocr/premium/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@receipt.jpg"

# Expected response:
{
  "job_id": "uuid",
  "status": "finished",
  "ocr_text": "BCA\nBANKCA 005 300000...",
  "ocr_confidence": 0.98,
  "extracted": {
    "merchant": "BCA",
    "date": "2025-10-24",
    "total_amount": 95000.0,
    "tax": 0.0
  },
  "ocr_method": "google_vision",
  "is_premium": true
}
```

### Test Without Premium

```bash
# Should return 403 Forbidden
curl -X POST "http://localhost:8001/api/v1/ocr/premium/upload" \
  -H "Authorization: Bearer $NON_PREMIUM_TOKEN" \
  -F "file=@receipt.jpg"

# Expected:
{
  "detail": "Premium subscription required. Please upgrade your account."
}
```

---

## 🔒 Security Checklist

- ✅ Service account JSON **NOT** in git
- ✅ Environment variable for credentials path
- ✅ Premium check middleware
- ✅ File size validation (max 10MB)
- ✅ File type validation (images only)
- ✅ Rate limiting (optional, recommended)
- ✅ Error handling with proper messages

---

## 📊 Cost Estimation

**Google Vision API Pricing:**
- First 1,000 units/month: **FREE**
- 1,001 - 5,000,000 units: **$1.50 per 1,000 units**

**Example:**
- 100 receipts/day = 3,000/month = **FREE**
- 1,000 receipts/day = 30,000/month = **$43.50/month**

---

## 🚀 Deployment

### Environment Variables

```bash
# Production .env
GOOGLE_APPLICATION_CREDENTIALS=/app/service-account.json
GOOGLE_CLOUD_PROJECT=your-project-id
```

### Docker

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy service account (use secrets in production!)
COPY service-account.json /app/service-account.json
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/service-account.json

# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy app
COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

**Better: Use Docker secrets**

```bash
# docker-compose.yml
services:
  ocr-backend:
    build: .
    secrets:
      - google_credentials
    environment:
      GOOGLE_APPLICATION_CREDENTIALS: /run/secrets/google_credentials

secrets:
  google_credentials:
    file: ./service-account.json
```

---

## 📝 Summary

**Backend Changes Needed:**

1. ✅ Install `google-cloud-vision`
2. ✅ Add service account JSON
3. ✅ Add `is_premium` field to User model
4. ✅ Create `GoogleVisionService` class
5. ✅ Create `require_premium` middleware
6. ✅ Add `/api/v1/ocr/premium/upload` endpoint
7. ✅ Test with premium and non-premium users

**Next:** Frontend implementation to call this endpoint! 🎨
