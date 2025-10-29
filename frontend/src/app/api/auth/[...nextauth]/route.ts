import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.notaku.cloud';

// ⚠️ NextAuth requires Node.js runtime (not Edge) because it uses:
// - crypto module
// - http/https modules  
// - Other Node.js APIs
// 
// This means:
// ✅ Works on: Vercel, Railway, Render, fly.io
// ❌ Limited on: Cloudflare Workers (Edge runtime only)
//
// For Cloudflare Workers, consider using:
// - @auth/core with edge-compatible adapters
// - Lucia auth (edge-native)
// - Or deploy to Vercel instead

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ account, profile, user }) {
      console.log("[NextAuth] 🔐 signIn callback triggered");
      console.log("[NextAuth] Provider:", account?.provider);
      console.log("[NextAuth] User email:", profile?.email || user?.email);
      
      if (account?.provider === "google") {
        console.log("[NextAuth] ✅ Google sign-in successful");
        return true;
      }
      
      console.log("[NextAuth] ⚠️ Non-Google provider or no account");
      return true;
    },
    async jwt({ token, account, profile, user }) {
      console.log("[NextAuth] 🎫 JWT callback triggered");
      
      // Initial sign in - exchange Google token with backend
      if (account && user) {
        console.log("[NextAuth] New Google login - exchanging with backend");
        
        try {
          const response = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idToken: account.id_token,
              accessToken: account.access_token,
              email: user.email,
              name: user.name,
              image: user.image,
              googleId: profile?.sub
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("[NextAuth] ❌ Backend auth failed:", response.status, errorText);
            throw new Error(`Backend authentication failed: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("[NextAuth] ✅ Backend auth successful");
          
          // Store backend JWT and user data in token
          return {
            ...token,
            backendToken: data.token || data.access_token,
            userId: data.userId || data.user?.id,
            userData: data.user,
            googleAccessToken: account.access_token
          };
        } catch (error) {
          console.error("[NextAuth] ❌ Backend auth error:", error);
          return { 
            ...token, 
            error: "BackendAuthError",
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
      
      // Return previous token if not initial sign in
      return token;
    },
    async session({ session, token }) {
      console.log("[NextAuth] 📋 Session callback triggered");
      
      // Check for backend auth error
      if (token.error) {
        console.error("[NextAuth] ❌ Session has error:", token.error);
        return { 
          ...session, 
          error: token.error,
          errorMessage: token.errorMessage 
        } as any;
      }
      
      // Add backend token and user data to session
      if (session.user) {
        (session as any).backendToken = token.backendToken;
        (session as any).userId = token.userId;
        (session.user as any).id = token.userId;
        
        // Merge backend user data if available
        if (token.userData) {
          session.user = {
            ...session.user,
            ...(token.userData as any)
          };
        }
        
        console.log("[NextAuth] ✅ Session configured with backend token");
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("[NextAuth] 🔀 Redirect callback");
      console.log("[NextAuth] Requested URL:", url);
      console.log("[NextAuth] Base URL:", baseUrl);
      
      // Prevent redirect loops
      if (url.includes('/login') && url.includes('error=')) {
        console.log("[NextAuth] ⚠️ Error in login, staying on login page");
        return '/login';
      }
      
      // If redirect to same site, allow
      if (url.startsWith(baseUrl)) {
        console.log("[NextAuth] ✅ Internal redirect:", url);
        return url;
      }
      
      // Default to dashboard after successful login
      console.log("[NextAuth] ✅ Redirecting to dashboard");
      return `${baseUrl}/dashboard`;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable detailed logging
  logger: {
    error(code, metadata) {
      console.error("[NextAuth] ❌ ERROR:", code);
      console.error("[NextAuth] Metadata:", JSON.stringify(metadata, null, 2));
    },
    warn(code) {
      console.warn("[NextAuth] ⚠️ WARNING:", code);
    },
    debug(code, metadata) {
      console.log("[NextAuth] 🐛 DEBUG:", code);
      if (metadata) {
        console.log("[NextAuth] Debug metadata:", metadata);
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
