import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local manually
try {
  const envPath = join(__dirname, '..', '.env.local');
  const envFile = readFileSync(envPath, 'utf8');
  envFile.split('
').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
} catch (e) {
  console.log('Could not load .env.local');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickIndex() {
  console.log('🔍 Quick Supabase Schema Index\n');
  console.log('Database URL:', supabaseUrl);
  console.log('Generated:', new Date().toISOString());
  console.log('\n' + '='.repeat(50) + '\n');

  // Test connection and get tickets table info
  const { data: tickets, error, count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Error connecting to database:', error.message);
    return;
  }

  console.log('✅ Successfully connected to Supabase!\n');
  console.log('📊 TICKETS TABLE:');
  console.log(`   Total rows: ${count}`);
  
  // Get sample data
  const { data: sample } = await supabase
    .from('tickets')
    .select('*')
    .limit(5);

  if (sample && sample.length > 0) {
    console.log('\n   Columns detected:');
    Object.keys(sample[0]).forEach(col => {
      const value = sample[0][col];
      const type = value === null ? 'null' : typeof value;
      console.log(`   - ${col} (${type})`);
    });
    
    console.log('\n   Sample data:');
    sample.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.title} - ${row.technician || 'Non assigné'} - ${row.date || 'Not scheduled'}`);
    });
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n📝 For complete schema details with RLS policies, functions, and triggers:');
  console.log('   1. Copy the SQL from scripts/create-schema-functions.sql');
  console.log('   2. Run it in your Supabase SQL editor');
  console.log('   3. Then run: SELECT * FROM get_complete_schema_info();');
  console.log('\n💡 Or use Supabase CLI: supabase db dump --schema public');
}

quickIndex();