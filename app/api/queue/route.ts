// GET /api/queue - Queue Management API
// Provides unified queue status for all interfaces with real-time updates

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

interface QueueItem {
  type: 'appointment' | 'walk_in'
  id: string
  ticket_id: string
  name: string
  phone?: string
  email?: string
  queue_time: string
  status: string
  scheduled_time?: string
  check_in_time?: string
  original_appointment_id?: string
}

interface QueueStatus {
  nowServing: QueueItem | null
  current: QueueItem[]
  totalInQueue: number
  appointmentsInQueue: number
  walkInsInQueue: number
  estimatedWait: string
  lastUpdated: string
  queueStats: {
    totalToday: number
    served: number
    waiting: number
    averageWaitTime: string
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('stats') === 'true'
    const includeHistory = searchParams.get('history') === 'true'

    // Fetch current queue from the database view
    const { data: queueData, error: queueError } = await supabaseServer
      .from('current_queue')
      .select('*')
      .order('queue_time')

    if (queueError) {
      console.error('Error fetching queue data:', queueError)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch current queue',
        error: queueError.message
      }, { status: 500 })
    }

    // Transform and validate queue data
    const currentQueue: QueueItem[] = (queueData || []).map(item => ({
      type: item.type as 'appointment' | 'walk_in',
      id: item.id,
      ticket_id: item.ticket_id,
      name: item.name,
      phone: item.phone,
      email: item.email,
      queue_time: item.queue_time,
      status: item.status,
      scheduled_time: item.scheduled_time,
      check_in_time: item.check_in_time,
      original_appointment_id: item.original_appointment_id
    }))

    // Determine "Now Serving" - first item in queue or null if empty
    const nowServing = currentQueue.length > 0 ? currentQueue[0] : null

    // Calculate queue statistics
    const totalInQueue = currentQueue.length
    const appointmentsInQueue = currentQueue.filter(item => item.type === 'appointment').length
    const walkInsInQueue = currentQueue.filter(item => item.type === 'walk_in').length

    // Calculate estimated wait time (15 minutes per person ahead in queue)
    const estimateWaitTime = (position: number): string => {
      if (position === 0) return 'Now serving'
      if (position === 1) return 'Next in line'
      
      const waitMinutes = position * 15
      if (waitMinutes < 60) {
        return `Approximately ${waitMinutes} minutes`
      } else {
        const hours = Math.floor(waitMinutes / 60)
        const minutes = waitMinutes % 60
        return minutes > 0 
          ? `Approximately ${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minutes`
          : `Approximately ${hours} hour${hours > 1 ? 's' : ''}`
      }
    }

    const overallEstimatedWait = estimateWaitTime(totalInQueue - 1)

    // Prepare base response
    const queueStatus: QueueStatus = {
      nowServing,
      current: currentQueue,
      totalInQueue,
      appointmentsInQueue,
      walkInsInQueue,
      estimatedWait: overallEstimatedWait,
      lastUpdated: new Date().toISOString(),
      queueStats: {
        totalToday: 0,
        served: 0,
        waiting: totalInQueue,
        averageWaitTime: '15 minutes'
      }
    }

    // Fetch additional statistics if requested
    if (includeStats) {
      try {
        // Get today's total appointments and walk-ins
        const { data: todayStats } = await supabaseServer
          .from('appointments')
          .select('status')
          .eq('date', new Date().toISOString().split('T')[0])

        const { data: todayWalkIns } = await supabaseServer
          .from('walk_ins')
          .select('status')
          .gte('check_in_time', new Date().toISOString().split('T')[0])
          .lt('check_in_time', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])

        const totalAppointments = todayStats?.length || 0
        const totalWalkInsToday = todayWalkIns?.length || 0
        const totalToday = totalAppointments + totalWalkInsToday

        const servedAppointments = todayStats?.filter(a => a.status === 'served').length || 0
        const servedWalkIns = todayWalkIns?.filter(w => w.status === 'served').length || 0
        const totalServed = servedAppointments + servedWalkIns

        queueStatus.queueStats = {
          totalToday,
          served: totalServed,
          waiting: totalInQueue,
          averageWaitTime: '15 minutes' // This could be calculated from historical data
        }
      } catch (statsError) {
        console.error('Error fetching queue statistics:', statsError)
        // Don't fail the request, just use defaults
      }
    }

    // Add individual wait time estimates for each queue item
    const enhancedQueue = currentQueue.map((item, index) => ({
      ...item,
      position: index + 1,
      estimatedWait: estimateWaitTime(index),
      isNowServing: index === 0,
      isNext: index === 1
    }))

    // Get current business hours from database
    const businessHours = await getCurrentBusinessHours()
    
    // Build final response
    const response = {
      success: true,
      message: 'Queue status retrieved successfully',
      queue: {
        ...queueStatus,
        current: enhancedQueue
      },
      metadata: {
        timestamp: new Date().toISOString(),
        totalItems: totalInQueue,
        breakdown: {
          appointments: appointmentsInQueue,
          walkIns: walkInsInQueue
        },
        businessHours: {
          open: businessHours.open,
          close: businessHours.close,
          currentlyOpen: businessHours.isOpen
        }
      }
    }

    // Add history if requested (simplified for now)
    if (includeHistory) {
      try {
        const { data: recentHistory } = await supabaseServer
          .from('appointments')
          .select('ticket_id, status, updated_at')
          .eq('date', new Date().toISOString().split('T')[0])
          .eq('status', 'served')
          .order('updated_at', { ascending: false })
          .limit(10)

        response.queue = {
          ...response.queue,
          recentlyServed: recentHistory || []
        }
      } catch (historyError) {
        console.error('Error fetching queue history:', historyError)
        // Don't fail the request
      }
    }

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Queue Management API error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error during queue status retrieval',
      error: error instanceof Error ? error.message : 'Unknown error',
      queue: {
        nowServing: null,
        current: [],
        totalInQueue: 0,
        appointmentsInQueue: 0,
        walkInsInQueue: 0,
        estimatedWait: 'Unable to determine',
        lastUpdated: new Date().toISOString(),
        queueStats: {
          totalToday: 0,
          served: 0,
          waiting: 0,
          averageWaitTime: 'Unable to determine'
        }
      }
    }, { status: 500 })
  }
}

