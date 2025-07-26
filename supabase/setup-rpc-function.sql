-- Fonction RPC pour exécuter du SQL arbitraire
-- ATTENTION : Cette fonction est très puissante et doit être sécurisée !
-- Elle ne doit être accessible qu'avec la Service Role Key

-- Créer la fonction exec_sql
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Exécuter la requête
  EXECUTE query;
  
  -- Retourner un succès
  RETURN json_build_object(
    'success', true,
    'message', 'Query executed successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner les détails
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE,
      'hint', COALESCE(
        NULLIF(current_setting('message_hint', true), ''),
        'Check your SQL syntax'
      )
    );
END;
$$;

-- Restreindre l'accès à cette fonction
-- Seuls les utilisateurs avec le rôle service_role peuvent l'exécuter
REVOKE ALL ON FUNCTION exec_sql(text) FROM public;
REVOKE ALL ON FUNCTION exec_sql(text) FROM anon;
REVOKE ALL ON FUNCTION exec_sql(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- Commentaire pour la documentation
COMMENT ON FUNCTION exec_sql(text) IS 'Execute arbitrary SQL - ONLY use with service role key for migrations';

-- Test de la fonction (optionnel)
-- SELECT exec_sql('SELECT version()');