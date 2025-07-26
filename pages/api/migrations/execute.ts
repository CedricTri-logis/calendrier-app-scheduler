import type { NextApiRequest, NextApiResponse } from 'next'
import { executeMigration, getPendingMigrations, loadMigrations } from '../../../lib/migrations'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Sécurité : vérifier la méthode
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  // Vérifier que nous avons la Service Role Key
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ 
      error: 'Configuration manquante', 
      detail: 'SUPABASE_SERVICE_ROLE_KEY non définie dans .env.local' 
    })
  }

  try {
    const { version, dryRun = false } = req.body

    if (version) {
      // Exécuter une migration spécifique
      const migrations = await loadMigrations()
      const migration = migrations.find(m => m.version === version)
      
      if (!migration) {
        return res.status(404).json({ error: `Migration ${version} non trouvée` })
      }

      if (dryRun) {
        return res.status(200).json({
          message: 'Mode dry-run',
          migration: {
            version: migration.version,
            name: migration.name,
            sqlPreview: migration.upSql.substring(0, 500) + '...'
          }
        })
      }

      await executeMigration(migration)
      
      return res.status(200).json({
        success: true,
        message: `Migration ${version} exécutée avec succès`,
        migration: {
          version: migration.version,
          name: migration.name
        }
      })
    } else {
      // Exécuter toutes les migrations en attente
      const pendingMigrations = await getPendingMigrations()
      
      if (pendingMigrations.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'Aucune migration en attente'
        })
      }

      if (dryRun) {
        return res.status(200).json({
          message: 'Mode dry-run',
          pendingMigrations: pendingMigrations.map(m => ({
            version: m.version,
            name: m.name
          }))
        })
      }

      const results = []
      for (const migration of pendingMigrations) {
        try {
          await executeMigration(migration)
          results.push({
            version: migration.version,
            name: migration.name,
            status: 'success'
          })
        } catch (error) {
          results.push({
            version: migration.version,
            name: migration.name,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          })
          // Arrêter à la première erreur
          break
        }
      }

      return res.status(200).json({
        success: true,
        message: `${results.filter(r => r.status === 'success').length} migrations exécutées`,
        results
      })
    }
  } catch (error) {
    console.error('Erreur lors de l\'exécution des migrations:', error)
    return res.status(500).json({
      error: 'Erreur lors de l\'exécution',
      detail: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
}