-- Vérifier et corriger la contrainte sur technician_id dans la table tickets
-- pour permettre NULL quand un ticket est retiré du calendrier

-- 1. Vérifier la contrainte actuelle
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'calendar' 
AND table_name = 'tickets'
AND column_name = 'technician_id';

-- 2. Si nécessaire, permettre NULL sur technician_id
-- Ceci permettra de retirer complètement un ticket du calendrier
ALTER TABLE calendar.tickets 
ALTER COLUMN technician_id DROP NOT NULL;

-- 3. Vérifier si la modification a réussi
SELECT 
    column_name,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'calendar' 
AND table_name = 'tickets'
AND column_name = 'technician_id';