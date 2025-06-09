import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth/admin'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getAdminSession(request)
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Admin access required'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    // Default to today if no date is provided
    const targetDate = date || new Date().toISOString().split('T')[0]
    
    const supabase = createServiceRoleClient()
    
    // Query appointments for the specified date
    const { data: appointments, error: appointmentsError } = await supabase
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
          email
        )
      `)
      .eq('date', targetDate)
      .order('scheduled_time', { ascending: true })
    
    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch appointments' },
        { status: 500 }
      )
    }
    
    // Calculate statistics
    const stats = {
      total: appointments?.length || 0,
      booked: appointments?.filter(apt => apt.status === 'booked').length || 0,
      arrived: appointments?.filter(apt => apt.status === 'arrived').length || 0,
      served: appointments?.filter(apt => apt.status === 'served').length || 0,
      noShow: appointments?.filter(apt => apt.status === 'no_show').length || 0,
      cancelled: appointments?.filter(apt => apt.status === 'cancelled').length || 0
    }
    
    // Also get walk-ins for the same date for additional context
    const { data: walkIns, error: walkInsError } = await supabase
      .from('walk_ins')
      .select(`
        id,
        check_in_time,
        status,
        ticket_id,
        created_at,
        users (
          id,
          name,
          phone,
          email
        )
      `)
      .gte('check_in_time', `${targetDate}T00:00:00.000Z`)
      .lt('check_in_time', `${targetDate}T23:59:59.999Z`)
      .order('check_in_time', { ascending: true })
    
    if (walkInsError) {
      console.error('Error fetching walk-ins:', walkInsError)
      // Continue without walk-ins data if there's an error
    }
    
    const walkInStats = {
      total: walkIns?.length || 0,
      pending: walkIns?.filter(wi => wi.status === 'pending').length || 0,
      arrived: walkIns?.filter(wi => wi.status === 'arrived').length || 0,
      served: walkIns?.filter(wi => wi.status === 'served').length || 0,
      cancelled: walkIns?.filter(wi => wi.status === 'cancelled').length || 0
    }
    
    return NextResponse.json({
      success: true,
      data: {
        appointments: appointments || [],
        walkIns: walkIns || [],
        date: targetDate,
        stats: {
          appointments: stats,
          walkIns: walkInStats,
          combined: {
            total: stats.total + walkInStats.total,
            completed: stats.served + walkInStats.served,
            pending: stats.booked + stats.arrived + walkInStats.pending + walkInStats.arrived
          }
        }
      }
    })
    
  } catch (error) {
    console.error('Appointments API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 