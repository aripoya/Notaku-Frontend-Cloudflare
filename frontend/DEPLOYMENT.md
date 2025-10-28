# 🚀 NotaKu Frontend - Deployment Guide

## 📋 **Overview**

This document covers the deployment and integration of NotaKu Frontend with the backend AI pipeline.

**Architecture:**
```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│   Frontend  │─────▶│  Integration     │─────▶│  OCR (8001) │
│  (Next.js)  │      │  Service (8005)  │      │  Vision     │
└─────────────┘      └──────────────────┘      │  (8002)     │
       │                      │                 └─────────────┘
       │                      │
       │                      ▼
       │             ┌──────────────────┐
       └────────────▶│  RAG Service     │
                     │  (8000)          │
                     │  Qwen 3.2 14B    │
                     └──────────────────┘
```

---

## 🔧 **Backend Endpoints**

### **1. Integration Service**
**Purpose:** Orchestrates complete receipt processing pipeline

**Base URL:** `http://172.16.1.9:8005`

**Endpoints:**

#### **a) Process Receipt (Upload)**
```http
POST /api/v1/receipt/process
Content-Type: multipart/form-data

Body:
- file: (binary) Receipt image file
- user_id: (optional) User identifier
```

**Response:**
```json
{
  "success": true,
  "receipt_id": "receipt_1761676565",
  "processing_time": "30.08s",
  "results": {
    "merchant": "Toko ABC",
    "date": "2024-10-07",
    "total": 800000,
    "items_count": 3,
    "quality_score": 0.8,
    "merchant_type": "supermarket"
  },
  "indexed": true  // ← CRITICAL: Must be true for chat to work
}
```

**⚠️ IMPORTANT:** 
- If `indexed: false`, receipt won't be searchable in chat
- Processing time can be 20-40 seconds
- Show loading indicator during upload

#### **b) Health Check**
```http
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2025-10-29T01:00:00Z"
}
```

#### **c) Stats**
```http
GET /stats

Response:
{
  "total_processed": 1234,
  "ocr_queue": 5,
  "vision_queue": 2
}
```

---

### **2. RAG Service**
**Purpose:** Handles chat/query with LLM using indexed receipts

**Base URL:** `http://172.16.1.9:8000`

**Tech Stack:**
- LLM: Qwen 3.2 14B (vLLM on RTX 4090)
- Vector DB: Qdrant
- Embeddings: BGE-M3
- Reranker: BGE Reranker

**Endpoints:**

#### **a) Query (Non-Streaming)**
```http
POST /query
Content-Type: application/json

Body:
{
  "question": "Berapa total belanja bulan ini?",
  "collection_name": "receipts",
  "top_k": 5,
  "rerank_top_k": 3,
  "include_context": true
}
```

**Response:**
```json
{
  "answer": "Total belanja Anda bulan ini adalah Rp 1.076.500",
  "sources": 3,
  "question": "Berapa total belanja bulan ini?",
  "context": [
    {
      "text": "Giant - Total: Rp 189.000 - 2024-10-15",
      "score": -7.16,
      "rank": 1
    },
    {
      "text": "Hypermart - Total: Rp 450.000 - 2024-10-20",
      "score": -8.24,
      "rank": 2
    }
  ]
}
```

#### **b) Query (Streaming with SSE)**
```http
POST /query/stream
Content-Type: application/json
Accept: text/event-stream

Body: (same as /query)
```

**Response (Server-Sent Events):**
```
data: {"token": "Berdasarkan ", "conversation_id": "123"}
data: {"token": "data ", "conversation_id": "123"}
data: {"token": "yang ", "conversation_id": "123"}
data: {"token": "saya ", "conversation_id": "123"}
...
data: {"context": [...], "sources": 3}
```

**Frontend Implementation:**
```typescript
const response = await fetch('/query/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  },
  body: JSON.stringify({
    question: userMessage,
    collection_name: 'receipts',
    top_k: 5,
    rerank_top_k: 3
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value, { stream: true });
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.token) {
        // Append token to chat display
        appendMessage(data.token);
      }
    }
  }
}
```

#### **c) Search (Retrieve Only)**
```http
POST /search
Content-Type: application/json

Body:
{
  "query": "pembelian Giant",
  "collection_name": "receipts",
  "top_k": 10
}
```

**Response:**
```json
{
  "results": [
    {
      "text": "Giant - Total: Rp 189.000 - 2024-10-15",
      "score": -5.23,
      "metadata": {
        "receipt_id": "receipt_123",
        "merchant": "Giant"
      }
    }
  ]
}
```

#### **d) Health Check**
```http
GET /health

Response:
{
  "status": "healthy",
  "llm_loaded": true,
  "qdrant_connected": true
}
```