// Helper function to get current business hours from database
async function getCurrentBusinessHours() {
  try {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday, 6 = Saturday
    
    const { data: businessHour, error } = await supabaseServer
      .from('business_hours')
      .select('is_open, open_time, close_time')
      .eq('day_of_week', dayOfWeek)
      .single()
    
    if (error || !businessHour) {
      console.error('Error fetching business hours:', error)
      // Fallback to default hours
      return {
        open: '09:00',
        close: '17:00',
        isOpen: false
      }
    }
    
    if (!businessHour.is_open) {
      return {
        open: 'Closed',
        close: 'Closed',
        isOpen: false
      }
    }
    
    // Check if current time is within business hours
    const currentTime = now.toTimeString().slice(0, 8) // HH:MM:SS format
    const isCurrentlyOpen = businessHour.is_open && 
      currentTime >= businessHour.open_time && 
      currentTime <= businessHour.close_time
    
    return {
      open: businessHour.open_time?.slice(0, 5) || '09:00', // HH:MM format
      close: businessHour.close_time?.slice(0, 5) || '17:00', // HH:MM format
      isOpen: isCurrentlyOpen
    }
  } catch (error) {
    console.error('Error in getCurrentBusinessHours:', error)
    // Fallback to default hours
    return {
      open: '09:00',
      close: '17:00',
      isOpen: false
    }
  }
}

// Helper function to check if currently within business hours (legacy - kept for compatibility)
function isBusinessHours(): boolean {
  // This function is now deprecated in favor of getCurrentBusinessHours()
  // but kept for any direct usage
  const now = new Date()
  const currentHour = now.getHours()
  return currentHour >= 0 && currentHour < 24 // Default to always open until database is checked
}

// POST endpoint for admin queue management actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ticketId } = body

    if (!action || !ticketId) {
      return NextResponse.json({
        success: false,
        message: 'Action and ticketId are required',
        validActions: ['serve-next', 'mark-served', 'call-next']
      }, { status: 400 })
    }

    switch (action) {
      case 'serve-next':
      case 'call-next':
        return await handleCallNext(ticketId)
      
      case 'mark-served':
        return await handleMarkServed(ticketId)
      
      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action',
          validActions: ['serve-next', 'mark-served', 'call-next']
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Queue management action error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error during queue management',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle calling next patient in queue
async function handleCallNext(ticketId: string) {
  // First check if this is an appointment or walk-in
  const isAppointment = ticketId.startsWith('APT-')
  const isWalkIn = ticketId.startsWith('WLK-') || ticketId.startsWith('W-')

  if (isAppointment) {
    const { data, error } = await supabaseServer
      .from('appointments')
      .update({ status: 'serving' })
      .eq('ticket_id', ticketId)
      .eq('status', 'arrived')
      .select('ticket_id, status')
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Failed to call appointment',
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment called to service',
      action: 'call-next',
      ticket: data
    })

  } else if (isWalkIn) {
    const { data, error } = await supabaseServer
      .from('walk_ins')
      .update({ status: 'serving' })
      .eq('ticket_id', ticketId)
      .eq('status', 'waiting')
      .select('ticket_id, status')
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Failed to call walk-in',
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Walk-in called to service',
      action: 'call-next',
      ticket: data
    })
  } else {
    return NextResponse.json({
      success: false,
      message: 'Invalid ticket ID format'
    }, { status: 400 })
  }
}

// Handle marking patient as served and completed
async function handleMarkServed(ticketId: string) {
  const isAppointment = ticketId.startsWith('APT-')
  const isWalkIn = ticketId.startsWith('WLK-') || ticketId.startsWith('W-')

  if (isAppointment) {
    const { data, error } = await supabaseServer
      .from('appointments')
      .update({ status: 'served' })
      .eq('ticket_id', ticketId)
      .in('status', ['arrived', 'serving'])
      .select('ticket_id, status')
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Failed to mark appointment as served',
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment marked as served',
      action: 'mark-served',
      ticket: data
    })

  } else if (isWalkIn) {
    const { data, error } = await supabaseServer
      .from('walk_ins')
      .update({ status: 'served' })
      .eq('ticket_id', ticketId)
      .in('status', ['waiting', 'serving'])
      .select('ticket_id, status')
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Failed to mark walk-in as served',
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Walk-in marked as served',
      action: 'mark-served',
      ticket: data
    })
  } else {
    return NextResponse.json({
      success: false,
      message: 'Invalid ticket ID format'
    }, { status: 400 })
  }
} 