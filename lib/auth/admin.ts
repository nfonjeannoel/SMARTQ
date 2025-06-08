// Admin Authentication System
// Provides server-side admin authentication using email/password credentials

import { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// Admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Session configuration
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const COOKIE_NAME = 'admin-session'

// JWT secret as Uint8Array for jose library
const jwtSecret = new TextEncoder().encode(JWT_SECRET)

export interface AdminSession {
  email: string
  isAdmin: true
  iat: number
  exp: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  message: string
  token?: string
  session?: AdminSession
}

/**
 * Validates admin login credentials
 */
export function validateAdminCredentials(email: string, password: string): boolean {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Admin credentials not configured in environment variables')
    return false
  }

  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD
}

/**
 * Creates a JWT token for admin session
 */
export async function createAdminToken(email: string): Promise<string> {
  const payload = {
    email,
    isAdmin: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor((Date.now() + SESSION_DURATION) / 1000)
  }

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(jwtSecret)

  return token
}

/**
 * Verifies and decodes admin JWT token
 */
export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret)
    
    // Validate payload structure
    if (
      typeof payload.email === 'string' &&
      payload.isAdmin === true &&
      typeof payload.iat === 'number' &&
      typeof payload.exp === 'number'
    ) {
      return payload as AdminSession
    }
    
    return null
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

/**
 * Admin login function - validates credentials and creates session
 */
export async function adminLogin(credentials: LoginCredentials): Promise<AuthResult> {
  const { email, password } = credentials

  // Validate input
  if (!email || !password) {
    return {
      success: false,
      message: 'Email and password are required'
    }
  }

  // Validate credentials
  if (!validateAdminCredentials(email, password)) {
    return {
      success: false,
      message: 'Invalid email or password'
    }
  }

  try {
    // Create JWT token
    const token = await createAdminToken(email)
    const session = await verifyAdminToken(token)

    if (!session) {
      return {
        success: false,
        message: 'Failed to create admin session'
      }
    }

    return {
      success: true,
      message: 'Login successful',
      token,
      session
    }
  } catch (error) {
    console.error('Admin login error:', error)
    return {
      success: false,
      message: 'Login failed due to server error'
    }
  }
}

/**
 * Gets admin session from request cookies
 */
export async function getAdminSession(request: NextRequest): Promise<AdminSession | null> {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    return await verifyAdminToken(token)
  } catch (error) {
    console.error('Error getting admin session:', error)
    return null
  }
}

/**
 * Gets admin session from server-side cookies
 */
export async function getServerAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    return await verifyAdminToken(token)
  } catch (error) {
    console.error('Error getting server admin session:', error)
    return null
  }
}

/**
 * Sets admin session cookie in response
 */
export function setAdminSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/'
  })
}

/**
 * Clears admin session cookie
 */
export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  })
}

/**
 * Middleware function to protect admin routes
 */
export async function requireAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const session = await getAdminSession(request)

  if (!session) {
    // Redirect to admin login page
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check if session is expired
  const now = Math.floor(Date.now() / 1000)
  if (session.exp < now) {
    // Session expired, redirect to login
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    loginUrl.searchParams.set('expired', 'true')
    return NextResponse.redirect(loginUrl)
  }

  // Session is valid, allow access
  return null
}

/**
 * Checks if current user is admin (for use in pages/components)
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const session = await getServerAdminSession()
    return session !== null && session.isAdmin === true
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Admin logout function
 */
export function adminLogout(): NextResponse {
  const response = NextResponse.json({ 
    success: true, 
    message: 'Logged out successfully' 
  })
  
  clearAdminSessionCookie(response)
  return response
}

// Export constants for use in other modules
export const AUTH_CONSTANTS = {
  COOKIE_NAME,
  SESSION_DURATION,
  LOGIN_PATH: '/admin/login',
  ADMIN_PATH: '/admin'
} as const 