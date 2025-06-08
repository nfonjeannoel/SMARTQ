// POST /api/admin/login - Admin login endpoint
// Validates admin credentials and creates secure session

import { NextRequest, NextResponse } from 'next/server'
import { adminLogin, setAdminSessionCookie, type LoginCredentials } from '@/lib/auth/admin'
import { z } from 'zod'

// Request validation schema
const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validationResult = LoginRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid input data',
        errors: validationResult.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      }, { status: 400 })
    }

    const credentials: LoginCredentials = validationResult.data

    // Attempt admin login
    const authResult = await adminLogin(credentials)

    if (!authResult.success) {
      return NextResponse.json({
        success: false,
        message: authResult.message
      }, { status: 401 })
    }

    // Create response with success message
    const response = NextResponse.json({
      success: true,
      message: authResult.message,
      admin: {
        email: authResult.session?.email,
        isAdmin: true
      }
    })

    // Set secure session cookie
    if (authResult.token) {
      setAdminSessionCookie(response, authResult.token)
    }

    return response

  } catch (error) {
    console.error('Admin login API error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error during login',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    }, { status: 500 })
  }
} 