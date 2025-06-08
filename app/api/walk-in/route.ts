// POST /api/walk-in - Walk-in patient API
// Handles walk-in patients by claiming available slots or creating walk-in records

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { z } from 'zod'

// Request validation schema
const WalkInRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
}).refine(
  (data) => data.phone || data.email,
  {
    message: "Either phone or email must be provided",
    path: ["contact"],
  }
)

type WalkInRequest = z.infer<typeof WalkInRequestSchema>

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validationResult = WalkInRequestSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      }, { status: 400 })
    }

    const { name, phone, email } = validationResult.data
    const now = new Date()

    // Check if within business hours (9 AM - 5 PM)
    const currentHour = now.getHours()
    if (currentHour < 9 || currentHour >= 17) {
      return NextResponse.json({
        success: false,
        message: 'Walk-ins are only accepted during business hours (9:00 AM - 5:00 PM)',
        details: {
          currentTime: now.toISOString(),
          businessHours: '9:00 AM - 5:00 PM'
        }
      }, { status: 400 })
    }

    // Define search window: ±15 minutes from current time
    const searchWindowStart = new Date(now.getTime() - 15 * 60 * 1000) // 15 minutes ago
    const searchWindowEnd = new Date(now.getTime() + 15 * 60 * 1000)   // 15 minutes from now

    // Search for available appointment slots within the search window
    // Look for booked appointments that haven't been checked in (no one claimed the slot)
    const { data: availableSlots, error: searchError } = await supabaseServer
      .from('appointments')
      .select('id, ticket_id, scheduled_time, user_id, users(name, phone, email)')
      .eq('status', 'booked')
      .gte('scheduled_time', searchWindowStart.toISOString())
      .lte('scheduled_time', searchWindowEnd.toISOString())
      .order('scheduled_time')

    if (searchError) {
      console.error('Error searching for available slots:', searchError)
      return NextResponse.json({
        success: false,
        message: 'Failed to search for available appointment slots',
        error: searchError.message
      }, { status: 500 })
    }

    // Upsert user (create if doesn't exist, update if exists)
    let userId: string

    // First, try to find existing user by phone or email
    const { data: existingUsers, error: userSearchError } = await supabaseServer
      .from('users')
      .select('id, name, phone, email')
      .or(`phone.eq.${phone || 'null'},email.eq.${email || 'null'}`)

    if (userSearchError) {
      console.error('Error searching for existing user:', userSearchError)
      return NextResponse.json({
        success: false,
        message: 'Failed to process user information',
        error: userSearchError.message
      }, { status: 500 })
    }

    if (existingUsers && existingUsers.length > 0) {
      // Update existing user
      const existingUser = existingUsers[0]
      const { data: updatedUser, error: updateError } = await supabaseServer
        .from('users')
        .update({
          name,
          phone: phone || existingUser.phone,
          email: email || existingUser.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select('id')
        .single()

      if (updateError) {
        console.error('Error updating user:', updateError)
        return NextResponse.json({
          success: false,
          message: 'Failed to update user information',
          error: updateError.message
        }, { status: 500 })
      }

      userId = updatedUser.id
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseServer
        .from('users')
        .insert({
          name,
          phone,
          email
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.json({
          success: false,
          message: 'Failed to create user',
          error: createError.message
        }, { status: 500 })
      }

      userId = newUser.id
    }

    const checkInTime = now.toISOString()

    // Check if there are available slots to claim
    if (availableSlots && availableSlots.length > 0) {
      // Claim the earliest available slot
      const slotToClaim = availableSlots[0]
      
      // Update the appointment to assign it to the walk-in patient
      const { data: claimedAppointment, error: claimError } = await supabaseServer
        .from('appointments')
        .update({
          user_id: userId,
          status: 'arrived', // Walk-in immediately becomes arrived since they're here
          updated_at: checkInTime
        })
        .eq('id', slotToClaim.id)
        .select('id, ticket_id, scheduled_time, status')
        .single()

      if (claimError) {
        console.error('Error claiming appointment slot:', claimError)
        return NextResponse.json({
          success: false,
          message: 'Failed to claim available appointment slot',
          error: claimError.message
        }, { status: 500 })
      }

      // Get updated queue status
      const queueStatus = await getQueueStatus()

      return NextResponse.json({
        success: true,
        message: 'Appointment slot claimed successfully',
        type: 'slot-claimed',
        appointment: {
          ticketId: claimedAppointment.ticket_id,
          status: claimedAppointment.status,
          scheduledTime: claimedAppointment.scheduled_time,
          claimedAt: checkInTime,
          user: {
            name,
            phone,
            email
          }
        },
        timing: {
          scheduledTime: claimedAppointment.scheduled_time,
          claimedAt: checkInTime,
          slotWindow: 'Available slot within ±15 minutes'
        },
        queue: queueStatus,
        instructions: {
          message: 'You have claimed an available appointment slot',
          queueStatus: 'You are in the scheduled appointment queue',
          estimatedWait: queueStatus.estimatedWait || 'To be determined'
        }
      }, { status: 200 })

    } else {
      // No available slots - create walk-in record
      const { data: walkIn, error: walkInError } = await supabaseServer
        .from('walk_ins')
        .insert({
          user_id: userId,
          check_in_time: checkInTime,
          status: 'waiting',
          original_appointment_id: null // Pure walk-in, no original appointment
        })
        .select('id, ticket_id, check_in_time, status')
        .single()

      if (walkInError) {
        console.error('Error creating walk-in record:', walkInError)
        return NextResponse.json({
          success: false,
          message: 'Failed to create walk-in record',
          error: walkInError.message
        }, { status: 500 })
      }

      // Get updated queue status
      const queueStatus = await getQueueStatus()

      return NextResponse.json({
        success: true,
        message: 'Added to walk-in queue',
        type: 'walk-in-created',
        walkIn: {
          ticketId: walkIn.ticket_id,
          status: walkIn.status,
          checkInTime: walkIn.check_in_time,
          user: {
            name,
            phone,
            email
          }
        },
        timing: {
          checkInTime: walkIn.check_in_time,
          searchWindow: `${searchWindowStart.toISOString()} to ${searchWindowEnd.toISOString()}`,
          slotsChecked: 0
        },
        queue: queueStatus,
        instructions: {
          message: 'No appointment slots available - added to walk-in queue',
          queueStatus: 'Walk-ins are served after scheduled appointments',
          estimatedWait: 'Wait time depends on scheduled appointments ahead of you'
        }
      }, { status: 200 })
    }

  } catch (error) {
    console.error('Walk-in API error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error during walk-in processing',
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
        estimatedWait: 'Unable to determine',
        availableSlots: 0
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

    // Count scheduled appointments vs walk-ins
    const scheduledCount = queueData?.filter(item => item.type === 'appointment').length || 0
    const walkInCount = queueData?.filter(item => item.type === 'walk_in').length || 0

    return {
      current: queueData || [],
      nowServing: nowServing?.ticket_id || null,
      totalInQueue,
      totalAhead: Math.max(0, totalInQueue - 1),
      scheduledAppointments: scheduledCount,
      walkIns: walkInCount,
      estimatedWait
    }
  } catch (error) {
    console.error('Error in getQueueStatus:', error)
    return {
      current: [],
      nowServing: null,
      totalInQueue: 0,
      totalAhead: 0,
      scheduledAppointments: 0,
      walkIns: 0,
      estimatedWait: 'Unable to determine'
    }
  }
} 