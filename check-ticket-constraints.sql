-- Vérifier les contraintes sur la table tickets
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'calendar' 
AND table_name = 'tickets'
ORDER BY ordinal_position;

-- Vérifier spécifiquement la contrainte sur technician_id
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'calendar.tickets'::regclass
AND contype IN ('c', 'f'); -- check and foreign key constraints