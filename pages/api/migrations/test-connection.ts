import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const diagnostics = {
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
  }

  try {
    // Tester la connexion
    const supabase = getSupabaseAdmin()
    
    // Tester une requête simple
    const { data: tables, error: tablesError } = await supabase
      .from('migration_history')
      .select('count')
      .limit(1)

    if (tablesError && tablesError.code === '42P01') {
      // La table n'existe pas encore
      return res.status(200).json({
        connection: 'ok',
        migrationTableExists: false,
        diagnostics,
        message: 'Connexion OK mais la table migration_history n\'existe pas encore'
      })
    }

    if (tablesError) {
      throw tablesError
    }

    // Tester la fonction RPC
    const { data: rpcTest, error: rpcError } = await supabase
      .rpc('exec_sql', { query: 'SELECT 1 as test' })

    return res.status(200).json({
      connection: 'ok',
      migrationTableExists: true,
      rpcFunctionExists: !rpcError,
      diagnostics,
      rpcError: rpcError?.message
    })

  } catch (error) {
    return res.status(200).json({
      connection: 'error',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      diagnostics,
      suggestion: !diagnostics.hasServiceKey 
        ? 'Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local' 
        : 'Vérifiez que la clé est correcte'
    })
  }
}