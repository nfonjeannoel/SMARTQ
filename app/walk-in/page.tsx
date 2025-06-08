'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Clock, Users, AlertCircle, Loader2, ArrowLeft, Phone, Mail, UserPlus, Calendar, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

// Types for walk-in flow
interface WalkInData {
  name: string
  phone?: string
  email?: string
}

interface WalkInResponse {
  success: boolean
  message: string
  type?: 'slot-claimed' | 'walk-in-created'
  ticket?: {
    ticketId: string
    status: string
    user: {
      name: string
      phone?: string
      email?: string
    }
    claimedSlot?: {
      originalTicketId: string
      scheduledTime: string
    }
    walkInTime?: string
  }
  queue?: {
    current: any[]
    nowServing: string | null
    totalInQueue: number
    position: number
    estimatedWait: string
  }
  instructions?: {
    message: string
    queueStatus: string
    estimatedWait: string
  }
  businessHours?: {
    isOpen: boolean
    openTime: string
    closeTime: string
  }
  errors?: any[]
}

interface QueueStatus {
  success: boolean
  queue?: {
    totalInQueue: number
    appointmentsInQueue: number
    walkInsInQueue: number
    nowServing: any
    estimatedWait: string
  }
  metadata?: {
    businessHours: {
      currentlyOpen: boolean
      open: string
      close: string
    }
  }
}

