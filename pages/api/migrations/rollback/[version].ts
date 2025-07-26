import type { NextApiRequest, NextApiResponse } from 'next'
import { rollbackMigration } from '../../../../lib/migrations'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const { version } = req.query

  if (!version || typeof version !== 'string') {
    return res.status(400).json({ error: 'Version de migration requise' })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ 
      error: 'Configuration manquante', 
      detail: 'SUPABASE_SERVICE_ROLE_KEY non définie' 
    })
  }

  try {
    await rollbackMigration(version)
    
    return res.status(200).json({
      success: true,
      message: `Migration ${version} annulée avec succès`
    })
  } catch (error) {
    console.error('Erreur lors du rollback:', error)
    return res.status(500).json({
      error: 'Erreur lors du rollback',
      detail: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
}