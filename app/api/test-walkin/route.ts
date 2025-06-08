// GET /api/test-walkin - Test endpoint for walk-in API
// Tests various walk-in scenarios including slot claiming and walk-in creation

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

  // Test 1: Valid walk-in with slot claiming potential
  try {
    const testData = {
      name: 'Walk-In Patient One',
      email: 'walkin1@example.com'
    }

    const response = await fetch(`${baseUrl}/api/walk-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const responseData = await response.json()

    results.push({
      test: 'Valid walk-in patient registration',
      expected: 200,
      actual: response.status,
      passed: response.status === 200,
      data: testData,
      response: responseData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    results.push({
      test: 'Valid walk-in patient registration',
      expected: 200,
      actual: 500,
      passed: false,
      data: { name: 'Walk-In Patient One', email: 'walkin1@example.com' },
      response: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    })
  }

  // Test 2: Walk-in with phone number
  try {
    const testData = {
      name: 'Walk-In Patient Two',
      phone: '+1555000001'
    }

    const response = await fetch(`${baseUrl}/api/walk-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const responseData = await response.json()

    results.push({
      test: 'Walk-in with phone number',
      expected: 200,
      actual: response.status,
      passed: response.status === 200,
      data: testData,
      response: responseData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    results.push({
      test: 'Walk-in with phone number',
      expected: 200,
      actual: 500,
      passed: false,
      data: { name: 'Walk-In Patient Two', phone: '+1555000001' },
      response: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    })
  }

  // Test 3: Missing name
  try {
    const testData = {
      email: 'test@example.com'
      // Missing name
    }

    const response = await fetch(`${baseUrl}/api/walk-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const responseData = await response.json()

    results.push({
      test: 'Missing name validation',
      expected: 400,
      actual: response.status,
      passed: response.status === 400,
      data: testData,
      response: responseData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    results.push({
      test: 'Missing name validation',
      expected: 400,
      actual: 500,
      passed: false,
      data: { email: 'test@example.com' },
      response: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    })
  }

  // Test 4: Missing contact information
  try {
    const testData = {
      name: 'Test Patient'
      // No phone or email
    }

    const response = await fetch(`${baseUrl}/api/walk-in`, {
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
      data: { name: 'Test Patient' },
      response: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    })
  }

  // Test 5: Invalid email format
  try {
    const testData = {
      name: 'Test Patient',
      email: 'invalid-email-format'
    }

    const response = await fetch(`${baseUrl}/api/walk-in`, {
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
      data: { name: 'Test Patient', email: 'invalid-email-format' },
      response: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    })
  }

  // Test 6: Empty name
  try {
    const testData = {
      name: '',
      email: 'test@example.com'
    }

    const response = await fetch(`${baseUrl}/api/walk-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const responseData = await response.json()

    results.push({
      test: 'Empty name validation',
      expected: 400,
      actual: response.status,
      passed: response.status === 400,
      data: testData,
      response: responseData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    results.push({
      test: 'Empty name validation',
      expected: 400,
      actual: 500,
      passed: false,
      data: { name: '', email: 'test@example.com' },
      response: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString()
    })
  }

  // Test 7: User upsert functionality
  try {
    const testData = {
      name: 'Walk-In Patient One Updated',
      email: 'walkin1@example.com' // Same email as Test 1
    }

    const response = await fetch(`${baseUrl}/api/walk-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })

    const responseData = await response.json()

    results.push({
      test: 'User upsert with existing email',
      expected: 200,
      actual: response.status,
      passed: response.status === 200,
      data: testData,
      response: responseData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    results.push({
      test: 'User upsert with existing email',
      expected: 200,
      actual: 500,
      passed: false,
      data: { name: 'Walk-In Patient One Updated', email: 'walkin1@example.com' },
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
    slotAvailability: {
      note: 'Slot claiming depends on available appointment slots within ±15 minute window',
      scenarios: {
        'slot-claimed': 'When appointment slots are available within check-in window',
        'walk-in-created': 'When no slots available - patient added to walk-in queue'
      }
    },
    instructions: {
      usage: 'Visit /api/test-walkin to run walk-in API tests',
      note: 'Tests include slot search logic, user creation/update, and error handling',
      timing: 'Slot availability depends on existing appointments in ±15 minute window from current time'
    }
  }, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
} 