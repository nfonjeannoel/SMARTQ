import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface BusinessHours {
  id: string
  day_of_week: number
  is_open: boolean
  open_time: string | null
  close_time: string | null
  break_start: string | null
  break_end: string | null
  slot_duration: number
}

// GET - Fetch business hours
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('business_hours')
      .select('*')
      .order('day_of_week')

    if (error) {
      console.error('Error fetching business hours:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch business hours' },
        { status: 500 }
      )
    }

    // If no business hours exist, return default template for all 7 days
    if (!data || data.length === 0) {
      const defaultBusinessHours = []
      for (let day = 0; day <= 6; day++) {
        defaultBusinessHours.push({
          id: `temp-${day}`, // Temporary ID for frontend use
          day_of_week: day,
          is_open: day >= 1 && day <= 5, // Monday-Friday open, weekends closed
          open_time: day >= 1 && day <= 5 ? '09:00:00' : null,
          close_time: day >= 1 && day <= 5 ? '17:00:00' : null,
          break_start: null,
          break_end: null,
          slot_duration: 15
        })
      }
      
      return NextResponse.json({
        success: true,
        business_hours: defaultBusinessHours
      })
    }

    return NextResponse.json({
      success: true,
      business_hours: data || []
    })
  } catch (error) {
    console.error('Business hours fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

// PUT - Update business hours
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { business_hours } = body

    if (!Array.isArray(business_hours)) {
      return NextResponse.json(
        { success: false, message: 'Invalid business hours data' },
        { status: 400 }
      )
    }

    // Validate each business hours entry
    for (const hours of business_hours) {
      if (typeof hours.day_of_week !== 'number' || hours.day_of_week < 0 || hours.day_of_week > 6) {
        return NextResponse.json(
          { success: false, message: 'Invalid day of week' },
          { status: 400 }
        )
      }

      if (hours.is_open) {
        if (!hours.open_time || !hours.close_time) {
          return NextResponse.json(
            { success: false, message: 'Open and close times required when open' },
            { status: 400 }
          )
        }

        // Validate time format (HH:MM:SS)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/
        if (!timeRegex.test(hours.open_time) || !timeRegex.test(hours.close_time)) {
          return NextResponse.json(
            { success: false, message: 'Invalid time format' },
            { status: 400 }
          )
        }

        // Validate break times if provided
        if (hours.break_start && hours.break_end) {
          if (!timeRegex.test(hours.break_start) || !timeRegex.test(hours.break_end)) {
            return NextResponse.json(
              { success: false, message: 'Invalid break time format' },
              { status: 400 }
            )
          }
        }
      }

      if (typeof hours.slot_duration !== 'number' || hours.slot_duration < 5 || hours.slot_duration > 120) {
        return NextResponse.json(
          { success: false, message: 'Slot duration must be between 5 and 120 minutes' },
          { status: 400 }
        )
      }
    }

    // Use upsert to insert or update each business hours record
    const upsertData = []
    for (const hours of business_hours) {
      const recordData = {
        day_of_week: hours.day_of_week,
        is_open: hours.is_open,
        slot_duration: hours.slot_duration
      }

      if (hours.is_open) {
        recordData.open_time = hours.open_time
        recordData.close_time = hours.close_time
        
        // Handle 24-hour operation: if both times are 00:00:00, convert to 00:00:00 - 23:59:59
        if (hours.open_time === '00:00:00' && hours.close_time === '00:00:00') {
          recordData.open_time = '00:00:00'
          recordData.close_time = '23:59:59'
        }
        
        recordData.break_start = hours.break_start || null
        recordData.break_end = hours.break_end || null
      } else {
        recordData.open_time = null
        recordData.close_time = null
        recordData.break_start = null
        recordData.break_end = null
      }

      upsertData.push(recordData)
    }

    // Use upsert to handle both insert and update
    const { error } = await supabase
      .from('business_hours')
      .upsert(upsertData, { 
        onConflict: 'day_of_week',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Error upserting business hours:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to save business hours' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Business hours saved successfully'
    })
  } catch (error) {
    console.error('Business hours update error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
} 