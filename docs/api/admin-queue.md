# Admin Queue Management API Documentation

## Overview
The Admin Queue Management APIs provide authenticated administrators with tools to manage the patient queue, including marking patients as arrived and advancing the queue by serving patients.

## Authentication
All admin queue management endpoints require valid admin authentication via session cookies. The session is established through the `/api/admin/login` endpoint and verified for each request.

**Authentication Requirement**: Must have a valid admin session (HTTP-only cookie)  
**Authorization Level**: Admin-only access  
**Session Validation**: Automatic via `getAdminSession()` function

## API Endpoints

### POST /api/admin/mark-arrived
Marks a specific ticket (appointment or walk-in) as arrived in the queue.

**Authentication**: Required (Admin session)

**Request Body:**
```json
{
  "ticketId": "12345678-1234-1234-1234-123456789012",
  "ticketType": "appointment"
}
```

**Request Schema:**
- `ticketId` (string, UUID): The unique identifier of the ticket to mark as arrived
- `ticketType` (enum): Either "appointment" or "walk-in"

**Success Response (200):**
```json
{
  "success": true,
  "message": "Appointment marked as arrived successfully",
  "appointment": {
    "id": "12345678-1234-1234-1234-123456789012",
    "userId": "user-uuid-here",
    "date": "2024-12-07",
    "scheduledTime": "2024-12-07T14:30:00+00:00",
    "status": "arrived",
    "updatedAt": "2024-12-07T14:25:00.123456+00:00"
  },
  "adminAction": {
    "performedBy": "admin@smartq2.com",
    "timestamp": "2024-12-07T14:25:00.123Z",
    "action": "mark_arrived"
  }
}
```

**For Walk-in Tickets:**
```json
{
  "success": true,
  "message": "Walk-in marked as arrived successfully",
  "walkIn": {
    "id": "12345678-1234-1234-1234-123456789012",
    "userId": "user-uuid-here",
    "checkInTime": "2024-12-07T14:25:00+00:00",
    "status": "arrived",
    "updatedAt": "2024-12-07T14:25:00.123456+00:00"
  },
  "adminAction": {
    "performedBy": "admin@smartq2.com",
    "timestamp": "2024-12-07T14:25:00.123Z",
    "action": "mark_arrived"
  }
}
```

**Error Responses:**
- **401 Unauthorized**: No valid admin session
- **400 Bad Request**: Invalid input data or validation errors
- **404 Not Found**: Ticket ID not found
- **409 Conflict**: Ticket already marked as arrived or served
- **500 Internal Server Error**: Database or server error

**Status Validation:**
- Cannot mark tickets that are already "arrived"
- Cannot mark tickets that are already "served"
- Only accepts tickets in valid transition states

### POST /api/admin/call-next
Marks the current patient as served and advances the queue to the next patient.

**Authentication**: Required (Admin session)

