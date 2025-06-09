'use client'

// Admin Dashboard - Main admin interface for queue management
// Protected route that requires admin authentication

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components'
import BusinessHoursManager from '@/components/BusinessHoursManager'

interface QueueItem {
  id: string
  ticket_id: string
  type: 'appointment' | 'walk_in'
  name: string
  phone?: string
  email?: string
  queue_time: string
  status: string
  scheduled_time?: string
  check_in_time?: string
  original_appointment_id?: string
  position?: number
  estimatedWait?: string
  isNowServing?: boolean
  isNext?: boolean
}

interface AppointmentUser {
  id: string
  name: string
  phone?: string
  email?: string
  created_at?: string
}

interface Appointment {
  id: string
  date: string
  scheduled_time: string
  status: string
  ticket_id?: string
  created_at: string
  updated_at: string
  users: AppointmentUser
}

interface AppointmentStats {
  total: number
  booked: number
  arrived: number
  served: number
  noShow: number
  cancelled: number
}

interface WalkInStats {
  total: number
  pending: number
  arrived: number
  served: number
  cancelled: number
}

interface AppointmentsData {
  appointments: Appointment[]
  walkIns: any[]
  date: string
  stats: {
    appointments: AppointmentStats
    walkIns: WalkInStats
    combined: {
      total: number
      completed: number
      pending: number
    }
  }
}

interface AdminSession {
  authenticated: boolean
  email?: string
}

