# Walk-In API Documentation

## Overview
The Walk-In API handles walk-in patients by either claiming available appointment slots or creating walk-in records when no slots are available.

**Endpoint:** `POST /api/walk-in`

## Features
- **Smart Slot Claiming**: Searches for available appointment slots within ±15 minute window
- **Automatic User Management**: Creates new users or updates existing ones
- **Queue Integration**: Returns comprehensive queue status and wait times
- **Business Hours Validation**: Only accepts walk-ins during operating hours (9 AM - 5 PM)
- **Two Response Types**: 
  - `slot-claimed`: When available appointment slot is claimed
  - `walk-in-created`: When no slots available, adds to walk-in queue

## Request Format

### Required Fields
- `name` (string): Patient's full name (1-100 characters)
- One of the following contact methods:
  - `phone` (string, optional): Patient's phone number
  - `email` (string, optional): Patient's email address (must be valid email format)

### Request Body Example
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com"
}
```

Or with phone:
```json
{
  "name": "Jane Doe", 
  "phone": "+1-555-0123"
}
```

## Response Formats

### Success Response - Slot Claimed (200)
When an available appointment slot is found and claimed:

```json
{
  "success": true,
  "message": "Appointment slot claimed successfully",
  "type": "slot-claimed",
  "appointment": {
    "ticketId": "APT-20241208-001",
    "status": "arrived",
    "scheduledTime": "2024-12-08T14:15:00.000Z",
    "claimedAt": "2024-12-08T14:12:30.560Z",
    "user": {
      "name": "John Smith",
      "phone": null,
      "email": "john.smith@example.com"
    }
  },
  "timing": {
    "scheduledTime": "2024-12-08T14:15:00.000Z",
    "claimedAt": "2024-12-08T14:12:30.560Z",
    "slotWindow": "Available slot within ±15 minutes"
  },
  "queue": {
    "current": [...],
    "nowServing": "APT-20241208-002",
    "totalInQueue": 3,
    "totalAhead": 2,
    "scheduledAppointments": 2,
    "walkIns": 1,
    "estimatedWait": "Approximately 30 minutes"
  },
  "instructions": {
    "message": "You have claimed an available appointment slot",
    "queueStatus": "You are in the scheduled appointment queue",
    "estimatedWait": "Approximately 30 minutes"
  }
}
```

### Success Response - Walk-In Created (200)
When no appointment slots are available and a walk-in record is created:

```json
{
  "success": true,
  "message": "Added to walk-in queue",
  "type": "walk-in-created",
  "walkIn": {
    "ticketId": "WLK-20241208-001",
    "status": "waiting",
    "checkInTime": "2024-12-08T14:12:30.560Z",
    "user": {
      "name": "John Smith",
      "phone": null,
      "email": "john.smith@example.com"
    }
  },
  "timing": {
    "checkInTime": "2024-12-08T14:12:30.560Z",
    "searchWindow": "2024-12-08T13:57:30.560Z to 2024-12-08T14:27:30.560Z",
    "slotsChecked": 0
  },
  "queue": {
    "current": [...],
    "nowServing": "APT-20241208-002",
    "totalInQueue": 4,
    "totalAhead": 3,
    "scheduledAppointments": 2,
    "walkIns": 2,
    "estimatedWait": "Wait time depends on scheduled appointments ahead of you"
  },
  "instructions": {
    "message": "No appointment slots available - added to walk-in queue",
    "queueStatus": "Walk-ins are served after scheduled appointments",
    "estimatedWait": "Wait time depends on scheduled appointments ahead of you"
  }
}
```

## Error Responses

### Validation Errors (400)
```json
{
  "success": false,
  "message": "Invalid request data",
  "errors": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["name"],
      "message": "Required"
    }
  ]
}
```

### Business Hours Error (400)
```json
{
  "success": false,
  "message": "Walk-ins are only accepted during business hours (9:00 AM - 5:00 PM)",
  "details": {
    "currentTime": "2024-12-08T01:39:24.560Z",
    "businessHours": "9:00 AM - 5:00 PM"
  }
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error during walk-in processing",
  "error": "Database connection failed"
}
```

## API Logic Flow

### 1. Validation
- Validates request data (name, contact information)
- Checks business hours (9 AM - 5 PM)

### 2. User Management
- Searches for existing user by phone or email
- Updates existing user information if found
- Creates new user if no match found

### 3. Slot Search
- Defines ±15 minute search window around current time
- Searches for `booked` appointments within window
- Orders available slots by scheduled time (earliest first)

### 4. Slot Claiming or Walk-In Creation
- **If slots available**: Claims earliest slot, updates to `arrived` status
- **If no slots**: Creates walk-in record with `waiting` status

### 5. Queue Status
- Retrieves current queue information
- Calculates wait times and position estimates
- Returns comprehensive queue data

## Business Rules

### Slot Claiming Priority
1. **Time Window**: Only appointments within ±15 minutes of current time
2. **Status Filter**: Only `booked` appointments (not already checked in)
3. **Earliest First**: Claims the earliest available slot in the window
4. **Immediate Arrival**: Claimed slots are immediately marked as `arrived`

### Walk-In Queue Position
- Walk-ins are served after scheduled appointments
- Walk-ins maintain check-in time order within their priority level
- Queue estimates factor in both appointment and walk-in counts

### User Data Handling
- Existing users: Updates name and missing contact info
- New users: Creates complete user record
- Contact validation: Requires either phone OR email (not both)

## Integration Points

### Database Tables
- `users`: Patient information
- `appointments`: Appointment slots and claiming
- `walk_ins`: Walk-in records and queue management
- `current_queue`: Real-time queue status (view)

### Related APIs
- **Check-In API**: Handles appointment check-ins
- **Booking API**: Creates appointment slots that can be claimed
- **Queue Management**: Provides real-time queue updates

## Testing

### Test Endpoint
**GET** `/api/test-walkin` - Comprehensive test suite

### Test Scenarios Covered
1. Valid walk-in registration (slot claiming or queue addition)
2. Walk-in with phone number
3. Missing name validation
4. Missing contact information
5. Invalid email format
6. Empty name validation  
7. User upsert functionality

### Example Test Results
```json
{
  "summary": {
    "total": 7,
    "passed": 4,
    "failed": 3,
    "passRate": "57%"
  },
  "slotAvailability": {
    "note": "Slot claiming depends on available appointment slots within ±15 minute window",
    "scenarios": {
      "slot-claimed": "When appointment slots are available within check-in window",
      "walk-in-created": "When no slots available - patient added to walk-in queue"
    }
  }
}
```

## Usage Examples

### cURL Examples

#### Valid Walk-In Request
```bash
curl -X POST http://localhost:3000/api/walk-in \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john.smith@example.com"
  }'
