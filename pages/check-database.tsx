import { useState, useEffect } from 'react'
import styles from '../styles/Home.module.css'
import { useToast } from '../contexts/ToastContext'

export default function CheckDatabase() {
  const { showSuccess } = useToast()
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showSql, setShowSql] = useState(false)

  const checkDatabase = async () => {
    setChecking(true)
    try {
      const response = await fetch('/api/fix-database-direct', {
        method: 'POST'
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Erreur de connexion',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }
    setChecking(false)
  }

  useEffect(() => {
    checkDatabase()
  }, [])

  const copySql = () => {
    if (result?.sqlToExecute) {
      navigator.clipboard.writeText(result.sqlToExecute)
      showSuccess('SQL copié dans le presse-papier!')
    }
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          🔍 Vérification de la Base de Données
        </h1>

        {checking && (
          <div style={{ fontSize: '1.2rem', marginTop: '2rem' }}>
            ⏳ Vérification en cours...
          </div>
        )}

        {result && !result.success && (
          <div style={{
            marginTop: '2rem',
            padding: '2rem',
            borderRadius: '8px',
            backgroundColor: '#fff3cd',
            color: '#856404',
            maxWidth: '800px',
            width: '100%'
          }}>
            <h2>{result.message}</h2>
            
            {result.results && (
              <div style={{ marginTop: '1rem' }}>
                <h3>État des tables :</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {result.results.map((r: any, i: number) => (
                    <li key={i} style={{ marginBottom: '0.5rem' }}>
                      {r.status === 'exists' ? '✅' : '❌'} {r.table} - {r.status === 'exists' ? 'Existe' : 'Manquante'}
                      {r.message && <div style={{ fontSize: '0.9rem', color: '#666', marginLeft: '2rem' }}>{r.message}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.instructions && (
              <div style={{ 
                marginTop: '2rem', 
                padding: '1rem', 
                backgroundColor: '#f8f9fa',
                borderRadius: '4px'
              }}>
                <h3>🛠️ Instructions pour corriger :</h3>
                <ol>
                  {result.instructions.map((instruction: string, i: number) => (
                    <li key={i} style={{ marginBottom: '0.5rem' }}>{instruction}</li>
                  ))}
                </ol>
              </div>
            )}

            {result.sqlToExecute && (
              <div style={{ marginTop: '2rem' }}>
                <button
                  onClick={() => setShowSql(!showSql)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '1rem'
                  }}
                >
                  {showSql ? '🔽 Masquer' : '🔸 Afficher'} le SQL à exécuter
                </button>
                
                <button
                  onClick={copySql}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  📋 Copier le SQL
                </button>

                {showSql && (
                  <pre style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    overflow: 'auto',
                    maxHeight: '400px',
                    fontSize: '0.85rem'
                  }}>
                    {result.sqlToExecute}
                  </pre>
                )}
              </div>
            )}

            <div style={{ marginTop: '2rem' }}>
              <a 
                href="https://supabase.com/dashboard/project/fmuxjttjlxvrkueaacvy/sql"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}
              >
                🚀 Ouvrir l'éditeur SQL de Supabase
              </a>
            </div>
          </div>
        )}

        {result && result.success && (
          <div style={{
            marginTop: '2rem',
            padding: '2rem',
            borderRadius: '8px',
            backgroundColor: '#d4edda',
            color: '#155724'
          }}>
            <h2>{result.message}</h2>
            <p>Vous pouvez maintenant retourner au calendrier.</p>
          </div>
        )}

        <div style={{ marginTop: '2rem' }}>
          <button
            onClick={checkDatabase}
            style={{
              padding: '0.5rem 1rem',
              marginRight: '1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Revérifier
          </button>
          
          <a href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>
            ← Retour au calendrier
          </a>
        </div>
      </main>
    </div>
  )
}