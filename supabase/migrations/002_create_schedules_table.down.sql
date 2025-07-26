-- Rollback Migration 002: Supprimer la table des horaires

-- 1. Supprimer les fonctions
DROP FUNCTION IF EXISTS get_available_technicians(DATE, TIME);
DROP FUNCTION IF EXISTS check_schedule_overlap();

-- 2. Supprimer les triggers
DROP TRIGGER IF EXISTS check_schedule_overlap_trigger ON schedules;
DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;

-- 3. Supprimer les politiques RLS
DROP POLICY IF EXISTS "Allow all operations on schedules" ON schedules;

-- 4. Supprimer les index
DROP INDEX IF EXISTS idx_schedules_technician_id;
DROP INDEX IF EXISTS idx_schedules_date;
DROP INDEX IF EXISTS idx_schedules_type;
DROP INDEX IF EXISTS idx_schedules_date_technician;

-- 5. Supprimer la table
DROP TABLE IF EXISTS schedules;

-- 6. Supprimer le type ENUM
DROP TYPE IF EXISTS schedule_type;