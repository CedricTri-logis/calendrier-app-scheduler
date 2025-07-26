import { useState, useEffect } from 'react'
import styles from '../styles/Home.module.css'

export default function DebugMigration() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/migrations/test')
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      setTestResults({ 
        error: 'Erreur lors des tests', 
        message: error instanceof Error ? error.message : 'Erreur inconnue' 
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      default: return '❓'
    }
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          🔍 Diagnostic du Système de Migration
        </h1>

        <button 
          onClick={runTests} 
          disabled={loading}
          style={{
            marginBottom: '2rem',
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? '⏳ Tests en cours...' : '🔄 Relancer les tests'}
        </button>

        {testResults && (
          <div style={{ width: '100%', maxWidth: '800px' }}>
            {/* Environnement */}
            <div style={{ 
              marginBottom: '2rem', 
              padding: '1rem', 
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}>
              <h2>📋 Configuration de l'environnement</h2>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li>Service Role Key: {testResults.environment?.hasServiceKey ? '✅ Configurée' : '❌ Manquante'}</li>
                <li>URL Supabase: {testResults.environment?.hasUrl ? '✅ Configurée' : '❌ Manquante'}</li>
                <li>Preview: <code>{testResults.environment?.serviceKeyPreview}</code></li>
              </ul>
            </div>

            {/* Tests */}
            {testResults.tests && (
              <div style={{ 
                marginBottom: '2rem', 
                padding: '1rem', 
                border: '1px solid #ddd',
                borderRadius: '8px'
              }}>
                <h2>🧪 Résultats des tests</h2>
                {testResults.tests.map((test: any, index: number) => (
                  <div key={index} style={{ 
                    marginBottom: '1rem', 
                    padding: '1rem', 
                    backgroundColor: test.status === 'error' ? '#fee' : 
                                    test.status === 'warning' ? '#ffc' : '#efe',
                    borderRadius: '4px'
                  }}>
                    <h3>{getStatusEmoji(test.status)} {test.name}</h3>
                    <p>{test.message}</p>
                    {test.solution && (
                      <p style={{ fontStyle: 'italic', color: '#666' }}>
                        💡 Solution: {test.solution}
                      </p>
                    )}
                    {test.data && (
                      <pre style={{ 
                        backgroundColor: '#f5f5f5', 
                        padding: '0.5rem', 
                        borderRadius: '4px',
                        overflow: 'auto'
                      }}>
                        {JSON.stringify(test.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Résumé */}
            {testResults.summary && (
              <div style={{ 
                padding: '1rem', 
                border: '2px solid ' + (testResults.summary.ready ? '#4caf50' : '#f44336'),
                borderRadius: '8px',
                backgroundColor: testResults.summary.ready ? '#e8f5e9' : '#ffebee'
              }}>
                <h2 style={{ textAlign: 'center', margin: 0 }}>
                  {testResults.summary.message}
                </h2>
              </div>
            )}

            {/* Instructions */}
            {testResults.tests?.some((t: any) => t.name === 'Fonction RPC exec_sql' && t.status === 'error') && (
              <div style={{ 
                marginTop: '2rem', 
                padding: '1rem', 
                border: '1px solid #2196f3',
                borderRadius: '8px',
                backgroundColor: '#e3f2fd'
              }}>
                <h2>📝 Action requise: Créer la fonction RPC</h2>
                <ol>
                  <li>Allez sur <a href="https://supabase.com/dashboard/project/fmuxjttjlxvrkueaacvy/sql" target="_blank" rel="noopener noreferrer">Supabase SQL Editor</a></li>
                  <li>Copiez et exécutez ce code:</li>
                </ol>
                <pre style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '1rem', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '0.9rem'
                }}>
{`CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE query;
  RETURN json_build_object(
    'success', true,
    'message', 'Query executed successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Restreindre l'accès
REVOKE ALL ON FUNCTION exec_sql(text) FROM public;
REVOKE ALL ON FUNCTION exec_sql(text) FROM anon;
REVOKE ALL ON FUNCTION exec_sql(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;`}
                </pre>
              </div>
            )}

            {/* Lien vers les migrations */}
            {testResults.summary?.ready && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <a 
                  href="/migrations" 
                  style={{ 
                    fontSize: '1.2rem', 
                    color: '#0070f3',
                    textDecoration: 'none'
                  }}
                >
                  🚀 Aller aux migrations →
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}