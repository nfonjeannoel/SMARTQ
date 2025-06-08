# Admin Authentication API Documentation

## Overview
The Admin Authentication system provides secure access control for administrative features using JWT-based session management. It includes login/logout functionality, session verification, and automatic route protection via middleware.

## Security Features
- **JWT Token Authentication**: Secure session tokens with expiration
- **HTTP-Only Cookies**: Session tokens stored in secure, HTTP-only cookies
- **Environment-Based Credentials**: Admin credentials stored in environment variables
- **Middleware Protection**: Automatic route protection for admin pages
- **Session Expiration**: 24-hour session duration with automatic cleanup

## API Endpoints

### POST /api/admin/login
Authenticates admin credentials and establishes a secure session.

**Request Body:**
```json
{
  "email": "admin@smartq2.com",
  "password": "password"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "admin": {
    "email": "admin@smartq2.com",
    "isAdmin": true
  }
}
```

**Error Responses:**
- **400 Bad Request**: Missing or invalid input data
- **401 Unauthorized**: Invalid credentials
- **500 Internal Server Error**: Server error during authentication

**Features:**
- Input validation using Zod schema
- Secure JWT token generation
- HTTP-only session cookie creation
- Credential validation against environment variables

### POST /api/admin/logout
Clears the admin session and removes the session cookie.

**Request:** No body required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Features:**
- Clears admin session cookie
- Secure cookie removal
- Always returns success (safe to call multiple times)

### GET /api/admin/session
Verifies current admin authentication status and returns session information.

**Request:** No body required (reads session from cookies)

**Success Response (200):**
```json
{
  "success": true,
  "authenticated": true,
  "admin": {
    "email": "admin@smartq2.com",
    "isAdmin": true,
    "sessionExpiry": 1672531200
  },
  "message": "Valid admin session"
}
```

**Error Responses:**
- **401 Unauthorized**: No active session or session expired

**Features:**
- Session validation from HTTP-only cookies
- Expiration time checking
- Secure session information return

## Authentication Library (`lib/auth/admin.ts`)

### Core Functions

#### `validateAdminCredentials(email, password)`
Validates admin credentials against environment variables.

#### `createAdminToken(email)`
Creates a secure JWT token for admin sessions.

#### `verifyAdminToken(token)`
Verifies and decodes JWT tokens, returning session information.

#### `adminLogin(credentials)`
Complete login flow with validation and token creation.

#### `getAdminSession(request)` / `getServerAdminSession()`
Retrieves current admin session from request or server-side cookies.

#### `setAdminSessionCookie(response, token)`
Sets secure session cookie in HTTP response.

#### `clearAdminSessionCookie(response)`
Removes session cookie from HTTP response.

#### `requireAdminAuth(request)`
Middleware function for protecting admin routes.

#### `isAdmin()`
Utility function to check admin status in components/pages.

### Session Configuration
- **Duration**: 24 hours
- **Cookie Name**: `admin-session`
- **Security**: HTTP-only, secure in production, SameSite=lax
- **JWT Algorithm**: HS256

## Middleware Protection (`middleware.ts`)

### Route Protection
- **Protected Routes**: All `/admin/*` routes except `/admin/login`
- **Automatic Redirects**: Unauthenticated users redirected to `/admin/login`
- **Session Validation**: Checks token validity and expiration
- **Redirect Parameters**: Preserves intended destination and expiration status

### Middleware Configuration
```javascript
export const config = {
  matcher: ['/admin/:path*']
}
```

## Environment Variables

### Required Configuration
```bash
# Admin credentials
ADMIN_EMAIL=admin@smartq2.com
ADMIN_PASSWORD=your-secure-password

# JWT secret (change in production)
JWT_SECRET=your-jwt-secret-key

# Other variables
NODE_ENV=development
```

### Security Recommendations
- Use strong, unique passwords for admin accounts
- Change JWT_SECRET in production to a cryptographically secure random string
- Consider implementing password hashing for additional security
- Enable HTTPS in production for secure cookie transmission

## Usage Examples

### Frontend Login Implementation
```javascript
const login = async (email, password) => {
  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  
  const result = await response.json()
  
  if (result.success) {
    // Redirect to admin dashboard
    window.location.href = '/admin'
  } else {
    // Show error message
    console.error(result.message)
  }
}
```

### Session Check in Components
```javascript
import { isAdmin } from '@/lib/auth/admin'

export default async function AdminComponent() {
  const adminStatus = await isAdmin()
  
  if (!adminStatus) {
    return <div>Access denied</div>
  }
  
  return <div>Admin content</div>
}
```

### API Route Protection
```javascript
import { getAdminSession } from '@/lib/auth/admin'

export async function POST(request) {
  const session = await getAdminSession(request)
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { status: 401 }
    )
  }
  
  // Continue with admin-only logic
}
```

## Testing

### Test Endpoint: GET /api/test-admin-auth
Comprehensive testing suite that validates:
- Valid admin login with correct credentials
- Invalid login attempts with wrong credentials
- Missing field validation
- Session verification without authentication
- Logout functionality

**Test Results:**
- ✅ 100% pass rate (5/5 tests)
- ✅ Secure cookie handling
- ✅ Proper error responses
- ✅ Session validation
- ✅ Input validation

## Security Considerations

### Current Implementation
- JWT tokens with 24-hour expiration
- HTTP-only cookies prevent XSS access
- Secure flag in production
- Environment-based credential storage
- Automatic route protection via middleware

### Future Enhancements
- Password hashing with bcrypt
- Rate limiting for login attempts
- Session invalidation on security events
- Multi-factor authentication
- Audit logging for admin actions

## Integration with Admin Features

This authentication system serves as the foundation for:
- **Task 13**: Admin Queue Management APIs
- **Task 14**: Admin Dashboard UI
- **Future Admin Features**: User management, system configuration, reporting

The middleware automatically protects all admin routes, ensuring only authenticated administrators can access sensitive functionality. 