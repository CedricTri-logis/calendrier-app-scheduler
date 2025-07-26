-- Migration 003: Migrer la table tickets pour utiliser technician_id

-- 1. Ajouter la nouvelle colonne technician_id
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS technician_id INTEGER REFERENCES technicians(id);

-- 2. Créer un index sur la nouvelle colonne
CREATE INDEX IF NOT EXISTS idx_tickets_technician_id ON tickets(technician_id);

-- 3. Migrer les données existantes
UPDATE tickets t
SET technician_id = tech.id
FROM technicians tech
WHERE t.technician = tech.name
AND t.technician IS NOT NULL
AND t.technician_id IS NULL;

-- 4. Gérer les tickets sans technicien ou avec "Non assigné"
UPDATE tickets
SET technician_id = (SELECT id FROM technicians WHERE name = 'Non assigné')
WHERE (technician IS NULL 
   OR technician = 'Non assigné'
   OR technician_id IS NULL);

-- 5. Fonction pour vérifier la disponibilité avant d'assigner un ticket
CREATE OR REPLACE FUNCTION check_ticket_assignment()
RETURNS TRIGGER AS $$
DECLARE
  tech_available BOOLEAN;
BEGIN
  IF NEW.date IS NULL OR NEW.technician_id = (SELECT id FROM technicians WHERE name = 'Non assigné') THEN
    RETURN NEW;
  END IF;
  
  IF NEW.hour = -1 THEN
    SELECT EXISTS(
      SELECT 1
      FROM schedules s
      WHERE s.technician_id = NEW.technician_id
      AND s.date = NEW.date
      AND s.type = 'available'
    ) INTO tech_available;
  ELSE
    SELECT EXISTS(
      SELECT 1
      FROM schedules s
      WHERE s.technician_id = NEW.technician_id
      AND s.date = NEW.date
      AND s.type = 'available'
      AND MAKE_TIME(NEW.hour, 0, 0) >= s.start_time
      AND MAKE_TIME(NEW.hour, 0, 0) < s.end_time
    ) INTO tech_available;
  END IF;
  
  IF NOT tech_available THEN
    RAISE NOTICE 'Attention: Le technicien n''est pas disponible à cette date/heure';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Créer le trigger pour vérifier les assignations
CREATE TRIGGER check_ticket_assignment_trigger
BEFORE INSERT OR UPDATE OF technician_id, date, hour ON tickets
FOR EACH ROW EXECUTE FUNCTION check_ticket_assignment();

-- 7. Vue pour faciliter l'affichage des tickets avec les infos du technicien
CREATE OR REPLACE VIEW tickets_with_technician AS
SELECT 
  t.id,
  t.title,
  t.color,
  t.date,
  t.hour,
  t.technician_id,
  tech.name as technician_name,
  tech.color as technician_color,
  tech.active as technician_active,
  t.created_at,
  t.updated_at
FROM tickets t
LEFT JOIN technicians tech ON t.technician_id = tech.id;

-- 8. Fonction pour obtenir la charge de travail d'un technicien
CREATE OR REPLACE FUNCTION get_technician_workload(
  p_technician_id INTEGER,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  ticket_count INTEGER,
  total_hours INTEGER,
  available_hours INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date as date
  ),
  ticket_counts AS (
    SELECT 
      t.date,
      COUNT(*) as ticket_count,
      COUNT(CASE WHEN t.hour != -1 THEN 1 END) as hourly_tickets
    FROM tickets t
    WHERE t.technician_id = p_technician_id
    AND t.date BETWEEN p_start_date AND p_end_date
    GROUP BY t.date
  ),
  available_time AS (
    SELECT 
      s.date,
      SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600)::INTEGER as available_hours
    FROM schedules s
    WHERE s.technician_id = p_technician_id
    AND s.date BETWEEN p_start_date AND p_end_date
    AND s.type = 'available'
    GROUP BY s.date
  )
  SELECT 
    dr.date,
    COALESCE(tc.ticket_count, 0)::INTEGER as ticket_count,
    COALESCE(tc.hourly_tickets, 0)::INTEGER as total_hours,
    COALESCE(at.available_hours, 0)::INTEGER as available_hours
  FROM date_range dr
  LEFT JOIN ticket_counts tc ON dr.date = tc.date
  LEFT JOIN available_time at ON dr.date = at.date
  ORDER BY dr.date;
END;
$$ LANGUAGE plpgsql;

-- 9. Commentaires
COMMENT ON COLUMN tickets.technician_id IS 'Référence au technicien assigné (foreign key vers technicians.id)';
COMMENT ON VIEW tickets_with_technician IS 'Vue joignant les tickets avec les informations complètes des techniciens';

-- Note: La suppression de l'ancienne colonne 'technician' sera faite dans une migration séparée
-- pour permettre un rollback sûr si nécessaire