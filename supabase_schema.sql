-- SmartQ2 Database Schema Setup
-- Fixed version - Applied successfully to Supabase project
-- Note: This was already applied via Supabase MCP

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure at least one contact method exists
    CONSTRAINT users_contact_check CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

-- Add unique constraints separately to handle conflicts gracefully
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_unique') THEN
        ALTER TABLE users ADD CONSTRAINT users_phone_unique UNIQUE (phone);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_unique') THEN
        ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
    END IF;
END $$;

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'booked',
    ticket_id TEXT, -- Will be populated by trigger (fixed immutable issue)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status constraints
    CONSTRAINT appointments_status_check CHECK (status IN ('booked', 'arrived', 'no_show', 'served', 'cancelled')),
    -- Prevent scheduling in the past (with 15 min buffer)
    CONSTRAINT appointments_future_check CHECK (scheduled_time > NOW() - INTERVAL '15 minutes'),
    -- Ensure date matches scheduled_time date
    CONSTRAINT appointments_date_consistency CHECK (date = scheduled_time::DATE)
);

-- Create walk_ins table
CREATE TABLE IF NOT EXISTS walk_ins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending',
    original_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    ticket_id TEXT, -- Will be populated by trigger (fixed immutable issue)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status constraints
    CONSTRAINT walk_ins_status_check CHECK (status IN ('pending', 'served', 'cancelled'))
);

-- Create function to generate appointment ticket ID
CREATE OR REPLACE FUNCTION generate_appointment_ticket_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_id := 'A-' || EXTRACT(EPOCH FROM NEW.scheduled_time)::BIGINT || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate walk-in ticket ID
CREATE OR REPLACE FUNCTION generate_walkin_ticket_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_id := 'W-' || EXTRACT(EPOCH FROM NEW.check_in_time)::BIGINT || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for ticket ID generation
DROP TRIGGER IF EXISTS generate_appointment_ticket_trigger ON appointments;
CREATE TRIGGER generate_appointment_ticket_trigger
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION generate_appointment_ticket_id();

DROP TRIGGER IF EXISTS generate_walkin_ticket_trigger ON walk_ins;
CREATE TRIGGER generate_walkin_ticket_trigger
    BEFORE INSERT ON walk_ins
    FOR EACH ROW
    EXECUTE FUNCTION generate_walkin_ticket_id();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_time ON appointments(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(date, status);

CREATE INDEX IF NOT EXISTS idx_walk_ins_user_id ON walk_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_walk_ins_check_in_time ON walk_ins(check_in_time);
CREATE INDEX IF NOT EXISTS idx_walk_ins_status ON walk_ins(status);
CREATE INDEX IF NOT EXISTS idx_walk_ins_original_appointment ON walk_ins(original_appointment_id);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_walk_ins_updated_at BEFORE UPDATE ON walk_ins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE walk_ins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::TEXT = id::TEXT OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (auth.uid()::TEXT = id::TEXT OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid()::TEXT = id::TEXT OR auth.role() = 'service_role');

CREATE POLICY "Service role can manage all users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for appointments table
CREATE POLICY "Users can view their own appointments" ON appointments
    FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT OR auth.role() = 'service_role');

CREATE POLICY "Service role can manage all appointments" ON appointments
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public can insert appointments" ON appointments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update appointment status" ON appointments
    FOR UPDATE USING (true);

-- RLS Policies for walk_ins table
CREATE POLICY "Users can view their own walk-ins" ON walk_ins
    FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT OR auth.role() = 'service_role');

CREATE POLICY "Service role can manage all walk-ins" ON walk_ins
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public can insert walk-ins" ON walk_ins
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update walk-in status" ON walk_ins
    FOR UPDATE USING (true);

-- Create a view for current queue status
CREATE OR REPLACE VIEW current_queue AS
SELECT 
    'appointment' as type,
    a.id,
    a.ticket_id,
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

UNION ALL

SELECT 
    'walk_in' as type,
    w.id,
    w.ticket_id,
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
WHERE DATE(w.check_in_time) = CURRENT_DATE 
  AND w.status = 'pending'

ORDER BY queue_time;

-- Grant permissions on the view
GRANT SELECT ON current_queue TO anon, authenticated, service_role;

-- Create function to get next available time slots
CREATE OR REPLACE FUNCTION get_available_slots(target_date DATE)
RETURNS TABLE(slot_time TIMESTAMP WITH TIME ZONE) AS $$
DECLARE
    start_time TIME := '09:00:00';
    end_time TIME := '17:00:00';
    slot_duration INTERVAL := '15 minutes';
    current_slot TIMESTAMP WITH TIME ZONE;
BEGIN
    current_slot := target_date + start_time;
    
    WHILE current_slot::TIME <= end_time LOOP
        -- Check if slot is available (no existing appointment)
        IF NOT EXISTS (
            SELECT 1 FROM appointments 
            WHERE scheduled_time = current_slot 
            AND status IN ('booked', 'arrived')
        ) THEN
            slot_time := current_slot;
            RETURN NEXT;
        END IF;
        
        current_slot := current_slot + slot_duration;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_available_slots TO anon, authenticated, service_role;

-- Insert some sample data for testing (optional)
-- You can remove this section if you don't want sample data

-- Sample users
INSERT INTO users (name, phone, email) VALUES 
    ('John Doe', '+1234567890', 'john@example.com'),
    ('Jane Smith', '+1234567891', 'jane@example.com'),
    ('Bob Johnson', '+1234567892', 'bob@example.com')
ON CONFLICT DO NOTHING;

-- Sample appointments for today (for testing queue functionality)
-- Note: You may want to adjust the times to current date/time for testing
INSERT INTO appointments (user_id, date, scheduled_time, status)
SELECT 
    u.id,
    CURRENT_DATE,
    CURRENT_DATE + TIME '10:00:00',
    'arrived'
FROM users u WHERE u.name = 'John Doe'
ON CONFLICT DO NOTHING;

INSERT INTO appointments (user_id, date, scheduled_time, status)
SELECT 
    u.id,
    CURRENT_DATE,
    CURRENT_DATE + TIME '10:15:00',
    'booked'
FROM users u WHERE u.name = 'Jane Smith'
ON CONFLICT DO NOTHING; 