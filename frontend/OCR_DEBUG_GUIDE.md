# OCR Debug Guide - Troubleshooting Upload Issues

## Common Issues

### Issue 1: QuotaExceededError - localStorage Full

**Error Message:**
```
QuotaExceededError: Failed to execute 'setItem' on 'Storage': 
Setting the value of 'notaku_receipts' exceeded the quota.
```

**Root Cause:**
- localStorage limit: ~5-10MB per domain
- Each receipt with base64 image: ~100-500KB
- After 10-50 receipts with images: quota exceeded
- **Current issue**: Fallback to localStorage is saving base64 images

**Solution 1: Clear localStorage (Quick Fix)**

Open browser console and run:
```javascript
// Check current usage
function getStorageSize() {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += new Blob([localStorage.getItem(key)]).size;
    }
  }
  return (total / 1024).toFixed(2) + ' KB';
}

console.log('Storage size:', getStorageSize());

// Clear receipts
localStorage.removeItem('notaku_receipts');
console.log('Receipts cleared!');
console.log('New size:', getStorageSize());
```

**Solution 2: Remove Images from Receipts**

```javascript
// Keep receipts but remove base64 images
const receipts = JSON.parse(localStorage.getItem('notaku_receipts') || '[]');
const cleaned = receipts.map(r => {
  const { image_base64, ...rest } = r;
  return rest;
});
localStorage.setItem('notaku_receipts', JSON.stringify(cleaned));
console.log('Cleaned', receipts.length, 'receipts');
```

**Solution 3: Backend is Now Primary (Permanent Fix)**

The app now saves to backend first, localStorage only as fallback. Since your backend is working:
1. Receipts should save to database ✅
2. localStorage fallback removed to prevent quota issues ✅
3. Images stored in backend, not in browser ✅

**After Fix:**
- Redeploy with latest code
- Clear localStorage once
- All future receipts save to backend only

---

### Issue 2: OCR Not Working / Not Processing

**Symptoms:**
- Upload button does nothing
- Processing stuck at 0%
- No OCR results returned
- Timeout errors

**Debug Steps:**

#### Step 1: Check OCR Service URL

```javascript
// In browser console:
console.log('Integration URL:', 'https://upload.notaku.cloud');
```

**Expected**: Should show `https://upload.notaku.cloud`

**If showing localhost or old IP**: Environment variable not loaded, need rebuild

#### Step 2: Test OCR Service Directly

```bash
# From server
curl https://upload.notaku.cloud/health

# Expected response:
# {"status":"ok","workers":4,...}
```

**If fails**: OCR service is down or URL is wrong

#### Step 3: Check Network Tab

1. Open DevTools → Network
2. Upload a receipt
3. Look for request to: `https://upload.notaku.cloud/api/v1/receipt/process`
4. Check:
   - Status: Should be 200 OK
   - Response time: ~15-30 seconds (synchronous processing)
   - Response body: Should have `receipt_id`, `results`, `indexed`

**Common Network Issues:**

| Status | Meaning | Fix |
|--------|---------|-----|
| 0 (cancelled) | CORS or connection failed | Check service is running |
| 404 | Endpoint not found | Check URL is correct |
| 500 | Server error | Check backend logs |
| 502/504 | Gateway timeout | Processing takes too long or service down |

#### Step 4: Check Console Logs

Look for these logs:
```javascript
[Upload] 🚀 Starting upload process
[Upload] Using provider: paddle (standard)
[Upload] File size after compression: 245KB
[Upload] ⚡ Using Integration Service (SYNCHRONOUS)
[Upload] ✅ Receipt processed successfully
[Upload] Receipt ID: receipt_1234567
[Upload] Indexed in RAG: true
```

**If missing logs**: JavaScript error or function not being called

#### Step 5: Check Integration Service Health

```bash
# SSH to server
ssh your-server

# Check if service is running
docker ps | grep integration
# or
pm2 list | grep integration
# or
systemctl status notaku-integration

# Check logs
docker logs notaku-integration-service
# or
pm2 logs integration
# or
journalctl -u notaku-integration -f
```

---

### Issue 3: OCR Returns Empty Results