#### **e) Collections**
```http
GET /collections

Response:
{
  "collections": [
    {
      "name": "receipts",
      "vectors_count": 1234,
      "indexed_count": 1234
    }
  ]
}
```

---

## 🔐 **Environment Variables**

Create `.env.development` file:

```bash
# API Server (FastAPI)
NEXT_PUBLIC_API_URL=https://api.notaku.cloud

# ✨ NEW: NotaKu Backend Services
NEXT_PUBLIC_INTEGRATION_URL=http://172.16.1.9:8005
NEXT_PUBLIC_RAG_URL=http://172.16.1.9:8000

# Debug Mode
NEXT_PUBLIC_DEBUG=true
```

**Verify:**
```bash
# In browser console or component
console.log('Integration:', process.env.NEXT_PUBLIC_INTEGRATION_URL);
console.log('RAG:', process.env.NEXT_PUBLIC_RAG_URL);
```

---

## ✅ **Verification Steps**

### **1. Upload Receipt & Verify RAG Indexing**

**a) Upload a receipt:**
```bash
# In browser console during upload
```

**b) Check console logs:**
```javascript
[Integration API] 🚀 Processing receipt via Integration Service
[Integration API] URL: http://172.16.1.9:8005/api/v1/receipt/process
[Integration API] ✅ Receipt processed successfully
[Integration API] Receipt ID: receipt_1761676565
[Integration API] Indexed in RAG: true  // ← MUST BE TRUE
[Integration API] Processing time: 30.08s
```

**c) If `indexed: false`:**
```javascript
[Integration API] ⚠️ WARNING: Receipt not indexed in RAG!
[Integration API] Chat will not be able to answer questions about this receipt
```

**Action:** Check RAG Service logs on backend

---

### **2. Chat with Diajeng AI**

**a) Click "Test RAG" button in Chat page:**
```javascript
[Chat] 🔍 Testing RAG Service: http://172.16.1.9:8000/health
[Chat] ✅ RAG Service healthy: {status: "healthy", llm_loaded: true}
```

**b) Ask a question:**
```
User: "Berapa total belanja bulan ini?"
```

**c) Check console logs:**
```javascript
[Chat] 🤖 RAG Configuration:
[Chat] RAG Service URL: http://172.16.1.9:8000
[Chat] Endpoint: http://172.16.1.9:8000/query/stream
[Chat] Collection: receipts
[Chat] 📡 Reading SSE stream...
[Chat] 📚 Context used: 3 sources
[Chat] ✅ Streaming complete
[Chat] Full response length: 245 chars
```

**d) Expected response:**
```
Diajeng: "Berdasarkan data yang saya temukan, total belanja Anda 
bulan ini adalah Rp 1.076.500. Terdiri dari 3 transaksi:
- Giant (Rp 189.000)
- Hypermart (Rp 450.000)
- Alfamart (Rp 437.500)"
```

---

### **3. Verify End-to-End Flow**

```bash
# Test complete pipeline:

1. Upload receipt
   → Check console for "indexed: true"
   
2. Wait 5 seconds (for indexing to complete)

3. Ask chat: "Apa saja yang saya beli dari [merchant name]?"
   → Should get accurate answer with context from uploaded receipt
   
4. If chat says "Tidak ada data":
   → Upload failed to index
   → Check Integration Service logs
   → Check RAG Service logs
   → Verify collection_name is "receipts"
```

---

## 🐛 **Troubleshooting**

### **Issue 1: Receipt Not Indexed (`indexed: false`)**

**Symptoms:**
- Upload succeeds but `indexed: false`
- Chat can't find uploaded receipts

**Debug:**
```bash
# Check Integration Service logs
ssh user@172.16.1.9
cd /path/to/integration-service
tail -f logs/integration.log

# Look for RAG indexing errors
```

**Common causes:**
- RAG Service down (check `http://172.16.1.9:8000/health`)
- Qdrant connection issue
- Collection "receipts" doesn't exist

**Fix:**
```bash
# Restart RAG Service
ssh user@172.16.1.9
systemctl restart rag-service

# Verify collection exists
curl http://172.16.1.9:8000/collections
```

---

### **Issue 2: Chat Returns "No Data"**

**Symptoms:**
- Chat responds but says "tidak ada data"
- Receipts were uploaded successfully

**Debug:**
```javascript
// In chat page, check console
[Chat] 📚 Context used: 0 sources  // ← Should be > 0
```

**Causes:**
- Wrong `collection_name` (must be "receipts")
- Receipts not indexed
- RAG Service not finding relevant context

