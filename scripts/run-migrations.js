const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur : Variables Supabase manquantes dans .env.local');
  process.exit(1);
}

// Créer le client admin pour exécuter les migrations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'calendar'
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigrations() {
  console.log('🚀 Début de l\'exécution des migrations...\n');

  try {
    // 1. Vérifier si les tables existent déjà
    console.log('📋 Vérification de l\'état actuel de la base de données...');
    
    const { data: tables } = await supabase.rpc('get_tables_list', {
      schema_name: 'calendar'
    }).single();

    // Si la fonction n'existe pas, essayer une requête directe
    const { data: existingTables, error: checkError } = await supabase
      .from('technicians')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('⚠️  La table technicians existe déjà. Migration potentiellement déjà effectuée.');
      console.log('Voulez-vous continuer ? Cela pourrait causer des erreurs.\n');
    }

    // 2. Lire et exécuter chaque script de migration
    const migrations = [
      '01-create-technicians-table.sql',
      '02-create-schedules-table.sql',
      '03-migrate-tickets-table.sql'
    ];

    for (const migrationFile of migrations) {
      console.log(`\n📄 Exécution de ${migrationFile}...`);
      
      try {
        const sqlContent = await fs.readFile(
          path.join(__dirname, '..', 'supabase', migrationFile),
          'utf8'
        );

        // Note: Supabase JS SDK ne permet pas d'exécuter du SQL arbitraire
        // Il faut utiliser l'API REST directement ou créer des fonctions RPC
        console.log(`✅ ${migrationFile} - Prêt à être exécuté`);
        console.log('   ℹ️  Le contenu SQL doit être exécuté manuellement dans l\'éditeur SQL de Supabase');
        
      } catch (error) {
        console.error(`❌ Erreur lors de la lecture de ${migrationFile}:`, error.message);
      }
    }

    // 3. Tester les nouvelles tables
    console.log('\n🔍 Test des fonctionnalités après migration...\n');

    // Test 1: Récupérer les techniciens
    console.log('Test 1: Récupération des techniciens...');
    const { data: technicians, error: techError } = await supabase
      .from('technicians')
      .select('*')
      .order('name');

    if (!techError && technicians) {
      console.log(`✅ ${technicians.length} techniciens trouvés`);
      technicians.forEach(tech => {
        console.log(`   - ${tech.name} (${tech.color})`);
      });
    } else {
      console.log('❌ Impossible de récupérer les techniciens:', techError?.message);
    }

    // Test 2: Vérifier les horaires
    console.log('\nTest 2: Vérification des horaires...');
    const { data: schedules, error: schedError } = await supabase
      .from('schedules')
      .select('*')
      .eq('date', new Date().toISOString().split('T')[0])
      .limit(5);

    if (!schedError && schedules) {
      console.log(`✅ ${schedules.length} horaires trouvés pour aujourd'hui`);
    } else {
      console.log('❌ Impossible de récupérer les horaires:', schedError?.message);
    }

    // Test 3: Vérifier la vue tickets_with_technician
    console.log('\nTest 3: Vérification de la vue tickets_with_technician...');
    const { data: ticketsView, error: viewError } = await supabase
      .from('tickets_with_technician')
      .select('*')
      .limit(5);

    if (!viewError && ticketsView) {
      console.log(`✅ Vue tickets_with_technician fonctionne (${ticketsView.length} tickets)`);
    } else {
      console.log('❌ Problème avec la vue:', viewError?.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📝 IMPORTANT : Les migrations SQL doivent être exécutées manuellement');
    const projectId = supabaseUrl.split('//')[1].split('.')[0];
    console.log('1. Allez sur : https://supabase.com/dashboard/project/' + projectId + '/sql');
    console.log('2. Copiez et exécutez chaque script dans l\'ordre');
    console.log('3. Vérifiez qu\'il n\'y a pas d\'erreurs');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Fonction helper pour afficher les instructions
async function showInstructions() {
  const instructions = `
🎯 Instructions pour exécuter les migrations :

1. Ouvrez votre navigateur et allez à :
   https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql

2. Connectez-vous à votre dashboard Supabase

3. Exécutez les scripts dans cet ordre :
   - 01-create-technicians-table.sql
   - 02-create-schedules-table.sql
   - 03-migrate-tickets-table.sql

4. Après chaque script, vérifiez qu'il n'y a pas d'erreur

5. Une fois terminé, redémarrez votre application Next.js

Les fichiers SQL sont dans le dossier 'supabase/' de votre projet.
`;

  console.log(instructions);
}

// Exécuter
runMigrations();