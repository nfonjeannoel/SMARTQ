'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navigation } from '@/components'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Ticket, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Printer, 
  Download, 
  Home,
  CheckCircle,
  MapPin,
  AlertCircle
} from 'lucide-react'

interface AppointmentDetails {
  ticketId: string
  name: string
  phone?: string
  email?: string
  date: string
  time: string
  scheduledTime: string
  status: string
  queueNumber?: number
  queuePosition?: number
  estimatedWait?: string
}

export default function AppointmentDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const ticketId = params.ticketId as string
  
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get appointment details from sessionStorage (set during booking)
    const appointmentData = sessionStorage.getItem('appointmentDetails')
    if (appointmentData) {
      try {
        const data = JSON.parse(appointmentData)
        if (data.ticketId === ticketId) {
          setAppointment(data)
        } else {
          setError('Appointment not found')
        }
      } catch (err) {
        setError('Invalid appointment data')
      }
    } else {
      setError('Appointment details not available')
    }
    setLoading(false)
  }, [ticketId])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    // Create a printable version
    const printContent = `
      APPOINTMENT CONFIRMATION
      ========================
      
      Ticket ID: ${appointment?.ticketId}
      Name: ${appointment?.name}
      ${appointment?.phone ? `Phone: ${appointment.phone}` : ''}
      ${appointment?.email ? `Email: ${appointment.email}` : ''}
      
      Appointment Date: ${formatDate(appointment?.date || '')}
      Appointment Time: ${formatTime(appointment?.time || '')}
      Status: ${appointment?.status}
      
      IMPORTANT INSTRUCTIONS:
      - Arrive 15 minutes before your appointment time
      - Bring a valid ID
      - Use ticket ID for check-in: ${appointment?.ticketId}
      - If you're running late, please call to notify us
      
      Thank you for choosing our service!
    `
    
    const blob = new Blob([printContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `appointment-${appointment?.ticketId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ''
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'booked':
        return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>
      case 'arrived':
        return <Badge className="bg-green-100 text-green-800">Checked In</Badge>
      case 'served':
        return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  <h2 className="text-xl font-semibold text-red-900 dark:text-red-100">
                    Appointment Not Found
                  </h2>
                </div>
                <p className="text-red-700 dark:text-red-300 mb-4">
                  {error || 'The appointment details could not be found.'}
                </p>
                <Button onClick={() => router.push('/')} className="bg-blue-600 hover:bg-blue-700">
                  <Home className="h-4 w-4 mr-2" />
                  Return Home
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navigation customBackUrl="/book" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Appointment Confirmed
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Your appointment has been successfully booked
            </p>
          </div>

        {/* Success Banner */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-green-900">
                Booking Successful!
              </h2>
            </div>
            <p className="text-green-700">
              Please save your ticket ID: <span className="font-mono font-bold">{appointment.ticketId}</span>
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Appointment Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Appointment Details
                </CardTitle>
                <CardDescription>
                  Please keep this information for your records
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Ticket ID & Queue Number */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Ticket ID</p>
                      <p className="text-xl font-mono font-bold text-blue-600">{appointment.ticketId}</p>
                      {appointment.queueNumber && appointment.status === 'arrived' && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-green-900">Queue Number</p>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-lg font-bold bg-green-600 text-white">
                              #{appointment.queueNumber}
                            </span>
                            <span className="text-sm text-green-700">Your position in line</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-700">Status</p>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium">{appointment.name}</p>
                    </div>
                    {appointment.phone && (
                      <div>
                        <p className="text-sm text-gray-600">Phone Number</p>
                        <p className="font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {appointment.phone}
                        </p>
                      </div>
                    )}
                    {appointment.email && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Email Address</p>
                        <p className="font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {appointment.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Schedule Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Schedule Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-medium">{formatDate(appointment.date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Time</p>
                      <p className="font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {formatTime(appointment.time)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions & Instructions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handlePrint} className="w-full" variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Details
                </Button>
                <Button onClick={handleDownloadPDF} className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button 
                  onClick={() => router.push('/check-in')} 
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Check In
                </Button>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Important Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p>Arrive 15 minutes before your appointment time</p>
                </div>
                <div className="flex items-start gap-2">
                  <Ticket className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p>Use your ticket ID <span className="font-mono font-bold">{appointment.ticketId}</span> for check-in</p>
                </div>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p>Bring a valid government-issued ID</p>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p>If running late, please call to notify us</p>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p>Follow signs to the check-in counter upon arrival</p>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button 
                    onClick={() => router.push('/')} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Return Home
                  </Button>
                  <Button 
                    onClick={() => router.push('/book')} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </main>
    </div>
  )
} 