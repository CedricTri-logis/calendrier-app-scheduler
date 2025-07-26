-- Script pour corriger la table schedules
-- La table actuelle utilise day_of_week mais l'interface utilise date

-- 1. Supprimer l'ancienne table schedules si elle existe
DROP TABLE IF EXISTS schedules CASCADE;

-- 2. Créer la nouvelle table schedules avec date au lieu de day_of_week
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  technician_id INTEGER NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  date DATE NOT NULL,  -- Date spécifique au lieu de day_of_week
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (type IN ('available', 'unavailable', 'vacation', 'sick_leave', 'break')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- 3. Créer l'index pour optimiser les requêtes
CREATE INDEX idx_schedules_technician_date ON schedules(technician_id, date);
CREATE INDEX idx_schedules_date ON schedules(date);

-- 4. Activer RLS (Row Level Security)
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- 5. Créer les politiques RLS
-- Permettre la lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Schedules sont visibles pour tous" ON schedules
  FOR SELECT USING (true);

-- Permettre l'insertion pour tous les utilisateurs authentifiés
CREATE POLICY "Les utilisateurs peuvent créer des horaires" ON schedules
  FOR INSERT WITH CHECK (true);

-- Permettre la mise à jour pour tous les utilisateurs authentifiés
CREATE POLICY "Les utilisateurs peuvent modifier des horaires" ON schedules
  FOR UPDATE USING (true);

-- Permettre la suppression pour tous les utilisateurs authentifiés
CREATE POLICY "Les utilisateurs peuvent supprimer des horaires" ON schedules
  FOR DELETE USING (true);

-- 6. Créer une fonction pour éviter les chevauchements d'horaires
CREATE OR REPLACE FUNCTION check_schedule_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM schedules
    WHERE technician_id = NEW.technician_id
      AND date = NEW.date
      AND id != COALESCE(NEW.id, -1)
      AND (
        (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
        (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
        (NEW.start_time <= start_time AND NEW.end_time >= end_time)
      )
  ) THEN
    RAISE EXCEPTION 'Les horaires se chevauchent pour ce technicien à cette date';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer le trigger pour vérifier les chevauchements
CREATE TRIGGER check_schedule_overlap_trigger
  BEFORE INSERT OR UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION check_schedule_overlap();

-- 8. Ajouter quelques horaires de test
INSERT INTO schedules (technician_id, date, start_time, end_time, type, notes)
SELECT 
  t.id,
  '2025-07-14'::date,
  '09:00'::time,
  '17:00'::time,
  'available',
  'Horaire de test'
FROM technicians t
WHERE t.name = 'Jean Dupont'
LIMIT 1;