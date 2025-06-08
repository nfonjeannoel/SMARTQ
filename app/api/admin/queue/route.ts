// GET /api/admin/queue - Admin endpoint to get current queue status
// Protected by admin authentication middleware

import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth/admin'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getAdminSession(request)
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Admin access required'
      }, { status: 401 })
    }

    // Initialize Supabase client
    const supabase = createServiceRoleClient()

    // Get current queue from the view
    const { data: queue, error: queueError } = await supabase
      .from('current_queue')
      .select('*')
      .order('queue_time', { ascending: true })

    if (queueError) {
      console.error('Error fetching queue:', queueError)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch queue data'
      }, { status: 500 })
    }

    // Process queue data
    const currentQueue = queue || []
    const nowServing = currentQueue.find(item => item.status === 'arrived') || null
    const waitingQueue = currentQueue.filter(item => item.status === 'pending')

    return NextResponse.json({
      success: true,
      queue: {
        nowServing,
        current: waitingQueue,
        totalInQueue: waitingQueue.length
      },
      timestamp: new Date().toISOString(),
      adminAccess: true
    })

  } catch (error) {
    console.error('Admin queue API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
} 