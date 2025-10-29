# Deployment with NextAuth (Google OAuth)

## ⚠️ Important Change

Since adding NextAuth for Google OAuth, this app now requires **server-side rendering (SSR)** and **API routes**, which means:

❌ **Cannot use Cloudflare Pages with static export**  
✅ **Must use a platform that supports Next.js SSR**

---

## Recommended: Deploy to Vercel

Vercel has native Next.js support including API routes and NextAuth.

### Step 1: Push to GitHub

```bash
git add -A
git commit -m "feat: configure for Vercel deployment"
git push origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Project"
3. Select your GitHub repository: `Notaku-Frontend-Cloudflare`
4. **Root Directory:** `frontend`
5. **Framework Preset:** Next.js
6. Click "Deploy"

### Step 3: Add Environment Variables

In Vercel dashboard → Settings → Environment Variables:

**Production:**
```bash
GOOGLE_CLIENT_ID=87735297129-os7b4ci4vfgllnghqjljd3kg9eusag3r.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=a7f9d8c4b2e6a1f5d9c8b7a6e5d4c3b2a1f9e8d7c6b5a4e3d2c1b0a9f8e7d6c5
NEXT_PUBLIC_API_URL=https://api.notaku.cloud
NEXT_PUBLIC_DEBUG=false
```

**Important:**  
- Set `NEXTAUTH_URL` to your actual Vercel URL after deployment
- Update Google OAuth redirect URI in Google Cloud Console

### Step 4: Update Google Cloud Console

Add Vercel URL to authorized redirect URIs:

```
https://your-app.vercel.app/api/auth/callback/google
```

### Step 5: Custom Domain (Optional)

1. Vercel dashboard → Settings → Domains
2. Add `notaku.cloud` or subdomain
3. Follow DNS configuration

---

## Alternative: Cloudflare Workers (Advanced)

To use Cloudflare with Next.js SSR, you need `@cloudflare/next-on-pages`:

### Requirements

```bash
npm install -D @cloudflare/next-on-pages
npm install -D wrangler
```

### Configuration

Update `package.json`:

```json
{
  "scripts": {
    "pages:build": "npx @cloudflare/next-on-pages",
    "pages:dev": "npx wrangler pages dev .vercel/output/static --compatibility-flag=nodejs_compat",
    "pages:deploy": "npm run pages:build && wrangler pages deploy .vercel/output/static"
  }
}
```

### Build Command (Cloudflare Pages)

```bash
npx @cloudflare/next-on-pages
```

### Output Directory

```
.vercel/output/static
```

**Note:** This is complex and experimental. Vercel is recommended.

---

## Environment Variables Reference

### Required for NextAuth

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | `87735...googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | `GOCSPX-...` |
| `NEXTAUTH_URL` | Your app URL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Random 32+ char string | Generated randomly |

### Required for App

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.notaku.cloud` |
| `NEXT_PUBLIC_DEBUG` | Enable debug logs | `false` |

---

## Google OAuth Setup

### Development

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
```

### Production

**Authorized redirect URIs:**
```
https://your-app.vercel.app/api/auth/callback/google
https://notaku.cloud/api/auth/callback/google
```

**Authorized JavaScript origins:**
```
https://your-app.vercel.app
https://notaku.cloud
```

---

## Testing Deployment

### 1. Check Build Logs

Monitor Vercel deployment logs for errors.

### 2. Test Authentication

1. Go to your deployed URL `/login`
2. Click "Masuk dengan Google"
3. Select Google account
4. Should redirect to `/dashboard`

### 3. Check API Routes

```bash
curl https://your-app.vercel.app/api/auth/providers
```

Should return:
```json
{
  "google": {
    "id": "google",
    "name": "Google",
    "type": "oauth",
    "signinUrl": "...",
    "callbackUrl": "..."
  }
}
```

---

## Troubleshooting

### Build fails with "output export"

**Error:**
```
Error: Page "/api/auth/[...nextauth]" is incompatible with "output: export"
```

**Solution:**
Ensure `next.config.ts` does NOT have `output: 'export'` ✅ (Fixed)

### "Redirect URI mismatch"

**Solution:**
Add deployment URL to Google Cloud Console authorized redirect URIs.

### "NEXTAUTH_URL is not defined"

**Solution:**
Add `NEXTAUTH_URL` to environment variables in deployment platform.

### Session not persisting

**Solution:**
- Check `NEXTAUTH_SECRET` is set
- Verify cookies are allowed in browser
- Ensure HTTPS in production

---

## Migration from Cloudflare Pages

If you were using Cloudflare Pages before:

### Option 1: Switch to Vercel (Recommended)

1. Deploy to Vercel (steps above)
2. Update DNS to point to Vercel
3. Keep Cloudflare as DNS provider only

### Option 2: Use Cloudflare Workers

1. Install `@cloudflare/next-on-pages`
2. Update build command
3. Deploy as Cloudflare Worker

---

## Summary

| Platform | Static Export | SSR | API Routes | NextAuth | Difficulty |
|----------|--------------|-----|------------|----------|-----------|
| **Vercel** | No | ✅ | ✅ | ✅ | ⭐ Easy |
| **Cloudflare Pages (static)** | Yes | ❌ | ❌ | ❌ | - |
| **Cloudflare Workers** | No | ✅ | ✅ | ✅ | ⭐⭐⭐ Complex |

**Recommendation:** Use Vercel for easiest deployment with full NextAuth support.

---

## Quick Deploy to Vercel

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project or create new
# - Root directory: frontend
# - Build command: npm run build
# - Output directory: .next
```

Then add environment variables in Vercel dashboard.

---

## Resources

- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
- [Cloudflare Next-on-Pages](https://github.com/cloudflare/next-on-pages)
