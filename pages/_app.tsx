import '../styles/globals.css'
import '../styles/modern-theme.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Vérifier la connexion Supabase au démarrage
    const checkConnection = async () => {
      try {
        const { error } = await supabase
          .from('tickets')
          .select('count(*)', { count: 'exact', head: true })
        
        if (error && error.code === '42P01') {
          console.error('⚠️ La table tickets n\'existe pas dans Supabase')
          console.error('Veuillez créer la table en utilisant le script SQL fourni')
          console.error('Fichier: supabase/create-complete-table.sql')
        }
      } catch (err) {
        console.error('Erreur de connexion à Supabase:', err)
      }
    }
    
    checkConnection()
  }, [])
  
  return <Component {...pageProps} />
}

export default MyApp