// Test API route to verify Supabase connection
// GET /api/test-connection

import { NextRequest, NextResponse } from 'next/server'
import { runConnectionTests } from '@/lib/supabase/test-connection'

export async function GET(request: NextRequest) {
  try {
    // Run comprehensive connection tests
    const testResults = await runConnectionTests()
    
    return NextResponse.json({
      success: testResults.allPassed,
      message: testResults.allPassed 
        ? 'All Supabase connections are working correctly!'
        : 'Some connection tests failed',
      results: testResults.results,
      summary: {
        passed: testResults.passed,
        total: testResults.total,
        percentage: Math.round((testResults.passed / testResults.total) * 100)
      }
    }, { 
      status: testResults.allPassed ? 200 : 500 
    })
    
  } catch (error) {
    console.error('Connection test error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Failed to run connection tests',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500 
    })
  }
} 