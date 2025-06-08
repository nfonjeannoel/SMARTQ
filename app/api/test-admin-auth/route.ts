// GET /api/test-admin-auth - Test endpoint for admin authentication system
// Tests login, session verification, and logout functionality

import { NextRequest, NextResponse } from 'next/server'

interface TestResult {
  test: string
  expected: number
  actual: number
  passed: boolean
  data: any
  response: any
  timestamp: string
}

export async function GET(request: NextRequest) {
  const results: TestResult[] = []
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com' 
    : `http://localhost:3000`

  // Test 1: Login with valid admin credentials
  try {
    const loginData = {
      email: 'admin@smartq2.com',
      password: 'password'
    }

    const response = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    })

    const data = await response.json()
    const sessionCookie = response.headers.get('set-cookie')

    results.push({
      test: 'Valid admin login',
      expected: 200,
      actual: response.status,
      passed: response.status === 200 && data.success === true,
      data: { 
        loginResponse: data,
        hasSessionCookie: !!sessionCookie?.includes('admin-session'),
        cookieSecure: sessionCookie?.includes('HttpOnly')
      },
      response: data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    results.push({
      test: 'Valid admin login',
      expected: 200,
      actual: 0,
      passed: false,
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
      response: null,
      timestamp: new Date().toISOString()
    })
  }

  // Test 2: Login with invalid credentials
  try {
    const invalidLoginData = {
      email: 'wrong@email.com',
      password: 'wrongpassword'
    }

    const response = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidLoginData)
    })

    const data = await response.json()

    results.push({
      test: 'Invalid admin login',
      expected: 401,
      actual: response.status,
      passed: response.status === 401 && data.success === false,
      data: { loginResponse: data },
      response: data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    results.push({
      test: 'Invalid admin login',
      expected: 401,
      actual: 0,
      passed: false,
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
      response: null,
      timestamp: new Date().toISOString()
    })
  }

  // Test 3: Login with missing fields
  try {
    const incompleteData = {
      email: 'admin@smartq2.com'
      // missing password
    }

    const response = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incompleteData)
    })

    const data = await response.json()

    results.push({
      test: 'Login with missing password',
      expected: 400,
      actual: response.status,
      passed: response.status === 400 && data.success === false,
      data: { loginResponse: data },
      response: data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    results.push({
      test: 'Login with missing password',
      expected: 400,
      actual: 0,
      passed: false,
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
      response: null,
      timestamp: new Date().toISOString()
    })
  }

  // Test 4: Session verification without authentication
  try {
    const response = await fetch(`${baseUrl}/api/admin/session`, {
      method: 'GET'
    })

    const data = await response.json()

    results.push({
      test: 'Session check without authentication',
      expected: 401,
      actual: response.status,
      passed: response.status === 401 && data.authenticated === false,
      data: { sessionResponse: data },
      response: data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    results.push({
      test: 'Session check without authentication',
      expected: 401,
      actual: 0,
      passed: false,
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
      response: null,
      timestamp: new Date().toISOString()
    })
  }

  // Test 5: Logout functionality
  try {
    const response = await fetch(`${baseUrl}/api/admin/logout`, {
      method: 'POST'
    })

    const data = await response.json()

    results.push({
      test: 'Admin logout',
      expected: 200,
      actual: response.status,
      passed: response.status === 200 && data.success === true,
      data: { logoutResponse: data },
      response: data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    results.push({
      test: 'Admin logout',
      expected: 200,
      actual: 0,
      passed: false,
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
      response: null,
      timestamp: new Date().toISOString()
    })
  }

  // Calculate summary
  const totalTests = results.length
  const passedTests = results.filter(r => r.passed).length
  const failedTests = totalTests - passedTests
  const passRate = Math.round((passedTests / totalTests) * 100)

  return NextResponse.json({
    success: true,
    message: 'Admin authentication system tests completed',
    summary: {
      totalTests,
      passedTests,
      failedTests,
      passRate: `${passRate}%`,
      allTestsPassed: failedTests === 0
    },
    results,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasAdminEmail: !!process.env.ADMIN_EMAIL,
      hasAdminPassword: !!process.env.ADMIN_PASSWORD,
      baseUrl
    },
    timestamp: new Date().toISOString()
  })
} 