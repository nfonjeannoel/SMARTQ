# SmartQ2 Setup Guide

## Environment Configuration

### 1. Environment Variables Setup

Your `.env.local` file has been created with the following structure:

```bash
# Supabase Configuration (Already configured)
NEXT_PUBLIC_SUPABASE_URL=https://wwwpemnminnrryopvzqk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (REQUIRED ACTION)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Admin Authentication (Already configured)
ADMIN_EMAIL=admin@smartq2.com
ADMIN_PASSWORD=SmartQ2Admin2024!
```

### 2. Get Your Service Role Key

**IMPORTANT**: You need to get your Service Role Key from Supabase:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/wwwpemnminnrryopvzqk/settings/api)
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (not the anon key)
4. Replace `your_service_role_key_here` in `.env.local`

### 3. Verify Configuration

The project includes automatic environment validation. When you start the development server, you'll see:

- ✅ **Success**: "Environment variables validated successfully"
- ⚠️ **Warning**: Missing variables will be reported

### 4. Security Notes

- ✅ `.env.local` is already in `.gitignore`
- ✅ Only `NEXT_PUBLIC_*` variables are exposed to the browser
- ✅ Server-side keys (`SUPABASE_SERVICE_ROLE_KEY`, admin credentials) remain private

### 5. Test Your Setup

Run the development server to test your configuration:

```bash
npm run dev
```

Look for the environment validation message in the console.

## Database Setup

✅ **Already Complete**: Your Supabase database schema has been deployed with:

- `users` table with contact validation
- `appointments` table with auto-generated ticket IDs
- `walk_ins` table with queue management
- Row Level Security (RLS) policies
- Performance indexes
- Queue management views and functions

## Next Steps

With environment variables configured, you're ready to:

1. **Task 3**: Setup Supabase Client Configuration
2. **Task 4**: Implement Book Appointment API
3. Continue with the remaining tasks...

## Troubleshooting

### Missing Service Role Key
If you see warnings about `SUPABASE_SERVICE_ROLE_KEY`, follow step 2 above.

### Environment Variables Not Loading
- Ensure `.env.local` is in the project root
- Restart your development server after changes
- Check that variable names match exactly (case-sensitive)

### Supabase Connection Issues
- Verify your project URL and keys in the Supabase dashboard
- Check that your project is active and healthy
- Ensure RLS policies allow your operations 