import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth/admin'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const session = await getAdminSession(request)
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Admin access required'
      }, { status: 401 })
    }

    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = createServiceRoleClient()
    
    // Fetch appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        id,
        date,
        scheduled_time,
        status,
        ticket_id,
        created_at,
        updated_at,
        users (
          id,
          name,
          phone,
          email,
          created_at
        )
      `)
      .eq('id', id)
      .single()
    
    if (appointmentError) {
      if (appointmentError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Appointment not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching appointment:', appointmentError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch appointment details' },
        { status: 500 }
      )
    }
    
    // Check if there are any related walk-ins (if this appointment was converted)
    const { data: relatedWalkIns, error: walkInsError } = await supabase
      .from('walk_ins')
      .select(`
        id,
        check_in_time,
        status,
        ticket_id,
        created_at
      `)
      .eq('original_appointment_id', id)
    
    if (walkInsError) {
      console.error('Error fetching related walk-ins:', walkInsError)
      // Continue without walk-ins data
    }
    
    return NextResponse.json({
      success: true,
      data: {
        appointment,
        relatedWalkIns: relatedWalkIns || []
      }
    })
    
  } catch (error) {
    console.error('Appointment details API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 