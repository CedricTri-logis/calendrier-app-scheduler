import { createClient } from '@supabase/supabase-js'

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mcencfcgqyquujiejimi.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZW5jZmNncXlxdXVqaWVqaW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MDA3OTcsImV4cCI6MjA2NzE3Njc5N30.0vMDpwsnwTo7i7Vcb83yfbW8T60bqYBCcEDgEnGyDG0'

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public'
  }
})

async function setupDatabase() {
  console.log('Configuration de la base de données...')

  try {
    // Vérifier si la table existe déjà
    const { data: existingTickets, error: checkError } = await supabase
      .from('tickets')
      .select('id')
      .limit(1)

    if (!checkError) {
      console.log('✅ La table tickets existe déjà!')
      
      // Vérifier s'il y a des données
      const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
      
      console.log(`   Nombre de tickets existants: ${count}`)
      
      if (count === 0) {
        // Ajouter des tickets d'exemple
        console.log('Ajout de tickets d\'exemple...')
        const { error: insertError } = await supabase
          .from('tickets')
          .insert([
            { title: 'Réunion équipe', color: '#FFE5B4' },
            { title: 'Appel client', color: '#B4E5FF' },
            { title: 'Révision projet', color: '#FFB4B4' },
            { title: 'Planning sprint', color: '#D4FFB4' }
          ])
        
        if (insertError) {
          console.error('Erreur lors de l\'ajout des tickets:', insertError)
        } else {
          console.log('✅ Tickets d\'exemple ajoutés!')
        }
      }
    } else {
      console.log('❌ La table tickets n\'existe pas.')
      console.log('   Vous devez la créer manuellement via l\'interface Supabase.')
      console.log('   Utilisez le fichier: supabase/create-table-simple.sql')
      console.log('')
      console.log('Lien direct vers l\'éditeur SQL:')
      console.log(`https://supabase.com/dashboard/project/${supabaseUrl.split('.')[0].split('//')[1]}/sql/new`)
    }

    // Tester la connexion en temps réel
    console.log('\nTest de la connexion temps réel...')
    const channel = supabase
      .channel('test')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload: any) => {
        console.log('✅ Connexion temps réel fonctionnelle!')
        channel.unsubscribe()
      })
      .subscribe()

    setTimeout(() => {
      channel.unsubscribe()
      console.log('Test terminé.')
      process.exit(0)
    }, 3000)

  } catch (error) {
    console.error('Erreur:', error)
    process.exit(1)
  }
}

setupDatabase()