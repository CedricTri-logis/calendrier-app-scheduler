# 🚀 EXÉCUTION DES MIGRATIONS - GUIDE RAPIDE

## Étape 1 : Ouvrir l'éditeur SQL

👉 **Cliquez ici :** https://fmuxjttjlxvrkueaacvy.supabase.co/sql

## Étape 2 : Copier et exécuter chaque script

### Script 1 - Créer la table des techniciens

Copiez tout ce qui suit et collez dans l'éditeur SQL, puis cliquez sur "Run" :

```sql
-- Création de la table des techniciens
CREATE TABLE technicians (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(20),
  color VARCHAR(7) DEFAULT '#95A5A6',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_technicians_name ON technicians(name);
CREATE INDEX idx_technicians_active ON technicians(active);

CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE
  ON technicians FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on technicians" ON technicians
  FOR ALL USING (true);

INSERT INTO technicians (name, color, active) VALUES
  ('Jean Dupont', '#FF6B6B', true),
  ('Marie Martin', '#4ECDC4', true),
  ('Pierre Leblanc', '#45B7D1', true),
  ('Sophie Tremblay', '#96CEB4', true),
  ('Marc Gagnon', '#FECA57', true),
  ('Julie Roy', '#DDA0DD', true),
  ('Non assigné', '#95A5A6', true);
```

### Script 2 - Créer la table des horaires

Après le premier script, exécutez celui-ci :

```sql
-- Création du type pour les horaires
CREATE TYPE schedule_type AS ENUM (
  'available', 'unavailable', 'vacation', 'sick_leave', 'break'
);

-- Création de la table des horaires
CREATE TABLE schedules (
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

CREATE INDEX idx_schedules_technician_id ON schedules(technician_id);
CREATE INDEX idx_schedules_date ON schedules(date);
CREATE INDEX idx_schedules_type ON schedules(type);
CREATE INDEX idx_schedules_date_technician ON schedules(date, technician_id);

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE
  ON schedules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on schedules" ON schedules
  FOR ALL USING (true);

-- Fonction pour vérifier les chevauchements
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

CREATE TRIGGER check_schedule_overlap_trigger
BEFORE INSERT OR UPDATE ON schedules
FOR EACH ROW EXECUTE FUNCTION check_schedule_overlap();

-- Fonction pour obtenir les techniciens disponibles
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

-- Ajouter des horaires par défaut
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
```

### Script 3 - Migrer la table tickets

Enfin, exécutez ce dernier script :

```sql
-- Migration de la table tickets
ALTER TABLE tickets 
ADD COLUMN technician_id INTEGER REFERENCES technicians(id);

CREATE INDEX idx_tickets_technician_id ON tickets(technician_id);

-- Migrer les données existantes
UPDATE tickets t
SET technician_id = tech.id
FROM technicians tech
WHERE t.technician = tech.name
AND t.technician IS NOT NULL;

UPDATE tickets
SET technician_id = (SELECT id FROM technicians WHERE name = 'Non assigné')
WHERE technician IS NULL 
   OR technician = 'Non assigné'
   OR technician_id IS NULL;

-- Fonction pour vérifier la disponibilité
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

CREATE TRIGGER check_ticket_assignment_trigger
BEFORE INSERT OR UPDATE OF technician_id, date, hour ON tickets
FOR EACH ROW EXECUTE FUNCTION check_ticket_assignment();

-- Vue pour faciliter l'affichage
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

-- Fonction pour la charge de travail
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
```

## Étape 3 : Vérifier

Après avoir exécuté les 3 scripts, vérifiez avec :

```sql
-- Vérifier les techniciens
SELECT * FROM technicians;

-- Vérifier quelques horaires
SELECT * FROM schedules LIMIT 10;

-- Vérifier la vue
SELECT * FROM tickets_with_technician LIMIT 5;
```

## Étape 4 : Retour à l'application

👉 **Vérifiez le statut ici :** http://localhost:3002/migration-status

Si tout est vert ✅, les migrations sont terminées !