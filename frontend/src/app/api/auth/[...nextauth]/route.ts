import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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
      
      if (account) {
        console.log("[NextAuth] New account login - adding to token");
        token.accessToken = account.access_token;
        token.id = profile?.sub || user?.id;
        console.log("[NextAuth] Token ID set to:", token.id);
      }
      
      return token;
    },
    async session({ session, token }) {
      console.log("[NextAuth] 📋 Session callback triggered");
      console.log("[NextAuth] Token ID:", token.id);
      
      if (session.user && token.id) {
        (session.user as any).id = token.id as string;
        console.log("[NextAuth] ✅ Session user ID set to:", token.id);
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
