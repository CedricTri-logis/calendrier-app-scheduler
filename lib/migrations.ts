import { createHash } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { getSupabaseAdmin } from './supabase-admin'

export interface Migration {
  version: string
  name: string
  upSql: string
  downSql: string
  checksum: string
}

export interface MigrationHistory {
  id: number
  version: string
  name: string
  executed_at: string
  executed_by: string
  status: 'applied' | 'rolled_back' | 'failed'
  checksum: string
  execution_time_ms: number
  error_message?: string
}

// Calculer le checksum d'un fichier SQL
function calculateChecksum(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

// Lire toutes les migrations depuis le dossier
export async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
  const files = await fs.readdir(migrationsDir)
  
  const migrations: Migration[] = []
  const migrationMap = new Map<string, Partial<Migration>>()

  // Grouper les fichiers .up.sql et .down.sql
  for (const file of files) {
    const match = file.match(/^(\d{3})_(.+)\.(up|down)\.sql$/)
    if (!match) continue

    const [, version, name, direction] = match
    const filePath = path.join(migrationsDir, file)
    const content = await fs.readFile(filePath, 'utf8')

    if (!migrationMap.has(version)) {
      migrationMap.set(version, { version, name })
    }

    const migration = migrationMap.get(version)!
    if (direction === 'up') {
      migration.upSql = content
      migration.checksum = calculateChecksum(content)
    } else {
      migration.downSql = content
    }
  }

  // Convertir en tableau et trier par version
  for (const [, migration] of migrationMap) {
    if (migration.upSql && migration.downSql) {
      migrations.push(migration as Migration)
    }
  }

  return migrations.sort((a, b) => a.version.localeCompare(b.version))
}

// Récupérer l'historique des migrations
export async function getMigrationHistory(): Promise<MigrationHistory[]> {
  const supabase = getSupabaseAdmin()
  
  const { data, error } = await supabase
    .from('migration_history')
    .select('*')
    .order('version', { ascending: true })

  if (error) {
    // Si la table n'existe pas, retourner un tableau vide
    if (error.code === '42P01') {
      return []
    }
    throw error
  }

  return data || []
}

// Exécuter une migration
export async function executeMigration(migration: Migration): Promise<void> {
  const supabase = getSupabaseAdmin()
  const startTime = Date.now()

  try {
    // Commencer une transaction
    await supabase.rpc('exec_sql', { query: 'BEGIN;' })

    // Exécuter le SQL de migration
    const result = await supabase.rpc('exec_sql', { query: migration.upSql })
    
    if (result.error) {
      throw new Error(result.error)
    }

    // Enregistrer dans l'historique
    const { error: insertError } = await supabase
      .from('migration_history')
      .insert({
        version: migration.version,
        name: migration.name,
        rollback_sql: migration.downSql,
        status: 'applied',
        checksum: migration.checksum,
        execution_time_ms: Date.now() - startTime,
        executed_by: 'system'
      })

    if (insertError) {
      throw insertError
    }

    // Valider la transaction
    await supabase.rpc('exec_sql', { query: 'COMMIT;' })
    
  } catch (error) {
    // Annuler la transaction
    await supabase.rpc('exec_sql', { query: 'ROLLBACK;' })
    
    // Enregistrer l'échec
    await supabase
      .from('migration_history')
      .insert({
        version: migration.version,
        name: migration.name,
        status: 'failed',
        checksum: migration.checksum,
        execution_time_ms: Date.now() - startTime,
        error_message: error instanceof Error ? error.message : 'Erreur inconnue',
        executed_by: 'system'
      })
    
    throw error
  }
}

// Rollback d'une migration
export async function rollbackMigration(version: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  
  // Récupérer la migration depuis l'historique
  const { data: history, error: fetchError } = await supabase
    .from('migration_history')
    .select('*')
    .eq('version', version)
    .eq('status', 'applied')
    .single()

  if (fetchError || !history) {
    throw new Error(`Migration ${version} non trouvée ou déjà annulée`)
  }

  if (!history.rollback_sql) {
    throw new Error(`Pas de SQL de rollback pour la migration ${version}`)
  }

  const startTime = Date.now()

  try {
    // Commencer une transaction
    await supabase.rpc('exec_sql', { query: 'BEGIN;' })

    // Exécuter le SQL de rollback
    const result = await supabase.rpc('exec_sql', { query: history.rollback_sql })
    
    if (result.error) {
      throw new Error(result.error)
    }

    // Mettre à jour le statut dans l'historique
    const { error: updateError } = await supabase
      .from('migration_history')
      .update({ 
        status: 'rolled_back',
        updated_at: new Date().toISOString()
      })
      .eq('id', history.id)

    if (updateError) {
      throw updateError
    }

    // Valider la transaction
    await supabase.rpc('exec_sql', { query: 'COMMIT;' })
    
  } catch (error) {
    // Annuler la transaction
    await supabase.rpc('exec_sql', { query: 'ROLLBACK;' })
    throw error
  }
}

// Obtenir les migrations en attente
export async function getPendingMigrations(): Promise<Migration[]> {
  const allMigrations = await loadMigrations()
  const history = await getMigrationHistory()
  
  const appliedVersions = new Set(
    history
      .filter(h => h.status === 'applied')
      .map(h => h.version)
  )

  return allMigrations.filter(m => !appliedVersions.has(m.version))
}