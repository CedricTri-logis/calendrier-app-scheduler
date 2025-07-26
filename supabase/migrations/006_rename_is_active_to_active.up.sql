-- Migration 006: Renommer is_active en active dans toutes les tables

-- 1. Renommer la colonne dans la table technicians si elle existe encore comme is_active
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'technicians' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE technicians RENAME COLUMN is_active TO active;
    END IF;
END $$;

-- 2. Renommer la colonne dans la table schedules si elle existe
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schedules' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE schedules RENAME COLUMN is_active TO active;
    END IF;
END $$;

-- 3. Mettre à jour les vues qui utilisent is_active
-- Vérifier si la vue tickets_with_technician existe et la recréer
DROP VIEW IF EXISTS tickets_with_technician CASCADE;

-- Recréer la vue avec le bon nom de colonne
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
  tech.active as technician_active,
  tt.technicians as all_technicians,
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'id', tech2.id,
        'name', tech2.name,
        'color', tech2.color,
        'active', tech2.active,
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

-- 4. Mettre à jour les fonctions RPC si nécessaire
-- Note: Si des fonctions utilisent is_active, elles devront être mises à jour aussi

-- 5. Ajouter des commentaires pour documenter le changement
COMMENT ON COLUMN technicians.active IS 'Indique si le technicien est actif (peut recevoir des tickets) - Renommé de is_active';
COMMENT ON COLUMN schedules.active IS 'Indique si l''horaire est actif - Renommé de is_active' WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'schedules' 
    AND column_name = 'active'
);