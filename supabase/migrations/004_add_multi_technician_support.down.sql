-- Rollback Migration 004: Supprimer le support multi-techniciens

-- 1. Supprimer les politiques RLS
DROP POLICY IF EXISTS "Ticket technicians sont visibles pour tous" ON ticket_technicians;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des assignations" ON ticket_technicians;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier des assignations" ON ticket_technicians;
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer des assignations" ON ticket_technicians;

-- 2. Supprimer les fonctions
DROP FUNCTION IF EXISTS check_all_technicians_availability(INTEGER, DATE, INTEGER);
DROP FUNCTION IF EXISTS remove_technician_from_ticket(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS add_technician_to_ticket(INTEGER, INTEGER, BOOLEAN);

-- 3. Supprimer la vue
DROP VIEW IF EXISTS tickets_with_all_technicians;

-- 4. Supprimer les index
DROP INDEX IF EXISTS idx_ticket_technicians_primary;
DROP INDEX IF EXISTS idx_ticket_technicians_tech;
DROP INDEX IF EXISTS idx_ticket_technicians_ticket;

-- 5. Supprimer le trigger
DROP TRIGGER IF EXISTS update_ticket_technicians_updated_at ON ticket_technicians;

-- 6. Supprimer la table
DROP TABLE IF EXISTS ticket_technicians;

-- Note: Cette migration ne restaure pas les anciennes données dans tickets.technician_id
-- car elles sont toujours présentes