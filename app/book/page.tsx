'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookingForm } from '@/components/BookingForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Clock, CheckCircle, Users, Calendar, Phone, Mail, Ticket, ArrowLeft } from 'lucide-react'

// Types for booking flow
interface BookingData {
  name: string
  phone?: string
  email?: string
  date: string
  time: string
}

interface BookingConfirmation {
  success: boolean
  message: string
  appointment?: {
    ticketId: string
    scheduledTime: string
    date: string
    time: string
    status: string
  }
  user?: {
    name: string
    phone?: string
    email?: string
  }
  queue?: {
    current: any[]
    nowServing: string | null
    totalAhead: number
  }
  instructions?: {
    checkIn: string
    late: string
    contact: string
  }
}

interface QueueStatus {
  nowServing: string | null
  totalInQueue: number
  estimatedWait: string
  lastUpdated: Date
}

export default function BookingPage() {
  const router = useRouter()
  const [bookingStep, setBookingStep] = useState<'form' | 'confirmation'>('form')
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Function to fetch current queue status
  const fetchQueueStatus = async () => {
    try {
      const response = await fetch('/api/queue', {
        cache: 'no-cache'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch queue status')
      }
      
      const data = await response.json()
      
      if (data.success && data.queue) {
        const queueStatus: QueueStatus = {
          nowServing: data.queue.nowServing?.ticket_id || null,
          totalInQueue: data.queue.totalInQueue || 0,
          estimatedWait: data.queue.estimatedWait || 'No wait',
          lastUpdated: new Date()
        }
        setQueueStatus(queueStatus)
      } else {
        // If no queue data, show empty state
        setQueueStatus({
          nowServing: null,
          totalInQueue: 0,
          estimatedWait: 'No wait',
          lastUpdated: new Date()
        })
      }
    } catch (error) {
      console.error('Failed to fetch queue status:', error)
      // Fallback to empty state on error
      setQueueStatus({
        nowServing: null,
        totalInQueue: 0,
        estimatedWait: 'No wait',
        lastUpdated: new Date()
      })
    }
  }

  // Load queue status on component mount and set up periodic updates
  useEffect(() => {
    fetchQueueStatus()
    const interval = setInterval(fetchQueueStatus, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Handle booking form submission
  const handleBookingSubmit = async (data: BookingData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result: BookingConfirmation = await response.json()

      if (result.success) {
        // Store appointment details for the confirmation page
        const appointmentDetails = {
          ticketId: result.appointment?.ticketId,
          name: data.name,
          phone: data.phone,
          email: data.email,
          date: data.date,
          time: data.time,
          scheduledTime: result.appointment?.scheduledTime,
          status: result.appointment?.status || 'booked'
        }
        
        // Store in sessionStorage for the appointment details page
        sessionStorage.setItem('appointmentDetails', JSON.stringify(appointmentDetails))
        
        // Redirect to appointment details page
        router.push(`/appointment/${result.appointment?.ticketId}`)
      } else {
        setError(result.message || 'Failed to book appointment')
      }
    } catch (error) {
      console.error('Booking submission error:', error)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle starting a new booking
  const handleNewBooking = () => {
    setBookingStep('form')
    setBookingData(null)
    setConfirmation(null)
    setError(null)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Book Your Appointment
          </h1>
          <p className="text-gray-600">
            Schedule your visit and get a guaranteed time slot
          </p>
        </div>

        {/* Live Queue Status */}
        {queueStatus && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Users className="h-5 w-5" />
                Current Queue Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Now Serving
                  </Badge>
                  <span className="font-mono">{queueStatus.nowServing || 'None'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>{queueStatus.totalInQueue} people in queue</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>Est. wait: {queueStatus.estimatedWait}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Last updated: {queueStatus.lastUpdated.toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {bookingStep === 'form' ? (
          /* Booking Form */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Appointment
              </CardTitle>
              <CardDescription>
                Select your preferred date and time, then provide your contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              
              <BookingForm
                onSubmit={handleBookingSubmit}
                isSubmitting={isSubmitting}
                className="space-y-6"
              />
            </CardContent>
          </Card>
        ) : (
          /* Confirmation Display */
          <div className="space-y-6">
            {/* Success Message */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-green-900">
                    Appointment Confirmed!
                  </h2>
                </div>
                <p className="text-green-700">
                  Your appointment has been successfully scheduled.
                </p>
              </CardContent>
            </Card>

            {/* Appointment Details */}
            {confirmation?.appointment && bookingData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Appointment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Ticket ID */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Ticket ID</p>
                        <p className="text-lg font-mono font-bold text-gray-900">
                          {confirmation.appointment.ticketId}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {confirmation.appointment.status}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Date</p>
                        <p className="font-semibold">{formatDate(bookingData.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Time</p>
                        <p className="font-semibold">{formatTime(bookingData.time)}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Information */}
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Contact Information</p>
                    <div className="space-y-2">
                      <p className="font-semibold">{confirmation.user?.name}</p>
                      {confirmation.user?.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          {confirmation.user.phone}
                        </div>
                      )}
                      {confirmation.user?.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {confirmation.user.email}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            {confirmation?.instructions && (
              <Card>
                <CardHeader>
                  <CardTitle>Important Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Check-in:</strong> {confirmation.instructions.checkIn}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Late Arrival:</strong> {confirmation.instructions.late}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Ticket ID:</strong> {confirmation.instructions.contact}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Queue Position */}
            {confirmation?.queue && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Queue Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">People ahead of you</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {confirmation.queue.totalAhead}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Currently serving</p>
                      <p className="font-mono text-sm">
                        {confirmation.queue.nowServing || 'None'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleNewBooking}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Book Another Appointment
              </Button>
              <Button asChild>
                <a href="/check-in" className="flex items-center gap-2">
                  Go to Check-in
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Additional Information */}
        <Card className="mt-8 bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Appointments are available 9:00 AM - 5:00 PM in 15-minute intervals</p>
              <p>• Please arrive at least 15 minutes before your scheduled time</p>
              <p>• Late arrivals may be converted to walk-in status</p>
              <p>• Keep your ticket ID for check-in and reference</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 