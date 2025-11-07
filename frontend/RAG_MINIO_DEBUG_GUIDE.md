# RAG & MinIO Storage Troubleshooting Guide

## Overview

**RAG (Retrieval-Augmented Generation)**:
- Purpose: Index receipts for chat/search queries
- Service: Integration Service → Qdrant vector DB
- Endpoint: https://upload.notaku.cloud
- Check: `response.indexed` should be `true`

**MinIO**:
- Purpose: Object storage for receipt images
- Default: S3-compatible storage
- Used by: Backend API for storing images
- Path: Images should have `image_path` like `/uploads/receipts/xyz.jpg`

---

## Issue 1: RAG Indexing Not Working

### Symptoms:
- `response.indexed: false` after OCR
- Console warning: "Receipt not indexed in RAG!"
- Chat cannot answer questions about receipt
- Receipt not searchable in receipts list

### Debug Steps:

#### Step 1: Check OCR Response

After uploading receipt, check console:
```javascript
[Upload] ✅ Receipt processed successfully
[Upload] Receipt ID: receipt_1234567
[Upload] Indexed in RAG: false  // ❌ Should be true
```

**If indexed is false**, RAG indexing failed during integration service processing.

#### Step 2: Check Integration Service Logs

```bash
# SSH to integration service server
ssh your-server

# Check service logs
docker logs notaku-integration-service -f
# or
pm2 logs integration-service --lines 100

# Look for errors:
# - Qdrant connection failed
# - Vector embedding errors
# - Indexing timeout
# - Permission errors
```

**Common log errors:**
```
ERROR: Failed to connect to Qdrant at localhost:6333
ERROR: Embedding model not loaded
ERROR: Collection 'receipts' does not exist
ERROR: Failed to index document: <details>
```

#### Step 3: Check Qdrant Vector Database

```bash
# Check if Qdrant is running
docker ps | grep qdrant

# Check Qdrant health
curl http://localhost:6333/
# Expected: {"title":"qdrant - vector search engine","version":"..."}

# Check collections
curl http://localhost:6333/collections
# Should show: "receipts" collection

# Check collection info
curl http://localhost:6333/collections/receipts
# Shows: vectors_count, segments_count, etc.
```

**If Qdrant not running:**
```bash
# Start Qdrant
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

#### Step 4: Check Embedding Model

Integration service needs embedding model for RAG:

```bash
# Check if model is loaded
curl http://localhost:11434/api/tags
# Should show embedding model (e.g., nomic-embed-text)

# If missing, pull model:
ollama pull nomic-embed-text
```

#### Step 5: Test RAG Indexing Manually

```bash
# Test indexing a document
curl -X POST http://localhost:6333/collections/receipts/points \
  -H "Content-Type: application/json" \
  -d '{
    "points": [{
      "id": "test_123",
      "vector": [0.1, 0.2, ...],  # 768 dimensions
      "payload": {
        "text": "Test receipt",
        "merchant": "Test Store",
        "total": 50000
      }
    }]
  }'
```

---

## Issue 2: MinIO/Image Storage Not Working

### Symptoms:
- `image_path: null` in saved receipt
- Receipt image not displayed
- Backend doesn't return image URL
- 404 when accessing image URL

### Debug Steps:

#### Step 1: Check Backend Response

After saving receipt, check Network tab:
```json
{
  "id": "abc-123",
  "merchant_name": "Indomaret",
  "image_path": null,  // ❌ Should have value
  "image_base64": null  // ❌ Or this should have value
}
```

**If both null**, backend didn't save the image.

#### Step 2: Check Backend Request Payload

Verify frontend is sending image:
```javascript
// In browser console after clicking save:
[Save] 📤 Saving to backend API: {
  image_base64: "[12345 chars]",  // ✅ Should have data
  // or
  image_path: "/uploads/receipt.jpg"  // ✅ Or path
}
```

**If missing**, frontend not including image in request.

#### Step 3: Check Backend Storage Configuration

Backend needs MinIO/S3 configuration:

```python
# Backend environment variables
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=receipts
MINIO_SECURE=false  # true for HTTPS

# Or S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=receipts
AWS_REGION=ap-southeast-1
```

#### Step 4: Check MinIO Service

```bash
# Check if MinIO is running
docker ps | grep minio

# Check MinIO health
curl http://localhost:9000/minio/health/live

