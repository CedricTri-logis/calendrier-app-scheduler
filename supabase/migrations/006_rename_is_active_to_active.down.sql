-- Rollback Migration 006: Renommer active en is_active

-- 1. Renommer la colonne dans la table technicians
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'technicians' 
        AND column_name = 'active'
    ) THEN
        ALTER TABLE technicians RENAME COLUMN active TO is_active;
    END IF;
END $$;

-- 2. Renommer la colonne dans la table schedules si elle existe
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schedules' 
        AND column_name = 'active'
    ) THEN
        ALTER TABLE schedules RENAME COLUMN active TO is_active;
    END IF;
END $$;

-- 3. Recréer la vue avec l'ancien nom de colonne
DROP VIEW IF EXISTS tickets_with_technician CASCADE;

CREATE OR REPLACE VIEW tickets_with_technician AS
SELECT 
  t.id,
  t.title,
  t.color,
  t.date,
  t.hour,
  t.technician_id,
  t.created_at,
  t.updated_at,
  tech.name as technician_name,
  tech.color as technician_color,
  tech.is_active as technician_active,
  tt.technicians as all_technicians,
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'id', tech2.id,
        'name', tech2.name,
        'color', tech2.color,
        'is_active', tech2.is_active,
        'is_primary', ttech.is_primary
      ) ORDER BY ttech.is_primary DESC, tech2.name
    )
    FROM ticket_technicians ttech
    JOIN technicians tech2 ON tech2.id = ttech.technician_id
    WHERE ttech.ticket_id = t.id
    ), '[]'::json
  ) as technicians
FROM tickets t
LEFT JOIN technicians tech ON t.technician_id = tech.id
LEFT JOIN LATERAL (
  SELECT json_agg(technician_id) as technicians
  FROM ticket_technicians
  WHERE ticket_id = t.id
) tt ON true;