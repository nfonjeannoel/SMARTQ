// Environment variables validation for SmartQ2
// This file validates that all required environment variables are present

function getEnvVar(name: string, required = true): string {
  const value = process.env[name];
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  
  return value || '';
}

// Client-side environment variables (public)
export const env = {
  // Supabase public configuration
  NEXT_PUBLIC_SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  
  // Node environment
  NODE_ENV: getEnvVar('NODE_ENV', false) || 'development',
} as const;

// Server-side environment variables (private)
export const serverEnv = {
  // Supabase server configuration
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  
  // Admin authentication
  ADMIN_EMAIL: getEnvVar('ADMIN_EMAIL'),
  ADMIN_PASSWORD: getEnvVar('ADMIN_PASSWORD'),
} as const;

// Validation function for runtime checks
export function validateEnvironment() {
  try {
    // Validate client-side variables
    Object.entries(env).forEach(([key, value]) => {
      if (!value && key !== 'NODE_ENV') {
        throw new Error(`Missing environment variable: ${key}`);
      }
    });

    // Validate server-side variables (only on server)
    if (typeof window === 'undefined') {
      Object.entries(serverEnv).forEach(([key, value]) => {
        if (!value) {
          throw new Error(`Missing server environment variable: ${key}`);
        }
      });
    }

    return {
      success: true,
      message: 'All environment variables are properly configured'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Environment validation failed'
    };
  }
}

// Runtime validation for development
if (env.NODE_ENV === 'development') {
  const validation = validateEnvironment();
  if (!validation.success) {
    console.warn('⚠️ Environment validation warning:', validation.message);
  } else {
    console.log('✅ Environment variables validated successfully');
  }
} 