# Access MinIO Console
# Open: http://localhost:9001
# Login: minioadmin / minioadmin
```

**If MinIO not running:**
```bash
# Start MinIO
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -v $(pwd)/minio_data:/data \
  minio/minio server /data --console-address ":9001"

# Create bucket
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/receipts
mc policy set public local/receipts
```

#### Step 5: Check Backend Image Save Logic

Backend should:
1. Receive `image_base64` from frontend
2. Decode base64 to binary
3. Upload to MinIO/S3
4. Get public URL or path
5. Save URL to database
6. Return URL in response

**Example backend code:**
```python
async def save_receipt_image(image_base64: str, receipt_id: str) -> str:
    # Decode base64
    image_data = base64.b64decode(image_base64.split(',')[1])
    
    # Generate filename
    filename = f"{receipt_id}_{int(time.time())}.jpg"
    
    # Upload to MinIO
    minio_client.put_object(
        bucket_name="receipts",
        object_name=filename,
        data=BytesIO(image_data),
        length=len(image_data),
        content_type="image/jpeg"
    )
    
    # Return public URL
    return f"https://storage.notaku.cloud/receipts/{filename}"
```

#### Step 6: Test Image Upload Manually

```bash
# Test MinIO upload
curl -X PUT http://localhost:9000/receipts/test.jpg \
  -H "Host: localhost:9000" \
  -H "Content-Type: image/jpeg" \
  --data-binary @test-receipt.jpg

# Check if uploaded
curl http://localhost:9000/receipts/test.jpg
# Should return image data
```

---

## Complete System Check

### Architecture Overview:
```
Frontend (Browser)
  ↓ Upload image
