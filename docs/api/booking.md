# Booking API Documentation

## Overview
The Book Appointment API allows users to schedule appointments in the SmartQ2 queue management system. It includes comprehensive validation, conflict checking, and user management.

## Endpoint

**POST** `/api/book`

Book a new appointment with automatic user creation/update and conflict detection.

## Request Format

### Headers
```
Content-Type: application/json
```

### Body Schema
```json
{
  "name": "string (required, 1-100 chars)",
  "phone": "string (optional)",
  "email": "string (optional, valid email)",
  "date": "string (required, YYYY-MM-DD format)",
  "time": "string (required, HH:MM format, 15-min intervals)"
}
```

### Validation Rules

1. **Contact Information**: Either `phone` OR `email` must be provided
2. **Name**: Required, 1-100 characters
3. **Email**: Must be valid email format if provided
4. **Date**: Must be in YYYY-MM-DD format
5. **Time**: Must be in HH:MM format
6. **Business Hours**: 9:00 AM - 5:00 PM (09:00 - 17:00)
7. **Time Intervals**: Must be on 15-minute intervals (e.g., 09:00, 09:15, 09:30, 09:45)
8. **Future Booking**: Must be at least 15 minutes from current time
9. **Conflict Check**: No other booked/arrived appointments in the same slot

## Response Format

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "appointment": {
    "ticketId": "A-001",
    "scheduledTime": "2024-12-20T10:15:00.000Z",
    "date": "2024-12-20",
    "time": "10:15",
    "status": "booked"
  },
  "user": {
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john.doe@example.com"
  },
  "queue": {
    "current": [...],
    "nowServing": "A-001",
    "totalAhead": 3
  },
  "instructions": {
    "checkIn": "Please arrive at least 15 minutes before your appointment time",
    "late": "Late arrivals may be converted to walk-in status",
    "contact": "Keep your ticket ID for check-in"
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Errors
```json
{
  "success": false,
  "message": "Invalid request data",
  "errors": [
    {
      "code": "invalid_string",
      "expected": "string",
      "received": "undefined",
      "path": ["name"],
      "message": "Name is required"
    }
  ]
}
```

#### 400 Bad Request - Business Rule Violations
```json
{
  "success": false,
  "message": "Appointment must be scheduled at least 15 minutes in the future",
  "details": {
    "requestedTime": "2024-12-20T10:00:00.000Z",
    "minimumTime": "2024-12-20T10:15:00.000Z"
  }
}
```

#### 409 Conflict - Time Slot Taken
```json
{
  "success": false,
  "message": "This time slot is already booked",
  "details": {
    "requestedTime": "2024-12-20T10:15:00.000Z",
    "conflictingTicket": "A-002"
  }
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error during booking",
  "error": "Database connection failed"
}
```

## Examples

### Valid Booking Request
```bash
curl -X POST http://localhost:3000/api/book \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "date": "2024-12-20",
    "time": "10:15"
  }'
```

### Phone-Only Booking
```bash
curl -X POST http://localhost:3000/api/book \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "phone": "+1987654321",
    "date": "2024-12-20",
    "time": "14:30"
  }'
```

### Email-Only Booking
```bash
curl -X POST http://localhost:3000/api/book \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Johnson",
    "email": "bob@example.com",
    "date": "2024-12-21",
    "time": "09:45"
  }'
```

## User Management Logic

### New User Creation
- If no existing user found by phone or email
- Creates new user record with provided information
- Returns new user ID for appointment

### Existing User Update
- Searches for existing user by phone OR email
- Updates user record with latest information
- Preserves existing contact info if new request doesn't include both
- Updates `updated_at` timestamp

### Contact Information Priority
- If both phone and email provided: both are stored/updated
- If only one provided: existing value is preserved for the other
- At least one contact method must be provided in the request

## Business Rules

### Time Slots
- **Available Hours**: 9:00 AM - 5:00 PM (Monday-Sunday)
- **Intervals**: 15-minute slots only (09:00, 09:15, 09:30, 09:45, etc.)
- **Advance Booking**: Minimum 15 minutes from current time
- **Conflict Detection**: One appointment per time slot

### Appointment Status Flow
1. **booked**: Initial status after successful booking
2. **arrived**: Set when user checks in (handled by check-in API)
3. **serving**: Set when user is being served (handled by queue API)
4. **completed**: Set when service is finished
5. **no-show**: Set if user doesn't arrive within grace period

### Ticket ID Generation
- Automatically generated using database trigger
- Format: A-001, A-002, A-003, etc. (for appointments)
- Unique across all queue entries
- Used for check-in and queue management

## Testing

### Automated Test Suite
Visit `/api/test-booking` to run comprehensive tests including:
- Valid booking scenarios
- Validation error cases
- Business rule violations
- Edge cases and error handling

### Manual Testing Scenarios
1. **Happy Path**: Valid booking with all fields
2. **Validation**: Test each validation rule individually
3. **Conflicts**: Try booking same time slot twice
4. **User Updates**: Book with existing phone/email
5. **Edge Cases**: Business hours, time intervals, past dates

## Error Handling

### Client Errors (4xx)
- **400**: Validation failures, business rule violations
- **409**: Time slot conflicts

### Server Errors (5xx)
- **500**: Database errors, internal failures
- Detailed error messages in development
- Generic messages in production for security

### Graceful Degradation
- Queue information is optional in response
- Booking succeeds even if queue fetch fails
- Comprehensive error logging for debugging

## Security Considerations

### Input Validation
- All inputs validated using Zod schemas
- SQL injection protection via Supabase client
- XSS prevention through proper JSON handling

### Rate Limiting
- Consider implementing rate limiting for production
- Prevent spam bookings from same IP/user
- Monitor for unusual booking patterns

### Data Privacy
- Phone numbers and emails are PII
- Ensure proper data handling compliance
- Consider implementing data retention policies

## Performance Considerations

### Database Queries
- Indexed queries for conflict checking
- Efficient user lookup by phone/email
- Single transaction for user+appointment creation

### Response Time
- Typical response: < 500ms
- Conflict checking adds minimal overhead
- Queue fetch is optional and cached-friendly

### Scalability
- Horizontal scaling ready
- Database connection pooling recommended
- Consider caching for high-traffic scenarios 