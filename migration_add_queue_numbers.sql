-- Migration: Add queue number system to SmartQ2
-- Run this script to add queue number functionality to existing database

-- Add queue_number column to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS queue_number INTEGER;

-- Add queue_number column to walk_ins table  
ALTER TABLE walk_ins 
ADD COLUMN IF NOT EXISTS queue_number INTEGER;

-- Add constraints for queue numbers
ALTER TABLE appointments 
ADD CONSTRAINT IF NOT EXISTS appointments_queue_number_positive 
CHECK (queue_number IS NULL OR queue_number > 0);

ALTER TABLE walk_ins 
ADD CONSTRAINT IF NOT EXISTS walk_ins_queue_number_positive 
CHECK (queue_number IS NULL OR queue_number > 0);

-- Create function to get next queue number for the day
CREATE OR REPLACE FUNCTION get_next_queue_number(check_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Get the highest queue number for the given date from both tables
    SELECT COALESCE(MAX(greatest_queue_num), 0) + 1 INTO next_number
    FROM (
        SELECT COALESCE(MAX(queue_number), 0) as greatest_queue_num
        FROM appointments 
        WHERE date = check_date AND queue_number IS NOT NULL
        
        UNION ALL
        
        SELECT COALESCE(MAX(queue_number), 0) as greatest_queue_num
        FROM walk_ins 
        WHERE check_in_time::DATE = check_date AND queue_number IS NOT NULL
    ) combined_numbers;
    
    RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Create new indexes for queue numbers
CREATE INDEX IF NOT EXISTS idx_appointments_queue_number ON appointments(queue_number);
CREATE INDEX IF NOT EXISTS idx_appointments_date_queue_number ON appointments(date, queue_number);
CREATE INDEX IF NOT EXISTS idx_walk_ins_queue_number ON walk_ins(queue_number);
CREATE INDEX IF NOT EXISTS idx_walk_ins_date_queue_number ON walk_ins((check_in_time::DATE), queue_number);

-- Update the current_queue view to include queue numbers and order by them
CREATE OR REPLACE VIEW current_queue AS
SELECT 
    'appointment' as type,
    a.id,
    a.ticket_id,
    a.queue_number,
    u.name,
    u.phone,
    u.email,
    a.scheduled_time as queue_time,
    a.status,
    a.scheduled_time,
    NULL as check_in_time,
    NULL as original_appointment_id
FROM appointments a
JOIN users u ON a.user_id = u.id
WHERE a.date = CURRENT_DATE 
  AND a.status = 'arrived'
  AND a.queue_number IS NOT NULL

UNION ALL

SELECT 
    'walk_in' as type,
    w.id,
    w.ticket_id,
    w.queue_number,
    u.name,
    u.phone,
    u.email,
    w.check_in_time as queue_time,
    w.status,
    NULL as scheduled_time,
    w.check_in_time,
    w.original_appointment_id
FROM walk_ins w
JOIN users u ON w.user_id = u.id
WHERE w.check_in_time::DATE = CURRENT_DATE 
  AND w.status = 'pending'
  AND w.queue_number IS NOT NULL

ORDER BY queue_number; 