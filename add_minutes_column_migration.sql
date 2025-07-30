-- ===============================================
-- MIGRATION: Add minutes column to tickets table
-- For Supabase project: fmuxjttjlxvrkueaacvy
-- ===============================================

-- Step 1: Add minutes column with default value
ALTER TABLE tickets 
ADD COLUMN minutes INTEGER DEFAULT 0;

-- Step 2: Add constraint to ensure minutes are valid (0-59)
ALTER TABLE tickets 
ADD CONSTRAINT check_minutes CHECK (minutes >= 0 AND minutes <= 59);

-- Step 3: Update all existing tickets to have minutes = 0
UPDATE tickets 
SET minutes = 0 
WHERE minutes IS NULL;

-- Step 4: Make minutes column NOT NULL
ALTER TABLE tickets 
ALTER COLUMN minutes SET NOT NULL;

-- Step 5: Add constraint for hour/minutes relationship
-- This ensures that if hour is NULL (all-day event), minutes must be 0
ALTER TABLE tickets 
ADD CONSTRAINT check_hour_minutes_relationship CHECK (
  (hour IS NULL AND minutes = 0) OR 
  (hour IS NOT NULL AND hour >= -1 AND hour <= 23)
);

-- Step 6: Create index for efficient time-based queries
CREATE INDEX IF NOT EXISTS idx_tickets_time 
ON tickets(date, hour, minutes) 
WHERE date IS NOT NULL;

-- Step 7: Add helpful documentation
COMMENT ON COLUMN tickets.minutes IS 'Minutes component of scheduled time (0-59). Used with hour column for precise scheduling (e.g., hour=12, minutes=15 = 12:15). Must be 0 for all-day events (hour=NULL).';

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================

-- Verify the column was added correctly
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' AND column_name = 'minutes';

-- Check constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'tickets' 
AND constraint_name IN ('check_minutes', 'check_hour_minutes_relationship');

-- View sample data with new column
SELECT 
    id,
    title,
    hour,
    minutes,
    CASE 
        WHEN hour IS NULL OR hour = -1 THEN 'All Day'
        ELSE CONCAT(hour, ':', LPAD(minutes::text, 2, '0'))
    END AS display_time,
    estimated_duration
FROM tickets 
LIMIT 10;