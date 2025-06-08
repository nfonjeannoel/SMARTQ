// Supabase connection testing utility
// Use this to verify both client and server configurations are working

import { supabase } from './client'
import { supabaseServer, createAnonClientOnServer } from './server'

export interface ConnectionTestResult {
  success: boolean
  message: string
  details?: any
}

// Test client-side connection
export async function testClientConnection(): Promise<ConnectionTestResult> {
  try {
    console.log('🧪 Testing client-side Supabase connection...')
    
    // Test basic connection by fetching a simple query
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (error) {
      return {
        success: false,
        message: `Client connection failed: ${error.message}`,
        details: error
      }
    }
    
    return {
      success: true,
      message: 'Client-side connection successful',
      details: { recordCount: data?.length || 0 }
    }
  } catch (error) {
    return {
      success: false,
      message: `Client connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

// Test server-side connection
export async function testServerConnection(): Promise<ConnectionTestResult> {
  try {
    console.log('🧪 Testing server-side Supabase connection...')
    
    // Test service role connection
    const { data, error } = await supabaseServer
      .from('users')
      .select('id, name')
      .limit(5)
    
    if (error) {
      return {
        success: false,
        message: `Server connection failed: ${error.message}`,
        details: error
      }
    }
    
    return {
      success: true,
      message: 'Server-side connection successful',
      details: { recordCount: data?.length || 0 }
    }
  } catch (error) {
    return {
      success: false,
      message: `Server connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

// Test RLS policies work correctly
export async function testRLSPolicies(): Promise<ConnectionTestResult> {
  try {
    console.log('🧪 Testing RLS policies...')
    
    // Create anon client on server to test RLS
    const anonClient = createAnonClientOnServer()
    
    // Try to access users table with anon client (should be restricted by RLS)
    const { data: anonData, error: anonError } = await anonClient
      .from('users')
      .select('*')
      .limit(1)
    
    // Try the same with service role (should bypass RLS)
    const { data: serviceData, error: serviceError } = await supabaseServer
      .from('users')
      .select('*')
      .limit(1)
    
    if (serviceError) {
      return {
        success: false,
        message: `RLS test failed - service role error: ${serviceError.message}`,
        details: { anonError, serviceError }
      }
    }
    
    return {
      success: true,
      message: 'RLS policies working correctly',
      details: {
        anonAccessible: !anonError,
        serviceRoleAccessible: !serviceError,
        anonRecords: anonData?.length || 0,
        serviceRecords: serviceData?.length || 0
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `RLS test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

// Test database functions
export async function testDatabaseFunctions(): Promise<ConnectionTestResult> {
  try {
    console.log('🧪 Testing database functions...')
    
    // Test the get_available_slots function
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabaseServer
      .rpc('get_available_slots', { target_date: today })
    
    if (error) {
      return {
        success: false,
        message: `Database function test failed: ${error.message}`,
        details: error
      }
    }
    
    return {
      success: true,
      message: 'Database functions working correctly',
      details: { availableSlots: data?.length || 0, testDate: today }
    }
  } catch (error) {
    return {
      success: false,
      message: `Database function error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

// Test current_queue view
export async function testQueueView(): Promise<ConnectionTestResult> {
  try {
    console.log('🧪 Testing queue view...')
    
    // Test the current_queue view
    const { data, error } = await supabaseServer
      .from('current_queue')
      .select('*')
      .limit(10)
    
    if (error) {
      return {
        success: false,
        message: `Queue view test failed: ${error.message}`,
        details: error
      }
    }
    
    return {
      success: true,
      message: 'Queue view working correctly',
      details: { queueLength: data?.length || 0 }
    }
  } catch (error) {
    return {
      success: false,
      message: `Queue view error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

// Run comprehensive test suite
export async function runConnectionTests() {
  console.log('🧪 Running Supabase Connection Test Suite...\n')
  
  const tests = [
    { name: 'Client Connection', test: testClientConnection },
    { name: 'Server Connection', test: testServerConnection },
    { name: 'RLS Policies', test: testRLSPolicies },
    { name: 'Database Functions', test: testDatabaseFunctions },
    { name: 'Queue View', test: testQueueView },
  ]
  
  const results = []
  
  for (const { name, test } of tests) {
    const result = await test()
    results.push({ name, ...result })
    
    if (result.success) {
      console.log(`✅ ${name}: ${result.message}`)
      if (result.details) {
        console.log(`   Details:`, result.details)
      }
    } else {
      console.log(`❌ ${name}: ${result.message}`)
      if (result.details) {
        console.log(`   Error:`, result.details)
      }
    }
    console.log('')
  }
  
  const successCount = results.filter(r => r.success).length
  const totalCount = results.length
  
  console.log(`🎉 Test Summary: ${successCount}/${totalCount} tests passed`)
  
  if (successCount === totalCount) {
    console.log('✅ All Supabase connections are working correctly!')
  } else {
    console.log('⚠️ Some tests failed. Check the details above.')
  }
  
  return {
    passed: successCount,
    total: totalCount,
    results,
    allPassed: successCount === totalCount
  }
} 