import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import styles from '../styles/Migrations.module.css'

interface MigrationStatus {
  version: string
  name: string
  checksum: string
  status: 'pending' | 'applied' | 'failed' | 'rolled_back' | 'unknown'
  executed_at: string | null
  execution_time_ms: number | null
  error_message: string | null
  can_rollback: boolean
}

interface MigrationSummary {
  total: number
  applied: number
  pending: number
  failed: number
  rolled_back: number
}

export default function Migrations() {
  const router = useRouter()
  const [migrations, setMigrations] = useState<MigrationStatus[]>([])
  const [summary, setSummary] = useState<MigrationSummary>({
    total: 0,
    applied: 0,
    pending: 0,
    failed: 0,
    rolled_back: 0
  })
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchMigrationStatus()
  }, [])

  const fetchMigrationStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/migrations/status')
      const data = await response.json()

      if (data.success) {
        setMigrations(data.migrations)
        setSummary(data.summary)
        setError(null)
      } else {
        setError(data.error || 'Erreur lors du chargement')
        if (data.suggestion) {
          setError(prev => `${prev}. ${data.suggestion}`)
        }
      }
    } catch (err) {
      setError('Impossible de charger le statut des migrations')
    } finally {
      setLoading(false)
    }
  }

  const executeMigration = async (version?: string) => {
    try {
      setExecuting(true)
      setError(null)
      setSuccessMessage(null)

      const response = await fetch('/api/migrations/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccessMessage(data.message)
        await fetchMigrationStatus()
      } else {
        setError(data.error || 'Erreur lors de l\'exécution')
      }
    } catch (err) {
      setError('Erreur lors de l\'exécution de la migration')
    } finally {
      setExecuting(false)
    }
  }

  const rollbackMigration = async (version: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir annuler la migration ${version} ?`)) {
      return
    }

    try {
      setExecuting(true)
      setError(null)
      setSuccessMessage(null)

      const response = await fetch(`/api/migrations/rollback/${version}`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccessMessage(data.message)
        await fetchMigrationStatus()
      } else {
        setError(data.error || 'Erreur lors du rollback')
      }
    } catch (err) {
      setError('Erreur lors du rollback de la migration')
    } finally {
      setExecuting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { text: 'En attente', className: styles.badgePending },
      applied: { text: 'Appliquée', className: styles.badgeApplied },
      failed: { text: 'Échouée', className: styles.badgeFailed },
      rolled_back: { text: 'Annulée', className: styles.badgeRolledBack },
      unknown: { text: 'Inconnue', className: styles.badgeUnknown }
    }
    const badge = badges[status as keyof typeof badges] || badges.unknown
    return <span className={`${styles.badge} ${badge.className}`}>{badge.text}</span>
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement des migrations...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🗄️ Gestion des Migrations</h1>
        <button onClick={() => router.push('/')} className={styles.backButton}>
          ← Retour au calendrier
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {successMessage && (
        <div className={styles.success}>
          <strong>Succès :</strong> {successMessage}
        </div>
      )}

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <h3>Total</h3>
          <p>{summary.total}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Appliquées</h3>
          <p className={styles.textSuccess}>{summary.applied}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>En attente</h3>
          <p className={styles.textWarning}>{summary.pending}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Échouées</h3>
          <p className={styles.textDanger}>{summary.failed}</p>
        </div>
      </div>

      <div className={styles.actions}>
        <button 
          onClick={() => executeMigration()} 
          disabled={executing || summary.pending === 0}
          className={styles.primaryButton}
        >
          {executing ? 'Exécution...' : 'Exécuter toutes les migrations en attente'}
        </button>
        <button 
          onClick={fetchMigrationStatus} 
          disabled={loading}
          className={styles.secondaryButton}
        >
          🔄 Rafraîchir
        </button>
      </div>

      <div className={styles.migrationsTable}>
        <table>
          <thead>
            <tr>
              <th>Version</th>
              <th>Nom</th>
              <th>Statut</th>
              <th>Exécutée le</th>
              <th>Durée</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {migrations.map(migration => (
              <tr key={migration.version}>
                <td className={styles.version}>{migration.version}</td>
                <td>{migration.name}</td>
                <td>{getStatusBadge(migration.status)}</td>
                <td>
                  {migration.executed_at 
                    ? new Date(migration.executed_at).toLocaleString('fr-FR')
                    : '-'
                  }
                </td>
                <td>
                  {migration.execution_time_ms 
                    ? `${migration.execution_time_ms}ms`
                    : '-'
                  }
                </td>
                <td>
                  {migration.status === 'pending' && (
                    <button
                      onClick={() => executeMigration(migration.version)}
                      disabled={executing}
                      className={styles.actionButton}
                    >
                      ▶️ Exécuter
                    </button>
                  )}
                  {migration.can_rollback && (
                    <button
                      onClick={() => rollbackMigration(migration.version)}
                      disabled={executing}
                      className={`${styles.actionButton} ${styles.dangerButton}`}
                    >
                      ↩️ Rollback
                    </button>
                  )}
                  {migration.error_message && (
                    <span className={styles.errorIcon} title={migration.error_message}>
                      ⚠️
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.info}>
        <h3>ℹ️ Informations</h3>
        <ul>
          <li>Les migrations sont exécutées dans l'ordre (000, 001, 002...)</li>
          <li>Chaque migration peut être annulée individuellement</li>
          <li>Les checksums garantissent l'intégrité des fichiers</li>
          <li>Toutes les opérations sont transactionnelles</li>
        </ul>
      </div>
    </div>
  )
}