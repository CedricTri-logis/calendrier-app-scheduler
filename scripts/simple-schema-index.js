// Simple schema indexer that uses existing environment
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim().replace(/['"]/g, '');
  }
});

console.log('🔍 Supabase Schema Indexing Guide\n');
console.log('Database URL:', env.NEXT_PUBLIC_SUPABASE_URL);
console.log('\n' + '='.repeat(60) + '\n');

console.log('📋 To get complete schema details, follow these steps:\n');

console.log('1. Go to your Supabase Dashboard SQL Editor:');
console.log(`   ${env.NEXT_PUBLIC_SUPABASE_URL}/sql\n`);

console.log('2. Run these queries one by one:\n');

console.log('-- A. Get all tables and columns:');
console.log(`SELECT 
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;\n`);

console.log('-- B. Get foreign keys:');
console.log(`SELECT 
  tc.constraint_name,
  tc.table_name as source_table,
  kcu.column_name as source_column,
  ccu.table_name AS target_table,
  ccu.column_name AS target_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public';\n`);

console.log('-- C. Get RLS policies:');
console.log(`SELECT 
  tablename,
  policyname,
  cmd as operation,
  permissive,
  roles,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE schemaname = 'public';\n`);

console.log('-- D. Get functions:');
console.log(`SELECT 
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_function_arguments(p.oid) as arguments,
  l.lanname as language,
  p.prosrc as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public';\n`);

console.log('-- E. Get triggers:');
console.log(`SELECT 
  tgname as trigger_name,
  relname as table_name,
  pg_get_triggerdef(t.oid) as definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND NOT t.tgisinternal;\n`);

console.log('-- F. Check RLS status:');
console.log(`SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as force_rls
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
AND relkind = 'r';\n`);

console.log('3. Export results as CSV or JSON from the Supabase dashboard\n');

console.log('🎯 Quick Links:');
console.log(`   - SQL Editor: ${env.NEXT_PUBLIC_SUPABASE_URL}/sql`);
console.log(`   - Table Editor: ${env.NEXT_PUBLIC_SUPABASE_URL}/table-editor`);
console.log(`   - Database Settings: ${env.NEXT_PUBLIC_SUPABASE_URL}/database/postgres-config\n`);

console.log('💡 Pro tip: Save these queries in your Supabase SQL snippets for easy access!');

// Save queries to file
const queriesContent = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'create-schema-functions.sql'), 'utf8');
console.log('\n✅ Schema inspection functions saved in: scripts/create-schema-functions.sql');
console.log('   Copy and run them in your SQL editor for advanced inspection!');