import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin, executeSql } from '../../../lib/supabase-admin'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const results = {
    environment: {
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKeyPreview: process.env.SUPABASE_SERVICE_ROLE_KEY 
        ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` 
        : 'Non définie'
    },
    tests: [] as any[],
    summary: {
      ready: false,
      message: ''
    }
  }

  // Test 1: Connexion basique
  try {
    const supabase = getSupabaseAdmin()
    results.tests.push({
      name: 'Connexion Admin',
      status: 'success',
      message: 'Client admin créé avec succès'
    })
  } catch (error) {
    results.tests.push({
      name: 'Connexion Admin',
      status: 'error',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    })
    return res.status(200).json(results)
  }

  // Test 2: Vérifier si la table migration_history existe
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('migration_history')
      .select('count')
      .limit(1)

    if (error && error.code === '42P01') {
      results.tests.push({
        name: 'Table migration_history',
        status: 'warning',
        message: 'La table n\'existe pas encore - exécutez la migration 000'
      })
    } else if (error) {
      throw error
    } else {
      results.tests.push({
        name: 'Table migration_history',
        status: 'success',
        message: 'Table trouvée'
      })
    }
  } catch (error) {
    results.tests.push({
      name: 'Table migration_history',
      status: 'error',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }

  // Test 3: Vérifier si la fonction RPC exec_sql existe
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.rpc('exec_sql', { 
      query: 'SELECT current_database() as db, now() as time' 
    })

    if (error) {
      if (error.code === 'PGRST202') {
        results.tests.push({
          name: 'Fonction RPC exec_sql',
          status: 'error',
          message: 'La fonction n\'existe pas - créez-la dans Supabase',
          solution: 'Exécutez le SQL fourni dans MIGRATION-STATUS.md'
        })
      } else {
        throw error
      }
    } else {
      results.tests.push({
        name: 'Fonction RPC exec_sql',
        status: 'success',
        message: 'Fonction trouvée et fonctionnelle',
        data: data
      })
    }
  } catch (error) {
    results.tests.push({
      name: 'Fonction RPC exec_sql',
      status: 'error',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }

  // Test 4: Essayer d'exécuter une simple requête
  try {
    const result = await executeSql('SELECT 1 as test_value')
    results.tests.push({
      name: 'Exécution SQL via executeSql()',
      status: 'success',
      message: 'Fonction executeSql() opérationnelle',
      data: result
    })
  } catch (error) {
    results.tests.push({
      name: 'Exécution SQL via executeSql()',
      status: 'error',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }

  // Résumé
  const allSuccess = results.tests.every(t => t.status === 'success')
  const hasErrors = results.tests.some(t => t.status === 'error')
  
  results.summary = {
    ready: allSuccess,
    message: allSuccess 
      ? '✅ Tout est prêt pour les migrations!'
      : hasErrors
        ? '❌ Corrigez les erreurs avant de continuer'
        : '⚠️ Quelques ajustements nécessaires'
  }

  return res.status(200).json(results)
}