**Fix:**
```bash
# Check collection name
curl http://172.16.1.9:8000/collections

# Should return:
{
  "collections": [
    {"name": "receipts", "vectors_count": 123}
  ]
}

# If vectors_count = 0, no receipts indexed
```

---

### **Issue 3: CORS Errors**

**Symptoms:**
```
Access to fetch at 'http://172.16.1.9:8005/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Fix (Backend):**
```python
# In Integration Service / RAG Service
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### **Issue 4: Upload Timeout**

**Symptoms:**
- Upload takes > 60 seconds
- Request aborts

**Debug:**
```javascript
[Integration API] ⏳ Processing time: 45.2s
```

**Causes:**
- High OCR queue (50 workers busy)
- Large image file (> 5MB)
- Vision service slow

**Fix:**
```bash
# Check Integration Service stats
curl http://172.16.1.9:8005/stats

# Response:
{
  "ocr_queue": 25,  // ← Too high (>20 = slow)
  "vision_queue": 5
}

# If queue is high, wait or increase timeout
```

**Frontend fix:**
```typescript
// In ocr-api.ts, increase timeout
const response = await fetch(uploadUrl, {
  method: 'POST',
  body: formData,
  signal: AbortSignal.timeout(90000)  // 90 seconds
});
```

---

### **Issue 5: Streaming Not Working**

**Symptoms:**
- Chat hangs on "Sedang berpikir..."
- No tokens received

**Debug:**
```javascript
[Chat] 📡 Reading SSE stream...
// No further logs
```

**Causes:**
- RAG Service not sending SSE format
- Response is not `text/event-stream`
- Network proxy blocking streaming

**Fix:**
```bash
# Test RAG streaming manually
curl -X POST http://172.16.1.9:8000/query/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "question": "test",
    "collection_name": "receipts",
    "top_k": 5
  }'

# Should see:
data: {"token": "Test "}
data: {"token": "response"}
...
```

---

## 📊 **Expected Response Formats**

### **Upload Response:**
```typescript
interface UploadResponse {
  success: boolean;
  receipt_id: string;
  processing_time: string;
  results: {
    merchant: string;
    date: string;
    total: number;
    items_count: number;
    quality_score: number;
    merchant_type?: string;
  };
  indexed: boolean;  // CRITICAL
}
```

### **Query Response (Non-Streaming):**
```typescript
interface QueryResponse {
  answer: string;
  sources: number;
  question: string;
  context: Array<{
    text: string;
    score: number;
    rank: number;
  }>;
}
```

### **Query Response (Streaming SSE):**
```typescript
// Each line:
data: {"token": string, "conversation_id"?: string}
// or
data: {"context": Array<...>, "sources": number}
```

---

## 🚀 **Deployment Checklist**

### **Pre-Deployment:**
- [ ] Backend services running:
  - [ ] Integration Service (8005)
  - [ ] RAG Service (8000)
  - [ ] OCR Service (8001) - internal
  - [ ] Vision Service (8002) - internal
- [ ] Environment variables set
- [ ] Health checks passing

### **Testing:**
- [ ] Upload receipt → Check `indexed: true`
- [ ] Chat test → Get accurate answers
- [ ] Streaming works
- [ ] Console logs clean (no errors)

### **Post-Deployment:**
- [ ] Monitor Integration Service logs
- [ ] Monitor RAG Service logs
- [ ] Check Qdrant vector counts
- [ ] Verify upload → chat flow works

---

## 📞 **Support & Monitoring**

### **Health Endpoints:**
```bash
# Integration Service
curl http://172.16.1.9:8005/health

# RAG Service
curl http://172.16.1.9:8000/health

# Check collections
curl http://172.16.1.9:8000/collections
```

### **Logs:**
```bash
# Frontend (browser console)
- [Integration API] → Upload logs
- [Chat] → Query logs

# Backend
ssh user@172.16.1.9
tail -f /path/to/integration-service/logs/*.log
tail -f /path/to/rag-service/logs/*.log
```

### **Metrics to Monitor:**
- Upload success rate (should be > 95%)
- RAG indexing rate (`indexed: true` should be 100%)
- Chat response time (should be < 5s)
- Context retrieval (sources should be > 0)

---

## 🎯 **Success Criteria**

✅ **Upload Flow:**
1. User uploads receipt
2. Integration Service processes (20-40s)
3. Response shows `indexed: true`
4. Receipt appears in dashboard

✅ **Chat Flow:**
1. User asks question
2. RAG retrieves context (2-3 sources)
3. LLM generates answer (streaming)
4. Answer is accurate and contextual

✅ **End-to-End:**
1. Upload 3 receipts
2. All show `indexed: true`
3. Chat: "Berapa total belanja saya?"
4. Get accurate sum of all 3 receipts

---

**Last Updated:** October 29, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
