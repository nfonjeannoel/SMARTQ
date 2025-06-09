// POST /api/admin/search-user - Admin user search API
// Allows admins to search for users by email or phone number

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { z } from 'zod'
import { getServerAdminSession } from '@/lib/auth/admin'

// Request validation schema
const SearchUserRequestSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Query too long'),
})

type SearchUserRequest = z.infer<typeof SearchUserRequestSchema>

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminSession = await getServerAdminSession()
    if (!adminSession) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Admin access required'
      }, { status: 401 })
    }

    // Parse and validate request
    let requestData: SearchUserRequest
    try {
      const body = await request.json()
      requestData = SearchUserRequestSchema.parse(body)
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request data',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 400 })
    }

    const { query } = requestData
    const trimmedQuery = query.trim()

    // Search for users by email or phone
    // First try exact matches, then partial matches
    let users: any[] = []
    let usersError: any = null

    // Try exact matches first for more precise results
    const { data: exactUsers, error: exactError } = await supabaseServer
      .from('users')
      .select('*')
      .or(`email.eq.${trimmedQuery},phone.eq.${trimmedQuery}`)
      .order('created_at', { ascending: false })

    if (!exactError && exactUsers && exactUsers.length > 0) {
      users = exactUsers
    } else {
      // If no exact matches, try partial matches
      const { data: partialUsers, error: partialError } = await supabaseServer
        .from('users')
        .select('*')
        .or(`email.ilike.%${trimmedQuery}%,phone.ilike.%${trimmedQuery}%`)
        .order('created_at', { ascending: false })
        .limit(10) // Limit results to prevent overload
      
      users = partialUsers || []
      usersError = partialError
    }

    if (usersError) {
      console.error('Error searching users:', usersError)
      return NextResponse.json({
        success: false,
        message: 'Failed to search users',
        error: usersError.message
      }, { status: 500 })
    }

    // For each user found, get their recent appointments and walk-ins
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        try {
          // Get recent appointments (last 30 days)
          const { data: appointments, error: appointmentsError } = await supabaseServer
            .from('appointments')
            .select('*')
            .eq('user_id', user.id)
            .gte('scheduled_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('scheduled_time', { ascending: false })
            .limit(5)

          // Get recent walk-ins (last 30 days)
          const { data: walkIns, error: walkInsError } = await supabaseServer
            .from('walk_ins')
            .select('*')
            .eq('user_id', user.id)
            .gte('check_in_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('check_in_time', { ascending: false })
            .limit(5)

          return {
            ...user,
            appointments: appointmentsError ? [] : (appointments || []),
            walk_ins: walkInsError ? [] : (walkIns || [])
          }
        } catch (error) {
          console.error(`Error fetching details for user ${user.id}:`, error)
          return {
            ...user,
            appointments: [],
            walk_ins: []
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      message: `Found ${users.length} user(s) matching your search`,
      data: {
        users: usersWithDetails,
        query: trimmedQuery,
        total: users.length
      }
    })

  } catch (error) {
    console.error('User search failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 