'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Clock, Users, AlertCircle, Loader2, Phone, Mail, Ticket } from 'lucide-react'

// Types for check-in flow
interface CheckInData {
  ticketId: string
  phone?: string
  email?: string
}

interface CheckInResponse {
  success: boolean
  message: string
  checkInType?: 'on-time' | 'late-walkin'
  appointment?: {
    ticketId: string
    status: string
    scheduledTime: string
    user: {
      name: string
      phone?: string
      email?: string
    }
  }
  walkIn?: {
    ticketId: string
    status: string
    checkInTime: string
    originalAppointment: {
      ticketId: string
      scheduledTime: string
    }
    user: {
      name: string
      phone?: string
      email?: string
    }
  }
  checkInTime?: string
  timing?: {
    scheduledTime: string
    checkInTime: string
    minutesFromScheduled?: number
    minutesLate?: number
    lateBy?: string
  }
  queue?: {
    current: any[]
    nowServing: string | null
    totalInQueue: number
    totalAhead: number
    estimatedWait: string
  }
  instructions?: {
    message: string
    queueStatus: string
    estimatedWait: string
  }
  errors?: any[]
  details?: any
}

export default function CheckInPage() {
  const [formData, setFormData] = useState<CheckInData>({
    ticketId: '',
    phone: '',
    email: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<CheckInResponse | null>(null)
  const [contactMethod, setContactMethod] = useState<'phone' | 'email'>('email')

  const handleInputChange = (field: keyof CheckInData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear previous response when user starts typing
    if (response) {
      setResponse(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.ticketId.trim()) {
      setResponse({
        success: false,
        message: 'Please enter your ticket ID',
        errors: [{ message: 'Ticket ID is required' }]
      })
      return
    }

    const contactInfo = contactMethod === 'phone' ? formData.phone : formData.email
    if (!contactInfo?.trim()) {
      setResponse({
        success: false,
        message: `Please enter your ${contactMethod}`,
        errors: [{ message: `${contactMethod} is required` }]
      })
      return
    }

    setIsLoading(true)
    
    try {
      const requestData: CheckInData = {
        ticketId: formData.ticketId.trim(),
        [contactMethod]: contactInfo.trim()
      }

      const apiResponse = await fetch('/api/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result: CheckInResponse = await apiResponse.json()
      setResponse(result)

    } catch (error) {
      setResponse({
        success: false,
        message: 'Unable to process check-in. Please try again.',
        errors: [{ message: error instanceof Error ? error.message : 'Network error' }]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ ticketId: '', phone: '', email: '' })
    setResponse(null)
  }

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return dateString
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Check-In
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Enter your ticket ID and contact information to check in for your appointment
          </p>
        </div>

        <div className="max-w-2xl mx-auto">

        {!response?.success ? (
          /* Check-In Form */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Patient Check-In
              </CardTitle>
              <CardDescription>
                Please provide your ticket ID and the contact information you used when booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Ticket ID */}
                <div className="space-y-2">
                  <Label htmlFor="ticketId">Ticket ID</Label>
                  <Input
                    id="ticketId"
                    type="text"
                    placeholder="e.g., A-1749478500-88cadbfd"
                    value={formData.ticketId}
                    onChange={(e) => handleInputChange('ticketId', e.target.value)}
                    className="font-mono"
                    disabled={isLoading}
                  />
                  <p className="text-sm text-gray-500">
                    Find this on your booking confirmation
                  </p>
                </div>

                {/* Contact Method Selection */}
                <div className="space-y-3">
                  <Label>Contact Information</Label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setContactMethod('email')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                        contactMethod === 'email'
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      disabled={isLoading}
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactMethod('phone')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                        contactMethod === 'phone'
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      disabled={isLoading}
                    >
                      <Phone className="h-4 w-4" />
                      Phone
                    </button>
                  </div>
                </div>

                {/* Contact Input */}
                <div className="space-y-2">
                  <Label htmlFor="contact">
                    {contactMethod === 'phone' ? 'Phone Number' : 'Email Address'}
                  </Label>
                  <Input
                    id="contact"
                    type={contactMethod === 'phone' ? 'tel' : 'email'}
                    placeholder={
                      contactMethod === 'phone' 
                        ? '+1234567890' 
                        : 'your.email@example.com'
                    }
                    value={contactMethod === 'phone' ? formData.phone : formData.email}
                    onChange={(e) => handleInputChange(contactMethod, e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-sm text-gray-500">
                    Use the same {contactMethod} you provided when booking
                  </p>
                </div>

                {/* Error Display */}
                {response && !response.success && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {response.message}
                      {response.details?.message && (
                        <div className="mt-1 text-sm">
                          {response.details.message}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking In...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Check In
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Success/Confirmation Display */
          <div className="space-y-6">
            {/* Success Message */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  {response.checkInType === 'late-walkin' ? 'Walk-In Check-In Complete' : 'Check-In Successful'}
                </CardTitle>
                <CardDescription>
                  {response.message}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Check-in Type Badge */}
                <div className="flex items-center gap-2">
                  <Badge variant={response.checkInType === 'late-walkin' ? 'secondary' : 'default'}>
                    {response.checkInType === 'late-walkin' ? 'Walk-In Patient' : 'Scheduled Appointment'}
                  </Badge>
                  {response.timing && (
                    <span className="text-sm text-gray-500">
                      {response.checkInType === 'late-walkin' 
                        ? `${response.timing.lateBy} late`
                        : `${Math.abs(response.timing.minutesFromScheduled || 0)} minutes ${(response.timing.minutesFromScheduled || 0) >= 0 ? 'early' : 'after scheduled time'}`
                      }
                    </span>
                  )}
                </div>

                {/* Patient Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Patient Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Name:</strong> {response.appointment?.user.name || response.walkIn?.user.name}</div>
                    <div><strong>Ticket ID:</strong> 
                      <span className="font-mono ml-1">
                        {response.appointment?.ticketId || response.walkIn?.ticketId}
                      </span>
                    </div>
                    {response.appointment && (
                      <div><strong>Scheduled Time:</strong> {formatTime(response.appointment.scheduledTime)} on {formatDate(response.appointment.scheduledTime)}</div>
                    )}
                    {response.walkIn && (
                      <div>
                        <strong>Original Appointment:</strong> {formatTime(response.walkIn.originalAppointment.scheduledTime)}
                        <br />
                        <strong>Check-In Time:</strong> {formatTime(response.walkIn.checkInTime)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                {response.instructions && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <div className="font-medium">{response.instructions.message}</div>
                        <div className="text-sm">{response.instructions.queueStatus}</div>
                        <div className="text-sm"><strong>Estimated wait:</strong> {response.instructions.estimatedWait}</div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Queue Status */}
            {response.queue && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Current Queue Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-blue-600">{response.queue.totalInQueue}</div>
                        <div className="text-sm text-blue-800">Total in Queue</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-green-600">{response.queue.totalAhead}</div>
                        <div className="text-sm text-green-800">Ahead of You</div>
                      </div>
                    </div>

                    {response.queue.nowServing && (
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-sm text-yellow-800">Now Serving</div>
                        <div className="font-mono font-bold text-yellow-900">
                          {response.queue.nowServing}
                        </div>
                      </div>
                    )}

                    <div className="text-center text-sm text-gray-600">
                      <strong>Estimated wait time:</strong> {response.queue.estimatedWait}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                onClick={resetForm} 
                variant="outline" 
                className="flex-1"
              >
                Check In Another Patient
              </Button>
              <Button asChild className="flex-1">
                <Link href="/">
                  Return to Home
                </Link>
              </Button>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  )
} 