```

#### With Phone Number
```bash
curl -X POST http://localhost:3000/api/walk-in \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "phone": "+1-555-0123"
  }'
```

### JavaScript/TypeScript Example
```typescript
const walkInResponse = await fetch('/api/walk-in', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Smith',
    email: 'john.smith@example.com'
  })
});

const result = await walkInResponse.json();

if (result.success) {
  if (result.type === 'slot-claimed') {
    console.log(`Claimed appointment: ${result.appointment.ticketId}`);
  } else {
    console.log(`Added to walk-in queue: ${result.walkIn.ticketId}`);
  }
} else {
  console.error(`Error: ${result.message}`);
}
```

## Performance Considerations

### Search Efficiency
- ±15 minute window limits database query scope
- Indexed queries on `scheduled_time` and `status` columns
- Early termination when first available slot is found

### Queue Calculations
- Real-time queue data from database view
- Cached wait time estimates for performance
- Efficient counting of appointment vs walk-in types

### Error Handling
- Graceful degradation if queue data unavailable
- Comprehensive validation before database operations
- Transaction safety for user upsert operations

## Security Features

### Input Validation
- Zod schema validation for all inputs
- Email format validation
- Name length limits (1-100 characters)
- Contact requirement enforcement

### Data Protection
- No sensitive data in error messages
- Proper error logging without exposure
- Sanitized database queries

### Business Logic Security
- Business hours enforcement
- Valid appointment status transitions
- Queue integrity maintenance 