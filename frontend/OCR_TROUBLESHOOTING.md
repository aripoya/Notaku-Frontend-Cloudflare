# OCR Service Troubleshooting Guide

## Current Issue: Jobs Stuck in Queue

### Problem
- Jobs stay in "queued" status forever
- Never progress to "started" or "finished"
- Health check shows: `"workers": 0`

### Root Cause
**OCR Worker process is not running!**

```json
{
  "status": "unhealthy",
  "redis": "ok",
  "workers": 0,        ← NO WORKERS!
  "queue_size": 3,     ← JOBS STUCK
  "timestamp": "2025-10-24T06:08:20.031295"
}
```

---

## Solution: Start OCR Workers

### Option 1: Check Backend Server

The OCR backend should automatically start workers. Check if the backend is running properly:

```bash
# Check if OCR backend is running
curl http://172.16.1.7:8001/health

# Expected healthy response:
{
  "status": "healthy",
  "redis": "ok",
  "workers": 15,       ← Should have workers!
  "queue_size": 0,
  "timestamp": "..."
}
```

### Option 2: Restart OCR Backend

If workers are not running, restart the OCR backend service:

```bash
# Navigate to OCR backend directory
cd /path/to/ocr-backend

# Stop existing process
pkill -f "uvicorn"

# Start with workers
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 4
```

### Option 3: Start Workers Manually (if separate)

If workers run separately from the API:

```bash
# Navigate to OCR backend directory
cd /path/to/ocr-backend

# Start RQ workers
rq worker ocr-queue --url redis://localhost:6379
```

---

## Frontend Improvements

### 1. Added Timeout Protection

**File:** `src/lib/ocr-api.ts`

```typescript
static async pollStatus(
  jobId: string,
  onUpdate?: (status: JobStatus) => void,
  interval: number = 500,
  maxAttempts: number = 120 // 60 seconds timeout
): Promise<JobStatus>
```

**Behavior:**
- Polls every 500ms
- Max 120 attempts (60 seconds)
- Shows warning if queued > 10 seconds
- Throws timeout error after 60 seconds

### 2. Better Error Messages

**Before:**
```
[Infinite loading...]
```

**After:**
```
Error: OCR processing timeout. The job is taking too long. 
Please try again or contact support.
```

---

## Health Check Interpretation

### Healthy Status
```json
{
  "status": "healthy",
  "redis": "ok",
  "workers": 15,      ✅ Workers running
  "queue_size": 0,    ✅ No backlog
  "timestamp": "..."
}
```

### Unhealthy Status
```json
{
  "status": "unhealthy",
  "redis": "ok",
  "workers": 0,       ❌ No workers!
  "queue_size": 3,    ⚠️ Jobs stuck
  "timestamp": "..."
}
```

### What Each Field Means

- **status**: Overall health ("healthy" or "unhealthy")
- **redis**: Redis connection status ("ok" or "error")
- **workers**: Number of active worker processes
- **queue_size**: Number of jobs waiting in queue
- **timestamp**: Current server time

---

## Common Issues & Solutions

### Issue 1: Workers = 0

**Symptoms:**
- Jobs stuck in "queued"
- Never progress
- Timeout after 60 seconds

**Solution:**
```bash
# Restart OCR backend with workers
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 4
```

### Issue 2: High Queue Size

**Symptoms:**
- `queue_size` > 10
- Slow processing
- Workers exist but overwhelmed

**Solution:**
```bash
# Increase worker count
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 8

# Or start additional workers
rq worker ocr-queue --url redis://localhost:6379 &
rq worker ocr-queue --url redis://localhost:6379 &
```

### Issue 3: Redis Connection Error

**Symptoms:**
- `"redis": "error"`
- Cannot queue jobs

**Solution:**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running, start Redis
redis-server

# Or on macOS with Homebrew
brew services start redis
```

### Issue 4: Timeout Errors

**Symptoms:**
- "OCR processing timeout" error
- Jobs take > 60 seconds

**Solutions:**
1. **Increase timeout:**
   ```typescript
   // In upload page
   await OCRApiClient.pollStatus(
     uploadResult.job_id,
     onUpdate,
     1000,  // interval
     180    // 3 minutes timeout
   );
   ```

2. **Check worker performance:**
   - Workers might be slow
   - Increase worker count
   - Check server resources (CPU, RAM)

---

## Monitoring

### Check Health Periodically

```bash
# Watch health status
watch -n 2 'curl -s http://172.16.1.7:8001/health | jq'
```

### Check Queue in Redis

```bash
# Connect to Redis
redis-cli

# Check queue length
LLEN rq:queue:ocr-queue

# View queued jobs
LRANGE rq:queue:ocr-queue 0 -1
```

### Check Worker Logs

```bash
# If using systemd
journalctl -u ocr-worker -f

# If running manually
tail -f /path/to/worker.log
```

---

## Prevention

### 1. Auto-restart Workers

Use a process manager like `systemd` or `supervisor`:

**systemd example:**
```ini
[Unit]
Description=OCR Worker
After=network.target redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/ocr-backend
ExecStart=/usr/bin/rq worker ocr-queue
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 2. Health Check Monitoring

Add monitoring to alert when workers = 0:

```typescript
// In OcrStatusIndicator component
useEffect(() => {
  const checkHealth = async () => {
    const health = await OCRApiClient.healthCheck();
    if (health.workers === 0) {
      console.error('⚠️ OCR workers are down!');
      // Send alert to admin
    }
  };
  
  const interval = setInterval(checkHealth, 30000);
  return () => clearInterval(interval);
}, []);
```

### 3. Graceful Degradation

Show user-friendly message when workers are down:

```typescript
if (health.workers === 0) {
  toast.error('OCR service is currently unavailable', {
    description: 'Please try again in a few minutes or contact support.'
  });
}
```

---

## Quick Fix Checklist

When jobs are stuck:

- [ ] Check health: `curl http://172.16.1.7:8001/health`
- [ ] Verify workers > 0
- [ ] Check Redis: `redis-cli ping`
- [ ] Restart backend if needed
- [ ] Clear stuck jobs in Redis (if necessary)
- [ ] Test with new upload

---

## Contact Backend Team

If issue persists, provide this info:

1. Health check output
2. Queue size
3. Worker count
4. Error logs
5. Job ID that's stuck
6. Time when issue started

**Example report:**
```
Issue: Jobs stuck in queue
Health: {"workers": 0, "queue_size": 3}
Job ID: 50dacc65-28f5-4755-a202-a01996c47b43
Status: "queued" for 5+ minutes
Time: 2025-10-24 06:05 UTC
```

---

## Summary

✅ **Frontend fixes applied:**
- Added 60-second timeout
- Better error messages
- Warning for long queues

❌ **Backend issue (needs fixing):**
- **Workers not running** (workers: 0)
- Need to restart OCR backend
- Or start worker processes manually

**Next step: Contact backend team to restart OCR workers!** 🚀
