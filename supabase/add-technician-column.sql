-- Script pour ajouter la colonne technicien à la table tickets

-- 1. Ajouter la colonne technicien
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS technician VARCHAR(100);

-- 2. Créer un index pour améliorer les performances de filtrage
CREATE INDEX IF NOT EXISTS idx_tickets_technician ON tickets(technician);

-- 3. Mettre à jour les tickets existants avec un technicien par défaut (optionnel)
UPDATE tickets 
SET technician = 'Non assigné' 
WHERE technician IS NULL;