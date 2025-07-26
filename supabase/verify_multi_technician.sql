-- Script de vérification du système multi-techniciens
-- Exécuter ce script pour vérifier que tout est correctement installé

-- 1. Vérifier que la table ticket_technicians existe
SELECT 
    'Table ticket_technicians' as component,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'ticket_technicians'
        ) THEN '✅ Existe'
        ELSE '❌ Manquante'
    END as status;

-- 2. Vérifier les colonnes de la table
SELECT 
    'Colonnes ticket_technicians' as component,
    CASE 
        WHEN COUNT(*) = 6 THEN '✅ OK (' || COUNT(*) || ' colonnes)'
        ELSE '❌ Problème (' || COUNT(*) || ' colonnes, attendu: 6)'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ticket_technicians';

-- 3. Vérifier la contrainte UNIQUE
SELECT 
    'Contrainte UNIQUE' as component,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_constraint 
            WHERE conname LIKE '%ticket_technicians%' 
            AND contype = 'u'
        ) THEN '✅ Existe'
        ELSE '❌ Manquante'
    END as status;

-- 4. Vérifier les clés étrangères
SELECT 
    'FK ticket_id' as component,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_constraint 
            WHERE conname LIKE '%ticket_technicians_ticket_id_fkey%'
        ) THEN '✅ Existe'
        ELSE '❌ Manquante'
    END as status;

SELECT 
    'FK technician_id' as component,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_constraint 
            WHERE conname LIKE '%ticket_technicians_technician_id_fkey%'
        ) THEN '✅ Existe'
        ELSE '❌ Manquante'
    END as status;

-- 5. Vérifier la fonction add_technician_to_ticket
SELECT 
    'Fonction add_technician_to_ticket' as component,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_proc 
            WHERE proname = 'add_technician_to_ticket'
        ) THEN '✅ Existe'
        ELSE '❌ Manquante'
    END as status;

-- 6. Vérifier la fonction remove_technician_from_ticket
SELECT 
    'Fonction remove_technician_to_ticket' as component,
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_proc 
            WHERE proname = 'remove_technician_from_ticket'
        ) THEN '✅ Existe'
        ELSE '❌ Manquante'
    END as status;

-- 7. Statistiques d'utilisation
SELECT 
    'Statistiques' as component,
    'Tickets multi-tech: ' || COUNT(DISTINCT ticket_id) || 
    ', Total assignations: ' || COUNT(*) ||
    ', Moy tech/ticket: ' || ROUND(AVG(tech_count), 1) as status
FROM (
    SELECT ticket_id, COUNT(*) as tech_count
    FROM ticket_technicians
    GROUP BY ticket_id
) stats;

-- 8. Exemples de tickets multi-techniciens
SELECT 
    'Exemples (top 5)' as component,
    STRING_AGG(
        'Ticket #' || t.id || ' (' || t.title || '): ' || 
        COALESCE(tech_list.technicians, 'Aucun'), 
        E'\n'
    ) as status
FROM tickets t
LEFT JOIN (
    SELECT 
        tt.ticket_id,
        STRING_AGG(
            tech.name || CASE WHEN tt.is_primary THEN ' (P)' ELSE '' END, 
            ', '
        ) as technicians
    FROM ticket_technicians tt
    JOIN technicians tech ON tech.id = tt.technician_id
    GROUP BY tt.ticket_id
) tech_list ON tech_list.ticket_id = t.id
WHERE tech_list.technicians IS NOT NULL
LIMIT 5;

-- Résumé final
SELECT 
    E'\n=== RÉSUMÉ ===' as component,
    E'Si tous les composants sont ✅, le système est prêt!\nSinon, exécuter le script de migration.' as status;