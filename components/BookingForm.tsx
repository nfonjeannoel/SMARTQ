'use client'

import React, { useState, useEffect } from 'react'
import { Calendar } from './Calendar'
import { TimeSlotPicker } from './TimeSlotPicker'
import { User, Phone, Mail, Calendar as CalendarIcon, Clock, Check, AlertCircle, Loader2 } from 'lucide-react'

interface BookingFormProps {
  onBookingComplete?: (booking: BookingResult) => void
  onSubmit?: (data: { name: string; phone?: string; email?: string; date: string; time: string }) => void
  isSubmitting?: boolean
  className?: string
}

interface BookingData {
  name: string
  phone: string
  email: string
  date: Date | null
  time: string | null
}

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

interface FormErrors {
  name?: string
  contact?: string
  phone?: string
  email?: string
  date?: string
  time?: string
  submit?: string
}

export function BookingForm({ onBookingComplete, onSubmit, isSubmitting = false, className = '' }: BookingFormProps) {
  const [bookingData, setBookingData] = useState<BookingData>({
    name: '',
    phone: '',
    email: '',
    date: null,
    time: null
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'info' | 'datetime' | 'confirm'>('info')

  // Clear errors when component mounts or step changes
  useEffect(() => {
    setErrors(prev => ({ ...prev, submit: undefined }))
  }, [step])

  // Auto-select today's date when entering datetime step
  useEffect(() => {
    if (step === 'datetime' && !bookingData.date) {
      const today = new Date()
      setBookingData(prev => ({ ...prev, date: today }))
    }
  }, [step, bookingData.date])

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!bookingData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (bookingData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less'
    }

    // Contact validation (phone OR email required)
    if (!bookingData.phone.trim() && !bookingData.email.trim()) {
      newErrors.contact = 'Either phone number or email is required'
    }

    // Phone validation (if provided)
    if (bookingData.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(bookingData.phone.replace(/[\s\-\(\)]/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    }

    // Email validation (if provided)
    if (bookingData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(bookingData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    // Date validation
    if (!bookingData.date) {
      newErrors.date = 'Please select a date'
    }

    // Time validation
    if (!bookingData.time) {
      newErrors.time = 'Please select a time'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof BookingData, value: any) => {
    setBookingData(prev => ({ ...prev, [field]: value }))
    
    // Clear field-specific errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    if (field === 'phone' || field === 'email') {
      setErrors(prev => ({ ...prev, contact: undefined }))
    }
  }

  const handleDateSelect = (date: Date) => {
    handleInputChange('date', date)
    // Clear time selection when date changes
    if (bookingData.time) {
      handleInputChange('time', null)
    }
    // Clear any submission errors when date changes
    setErrors(prev => ({ ...prev, submit: undefined }))
  }

  const handleTimeSelect = (time: string) => {
    handleInputChange('time', time)
    // Clear any submission errors when time changes
    setErrors(prev => ({ ...prev, submit: undefined }))
  }

  const handleNextStep = () => {
    if (step === 'info') {
      // Validate user info before proceeding
      const nameValid = bookingData.name.trim().length > 0
      const contactValid = bookingData.phone.trim().length > 0 || bookingData.email.trim().length > 0
      
      if (nameValid && contactValid) {
        setStep('datetime')
      }
    } else if (step === 'datetime') {
      if (bookingData.date && bookingData.time) {
        setStep('confirm')
      }
    }
  }

  const handlePrevStep = () => {
    if (step === 'datetime') {
      setStep('info')
    } else if (step === 'confirm') {
      setStep('datetime')
    }
    // Clear any submission errors when navigating back
    setErrors(prev => ({ ...prev, submit: undefined }))
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    const payload = {
      name: bookingData.name.trim(),
      phone: bookingData.phone.trim() || undefined,
      email: bookingData.email.trim() || undefined,
      date: bookingData.date!.toISOString().split('T')[0],
      time: bookingData.time!
    }

    // If onSubmit prop is provided, use it (for the new booking flow)
    if (onSubmit) {
      onSubmit(payload)
      return
    }

    // Otherwise, use the old booking flow
    setLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Success
        onBookingComplete?.(result)
      } else {
        // Error from API
        setErrors({
          submit: result.message || 'Failed to book appointment. Please try again.'
        })
      }
    } catch (error) {
      console.error('Booking error:', error)
      setErrors({
        submit: 'Network error. Please check your connection and try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatSelectedDateTime = () => {
    if (!bookingData.date || !bookingData.time) return ''
    
    const [hours, minutes] = bookingData.time.split(':')
    const dateTime = new Date(bookingData.date)
    dateTime.setHours(parseInt(hours), parseInt(minutes))
    
    return dateTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${step === 'info' ? 'text-blue-600' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'info' ? 'bg-blue-600 text-white' : 
              step === 'datetime' || step === 'confirm' ? 'bg-green-600 text-white' : 
              'bg-gray-200 text-gray-600'
            }`}>
              {step === 'datetime' || step === 'confirm' ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <span className="ml-2 text-sm font-medium">Your Info</span>
          </div>
          
          <div className={`flex items-center ${step === 'datetime' ? 'text-blue-600' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'datetime' ? 'bg-blue-600 text-white' : 
              step === 'confirm' ? 'bg-green-600 text-white' : 
              'bg-gray-200 text-gray-600'
            }`}>
              {step === 'confirm' ? <Check className="h-4 w-4" /> : '2'}
            </div>
            <span className="ml-2 text-sm font-medium">Date & Time</span>
          </div>
          
          <div className={`flex items-center ${step === 'confirm' ? 'text-blue-600' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'confirm' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">Confirm</span>
          </div>
        </div>
      </div>

      {/* Step 1: User Information */}
      {step === 'info' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Your Information</h2>
            </div>

            <div className="space-y-4">
              {/* Name field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={bookingData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phone field */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      id="phone"
                      value={bookingData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                {/* Email field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={bookingData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              {errors.contact && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{errors.contact}</p>
                </div>
              )}

              <p className="text-sm text-gray-600">
                * Required field. Please provide either a phone number or email address.
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-end">
            <button
              onClick={handleNextStep}
              disabled={!bookingData.name.trim() || (!bookingData.phone.trim() && !bookingData.email.trim())}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next: Select Date & Time
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Date & Time Selection */}
      {step === 'datetime' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Select Date</h2>
              </div>
              <Calendar
                selectedDate={bookingData.date}
                onDateSelect={handleDateSelect}
                disableWeekends={false}
              />
            </div>

            {/* Time slots */}
            <div>
              <TimeSlotPicker
                selectedDate={bookingData.date}
                selectedTime={bookingData.time}
                onTimeSelect={handleTimeSelect}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevStep}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNextStep}
              disabled={!bookingData.date || !bookingData.time}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next: Review & Confirm
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Appointment</h2>

            <div className="space-y-4">
              {/* User info summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Contact Information</h3>
                <p className="text-gray-700">{bookingData.name}</p>
                {bookingData.phone && (
                  <p className="text-gray-600 text-sm">📞 {bookingData.phone}</p>
                )}
                {bookingData.email && (
                  <p className="text-gray-600 text-sm">✉️ {bookingData.email}</p>
                )}
              </div>

              {/* Date/time summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Appointment Details</h3>
                <p className="text-gray-700 font-medium">{formatSelectedDateTime()}</p>
                <p className="text-gray-600 text-sm mt-1">Duration: 15 minutes</p>
              </div>

              {/* Important notes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-yellow-800">Important Reminders</h3>
                    <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                      <li>• Please arrive at least 15 minutes before your appointment</li>
                      <li>• Bring a valid ID and any required documents</li>
                      <li>• Late arrivals may be converted to walk-in status</li>
                      <li>• You'll receive a ticket ID after booking for check-in</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevStep}
              disabled={isSubmitting || loading}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {(isSubmitting || loading) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                'Confirm Appointment'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 