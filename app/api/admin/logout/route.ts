// POST /api/admin/logout - Admin logout endpoint
// Clears admin session and removes secure cookie

import { NextRequest, NextResponse } from 'next/server'
import { clearAdminSessionCookie } from '@/lib/auth/admin'

export async function POST(request: NextRequest) {
  try {
    // Create success response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear the admin session cookie
    clearAdminSessionCookie(response)

    return response

  } catch (error) {
    console.error('Admin logout API error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Error during logout',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    }, { status: 500 })
  }
} 