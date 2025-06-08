import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  Calendar, 
  UserCheck, 
  Users, 
  Settings, 
  Clock, 
  CheckCircle, 
  Info,
  Phone,
  Mail
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">SmartQ</h1>
              <Badge variant="secondary" className="text-xs">
                Healthcare Queue Management
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                System Online
              </Badge>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to SmartQ
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Streamlined healthcare queue management system. Book appointments, check in, 
            or join as a walk-in patient with real-time queue updates.
          </p>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Book Appointment */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/book" className="block h-full">
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl">Book Appointment</CardTitle>
                <CardDescription>
                  Schedule your visit and avoid waiting in line
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="w-full" size="lg">
                  Book Now
                </Button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Choose your preferred time slot
                </p>
              </CardContent>
            </Link>
          </Card>

          {/* Check In */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/check-in" className="block h-full">
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                  <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl">Check In</CardTitle>
                <CardDescription>
                  Already have an appointment? Check in here
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full" size="lg">
                  Check In
                </Button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Use your ticket ID to check in
                </p>
              </CardContent>
            </Link>
          </Card>

          {/* Walk-In */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/walk-in" className="block h-full">
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-xl">Walk-In</CardTitle>
                <CardDescription>
                  No appointment? Join the walk-in queue
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full" size="lg">
                  Join Queue
                </Button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Get in line for next available slot
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* System Status & Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Booking System</span>
                  <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Check-In System</span>
                  <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Queue Management</span>
                  <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help & Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                Get assistance with the queue management system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Call Reception</p>
                    <p className="text-sm text-gray-500">For immediate assistance</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-gray-500">Non-urgent inquiries</p>
                  </div>
                </div>
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    View Instructions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Access */}
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <Settings className="h-5 w-5 mr-2" />
                Staff Access
              </CardTitle>
              <CardDescription>
                Administrative dashboard for staff members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin">
                <Button variant="secondary" className="w-full">
                  Admin Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 dark:bg-gray-900 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>© 2024 SmartQ Healthcare Queue Management System</p>
            <p className="mt-2">Streamlining patient flow for better healthcare experience</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
