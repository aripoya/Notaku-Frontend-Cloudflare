# Cloudflare Pages Deployment Guide

## Overview

This Next.js application is configured for deployment on Cloudflare Pages using static export.

## Configuration

### next.config.ts

```typescript
const nextConfig: NextConfig = {
  output: 'export', // Static export for Cloudflare Pages
  images: {
    unoptimized: true, // Required for static export
  },
};
```

### Build Settings

**Build command:**
```bash
npm ci && npm run build
```

**Build output directory:**
```
out
```

**Root directory:**
```
frontend
```

## Environment Variables

Set these in Cloudflare Pages dashboard:

### Required Variables

```bash
NEXT_PUBLIC_OCR_API_URL=http://172.16.1.7:8001
NEXT_PUBLIC_API_URL=http://your-backend-url.com
```

### Optional Variables

```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://...
```

## Deployment Steps

### 1. Connect Repository

1. Go to Cloudflare Pages dashboard
2. Click "Create a project"
3. Connect your GitHub repository
4. Select `Notaku-Frontend-Cloudflare`

### 2. Configure Build Settings

**Framework preset:** Next.js (Static HTML Export)

**Build command:**
```bash
npm ci && npm run build
```

**Build output directory:**
```
out
```

**Root directory:**
```
frontend
```

**Node version:**
```
22.16.0
```

### 3. Set Environment Variables

In Cloudflare Pages → Settings → Environment variables:

**Production:**
```
NEXT_PUBLIC_OCR_API_URL=http://172.16.1.7:8001
NEXT_PUBLIC_API_URL=https://api.yourbackend.com
```

**Preview (optional):**
```
NEXT_PUBLIC_OCR_API_URL=http://172.16.1.7:8001
NEXT_PUBLIC_API_URL=https://staging-api.yourbackend.com
```

### 4. Deploy

Click "Save and Deploy"

## Important Notes

### Static Export Limitations

With `output: 'export'`, the following Next.js features are **NOT available**:

❌ **Server-side rendering (SSR)**
- No `getServerSideProps`
- No API routes (`pages/api/*`)
- No middleware rewrites

❌ **Dynamic routes with `getStaticPaths`**
- Must pre-render all paths at build time

❌ **Image Optimization**
- Must use `unoptimized: true`

✅ **What WORKS:**
- Static pages
- Client-side routing
- Client-side data fetching
- Static assets
- CSS/Tailwind

### API Calls

Since we can't use Next.js rewrites with static export, all API calls must use full URLs:

**Before (with rewrites):**
```typescript
fetch('/api/ocr/upload') // Proxied to backend
```

**After (static export):**
```typescript
const OCR_BASE_URL = process.env.NEXT_PUBLIC_OCR_API_URL;
fetch(`${OCR_BASE_URL}/api/v1/ocr/upload`) // Direct URL
```

### CORS Configuration

Backend must allow CORS from Cloudflare Pages domain:

```python
# Backend CORS settings
ALLOWED_ORIGINS = [
    "https://your-app.pages.dev",
    "http://localhost:3000",  # For local dev
]
```

## Build Process

### Local Build Test

Test static export locally:

```bash
# Build
npm run build

# Serve locally (install serve if needed)
npx serve@latest out

# Open http://localhost:3000
```

### Build Output

After `npm run build`, you should see:

```
Route (app)                                 Size  First Load JS
┌ ○ /                                      193 B         152 kB
├ ○ /_not-found                            997 B         103 kB
├ ○ /dashboard                           4.06 kB         224 kB
└ ○ /dashboard/upload                     9.6 kB         133 kB

○  (Static)  prerendered as static content
```

All routes should show `○ (Static)`.

## Troubleshooting

### Error: "Output directory not found"

**Cause:** `output: 'export'` not set in `next.config.ts`

**Solution:**
```typescript
const nextConfig: NextConfig = {
  output: 'export', // Add this
};
```

### Error: "Image Optimization not compatible"

**Cause:** Using Next.js Image component without `unoptimized`

**Solution:**
```typescript
const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Add this
  },
};
```

### Error: "API routes not supported"

**Cause:** Using `pages/api/*` with static export

**Solution:** Remove API routes, use external API

### CORS Errors

**Cause:** Backend not allowing Cloudflare Pages domain

**Solution:** Add domain to backend CORS whitelist:
```python
ALLOWED_ORIGINS = [
    "https://your-app.pages.dev",
]
```

### Build Cache Warning

**Warning:** "No build cache found"

**Solution:** Configure in Cloudflare Pages:
- Settings → Builds & deployments
- Enable "Build cache"

## Performance Optimization

### 1. Enable Cloudflare CDN

Cloudflare Pages automatically serves from CDN.

### 2. Configure Headers

Create `public/_headers`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Cache-Control: public, max-age=31536000, immutable

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/images/*
  Cache-Control: public, max-age=31536000, immutable
```

### 3. Configure Redirects

Create `public/_redirects`:

```
# Redirect old URLs
/old-path  /new-path  301

# SPA fallback (if needed)
/*  /index.html  200
```

## Monitoring

### Build Logs

View in Cloudflare Pages → Deployments → [deployment] → Build logs

### Analytics

Enable in Cloudflare Pages → Analytics

### Error Tracking

Consider adding Sentry:

```bash
npm install @sentry/nextjs
```

## Custom Domain

### Add Custom Domain

1. Go to Cloudflare Pages → Custom domains
2. Click "Set up a custom domain"
3. Enter your domain (e.g., `app.yourdomain.com`)
4. Follow DNS configuration steps

### SSL/TLS

Cloudflare automatically provisions SSL certificates.

## Deployment Workflow

### Automatic Deployments

**Production:**
- Push to `main` branch
- Cloudflare automatically builds and deploys

**Preview:**
- Push to any other branch
- Cloudflare creates preview deployment
- URL: `https://[branch].[project].pages.dev`

### Manual Deployments

1. Go to Cloudflare Pages → Deployments
2. Click "Create deployment"
3. Select branch
4. Click "Deploy"

## Rollback

### Rollback to Previous Deployment

1. Go to Cloudflare Pages → Deployments
2. Find previous successful deployment
3. Click "..." → "Rollback to this deployment"

## Best Practices

### 1. Environment Variables

- ✅ Use `NEXT_PUBLIC_` prefix for client-side variables
- ✅ Never commit secrets to git
- ✅ Set different values for production/preview

### 2. Build Optimization

- ✅ Minimize bundle size
- ✅ Use dynamic imports for large components
- ✅ Optimize images before upload

### 3. Testing

- ✅ Test static export locally before deploying
- ✅ Test preview deployments before merging to main
- ✅ Monitor build times and bundle sizes

### 4. Security

- ✅ Configure CSP headers
- ✅ Enable HTTPS only
- ✅ Use environment variables for API URLs

## Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Cloudflare Pages Framework Guides](https://developers.cloudflare.com/pages/framework-guides/)

## Support

For issues:
1. Check build logs in Cloudflare dashboard
2. Test static export locally
3. Review Next.js static export documentation
4. Contact Cloudflare support

---

## Quick Reference

**Build Command:**
```bash
npm ci && npm run build
```

**Output Directory:**
```
out
```

**Environment Variables:**
```bash
NEXT_PUBLIC_OCR_API_URL=http://172.16.1.7:8001
NEXT_PUBLIC_API_URL=https://api.yourbackend.com
```

**Test Locally:**
```bash
npm run build && npx serve@latest out
```

**Deploy:**
```bash
git push origin main
```
