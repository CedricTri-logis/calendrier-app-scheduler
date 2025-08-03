import { useEffect, useState } from 'react'

export default function TestEnvPage() {
  const [envVars, setEnvVars] = useState<any>(null)

  useEffect(() => {
    setEnvVars({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV
    })
  }, [])

  if (!envVars) return <div>Chargement...</div>

  return (
    <div style={{ padding: '20px' }}>
      <h1>🔍 Test Variables d'Environnement</h1>
      
      <div style={{ backgroundColor: '#f5f5f5', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
        <h3>Variables côté client:</h3>
        <p><strong>URL:</strong> {envVars.url || '❌ NON DÉFINIE'}</p>
        <p><strong>ANON_KEY:</strong> {envVars.key ? '✅ ' + envVars.key.slice(0, 20) + '...' + envVars.key.slice(-10) : '❌ NON DÉFINIE'}</p>
        <p><strong>NODE_ENV:</strong> {envVars.nodeEnv}</p>
      </div>

      <div style={{ backgroundColor: envVars.url?.includes('mcencfcgqyquujiejimi') ? '#d4edda' : '#f8d7da', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
        <h3>Diagnostic:</h3>
        {envVars.url?.includes('mcencfcgqyquujiejimi') ? (
          <p>✅ L'application utilise le NOUVEAU projet Supabase</p>
        ) : (
          <p>❌ L'application utilise encore l'ANCIEN projet Supabase ou aucun projet</p>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => window.location.reload()} 
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          🔄 Recharger la page
        </button>
      </div>
    </div>
  )
}