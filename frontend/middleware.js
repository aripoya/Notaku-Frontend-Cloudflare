import { NextResponse } from 'next/server'

export function middleware(request) {
  // Clone headers
  const requestHeaders = new Headers(request.headers)
  
  // Force HTTPS for OAuth
  requestHeaders.set('x-forwarded-proto', 'https')
  requestHeaders.set('x-forwarded-host', 'www.notaku.cloud')
  
  // Create response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  })
  
  // For OAuth paths, set specific headers
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    
    // Log for debugging
    console.log('Auth request:', {
      path: request.nextUrl.pathname,
      cookies: request.cookies.getAll().map(c => c.name)
    })
  }
  
  return response
}

export const config = {
  matcher: '/api/auth/:path*'
}