Integration Service (https://upload.notaku.cloud)
  ├─→ OCR (PaddleOCR/Google Vision)
  ├─→ Structure Extraction
  ├─→ RAG Indexing (Qdrant)
  └─→ Return results
  
Frontend saves to Backend API
  ↓ image_base64
Backend API (https://api.notaku.cloud)
  ├─→ Save to Database (PostgreSQL)
  └─→ Upload image to MinIO/S3
       └─→ Return image_path

Chat Feature
  ↓ Query
RAG Service (api.notaku.cloud)
  ├─→ Qdrant vector search
  ├─→ LLM (Ollama/OpenAI)
  └─→ Return answer
```

### Services Checklist:

- [ ] **Qdrant**: Running on 6333
- [ ] **MinIO**: Running on 9000/9001
- [ ] **Integration Service**: https://upload.notaku.cloud/health returns OK
- [ ] **Backend API**: https://api.notaku.cloud/health returns OK
- [ ] **Ollama**: Running on 11434 (for RAG/LLM)
- [ ] **PostgreSQL**: Database accessible
- [ ] **Cloudflare Tunnel**: Forwarding HTTPS traffic

### Quick Health Check Script:

```bash
#!/bin/bash
echo "=== System Health Check ==="

# Integration Service
echo "1. Integration Service:"
curl -s https://upload.notaku.cloud/health | jq .

# Backend API
echo "2. Backend API:"
curl -s https://api.notaku.cloud/health | jq .

# Qdrant
echo "3. Qdrant:"
curl -s http://localhost:6333/ | jq .

# MinIO
echo "4. MinIO:"
curl -s http://localhost:9000/minio/health/live

# Ollama
echo "5. Ollama:"
curl -s http://localhost:11434/api/tags | jq .

echo "=== End of Health Check ==="
```

---

## Fixing RAG Indexing

### Option 1: Fix Integration Service

```bash
# Check integration service config
cat /path/to/integration-service/.env

# Should have:
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION=receipts
EMBEDDING_MODEL=nomic-embed-text
OLLAMA_HOST=http://localhost:11434

# Restart service
docker restart notaku-integration-service
# or
pm2 restart integration-service
```

### Option 2: Re-index Existing Receipts

```python
# Script to re-index receipts
import requests
from qdrant_client import QdrantClient

client = QdrantClient(host="localhost", port=6333)

# Get all receipts from database
receipts = db.query(Receipt).all()

for receipt in receipts:
    # Generate embedding
    embedding = get_embedding(receipt.ocr_text)
    
    # Index in Qdrant
    client.upsert(
        collection_name="receipts",
        points=[{
            "id": receipt.id,
            "vector": embedding,
            "payload": {
                "merchant": receipt.merchant_name,
                "total": receipt.total_amount,
                "date": receipt.transaction_date,
                "text": receipt.ocr_text
            }
        }]
    )
    print(f"Indexed: {receipt.id}")
```

---

## Fixing MinIO Storage

### Option 1: Update Backend to Save Images

```python
# Add to backend /receipts endpoint
from minio import Minio
import base64
from io import BytesIO

minio_client = Minio(
    "localhost:9000",
    access_key="minioadmin",
    secret_key="minioadmin",
    secure=False
)

@router.post("/receipts")
async def create_receipt(
    # ... other params ...
    image_base64: Optional[str] = None,
):
    image_path = None
    
    if image_base64:
        # Decode base64
        image_data = base64.b64decode(image_base64.split(',')[1])
        filename = f"receipt_{uuid.uuid4()}.jpg"
        
        # Upload to MinIO
        minio_client.put_object(
            bucket_name="receipts",
            object_name=filename,
            data=BytesIO(image_data),
            length=len(image_data),
            content_type="image/jpeg"
        )
        
        image_path = f"/receipts/{filename}"
    
    receipt = Receipt(
        # ... other fields ...
        image_path=image_path
    )
    # ... save to DB ...
```

### Option 2: Use Direct Upload

Instead of base64, use direct file upload:

```javascript
// Frontend: Use FormData instead of JSON
const formData = new FormData();
formData.append('merchant_name', merchantName);
formData.append('total_amount', totalAmount);
formData.append('image', selectedFile);  // File object

await fetch('/api/v1/receipts', {
  method: 'POST',
  body: formData,  // No Content-Type header
});
```

---

## Monitoring & Logs

### Watch all services at once:

```bash
# Terminal 1: Frontend
pm2 logs notaku-frontend --lines 50 --raw | grep -E "Upload|Save|RAG"

# Terminal 2: Backend
docker logs -f notaku-backend | grep -E "receipt|image|minio"

# Terminal 3: Integration Service
docker logs -f notaku-integration-service | grep -E "rag|qdrant|index"

# Terminal 4: Qdrant
docker logs -f qdrant | grep -E "point|collection"
```

### Check storage usage:

```bash
# MinIO storage
mc du local/receipts

# Qdrant storage
du -sh /path/to/qdrant_storage/

# Database size
psql -c "SELECT pg_size_pretty(pg_database_size('notaku'));"
```

---

## Quick Fixes

### Fix 1: RAG not indexing
```bash
# Restart Qdrant
docker restart qdrant

# Restart Integration Service
docker restart notaku-integration-service

# Check logs
docker logs notaku-integration-service --tail 100
```

### Fix 2: MinIO not saving
```bash
# Restart MinIO
docker restart minio

# Check bucket exists
mc ls local/receipts

# Set public policy
mc policy set public local/receipts
```

### Fix 3: Backend not processing images
```bash
# Check backend env
docker exec notaku-backend env | grep MINIO

# Restart backend
docker restart notaku-backend

# Check logs
docker logs notaku-backend --tail 100
```

---

## Testing End-to-End

```bash
# 1. Upload receipt
curl -X POST https://upload.notaku.cloud/api/v1/receipt/process \
  -F "file=@test-receipt.jpg" \
  -F "user_id=test-user"

# Should return: indexed: true

# 2. Save to backend
curl -X POST https://api.notaku.cloud/api/v1/receipts \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_name": "Test",
    "total_amount": 50000,
    "transaction_date": "2025-11-06",
    "image_base64": "data:image/jpeg;base64,..."
  }'

# Should return: image_path: "/receipts/..."

# 3. Test RAG search
curl -X POST http://localhost:6333/collections/receipts/points/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, ...],
    "limit": 5
  }'

# Should return matching receipts

# 4. Test image access
curl -I https://storage.notaku.cloud/receipts/abc123.jpg
# Should return: 200 OK
```

---

## Contact / Support

If issues persist:
1. Collect logs from all services
2. Check service configurations
3. Verify network connectivity
4. Test each component individually
5. Check resource usage (CPU, memory, disk)

Common issues:
- Qdrant out of memory
- MinIO disk full
- Ollama model not loaded
- Cloudflare tunnel down
- Database connection pool exhausted
