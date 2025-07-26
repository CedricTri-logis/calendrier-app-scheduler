import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../lib/supabase-admin'
import fs from 'fs'
import path from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    console.log('🔧 Début de la correction de la base de données...')
    
    // Lire le script SQL
    const sqlPath = path.join(process.cwd(), 'supabase', 'fix-database.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Diviser le script en requêtes individuelles
    const queries = sqlContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'))
    
    const supabase = getSupabaseAdmin()
    const results = []
    
    // Exécuter chaque requête
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i] + ';'
      
      try {
        console.log(`Exécution de la requête ${i + 1}/${queries.length}...`)
        
        // Pour les requêtes complexes avec DO $$, on utilise une approche différente
        if (query.includes('DO $$')) {
          // Exécuter directement via RPC
          const { error } = await supabase.rpc('exec_sql', { query })
          if (error) {
            console.error(`Erreur requête ${i + 1}:`, error)
            results.push({ 
              query: query.substring(0, 50) + '...', 
              status: 'error', 
              error: error.message 
            })
          } else {
            results.push({ 
              query: query.substring(0, 50) + '...', 
              status: 'success' 
            })
          }
        } else {
          // Pour les autres requêtes, essayer d'abord directement
          const { data, error } = await supabase.rpc('exec_sql', { query })
          
          if (error) {
            console.error(`Erreur requête ${i + 1}:`, error)
            results.push({ 
              query: query.substring(0, 50) + '...', 
              status: 'error', 
              error: error.message 
            })
          } else {
            results.push({ 
              query: query.substring(0, 50) + '...', 
              status: 'success',
              data 
            })
          }
        }
      } catch (err) {
        console.error(`Exception requête ${i + 1}:`, err)
        results.push({ 
          query: query.substring(0, 50) + '...', 
          status: 'error', 
          error: err instanceof Error ? err.message : 'Erreur inconnue' 
        })
      }
    }
    
    // Vérifier les tables créées
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['technicians', 'schedules', 'migration_history', 'tickets'])
    
    const { data: views } = await supabase
      .from('information_schema.views')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'tickets_with_technician')
    
    const summary = {
      totalQueries: queries.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      tablesFound: tables?.map(t => t.table_name) || [],
      viewsFound: views?.map(v => v.table_name) || []
    }
    
    console.log('✅ Correction terminée:', summary)
    
    return res.status(200).json({
      success: summary.failed === 0,
      summary,
      results,
      message: summary.failed === 0 
        ? '✅ Base de données corrigée avec succès!'
        : `⚠️ Correction partielle: ${summary.successful} succès, ${summary.failed} erreurs`
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      message: '❌ Erreur lors de la correction de la base de données'
    })
  }
}