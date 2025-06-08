// POST /api/admin/mark-served - Admin endpoint to mark current patient as served
// This only marks the current patient as served, does not call the next patient
// Protected by admin authentication middleware

import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth/admin'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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

    // Get current queue using the same view as the admin queue display
    const { data: queueData, error: queueError } = await supabase
      .from('current_queue')
      .select('*')
      .order('queue_time', { ascending: true })

    if (queueError) {
      console.error('Error fetching queue data:', queueError)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch queue data',
        error: queueError.message
      }, { status: 500 })
    }

    // Find who's currently being served (status = 'arrived')
    const currentQueue = queueData || []
    const nowServing = currentQueue.find(item => item.status === 'arrived')

    if (!nowServing) {
      return NextResponse.json({
        success: false,
        message: 'No patient currently being served',
        queue: {
          currentlyServing: null,
          totalWaiting: currentQueue.filter(item => item.status === 'pending').length
        }
      }, { status: 404 })
    }

    // Mark the current patient as served
    let updateError = null
    let servedPatient = null

    if (nowServing.type === 'appointment') {
      const { data: updatedAppointment, error } = await supabase
        .from('appointments')
        .update({ 
          status: 'served',
          updated_at: new Date().toISOString()
        })
        .eq('id', nowServing.id)
        .select('id, user_id, date, scheduled_time, status, updated_at')
        .single()

      updateError = error
      servedPatient = updatedAppointment ? {
        id: updatedAppointment.id,
        userId: updatedAppointment.user_id,
        type: 'appointment',
        date: updatedAppointment.date,
        scheduledTime: updatedAppointment.scheduled_time,
        status: updatedAppointment.status,
        updatedAt: updatedAppointment.updated_at
      } : null

    } else if (nowServing.type === 'walk_in') {
      const { data: updatedWalkIn, error } = await supabase
        .from('walk_ins')
        .update({ 
          status: 'served',
          updated_at: new Date().toISOString()
        })
        .eq('id', nowServing.id)
        .select('id, user_id, check_in_time, status, updated_at')
        .single()

      updateError = error
      servedPatient = updatedWalkIn ? {
        id: updatedWalkIn.id,
        userId: updatedWalkIn.user_id,
        type: 'walk-in',
        checkInTime: updatedWalkIn.check_in_time,
        status: updatedWalkIn.status,
        updatedAt: updatedWalkIn.updated_at
      } : null
    }

    if (updateError) {
      console.error('Error updating patient status to served:', updateError)
      return NextResponse.json({
        success: false,
        message: 'Failed to mark patient as served',
        error: updateError.message
      }, { status: 500 })
    }

    // Get updated queue information
    const { data: updatedQueueData, error: updatedQueueError } = await supabase
      .from('current_queue')
      .select('*')
      .order('queue_time', { ascending: true })

    if (updatedQueueError) {
      console.error('Error fetching updated queue:', updatedQueueError)
    }

    const updatedQueue = updatedQueueData || []
    const stillWaiting = updatedQueue.filter(item => item.status === 'pending')

    return NextResponse.json({
      success: true,
      message: `Patient ${nowServing.ticket_id} marked as served successfully.`,
      servedPatient,
      queue: {
        currentlyServing: null, // No one being served now
        nextInLine: stillWaiting.length > 0 ? {
          id: stillWaiting[0].id,
          type: stillWaiting[0].type,
          ticketId: stillWaiting[0].ticket_id,
          name: stillWaiting[0].name,
          time: stillWaiting[0].queue_time
        } : null,
        totalWaiting: stillWaiting.length,
        queueEmpty: stillWaiting.length === 0
      },
      adminAction: {
        performedBy: session.email,
        timestamp: new Date().toISOString(),
        action: 'mark_served'
      }
    })

  } catch (error) {
    console.error('Admin mark-served API error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    }, { status: 500 })
  }
} 