-- Fix auto-increment for all tables in calendar schema

-- 1. Fix tickets table
-- First, get the current max ID and create sequence
DO $$
DECLARE
    max_id INTEGER;
BEGIN
    -- Get current max ID
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM calendar.tickets;
    
    -- Create sequence if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'calendar' AND sequencename = 'tickets_id_seq') THEN
        EXECUTE format('CREATE SEQUENCE calendar.tickets_id_seq START WITH %s', max_id + 1);
    ELSE
        EXECUTE format('ALTER SEQUENCE calendar.tickets_id_seq RESTART WITH %s', max_id + 1);
    END IF;
    
    -- Set default value for id column
    ALTER TABLE calendar.tickets ALTER COLUMN id SET DEFAULT nextval('calendar.tickets_id_seq');
    
    -- Set sequence ownership
    ALTER SEQUENCE calendar.tickets_id_seq OWNED BY calendar.tickets.id;
END $$;

-- 2. Fix technicians table
DO $$
DECLARE
    max_id INTEGER;
BEGIN
    -- Get current max ID
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM calendar.technicians;
    
    -- Create sequence if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'calendar' AND sequencename = 'technicians_id_seq') THEN
        EXECUTE format('CREATE SEQUENCE calendar.technicians_id_seq START WITH %s', max_id + 1);
    ELSE
        EXECUTE format('ALTER SEQUENCE calendar.technicians_id_seq RESTART WITH %s', max_id + 1);
    END IF;
    
    -- Set default value for id column
    ALTER TABLE calendar.technicians ALTER COLUMN id SET DEFAULT nextval('calendar.technicians_id_seq');
    
    -- Set sequence ownership
    ALTER SEQUENCE calendar.technicians_id_seq OWNED BY calendar.technicians.id;
END $$;

-- 3. Fix schedules table
DO $$
DECLARE
    max_id INTEGER;
BEGIN
    -- Get current max ID
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM calendar.schedules;
    
    -- Create sequence if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'calendar' AND sequencename = 'schedules_id_seq') THEN
        EXECUTE format('CREATE SEQUENCE calendar.schedules_id_seq START WITH %s', max_id + 1);
    ELSE
        EXECUTE format('ALTER SEQUENCE calendar.schedules_id_seq RESTART WITH %s', max_id + 1);
    END IF;
    
    -- Set default value for id column
    ALTER TABLE calendar.schedules ALTER COLUMN id SET DEFAULT nextval('calendar.schedules_id_seq');
    
    -- Set sequence ownership
    ALTER SEQUENCE calendar.schedules_id_seq OWNED BY calendar.schedules.id;
END $$;

-- Verify the fix
SELECT 'tickets' as table_name, 
       pg_get_serial_sequence('calendar.tickets', 'id') as sequence_name,
       currval(pg_get_serial_sequence('calendar.tickets', 'id')) as current_value
UNION ALL
SELECT 'technicians' as table_name, 
       pg_get_serial_sequence('calendar.technicians', 'id') as sequence_name,
       currval(pg_get_serial_sequence('calendar.technicians', 'id')) as current_value
UNION ALL  
SELECT 'schedules' as table_name, 
       pg_get_serial_sequence('calendar.schedules', 'id') as sequence_name,
       currval(pg_get_serial_sequence('calendar.schedules', 'id')) as current_value;