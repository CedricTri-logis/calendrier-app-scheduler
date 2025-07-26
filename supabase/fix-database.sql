-- Script pour créer toutes les tables et vues nécessaires
-- À exécuter directement dans l'éditeur SQL de Supabase

-- 1. Créer la table migration_history si elle n'existe pas
CREATE TABLE IF NOT EXISTS migration_history (
  id SERIAL PRIMARY KEY,
  version VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  status VARCHAR(50) DEFAULT 'applied' CHECK (status IN ('applied', 'rolled_back', 'failed')),
  checksum VARCHAR(64) NOT NULL,
  execution_time_ms INTEGER
);

-- 2. Créer la table technicians
CREATE TABLE IF NOT EXISTS technicians (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) NOT NULL DEFAULT '#0070f3',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Insérer les techniciens par défaut
INSERT INTO technicians (name, color) VALUES
  ('Non assigné', '#6c757d'),
  ('Jean Dupont', '#0070f3'),
  ('Marie Martin', '#dc3545'),
  ('Pierre Durand', '#28a745'),
  ('Sophie Bernard', '#6610f2')
ON CONFLICT (name) DO NOTHING;

-- 4. Créer la table schedules
CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  technician_id INTEGER NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- 5. Créer l'index pour éviter les chevauchements
CREATE INDEX IF NOT EXISTS idx_schedules_technician_day ON schedules(technician_id, day_of_week);

-- 6. Ajouter technician_id à tickets si nécessaire
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS technician_id INTEGER REFERENCES technicians(id);

-- 7. Mettre à jour les tickets sans technicien
UPDATE tickets
SET technician_id = (SELECT id FROM technicians WHERE name = 'Non assigné')
WHERE technician_id IS NULL;

-- 8. Créer ou remplacer la vue tickets_with_technician
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
  tech.is_active as technician_active,
  t.created_at,
  t.updated_at
FROM tickets t
LEFT JOIN technicians tech ON t.technician_id = tech.id;

-- 9. Créer la fonction pour obtenir les techniciens disponibles
CREATE OR REPLACE FUNCTION get_available_technicians(
  check_date DATE,
  check_start_time TIME,
  check_end_time TIME
)
RETURNS TABLE (
  technician_id INTEGER,
  technician_name VARCHAR,
  technician_color VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    t.id,
    t.name,
    t.color
  FROM technicians t
  WHERE t.is_active = true
    AND EXISTS (
      SELECT 1
      FROM schedules s
      WHERE s.technician_id = t.id
        AND s.day_of_week = EXTRACT(DOW FROM check_date)
        AND s.is_active = true
        AND s.start_time <= check_start_time
        AND s.end_time >= check_end_time
    )
    AND NOT EXISTS (
      SELECT 1
      FROM tickets tk
      WHERE tk.technician_id = t.id
        AND tk.date = check_date
        AND tk.hour >= 0
        AND (
          (check_start_time <= (tk.hour || ':00')::TIME AND check_end_time > (tk.hour || ':00')::TIME)
          OR
          (check_start_time < ((tk.hour + 1) || ':00')::TIME AND check_end_time >= ((tk.hour + 1) || ':00')::TIME)
        )
    );
END;
$$;

-- 9. Créer la fonction RPC exec_sql si elle n'existe pas
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE query;
  RETURN json_build_object(
    'success', true,
    'message', 'Query executed successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- 10. Restreindre l'accès à la fonction exec_sql
REVOKE ALL ON FUNCTION exec_sql(text) FROM public;
REVOKE ALL ON FUNCTION exec_sql(text) FROM anon;
REVOKE ALL ON FUNCTION exec_sql(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- 11. Activer RLS sur les tables
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- 12. Créer les politiques RLS pour technicians
CREATE POLICY "Les techniciens sont visibles par tous" ON technicians
  FOR SELECT USING (true);

CREATE POLICY "Seuls les admins peuvent créer des techniciens" ON technicians
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Seuls les admins peuvent modifier les techniciens" ON technicians
  FOR UPDATE USING (false);

CREATE POLICY "Seuls les admins peuvent supprimer des techniciens" ON technicians
  FOR DELETE USING (false);

-- 13. Créer les politiques RLS pour schedules
CREATE POLICY "Les horaires sont visibles par tous" ON schedules
  FOR SELECT USING (true);

CREATE POLICY "Seuls les admins peuvent créer des horaires" ON schedules
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Seuls les admins peuvent modifier les horaires" ON schedules
  FOR UPDATE USING (false);

CREATE POLICY "Seuls les admins peuvent supprimer des horaires" ON schedules
  FOR DELETE USING (false);

-- 14. Marquer les migrations comme appliquées
INSERT INTO migration_history (version, name, checksum, execution_time_ms) VALUES
  ('000', 'create_migration_history', 'manual', 0),
  ('001', 'create_technicians_table', 'manual', 0),
  ('002', 'create_schedules_table', 'manual', 0),
  ('003', 'migrate_tickets_table', 'manual', 0)
ON CONFLICT (version) DO NOTHING;

-- Afficher un message de succès
SELECT 'Toutes les tables et vues ont été créées avec succès!' as message;