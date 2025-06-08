'use client'

// Admin Dashboard - Main admin interface for queue management
// Protected route that requires admin authentication

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface QueueItem {
  id: string
  type: 'appointment' | 'walk-in'
  userId: string
  time: string
  patient?: {
    name: string
    phone?: string
    email?: string
  }
  status: string
  position: number
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
    try {
      const response = await fetch('/api/queue', {
        cache: 'no-cache'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch queue data')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setQueueState({
          currentlyServing: data.currentlyServing || null,
          queue: Array.isArray(data.queue) ? data.queue : [],
          totalWaiting: data.totalWaiting || 0,
          lastUpdated: new Date().toISOString()
        })
      } else {
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
        showMessage('error', data.message || 'Failed to mark patient as arrived')
      }
    } catch (error) {
      console.error('Mark arrived failed:', error)
      showMessage('error', 'Failed to mark patient as arrived')
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  // Not authenticated (should redirect, but show fallback)
  if (!session?.authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">SmartQ2 Queue Management</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Logged in as: <span className="font-medium">{session.email}</span>
              </span>
              <button
                onClick={logout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

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
        {/* Queue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Currently Serving */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Now Serving</h3>
            {queueState.currentlyServing ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600">
                  {queueState.currentlyServing.type === 'appointment' ? 'APT' : 'WLK'}
                  {queueState.currentlyServing.position || '1'}
                </div>
                <div className="text-sm text-gray-600">
                  {formatDate(queueState.currentlyServing.time)} at {formatTime(queueState.currentlyServing.time)}
                </div>
                <div className="text-sm text-gray-500">
                  ID: {queueState.currentlyServing.id.slice(0, 8)}...
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
              <button
                onClick={callNext}
                disabled={actionLoading === 'call-next' || queueState.totalWaiting === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                {actionLoading === 'call-next' ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </span>
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
                            {patient.type === 'appointment' ? 'Appointment' : 'Walk-in'} #{patient.position || index + 1}
                            {index === 0 && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Next
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(patient.time)} at {formatTime(patient.time)}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {patient.id.slice(0, 8)}... | Status: {patient.status}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {patient.status !== 'arrived' && (
                          <button
                            onClick={() => markAsArrived(patient.id, patient.type)}
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
      </main>
    </div>
  )
} 