interface QueueState {
  currentlyServing: QueueItem | null
  queue: QueueItem[]
  totalWaiting: number
  lastUpdated: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [session, setSession] = useState<AdminSession | null>(null)
  const [queueState, setQueueState] = useState<QueueState>({
    currentlyServing: null,
    queue: [],
    totalWaiting: 0,
    lastUpdated: new Date().toISOString()
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'queue' | 'appointments' | 'settings' | 'user-lookup'>('queue')
  
  // Appointments state
  const [appointmentsData, setAppointmentsData] = useState<AppointmentsData | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [appointmentDetailsLoading, setAppointmentDetailsLoading] = useState(false)

  // User lookup state
  const [userLookupQuery, setUserLookupQuery] = useState('')
  const [userLookupResults, setUserLookupResults] = useState<any>(null)
  const [userLookupLoading, setUserLookupLoading] = useState(false)

  // Check admin session
  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/session', {
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.authenticated) {
        setSession({
          authenticated: true,
          email: data.session?.email
        })
      } else {
        // Redirect to login if not authenticated
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Session check failed:', error)
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  // Show message helper
  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000) // Clear after 5 seconds
  }, [])

  // Fetch current queue status
  const fetchQueue = useCallback(async () => {
    console.log('fetchQueue called')
    try {
      const response = await fetch('/api/admin/queue', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-cache'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch queue data')
      }
      
      const data = await response.json()
      console.log('Queue API response:', data)
      
      if (data.success && data.queue) {
        const newState = {
          currentlyServing: data.queue.nowServing || null,
          queue: Array.isArray(data.queue.current) ? data.queue.current : [],
          totalWaiting: data.queue.totalInQueue || 0,
          lastUpdated: new Date().toISOString()
        }
        console.log('Setting queue state:', newState)
        setQueueState(newState)
      } else {
        console.error('Queue API returned error:', data)
        // Handle API error response
        setQueueState(prev => ({
          ...prev,
          queue: [],
          totalWaiting: 0,
          lastUpdated: new Date().toISOString()
        }))
      }
    } catch (error) {
      console.error('Failed to fetch queue:', error)
      showMessage('error', 'Failed to fetch queue data')
      // Ensure queue is always an array even on error
      setQueueState(prev => ({
        ...prev,
        queue: [],
        totalWaiting: 0,
        lastUpdated: new Date().toISOString()
      }))
    }
      }, [showMessage])

  // Fetch appointments for a specific date
  const fetchAppointments = useCallback(async (date: string = selectedDate) => {
    setAppointmentsLoading(true)
    try {
      const response = await fetch(`/api/admin/appointments?date=${date}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-cache'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch appointments data')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setAppointmentsData(data.data)
      } else {
        showMessage('error', data.error || 'Failed to fetch appointments')
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
      showMessage('error', 'Failed to fetch appointments data')
    } finally {
      setAppointmentsLoading(false)
    }
  }, [selectedDate, showMessage])

  // Fetch appointment details
  const fetchAppointmentDetails = async (appointmentId: string) => {
    setAppointmentDetailsLoading(true)
    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-cache'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch appointment details')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setSelectedAppointment(data.data.appointment)
      } else {
        showMessage('error', data.error || 'Failed to fetch appointment details')
      }
    } catch (error) {
      console.error('Failed to fetch appointment details:', error)
      showMessage('error', 'Failed to fetch appointment details')
    } finally {
      setAppointmentDetailsLoading(false)
    }
  }

  // Mark patient as arrived
  const markAsArrived = async (ticketId: string, ticketType: 'appointment' | 'walk-in') => {
    setActionLoading(`mark-${ticketId}`)
    
    try {
      const response = await fetch('/api/admin/mark-arrived', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ticketId, ticketType })
      })
      
      const data = await response.json()
      
      if (data.success) {
        showMessage('success', 'Patient marked as arrived')
        await fetchQueue() // Refresh queue
      } else {
        console.error('Mark arrived API error:', data)
        showMessage('error', data.message || 'Failed to mark patient as arrived')
      }
    } catch (error) {
      console.error('Mark arrived failed:', error)
      showMessage('error', 'Failed to mark patient as arrived')
    } finally {
      setActionLoading(null)
    }
  }

  // Mark current patient as served (without calling next)
  const markAsServed = async () => {
    setActionLoading('mark-served')
    
    try {
      const response = await fetch('/api/admin/mark-served', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        showMessage('success', data.message || 'Patient marked as served')
        await fetchQueue() // Refresh queue
      } else {
        if (response.status === 404) {
          showMessage('error', 'No patient currently being served')
        } else {
          showMessage('error', data.message || 'Failed to mark patient as served')
        }
      }
    } catch (error) {
      console.error('Mark as served failed:', error)
      showMessage('error', 'Failed to mark patient as served')
    } finally {
      setActionLoading(null)
    }
  }

  // Call next patient (serve current and advance queue)
  const callNext = async () => {
    setActionLoading('call-next')
    
    try {
      const response = await fetch('/api/admin/call-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        showMessage('success', data.message || 'Patient served successfully')
        await fetchQueue() // Refresh queue
      } else {
        if (response.status === 404) {
          showMessage('error', 'No patients in queue to serve')
        } else {
          showMessage('error', data.message || 'Failed to call next patient')
        }
      }
    } catch (error) {
      console.error('Call next failed:', error)
      showMessage('error', 'Failed to call next patient')
    } finally {
      setActionLoading(null)
    }
  }

  // Logout
  const logout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout failed:', error)
      router.push('/admin/login')
    }
  }

  // Format time for display
  const formatTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return timeString
    }
  }

  // Format date for display
  const formatDate = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return timeString
    }
  }

  // Initialize component
  useEffect(() => {
    checkSession()
  }, [checkSession])

  // Set up auto-refresh for queue data
  useEffect(() => {
    if (session?.authenticated) {
      fetchQueue()
      
      // Auto-refresh every 15 seconds
      const interval = setInterval(fetchQueue, 15000)
      
      return () => clearInterval(interval)
    }
  }, [session, fetchQueue])

  // Fetch appointments when appointments tab is active or date changes
  useEffect(() => {
    if (session?.authenticated && activeTab === 'appointments') {
      fetchAppointments(selectedDate)
    }
  }, [session, activeTab, selectedDate, fetchAppointments])

  // User lookup function
  const searchUser = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUserLookupResults(null)
      return
    }

    setUserLookupLoading(true)
    try {
      const response = await fetch('/api/admin/search-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ query: query.trim() })
      })

      const data = await response.json()

      if (data.success) {
        setUserLookupResults(data.data)
      } else {
        showMessage('error', data.message || 'Failed to search for user')
        setUserLookupResults(null)
      }
    } catch (error) {
      console.error('User search failed:', error)
      showMessage('error', 'Failed to search for user')
      setUserLookupResults(null)
    } finally {
      setUserLookupLoading(false)
    }
  }, [showMessage])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Navigation showBackButton={false} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated (should redirect, but show fallback)
  if (!session?.authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Navigation showBackButton={false} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navigation showBackButton={false} />
      
      {/* Admin Header */}
      <div className="bg-white/80 backdrop-blur-md dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Queue Management</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Real-time admin dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Logged in as admin
              </span>
              <button
                onClick={logout}
                className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('queue')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'queue'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Queue Management
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'appointments'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Appointments
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Business Hours
              </button>
              <button
                onClick={() => setActiveTab('user-lookup')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'user-lookup'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                User Lookup
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4`}>
          <div className={`p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'queue' && (
          <div>
        {/* Queue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Currently Serving */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Now Serving</h3>
            {queueState.currentlyServing ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600">
                  {queueState.currentlyServing.ticket_id}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {queueState.currentlyServing.name}
                </div>
                <div className="text-sm text-gray-600">
                  {formatDate(queueState.currentlyServing.queue_time)} at {formatTime(queueState.currentlyServing.queue_time)}
                </div>
                <div className="text-sm text-gray-500">
                  {queueState.currentlyServing.type === 'appointment' ? 'Appointment' : 'Walk-in'}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">
                <div className="text-2xl font-bold">--</div>
                <div className="text-sm">No one being served</div>
              </div>
            )}
          </div>

          {/* Queue Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Queue Status</h3>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {queueState.totalWaiting}
              </div>
              <div className="text-sm text-gray-600">Total Waiting</div>
              <div className="text-xs text-gray-500">
                Last updated: {formatTime(queueState.lastUpdated)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              {/* Show Mark as Served button when someone is currently being served */}
              {queueState.currentlyServing && (
                <button
                  onClick={markAsServed}
                  disabled={actionLoading === 'mark-served'}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  {actionLoading === 'mark-served' ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </span>
                  ) : (
                    'Mark as Served'
                  )}
                </button>
              )}
              
              {/* Call Next Patient button - show when queue has waiting patients */}
              <button
                onClick={callNext}
                disabled={actionLoading === 'call-next' || (queueState.totalWaiting === 0 && !queueState.currentlyServing)}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                {actionLoading === 'call-next' ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </span>
                ) : queueState.currentlyServing ? (
                  'Mark Served & Call Next'
                ) : (
                  'Call Next Patient'
                )}
              </button>
              
              <button
                onClick={fetchQueue}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Refresh Queue
              </button>
            </div>
          </div>
        </div>

        {/* Queue List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Queue ({queueState.totalWaiting} waiting)</h3>
            <p className="text-sm text-gray-500">Patients in order of service</p>
          </div>
          
          <div className="overflow-hidden">
            {!queueState.queue || queueState.queue.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <div className="text-4xl mb-2">🏥</div>
                <p className="text-lg font-medium">No patients in queue</p>
                <p className="text-sm">Queue is empty - ready for new patients</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {queueState.queue.map((patient, index) => (
                  <div
                    key={patient.id}
                    className={`px-6 py-4 ${
                      index === 0 ? 'bg-blue-50' : 'hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            patient.type === 'appointment' ? 'bg-blue-600' : 'bg-green-600'
                          }`}>
                            {patient.type === 'appointment' ? 'A' : 'W'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {patient.ticket_id}
                            {index === 0 && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Next
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-700">
                            {patient.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(patient.queue_time)} at {formatTime(patient.queue_time)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {patient.type === 'appointment' ? 'Appointment' : 'Walk-in'} | Status: {patient.status}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {patient.status !== 'arrived' && (
                          <button
                            onClick={() => markAsArrived(patient.id, patient.type === 'walk_in' ? 'walk-in' : patient.type)}
                            disabled={actionLoading === `mark-${patient.id}`}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                          >
                            {actionLoading === `mark-${patient.id}` ? (
                              <span className="flex items-center">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                ...
                              </span>
                            ) : (
                              'Mark Arrived'
                            )}
                          </button>
                        )}
                        {patient.status === 'arrived' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Arrived
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div>
            {/* Date Selector and Stats */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Date Selector */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Select Date</h3>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => fetchAppointments(selectedDate)}
                    disabled={appointmentsLoading}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    {appointmentsLoading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Loading...
                      </span>
                    ) : (
                      'Load Appointments'
                    )}
                  </button>
                </div>

                {/* Appointment Stats */}
                {appointmentsData && (
                  <>
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Appointments</h3>
                      <div className="space-y-2">
                        <div className="text-2xl font-bold text-blue-600">
                          {appointmentsData.stats.appointments.total}
                        </div>
                        <div className="text-sm text-gray-600">Total Appointments</div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Booked: {appointmentsData.stats.appointments.booked}</div>
                          <div>Served: {appointmentsData.stats.appointments.served}</div>
                          <div>No-show: {appointmentsData.stats.appointments.noShow}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Walk-ins</h3>
                      <div className="space-y-2">
                        <div className="text-2xl font-bold text-green-600">
                          {appointmentsData.stats.walkIns.total}
                        </div>
                        <div className="text-sm text-gray-600">Total Walk-ins</div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Pending: {appointmentsData.stats.walkIns.pending}</div>
                          <div>Served: {appointmentsData.stats.walkIns.served}</div>
                          <div>Cancelled: {appointmentsData.stats.walkIns.cancelled}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Combined</h3>
                      <div className="space-y-2">
                        <div className="text-2xl font-bold text-purple-600">
                          {appointmentsData.stats.combined.total}
                        </div>
                        <div className="text-sm text-gray-600">Total Patients</div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Completed: {appointmentsData.stats.combined.completed}</div>
                          <div>Pending: {appointmentsData.stats.combined.pending}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Appointments List */}
            {appointmentsData && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Appointments for {new Date(appointmentsData.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {appointmentsData.appointments.length} appointment{appointmentsData.appointments.length !== 1 ? 's' : ''} scheduled
                  </p>
                </div>
                
                <div className="overflow-hidden">
                  {appointmentsData.appointments.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">
                      <div className="text-4xl mb-2">📅</div>
                      <p className="text-lg font-medium">No appointments for this date</p>
                      <p className="text-sm">Select a different date to view appointments</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {appointmentsData.appointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => fetchAppointmentDetails(appointment.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                                  appointment.status === 'booked' ? 'bg-blue-600' :
                                  appointment.status === 'arrived' ? 'bg-yellow-600' :
                                  appointment.status === 'served' ? 'bg-green-600' :
                                  appointment.status === 'no_show' ? 'bg-red-600' :
                                  'bg-gray-600'
                                }`}>
                                  A
                                </div>
                              </div>
                              <div>
                                <div className="text-lg font-medium text-gray-900">
                                  {appointment.users.name}
                                  {appointment.ticket_id && (
                                    <span className="ml-2 text-sm font-normal text-gray-600">
                                      ({appointment.ticket_id})
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {formatTime(appointment.scheduled_time)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {appointment.users.phone && (
                                    <span className="mr-4">📞 {appointment.users.phone}</span>
                                  )}
                                  {appointment.users.email && (
                                    <span>✉️ {appointment.users.email}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                appointment.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                                appointment.status === 'arrived' ? 'bg-yellow-100 text-yellow-800' :
                                appointment.status === 'served' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'no_show' ? 'bg-red-100 text-red-800' :
                                appointment.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {appointment.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  fetchAppointmentDetails(appointment.id)
                                }}
                                disabled={appointmentDetailsLoading}
                                className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed font-medium text-sm flex items-center"
                              >
                                {appointmentDetailsLoading ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                                    Loading...
                                  </>
                                ) : (
                                  'View Details →'
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loading State */}
            {appointmentsLoading && !appointmentsData && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading appointments...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <BusinessHoursManager />
        )}

        {activeTab === 'user-lookup' && (
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Find User by Email or Phone</h3>
                             <p className="text-sm text-gray-600 mb-4">
                 Search for a user by their email address or phone number to find their appointments and user ID.
               </p>
               <div className="bg-blue-50 p-4 rounded-lg mb-6">
                 <h4 className="text-sm font-medium text-blue-900 mb-2">Search Tips:</h4>
                 <ul className="text-sm text-blue-800 space-y-1">
                   <li>• Enter the complete email address or phone number for best results</li>
                   <li>• Partial matches are supported (e.g., search "john" to find "john@example.com")</li>
                   <li>• Phone numbers can include or exclude formatting (e.g., "+1234567890" or "1234567890")</li>
                   <li>• Search results show recent appointments and walk-ins from the last 30 days</li>
                 </ul>
               </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 mb-2">
                    Email or Phone Number
                  </label>
                                     <div className="flex space-x-3">
                     <div className="flex-1 relative">
                       <input
                         id="user-search"
                         type="text"
                         value={userLookupQuery}
                         onChange={(e) => setUserLookupQuery(e.target.value)}
                         placeholder="Enter email address or phone number..."
                         className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                         onKeyPress={(e) => {
                           if (e.key === 'Enter') {
                             searchUser(userLookupQuery)
                           }
                         }}
                       />
                       {userLookupQuery && (
                         <button
                           onClick={() => {
                             setUserLookupQuery('')
                             setUserLookupResults(null)
                           }}
                           className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                           title="Clear search"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                           </svg>
                         </button>
                       )}
                     </div>
                    <button
                      onClick={() => searchUser(userLookupQuery)}
                      disabled={userLookupLoading || !userLookupQuery.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                    >
                      {userLookupLoading ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Searching...
                        </span>
                      ) : (
                        'Search'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

                         {/* Search Results */}
             {userLookupResults && (
               <div className="bg-white rounded-lg shadow p-6">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-medium text-gray-900">Search Results</h3>
                   <div className="text-sm text-gray-500">
                     Found {userLookupResults.total} user(s) for "{userLookupResults.query}"
                   </div>
                 </div>
                
                {userLookupResults.users && userLookupResults.users.length > 0 ? (
                  <div className="space-y-6">
                    {userLookupResults.users.map((user: any) => (
                      <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* User Information */}
                          <div>
                            <h4 className="text-md font-medium text-gray-900 mb-3">User Information</h4>
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <span className="text-sm text-gray-500">User ID:</span>
                                <div className="flex items-center ml-2">
                                  <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                    {user.id}
                                  </p>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(user.id)
                                      showMessage('success', 'User ID copied to clipboard')
                                    }}
                                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Copy User ID"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500">Name:</span>
                                <p className="text-sm font-medium text-gray-900 inline-block ml-2">{user.name}</p>
                              </div>
                              {user.phone && (
                                <div>
                                  <span className="text-sm text-gray-500">Phone:</span>
                                  <p className="text-sm text-gray-900 inline-block ml-2">{user.phone}</p>
                                </div>
                              )}
                              {user.email && (
                                <div>
                                  <span className="text-sm text-gray-500">Email:</span>
                                  <p className="text-sm text-gray-900 inline-block ml-2">{user.email}</p>
                                </div>
                              )}
                              <div>
                                <span className="text-sm text-gray-500">Created:</span>
                                <p className="text-sm text-gray-900 inline-block ml-2">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Recent Appointments */}
                          <div>
                            <h4 className="text-md font-medium text-gray-900 mb-3">Recent Appointments</h4>
                            {user.appointments && user.appointments.length > 0 ? (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {user.appointments.map((appointment: any) => (
                                  <div key={appointment.id} className="bg-gray-50 p-3 rounded-md">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {appointment.ticket_id || appointment.id.substring(0, 8)}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          {new Date(appointment.scheduled_time).toLocaleDateString()} at{' '}
                                          {new Date(appointment.scheduled_time).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      </div>
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        appointment.status === 'served'
                                          ? 'bg-green-100 text-green-800'
                                          : appointment.status === 'arrived'
                                          ? 'bg-blue-100 text-blue-800'
                                          : appointment.status === 'booked'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : appointment.status === 'cancelled'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {appointment.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No appointments found</p>
                            )}
                          </div>
                        </div>

                        {/* Walk-ins if any */}
                        {user.walk_ins && user.walk_ins.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="text-md font-medium text-gray-900 mb-3">Recent Walk-ins</h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {user.walk_ins.map((walkIn: any) => (
                                <div key={walkIn.id} className="bg-gray-50 p-3 rounded-md">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {walkIn.ticket_id || walkIn.id.substring(0, 8)}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {new Date(walkIn.check_in_time).toLocaleDateString()} at{' '}
                                        {new Date(walkIn.check_in_time).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      walkIn.status === 'served'
                                        ? 'bg-green-100 text-green-800'
                                        : walkIn.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {walkIn.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                                 ) : (
                   <div className="text-center py-12">
                     <div className="text-gray-400 mb-4">
                       <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                       </svg>
                     </div>
                     <p className="text-lg text-gray-500 mb-2">No users found</p>
                     <p className="text-sm text-gray-400 mb-4">
                       No users match your search for "{userLookupResults.query}"
                     </p>
                     <div className="bg-gray-50 p-4 rounded-lg max-w-md mx-auto">
                       <h4 className="text-sm font-medium text-gray-700 mb-2">Try:</h4>
                       <ul className="text-sm text-gray-600 space-y-1 text-left">
                         <li>• Checking the spelling of the email or phone number</li>
                         <li>• Using a partial match (first few characters)</li>
                         <li>• Removing any special formatting from phone numbers</li>
                         <li>• Searching with an alternative contact method</li>
                       </ul>
                     </div>
                   </div>
                 )}
              </div>
            )}

            {/* Initial state */}
            {!userLookupResults && !userLookupLoading && (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-gray-500">Enter an email address or phone number to search for users.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Appointment Details Modal */}
      {(selectedAppointment || appointmentDetailsLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Appointment Details</h3>
              <button
                onClick={() => {
                  setSelectedAppointment(null)
                  setAppointmentDetailsLoading(false)
                }}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            {appointmentDetailsLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading appointment details...</p>
              </div>
            ) : selectedAppointment ? (
              <div className="p-6 space-y-6">
                {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Patient Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Name:</span>
                      <p className="text-sm font-medium text-gray-900">{selectedAppointment.users.name}</p>
                    </div>
                    {selectedAppointment.users.phone && (
                      <div>
                        <span className="text-sm text-gray-500">Phone:</span>
                        <p className="text-sm text-gray-900">{selectedAppointment.users.phone}</p>
                      </div>
                    )}
                    {selectedAppointment.users.email && (
                      <div>
                        <span className="text-sm text-gray-500">Email:</span>
                        <p className="text-sm text-gray-900">{selectedAppointment.users.email}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Appointment Details</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Date:</span>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedAppointment.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Time:</span>
                      <p className="text-sm text-gray-900">{formatTime(selectedAppointment.scheduled_time)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                        selectedAppointment.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                        selectedAppointment.status === 'arrived' ? 'bg-yellow-100 text-yellow-800' :
                        selectedAppointment.status === 'served' ? 'bg-green-100 text-green-800' :
                        selectedAppointment.status === 'no_show' ? 'bg-red-100 text-red-800' :
                        selectedAppointment.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedAppointment.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    {selectedAppointment.ticket_id && (
                      <div>
                        <span className="text-sm text-gray-500">Ticket ID:</span>
                        <p className="text-sm text-gray-900 font-mono">{selectedAppointment.ticket_id}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Timeline</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div>
                      <p className="text-sm text-gray-900">Appointment Created</p>
                      <p className="text-xs text-gray-500">
                        {new Date(selectedAppointment.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {selectedAppointment.updated_at !== selectedAppointment.created_at && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                      <div>
                        <p className="text-sm text-gray-900">Last Updated</p>
                        <p className="text-xs text-gray-500">
                          {new Date(selectedAppointment.updated_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      selectedAppointment.status === 'served' ? 'bg-green-600' :
                      selectedAppointment.status === 'arrived' ? 'bg-yellow-600' :
                      selectedAppointment.status === 'no_show' ? 'bg-red-600' :
                      selectedAppointment.status === 'cancelled' ? 'bg-gray-600' :
                      'bg-blue-600'
                    }`}></div>
                    <div>
                      <p className="text-sm text-gray-900">
                        Scheduled for {formatTime(selectedAppointment.scheduled_time)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(selectedAppointment.scheduled_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient History */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Patient History</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">
                    <div>Patient since: {new Date(selectedAppointment.users.created_at || selectedAppointment.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}</div>
                    <div className="mt-2 text-xs text-gray-500">
                      Patient ID: {selectedAppointment.users.id}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ) : null}
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setSelectedAppointment(null)
                  setAppointmentDetailsLoading(false)
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 