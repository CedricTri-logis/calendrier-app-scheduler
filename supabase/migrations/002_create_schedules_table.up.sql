-- Migration 002: Créer la table des horaires

-- 1. Créer le type ENUM pour les types d'horaires
DO $$ BEGIN
  CREATE TYPE schedule_type AS ENUM (
    'available',
    'unavailable',
    'vacation',
    'sick_leave',
    'break'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Créer la table schedules
CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  technician_id INTEGER NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  type schedule_type NOT NULL DEFAULT 'available',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT unique_schedule UNIQUE (technician_id, date, start_time)
);

-- 3. Créer les index
CREATE INDEX IF NOT EXISTS idx_schedules_technician_id ON schedules(technician_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_type ON schedules(type);
CREATE INDEX IF NOT EXISTS idx_schedules_date_technician ON schedules(date, technician_id);

-- 4. Ajouter le trigger pour updated_at
CREATE TRIGGER update_schedules_updated_at 
  BEFORE UPDATE ON schedules 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- 5. Activer RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- 6. Politique RLS
CREATE POLICY "Allow all operations on schedules" ON schedules
  FOR ALL USING (true);

-- 7. Fonction pour vérifier les chevauchements
CREATE OR REPLACE FUNCTION check_schedule_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM schedules
    WHERE technician_id = NEW.technician_id
    AND date = NEW.date
    AND id != COALESCE(NEW.id, -1)
    AND (
      (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
      (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
      (NEW.start_time <= start_time AND NEW.end_time >= end_time)
    )
  ) THEN
    RAISE EXCEPTION 'Les horaires se chevauchent avec un horaire existant';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Créer le trigger pour vérifier les chevauchements
CREATE TRIGGER check_schedule_overlap_trigger
BEFORE INSERT OR UPDATE ON schedules
FOR EACH ROW EXECUTE FUNCTION check_schedule_overlap();

-- 9. Fonction pour obtenir les techniciens disponibles
CREATE OR REPLACE FUNCTION get_available_technicians(
  p_date DATE,
  p_time TIME DEFAULT NULL
)
RETURNS TABLE (
  technician_id INTEGER,
  technician_name VARCHAR,
  technician_color VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    t.id,
    t.name,
    t.color
  FROM technicians t
  WHERE t.active = true
  AND (
    p_time IS NULL AND EXISTS (
      SELECT 1
      FROM schedules s
      WHERE s.technician_id = t.id
      AND s.date = p_date
      AND s.type = 'available'
    )
    OR
    p_time IS NOT NULL AND EXISTS (
      SELECT 1
      FROM schedules s
      WHERE s.technician_id = t.id
      AND s.date = p_date
      AND s.type = 'available'
      AND p_time >= s.start_time
      AND p_time < s.end_time
    )
  )
  AND NOT EXISTS (
    SELECT 1
    FROM schedules s
    WHERE s.technician_id = t.id
    AND s.date = p_date
    AND s.type != 'available'
    AND (
      p_time IS NULL OR
      (p_time >= s.start_time AND p_time < s.end_time)
    )
  );
END;
$$ LANGUAGE plpgsql;

-- 10. Ajouter des horaires par défaut (30 prochains jours, lun-ven, 8h-12h et 13h-17h)
DO $$
DECLARE
  tech_id INTEGER;
  work_date DATE;
BEGIN
  FOR tech_id IN 
    SELECT id FROM technicians 
    WHERE active = true AND name != 'Non assigné'
  LOOP
    FOR work_date IN 
      SELECT generate_series(
        CURRENT_DATE, 
        CURRENT_DATE + INTERVAL '30 days', 
        '1 day'::interval
      )::date
    LOOP
      IF EXTRACT(DOW FROM work_date) BETWEEN 1 AND 5 THEN
        INSERT INTO schedules (technician_id, date, start_time, end_time, type)
        VALUES (tech_id, work_date, '08:00', '12:00', 'available')
        ON CONFLICT DO NOTHING;
        
        INSERT INTO schedules (technician_id, date, start_time, end_time, type)
        VALUES (tech_id, work_date, '13:00', '17:00', 'available')
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 11. Commentaires
COMMENT ON TABLE schedules IS 'Table des horaires et disponibilités des techniciens';
COMMENT ON COLUMN schedules.type IS 'Type d''horaire : available, unavailable, vacation, sick_leave, break';
COMMENT ON COLUMN schedules.notes IS 'Notes optionnelles pour expliquer l''indisponibilité';