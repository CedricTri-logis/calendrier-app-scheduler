-- Migration de la table tickets pour utiliser la référence aux techniciens
-- Ce script préserve toutes les données existantes

-- 1. Ajouter la nouvelle colonne technician_id (nullable temporairement)
ALTER TABLE tickets 
ADD COLUMN technician_id INTEGER REFERENCES technicians(id);

-- 2. Créer un index sur la nouvelle colonne
CREATE INDEX idx_tickets_technician_id ON tickets(technician_id);

-- 3. Migrer les données existantes
-- Associer chaque nom de technicien à son ID dans la nouvelle table
UPDATE tickets t
SET technician_id = tech.id
FROM technicians tech
WHERE t.technician = tech.name
AND t.technician IS NOT NULL;

-- 4. Gérer les tickets sans technicien ou avec "Non assigné"
UPDATE tickets
SET technician_id = (SELECT id FROM technicians WHERE name = 'Non assigné')
WHERE technician IS NULL 
   OR technician = 'Non assigné'
   OR technician_id IS NULL;

-- 5. Vérifier que tous les tickets ont maintenant un technician_id
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count 
  FROM tickets 
  WHERE technician_id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE NOTICE 'Attention: % tickets n''ont pas pu être migrés', orphan_count;
  ELSE
    RAISE NOTICE 'Migration réussie: tous les tickets ont été migrés';
  END IF;
END $$;

-- 6. Supprimer l'ancienne colonne technician (à exécuter après vérification)
-- ALTER TABLE tickets DROP COLUMN technician;

-- 7. Fonction pour vérifier la disponibilité avant d'assigner un ticket
CREATE OR REPLACE FUNCTION check_ticket_assignment()
RETURNS TRIGGER AS $$
DECLARE
  tech_available BOOLEAN;
BEGIN
  -- Si le ticket n'a pas de date/heure ou si c'est "Non assigné", pas de vérification
  IF NEW.date IS NULL OR NEW.technician_id = (SELECT id FROM technicians WHERE name = 'Non assigné') THEN
    RETURN NEW;
  END IF;
  
  -- Vérifier si le technicien est disponible
  IF NEW.hour = -1 THEN
    -- Ticket toute la journée : vérifier qu'il y a au moins une plage disponible
    SELECT EXISTS(
      SELECT 1
      FROM schedules s
      WHERE s.technician_id = NEW.technician_id
      AND s.date = NEW.date
      AND s.type = 'available'
    ) INTO tech_available;
  ELSE
    -- Ticket avec heure spécifique
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
  
  -- Optionnel : vous pouvez choisir d'avertir ou de bloquer
  IF NOT tech_available THEN
    -- Option 1 : Avertissement seulement
    RAISE NOTICE 'Attention: Le technicien n''est pas disponible à cette date/heure';
    
    -- Option 2 : Bloquer l'assignation (décommenter pour activer)
    -- RAISE EXCEPTION 'Le technicien n''est pas disponible à cette date/heure';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Créer le trigger pour vérifier les assignations
CREATE TRIGGER check_ticket_assignment_trigger
BEFORE INSERT OR UPDATE OF technician_id, date, hour ON tickets
FOR EACH ROW EXECUTE FUNCTION check_ticket_assignment();

-- 9. Vue pour faciliter l'affichage des tickets avec les infos du technicien
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

-- 10. Fonction helper pour obtenir la charge de travail d'un technicien
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

-- 11. Commentaires
COMMENT ON COLUMN tickets.technician_id IS 'Référence au technicien assigné (foreign key vers technicians.id)';
COMMENT ON VIEW tickets_with_technician IS 'Vue joignant les tickets avec les informations complètes des techniciens';