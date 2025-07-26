-- Fonction pour retirer tous les techniciens d'un ticket
CREATE OR REPLACE FUNCTION clear_all_technicians(p_ticket_id integer)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Supprimer toutes les assignations multi-techniciens
  DELETE FROM ticket_technicians WHERE ticket_id = p_ticket_id;
  
  -- Mettre à jour le ticket pour retirer le technicien principal
  UPDATE tickets 
  SET technician_id = NULL 
  WHERE id = p_ticket_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erreur lors de la suppression des techniciens: %', SQLERRM;
    RETURN FALSE;
END;
$$;