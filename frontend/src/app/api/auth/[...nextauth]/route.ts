// File: src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { JWT } from "next-auth/jwt"
import type { Session, User } from "next-auth"

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    user: {
      id?: string
      email?: string
      name?: string
      image?: string
      role?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    googleAccessToken?: string
    googleRefreshToken?: string
    googleIdToken?: string
    googleExpiresAt?: number
    backendAccessToken?: string
    backendRefreshToken?: string
    user?: {
      id?: string
      email?: string
      name?: string
      image?: string
      role?: string
    }
  }
}

const authOptions: NextAuthOptions = {
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
    signOut: '/login',
  },
  
  // Cookie configuration untuk Cloudflare Tunnel
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.notaku.cloud' : undefined
      }
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.notaku.cloud' : undefined
      }
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
    pkceCodeVerifier: {
      name: `__Secure-next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.notaku.cloud' : undefined
      }
    },
    state: {
      name: `__Secure-next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.notaku.cloud' : undefined,
        maxAge: 900
      }
    },
    nonce: {
      name: `__Secure-next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
  },
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("[OAuth] Starting sign in for:", user.email)
      
      if (account?.provider === "google") {
        try {
          // Check if we have ID token
          if (!account.id_token) {
            console.error("[OAuth] No ID token received from Google")
            return false
          }
          
          // Backend expects only the ID token
          const requestBody = {
            token: account.id_token
          }
          
          console.log("[OAuth] Calling backend API with Google ID token...")
          
          // Get backend URL
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.notaku.cloud'
          
          // Call backend endpoint - CORRECT PATH: /api/v1/auth/google
          const response = await fetch(`${backendUrl}/api/v1/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(requestBody)
          })
          
          console.log("[Backend] Response status:", response.status)
          
          // Handle response
          if (!response.ok) {
            const errorText = await response.text()
            console.error("[Backend] Error response:", errorText)
            
            // Log specific error types
            if (response.status === 404) {
              console.error("[Backend] Endpoint not found - check backend route")
            } else if (response.status === 401) {
              console.error("[Backend] Unauthorized - token validation failed")
            } else if (response.status === 500) {
              console.error("[Backend] Server error - check backend logs")
            }
            
            // TODO: In production, return false here
            // For now, allow sign in for testing
            if (process.env.NODE_ENV === 'development') {
              console.warn("[OAuth] Backend failed but allowing sign in for development")
              return true
            }
            
            return false
          }
          
          // Parse successful response
          const data = await response.json()
          console.log("[Backend] Success! User authenticated")
          
          // Store backend tokens and user data
          if (data.access_token) {
            (account as any).backendAccessToken = data.access_token
            console.log("[Backend] Access token received")
          }
          if (data.refresh_token) {
            (account as any).backendRefreshToken = data.refresh_token
            console.log("[Backend] Refresh token received")
          }
          if (data.user) {
            (account as any).backendUser = data.user
            console.log("[Backend] User data received:", data.user.email)
          }
          
          console.log("[OAuth] Sign in completed successfully")
          return true
          
        } catch (error: any) {
          console.error("[OAuth] Exception during sign in:", error)
          console.error("[OAuth] Error details:", {
            message: error.message,
            stack: error.stack
          })
          
          // TODO: In production, return false here
          // For now, allow sign in for testing
          if (process.env.NODE_ENV === 'development') {
            console.warn("[OAuth] Exception but allowing sign in for development")
            return true
          }
          
          return false
        }
      }
      
      // For other providers
      return true
    },
    
    async jwt({ token, account, user, profile, trigger, session }) {
      // Initial sign in
      if (account && user) {
        console.log("[JWT] Creating initial token for:", user.email)
        
        return {
          ...token,
          // Store Google OAuth tokens
          googleAccessToken: account.access_token,
          googleRefreshToken: account.refresh_token,
          googleIdToken: account.id_token,
          googleExpiresAt: account.expires_at,
          
          // Store backend tokens
          backendAccessToken: (account as any).backendAccessToken || null,
          backendRefreshToken: (account as any).backendRefreshToken || null,
          
          // Store user data
          user: {
            id: (account as any).backendUser?.id || user.id || (profile as any)?.sub,
            email: (account as any).backendUser?.email || user.email,
            name: (account as any).backendUser?.name || user.name,
            image: (account as any).backendUser?.image || user.image,
            role: (account as any).backendUser?.role || 'user',
            ...((account as any).backendUser || {})
          }
        }
      }
      
      // Update token if requested
      if (trigger === "update" && session) {
        console.log("[JWT] Updating token with new session data")
        return { ...token, ...session }
      }
      
      // Return existing token
      return token
    },
    
    async session({ session, token }) {
      console.log("[Session] Creating session for:", token.user?.email)
      
      // Pass backend access token to session
      if (token.backendAccessToken) {
        session.accessToken = token.backendAccessToken as string
      }
      
      // Pass backend refresh token to session (if needed)
      if (token.backendRefreshToken) {
        session.refreshToken = token.backendRefreshToken as string
      }
      
      // Pass user data to session
      if (token.user) {
        session.user = {
          ...session.user,
          ...(token.user as any)
        }
      }
      
      return session
    },
    
    async redirect({ url, baseUrl }) {
      console.log("[Redirect] Processing redirect - URL:", url, "BaseURL:", baseUrl)
      
      // Allow relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      
      // Allow callback URLs on the same origin
      try {
        const urlObject = new URL(url)
        const baseUrlObject = new URL(baseUrl)
        
        if (urlObject.origin === baseUrlObject.origin) {
          return url
        }
      } catch (error) {
        console.error("[Redirect] Invalid URL:", url)
      }
      
      // After successful sign in, redirect to dashboard
      if (url === `${baseUrl}/login` || url === '/login') {
        return `${baseUrl}/dashboard`
      }
      
      // Default redirect
      return baseUrl
    }
  },
  
  // Events for monitoring
  events: {
    async signIn(message) {
      console.log("[Event] User signed in:", message.user?.email)
    },
    async signOut(message) {
      console.log("[Event] User signed out")
    },
    async createUser(message) {
      console.log("[Event] User created:", message.user?.email)
    },
    async linkAccount(message) {
      console.log("[Event] Account linked for user:", message.user?.email)
    },
    async session(message) {
      // This can be noisy, uncomment only if needed
      // console.log("[Event] Session accessed")
    }
  },
  
  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  // JWT configuration
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Required for Cloudflare Tunnel
  trustHost: true,
  
  // Use secure cookies in production
  useSecureCookies: process.env.NODE_ENV === 'production',
  
  // Secret for JWT encryption
  secret: process.env.NEXTAUTH_SECRET,
  
  // Enable debug logging
  debug: process.env.NODE_ENV === 'development' || true,
}

// Create NextAuth handler
const handler = NextAuth(authOptions)

// Export for App Router
export { handler as GET, handler as POST }
