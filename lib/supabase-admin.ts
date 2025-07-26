import { createClient } from '@supabase/supabase-js'

// Client Supabase avec les privilèges admin (Service Role)
// À utiliser UNIQUEMENT côté serveur (API routes)
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variables Supabase manquantes. Vérifiez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Fonction pour exécuter du SQL brut
export async function executeSql(sql: string) {
  const supabase = getSupabaseAdmin()
  
  try {
    // Utiliser le client Supabase directement avec rpc
    const { data, error } = await supabase.rpc('exec_sql', { query: sql })
    
    if (error) {
      console.error('Erreur RPC:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Erreur lors de l\'exécution SQL:', error)
    throw error
  }
}

// Créer la fonction RPC pour exécuter du SQL
async function createExecSqlFunction() {
  const sql = `
    CREATE OR REPLACE FUNCTION exec_sql(query text)
    RETURNS json AS $$
    DECLARE
      result json;
    BEGIN
      EXECUTE query;
      RETURN json_build_object('success', true);
    EXCEPTION
      WHEN OTHERS THEN
        RETURN json_build_object(
          'success', false,
          'error', SQLERRM,
          'detail', SQLSTATE
        );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.rpc('query', { input_query: sql })
  
  if (error && error.code !== 'PGRST202') {
    console.error('Erreur lors de la création de exec_sql:', error)
  }
}