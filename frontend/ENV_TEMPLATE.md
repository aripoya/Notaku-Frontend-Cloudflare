# Environment Variables Template

Copy this content to create your `.env.development` file.

## Development Environment

Create file: `.env.development`

```bash
# API Server (FastAPI)
NEXT_PUBLIC_API_URL=https://api.notaku.cloud

# Workflows (n8n)
NEXT_PUBLIC_WORKFLOWS_URL=https://workflows.notaku.cloud

# Storage (MinIO)
NEXT_PUBLIC_STORAGE_URL=https://storage.notaku.cloud

# ✨ NEW: NotaKu Backend Services (AI Pipeline)
# Integration Service - Handles upload pipeline (OCR + Vision + RAG Indexing)
NEXT_PUBLIC_INTEGRATION_URL=http://172.16.1.9:8005

# RAG Service - Handles chat/query with LLM (Qwen 3.2 14B)
NEXT_PUBLIC_RAG_URL=http://172.16.1.9:8000

# Optional: Debug Mode
NEXT_PUBLIC_DEBUG=true
```

## Production Environment

Create file: `.env.production`

```bash
# API Server (FastAPI)
NEXT_PUBLIC_API_URL=https://api.notaku.cloud

# Workflows (n8n)
NEXT_PUBLIC_WORKFLOWS_URL=https://workflows.notaku.cloud

# Storage (MinIO)
NEXT_PUBLIC_STORAGE_URL=https://storage.notaku.cloud

# ✨ NEW: NotaKu Backend Services (AI Pipeline)
# Integration Service - Handles upload pipeline (OCR + Vision + RAG Indexing)
NEXT_PUBLIC_INTEGRATION_URL=http://172.16.1.9:8005

# RAG Service - Handles chat/query with LLM (Qwen 3.2 14B)
NEXT_PUBLIC_RAG_URL=http://172.16.1.9:8000

# Debug Mode (disabled in production)
NEXT_PUBLIC_DEBUG=false
```

## Local Backend (Optional)

If running backend locally without Cloudflare Tunnel:

```bash
# API Server (local)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Workflows (local)
NEXT_PUBLIC_WORKFLOWS_URL=http://localhost:5678

# Storage (local)
NEXT_PUBLIC_STORAGE_URL=http://localhost:9001

# ✨ NEW: NotaKu Backend Services (AI Pipeline)
# Integration Service - Handles upload pipeline (OCR + Vision + RAG Indexing)
NEXT_PUBLIC_INTEGRATION_URL=http://172.16.1.9:8005

# RAG Service - Handles chat/query with LLM (Qwen 3.2 14B)
NEXT_PUBLIC_RAG_URL=http://172.16.1.9:8000

# Debug Mode
NEXT_PUBLIC_DEBUG=true
```

## Infrastructure Notes

All services are exposed via **Cloudflare Tunnel**:
- ✅ Automatic SSL/TLS encryption
- ✅ DDoS protection
- ✅ Global CDN
- ✅ No need to expose local ports
- ✅ Secure tunnel to localhost

**Tunnel Routes:**
```
api.notaku.cloud       → localhost:8000 (FastAPI)
workflows.notaku.cloud → localhost:5678 (n8n)
storage.notaku.cloud   → localhost:9001 (MinIO Console)
```

## How to Create

```bash
# Navigate to frontend directory
cd frontend

# Create development environment file
cat > .env.development << 'EOF'
# API Server (FastAPI)
NEXT_PUBLIC_API_URL=https://api.notaku.cloud

# Workflows (n8n)
NEXT_PUBLIC_WORKFLOWS_URL=https://workflows.notaku.cloud

# Storage (MinIO)
NEXT_PUBLIC_STORAGE_URL=https://storage.notaku.cloud

# ✨ NEW: NotaKu Backend Services (AI Pipeline)
# Integration Service - Handles upload pipeline (OCR + Vision + RAG Indexing)
NEXT_PUBLIC_INTEGRATION_URL=http://172.16.1.9:8005

# RAG Service - Handles chat/query with LLM (Qwen 3.2 14B)
NEXT_PUBLIC_RAG_URL=http://172.16.1.9:8000

# Debug Mode
NEXT_PUBLIC_DEBUG=true
EOF

# Verify file created
cat .env.development
```

## NotaKu Backend Services (NEW) 🆕

The application now uses a **multi-service AI pipeline** architecture:

### **Architecture:**
```
Frontend → Integration Service → OCR + Vision + RAG Indexing
Frontend → RAG Service → Query with LLM (Diajeng AI)
```

### **Services:**

**1. Integration Service** (RTX 3090 - Port 8005)
- **Purpose:** Orchestrates complete receipt processing pipeline
- **URL:** `http://172.16.1.9:8005`
- **Endpoint:** `/api/v1/receipt/process`
- **Pipeline:**
  1. Upload receipt image
  2. OCR extraction (PaddleOCR - 50 workers)
  3. Vision analysis (Llama 3.2 Vision 11B)
  4. Structure extraction (items, totals)
  5. RAG indexing (makes receipt searchable)
- **Response:** 
  ```json
  {
    "success": true,
    "receipt_id": "receipt_1761676565",
    "indexed": true,  // ← CRITICAL: Confirms RAG indexing
    "processing_time": "30.08s",
    "results": {...}
  }
  ```

**2. RAG Service** (RTX 3090 - Port 8000)
- **Purpose:** Handles chat/query with context from indexed receipts
- **URL:** `http://172.16.1.9:8000`
- **Endpoint:** `/query/stream` (SSE streaming)
- **Tech Stack:**
  - LLM: Qwen 3.2 14B (vLLM)
  - Vector DB: Qdrant
  - Embeddings: BGE-M3
  - Reranker: BGE Reranker
- **Request:**
  ```json
  {
    "question": "Berapa total belanja bulan ini?",
    "collection_name": "receipts",
    "top_k": 5,
    "rerank_top_k": 3
  }
  ```

**3. Internal Services** (Not directly called by frontend)
- OCR Service (R630 - Port 8001): Text extraction only
- Vision Service (RTX 5080 - Port 8002): Image analysis only

### **Important Notes:**

⚠️ **DO NOT** call OCR Service (8001) directly anymore!
- Old: Frontend → OCR (8001) ❌
- New: Frontend → Integration (8005) ✅

⚠️ **Legacy env vars** (can be removed):
```bash
# DEPRECATED - Do not use
# NEXT_PUBLIC_OCR_URL=http://172.16.1.7:8001
```

✅ **Required for RAG indexing:**
- Receipts MUST be uploaded via Integration Service (8005)
- This ensures `indexed: true` in response
- Only indexed receipts are searchable in chat

## Verify Environment Variables

After creating the file, restart dev server and check:

```javascript
// In any component
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
// Should output: https://api.notaku.cloud

// NEW: Backend Services
console.log('Integration:', process.env.NEXT_PUBLIC_INTEGRATION_URL);
// Should output: http://172.16.1.9:8005

console.log('RAG:', process.env.NEXT_PUBLIC_RAG_URL);
// Should output: http://172.16.1.9:8000
