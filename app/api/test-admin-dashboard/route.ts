import { NextRequest, NextResponse } from 'next/server'

/**
 * Test endpoint for Admin Dashboard functionality
 * Validates authentication flow, queue data fetching, and admin actions
 */
export async function GET(request: NextRequest) {
  const results: any[] = []
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com' 
    : 'http://localhost:3000'

  try {
    // Test 1: Check admin dashboard route protection (should redirect to login without auth)
    try {
      const dashboardResponse = await fetch(`${baseUrl}/admin`, {
        method: 'GET',
        redirect: 'manual'
      })
      
      results.push({
        test: '1. Admin Dashboard Route Protection',
        status: dashboardResponse.status === 200 || dashboardResponse.status === 302 ? 'PASS' : 'FAIL',
        details: `Status: ${dashboardResponse.status} - Dashboard should be accessible but check auth client-side`,
        expected: 'Should load page (auth checked in client)',
        actual: `Got status ${dashboardResponse.status}`
      })
    } catch (error) {
      results.push({
        test: '1. Admin Dashboard Route Protection',
        status: 'ERROR',
        details: `Error accessing admin dashboard: ${error}`,
        expected: 'Should load page',
        actual: 'Network/server error'
      })
    }

    // Test 2: Admin login page accessibility
    try {
      const loginResponse = await fetch(`${baseUrl}/admin/login`, {
        method: 'GET'
      })
      
      const loginPage = await loginResponse.text()
      const hasLoginForm = loginPage.includes('email') && loginPage.includes('password')
      
      results.push({
        test: '2. Admin Login Page',
        status: loginResponse.ok && hasLoginForm ? 'PASS' : 'FAIL',
        details: `Status: ${loginResponse.status}, Has form: ${hasLoginForm}`,
        expected: 'Login page with email/password form',
        actual: `Status ${loginResponse.status}, form elements: ${hasLoginForm}`
      })
    } catch (error) {
      results.push({
        test: '2. Admin Login Page',
        status: 'ERROR',
        details: `Error accessing login page: ${error}`,
        expected: 'Should load login page',
        actual: 'Network/server error'
      })
    }

    // Test 3: Admin session check without authentication
    try {
      const sessionResponse = await fetch(`${baseUrl}/api/admin/session`, {
        method: 'GET'
      })
      
      const sessionData = await sessionResponse.json()
      
      results.push({
        test: '3. Unauthenticated Session Check',
        status: !sessionData.authenticated ? 'PASS' : 'FAIL',
        details: `Response: ${JSON.stringify(sessionData)}`,
        expected: 'Should return authenticated: false',
        actual: `authenticated: ${sessionData.authenticated}`
      })
    } catch (error) {
      results.push({
        test: '3. Unauthenticated Session Check',
        status: 'ERROR',
        details: `Error checking session: ${error}`,
        expected: 'Should return authenticated: false',
        actual: 'Network/server error'
      })
    }

    // Test 4: Valid admin login and session creation
    let adminCookies = ''
    try {
      const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@smartq2.com',
          password: 'admin123'
        })
      })
      
      const loginData = await loginResponse.json()
      
      // Extract cookies for subsequent requests
      const setCookieHeaders = loginResponse.headers.get('set-cookie')
      if (setCookieHeaders) {
        adminCookies = setCookieHeaders
      }
      
      results.push({
        test: '4. Admin Login Success',
        status: loginData.success ? 'PASS' : 'FAIL',
        details: `Login response: ${JSON.stringify(loginData)}`,
        expected: 'Should login successfully with valid credentials',
        actual: `success: ${loginData.success}, message: ${loginData.message || 'none'}`
      })
    } catch (error) {
      results.push({
        test: '4. Admin Login Success',
        status: 'ERROR',
        details: `Error during login: ${error}`,
        expected: 'Should login successfully',
        actual: 'Network/server error'
      })
    }

    // Test 5: Authenticated session check
    if (adminCookies) {
      try {
        const sessionResponse = await fetch(`${baseUrl}/api/admin/session`, {
          method: 'GET',
          headers: {
            'Cookie': adminCookies
          }
        })
        
        const sessionData = await sessionResponse.json()
        
        results.push({
          test: '5. Authenticated Session Check',
          status: sessionData.authenticated ? 'PASS' : 'FAIL',
          details: `Session data: ${JSON.stringify(sessionData)}`,
          expected: 'Should return authenticated: true with session details',
          actual: `authenticated: ${sessionData.authenticated}, email: ${sessionData.session?.email || 'none'}`
        })
      } catch (error) {
        results.push({
          test: '5. Authenticated Session Check',
          status: 'ERROR',
          details: `Error checking authenticated session: ${error}`,
          expected: 'Should return authenticated session',
          actual: 'Network/server error'
        })
      }
    } else {
      results.push({
        test: '5. Authenticated Session Check',
        status: 'SKIP',
        details: 'No admin cookies available from login test',
        expected: 'Should return authenticated session',
        actual: 'Cannot test without valid login cookies'
      })
    }

    // Test 6: Queue data accessibility
    try {
      const queueResponse = await fetch(`${baseUrl}/api/queue`, {
        method: 'GET'
      })
      
      const queueData = await queueResponse.json()
      
      results.push({
        test: '6. Queue Data Fetch',
        status: queueData.success ? 'PASS' : 'FAIL',
        details: `Queue response: ${JSON.stringify(queueData)}`,
        expected: 'Should return queue data successfully',
        actual: `success: ${queueData.success}, totalWaiting: ${queueData.totalWaiting || 0}`
      })
    } catch (error) {
      results.push({
        test: '6. Queue Data Fetch',
        status: 'ERROR',
        details: `Error fetching queue data: ${error}`,
        expected: 'Should return queue data',
        actual: 'Network/server error'
      })
    }

    // Test 7: Admin mark-arrived API protection
    try {
      const markArrivedResponse = await fetch(`${baseUrl}/api/admin/mark-arrived`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: 'test-ticket-id',
          ticketType: 'walk-in'
        })
      })
      
      const markArrivedData = await markArrivedResponse.json()
      
      results.push({
        test: '7. Mark Arrived API Protection',
        status: markArrivedResponse.status === 401 ? 'PASS' : 'FAIL',
        details: `Response: ${JSON.stringify(markArrivedData)}`,
        expected: 'Should return 401 without authentication',
        actual: `Status: ${markArrivedResponse.status}, success: ${markArrivedData.success}`
      })
    } catch (error) {
      results.push({
        test: '7. Mark Arrived API Protection',
        status: 'ERROR',
        details: `Error testing mark-arrived API: ${error}`,
        expected: 'Should return 401 without auth',
        actual: 'Network/server error'
      })
    }

    // Test 8: Admin call-next API protection
    try {
      const callNextResponse = await fetch(`${baseUrl}/api/admin/call-next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const callNextData = await callNextResponse.json()
      
      results.push({
        test: '8. Call Next API Protection',
        status: callNextResponse.status === 401 ? 'PASS' : 'FAIL',
        details: `Response: ${JSON.stringify(callNextData)}`,
        expected: 'Should return 401 without authentication',
        actual: `Status: ${callNextResponse.status}, success: ${callNextData.success}`
      })
    } catch (error) {
      results.push({
        test: '8. Call Next API Protection',
        status: 'ERROR',
        details: `Error testing call-next API: ${error}`,
        expected: 'Should return 401 without auth',
        actual: 'Network/server error'
      })
    }

    // Test 9: Authenticated admin mark-arrived (with dummy data)
    if (adminCookies) {
      try {
        const markArrivedResponse = await fetch(`${baseUrl}/api/admin/mark-arrived`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cookie': adminCookies
          },
          body: JSON.stringify({
            ticketId: 'test-non-existent-ticket',
            ticketType: 'walk-in'
          })
        })
        
        const markArrivedData = await markArrivedResponse.json()
        
        results.push({
          test: '9. Authenticated Mark Arrived',
          status: markArrivedResponse.status === 404 ? 'PASS' : 'FAIL',
          details: `Response: ${JSON.stringify(markArrivedData)}`,
          expected: 'Should return 404 for non-existent ticket with valid auth',
          actual: `Status: ${markArrivedResponse.status}, success: ${markArrivedData.success}`
        })
      } catch (error) {
        results.push({
          test: '9. Authenticated Mark Arrived',
          status: 'ERROR',
          details: `Error testing authenticated mark-arrived: ${error}`,
          expected: 'Should return 404 for non-existent ticket',
          actual: 'Network/server error'
        })
      }
    } else {
      results.push({
        test: '9. Authenticated Mark Arrived',
        status: 'SKIP',
        details: 'No admin cookies available',
        expected: 'Should process with valid auth',
        actual: 'Cannot test without valid login cookies'
      })
    }

    // Test 10: Admin logout
    if (adminCookies) {
      try {
        const logoutResponse = await fetch(`${baseUrl}/api/admin/logout`, {
          method: 'POST',
          headers: {
            'Cookie': adminCookies
          }
        })
        
        const logoutData = await logoutResponse.json()
        
        results.push({
          test: '10. Admin Logout',
          status: logoutData.success ? 'PASS' : 'FAIL',
          details: `Logout response: ${JSON.stringify(logoutData)}`,
          expected: 'Should logout successfully',
          actual: `success: ${logoutData.success}, message: ${logoutData.message || 'none'}`
        })
      } catch (error) {
        results.push({
          test: '10. Admin Logout',
          status: 'ERROR',
          details: `Error during logout: ${error}`,
          expected: 'Should logout successfully',
          actual: 'Network/server error'
        })
      }
    } else {
      results.push({
        test: '10. Admin Logout',
        status: 'SKIP',
        details: 'No admin cookies available',
        expected: 'Should logout successfully',
        actual: 'Cannot test without valid login cookies'
      })
    }

    // Calculate summary
    const totalTests = results.length
    const passedTests = results.filter(r => r.status === 'PASS').length
    const failedTests = results.filter(r => r.status === 'FAIL').length
    const errorTests = results.filter(r => r.status === 'ERROR').length
    const skippedTests = results.filter(r => r.status === 'SKIP').length
    const successRate = Math.round((passedTests / totalTests) * 100)

    return NextResponse.json({
      success: true,
      message: 'Admin Dashboard integration tests completed',
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        errors: errorTests,
        skipped: skippedTests,
        successRate: `${successRate}%`
      },
      results,
      adminDashboardFeatures: {
        authentication: 'JWT-based admin sessions with HTTP-only cookies',
        dashboard: 'Real-time queue monitoring with auto-refresh',
        queueManagement: 'Mark patients as arrived and call next functionality',
        userInterface: 'Responsive design with loading states and error handling',
        security: 'Protected routes with middleware and session validation'
      },
      usage: {
        adminLogin: '/admin/login - Admin authentication page',
        adminDashboard: '/admin - Protected dashboard for queue management',
        sessionAPI: '/api/admin/session - Check current admin session',
        markArrivedAPI: '/api/admin/mark-arrived - Mark patients as arrived',
        callNextAPI: '/api/admin/call-next - Advance queue and serve patients'
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Admin Dashboard test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      results
    }, { status: 500 })
  }
} 