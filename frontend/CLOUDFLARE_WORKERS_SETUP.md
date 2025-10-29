# 🚀 Cloudflare Workers Deployment with NextAuth

Complete guide to deploy Next.js app with Google OAuth to Cloudflare Workers.

---

## 📦 Prerequisites

✅ Cloudflare Workers subscription ($5/month)  
✅ Cloudflare account with Pages enabled  
✅ GitHub repository connected

---

## 🔧 Setup (Already Done)

These packages are already installed:

```bash
✅ @cloudflare/next-on-pages
✅ wrangler (Cloudflare CLI)
```

---

## 🎯 Deployment Steps

### Step 1: Login to Cloudflare

```bash
npx wrangler login
```

This will open browser to authenticate.

### Step 2: Build for Cloudflare

```bash
npm run pages:build
```

This creates optimized build in `.vercel/output/static`

### Step 3: Deploy

```bash
npm run pages:deploy
```

Or use Cloudflare Pages dashboard for automatic deployments.

---

## ⚙️ Cloudflare Pages Configuration

### Build Settings

Go to: Cloudflare Dashboard → Pages → Your Project → Settings → Builds

**Framework preset:** Next.js

**Build command:**
```bash
npx @cloudflare/next-on-pages
```

**Build output directory:**
```
.vercel/output/static
```

**Root directory:**
```
frontend
```

**Node version:**
```
20
```

**Environment variables (Build):**
```bash
NODE_VERSION=20
```

---

## 🔐 Environment Variables

Go to: Settings → Environment Variables

### Production Variables

```bash
# Google OAuth
GOOGLE_CLIENT_ID=87735297129-os7b4ci4vfgllnghqjljd3kg9eusag3r.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# NextAuth
NEXTAUTH_URL=https://notaku.pages.dev
NEXTAUTH_SECRET=a7f9d8c4b2e6a1f5d9c8b7a6e5d4c3b2a1f9e8d7c6b5a4e3d2c1b0a9f8e7d6c5

# API
NEXT_PUBLIC_API_URL=https://api.notaku.cloud
NEXT_PUBLIC_DEBUG=false

# Cloudflare
NODE_VERSION=20
```

**Important:**
- Set variables for **both** Production AND Preview environments
- Replace `notaku.pages.dev` with your actual Cloudflare Pages URL

---

## 🌐 Google OAuth Configuration

### Add Cloudflare URLs to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to: APIs & Services → Credentials
4. Click your OAuth 2.0 Client ID
5. Add these URLs:

**Authorized JavaScript origins:**
```
https://notaku.pages.dev
https://notaku.cloud
```

**Authorized redirect URIs:**
```
https://notaku.pages.dev/api/auth/callback/google
https://notaku.cloud/api/auth/callback/google
```

6. Click "Save"

---

## 🔄 Automatic Deployments

### Connect GitHub

1. Cloudflare Dashboard → Pages → Create a project
2. Connect to GitHub
3. Select repository: `Notaku-Frontend-Cloudflare`
4. Configure:
   - **Root directory:** `frontend`
   - **Build command:** `npx @cloudflare/next-on-pages`
   - **Build output:** `.vercel/output/static`

5. Click "Save and Deploy"

### Auto-Deploy on Push

- **Production:** Push to `main` branch → auto-deploys
- **Preview:** Push to other branches → preview deployments

---

## 🧪 Test Build Locally

Before deploying, test the Cloudflare Pages build:

```bash
# 1. Build
npm run build
npm run pages:build

# 2. Test locally
npm run pages:dev

# 3. Open http://localhost:8788
```

---

## ✅ Verify Deployment

### 1. Check Build Logs

Cloudflare Dashboard → Pages → Deployments → [Latest] → Build logs

Look for:
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

### 2. Test URLs

**Homepage:**
```
https://notaku.pages.dev
```

**Login:**
```
https://notaku.pages.dev/login
```

**API Health:**
```
https://notaku.pages.dev/api/auth/providers
```

Should return JSON with Google provider.

### 3. Test Google Sign-In

1. Go to `/login`
2. Click "Masuk dengan Google"
3. Select account
4. Should redirect to `/dashboard`

---

## 🐛 Troubleshooting

### Build fails: "next-on-pages requires..."

**Solution:**
```bash
# Ensure dependencies installed
npm install --legacy-peer-deps
```

### "NEXTAUTH_URL is not defined"

