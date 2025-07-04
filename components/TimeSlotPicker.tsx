'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Loader2, ChevronDown, ChevronRight } from 'lucide-react'

interface TimeSlotPickerProps {
  selectedDate: Date | null
  selectedTime: string | null
  onTimeSelect: (time: string) => void
  className?: string
}

interface TimeSlot {
  time: string
  label: string
  available: boolean
  disabled: boolean
}

interface BusinessHours {
  isOpen: boolean
  openTime: string
  closeTime: string
  slotDuration: number
}

export function TimeSlotPicker({
  selectedDate,
  selectedTime,
  onTimeSelect,
  className = ''
}: TimeSlotPickerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<'earlyMorning' | 'morning' | 'afternoon' | 'evening' | null>(null)

  // Process time slots to apply frontend time restrictions
  const processTimeSlots = (slots: TimeSlot[], date: Date): TimeSlot[] => {
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDateOnly = new Date(date)
    selectedDateOnly.setHours(0, 0, 0, 0)
    
    // If the selected date is today, disable past times
    const isToday = selectedDateOnly.getTime() === today.getTime()
    
    if (!isToday) {
      // For future dates, all times are available (unless already booked)
      return slots
    }
    
    // For today, disable past times (with 15-minute buffer)
    const processed = slots.map(slot => {
      const [slotHour, slotMinute] = slot.time.split(':').map(Number)
      
      // Create slot time using the current date to maintain local timezone consistency
      const slotTime = new Date()
      slotTime.setHours(slotHour, slotMinute, 0, 0)
      
      const minimumTime = new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes from now
      const shouldDisable = slotTime < minimumTime
      
      return {
        ...slot,
        disabled: shouldDisable || slot.disabled
      }
    })
    
    return processed
  }

  // Fetch available time slots from the API
  const fetchAvailableSlots = async (date: Date) => {
    if (!date) return

    setLoading(true)
    setError(null)

    try {
      // Use local date formatting instead of UTC to avoid timezone issues
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`
      
      const response = await fetch(`/api/available-slots?date=${dateString}`, {
        cache: 'no-cache'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch available slots')
      }

      const data = await response.json()
      
      if (data.success) {
        // Process slots to apply frontend time restrictions
        const processedSlots = processTimeSlots(data.slots || [], date)
        setTimeSlots(processedSlots)
        setBusinessHours(data.businessHours || null)
      } else {
        throw new Error(data.error || 'Failed to fetch available slots')
      }
    } catch (err) {
      setError('Failed to check availability. Please try again.')
      console.error('Error fetching available slots:', err)
      
      // Fallback: show empty slots
      setTimeSlots([])
      setBusinessHours(null)
    } finally {
      setLoading(false)
    }
  }

  // Effect to fetch slots when selected date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate)
    } else {
      setTimeSlots([])
      setBusinessHours(null)
    }
    // Reset expanded section when date changes
    setExpandedSection(null)
  }, [selectedDate])

  const handleTimeClick = (timeSlot: TimeSlot) => {
    if (!timeSlot.disabled && timeSlot.available) {
      onTimeSelect(timeSlot.time)
    }
  }

  const handleSectionToggle = (section: 'earlyMorning' | 'morning' | 'afternoon' | 'evening') => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const getSlotClassName = (slot: TimeSlot) => {
    const baseClasses = "px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200"
    
    if (slot.disabled || !slot.available) {
      return `${baseClasses} bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed`
    }
    
    if (selectedTime === slot.time) {
      return `${baseClasses} bg-blue-600 text-white border-blue-600 shadow-md`
    }
    
    return `${baseClasses} bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50 cursor-pointer`
  }

  const getSlotLabel = (slot: TimeSlot) => {
    if (slot.disabled) {
      return `${slot.label} (Past)`
    }
    if (!slot.available) {
      return `${slot.label} (Booked)`
    }
    return slot.label
  }

  // Group time slots by time period for better organization
  const groupedSlots = {
    earlyMorning: timeSlots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0])
      return hour >= 0 && hour < 6
    }),
    morning: timeSlots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0])
      return hour >= 6 && hour < 12
    }),
    afternoon: timeSlots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0])
      return hour >= 12 && hour < 17
    }),
    evening: timeSlots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0])
      return hour >= 17
    })
  }

  // Helper function to format business hours for display
  const formatBusinessHours = () => {
    if (!businessHours) return 'Loading hours...'
    if (!businessHours.isOpen) return 'Closed'
    
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number)
      const date = new Date()
      date.setHours(hours, minutes, 0, 0)
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }

    return `${formatTime(businessHours.openTime)} - ${formatTime(businessHours.closeTime)} • ${businessHours.slotDuration}-minute appointments`
  }

  if (!selectedDate) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 text-center ${className}`}>
        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Please select a date first</p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Available Times
        </h3>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
      </div>

      <div className="text-sm text-gray-600 mb-4">
        {selectedDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => fetchAvailableSlots(selectedDate)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Checking availability...</span>
        </div>
      ) : businessHours && !businessHours.isOpen ? (
        <div className="text-center py-8">
          <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">Closed on this day</p>
          <p className="text-gray-400 text-sm">Please select a different date</p>
        </div>
      ) : timeSlots.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">No available time slots</p>
          <p className="text-gray-400 text-sm">All slots are booked or unavailable</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Early Morning slots */}
          {groupedSlots.earlyMorning.length > 0 && (
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => handleSectionToggle('earlyMorning')}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-700">Early Morning</h4>
                  <span className="text-xs text-gray-500">({groupedSlots.earlyMorning.length} slots)</span>
                </div>
                {expandedSection === 'earlyMorning' ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
              {expandedSection === 'earlyMorning' && (
                <div className="px-3 pb-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {groupedSlots.earlyMorning.map(slot => (
                      <button
                        key={slot.time}
                        onClick={() => handleTimeClick(slot)}
                        disabled={slot.disabled || !slot.available}
                        className={getSlotClassName(slot)}
                        title={!slot.available ? 'This time slot is already booked' : 
                               slot.disabled ? 'This time has passed' : 
                               'Available for booking'}
                      >
                        {getSlotLabel(slot)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Morning slots */}
          {groupedSlots.morning.length > 0 && (
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => handleSectionToggle('morning')}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-700">Morning</h4>
                  <span className="text-xs text-gray-500">({groupedSlots.morning.length} slots)</span>
                </div>
                {expandedSection === 'morning' ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
              {expandedSection === 'morning' && (
                <div className="px-3 pb-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {groupedSlots.morning.map(slot => (
                      <button
                        key={slot.time}
                        onClick={() => handleTimeClick(slot)}
                        disabled={slot.disabled || !slot.available}
                        className={getSlotClassName(slot)}
                        title={!slot.available ? 'This time slot is already booked' : 
                               slot.disabled ? 'This time has passed' : 
                               'Available for booking'}
                      >
                        {getSlotLabel(slot)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Afternoon slots */}
          {groupedSlots.afternoon.length > 0 && (
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => handleSectionToggle('afternoon')}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-700">Afternoon</h4>
                  <span className="text-xs text-gray-500">({groupedSlots.afternoon.length} slots)</span>
                </div>
                {expandedSection === 'afternoon' ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
              {expandedSection === 'afternoon' && (
                <div className="px-3 pb-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {groupedSlots.afternoon.map(slot => (
                      <button
                        key={slot.time}
                        onClick={() => handleTimeClick(slot)}
                        disabled={slot.disabled || !slot.available}
                        className={getSlotClassName(slot)}
                        title={!slot.available ? 'This time slot is already booked' : 
                               slot.disabled ? 'This time has passed' : 
                               'Available for booking'}
                      >
                        {getSlotLabel(slot)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Evening slots */}
          {groupedSlots.evening.length > 0 && (
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => handleSectionToggle('evening')}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-700">Evening</h4>
                  <span className="text-xs text-gray-500">({groupedSlots.evening.length} slots)</span>
                </div>
                {expandedSection === 'evening' ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
              {expandedSection === 'evening' && (
                <div className="px-3 pb-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {groupedSlots.evening.map(slot => (
                      <button
                        key={slot.time}
                        onClick={() => handleTimeClick(slot)}
                        disabled={slot.disabled || !slot.available}
                        className={getSlotClassName(slot)}
                        title={!slot.available ? 'This time slot is already booked' : 
                               slot.disabled ? 'This time has passed' : 
                               'Available for booking'}
                      >
                        {getSlotLabel(slot)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 rounded"></div>
            <span>Unavailable</span>
          </div>
        </div>
      </div>

      {/* Business hours info */}
      <div className="mt-3 text-xs text-gray-500">
        {formatBusinessHours()}
      </div>
    </div>
  )
} 