**Request Body:** None required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Patient marked as served successfully. Next patient is now being served.",
  "servedPatient": {
    "id": "12345678-1234-1234-1234-123456789012",
    "userId": "user-uuid-here",
    "type": "appointment",
    "date": "2024-12-07",
    "scheduledTime": "2024-12-07T14:30:00+00:00",
    "status": "served",
    "updatedAt": "2024-12-07T14:25:00.123456+00:00"
  },
  "queue": {
    "currentlyServing": {
      "id": "next-patient-uuid",
      "type": "walk-in",
      "userId": "next-user-uuid",
      "time": "2024-12-07T14:35:00+00:00"
    },
    "nextInLine": {
      "id": "following-patient-uuid",
      "type": "appointment",
      "userId": "following-user-uuid",
      "time": "2024-12-07T15:00:00+00:00"
    },
    "totalWaiting": 2,
    "queueEmpty": false
  },
  "adminAction": {
    "performedBy": "admin@smartq2.com",
    "timestamp": "2024-12-07T14:25:00.123Z",
    "action": "call_next"
  }
}
```

**Empty Queue Response (404):**
```json
{
  "success": false,
  "message": "No patients in queue to serve",
  "queue": {
    "currentlyServing": null,
    "nextInLine": null,
    "totalWaiting": 0
  }
}
```

**Error Responses:**
- **401 Unauthorized**: No valid admin session
- **404 Not Found**: No patients in queue to serve
- **500 Internal Server Error**: Database or server error

## Queue Management Logic

### Mark-Arrived Workflow
1. **Authentication Check**: Validates admin session
2. **Input Validation**: Validates ticket ID format and type
3. **Ticket Lookup**: Finds the specified ticket in the database
4. **Status Validation**: Ensures ticket can be marked as arrived
5. **Database Update**: Updates ticket status to "arrived"
6. **Response**: Returns updated ticket information and admin action log

### Call-Next Workflow
1. **Authentication Check**: Validates admin session
2. **Queue Retrieval**: Gets all "arrived" appointments and walk-ins
3. **Queue Merging**: Combines and sorts by time (appointments by scheduled_time, walk-ins by check_in_time)
4. **Current Patient**: Identifies first patient in merged queue
5. **Status Update**: Marks current patient as "served"
6. **Queue Advancement**: Identifies next patient to be served
7. **Response**: Returns served patient info and updated queue status

### Time-Based Queue Ordering
- **Appointments**: Ordered by `scheduled_time`
- **Walk-ins**: Ordered by `check_in_time`
- **Merged Queue**: Combined and sorted chronologically
- **Fair Processing**: Ensures patients are served in order of their scheduled/arrival time

## Security Features

### Authentication Protection
- All endpoints require valid admin session cookies
- Session validation on every request
- Automatic redirect to login if session is invalid or expired

### Input Validation
- Zod schema validation for all request parameters
- UUID format validation for ticket IDs
- Enum validation for ticket types
- Comprehensive error messages for validation failures

### Admin Action Logging
- Every action logs the performing admin email
- Timestamp recording for audit trails
- Action type tracking for administrative oversight

## Usage Examples

### Mark a Patient as Arrived
```javascript
const markArrived = async (ticketId, ticketType) => {
  const response = await fetch('/api/admin/mark-arrived', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include session cookie
    body: JSON.stringify({ ticketId, ticketType })
  })
  
  const result = await response.json()
  
  if (result.success) {
    console.log('Patient marked as arrived:', result.appointment || result.walkIn)
  } else {
    console.error('Error:', result.message)
  }
}
```

### Call Next Patient
```javascript
const callNext = async () => {
  const response = await fetch('/api/admin/call-next', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include session cookie
  })
  
  const result = await response.json()
  
  if (result.success) {
    console.log('Patient served:', result.servedPatient)
    console.log('Now serving:', result.queue.currentlyServing)
    console.log('Queue status:', result.queue)
  } else {
    console.error('Error:', result.message)
  }
}
```

### Admin Dashboard Integration
```javascript
class AdminQueue {
  async markPatientArrived(patientId, type) {
    try {
      const result = await markArrived(patientId, type)
      if (result.success) {
        this.refreshQueue()
        this.showNotification(`Patient marked as arrived`)
      }
    } catch (error) {
      this.showError(`Failed to mark patient as arrived: ${error.message}`)
    }
  }
  
  async serveNextPatient() {
    try {
      const result = await callNext()
      if (result.success) {
        this.refreshQueue()
        this.showNotification(`Patient served. ${result.queue.currentlyServing ? 'Next patient ready.' : 'Queue is empty.'}`)
      }
    } catch (error) {
      this.showError(`Failed to serve patient: ${error.message}`)
    }
  }
}
```

## Error Handling

### Common Error Scenarios
1. **Authentication Failures**: Session expired or invalid
2. **Validation Errors**: Invalid ticket ID format or missing fields
3. **Data Not Found**: Ticket ID doesn't exist in database
4. **State Conflicts**: Attempting invalid status transitions
5. **Database Errors**: Connection issues or constraint violations

### Best Practices
- Always check authentication status before making requests
- Validate input data on client-side before API calls
- Handle all possible HTTP status codes appropriately
- Implement retry logic for temporary failures
- Provide clear user feedback for all error conditions

## Integration with Other Systems

### Queue Status API
- Use `/api/queue` to get current queue status after admin actions
- Real-time updates can be implemented with polling or WebSocket connections
- Queue changes reflect immediately after mark-arrived and call-next operations

### Patient Notification
- Consider implementing patient notification systems
- SMS/email alerts when patients are called
- Digital displays showing queue status and "now serving" information

### Audit and Reporting
- Admin actions are logged with timestamps and user information
- Consider implementing comprehensive audit logs for compliance
- Generate reports on queue management efficiency and patient flow

## Testing

### Test Endpoint: GET /api/test-admin-queue
Comprehensive testing suite that validates:
- Authentication requirements for all endpoints
- Input validation with various invalid data scenarios
- Error handling for non-existent tickets
- Queue processing with real database data

**Test Results:**
- ✅ Authentication protection working correctly
- ✅ Input validation with detailed error messages
- ✅ Database operations functioning properly
- ✅ Queue logic processing real data successfully

## Production Considerations

### Performance
- Database queries are optimized with proper indexing
- Queue operations are atomic to prevent race conditions
- Minimal data transfer with focused SELECT statements

### Scalability
- Endpoints designed for high-frequency admin operations
- Efficient queue merging and sorting algorithms
- Stateless design allows for horizontal scaling

### Monitoring
- Comprehensive error logging for debugging
- Admin action tracking for audit purposes
- Performance metrics can be added for monitoring response times

This API provides the foundation for comprehensive admin queue management, enabling efficient patient flow control in healthcare environments. 