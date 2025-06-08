// Test utility for environment configuration
// Run this to verify your environment setup

import { env, serverEnv, validateEnvironment } from './env';

export function testEnvironmentSetup() {
  console.log('🧪 Testing Environment Configuration...\n');

  // Test validation
  const validation = validateEnvironment();
  
  if (validation.success) {
    console.log('✅ Environment Validation: PASSED');
  } else {
    console.log('❌ Environment Validation: FAILED');
    console.log('   Error:', validation.message);
    return false;
  }

  // Test client-side variables
  console.log('\n📋 Client-side Variables:');
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   NODE_ENV: ${env.NODE_ENV}`);

  // Test server-side variables (only on server)
  if (typeof window === 'undefined') {
    console.log('\n🔐 Server-side Variables:');
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${serverEnv.SUPABASE_SERVICE_ROLE_KEY.includes('your_service_role_key_here') ? '⚠️ Default value (needs replacement)' : '✅ Set'}`);
    console.log(`   ADMIN_EMAIL: ${serverEnv.ADMIN_EMAIL ? '✅ Set' : '❌ Missing'}`);
    console.log(`   ADMIN_PASSWORD: ${serverEnv.ADMIN_PASSWORD ? '✅ Set' : '❌ Missing'}`);
  }

  // Check for common issues
  console.log('\n🔍 Common Issues Check:');
  
  if (serverEnv.SUPABASE_SERVICE_ROLE_KEY.includes('your_service_role_key_here')) {
    console.log('   ⚠️ Service Role Key needs to be replaced with actual key from Supabase Dashboard');
    console.log('   📖 See SETUP.md for instructions');
  } else {
    console.log('   ✅ Service Role Key appears to be configured');
  }

  if (!env.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co')) {
    console.log('   ⚠️ Supabase URL format looks incorrect');
  } else {
    console.log('   ✅ Supabase URL format is correct');
  }

  console.log('\n🎉 Environment test complete!');
  return true;
}

// Auto-run in development
if (env.NODE_ENV === 'development' && typeof window === 'undefined') {
  // Only run once to avoid spam
  if (!global.__envTestRun) {
    global.__envTestRun = true;
    testEnvironmentSetup();
  }
} 