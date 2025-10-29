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
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        console.log("[NextAuth] Google sign-in successful:", profile?.email);
        return true;
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.id = profile?.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
