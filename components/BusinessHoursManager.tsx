'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

interface BusinessHours {
  id: string
  day_of_week: number
  is_open: boolean
  open_time: string | null
  close_time: string | null
  break_start: string | null
  break_end: string | null
  slot_duration: number
}

const DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

export default function BusinessHoursManager() {
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Show message helper
  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }, [])

  // Fetch business hours
  const fetchBusinessHours = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/business-hours', {
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setBusinessHours(data.business_hours || [])
      } else {
        showMessage('error', data.message || 'Failed to fetch business hours')
      }
    } catch (error) {
      console.error('Failed to fetch business hours:', error)
      showMessage('error', 'Failed to fetch business hours')
    } finally {
      setLoading(false)
    }
  }, [showMessage])

  // Save business hours
  const saveBusinessHours = async () => {
    setSaving(true)
    
    try {
      const response = await fetch('/api/admin/business-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ business_hours: businessHours })
      })
      
      const data = await response.json()
      
      if (data.success) {
        showMessage('success', 'Business hours updated successfully')
      } else {
        showMessage('error', data.message || 'Failed to update business hours')
      }
    } catch (error) {
      console.error('Failed to save business hours:', error)
      showMessage('error', 'Failed to save business hours')
    } finally {
      setSaving(false)
    }
  }

  // Update a specific day's business hours
  const updateDayHours = (dayOfWeek: number, updates: Partial<BusinessHours>) => {
    setBusinessHours(prev => 
      prev.map(day => 
        day.day_of_week === dayOfWeek 
          ? { ...day, ...updates }
          : day
      )
    )
  }

  // Format time for input (remove seconds)
  const formatTimeForInput = (time: string | null): string => {
    if (!time) return ''
    return time.substring(0, 5) // HH:MM from HH:MM:SS
  }

  // Format time for database (add seconds)
  const formatTimeForDB = (time: string): string => {
    if (!time) return ''
    return time + ':00' // Add :00 seconds
  }

  useEffect(() => {
    fetchBusinessHours()
  }, [fetchBusinessHours])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading business hours...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Business Hours</h3>
          <p className="text-sm text-gray-600">Configure your operating hours and appointment slots</p>
        </div>
        <Button 
          onClick={saveBusinessHours}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </span>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="space-y-4">
        {businessHours.map((day) => (
          <div key={day.day_of_week} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <h4 className="font-medium text-gray-900">{DAYS[day.day_of_week]}</h4>
                {day.is_open ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">Open</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">Closed</Badge>
                )}
              </div>
              <Switch
                checked={day.is_open}
                onCheckedChange={(checked) => 
                  updateDayHours(day.day_of_week, { is_open: checked })
                }
              />
            </div>

            {day.is_open && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Operating Hours */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Operating Hours</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="time"
                      value={formatTimeForInput(day.open_time)}
                      onChange={(e) => 
                        updateDayHours(day.day_of_week, { 
                          open_time: formatTimeForDB(e.target.value) 
                        })
                      }
                      className="text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="time"
                      value={formatTimeForInput(day.close_time)}
                      onChange={(e) => 
                        updateDayHours(day.day_of_week, { 
                          close_time: formatTimeForDB(e.target.value) 
                        })
                      }
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Break Time (Optional) */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Break Time (Optional)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="time"
                      value={formatTimeForInput(day.break_start)}
                      onChange={(e) => 
                        updateDayHours(day.day_of_week, { 
                          break_start: e.target.value ? formatTimeForDB(e.target.value) : null 
                        })
                      }
                      placeholder="Start"
                      className="text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="time"
                      value={formatTimeForInput(day.break_end)}
                      onChange={(e) => 
                        updateDayHours(day.day_of_week, { 
                          break_end: e.target.value ? formatTimeForDB(e.target.value) : null 
                        })
                      }
                      placeholder="End"
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Slot Duration */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Appointment Duration</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="5"
                      max="120"
                      step="5"
                      value={day.slot_duration}
                      onChange={(e) => 
                        updateDayHours(day.day_of_week, { 
                          slot_duration: parseInt(e.target.value) || 15 
                        })
                      }
                      className="text-sm"
                    />
                    <span className="text-sm text-gray-500">minutes</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">📝 Quick Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Toggle the switch to open/close for each day</li>
          <li>• Break times are optional - leave blank if no breaks</li>
          <li>• Appointment duration affects available time slots</li>
          <li>• Changes apply to future bookings only</li>
        </ul>
      </div>
    </Card>
  )
} 