# 🚀 NotaKu Frontend - Quick Start Guide

## ✅ **Changes Implemented**

### **What Changed:**
- ✅ Upload now uses **Integration Service** (complete pipeline)
- ✅ Chat now uses **RAG Service** (indexed receipts)
- ✅ All receipts automatically indexed for chat
- ✅ Real-time streaming responses

### **Old vs New:**

| Feature | Old (❌) | New (✅) |
|---------|---------|---------|
| **Upload** | OCR direct (8001) | Integration Service (8005) |
| **Pipeline** | OCR only | OCR → Vision → RAG |
| **Chat** | Generic API | RAG with context |
| **Indexing** | Manual | Automatic |
| **Streaming** | Simulated | Real SSE |

---

## 🔧 **Setup (5 Minutes)**

### **Step 1: Environment Variables**

Create `.env.development`:
```bash
cd frontend
cat > .env.development << 'EOF'
# API Server
NEXT_PUBLIC_API_URL=https://api.notaku.cloud

# ✨ NEW: Backend AI Pipeline
NEXT_PUBLIC_INTEGRATION_URL=http://172.16.1.9:8005
NEXT_PUBLIC_RAG_URL=http://172.16.1.9:8000

# Debug
NEXT_PUBLIC_DEBUG=true
EOF
```

### **Step 2: Verify Environment**
```bash
npm run dev
```

Open browser console:
```javascript
console.log(process.env.NEXT_PUBLIC_INTEGRATION_URL);
// Should show: http://172.16.1.9:8005

console.log(process.env.NEXT_PUBLIC_RAG_URL);
// Should show: http://172.16.1.9:8000
```

### **Step 3: Test Upload**

1. Go to **Upload** page
2. Upload a receipt
3. Check console:

**✅ Success:**
```javascript
[Integration API] ✅ Receipt processed successfully
[Integration API] Indexed in RAG: true  // ← IMPORTANT!
```

**❌ Error:**
```javascript
[Integration API] ⚠️ WARNING: Receipt not indexed in RAG!
```
→ See [Troubleshooting](#troubleshooting)

### **Step 4: Test Chat**

1. Go to **Chat** page
2. Click **"Test RAG"** button
3. Should see:
```
✓ RAG Service OK
Status: healthy
Collection: receipts
```

4. Ask question:
```
"Berapa total belanja saya?"
```

5. Check console:
```javascript
[Chat] 📚 Context used: 3 sources  // ← Should be > 0
[Chat] ✅ Streaming complete
```

---

## 📊 **Verification Checklist**

### **Upload Flow:**
- [ ] Upload receipt
- [ ] Console shows `indexed: true`
- [ ] Processing time < 60s
- [ ] No errors in console

### **Chat Flow:**
- [ ] Test RAG button shows "OK"
- [ ] Ask question about uploaded receipt
- [ ] Get accurate answer
- [ ] Console shows `sources > 0`

### **End-to-End:**
- [ ] Upload 3 receipts
- [ ] All indexed successfully
- [ ] Chat can answer about all 3
- [ ] Streaming works smoothly

---

## 🐛 **Troubleshooting**

### **Problem 1: `indexed: false`**

**Check:**
```bash
# Is RAG Service running?
curl http://172.16.1.9:8000/health
```

**Fix:**
```bash
# Restart RAG Service (on server)
ssh user@172.16.1.9
systemctl restart rag-service
```

---

### **Problem 2: Chat says "No data"**

**Check:**
```bash
# Are receipts in collection?
curl http://172.16.1.9:8000/collections

# Should show:
{
  "collections": [
    {"name": "receipts", "vectors_count": 123}
  ]
}
```

**Fix:**
- Re-upload receipts via Integration Service
- Wait 5 seconds after upload before querying

---

### **Problem 3: CORS Error**

**Error:**
```
Access to fetch at 'http://172.16.1.9:8005/...' blocked by CORS
```

**Fix (Backend):**
```python
# Add to Integration/RAG Service
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### **Problem 4: Streaming Not Working**

**Check console:**
```javascript
[Chat] 📡 Reading SSE stream...
// No tokens received
```

**Test manually:**
```bash
curl -N -X POST http://172.16.1.9:8000/query/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"question": "test", "collection_name": "receipts", "top_k": 5}'

# Should see:
data: {"token": "Hello "}
data: {"token": "world"}
```

---

## 📚 **Documentation**

| Document | Purpose |
|----------|---------|
| `DEPLOYMENT.md` | Full deployment guide with API docs |
| `ENV_TEMPLATE.md` | Environment variables reference |
| `QUICK_START.md` | This file - Quick setup |
| `BACKEND_INTEGRATION_ACTION_PLAN.md` | Implementation roadmap |

---

## 🎯 **Expected Behavior**

### **Upload:**
```
User uploads receipt
  → Integration Service processes (30s)
  → OCR extracts text
  → Vision analyzes image
  → RAG indexes data
  → Response: indexed: true ✅
```

### **Chat:**
```
User asks: "Berapa total belanja?"
  → RAG retrieves relevant receipts
  → LLM generates answer with context
  → Streams response in real-time
  → Answer: "Total belanja Rp 1.076.500" ✅
```

---

## 🚀 **Next Steps**

1. ✅ **Setup complete?** → Test upload + chat
2. ✅ **Working?** → Deploy to production
3. ❌ **Issues?** → Check [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting

---

## 📞 **Need Help?**

### **Quick Checks:**
```bash
# 1. Integration Service health
curl http://172.16.1.9:8005/health

# 2. RAG Service health
curl http://172.16.1.9:8000/health

# 3. Collections
curl http://172.16.1.9:8000/collections
```

### **Logs:**
```bash
# Frontend (browser console)
F12 → Console → Filter: [Integration API] or [Chat]

# Backend (SSH to server)
ssh user@172.16.1.9
tail -f /path/to/integration-service/logs/*.log
tail -f /path/to/rag-service/logs/*.log
```

---

**Last Updated:** October 29, 2025  
**Version:** 1.0.0  
**Status:** ✅ Ready to deploy
