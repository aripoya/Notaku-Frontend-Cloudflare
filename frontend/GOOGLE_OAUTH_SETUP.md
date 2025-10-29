# 🔐 Google OAuth Setup Guide

## Prerequisites

You need Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/).

## Step 1: Create `.env.local` File

Create a file named `.env.local` in the `frontend` directory with the following contents:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=87735297129-os7b4ci4vfgllnghqjljd3kg9eusag3r.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# NextAuth Configuration
NEXTAUTH_URL=https://notaku.cloud
NEXTAUTH_SECRET=a7f9d8c4b2e6a1f5d9c8b7a6e5d4c3b2a1f9e8d7c6b5a4e3d2c1b0a9f8e7d6c5

# API Configuration (existing)
NEXT_PUBLIC_API_URL=https://api.notaku.cloud
NEXT_PUBLIC_DEBUG=true
```

## Step 2: Restart Development Server

After creating `.env.local`, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 3: Test Google Sign-In

1. Go to http://localhost:3000/login
2. Click the "Masuk dengan Google" button
3. Select your Google account
4. You should be redirected to the dashboard

## 🎨 UI Features

The Google Sign-In button includes:
- ✅ Official Google logo with brand colors
- ✅ Loading spinner during authentication
- ✅ Disabled state while processing
- ✅ Error handling with toast notifications
- ✅ Success feedback

## 🔧 Technical Details

### NextAuth Configuration

**File:** `src/app/api/auth/[...nextauth]/route.ts`

- Uses Google OAuth 2.0 provider
- JWT session strategy
- Custom callbacks for user management
- Integrates with existing localStorage user system

### Session Provider

**File:** `src/app/providers.tsx`

The app is wrapped with `SessionProvider` to enable NextAuth throughout the application.

### Login Integration

**File:** `src/app/(auth)/login/page.tsx`

Two authentication methods available:
1. **Email/Password** - Existing mock authentication
2. **Google Sign-In** - New OAuth flow

Both methods redirect to `/dashboard` on success.

## 🌐 Production Deployment

For production (https://notaku.cloud), ensure:

1. **Authorized redirect URIs** in Google Cloud Console:
   ```
   https://notaku.cloud/api/auth/callback/google
   ```

2. **Authorized JavaScript origins**:
   ```
   https://notaku.cloud
   ```

3. Update `NEXTAUTH_URL` in production environment:
   ```bash
   NEXTAUTH_URL=https://notaku.cloud
   ```

## 🔐 Security Notes

- ✅ Client secrets stored in `.env.local` (gitignored)
- ✅ JWT sessions with secure cookies
- ✅ HTTPS required for production
- ✅ Session expiry handled automatically
- ✅ CSRF protection enabled by NextAuth

## 🐛 Troubleshooting

### Issue: "Redirect URI mismatch"
**Solution:** Add the callback URL to Google Cloud Console:
```
http://localhost:3000/api/auth/callback/google
```

### Issue: "Invalid client"
**Solution:** Double-check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`

### Issue: Not redirecting after login
**Solution:** Check browser console for errors and ensure `NEXTAUTH_URL` matches your current URL

## 📚 Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

## ✅ Current Status

- ✅ Google OAuth configured
- ✅ Login page updated with Google button
- ✅ SessionProvider integrated
- ✅ Callbacks configured
- ✅ Error handling implemented
- ✅ Loading states added

**Ready to use!** Just create the `.env.local` file and restart the server.
