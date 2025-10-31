import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { API_BASE_URL, API_PREFIX } from "@/lib/api-config";

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
      console.log("\n" + "=".repeat(60));
      console.log("[NextAuth] 🔐 SIGN IN CALLBACK TRIGGERED");
      console.log("=".repeat(60));
      console.log("[NextAuth] Provider:", account?.provider);
      console.log("[NextAuth] Account object:", JSON.stringify(account, null, 2));
      console.log("[NextAuth] Profile object:", JSON.stringify(profile, null, 2));
      console.log("[NextAuth] User object:", JSON.stringify(user, null, 2));
      console.log("=".repeat(60) + "\n");
      
      if (account?.provider === "google") {
        // Critical checks
        if (!account.id_token) {
          console.error("[NextAuth] ❌ CRITICAL: No ID token from Google!");
          return false;
        }
        if (!account.access_token) {
          console.warn("[NextAuth] ⚠️ WARNING: No access token from Google");
        }
        console.log("[NextAuth] ✅ Google sign-in successful");
        console.log("[NextAuth] ID Token:", account.id_token ? `${account.id_token.substring(0, 20)}...` : "MISSING");
        console.log("[NextAuth] Access Token:", account.access_token ? `${account.access_token.substring(0, 20)}...` : "MISSING");
        return true;
      }
      
      console.log("[NextAuth] ⚠️ Non-Google provider or no account");
      return true;
    },
    async jwt({ token, account, profile, user }) {
      console.log("\n" + "=".repeat(60));
      console.log("[NextAuth] 🎫 JWT CALLBACK TRIGGERED");
      console.log("=".repeat(60));
      console.log("[NextAuth] Token (before):", JSON.stringify(token, null, 2));
      console.log("[NextAuth] Account:", account ? JSON.stringify(account, null, 2) : "null");
      console.log("[NextAuth] User:", user ? JSON.stringify(user, null, 2) : "null");
      console.log("=".repeat(60) + "\n");
      
      // Initial sign in - exchange Google token with backend
      if (account && user) {
        console.log("[NextAuth] 🚀 NEW GOOGLE LOGIN - Exchanging with backend");
        
        // Prepare request body with multiple token formats for backend compatibility
        const requestBody = {
          // Try multiple field names for backend compatibility
          token: account.id_token,           // Pattern A
          idToken: account.id_token,         // Pattern B
          googleToken: account.id_token,     // Pattern C
          credential: account.id_token,      // Pattern D
          accessToken: account.access_token, // Pattern E
          email: user.email,
          name: user.name,
          picture: user.image,
          image: user.image,
          googleId: profile?.sub,
          sub: profile?.sub
        };
        
        console.log("[NextAuth] 📤 REQUEST TO BACKEND:");
        console.log("[NextAuth] Endpoint:", `${API_BASE_URL}${API_PREFIX}/auth/google`);
        console.log("[NextAuth] Method: POST");
        console.log("[NextAuth] Headers:", { 'Content-Type': 'application/json' });
        console.log("[NextAuth] Body:", JSON.stringify(requestBody, null, 2));
        
        // Backend exchange is now properly configured with /api/v1 prefix
        const SKIP_BACKEND = false; // Backend endpoint is ready
        
        if (SKIP_BACKEND) {
          console.log("[NextAuth] ⚠️ SKIPPING BACKEND - Using Google user directly (temporary)");
          
          // Create mock token for testing
          const mockBackendToken = `google_${account.access_token?.substring(0, 20)}`;
          
          const updatedToken = {
            ...token,
            backendToken: mockBackendToken,
            userId: user.email,
            userData: {
              id: user.email,
              email: user.email,
              name: user.name,
              image: user.image,
            },
            googleAccessToken: account.access_token,
            backendAuthenticated: false, // Mark as not backend authenticated
            temporaryBypass: true
          };
          
          console.log("[NextAuth] 💾 Updated token (temporary bypass):", JSON.stringify(updatedToken, null, 2));
          return updatedToken;
        }
        
        try {
          const fetchStart = Date.now();
          const response = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            credentials: 'include',
            mode: 'cors'
          });
          const fetchDuration = Date.now() - fetchStart;

          console.log("[NextAuth] 📥 BACKEND RESPONSE:");
          console.log("[NextAuth] Status:", response.status, response.statusText);
          console.log("[NextAuth] Duration:", fetchDuration, "ms");
          console.log("[NextAuth] Headers:", JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

          if (!response.ok) {
            const errorText = await response.text();
            console.error("[NextAuth] ❌ BACKEND AUTH FAILED:");
            console.error("[NextAuth] Status:", response.status);
            console.error("[NextAuth] Error body:", errorText);
            throw new Error(`Backend authentication failed: ${response.status} - ${errorText}`);
          }
          
          const data = await response.json();
          console.log("[NextAuth] ✅ BACKEND AUTH SUCCESSFUL");
          console.log("[NextAuth] Response data:", JSON.stringify(data, null, 2));
          
          // Store backend JWT and user data in token
          const updatedToken = {
            ...token,
            backendToken: data.token || data.access_token || data.accessToken,
            userId: data.userId || data.user_id || data.user?.id || data.id,
            userData: data.user,
            googleAccessToken: account.access_token,
            backendAuthenticated: true
          };
          
          console.log("[NextAuth] 💾 Updated token:", JSON.stringify(updatedToken, null, 2));
          return updatedToken;
        } catch (error) {
          console.error("[NextAuth] ❌ BACKEND AUTH ERROR:");
          console.error("[NextAuth] Error type:", error instanceof Error ? error.constructor.name : typeof error);
          console.error("[NextAuth] Error message:", error instanceof Error ? error.message : String(error));
          console.error("[NextAuth] Error stack:", error instanceof Error ? error.stack : "No stack trace");
          
          return { 
            ...token, 
            error: "BackendAuthError",
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorDetails: String(error)
          };
        }
      }
      
      // Return previous token if not initial sign in
      console.log("[NextAuth] ↩️ Returning existing token (not initial sign in)");
      return token;
    },
    async session({ session, token }) {
      console.log("\n" + "=".repeat(60));
      console.log("[NextAuth] 📋 SESSION CALLBACK TRIGGERED");
      console.log("=".repeat(60));
      console.log("[NextAuth] Session (before):", JSON.stringify(session, null, 2));
      console.log("[NextAuth] Token:", JSON.stringify(token, null, 2));
      console.log("=".repeat(60) + "\n");
      
      // Check for backend auth error
      if (token.error) {
        console.error("[NextAuth] ❌ SESSION HAS ERROR:");
        console.error("[NextAuth] Error:", token.error);
        console.error("[NextAuth] Message:", token.errorMessage);
        console.error("[NextAuth] Details:", token.errorDetails);
        return { 
          ...session, 
          error: token.error,
          errorMessage: token.errorMessage,
          errorDetails: token.errorDetails
        } as any;
      }
      
      // Add backend token and user data to session
      if (session.user) {
        (session as any).backendToken = token.backendToken;
        (session as any).userId = token.userId;
        (session as any).backendAuthenticated = token.backendAuthenticated;
        (session.user as any).id = token.userId;
        
        // Merge backend user data if available
        if (token.userData) {
          session.user = {
            ...session.user,
            ...(token.userData as any)
          };
        }
        
        console.log("[NextAuth] ✅ SESSION CONFIGURED");
        console.log("[NextAuth] Backend Token:", token.backendToken ? `${String(token.backendToken).substring(0, 20)}...` : "MISSING");
        console.log("[NextAuth] User ID:", token.userId || "MISSING");
        console.log("[NextAuth] Backend Authenticated:", token.backendAuthenticated || false);
      }
      
      console.log("[NextAuth] Session (after):", JSON.stringify(session, null, 2));
      console.log("=".repeat(60) + "\n");
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
