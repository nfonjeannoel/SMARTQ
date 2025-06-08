// GET /api/test-checkin - Test endpoint for check-in API
// Tests various check-in scenarios including timing validation

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

  // Test 1: Valid check-in with existing ticket
  try {
    const testData = {
      ticketId: 'A-1749478500-88cadbfd', // Using ticket from previous booking tests
      email: 'john.doe@example.com'
    }

    const response = await fetch(`${baseUrl}/api/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const responseData = await response.json()

    results.push({
      test: 'Valid check-in with existing ticket',
      expected: 200,
      actual: response.status,
      passed: response.status === 200,
      data: testData,
      response: responseData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    results.push({
      test: 'Valid check-in with existing ticket',
      expected: 200,
      actual: 500,
      passed: false,
      data: { ticketId: 'A-1749478500-88cadbfd', email: 'john.doe@example.com' },
      response: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    })
  }

  // Test 2: Invalid ticket ID
  try {
    const testData = {
      ticketId: 'INVALID-TICKET-123',
      email: 'test@example.com'
    }

    const response = await fetch(`${baseUrl}/api/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const responseData = await response.json()

    results.push({
      test: 'Invalid ticket ID',
      expected: 404,
      actual: response.status,
      passed: response.status === 404,
      data: testData,
      response: responseData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    results.push({
      test: 'Invalid ticket ID',
      expected: 404,
      actual: 500,
      passed: false,
      data: { ticketId: 'INVALID-TICKET-123', email: 'test@example.com' },
      response: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    })
  }

  // Test 3: Missing contact information
  try {
    const testData = {
      ticketId: 'A-1749478500-88cadbfd'
      // No phone or email
    }

    const response = await fetch(`${baseUrl}/api/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const responseData = await response.json()

    results.push({
      test: 'Missing contact information',
      expected: 400,
      actual: response.status,
      passed: response.status === 400,
      data: testData,
      response: responseData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    results.push({
      test: 'Missing contact information',
      expected: 400,
      actual: 500,
      passed: false,
      data: { ticketId: 'A-1749478500-88cadbfd' },
      response: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    })
  }

  // Test 4: Wrong contact information
  try {
    const testData = {
      ticketId: 'A-1749478500-88cadbfd',
      email: 'wrong@example.com'
    }

    const response = await fetch(`${baseUrl}/api/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const responseData = await response.json()

    results.push({
      test: 'Wrong contact information',
      expected: 403,
      actual: response.status,
      passed: response.status === 403,
      data: testData,
      response: responseData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    results.push({
      test: 'Wrong contact information',
      expected: 403,
      actual: 500,
      passed: false,
      data: { ticketId: 'A-1749478500-88cadbfd', email: 'wrong@example.com' },
      response: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    })
  }

  // Test 5: Empty ticket ID
  try {
    const testData = {
      ticketId: '',
      email: 'test@example.com'
    }

    const response = await fetch(`${baseUrl}/api/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const responseData = await response.json()

    results.push({
      test: 'Empty ticket ID',
      expected: 400,
      actual: response.status,
      passed: response.status === 400,
      data: testData,
      response: responseData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    results.push({
      test: 'Empty ticket ID',
      expected: 400,
      actual: 500,
      passed: false,
      data: { ticketId: '', email: 'test@example.com' },
      response: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    })
  }

  // Test 6: Invalid email format
  try {
    const testData = {
      ticketId: 'A-1749478500-88cadbfd',
      email: 'invalid-email'
    }

    const response = await fetch(`${baseUrl}/api/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const responseData = await response.json()

    results.push({
      test: 'Invalid email format',
      expected: 400,
      actual: response.status,
      passed: response.status === 400,
      data: testData,
      response: responseData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    results.push({
      test: 'Invalid email format',
      expected: 400,
      actual: 500,
      passed: false,
      data: { ticketId: 'A-1749478500-88cadbfd', email: 'invalid-email' },
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
    instructions: {
      usage: 'Visit /api/test-checkin to run check-in API tests',
      note: 'Tests include ticket validation, contact verification, and error handling',
      timing: 'Some tests may fail if using expired or non-existent tickets from previous test runs'
    }
  }, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
} 