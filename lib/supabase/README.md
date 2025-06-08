# Supabase Client Configuration

This directory contains the Supabase client configuration for SmartQ2, providing both client-side and server-side database access with proper TypeScript support.

## Structure

```
lib/supabase/
├── client.ts           # Client-side Supabase client (browser)
├── server.ts           # Server-side Supabase client (API routes)
├── test-connection.ts  # Connection testing utilities
├── index.ts           # Central exports
└── README.md          # This file
```

## Usage

### Client-Side Operations (Browser)

Use for components, hooks, and client-side logic:

```typescript
import { supabase } from '@/lib/supabase/client'
// or
import { supabase } from '@/lib/supabase'

// Example: Fetch public data
const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .eq('status', 'booked')
```

**Features:**
- ✅ Uses anonymous key (safe for browser)
- ✅ Respects Row Level Security (RLS) policies
- ✅ Handles authentication sessions
- ✅ Auto-refresh tokens

### Server-Side Operations (API Routes)

Use for API routes and server-side logic:

```typescript
import { supabaseServer } from '@/lib/supabase/server'
// or
import { supabaseServer } from '@/lib/supabase'

// Example: Admin operations (bypasses RLS)
const { data, error } = await supabaseServer
  .from('users')
  .insert({ name: 'New User', email: 'user@example.com' })
```

**Features:**
- ✅ Uses service role key (elevated permissions)
- ✅ Bypasses RLS policies
- ✅ Server-only (never exposed to browser)
- ✅ Suitable for admin operations

### Helper Functions

```typescript
import { 
  createServiceRoleClient, 
  createAnonClientOnServer 
} from '@/lib/supabase/server'

// Create isolated service role client
const adminClient = createServiceRoleClient()

// Create anon client on server (for RLS testing)
const restrictedClient = createAnonClientOnServer()
```

## Testing

### Automated Tests

```typescript
import { runConnectionTests } from '@/lib/supabase/test-connection'

// Run comprehensive test suite
const results = await runConnectionTests()
console.log(`${results.passed}/${results.total} tests passed`)
```

### API Endpoint Test

Visit: `http://localhost:3000/api/test-connection`

This endpoint runs all connection tests and returns detailed results.

### Individual Tests

```typescript
import {
  testClientConnection,
  testServerConnection,
  testRLSPolicies,
  testDatabaseFunctions,
  testQueueView
} from '@/lib/supabase/test-connection'

// Run individual tests
const clientResult = await testClientConnection()
const serverResult = await testServerConnection()
```

## Database Schema

The clients are configured with full TypeScript support for the database schema:

```typescript
import type { 
  User, 
  Appointment, 
  WalkIn, 
  QueueItem 
} from '@/lib/supabase'

// Fully typed operations
const user: User = await supabase
  .from('users')
  .select('*')
  .single()
```

## Security Notes

### Client-Side Security
- ✅ Only public environment variables exposed
- ✅ RLS policies protect sensitive data
- ✅ Anonymous key has limited permissions

### Server-Side Security
- ✅ Service role key only in server environment
- ✅ Full database access for admin operations
- ✅ Never exposed to browser

### RLS Policies

The database uses Row Level Security:

- **Users**: Can view/modify own data
- **Appointments**: Public insert, restricted view
- **Walk-ins**: Public insert, restricted view
- **Admin**: Service role bypasses all restrictions

## Environment Variables

Required environment variables:

```bash
# Public (client-side)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Private (server-side)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Error Handling

Both clients include proper error handling:

```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')

if (error) {
  console.error('Database error:', error.message)
  // Handle error appropriately
}
```

## Best Practices

1. **Use appropriate client**: Client for browser, server for API routes
2. **Handle errors**: Always check for `error` in responses
3. **Type safety**: Use TypeScript types for better development experience
4. **RLS awareness**: Understand which operations require elevated permissions
5. **Connection testing**: Use test utilities to verify configuration

## Troubleshooting

### Common Issues

1. **Missing environment variables**: Check `.env.local` file
2. **RLS errors**: Use server client for admin operations
3. **Connection failures**: Verify project URL and keys
4. **Type errors**: Ensure database types are up to date

### Debug Connection

Run the test suite to diagnose issues:

```bash
# Via API endpoint
curl http://localhost:3000/api/test-connection

# Via code
import { runConnectionTests } from '@/lib/supabase/test-connection'
await runConnectionTests()
``` 