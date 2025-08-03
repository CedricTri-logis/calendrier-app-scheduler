-- Fonction pour ajouter un technicien à un ticket (support multi-techniciens)
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

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION calendar.add_technician_to_ticket TO anon;
GRANT EXECUTE ON FUNCTION calendar.add_technician_to_ticket TO authenticated;

-- Créer aussi la fonction pour retirer un technicien
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

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION calendar.remove_technician_from_ticket TO anon;
GRANT EXECUTE ON FUNCTION calendar.remove_technician_from_ticket TO authenticated;