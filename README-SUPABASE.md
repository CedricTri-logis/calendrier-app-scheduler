# Configuration Supabase pour le Calendrier

## 1. Créer la table des tickets

Allez dans votre projet Supabase et exécutez ce SQL dans l'éditeur SQL :

```sql
-- Table pour stocker les tickets
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  color VARCHAR(7) NOT NULL, -- Couleur hexadécimale
  date DATE, -- Date du ticket (NULL si pas encore placé)
  hour INTEGER DEFAULT -1, -- Heure (-1 pour toute la journée, 0-23 pour une heure spécifique)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_tickets_date ON tickets(date);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE
  ON tickets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Politique de sécurité (Row Level Security)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Permettre toutes les opérations pour l'instant
DROP POLICY IF EXISTS "Allow all operations on tickets" ON tickets;
CREATE POLICY "Allow all operations on tickets" ON tickets
  FOR ALL USING (true);

-- Quelques tickets d'exemple
INSERT INTO tickets (title, color, date, hour) VALUES
  ('Réunion équipe', '#FFE5B4', NULL, -1),
  ('Appel client', '#B4E5FF', NULL, -1),
  ('Révision projet', '#FFB4B4', NULL, -1),
  ('Planning sprint', '#D4FFB4', NULL, -1);
```

## 2. Configuration des clés

Vos clés sont déjà configurées dans `.env.local`.

## 3. Activer les temps réel (optionnel)

Pour avoir les mises à jour en temps réel entre plusieurs navigateurs :

1. Allez dans Database > Replication
2. Activez la réplication pour la table `tickets`

## 4. Tester l'application

```bash
npm run dev
```

L'application devrait maintenant :
- Charger les tickets depuis Supabase
- Sauvegarder automatiquement les changements
- Synchroniser en temps réel si vous ouvrez plusieurs onglets
- Résoudre le problème de duplication des tickets