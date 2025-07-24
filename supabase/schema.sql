-- Table pour stocker les tickets
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  color VARCHAR(7) NOT NULL, -- Couleur hexadécimale
  date DATE, -- Date du ticket (NULL si pas encore placé)
  hour INTEGER DEFAULT -1, -- Heure (-1 pour toute la journée, 0-23 pour une heure spécifique)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index pour améliorer les performances
CREATE INDEX idx_tickets_date ON tickets(date);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE
  ON tickets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Politique de sécurité (Row Level Security)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Permettre toutes les opérations pour l'instant (à ajuster selon vos besoins)
CREATE POLICY "Allow all operations on tickets" ON tickets
  FOR ALL USING (true);

-- Quelques tickets d'exemple
INSERT INTO tickets (title, color, date, hour) VALUES
  ('Réunion équipe', '#FFE5B4', NULL, -1),
  ('Appel client', '#B4E5FF', NULL, -1),
  ('Révision projet', '#FFB4B4', NULL, -1),
  ('Planning sprint', '#D4FFB4', NULL, -1);