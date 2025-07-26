import { useState } from 'react'
import { useRouter } from 'next/router'
import styles from '../styles/Home.module.css'

export default function FixDatabase() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const router = useRouter()

  const handleFix = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/fix-database', {
        method: 'POST'
      })
      
      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        setTimeout(() => {
          router.push('/')
        }, 3000)
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Erreur de connexion au serveur',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          🔧 Correction de la Base de Données
        </h1>

        <div style={{ maxWidth: '600px', textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ marginBottom: '1rem' }}>
            Ce script va créer toutes les tables manquantes dans votre base de données Supabase :
          </p>
          <ul style={{ textAlign: 'left', marginBottom: '2rem' }}>
            <li>✓ Table <code>technicians</code> avec les techniciens par défaut</li>
            <li>✓ Table <code>schedules</code> pour les horaires</li>
            <li>✓ Table <code>migration_history</code> pour le suivi</li>
            <li>✓ Vue <code>tickets_with_technician</code> pour l'application</li>
            <li>✓ Migration des tickets existants</li>
          </ul>
        </div>

        {!result && (
          <button
            onClick={handleFix}
            disabled={loading}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              backgroundColor: loading ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '⏳ Correction en cours...' : '🚀 Lancer la correction'}
          </button>
        )}

        {result && (
          <div style={{
            marginTop: '2rem',
            padding: '2rem',
            borderRadius: '8px',
            backgroundColor: result.success ? '#d4edda' : '#f8d7da',
            color: result.success ? '#155724' : '#721c24',
            maxWidth: '800px',
            width: '100%'
          }}>
            <h2>{result.message}</h2>
            
            {result.summary && (
              <div style={{ marginTop: '1rem', textAlign: 'left' }}>
                <p><strong>Résumé :</strong></p>
                <ul>
                  <li>Requêtes exécutées : {result.summary.totalQueries}</li>
                  <li>Succès : {result.summary.successful}</li>
                  <li>Erreurs : {result.summary.failed}</li>
                </ul>
                
                <p><strong>Tables trouvées :</strong></p>
                <ul>
                  {result.summary.tablesFound.map((table: string) => (
                    <li key={table}>✓ {table}</li>
                  ))}
                </ul>
                
                {result.summary.viewsFound.length > 0 && (
                  <>
                    <p><strong>Vues trouvées :</strong></p>
                    <ul>
                      {result.summary.viewsFound.map((view: string) => (
                        <li key={view}>✓ {view}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {result.results && result.results.some((r: any) => r.status === 'error') && (
              <details style={{ marginTop: '1rem' }}>
                <summary style={{ cursor: 'pointer' }}>Voir les erreurs</summary>
                <pre style={{ 
                  marginTop: '0.5rem', 
                  padding: '1rem', 
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '0.9rem'
                }}>
                  {result.results
                    .filter((r: any) => r.status === 'error')
                    .map((r: any, i: number) => `${i + 1}. ${r.query}\n   Erreur: ${r.error}`)
                    .join('\n\n')}
                </pre>
              </details>
            )}

            {result.success && (
              <p style={{ marginTop: '2rem', fontStyle: 'italic' }}>
                🎉 Redirection vers le calendrier dans 3 secondes...
              </p>
            )}
          </div>
        )}

        <div style={{ marginTop: '2rem' }}>
          <a href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>
            ← Retour au calendrier
          </a>
        </div>
      </main>
    </div>
  )
}