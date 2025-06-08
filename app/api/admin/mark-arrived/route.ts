// POST /api/admin/mark-arrived - Admin endpoint to mark tickets as arrived
// Protected by admin authentication middleware

import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth/admin'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Request validation schema
const MarkArrivedRequestSchema = z.object({
  ticketId: z.string().uuid('Invalid ticket ID format'),
  ticketType: z.enum(['appointment', 'walk-in'], {
    errorMap: () => ({ message: 'Ticket type must be either "appointment" or "walk-in"' })
  })
})

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

    // Parse and validate request body
    const body = await request.json()
    const validationResult = MarkArrivedRequestSchema.safeParse(body)

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

    const { ticketId, ticketType } = validationResult.data
    
    // Initialize Supabase client
    const supabase = createServiceRoleClient()

    if (ticketType === 'appointment') {
      // Mark appointment as arrived
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('id, user_id, date, scheduled_time, status')
        .eq('id', ticketId)
        .single()

      if (fetchError || !appointment) {
        return NextResponse.json({
          success: false,
          message: 'Appointment not found',
          ticketId,
          ticketType
        }, { status: 404 })
      }

      // Check if appointment is in a valid state to be marked as arrived
      if (appointment.status === 'arrived') {
        return NextResponse.json({
          success: false,
          message: 'Appointment is already marked as arrived',
          appointment: {
            id: appointment.id,
            status: appointment.status,
            scheduledTime: appointment.scheduled_time
          }
        }, { status: 409 })
      }

      if (appointment.status === 'served') {
        return NextResponse.json({
          success: false,
          message: 'Cannot mark served appointment as arrived',
          appointment: {
            id: appointment.id,
            status: appointment.status,
            scheduledTime: appointment.scheduled_time
          }
        }, { status: 409 })
      }

      // Update appointment status to arrived
      const { data: updatedAppointment, error: updateError } = await supabase
        .from('appointments')
        .update({ 
          status: 'arrived',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select('id, user_id, date, scheduled_time, status, updated_at')
        .single()

      if (updateError) {
        console.error('Error updating appointment status:', updateError)
        return NextResponse.json({
          success: false,
          message: 'Failed to update appointment status',
          error: updateError.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Appointment marked as arrived successfully',
        appointment: {
          id: updatedAppointment.id,
          userId: updatedAppointment.user_id,
          date: updatedAppointment.date,
          scheduledTime: updatedAppointment.scheduled_time,
          status: updatedAppointment.status,
          updatedAt: updatedAppointment.updated_at
        },
        adminAction: {
          performedBy: session.email,
          timestamp: new Date().toISOString(),
          action: 'mark_arrived'
        }
      })

    } else if (ticketType === 'walk-in') {
              // Mark walk-in as arrived (update status from 'pending' to 'arrived')
      const { data: walkIn, error: fetchError } = await supabase
        .from('walk_ins')
        .select('id, user_id, check_in_time, status')
        .eq('id', ticketId)
        .single()

      if (fetchError || !walkIn) {
        return NextResponse.json({
          success: false,
          message: 'Walk-in not found',
          ticketId,
          ticketType
        }, { status: 404 })
      }

      // Check if walk-in is in a valid state
      if (walkIn.status === 'arrived') {
        return NextResponse.json({
          success: false,
          message: 'Walk-in is already marked as arrived',
          walkIn: {
            id: walkIn.id,
            status: walkIn.status,
            checkInTime: walkIn.check_in_time
          }
        }, { status: 409 })
      }

      if (walkIn.status === 'served') {
        return NextResponse.json({
          success: false,
          message: 'Cannot mark served walk-in as arrived',
          walkIn: {
            id: walkIn.id,
            status: walkIn.status,
            checkInTime: walkIn.check_in_time
          }
        }, { status: 409 })
      }

      // Update walk-in status to arrived
      const { data: updatedWalkIn, error: updateError } = await supabase
        .from('walk_ins')
        .update({ 
          status: 'arrived',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select('id, user_id, check_in_time, status, updated_at')
        .single()

      if (updateError) {
        console.error('Error updating walk-in status:', updateError)
        return NextResponse.json({
          success: false,
          message: 'Failed to update walk-in status',
          error: updateError.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Walk-in marked as arrived successfully',
        walkIn: {
          id: updatedWalkIn.id,
          userId: updatedWalkIn.user_id,
          checkInTime: updatedWalkIn.check_in_time,
          status: updatedWalkIn.status,
          updatedAt: updatedWalkIn.updated_at
        },
        adminAction: {
          performedBy: session.email,
          timestamp: new Date().toISOString(),
          action: 'mark_arrived'
        }
      })
    }

  } catch (error) {
    console.error('Admin mark-arrived API error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    }, { status: 500 })
  }
} 