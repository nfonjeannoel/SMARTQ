// POST /api/admin/call-next - Admin endpoint to mark current ticket as served and advance queue
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

    // Get current queue - find the first "arrived" ticket (currently being served)
    // First, get all arrived appointments ordered by scheduled time
    const { data: arrivedAppointments, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, user_id, date, scheduled_time, status, created_at')
      .eq('status', 'arrived')
      .order('scheduled_time', { ascending: true })

    if (appointmentError) {
      console.error('Error fetching arrived appointments:', appointmentError)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch queue data',
        error: appointmentError.message
      }, { status: 500 })
    }

    // Get all arrived walk-ins ordered by check-in time
    const { data: arrivedWalkIns, error: walkInError } = await supabase
      .from('walk_ins')
      .select('id, user_id, check_in_time, status, created_at')
      .eq('status', 'arrived')
      .order('check_in_time', { ascending: true })

    if (walkInError) {
      console.error('Error fetching arrived walk-ins:', walkInError)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch queue data',
        error: walkInError.message
      }, { status: 500 })
    }

    // Merge and sort the queue by time
    const mergedQueue = [
      ...(arrivedAppointments || []).map(apt => ({
        id: apt.id,
        userId: apt.user_id,
        type: 'appointment' as const,
        time: apt.scheduled_time,
        status: apt.status,
        createdAt: apt.created_at
      })),
      ...(arrivedWalkIns || []).map(walkIn => ({
        id: walkIn.id,
        userId: walkIn.user_id,
        type: 'walk-in' as const,
        time: walkIn.check_in_time,
        status: walkIn.status,
        createdAt: walkIn.created_at
      }))
    ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

    // Check if there's anyone in the queue to serve
    if (mergedQueue.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No patients in queue to serve',
        queue: {
          currentlyServing: null,
          nextInLine: null,
          totalWaiting: 0
        }
      }, { status: 404 })
    }

    // The first person in the merged queue is currently being served
    const currentPatient = mergedQueue[0]
    const nextPatient = mergedQueue.length > 1 ? mergedQueue[1] : null

    // Mark the current patient as served
    let updateError = null
    let servedPatient = null

    if (currentPatient.type === 'appointment') {
      const { data: updatedAppointment, error } = await supabase
        .from('appointments')
        .update({ 
          status: 'served',
          updated_at: new Date().toISOString()
        })
        .eq('id', currentPatient.id)
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

    } else if (currentPatient.type === 'walk-in') {
      const { data: updatedWalkIn, error } = await supabase
        .from('walk_ins')
        .update({ 
          status: 'served',
          updated_at: new Date().toISOString()
        })
        .eq('id', currentPatient.id)
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

    // Get updated queue count
    const remainingInQueue = mergedQueue.length - 1

    return NextResponse.json({
      success: true,
      message: `Patient marked as served successfully. ${nextPatient ? 'Next patient is now being served.' : 'Queue is now empty.'}`,
      servedPatient,
      queue: {
        currentlyServing: nextPatient ? {
          id: nextPatient.id,
          type: nextPatient.type,
          userId: nextPatient.userId,
          time: nextPatient.time
        } : null,
        nextInLine: mergedQueue.length > 2 ? {
          id: mergedQueue[2].id,
          type: mergedQueue[2].type,
          userId: mergedQueue[2].userId,
          time: mergedQueue[2].time
        } : null,
        totalWaiting: remainingInQueue,
        queueEmpty: remainingInQueue === 0
      },
      adminAction: {
        performedBy: session.email,
        timestamp: new Date().toISOString(),
        action: 'call_next'
      }
    })

  } catch (error) {
    console.error('Admin call-next API error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    }, { status: 500 })
  }
} 