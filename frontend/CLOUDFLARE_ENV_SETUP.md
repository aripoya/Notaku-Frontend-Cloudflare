# Cloudflare Pages Environment Variables Setup

## Critical Issue: Mixed Content Error

**Error**: "Mixed Content: The page at 'https://www.notaku.cloud/dashboard/upload' was loaded over HTTPS, but requested an insecure resource 'http://api.notaku.cloud/api/v1/receipts/'"

**Root Cause**: Environment variable `NEXT_PUBLIC_API_URL` is not set in Cloudflare Pages deployment, causing the app to use HTTP instead of HTTPS for API calls.

## Solution: Set Environment Variables in Cloudflare Pages

### Step 1: Access Cloudflare Pages Dashboard

1. Go to https://dash.cloudflare.com/
2. Select your account
3. Click on **Pages** in the left sidebar
4. Select your project: **notaku-frontend** (or whatever your project name is)
5. Go to **Settings** tab
6. Click on **Environment variables**

### Step 2: Add Required Environment Variables

Add the following environment variables for **Production**:

#### Required Variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://api.notaku.cloud` | Production |
| `NEXTAUTH_URL` | `https://www.notaku.cloud` | Production |
| `NEXTAUTH_SECRET` | `0DA9IqPiwglfWkGsjGpv7g+zvYFmJx+fYcGzG0J1k0I=` | Production |
| `GOOGLE_CLIENT_ID` | `87735297129-os7b4ci4vfgllnghqjljd3kg9eusag3r.apps.googleusercontent.com` | Production |
| `GOOGLE_CLIENT_SECRET` | `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` | Production |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `87735297129-os7b4ci4vfgllnghqjljd3kg9eusag3r.apps.googleusercontent.com` | Production |

#### Optional Variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_DEBUG` | `false` | Production |
| `NODE_ENV` | `production` | Production |

### Step 3: Configure for Preview/Development (Optional)

For **Preview** deployments (branch previews):

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://api.notaku.cloud` | Preview |
| `NEXTAUTH_URL` | `https://preview.notaku.cloud` | Preview |
| `NEXT_PUBLIC_DEBUG` | `true` | Preview |

### Step 4: Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click **View details** on the latest deployment
3. Click **Retry deployment** button
4. Wait for the build to complete

**OR** trigger a new deployment:
```bash
git commit --allow-empty -m "Trigger redeploy for env vars"
git push origin main
```

### Step 5: Verify

1. Visit https://www.notaku.cloud/dashboard/upload
2. Open Browser DevTools → Console
3. Upload a receipt and click save
4. Check Network tab:
   - Request URL should be: `https://api.notaku.cloud/api/v1/receipts` (HTTPS ✅)
   - NOT: `http://api.notaku.cloud/api/v1/receipts` (HTTP ❌)

## Verification Commands

Check if environment variable is loaded correctly:

```javascript
// In browser console:
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

Or check the built code:
```bash
# In your deployment
cat .next/static/chunks/*.js | grep -o "https://api.notaku.cloud" | head -1
```

## Common Issues

### Issue 1: Changes Not Applied
**Symptom**: Still seeing HTTP requests after setting env vars  
**Solution**: 
- Make sure to select correct environment (Production vs Preview)
- Trigger a fresh deployment (not just retry)
- Clear browser cache

### Issue 2: Mixed Content Still Occurring
**Symptom**: Some requests use HTTPS, others use HTTP  
**Solution**:
- Check for hardcoded URLs in code
- Verify all API calls use `API_BASE_URL` from config
- Check browser console for specific failing URLs

### Issue 3: Environment Variable Not Found
**Symptom**: `undefined` when checking env var  
**Solution**:
- Ensure variable name starts with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding variables
- Check Cloudflare build logs for errors

## Next.js Environment Variable Rules

### Client-Side Variables (Browser)
- **MUST** start with `NEXT_PUBLIC_`
- Example: `NEXT_PUBLIC_API_URL`
- Accessible in browser: ✅
- Accessible in server: ✅

### Server-Side Only Variables
- No `NEXT_PUBLIC_` prefix
- Example: `GOOGLE_CLIENT_SECRET`
- Accessible in browser: ❌
- Accessible in server (API routes): ✅

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `.env.local` or `.env.production` to git
- These files contain secrets and should be in `.gitignore`
- Only commit `env.example` with placeholder values
- Set actual values in Cloudflare Pages dashboard

## Alternative: Use Cloudflare Pages CI/CD

If you prefer automation, you can use Cloudflare Pages API:

```bash
# Using Wrangler CLI
wrangler pages project create notaku-frontend

# Set environment variable
wrangler pages deployment create \
  --project-name=notaku-frontend \
  --branch=main \
  --env-var NEXT_PUBLIC_API_URL=https://api.notaku.cloud
```

## Monitoring

After deploying with correct env vars, monitor:

1. **Mixed Content Errors**: Should be 0
2. **API Request Success Rate**: Should increase
3. **Console Errors**: Check for CORS or network errors
4. **Network Tab**: All API calls should use HTTPS

## Rollback

If environment variable changes cause issues:

1. Go to Cloudflare Pages → Settings → Environment variables
2. Edit the problematic variable
3. Revert to previous value
4. Redeploy

## Contact

For Cloudflare Pages issues:
- Documentation: https://developers.cloudflare.com/pages/
- Support: https://community.cloudflare.com/

For app-specific issues:
- Check browser console logs
- Check Cloudflare Pages build logs
- Review network requests in DevTools
