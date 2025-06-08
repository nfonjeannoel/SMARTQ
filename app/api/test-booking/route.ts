// Test endpoint for Book Appointment API
// Tests various booking scenarios to validate the implementation

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const baseUrl = request.nextUrl.origin
  
  // Test cases for the booking API
  const testCases = [
    {
      name: 'Valid booking - new user',
      data: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        date: '2025-06-09',
        time: '10:15'
      },
      expectedStatus: 201
    },
    {
      name: 'Invalid email format',
      data: {
        name: 'Jane Smith',
        email: 'invalid-email',
        date: '2025-06-09',
        time: '10:30'
      },
      expectedStatus: 400
    },
    {
      name: 'Missing contact info',
      data: {
        name: 'Bob Johnson',
        date: '2025-06-09',
        time: '10:45'
      },
      expectedStatus: 400
    },
    {
      name: 'Invalid time format',
      data: {
        name: 'Alice Brown',
        email: 'alice@example.com',
        date: '2025-06-09',
        time: '25:00'
      },
      expectedStatus: 400
    },
    {
      name: 'Non-15-minute interval',
      data: {
        name: 'Charlie Wilson',
        email: 'charlie@example.com',
        date: '2025-06-09',
        time: '10:17'
      },
      expectedStatus: 400
    },
    {
      name: 'Outside business hours',
      data: {
        name: 'Diana Davis',
        email: 'diana@example.com',
        date: '2025-06-09',
        time: '08:00'
      },
      expectedStatus: 400
    },
    {
      name: 'Past appointment',
      data: {
        name: 'Eve Miller',
        email: 'eve@example.com',
        date: '2020-01-01',
        time: '10:00'
      },
      expectedStatus: 400
    }
  ]

  const results = []

  for (const testCase of testCases) {
    try {
      const response = await fetch(`${baseUrl}/api/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data),
      })

      const result = await response.json()
      
      results.push({
        test: testCase.name,
        expected: testCase.expectedStatus,
        actual: response.status,
        passed: response.status === testCase.expectedStatus,
        data: testCase.data,
        response: result,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      results.push({
        test: testCase.name,
        expected: testCase.expectedStatus,
        actual: 'ERROR',
        passed: false,
        data: testCase.data,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }
  }

  const passedTests = results.filter(r => r.passed).length
  const totalTests = results.length

  return NextResponse.json({
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      passRate: `${Math.round((passedTests / totalTests) * 100)}%`
    },
    results,
    instructions: {
      usage: 'Visit /api/test-booking to run booking API tests',
      note: 'Tests include validation, business rules, and error handling',
      cleanup: 'Test appointments may need manual cleanup in production'
    }
  }, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'cleanup') {
      // In a real scenario, you might want to clean up test data
      return NextResponse.json({
        message: 'Test data cleanup would be performed here',
        note: 'In production, implement proper test data cleanup'
      })
    }

    return NextResponse.json({
      message: 'Unknown action',
      availableActions: ['cleanup']
    }, { status: 400 })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 