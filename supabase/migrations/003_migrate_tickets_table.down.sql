-- Rollback Migration 003: Restaurer l'ancienne structure de la table tickets

-- 1. Supprimer la vue
DROP VIEW IF EXISTS tickets_with_technician;

-- 2. Supprimer les fonctions
DROP FUNCTION IF EXISTS get_technician_workload(INTEGER, DATE, DATE);
DROP FUNCTION IF EXISTS check_ticket_assignment();

-- 3. Supprimer le trigger
DROP TRIGGER IF EXISTS check_ticket_assignment_trigger ON tickets;

-- 4. Migrer les données vers l'ancienne colonne (si elle existe encore)
-- Note: Ceci ne fonctionnera que si la colonne 'technician' n'a pas été supprimée
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'tickets' 
    AND column_name = 'technician'
  ) THEN
    UPDATE tickets t
    SET technician = tech.name
    FROM technicians tech
    WHERE t.technician_id = tech.id
    AND t.technician_id IS NOT NULL;
  END IF;
END $$;

-- 5. Supprimer l'index
DROP INDEX IF EXISTS idx_tickets_technician_id;

-- 6. Supprimer la colonne technician_id
ALTER TABLE tickets 
DROP COLUMN IF EXISTS technician_id;

-- Note: Si la colonne 'technician' a été supprimée, il faudra la recréer :
-- ALTER TABLE tickets ADD COLUMN technician VARCHAR(100);