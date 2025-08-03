-- Script complet pour corriger toutes les séquences et fonctions manquantes

-- 1. Créer les séquences pour toutes les tables
-- =============================================

-- Séquence pour tickets
CREATE SEQUENCE IF NOT EXISTS calendar.tickets_id_seq;
ALTER TABLE calendar.tickets ALTER COLUMN id SET DEFAULT nextval('calendar.tickets_id_seq');
SELECT setval('calendar.tickets_id_seq', COALESCE((SELECT MAX(id) FROM calendar.tickets), 0) + 1, false);

-- Séquence pour technicians
CREATE SEQUENCE IF NOT EXISTS calendar.technicians_id_seq;
ALTER TABLE calendar.technicians ALTER COLUMN id SET DEFAULT nextval('calendar.technicians_id_seq');
SELECT setval('calendar.technicians_id_seq', COALESCE((SELECT MAX(id) FROM calendar.technicians), 0) + 1, false);

-- Séquence pour schedules
CREATE SEQUENCE IF NOT EXISTS calendar.schedules_id_seq;
ALTER TABLE calendar.schedules ALTER COLUMN id SET DEFAULT nextval('calendar.schedules_id_seq');
SELECT setval('calendar.schedules_id_seq', COALESCE((SELECT MAX(id) FROM calendar.schedules), 0) + 1, false);

-- Séquence pour ticket_technicians
CREATE SEQUENCE IF NOT EXISTS calendar.ticket_technicians_id_seq;
ALTER TABLE calendar.ticket_technicians ALTER COLUMN id SET DEFAULT nextval('calendar.ticket_technicians_id_seq');
SELECT setval('calendar.ticket_technicians_id_seq', COALESCE((SELECT MAX(id) FROM calendar.ticket_technicians), 0) + 1, false);

-- 2. Créer les fonctions RPC manquantes
-- =====================================

-- Fonction pour ajouter un technicien à un ticket
CREATE OR REPLACE FUNCTION calendar.add_technician_to_ticket(
    p_ticket_id INTEGER,
    p_technician_id INTEGER,
    p_is_primary BOOLEAN DEFAULT FALSE
)
RETURNS SETOF calendar.ticket_technicians
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result calendar.ticket_technicians;
BEGIN
    -- Vérifier que le ticket existe
    IF NOT EXISTS (SELECT 1 FROM calendar.tickets WHERE id = p_ticket_id) THEN
        RAISE EXCEPTION 'Ticket % n''existe pas', p_ticket_id;
    END IF;
    
    -- Vérifier que le technicien existe
    IF NOT EXISTS (SELECT 1 FROM calendar.technicians WHERE id = p_technician_id) THEN
        RAISE EXCEPTION 'Technicien % n''existe pas', p_technician_id;
    END IF;
    
    -- Si c'est le technicien principal, retirer le statut principal des autres
    IF p_is_primary THEN
        UPDATE calendar.ticket_technicians 
        SET is_primary = FALSE 
        WHERE ticket_id = p_ticket_id;
    END IF;
    
    -- Insérer ou mettre à jour l'assignation
    INSERT INTO calendar.ticket_technicians (ticket_id, technician_id, is_primary)
    VALUES (p_ticket_id, p_technician_id, p_is_primary)
    ON CONFLICT (ticket_id, technician_id) 
    DO UPDATE SET is_primary = EXCLUDED.is_primary
    RETURNING * INTO v_result;
    
    -- Retourner le résultat
    RETURN NEXT v_result;
END;
$$;

-- Fonction pour retirer un technicien d'un ticket
CREATE OR REPLACE FUNCTION calendar.remove_technician_from_ticket(
    p_ticket_id INTEGER,
    p_technician_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Supprimer l'assignation
    DELETE FROM calendar.ticket_technicians 
    WHERE ticket_id = p_ticket_id AND technician_id = p_technician_id;
    
    -- Retourner true si une ligne a été supprimée
    RETURN FOUND;
END;
$$;

-- 3. Donner les permissions nécessaires
-- ====================================

-- Permissions pour les fonctions
GRANT EXECUTE ON FUNCTION calendar.add_technician_to_ticket TO anon;
GRANT EXECUTE ON FUNCTION calendar.add_technician_to_ticket TO authenticated;
GRANT EXECUTE ON FUNCTION calendar.remove_technician_from_ticket TO anon;
GRANT EXECUTE ON FUNCTION calendar.remove_technician_from_ticket TO authenticated;

-- Permissions pour les séquences
GRANT USAGE, SELECT ON SEQUENCE calendar.tickets_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE calendar.technicians_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE calendar.schedules_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE calendar.ticket_technicians_id_seq TO anon, authenticated;

-- 4. Vérifier que tout fonctionne
-- ===============================

-- Test des séquences
SELECT 
    'tickets' as table_name, 
    nextval('calendar.tickets_id_seq'::regclass) as next_id
UNION ALL
SELECT 
    'technicians', 
    nextval('calendar.technicians_id_seq'::regclass)
UNION ALL
SELECT 
    'schedules', 
    nextval('calendar.schedules_id_seq'::regclass)
UNION ALL
SELECT 
    'ticket_technicians', 
    nextval('calendar.ticket_technicians_id_seq'::regclass);

-- Afficher un message de succès
DO $$
BEGIN
    RAISE NOTICE 'Toutes les séquences et fonctions ont été créées avec succès!';
END $$;