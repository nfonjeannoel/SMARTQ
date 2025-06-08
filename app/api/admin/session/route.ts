// GET /api/admin/session - Admin session verification endpoint
// Checks current admin authentication status

import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth/admin'

export async function GET(request: NextRequest) {
  try {
    // Get current admin session
    const session = await getAdminSession(request)

    if (!session) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'No active admin session'
      }, { status: 401 })
    }

    // Check if session is expired
    const now = Math.floor(Date.now() / 1000)
    if (session.exp < now) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Admin session expired'
      }, { status: 401 })
    }

    // Return session info (without sensitive data)
    return NextResponse.json({
      success: true,
      authenticated: true,
      admin: {
        email: session.email,
        isAdmin: session.isAdmin,
        sessionExpiry: session.exp
      },
      message: 'Valid admin session'
    })

  } catch (error) {
    console.error('Admin session check error:', error)
    
    return NextResponse.json({
      success: false,
      authenticated: false,
      message: 'Error checking admin session',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    }, { status: 500 })
  }
} 