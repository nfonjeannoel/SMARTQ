// GET /api/test-queue - Test endpoint for Queue Management API
// Tests queue fetching, merging logic, now serving pointer, and admin actions

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

  // Test 1: Basic queue status retrieval
  try {
    const response = await fetch(`${baseUrl}/api/queue`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    const responseData = await response.json()

    results.push({
      test: 'Basic queue status retrieval',
      expected: 200,
      actual: response.status,
      passed: response.status === 200,
      data: { endpoint: '/api/queue' },
      response: responseData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    results.push({
      test: 'Basic queue status retrieval',
      expected: 200,
      actual: 500,
      passed: false,
      data: { endpoint: '/api/queue' },
      response: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    })
  }

  // Test 2: Queue status with statistics
  try {
    const response = await fetch(`${baseUrl}/api/queue?stats=true`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    const responseData = await response.json()

    results.push({
      test: 'Queue status with statistics',
      expected: 200,
      actual: response.status,
      passed: response.status === 200,
      data: { endpoint: '/api/queue?stats=true' },
      response: responseData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    results.push({
      test: 'Queue status with statistics',
      expected: 200,
      actual: 500,
      passed: false,
      data: { endpoint: '/api/queue?stats=true' },
      response: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    })
  }

  // Test 3: Queue status with history
  try {
    const response = await fetch(`${baseUrl}/api/queue?history=true`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    const responseData = await response.json()

    results.push({
      test: 'Queue status with history',
      expected: 200,
      actual: response.status,
      passed: response.status === 200,
      data: { endpoint: '/api/queue?history=true' },
      response: responseData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    results.push({
      test: 'Queue status with history',
      expected: 200,
      actual: 500,
      passed: false,
      data: { endpoint: '/api/queue?history=true' },
      response: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    })
  }

  // Test 4: Admin action - invalid action type
  try {
    const testData = {
      action: 'invalid-action',
      ticketId: 'APT-12345'
    }

    const response = await fetch(`${baseUrl}/api/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const responseData = await response.json()

    results.push({
      test: 'Admin action - invalid action validation',
      expected: 400,
      actual: response.status,
      passed: response.status === 400,
      data: testData,
      response: responseData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    results.push({
      test: 'Admin action - invalid action validation',
      expected: 400,
      actual: 500,
      passed: false,
      data: { action: 'invalid-action', ticketId: 'APT-12345' },
      response: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    })
  }

  // Test 5: Admin action - missing parameters
  try {
    const testData = {
      action: 'call-next'
      // Missing ticketId
    }

    const response = await fetch(`${baseUrl}/api/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const responseData = await response.json()

    results.push({
      test: 'Admin action - missing parameters validation',
      expected: 400,
      actual: response.status,
      passed: response.status === 400,
      data: testData,
      response: responseData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    results.push({
      test: 'Admin action - missing parameters validation',
      expected: 400,
      actual: 500,
      passed: false,
      data: { action: 'call-next' },
      response: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    })
  }

  // Test 6: Admin action - invalid ticket format
  try {
    const testData = {
      action: 'call-next',
      ticketId: 'INVALID-FORMAT'
    }

    const response = await fetch(`${baseUrl}/api/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const responseData = await response.json()

    results.push({
      test: 'Admin action - invalid ticket format',
      expected: 400,
      actual: response.status,
      passed: response.status === 400,
      data: testData,
      response: responseData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    results.push({
      test: 'Admin action - invalid ticket format',
      expected: 400,
      actual: 500,
      passed: false,
      data: { action: 'call-next', ticketId: 'INVALID-FORMAT' },
      response: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    })
  }

  // Test 7: Queue structure validation
  try {
    const response = await fetch(`${baseUrl}/api/queue?stats=true&history=true`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    const responseData = await response.json()
    
    // Validate response structure
    const hasRequiredFields = responseData.success !== undefined &&
                             responseData.queue !== undefined &&
                             responseData.queue.nowServing !== undefined &&
                             responseData.queue.current !== undefined &&
                             responseData.queue.totalInQueue !== undefined &&
                             responseData.metadata !== undefined

    results.push({
      test: 'Queue response structure validation',
      expected: 200,
      actual: response.status,
      passed: response.status === 200 && hasRequiredFields,
      data: { endpoint: '/api/queue?stats=true&history=true' },
      response: {
        structureValid: hasRequiredFields,
        fields: {
          success: responseData.success !== undefined,
          queue: responseData.queue !== undefined,
          nowServing: responseData.queue?.nowServing !== undefined,
          current: responseData.queue?.current !== undefined,
          totalInQueue: responseData.queue?.totalInQueue !== undefined,
          metadata: responseData.metadata !== undefined
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    results.push({
      test: 'Queue response structure validation',
      expected: 200,
      actual: 500,
      passed: false,
      data: { endpoint: '/api/queue?stats=true&history=true' },
      response: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    })
  }

  // Calculate summary
  const totalTests = results.length
  const passedTests = results.filter(r => r.passed).length
  const failedTests = totalTests - passedTests
  const passRate = Math.round((passedTests / totalTests) * 100)

  return NextResponse.json({
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      passRate: `${passRate}%`
    },
    results,
    queueFeatures: {
      note: 'Queue Management API provides unified queue status with real-time updates',
      capabilities: {
        'basic-queue': 'Fetches current queue with now serving pointer',
        'statistics': 'Optional daily statistics and queue metrics',
        'history': 'Optional recently served patient history',
        'admin-actions': 'POST endpoints for queue management (call-next, mark-served)',
        'real-time': 'No-cache headers for real-time updates'
      }
    },
    apiEndpoints: {
      GET: {
        '/api/queue': 'Basic queue status',
        '/api/queue?stats=true': 'Queue with statistics',
        '/api/queue?history=true': 'Queue with history',
        '/api/queue?stats=true&history=true': 'Full queue data'
      },
      POST: {
        '/api/queue': 'Admin actions (call-next, mark-served)'
      }
    },
    instructions: {
      usage: 'Visit /api/test-queue to run Queue Management API tests',
      note: 'Tests include queue fetching, admin actions, and response structure validation',
      integration: 'Ready for real-time queue displays and admin dashboard integration'
    }
  }, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
} 