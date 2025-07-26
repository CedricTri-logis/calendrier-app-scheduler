import type { NextApiRequest, NextApiResponse } from 'next'
import { getMigrationHistory, getPendingMigrations, loadMigrations } from '../../../lib/migrations'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const [allMigrations, history, pendingMigrations] = await Promise.all([
      loadMigrations(),
      getMigrationHistory(),
      getPendingMigrations()
    ])

    // Combiner les informations
    const migrationsStatus = allMigrations.map(migration => {
      const historyEntry = history.find(h => h.version === migration.version)
      const isPending = pendingMigrations.some(p => p.version === migration.version)

      return {
        version: migration.version,
        name: migration.name,
        checksum: migration.checksum,
        status: historyEntry?.status || (isPending ? 'pending' : 'unknown'),
        executed_at: historyEntry?.executed_at || null,
        execution_time_ms: historyEntry?.execution_time_ms || null,
        error_message: historyEntry?.error_message || null,
        can_rollback: historyEntry?.status === 'applied'
      }
    })

    return res.status(200).json({
      success: true,
      migrations: migrationsStatus,
      summary: {
        total: allMigrations.length,
        applied: history.filter(h => h.status === 'applied').length,
        pending: pendingMigrations.length,
        failed: history.filter(h => h.status === 'failed').length,
        rolled_back: history.filter(h => h.status === 'rolled_back').length
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error)
    
    // Si c'est une erreur de table manquante, suggérer de créer la table d'historique
    if (error instanceof Error && error.message.includes('migration_history')) {
      return res.status(200).json({
        success: false,
        error: 'Table migration_history non trouvée',
        suggestion: 'Exécutez d\'abord la migration 000 pour créer la table d\'historique',
        migrations: [],
        summary: {
          total: 0,
          applied: 0,
          pending: 0,
          failed: 0,
          rolled_back: 0
        }
      })
    }

    return res.status(500).json({
      error: 'Erreur lors de la récupération du statut',
      detail: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
}