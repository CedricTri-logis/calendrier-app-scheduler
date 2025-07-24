-- Copier-coller ce SQL dans l'éditeur Supabase
-- Aller sur : https://supabase.com/dashboard/project/fmuxjttjlxvrkueaacvy/sql/new

-- 1. Créer la table tickets
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  color TEXT NOT NULL,
  date DATE,
  hour INTEGER DEFAULT -1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Créer un index pour la performance
CREATE INDEX IF NOT EXISTS idx_tickets_date ON tickets(date);

-- 3. Activer Row Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- 4. Créer une politique pour permettre tout (pour l'instant)
CREATE POLICY "Enable all for tickets" ON tickets
FOR ALL USING (true);

-- 5. Ajouter quelques tickets d'exemple
INSERT INTO tickets (title, color) VALUES
  ('Réunion équipe', '#FFE5B4'),
  ('Appel client', '#B4E5FF'),
  ('Révision projet', '#FFB4B4'),
  ('Planning sprint', '#D4FFB4');