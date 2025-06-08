// Next.js Middleware for Admin Route Protection
// Protects /admin routes and handles authentication redirects

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from './lib/auth/admin'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect admin routes (excluding login page)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const authResponse = await requireAdminAuth(request)
    
    // If requireAdminAuth returns a response, it means authentication failed
    if (authResponse) {
      return authResponse
    }
  }

  // Allow the request to proceed
  return NextResponse.next()
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all admin routes except:
     * - /admin/login (login page should be accessible)
     * - API routes starting with /api/admin will be protected individually
     */
    '/admin/:path*'
  ]
} 