const fs = require('fs');
const path = require('path');

console.log('🔧 Configuration de l\'environnement pour les migrations\n');

const envPath = path.join(__dirname, '.env.local');
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdXhqdHRqbHh2cmt1ZWFhY3Z5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzE0NjkxNCwiZXhwIjoyMDY4NzIyOTE0fQ.xJRLvastt3CkWTTfFPIWLs5pQ17wM51-X3dFLc8vS6U';

try {
  // Lire le fichier existant
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Vérifier si la clé existe déjà
  if (envContent.includes('SUPABASE_SERVICE_ROLE_KEY=')) {
    console.log('✅ SUPABASE_SERVICE_ROLE_KEY existe déjà dans .env.local');
    console.log('   Si les migrations ne fonctionnent pas, vérifiez que la clé est correcte.');
  } else {
    // Ajouter la clé
    const newContent = envContent + '\n# Service Role Key - NE JAMAIS EXPOSER AU CLIENT !\nSUPABASE_SERVICE_ROLE_KEY=' + serviceRoleKey + '\n';
    fs.writeFileSync(envPath, newContent);
    console.log('✅ SUPABASE_SERVICE_ROLE_KEY ajoutée à .env.local');
    console.log('\n⚠️  IMPORTANT : Redémarrez le serveur Next.js pour charger la nouvelle configuration !');
    console.log('   1. Arrêtez le serveur (Ctrl+C)');
    console.log('   2. Relancez : npm run dev');
  }

  console.log('\n📋 Configuration actuelle :');
  console.log('   - Fichier : .env.local');
  console.log('   - Service Role Key : ' + (envContent.includes('SUPABASE_SERVICE_ROLE_KEY=') ? 'Configurée' : 'Ajoutée'));
  
} catch (error) {
  console.error('❌ Erreur lors de la configuration :', error.message);
}

console.log('\n🚀 Prochaines étapes :');
console.log('   1. Redémarrez le serveur si nécessaire');
console.log('   2. Allez sur http://localhost:3001/migrations');
console.log('   3. Exécutez les migrations');