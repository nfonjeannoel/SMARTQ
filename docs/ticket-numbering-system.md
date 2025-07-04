# Daily Ticket Numbering System

## Overview

The SmartQ2 appointment system now includes a daily ticket numbering system that assigns sequential 4-digit numbers to users when they check in. This provides a clear, ordered queue that customers can easily understand.

## How It Works

### 1. Queue Number Assignment
- When users check in (either through appointments or walk-ins), they are automatically assigned the next available queue number for that day
- Queue numbers start at 1 each day and increment sequentially
- The system ensures no duplicate numbers are assigned on the same day
- Queue numbers are only assigned when users actually check in, not when they book appointments

### 2. Database Changes
- **`appointments` table**: Added `queue_number` INTEGER field
- **`walk_ins` table**: Added `queue_number` INTEGER field  
- **`get_next_queue_number()` function**: Returns the next available queue number for a given date
- **Updated `current_queue` view**: Now includes queue numbers and orders by them

### 3. API Changes

#### Check-in API (`/api/check-in`)
- Now assigns queue numbers when users successfully check in
- Returns the assigned queue number in the response
- Queue numbers are included for both on-time and late arrivals

**Example Response:**
```json
{
  "success": true,
  "message": "Checked in successfully",
  "appointment": {
    "ticketId": "A-1750845600-3266ade7",
    "queueNumber": 15,
    "status": "arrived",
    "user": {
      "name": "John Doe"
    }
  }
}
```

#### Walk-in API (`/api/walk-in`)
- Assigns queue numbers for both scenarios:
  - When claiming an available appointment slot
  - When creating a new walk-in record
- Queue numbers are included in responses

#### Queue API (`/api/queue`)
- Public queue data now includes queue numbers
- Queue is ordered by queue number (ascending)
- Shows which ticket numbers are "up next"

**Example Queue Response:**
```json
{
  "success": true,
  "queue": {
    "nowServing": {
      "queueNumber": 12,
      "ticketId": "A-1750845600-abc123",
      "name": "Current Patient"
    },
    "current": [
      {
        "queueNumber": 13,
        "ticketId": "W-1750845700-def456", 
        "name": "Next Patient",
        "position": 1,
        "estimatedWait": "Next in line"
      },
      {
        "queueNumber": 14,
        "ticketId": "A-1750845800-ghi789",
        "name": "Another Patient", 
        "position": 2,
        "estimatedWait": "Approximately 15 minutes"
      }
    ]
  }
}
```

## Implementation Details

### Queue Number Generation
The `get_next_queue_number()` function:
- Checks both `appointments` and `walk_ins` tables
- Finds the highest queue number for the specified date
- Returns the next sequential number
- Handles date boundaries properly (resets each day)

### Database Migration
To add this functionality to an existing database, run:
```sql
-- See migration_add_queue_numbers.sql for the complete migration
```

### Constraints
- Queue numbers must be positive integers when assigned
- NULL values are allowed (for users who haven't checked in yet)
- Unique constraint is enforced per day across both tables

## User Experience

### For Patients
- Receive a clear queue number when checking in
- Can see their position in the public queue
- Understand exactly how many people are ahead of them

### For Staff/Admin
- Clear visual indication of queue order
- Easy to call "Number 15" instead of full names
- Simple queue management with numerical order

### Public Display
- Shows current ticket numbers being served
- Lists upcoming ticket numbers in order
- Clear "Now Serving: #12, Next: #13, #14, #15..." format

## Queue Number Display Format

Queue numbers are displayed as simple integers:
- **Queue Number 1** (first check-in of the day)
- **Queue Number 15** (15th check-in of the day)
- **Queue Number 47** (47th check-in of the day)

The system supports up to 9999 check-ins per day (4-digit capacity), which should be sufficient for most medical practices.

## Technical Notes

### Error Handling
- If queue number generation fails, the check-in process fails gracefully
- Duplicate number prevention through database-level constraints
- Proper transaction handling to prevent race conditions

### Performance
- Indexed queue number fields for fast queries
- Efficient date-based filtering
- Optimized queue ordering queries

### Timezone Considerations
- Queue numbers reset at midnight in the server's timezone
- Date comparisons use DATE casting for consistency
- Business day logic respects local timezone settings 