// POST /api/book - Appointment booking API
// Handles appointment creation with validation and conflict checking

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { z } from 'zod'

// Request validation schema
const BookingRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
}).refine(
  (data) => data.phone || data.email,
  {
    message: "Either phone or email must be provided",
    path: ["contact"],
  }
)

type BookingRequest = z.infer<typeof BookingRequestSchema>

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validationResult = BookingRequestSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      }, { status: 400 })
    }

    const { name, phone, email, date, time } = validationResult.data

    // Create scheduled_time timestamp
    const scheduledTime = new Date(`${date}T${time}:00`)
    const now = new Date()

    // Validate appointment is not in the past (with 15-minute buffer)
    const minimumTime = new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes from now
    if (scheduledTime < minimumTime) {
      return NextResponse.json({
        success: false,
        message: 'Appointment must be scheduled at least 15 minutes in the future',
        details: {
          requestedTime: scheduledTime.toISOString(),
          minimumTime: minimumTime.toISOString()
        }
      }, { status: 400 })
    }

    // Validate business hours (9 AM - 5 PM)
    const hour = scheduledTime.getHours()
    const minute = scheduledTime.getMinutes()
    
    if (hour < 9 || hour >= 17 || minute % 15 !== 0) {
      return NextResponse.json({
        success: false,
        message: 'Appointments are only available during business hours (9:00 AM - 5:00 PM) in 15-minute intervals',
        details: {
          requestedTime: `${time}`,
          validTimes: 'Times must be on 15-minute intervals (e.g., 09:00, 09:15, 09:30, etc.)'
        }
      }, { status: 400 })
    }

    // Check for existing appointments in the same 15-minute slot
    const { data: existingAppointments, error: checkError } = await supabaseServer
      .from('appointments')
      .select('id, ticket_id')
      .eq('scheduled_time', scheduledTime.toISOString())
      .in('status', ['booked', 'arrived'])

    if (checkError) {
      console.error('Error checking existing appointments:', checkError)
      return NextResponse.json({
        success: false,
        message: 'Failed to check appointment availability',
        error: checkError.message
      }, { status: 500 })
    }

    if (existingAppointments && existingAppointments.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'This time slot is already booked',
        details: {
          requestedTime: scheduledTime.toISOString(),
          conflictingTicket: existingAppointments[0].ticket_id
        }
      }, { status: 409 })
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

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabaseServer
      .from('appointments')
      .insert({
        user_id: userId,
        date: date,
        scheduled_time: scheduledTime.toISOString(),
        status: 'booked'
      })
      .select('id, ticket_id, scheduled_time')
      .single()

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError)
      return NextResponse.json({
        success: false,
        message: 'Failed to create appointment',
        error: appointmentError.message
      }, { status: 500 })
    }

    // Get current queue snapshot
    const { data: queueData, error: queueError } = await supabaseServer
      .from('current_queue')
      .select('*')
      .order('queue_time')

    if (queueError) {
      console.error('Error fetching queue:', queueError)
      // Don't fail the booking, just return without queue info
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: {
        ticketId: appointment.ticket_id,
        scheduledTime: appointment.scheduled_time,
        date: date,
        time: time,
        status: 'booked'
      },
      user: {
        name,
        phone,
        email
      },
      queue: {
        current: queueData || [],
        nowServing: queueData?.[0]?.ticket_id || null,
        totalAhead: queueData?.length || 0
      },
      instructions: {
        checkIn: 'Please arrive at least 15 minutes before your appointment time',
        late: 'Late arrivals may be converted to walk-in status',
        contact: 'Keep your ticket ID for check-in'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Booking API error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error during booking',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 