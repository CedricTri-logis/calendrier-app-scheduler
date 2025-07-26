-- Migration 001: Créer la table des techniciens

-- 1. Créer la table technicians
CREATE TABLE IF NOT EXISTS technicians (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(20),
  color VARCHAR(7) DEFAULT '#95A5A6',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Créer les index
CREATE INDEX IF NOT EXISTS idx_technicians_name ON technicians(name);
CREATE INDEX IF NOT EXISTS idx_technicians_active ON technicians(active);

-- 3. Ajouter le trigger pour updated_at
CREATE TRIGGER update_technicians_updated_at 
  BEFORE UPDATE ON technicians 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- 4. Activer RLS
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

-- 5. Politique RLS
CREATE POLICY "Allow all operations on technicians" ON technicians
  FOR ALL USING (true);

-- 6. Insérer les techniciens par défaut
INSERT INTO technicians (name, color, active) VALUES
  ('Jean Dupont', '#FF6B6B', true),
  ('Marie Martin', '#4ECDC4', true),
  ('Pierre Leblanc', '#45B7D1', true),
  ('Sophie Tremblay', '#96CEB4', true),
  ('Marc Gagnon', '#FECA57', true),
  ('Julie Roy', '#DDA0DD', true),
  ('Non assigné', '#95A5A6', true)
ON CONFLICT (name) DO NOTHING;

-- 7. Commentaires
COMMENT ON TABLE technicians IS 'Table des techniciens avec leurs informations de contact et statut';
COMMENT ON COLUMN technicians.color IS 'Couleur hexadécimale utilisée pour l''affichage dans l''interface';
COMMENT ON COLUMN technicians.active IS 'Indique si le technicien est actif (peut recevoir des tickets)';