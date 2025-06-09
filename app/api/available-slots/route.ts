import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

// Function to get business hours for a specific day
async function getBusinessHoursForDay(supabase: any, dayOfWeek: number) {
  const { data: businessHours, error } = await supabase
    .from('business_hours')
    .select('is_open, open_time, close_time, break_start, break_end, slot_duration')
    .eq('day_of_week', dayOfWeek)
    .single()

  if (error) {
    console.error('Error fetching business hours:', error)
    // Return default hours if there's an error
    return {
      is_open: true,
      open_time: '09:00',
      close_time: '17:00',
      break_start: null,
      break_end: null,
      slot_duration: 15
    }
  }

  return businessHours
}

// Function to generate time slots based on business hours
function generateTimeSlots(businessHours: any) {
  const slots: string[] = []
  
  if (!businessHours.is_open) {
    return slots
  }

  const [openHour, openMinute] = businessHours.open_time.split(':').slice(0, 2).map(Number)
  const [closeHour, closeMinute] = businessHours.close_time.split(':').slice(0, 2).map(Number)
  const slotDuration = businessHours.slot_duration || 15

  let currentTime = openHour * 60 + openMinute // Convert to minutes
  const endTime = closeHour * 60 + closeMinute

  // For 24-hour operations, limit to reasonable booking hours (6 AM to 10 PM)
  if (openHour === 0 && closeHour === 23) {
    currentTime = 6 * 60 // Start at 6 AM
    const limitedEndTime = 22 * 60 // End at 10 PM
    
    while (currentTime < limitedEndTime) {
      const hours = Math.floor(currentTime / 60)
      const minutes = currentTime % 60
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      
      slots.push(timeString)
      currentTime += slotDuration
    }
    
    return slots
  }

  // Handle break times if they exist
  let breakStart = null
  let breakEnd = null
  if (businessHours.break_start && businessHours.break_end) {
    const [breakStartHour, breakStartMinute] = businessHours.break_start.split(':').slice(0, 2).map(Number)
    const [breakEndHour, breakEndMinute] = businessHours.break_end.split(':').slice(0, 2).map(Number)
    breakStart = breakStartHour * 60 + breakStartMinute
    breakEnd = breakEndHour * 60 + breakEndMinute
  }

  while (currentTime < endTime) {
    // Skip break time slots
    if (breakStart && breakEnd && currentTime >= breakStart && currentTime < breakEnd) {
      currentTime += slotDuration
      continue
    }

    const hours = Math.floor(currentTime / 60)
    const minutes = currentTime % 60
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    
    slots.push(timeString)
    currentTime += slotDuration
  }

  return slots
}

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    // Validate date format
    const selectedDate = new Date(date)
    if (isNaN(selectedDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Don't allow booking for past dates
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    selectedDate.setHours(0, 0, 0, 0)
    
    if (selectedDate < today) {
      return NextResponse.json({
        success: true,
        date,
        slots: []
      })
    }

    // Get day of week from database to avoid timezone issues
    const { data: dayOfWeekData, error: dayOfWeekError } = await supabase
      .rpc('get_day_of_week', { input_date: date })

    let dayOfWeek
    if (dayOfWeekError || !dayOfWeekData) {
      // Fallback to JavaScript calculation if database function fails
      console.error('Error getting day of week from database:', dayOfWeekError)
      dayOfWeek = new Date(date + 'T12:00:00').getDay() // Use noon to avoid timezone issues
    } else {
      dayOfWeek = dayOfWeekData
    }

    // Get business hours for this day
    const businessHours = await getBusinessHoursForDay(supabase, dayOfWeek)

    // Generate all possible time slots for this day
    const allSlots = generateTimeSlots(businessHours)



    if (allSlots.length === 0) {
              return NextResponse.json({
          success: true,
          date,
          slots: []
        })
    }

    // Get existing appointments for this date
    const { data: existingAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('scheduled_time')
      .eq('date', date)
      .in('status', ['booked', 'arrived', 'serving']) // Don't count cancelled/completed appointments

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError)
      return NextResponse.json(
        { success: false, error: 'Failed to check existing appointments' },
        { status: 500 }
      )
    }

    // Create set of booked times for quick lookup
    const bookedTimes = new Set(
      existingAppointments?.map(apt => {
        const scheduledTime = new Date(apt.scheduled_time)
        const hours = scheduledTime.getHours().toString().padStart(2, '0')
        const minutes = scheduledTime.getMinutes().toString().padStart(2, '0')
        return `${hours}:${minutes}`
      }) || []
    )

    // Filter out past times for today
    const now = new Date()
    const isToday = selectedDate.getTime() === today.getTime()
    
    let availableSlots = allSlots.filter(slot => {
      // Skip if already booked
      if (bookedTimes.has(slot)) {
        return false
      }

      // If it's today, skip past times (with 15-minute buffer)
      if (isToday) {
        const [slotHour, slotMinute] = slot.split(':').map(Number)
        const slotTime = new Date()
        slotTime.setHours(slotHour, slotMinute, 0, 0)
        const minimumTime = new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes from now
        
        if (slotTime < minimumTime) {
          return false
        }
      }

      return true
    })

    // Format slots with additional metadata
    const formattedSlots = availableSlots.map(slot => {
      const [hours, minutes] = slot.split(':').map(Number)
      const date = new Date()
      date.setHours(hours, minutes, 0, 0)
      
      return {
        time: slot,
        label: date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        available: true,
        disabled: false
      }
    })

    return NextResponse.json({
      success: true,
      date,
      slots: formattedSlots,
      businessHours: {
        isOpen: businessHours.is_open,
        openTime: businessHours.open_time,
        closeTime: businessHours.close_time,
        slotDuration: businessHours.slot_duration
      }
    })

  } catch (error) {
    console.error('Available slots API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 