**Symptoms:**
- OCR completes but merchant/total/items are empty
- Form shows "Unknown" for merchant
- Total amount is 0

**Debug:**

```javascript
// In browser console after upload:
console.log('[Upload] Results object:', response.results);
console.log('Merchant:', response.results?.merchant);
console.log('Total:', response.results?.total);
console.log('Items:', response.results?.items);
```

**Common causes:**

1. **Poor image quality**
   - Blurry photo
   - Low lighting
   - Receipt text too small
   - Solution: Use better quality image

2. **OCR confidence too low**
   - Check: `response.results?.quality_score`
   - If < 0.5: OCR couldn't read text clearly
   - Solution: Retry with better image

3. **Backend parsing failed**
   - OCR worked but structure extraction failed
   - Check backend logs for parsing errors
   - May need to improve regex patterns

---

### Issue 4: Cloudflare Tunnel Issues

**Symptoms:**
- Can't reach `upload.notaku.cloud`
- Connection refused
- DNS resolution fails

**Check Cloudflare Tunnel:**

```bash
# On server where tunnel runs
cloudflared tunnel list

# Check tunnel status
cloudflared tunnel info notaku-upload

# Check tunnel logs
journalctl -u cloudflared@notaku-upload -f
```

**Restart Tunnel:**
```bash
sudo systemctl restart cloudflared@notaku-upload
```

---

## Environment Variables Check

Ensure these are set correctly:

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=https://api.notaku.cloud
NEXT_PUBLIC_INTEGRATION_URL=https://upload.notaku.cloud  # Optional, has default
```

**After changing env vars:**
```bash
cd /data/workspace/notaku-frontend/frontend
rm -rf .next
npm run build
pm2 restart notaku-frontend
```

---

## Complete Troubleshooting Checklist

- [ ] Backend API is accessible (https://api.notaku.cloud)
- [ ] Integration service is accessible (https://upload.notaku.cloud)
- [ ] Environment variables are correct
- [ ] Application rebuilt after env changes
- [ ] localStorage quota not exceeded
- [ ] Browser console shows no errors
- [ ] Network tab shows 200 OK responses
- [ ] OCR response has `receipt_id` and `results`
- [ ] Results contain merchant, total, items
- [ ] No CORS errors
- [ ] Cloudflare tunnel is running

---

## Quick Fixes Summary

### Fix localStorage Quota:
```javascript
localStorage.removeItem('notaku_receipts');
```

### Fix OCR Not Working:
```bash
# 1. Check service
curl https://upload.notaku.cloud/health

# 2. Restart service (if needed)
docker restart notaku-integration-service

# 3. Check tunnel
sudo systemctl status cloudflared@notaku-upload
```

### Fix Backend Save:
```bash
# Check backend is accessible
curl https://api.notaku.cloud/health

# Check logs
docker logs notaku-backend
```

---

## Monitoring Commands

### Real-time Monitoring:

```bash
# Frontend logs
pm2 logs notaku-frontend --lines 100

# Backend logs
docker logs -f notaku-backend

# Integration service logs
docker logs -f notaku-integration-service

# Cloudflare tunnel logs
journalctl -u cloudflared@notaku-upload -f

# All together (multiple terminals)
tmux
# Split panes and run each log command
```

### Check Endpoint Health:

```bash
# Frontend
curl https://www.notaku.cloud

# Backend API
curl https://api.notaku.cloud/health

# OCR Integration
curl https://upload.notaku.cloud/health
```

---

## Contact / Escalation

If all else fails:

1. **Collect logs:**
```bash
pm2 logs notaku-frontend > frontend.log
docker logs notaku-backend > backend.log
docker logs notaku-integration-service > integration.log
journalctl -u cloudflared@notaku-upload > tunnel.log
```

2. **Browser info:**
   - Network tab export (HAR file)
   - Console logs screenshot
   - Error messages

3. **Test with minimal example:**
```bash
# Minimal OCR test
curl -X POST https://upload.notaku.cloud/api/v1/receipt/process \
  -F "file=@test-receipt.jpg" \
  -F "user_id=test-user"
```

4. **Check system resources:**
```bash
df -h          # Disk space
free -h        # Memory
docker stats   # Container resources
```