**Solution:**
Add `NEXTAUTH_URL` in Cloudflare Pages environment variables.

### "Redirect URI mismatch"

**Solution:**
Add Cloudflare Pages URL to Google OAuth redirect URIs:
```
https://your-project.pages.dev/api/auth/callback/google
```

### Session not persisting

**Solution:**
- Verify `NEXTAUTH_SECRET` is set
- Check browser cookies are enabled
- Ensure using HTTPS (not HTTP)

### Build cache issues

**Solution:**
```bash
# Clear cache in Cloudflare
Settings → Builds & deployments → Clear build cache
```

---

## 📊 Performance Optimization

### 1. Enable Caching

Headers are automatically configured by Cloudflare Pages.

### 2. Monitor Performance

Cloudflare Dashboard → Analytics → Web Analytics

### 3. Check Bundle Size

```bash
npm run build

# Check output:
Route (app)                                 Size  First Load JS
```

Keep bundles under 1MB for optimal performance.

---

## 🔗 Custom Domain Setup

### Add notaku.cloud Domain

1. Cloudflare Dashboard → Pages → Custom domains
2. Click "Set up a custom domain"
3. Enter: `notaku.cloud` or `app.notaku.cloud`
4. Follow DNS configuration:

```
Type: CNAME
Name: @ (or subdomain)
Target: notaku.pages.dev
Proxy: Yes (orange cloud)
```

5. Wait for DNS propagation (5-60 minutes)

### Update Environment Variables

After custom domain is active:

```bash
NEXTAUTH_URL=https://notaku.cloud
```

Redeploy after changing.

### Update Google OAuth

Add custom domain to Google Console redirect URIs:
```
https://notaku.cloud/api/auth/callback/google
```

---

## 🚨 Important Notes

### Compatibility Flags

`wrangler.toml` includes:
```toml
compatibility_flags = ["nodejs_compat"]
```

This enables Node.js compatibility needed for NextAuth.

### Cold Starts

First request after idle period may be slower (~500ms).  
Subsequent requests are fast (<50ms).

### Request Limits

Cloudflare Workers limits:
- **CPU time:** 50ms per request (Workers Paid: 50ms)
- **Memory:** 128MB
- **Requests:** Unlimited

NextAuth operations are within these limits.

---

## 📚 Package Scripts Reference

```bash
# Development
npm run dev                # Local Next.js dev server

# Build
npm run build             # Standard Next.js build
npm run pages:build       # Build for Cloudflare Pages

# Test Cloudflare locally
npm run pages:dev         # Test Cloudflare build locally

# Deploy
npm run pages:deploy      # Deploy to Cloudflare Workers

# Wrangler CLI
npx wrangler login        # Login to Cloudflare
npx wrangler pages deploy # Manual deploy
```

---

## 🎯 Deployment Checklist

Before going live:

- [ ] Cloudflare Workers subscription active
- [ ] GitHub repository connected
- [ ] Build command configured
- [ ] Environment variables set (Production + Preview)
- [ ] Google OAuth redirect URIs updated
- [ ] Custom domain configured (optional)
- [ ] Test login flow works
- [ ] Check all pages load correctly
- [ ] Monitor build logs for errors

---

## 📖 Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)

---

## 💡 Pro Tips

### 1. Preview Deployments

Every branch push creates a preview:
```
https://[branch].notaku.pages.dev
```

Perfect for testing before merging to main.

### 2. Rollback

If deployment has issues:
1. Go to Deployments
2. Find previous working deployment
3. Click "Rollback"

### 3. Monitor Logs

Check real-time logs:
```bash
npx wrangler pages deployment tail
```

### 4. Environment per Branch

Set different env vars for preview vs production branches.

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ Build completes without errors
2. ✅ Site loads at Cloudflare Pages URL
3. ✅ Google Sign-In works
4. ✅ User redirected to dashboard after login
5. ✅ All pages accessible
6. ✅ No console errors

---

## 🆘 Need Help?

1. Check build logs in Cloudflare Dashboard
2. Test locally with `npm run pages:dev`
3. Verify environment variables
4. Check Google OAuth configuration
5. Review error messages in browser console

---

## 🎉 Ready to Deploy!

Everything is configured. Just run:

```bash
npm run pages:deploy
```

Or push to GitHub for automatic deployment!

**Your Next.js app with Google OAuth will be live on Cloudflare Workers! 🚀**
