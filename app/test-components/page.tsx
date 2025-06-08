'use client'

import React, { useState } from 'react'
import { BookingForm } from '@/components/BookingForm'

interface BookingResult {
  success: boolean
  appointment?: {
    ticketId: string
    scheduledTime: string
    date: string
    time: string
    status: string
  }
  user?: {
    name: string
    phone: string
    email: string
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
  message?: string
  error?: string
}

export default function TestComponentsPage() {
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)
  const [showBookingForm, setShowBookingForm] = useState(true)

  const handleBookingComplete = (result: BookingResult) => {
    console.log('Booking completed:', result)
    setBookingResult(result)
    setShowBookingForm(false)
  }

  const handleStartOver = () => {
    setBookingResult(null)
    setShowBookingForm(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SmartQ2 Booking Components Test
          </h1>
          <p className="text-gray-600">
            Testing the Calendar, TimeSlotPicker, and BookingForm components
          </p>
        </div>

        {/* Booking Form or Success Message */}
        {showBookingForm ? (
          <div>
            <BookingForm onBookingComplete={handleBookingComplete} />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {/* Success Message */}
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Appointment Booked Successfully!
              </h2>
              
              {bookingResult?.appointment && (
                <div className="space-y-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Your Ticket</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {bookingResult.appointment.ticketId}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Keep this ticket ID for check-in
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Appointment Details</h3>
                    <p className="text-gray-700">
                      {new Date(bookingResult.appointment.scheduledTime).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                    {bookingResult.user && (
                      <p className="text-gray-600 mt-1">
                        {bookingResult.user.name}
                      </p>
                    )}
                  </div>
                  
                  {bookingResult.queue && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h3 className="font-semibold text-yellow-900 mb-2">Queue Status</h3>
                      <p className="text-yellow-700">
                        {bookingResult.queue.totalAhead > 0 
                          ? `${bookingResult.queue.totalAhead} people ahead of you`
                          : 'You are next in line!'
                        }
                      </p>
                      {bookingResult.queue.nowServing && (
                        <p className="text-yellow-600 text-sm mt-1">
                          Now serving: {bookingResult.queue.nowServing}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {bookingResult.instructions && (
                    <div className="bg-green-50 rounded-lg p-4 text-left">
                      <h3 className="font-semibold text-green-900 mb-2">Important Instructions</h3>
                      <ul className="text-green-700 text-sm space-y-1">
                        <li>• {bookingResult.instructions.checkIn}</li>
                        <li>• {bookingResult.instructions.late}</li>
                        <li>• {bookingResult.instructions.contact}</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={handleStartOver}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Book Another Appointment
              </button>
            </div>
          </div>
        )}

        {/* Debug Information */}
        {bookingResult && (
          <div className="mt-8 max-w-4xl mx-auto">
            <details className="bg-white rounded-lg shadow p-4">
              <summary className="cursor-pointer font-medium text-gray-900 mb-2">
                Debug: Full API Response
              </summary>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                {JSON.stringify(bookingResult, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  )
} 