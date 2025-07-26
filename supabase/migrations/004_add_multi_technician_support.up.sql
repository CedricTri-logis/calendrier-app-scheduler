-- Migration 004: Ajouter le support multi-techniciens pour les tickets

-- 1. Créer la table de liaison pour supporter plusieurs techniciens par ticket
CREATE TABLE IF NOT EXISTS ticket_technicians (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  technician_id INTEGER NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(ticket_id, technician_id)
);

-- 2. Créer les index pour optimiser les performances
CREATE INDEX idx_ticket_technicians_ticket ON ticket_technicians(ticket_id);
CREATE INDEX idx_ticket_technicians_tech ON ticket_technicians(technician_id);
CREATE INDEX idx_ticket_technicians_primary ON ticket_technicians(ticket_id, is_primary) WHERE is_primary = true;

-- 3. Trigger pour mettre à jour updated_at
CREATE TRIGGER update_ticket_technicians_updated_at 
  BEFORE UPDATE ON ticket_technicians 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- 4. Migrer les assignations existantes vers la nouvelle structure
INSERT INTO ticket_technicians (ticket_id, technician_id, is_primary)
SELECT 
  id as ticket_id,
  technician_id,
  true as is_primary
FROM tickets
WHERE technician_id IS NOT NULL
ON CONFLICT (ticket_id, technician_id) DO NOTHING;

-- 5. Créer une vue pour récupérer les tickets avec tous leurs techniciens
CREATE OR REPLACE VIEW tickets_with_all_technicians AS
SELECT 
  t.id,
  t.title,
  t.color,
  t.date,
  t.hour,
  t.created_at,
  t.updated_at,
  -- Garder l'ancien technician_id pour compatibilité
  t.technician_id,
  -- Array de tous les techniciens assignés
  COALESCE(
    json_agg(
      json_build_object(
        'id', tech.id,
        'name', tech.name,
        'color', tech.color,
        'email', tech.email,
        'phone', tech.phone,
        'active', tech.active,
        'is_primary', tt.is_primary
      ) ORDER BY tt.is_primary DESC, tech.name
    ) FILTER (WHERE tech.id IS NOT NULL), 
    '[]'::json
  ) as technicians,
  -- Technicien principal pour affichage rapide
  primary_tech.name as primary_technician_name,
  primary_tech.color as primary_technician_color
FROM tickets t
LEFT JOIN ticket_technicians tt ON t.id = tt.ticket_id
LEFT JOIN technicians tech ON tt.technician_id = tech.id
LEFT JOIN ticket_technicians tt_primary ON t.id = tt_primary.ticket_id AND tt_primary.is_primary = true
LEFT JOIN technicians primary_tech ON tt_primary.technician_id = primary_tech.id
GROUP BY t.id, t.title, t.color, t.date, t.hour, t.created_at, t.updated_at, t.technician_id, primary_tech.name, primary_tech.color;

-- 6. Fonction pour ajouter un technicien à un ticket
CREATE OR REPLACE FUNCTION add_technician_to_ticket(
  p_ticket_id INTEGER,
  p_technician_id INTEGER,
  p_is_primary BOOLEAN DEFAULT false
)
RETURNS BOOLEAN AS $$
DECLARE
  v_success BOOLEAN := false;
BEGIN
  -- Si on veut le mettre comme principal, d'abord retirer le statut principal des autres
  IF p_is_primary THEN
    UPDATE ticket_technicians 
    SET is_primary = false 
    WHERE ticket_id = p_ticket_id;
  END IF;
  
  -- Insérer ou mettre à jour l'assignation
  INSERT INTO ticket_technicians (ticket_id, technician_id, is_primary)
  VALUES (p_ticket_id, p_technician_id, p_is_primary)
  ON CONFLICT (ticket_id, technician_id) 
  DO UPDATE SET is_primary = EXCLUDED.is_primary, updated_at = NOW();
  
  v_success := true;
  RETURN v_success;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 7. Fonction pour retirer un technicien d'un ticket
CREATE OR REPLACE FUNCTION remove_technician_from_ticket(
  p_ticket_id INTEGER,
  p_technician_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_was_primary BOOLEAN;
  v_new_primary_id INTEGER;
BEGIN
  -- Vérifier si c'était le technicien principal
  SELECT is_primary INTO v_was_primary
  FROM ticket_technicians
  WHERE ticket_id = p_ticket_id AND technician_id = p_technician_id;
  
  -- Supprimer l'assignation
  DELETE FROM ticket_technicians
  WHERE ticket_id = p_ticket_id AND technician_id = p_technician_id;
  
  -- Si c'était le principal, assigner un nouveau principal
  IF v_was_primary THEN
    SELECT technician_id INTO v_new_primary_id
    FROM ticket_technicians
    WHERE ticket_id = p_ticket_id
    ORDER BY created_at
    LIMIT 1;
    
    IF v_new_primary_id IS NOT NULL THEN
      UPDATE ticket_technicians
      SET is_primary = true
      WHERE ticket_id = p_ticket_id AND technician_id = v_new_primary_id;
    END IF;
  END IF;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 8. Fonction pour vérifier la disponibilité de tous les techniciens d'un ticket
CREATE OR REPLACE FUNCTION check_all_technicians_availability(
  p_ticket_id INTEGER,
  p_date DATE,
  p_hour INTEGER DEFAULT -1
)
RETURNS TABLE (
  technician_id INTEGER,
  technician_name VARCHAR,
  is_available BOOLEAN,
  availability_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    CASE 
      WHEN p_hour = -1 THEN EXISTS(
        SELECT 1 FROM schedules s
        WHERE s.technician_id = t.id
        AND s.date = p_date
        AND s.type = 'available'
      )
      ELSE EXISTS(
        SELECT 1 FROM schedules s
        WHERE s.technician_id = t.id
        AND s.date = p_date
        AND s.type = 'available'
        AND MAKE_TIME(p_hour, 0, 0) >= s.start_time
        AND MAKE_TIME(p_hour, 0, 0) < s.end_time
      )
    END as is_available,
    COALESCE(
      (SELECT s.type FROM schedules s 
       WHERE s.technician_id = t.id 
       AND s.date = p_date 
       AND s.type != 'available'
       LIMIT 1),
      'available'
    ) as availability_type
  FROM ticket_technicians tt
  JOIN technicians t ON tt.technician_id = t.id
  WHERE tt.ticket_id = p_ticket_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Activer RLS
ALTER TABLE ticket_technicians ENABLE ROW LEVEL SECURITY;

-- 10. Politiques RLS
CREATE POLICY "Ticket technicians sont visibles pour tous" ON ticket_technicians
  FOR SELECT USING (true);

CREATE POLICY "Les utilisateurs peuvent créer des assignations" ON ticket_technicians
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Les utilisateurs peuvent modifier des assignations" ON ticket_technicians
  FOR UPDATE USING (true);

CREATE POLICY "Les utilisateurs peuvent supprimer des assignations" ON ticket_technicians
  FOR DELETE USING (true);

-- 11. Commentaires
COMMENT ON TABLE ticket_technicians IS 'Table de liaison pour permettre plusieurs techniciens par ticket';
COMMENT ON COLUMN ticket_technicians.is_primary IS 'Indique si ce technicien est le responsable principal du ticket';
COMMENT ON VIEW tickets_with_all_technicians IS 'Vue des tickets avec tous leurs techniciens assignés en JSON';