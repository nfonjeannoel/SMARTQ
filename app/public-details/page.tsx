import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PublicDetails } from "@/components"
import Link from "next/link"
import { 
  ArrowLeft,
  Clock,
  CheckCircle
} from "lucide-react"

export default function PublicDetailsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">SmartQ</h1>
                <Badge variant="secondary" className="text-xs">
                  Public Information
                </Badge>
              </div>
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

      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Public Information & Queue Status
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Check current wait times, facility status, and general information to plan your visit.
          </p>
        </div>

        {/* Public Details Component */}
        <div className="max-w-6xl mx-auto">
          <PublicDetails />
        </div>

        {/* Quick Actions */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Ready to Visit?
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Choose how you'd like to join our queue
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/book" className="block">
              <Button className="w-full h-16 text-lg" size="lg">
                Book Appointment
              </Button>
            </Link>
            
            <Link href="/check-in" className="block">
              <Button variant="outline" className="w-full h-16 text-lg" size="lg">
                Check In
              </Button>
            </Link>
            
            <Link href="/walk-in" className="block">
              <Button variant="outline" className="w-full h-16 text-lg" size="lg">
                Join Walk-In Queue
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 dark:bg-gray-900 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>© 2024 SmartQ Healthcare Queue Management System</p>
            <p className="mt-2">Real-time updates every 30 seconds</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 