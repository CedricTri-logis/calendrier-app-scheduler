-- Script complet pour créer la table tickets avec la colonne technicien
-- Copier-coller ce SQL dans l'éditeur Supabase
-- Aller sur : https://supabase.com/dashboard/project/fmuxjttjlxvrkueaacvy/sql/new

-- 1. Supprimer la table si elle existe (attention: supprime toutes les données)
-- DROP TABLE IF EXISTS tickets;

-- 2. Créer la table tickets avec toutes les colonnes nécessaires
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  color TEXT NOT NULL,
  technician VARCHAR(100),
  date DATE,
  hour INTEGER DEFAULT -1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_tickets_date ON tickets(date);
CREATE INDEX IF NOT EXISTS idx_tickets_technician ON tickets(technician);

-- 4. Activer Row Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- 5. Créer une politique pour permettre toutes les opérations (pour l'instant)
CREATE POLICY "Enable all for tickets" ON tickets
FOR ALL USING (true);

-- 6. Créer un trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE
    ON tickets FOR EACH ROW EXECUTE PROCEDURE 
    update_updated_at_column();

-- 7. Ajouter quelques tickets d'exemple avec techniciens
INSERT INTO tickets (title, color, technician) VALUES
  ('Réunion équipe', '#FFE5B4', 'David'),
  ('Appel client', '#B4E5FF', 'Sarah'),
  ('Révision projet', '#FFB4B4', 'Marc'),
  ('Planning sprint', '#D4FFB4', 'Julie'),
  ('Formation', '#E5CCFF', 'Thomas'),
  ('Maintenance', '#FFCCCC', 'Sophie');