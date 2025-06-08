// POST /api/check-in - Appointment check-in API
// Handles check-ins with timing validation and status updates

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { z } from 'zod'

// Request validation schema
const CheckInRequestSchema = z.object({
  ticketId: z.string().min(1, 'Ticket ID is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
}).refine(
  (data) => data.phone || data.email,
  {
    message: "Either phone or email must be provided for verification",
    path: ["contact"],
  }
)

type CheckInRequest = z.infer<typeof CheckInRequestSchema>

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validationResult = CheckInRequestSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      }, { status: 400 })
    }

    const { ticketId, phone, email } = validationResult.data
    const now = new Date()

    // Find the appointment by ticket ID
    const { data: appointment, error: appointmentError } = await supabaseServer
      .from('appointments')
      .select(`
        id,
        ticket_id,
        user_id,
        date,
        scheduled_time,
        status,
        users (
          id,
          name,
          phone,
          email
        )
      `)
      .eq('ticket_id', ticketId)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json({
        success: false,
        message: 'Appointment not found',
        details: {
          ticketId,
          error: 'Invalid ticket ID or appointment does not exist'
        }
      }, { status: 404 })
    }

    // Verify contact information matches
    const user = appointment.users
    const contactMatches = (phone && user.phone === phone) || (email && user.email === email)
    
    if (!contactMatches) {
      return NextResponse.json({
        success: false,
        message: 'Contact information does not match our records',
        details: {
          provided: { phone, email },
          message: 'Please provide the phone number or email used when booking'
        }
      }, { status: 403 })
    }

    // Check if already checked in
    if (appointment.status === 'arrived') {
      return NextResponse.json({
        success: true,
        message: 'Already checked in',
        appointment: {
          ticketId: appointment.ticket_id,
          status: appointment.status,
          scheduledTime: appointment.scheduled_time,
          user: {
            name: user.name,
            phone: user.phone,
            email: user.email
          }
        },
        checkInTime: null, // Would need to store this separately if required
        queue: await getQueueStatus()
      }, { status: 200 })
    }

    // Check appointment status
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return NextResponse.json({
        success: false,
        message: `Cannot check in - appointment is ${appointment.status}`,
        details: {
          ticketId: appointment.ticket_id,
          status: appointment.status
        }
      }, { status: 400 })
    }

    const scheduledTime = new Date(appointment.scheduled_time)
    const timeDifferenceMs = scheduledTime.getTime() - now.getTime()
    const timeDifferenceMinutes = Math.floor(timeDifferenceMs / (1000 * 60))

    // Check if appointment has passed
    if (timeDifferenceMs < -60 * 60 * 1000) { // More than 1 hour past
      return NextResponse.json({
        success: false,
        message: 'Appointment time has passed',
        details: {
          scheduledTime: appointment.scheduled_time,
          currentTime: now.toISOString(),
          message: 'Please book a new appointment'
        }
      }, { status: 400 })
    }

    // Determine check-in type based on timing
    // On time: >=15 minutes before appointment OR within 15 minutes after
    // Late: More than 15 minutes after but less than 1 hour
    const isOnTime = timeDifferenceMinutes >= -15 // -15 means 15 minutes past scheduled time
    const checkInTime = now.toISOString()

    if (isOnTime) {
      // On-time check-in: Update appointment status to 'arrived'
      const { data: updatedAppointment, error: updateError } = await supabaseServer
        .from('appointments')
        .update({
          status: 'arrived',
          updated_at: checkInTime
        })
        .eq('id', appointment.id)
        .select('id, ticket_id, scheduled_time, status')
        .single()

      if (updateError) {
        console.error('Error updating appointment status:', updateError)
        return NextResponse.json({
          success: false,
          message: 'Failed to process check-in',
          error: updateError.message
        }, { status: 500 })
      }

      // Get updated queue status
      const queueStatus = await getQueueStatus()

      return NextResponse.json({
        success: true,
        message: 'Checked in successfully',
        checkInType: 'on-time',
        appointment: {
          ticketId: updatedAppointment.ticket_id,
          status: updatedAppointment.status,
          scheduledTime: updatedAppointment.scheduled_time,
          user: {
            name: user.name,
            phone: user.phone,
            email: user.email
          }
        },
        checkInTime,
        timing: {
          scheduledTime: appointment.scheduled_time,
          checkInTime,
          minutesFromScheduled: -timeDifferenceMinutes
        },
        queue: queueStatus,
        instructions: {
          message: 'You have been added to the queue',
          queueStatus: 'Please wait for your name to be called',
          estimatedWait: queueStatus.estimatedWait || 'To be determined'
        }
      }, { status: 200 })

    } else {
      // Late arrival: Create walk-in record and update appointment
      const { data: walkIn, error: walkInError } = await supabaseServer
        .from('walk_ins')
        .insert({
          user_id: appointment.user_id,
          check_in_time: checkInTime,
          status: 'waiting',
          original_appointment_id: appointment.id
        })
        .select('id, ticket_id, check_in_time, status')
        .single()

      if (walkInError) {
        console.error('Error creating walk-in record:', walkInError)
        return NextResponse.json({
          success: false,
          message: 'Failed to process late check-in',
          error: walkInError.message
        }, { status: 500 })
      }

      // Update original appointment status to indicate conversion
      const { error: appointmentUpdateError } = await supabaseServer
        .from('appointments')
        .update({
          status: 'converted_to_walkin',
          updated_at: checkInTime
        })
        .eq('id', appointment.id)

      if (appointmentUpdateError) {
        console.error('Error updating appointment after walk-in creation:', appointmentUpdateError)
        // Don't fail the request, walk-in was created successfully
      }

      // Get updated queue status
      const queueStatus = await getQueueStatus()

      return NextResponse.json({
        success: true,
        message: 'Late arrival - converted to walk-in',
        checkInType: 'late-walkin',
        walkIn: {
          ticketId: walkIn.ticket_id,
          status: walkIn.status,
          checkInTime: walkIn.check_in_time,
          originalAppointment: {
            ticketId: appointment.ticket_id,
            scheduledTime: appointment.scheduled_time
          },
          user: {
            name: user.name,
            phone: user.phone,
            email: user.email
          }
        },
        timing: {
          scheduledTime: appointment.scheduled_time,
          checkInTime,
          minutesLate: -timeDifferenceMinutes,
          lateBy: `${-timeDifferenceMinutes} minutes`
        },
        queue: queueStatus,
        instructions: {
          message: 'You have been added to the walk-in queue',
          queueStatus: 'Walk-ins are served after scheduled appointments',
          estimatedWait: 'Wait time depends on scheduled appointments ahead of you'
        }
      }, { status: 200 })
    }

  } catch (error) {
    console.error('Check-in API error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error during check-in',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to get current queue status
async function getQueueStatus() {
  try {
    const { data: queueData, error: queueError } = await supabaseServer
      .from('current_queue')
      .select('*')
      .order('queue_time')

    if (queueError) {
      console.error('Error fetching queue:', queueError)
      return {
        current: [],
        nowServing: null,
        totalInQueue: 0,
        totalAhead: 0,
        estimatedWait: 'Unable to determine'
      }
    }

    const nowServing = queueData?.[0] || null
    const totalInQueue = queueData?.length || 0
    
    // Estimate wait time (rough calculation: 15 minutes per person)
    const estimatedWaitMinutes = totalInQueue * 15
    const estimatedWait = totalInQueue === 0 
      ? 'You are next!' 
      : totalInQueue === 1 
      ? 'Approximately 15 minutes'
      : `Approximately ${estimatedWaitMinutes} minutes`

    return {
      current: queueData || [],
      nowServing: nowServing?.ticket_id || null,
      totalInQueue,
      totalAhead: Math.max(0, totalInQueue - 1),
      estimatedWait
    }
  } catch (error) {
    console.error('Error in getQueueStatus:', error)
    return {
      current: [],
      nowServing: null,
      totalInQueue: 0,
      totalAhead: 0,
      estimatedWait: 'Unable to determine'
    }
  }
} 