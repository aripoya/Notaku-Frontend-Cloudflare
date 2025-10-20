# Environment Variables Template

Copy this content to create your `.env.development` file.

## Development Environment

Create file: `.env.development`

```bash
# API Server (FastAPI)
VITE_API_URL=https://api.notaku.cloud

# Workflows (n8n)
VITE_WORKFLOWS_URL=https://workflows.notaku.cloud

# Storage (MinIO)
VITE_STORAGE_URL=https://storage.notaku.cloud

# Optional: Debug Mode
VITE_DEBUG=true
```

## Production Environment

Create file: `.env.production`

```bash
# API Server (FastAPI)
VITE_API_URL=https://api.notaku.cloud

# Workflows (n8n)
VITE_WORKFLOWS_URL=https://workflows.notaku.cloud

# Storage (MinIO)
VITE_STORAGE_URL=https://storage.notaku.cloud

# Debug Mode (disabled in production)
VITE_DEBUG=false
```

## Local Backend (Optional)

If running backend locally without Cloudflare Tunnel:

```bash
# API Server (local)
VITE_API_URL=http://localhost:8000

# Workflows (local)
VITE_WORKFLOWS_URL=http://localhost:5678

# Storage (local)
VITE_STORAGE_URL=http://localhost:9001

# Debug Mode
VITE_DEBUG=true
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
VITE_API_URL=https://api.notaku.cloud

# Workflows (n8n)
VITE_WORKFLOWS_URL=https://workflows.notaku.cloud

# Storage (MinIO)
VITE_STORAGE_URL=https://storage.notaku.cloud

# Debug Mode
VITE_DEBUG=true
EOF

# Verify file created
cat .env.development
```

## Verify Environment Variables

After creating the file, restart dev server and check:

```javascript
// In browser console
console.log('API URL:', import.meta.env.VITE_API_URL);
// Should output: https://api.notaku.cloud
```
