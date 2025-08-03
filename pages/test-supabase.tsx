import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function TestSupabase() {
  const [status, setStatus] = useState<string>('Vérification...')
  const [error, setError] = useState<string | null>(null)
  const [tableExists, setTableExists] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkSupabase() {
      try {
        // Tester la connexion
        const { data, error } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })

        if (error) {
          if (error.code === '42P01') {
            setStatus('⚠️ La table tickets n\'existe pas')
            setTableExists(false)
            setError('Veuillez créer la table dans Supabase en utilisant le script SQL fourni')
          } else {
            setStatus('❌ Erreur de connexion')
            setError(error.message)
          }
        } else {
          setStatus('✅ Connexion réussie')
          setTableExists(true)
        }
      } catch (err) {
        setStatus('❌ Erreur')
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    }

    checkSupabase()
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Test de connexion Supabase</h1>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Statut: {status}</h2>
        
        {error && (
          <div style={{ 
            backgroundColor: '#fee', 
            padding: '1rem', 
            borderRadius: '8px',
            marginTop: '1rem' 
          }}>
            <strong>Erreur:</strong> {error}
          </div>
        )}

        {tableExists === false && (
          <div style={{ 
            backgroundColor: '#fef3cd', 
            padding: '1rem', 
            borderRadius: '8px',
            marginTop: '2rem' 
          }}>
            <h3>Pour créer la table:</h3>
            <ol>
              <li>Allez sur <a href="https://supabase.com/dashboard/project/fmuxjttjlxvrkueaacvy/sql/new" target="_blank">l'éditeur SQL de Supabase</a></li>
              <li>Copiez et exécutez le contenu du fichier <code>supabase/create-complete-table.sql</code> (ce fichier inclut la colonne technicien)</li>
              <li>Rechargez cette page</li>
            </ol>
            <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
              <strong>Note:</strong> Le script <code>create-complete-table.sql</code> crée la table avec toutes les colonnes nécessaires,
              y compris la colonne technicien et quelques données d'exemple.
            </p>
          </div>
        )}

        {tableExists === true && (
          <div style={{ 
            backgroundColor: '#d4edda', 
            padding: '1rem', 
            borderRadius: '8px',
            marginTop: '1rem' 
          }}>
            <p>✅ Tout est prêt ! Vous pouvez retourner à l'application principale.</p>
            <a href="/" style={{ color: '#155724', fontWeight: 'bold' }}>Retour au calendrier</a>
          </div>
        )}
      </div>

      <div style={{ marginTop: '3rem', fontSize: '0.9rem', color: '#666' }}>
        <h3>Configuration actuelle:</h3>
        <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
        <p>Clé: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
      </div>
    </div>
  )
}