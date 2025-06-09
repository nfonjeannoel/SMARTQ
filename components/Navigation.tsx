"use client"

import React from 'react'
import Link from "next/link"
import { useRouter, usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  ArrowLeft,
  Home,
  Clock,
  CheckCircle,
  Calendar,
  UserCheck,
  Users,
  Activity,
  Settings,
  ChevronRight
} from "lucide-react"

interface NavigationProps {
  showBackButton?: boolean
  customBackUrl?: string
  showBreadcrumbs?: boolean
  pageTitle?: string
  pageDescription?: string
  showSystemStatus?: boolean
  className?: string
}

const Navigation: React.FC<NavigationProps> = ({
  showBackButton = true,
  customBackUrl,
  showBreadcrumbs = true,
  pageTitle,
  pageDescription,
  showSystemStatus = true,
  className = ""
}) => {
  const router = useRouter()
  const pathname = usePathname()

  // Define page configurations
  const pageConfig = {
    '/': {
      title: 'SmartQ',
      subtitle: 'Healthcare Queue Management',
      showBackButton: false,
      breadcrumbs: []
    },
    '/book': {
      title: 'Book Appointment',
      subtitle: 'Schedule your visit',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Book Appointment' }]
    },
    '/check-in': {
      title: 'Check In',
      subtitle: 'Check in for your appointment',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Check In' }]
    },
    '/walk-in': {
      title: 'Walk-In Queue',
      subtitle: 'Join the walk-in queue',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Walk-In' }]
    },
    '/public-details': {
      title: 'Queue Status',
      subtitle: 'Live queue information',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Queue Status' }]
    },
    '/admin': {
      title: 'Admin Dashboard',
      subtitle: 'Queue management',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Admin' }],
      adminOnly: true
    },
    '/admin/login': {
      title: 'Admin Login',
      subtitle: 'Staff authentication',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Admin Login' }],
      adminOnly: true
    }
  }

  // Get current page config
  const currentConfig = pageConfig[pathname as keyof typeof pageConfig] || {
    title: pageTitle || 'SmartQ',
    subtitle: pageDescription || 'Healthcare Queue Management',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Page' }]
  }

  // Override with custom props if provided
  const finalConfig = {
    ...currentConfig,
    title: pageTitle || currentConfig.title,
    subtitle: pageDescription || currentConfig.subtitle,
    showBackButton: showBackButton && (currentConfig.showBackButton !== false)
  }

  // Handle back navigation
  const handleBackClick = () => {
    if (customBackUrl) {
      router.push(customBackUrl)
    } else {
      // Smart back navigation based on current page
      const backMap: { [key: string]: string } = {
        '/book': '/',
        '/check-in': '/',
        '/walk-in': '/',
        '/public-details': '/',
        '/admin': '/',
        '/admin/login': '/'
      }
      
      const backUrl = backMap[pathname] || '/'
      router.push(backUrl)
    }
  }

  // Get appropriate icon for current page
  const getPageIcon = () => {
    const iconMap: { [key: string]: React.ReactNode } = {
      '/': <Clock className="h-4 w-4" />,
      '/book': <Calendar className="h-4 w-4" />,
      '/check-in': <UserCheck className="h-4 w-4" />,
      '/walk-in': <Users className="h-4 w-4" />,
      '/public-details': <Activity className="h-4 w-4" />,
      '/admin': <Settings className="h-4 w-4" />,
      '/admin/login': <Settings className="h-4 w-4" />
    }
    
    return iconMap[pathname] || <Clock className="h-4 w-4" />
  }

  return (
    <header className={`border-b bg-white/80 backdrop-blur-md dark:bg-gray-900/80 ${className}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Logo and Navigation */}
          <div className="flex items-center space-x-4">
            {/* Back Button */}
            {finalConfig.showBackButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackClick}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            
            {/* Logo and Title */}
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  {getPageIcon()}
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {finalConfig.title}
                </h1>
              </Link>
              
              {finalConfig.subtitle && (
                <Badge variant="secondary" className="text-xs">
                  {finalConfig.subtitle}
                </Badge>
              )}
            </div>
          </div>

          {/* Right Section - Status and Theme */}
          <div className="flex items-center space-x-2">
            {showSystemStatus && (
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                System Online
              </Badge>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Breadcrumbs */}
        {showBreadcrumbs && finalConfig.breadcrumbs && finalConfig.breadcrumbs.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <nav className="flex items-center space-x-2 text-sm">
              {finalConfig.breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {crumb.href ? (
                    <Link 
                      href={crumb.href}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                    >
                      {index === 0 && <Home className="h-3 w-3 mr-1" />}
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">
                      {crumb.label}
                    </span>
                  )}
                  {index < finalConfig.breadcrumbs.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navigation 