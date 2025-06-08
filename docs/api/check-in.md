# Check-In API Documentation

## Endpoint
`POST /api/check-in`

## Description
Handles appointment check-ins with timing validation. Supports both on-time arrivals and late arrivals (converted to walk-ins).

## Request Format

### Headers
```
Content-Type: application/json
```

### Body Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticketId` | string | Yes | The appointment ticket ID (e.g., "A-1749478500-88cadbfd") |
| `phone` | string | Optional* | Phone number used during booking |
| `email` | string | Optional* | Email address used during booking |

*Note: Either `phone` OR `email` must be provided for verification

### Example Request
```json
{
  "ticketId": "A-1749478500-88cadbfd",
  "email": "john.doe@example.com"
}
```

## Response Formats

### Success Response (On-Time Check-In)
**Status Code:** `200`
```json
{
  "success": true,
  "message": "Checked in successfully",
  "checkInType": "on-time",
  "appointment": {
    "ticketId": "A-1749478500-88cadbfd",
    "status": "arrived",
    "scheduledTime": "2025-06-10T18:30:00+00:00",
    "user": {
      "name": "Test User",
      "phone": "+1234567890",
      "email": "test@example.com"
    }
  },
  "checkInTime": "2025-06-08T01:25:08.449Z",
  "timing": {
    "scheduledTime": "2025-06-10T18:30:00+00:00",
    "checkInTime": "2025-06-08T01:25:08.449Z",
    "minutesFromScheduled": 15
  },
  "queue": {
    "current": [...],
    "nowServing": "A-1749376800-6ad3d8e7",
    "totalInQueue": 3,
    "totalAhead": 2,
    "estimatedWait": "Approximately 30 minutes"
  },
  "instructions": {
    "message": "You have been added to the queue",
    "queueStatus": "Please wait for your name to be called",
    "estimatedWait": "Approximately 30 minutes"
  }
}
```

### Success Response (Late Arrival - Walk-In)
**Status Code:** `200`
```json
{
  "success": true,
  "message": "Late arrival - converted to walk-in",
  "checkInType": "late-walkin",
  "walkIn": {
    "ticketId": "W-1749580800-abc123ef",
    "status": "waiting",
    "checkInTime": "2025-06-08T01:30:00.000Z",
    "originalAppointment": {
      "ticketId": "A-1749478500-88cadbfd",
      "scheduledTime": "2025-06-08T01:00:00.000Z"
    },
    "user": {
      "name": "Test User",
      "phone": "+1234567890",
      "email": "test@example.com"
    }
  },
  "timing": {
    "scheduledTime": "2025-06-08T01:00:00.000Z",
    "checkInTime": "2025-06-08T01:30:00.000Z",
    "minutesLate": 30,
    "lateBy": "30 minutes"
  },
  "queue": {
    "current": [...],
    "nowServing": "A-1749376800-6ad3d8e7",
    "totalInQueue": 5,
    "totalAhead": 4,
    "estimatedWait": "Wait time depends on scheduled appointments ahead of you"
  },
  "instructions": {
    "message": "You have been added to the walk-in queue",
    "queueStatus": "Walk-ins are served after scheduled appointments",
    "estimatedWait": "Wait time depends on scheduled appointments ahead of you"
  }
}
```

### Already Checked In Response
**Status Code:** `200`
```json
{
  "success": true,
  "message": "Already checked in",
  "appointment": {
    "ticketId": "A-1749478500-88cadbfd",
    "status": "arrived",
    "scheduledTime": "2025-06-10T18:30:00+00:00",
    "user": {
      "name": "Test User",
      "phone": "+1234567890", 
      "email": "test@example.com"
    }
  },
  "checkInTime": null,
  "queue": {...}
}
```

## Error Responses

### Invalid Request Data
**Status Code:** `400`
```json
{
  "success": false,
  "message": "Invalid request data",
  "errors": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "message": "Ticket ID is required",
      "path": ["ticketId"]
    }
  ]
}
```

### Appointment Not Found
**Status Code:** `404`
```json
{
  "success": false,
  "message": "Appointment not found",
  "details": {
    "ticketId": "INVALID-TICKET-123",
    "error": "Invalid ticket ID or appointment does not exist"
  }
}
```

### Contact Information Mismatch
**Status Code:** `403`
```json
{
  "success": false,
  "message": "Contact information does not match our records",
  "details": {
    "provided": {
      "email": "wrong@example.com"
    },
    "message": "Please provide the phone number or email used when booking"
  }
}
```

### Appointment Time Passed
**Status Code:** `400`
```json
{
  "success": false,
  "message": "Appointment time has passed",
  "details": {
    "scheduledTime": "2025-06-07T10:00:00.000Z",
    "currentTime": "2025-06-08T01:25:08.449Z",
    "message": "Please book a new appointment"
  }
}
```

### Cancelled/Completed Appointment
**Status Code:** `400`
```json
{
  "success": false,
  "message": "Cannot check in - appointment is cancelled",
  "details": {
    "ticketId": "A-1749478500-88cadbfd",
    "status": "cancelled"
  }
}
```

## Timing Logic

### On-Time Check-In
- **Condition**: Check-in occurs ≥15 minutes before OR ≤15 minutes after scheduled time
- **Action**: Update appointment status to `arrived`
- **Result**: Added to main appointment queue

### Late Arrival (Walk-In Conversion)
- **Condition**: Check-in occurs >15 minutes after but <1 hour after scheduled time
- **Action**: Create walk-in record, update original appointment to `converted_to_walkin`
- **Result**: Added to walk-in queue (served after scheduled appointments)

### Expired Appointment
- **Condition**: Check-in occurs >1 hour after scheduled time
- **Action**: Reject check-in
- **Result**: User must book new appointment

## Queue Information

The response includes current queue status:
- `current`: Array of people currently in queue
- `nowServing`: Ticket ID currently being served
- `totalInQueue`: Total number of people in queue
- `totalAhead`: Number of people ahead of current user
- `estimatedWait`: Estimated wait time based on queue position

## Usage Examples

### Valid Check-In
```bash
curl -X POST http://localhost:3000/api/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "ticketId": "A-1749478500-88cadbfd",
    "email": "john.doe@example.com"
  }'
```

### Check-In with Phone
```bash
curl -X POST http://localhost:3000/api/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "ticketId": "A-1749478500-88cadbfd",
    "phone": "+1234567890"
  }'
```

## Testing

Use the test endpoint to validate functionality:
```
GET /api/test-checkin
```

This endpoint runs comprehensive tests including:
- Valid ticket check-in
- Invalid ticket ID
- Missing contact information
- Wrong contact information
- Empty ticket ID
- Invalid email format

## Security & Validation

- Contact information verification prevents unauthorized check-ins
- Zod schema validation ensures proper request format
- Database integrity maintained through proper transaction handling
- Error responses don't expose sensitive user information

## Integration Notes

- Requires existing appointment in `appointments` table
- Uses `current_queue` view for queue status
- Creates records in `walk_ins` table for late arrivals
- Updates appointment status for tracking workflow
- Compatible with future real-time queue updates (Task 11) 