export default function WalkInPage() {
  const [formData, setFormData] = useState<WalkInData>({
    name: '',
    phone: '',
    email: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<WalkInResponse | null>(null)
  const [contactMethod, setContactMethod] = useState<'phone' | 'email'>('email')
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null)
  const [isLoadingQueue, setIsLoadingQueue] = useState(false)

  // Fetch live queue status
  const fetchQueueStatus = async () => {
    setIsLoadingQueue(true)
    try {
      const response = await fetch('/api/queue')
      const result = await response.json()
      setQueueStatus(result)
    } catch (error) {
      console.error('Failed to fetch queue status:', error)
    } finally {
      setIsLoadingQueue(false)
    }
  }

  // Load queue status on mount and every 15 seconds
  useEffect(() => {
    fetchQueueStatus()
    const interval = setInterval(fetchQueueStatus, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleInputChange = (field: keyof WalkInData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear previous response when user starts typing
    if (response) {
      setResponse(null)
    }
  }

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Please enter your name'
    }

    const contactInfo = contactMethod === 'phone' ? formData.phone : formData.email
    if (!contactInfo?.trim()) {
      return `Please enter your ${contactMethod}`
    }

    if (contactMethod === 'email' && !contactInfo.includes('@')) {
      return 'Please enter a valid email address'
    }

    if (contactMethod === 'phone' && contactInfo.length < 10) {
      return 'Please enter a valid phone number'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setResponse({
        success: false,
        message: validationError,
        errors: [{ message: validationError }]
      })
      return
    }

    setIsLoading(true)
    
    try {
      const requestData: WalkInData = {
        name: formData.name.trim(),
        [contactMethod]: (contactMethod === 'phone' ? formData.phone : formData.email)?.trim()
      }

      const apiResponse = await fetch('/api/walk-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result: WalkInResponse = await apiResponse.json()
      setResponse(result)

      // Refresh queue status after successful walk-in
      if (result.success) {
        setTimeout(fetchQueueStatus, 1000)
      }

    } catch (error) {
      setResponse({
        success: false,
        message: 'Unable to register walk-in. Please try again.',
        errors: [{ message: error instanceof Error ? error.message : 'Network error' }]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '' })
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

  const isBusinessHours = queueStatus?.metadata?.businessHours?.currentlyOpen ?? true

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Walk-In Registration</h1>
          <p className="text-gray-600">
            No appointment? No problem! We'll try to find you an available slot or add you to the walk-in queue.
          </p>
        </div>

        {/* Business Hours Alert */}
        {!isBusinessHours && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Outside Business Hours:</strong> We're currently closed (Hours: {queueStatus?.metadata?.businessHours?.open} - {queueStatus?.metadata?.businessHours?.close}). 
              Walk-in registration is only available during business hours.
            </AlertDescription>
          </Alert>
        )}

        {/* Live Queue Status */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Users className="h-5 w-5" />
              Current Queue Status
              {isLoadingQueue && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {queueStatus ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">
                    {queueStatus.queue?.totalInQueue || 0}
                  </div>
                  <div className="text-sm text-blue-600">Total in Queue</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-700">
                    {queueStatus.queue?.estimatedWait || 'No wait'}
                  </div>
                  <div className="text-sm text-blue-600">Estimated Wait</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-700">
                    {queueStatus.queue?.appointmentsInQueue || 0}
                  </div>
                  <div className="text-sm text-green-600">Appointments</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-700">
                    {queueStatus.queue?.walkInsInQueue || 0}
                  </div>
                  <div className="text-sm text-orange-600">Walk-ins</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">Loading queue status...</div>
            )}
            
            {queueStatus?.queue?.nowServing && (
              <div className="text-center pt-2 border-t border-blue-200">
                <Badge variant="outline" className="bg-green-100 border-green-300 text-green-800">
                  Now Serving: {queueStatus.queue.nowServing.ticket_id || 'Next Patient'}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {!response?.success ? (
          /* Walk-In Registration Form */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Register as Walk-In
              </CardTitle>
              <CardDescription>
                Enter your information below. We'll search for available appointment slots first, or add you to the walk-in queue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={isLoading || !isBusinessHours}
                    className="w-full"
                  />
                </div>

                {/* Contact Method Toggle */}
                <div className="space-y-3">
                  <Label>Contact Information *</Label>
                  <div className="flex gap-2 mb-3">
                    <Button
                      type="button"
                      variant={contactMethod === 'email' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setContactMethod('email')}
                      disabled={isLoading || !isBusinessHours}
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                    <Button
                      type="button"
                      variant={contactMethod === 'phone' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setContactMethod('phone')}
                      disabled={isLoading || !isBusinessHours}
                      className="flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      Phone
                    </Button>
                  </div>

                  {contactMethod === 'email' ? (
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={isLoading || !isBusinessHours}
                      className="w-full"
                    />
                  ) : (
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={isLoading || !isBusinessHours}
                      className="w-full"
                    />
                  )}
                </div>

                {/* How it Works */}
                <Alert className="border-gray-200 bg-gray-50">
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    <strong>How it works:</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• We'll search for available appointment slots first</li>
                      <li>• If slots are available, you'll get an appointment time</li>
                      <li>• Otherwise, you'll join the walk-in queue</li>
                      <li>• You'll receive a ticket number either way</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading || !isBusinessHours}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Register as Walk-In
                    </>
                  )}
                </Button>
              </form>

              {/* Error Display */}
              {response && !response.success && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {response.message}
                    {response.errors && response.errors.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {response.errors.map((error, index) => (
                          <li key={index}>• {error.message}</li>
                        ))}
                      </ul>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Success Display */
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-green-900">
                {response.type === 'slot-claimed' ? 'Appointment Slot Claimed!' : 'Added to Walk-In Queue!'}
              </CardTitle>
              <CardDescription className="text-green-700">
                {response.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ticket Information */}
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Your Ticket ID</div>
                  <div className="text-3xl font-bold text-gray-900 mb-4">
                    {response.ticket?.ticketId}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 text-left">
                    <div>
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">{response.ticket?.user?.name}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Contact:</span>
                      <span className="ml-2 font-medium">
                        {response.ticket?.user?.email || response.ticket?.user?.phone}
                      </span>
                    </div>
                    
                    {response.type === 'slot-claimed' && response.ticket?.claimedSlot && (
                      <div>
                        <span className="text-sm text-gray-600">Appointment Time:</span>
                        <span className="ml-2 font-medium text-green-700">
                          {formatTime(response.ticket.claimedSlot.scheduledTime)}
                        </span>
                      </div>
                    )}
                    
                    {response.type === 'walk-in-created' && response.ticket?.walkInTime && (
                      <div>
                        <span className="text-sm text-gray-600">Check-in Time:</span>
                        <span className="ml-2 font-medium">
                          {formatTime(response.ticket.walkInTime)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Queue Status */}
              {response.queue && (
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Queue Status
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Your Position:</span>
                      <span className="ml-2 font-bold text-blue-600">
                        #{response.queue.position}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total in Queue:</span>
                      <span className="ml-2 font-medium">{response.queue.totalInQueue}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Estimated Wait:</span>
                      <span className="ml-2 font-medium text-orange-600">
                        {response.queue.estimatedWait}
                      </span>
                    </div>
                  </div>
                  
                  {response.queue.nowServing && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Badge variant="outline" className="bg-green-100 border-green-300 text-green-800">
                        Now Serving: {response.queue.nowServing}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Instructions */}
              {response.instructions && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>What's Next:</strong>
                    <div className="mt-2 space-y-1">
                      <p>{response.instructions.message}</p>
                      <p className="text-sm">{response.instructions.queueStatus}</p>
                      <p className="text-sm font-medium">{response.instructions.estimatedWait}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={resetForm} 
                  variant="outline" 
                  className="flex-1"
                >
                  Register Another Walk-In
                </Button>
                <Link href="/" className="flex-1">
                  <Button className="w-full">
                    Return to Home
                  </Button>
                </Link>
              </div>

              {/* Important Notice */}
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Please save your ticket ID:</strong> {response.ticket?.ticketId}
                  <br />
                  You'll need this to check your status or when you're called for service.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 