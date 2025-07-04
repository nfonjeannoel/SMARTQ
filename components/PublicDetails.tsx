"use client"

import React, { useState, useEffect } from 'react'
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Clock, 
  Users, 
  Activity, 
  Calendar,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Timer,
  MapPin,
  Phone,
  Mail,
  Globe
} from "lucide-react"

interface QueueItem {
  queue_number?: number
  type: 'appointment' | 'walk_in'
  ticket_id: string
  status: string
}

interface QueueStatus {
  totalInQueue: number
  appointmentsInQueue: number
  walkInsInQueue: number
  estimatedWait: string
  nextTickets?: QueueItem[]
  nowServing?: QueueItem
  queueStats: {
    totalToday: number
    served: number
    waiting: number
    averageWaitTime: string
  }
}

interface BusinessHours {
  open: string
  close: string
  currentlyOpen: boolean
}

interface PublicData {
  queue: QueueStatus
  businessHours: BusinessHours
  lastUpdated: string
}

const PublicDetails: React.FC = () => {
  const [publicData, setPublicData] = useState<PublicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchPublicData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/queue?stats=true')
      const data = await response.json()
      
      if (data.success) {
        setPublicData({
          queue: data.queue,
          businessHours: data.metadata.businessHours,
          lastUpdated: data.metadata.timestamp
        })
        setLastRefresh(new Date())
      } else {
        setError(data.message || 'Failed to fetch public data')
      }
    } catch (err) {
      setError('Unable to connect to server')
      console.error('Error fetching public data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPublicData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchPublicData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getQueueStatusColor = (total: number): string => {
    if (total === 0) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (total <= 5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  const getQueueStatusText = (total: number): string => {
    if (total === 0) return 'No Wait'
    if (total <= 2) return 'Short Wait'
    if (total <= 5) return 'Moderate Wait'
    return 'Longer Wait'
  }

  const getBusyLevelText = (total: number): string => {
    if (total === 0) return 'Very Quiet'
    if (total <= 2) return 'Quiet'
    if (total <= 5) return 'Moderately Busy'
    if (total <= 10) return 'Busy'
    return 'Very Busy'
  }

  if (loading && !publicData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 animate-pulse" />
            Loading Public Information...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5 mr-2" />
            Unable to Load Public Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={fetchPublicData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!publicData) return null

  const { queue, businessHours } = publicData

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Live Queue Status
              </CardTitle>
              <CardDescription>
                Real-time information about current wait times and facility status
              </CardDescription>
            </div>
            <Button 
              onClick={fetchPublicData} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Current Queue Length */}
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {queue.totalInQueue}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                People in Queue
              </div>
              <Badge className={`mt-2 ${getQueueStatusColor(queue.totalInQueue)}`}>
                {getQueueStatusText(queue.totalInQueue)}
              </Badge>
            </div>

            {/* Estimated Wait Time */}
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Timer className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {queue.estimatedWait === 'Now serving' ? '0 min' : queue.queueStats.averageWaitTime}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Average Wait
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {queue.estimatedWait}
              </div>
            </div>

            {/* Business Hours Status */}
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {businessHours.currentlyOpen ? 'Open' : 'Closed'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {businessHours.open} - {businessHours.close}
              </div>
              <Badge variant={businessHours.currentlyOpen ? "default" : "secondary"} className="mt-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                {businessHours.currentlyOpen ? 'Accepting Patients' : 'Closed'}
              </Badge>
            </div>

            {/* Activity Level */}
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {getBusyLevelText(queue.totalInQueue)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Activity Level
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {queue.queueStats.served} served today
              </div>
            </div>
          </div>

          {/* Detailed Queue Breakdown */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Appointments
                </span>
                <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                  {queue.appointmentsInQueue}
                </Badge>
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Scheduled patients in queue
              </div>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Walk-ins
                </span>
                <Badge variant="outline" className="text-orange-600 dark:text-orange-400">
                  {queue.walkInsInQueue}
                </Badge>
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">
                Walk-in patients waiting
              </div>
            </div>
          </div>

          {/* Now Serving & Next Numbers */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Queue Numbers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Now Serving */}
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Now Serving
                </div>
                {queue.nowServing?.queue_number ? (
                  <div className="inline-flex items-center px-6 py-3 rounded-full text-2xl font-bold bg-green-600 text-white">
                    #{queue.nowServing.queue_number}
                  </div>
                ) : (
                  <div className="inline-flex items-center px-6 py-3 rounded-full text-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    No one currently
                  </div>
                )}
              </div>

              {/* Next Up */}
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Next Up
                </div>
                {queue.nextTickets && queue.nextTickets.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    {queue.nextTickets.slice(0, 3).map((ticket, index) => (
                      <div
                        key={ticket.ticket_id}
                        className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${
                          index === 0 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                        }`}
                      >
                        #{ticket.queue_number}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    Queue is empty
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Facility Information */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Facility Information
          </CardTitle>
          <CardDescription>
            General information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Today's Statistics
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Patients:</span>
                    <span className="font-medium">{queue.queueStats.totalToday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Patients Served:</span>
                    <span className="font-medium text-green-600">{queue.queueStats.served}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Currently Waiting:</span>
                    <span className="font-medium text-blue-600">{queue.queueStats.waiting}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Contact Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">Reception: Call for assistance</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">Email: info@healthcare.com</span>
                  </div>
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">Website: www.healthcare.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Best time to visit:</strong> {queue.totalInQueue <= 2 ? 'Right now!' : 'Check back in 15-30 minutes'}
              </div>
              {businessHours.currentlyOpen ? (
                <Link href="/walk-in">
                  <Button size="sm" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Open Now - Join Queue
                  </Button>
                </Link>
              ) : (
                <Badge variant="outline" className="text-xs">
                  Closed
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PublicDetails 