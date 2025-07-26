const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function indexSupabaseSchema() {
  console.log('🔍 Indexing Supabase schema...\n');
  
  const schemaInfo = {
    timestamp: new Date().toISOString(),
    database_url: supabaseUrl,
    tables: {},
    functions: [],
    triggers: [],
    policies: [],
    foreign_keys: []
  };

  try {
    // 1. Get all tables with columns
    console.log('📊 Fetching tables and columns...');
    const { data: tables, error: tablesError } = await supabase.rpc('get_schema_info', {
      sql: `
        SELECT 
          t.table_name,
          t.table_type,
          obj_description(c.oid) as table_comment
        FROM information_schema.tables t
        JOIN pg_class c ON c.relname = t.table_name
        WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name;
      `
    }).single();

    if (tablesError) {
      // Fallback to direct query
      const { data: tables } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE');
      
      console.log(`Found ${tables?.length || 0} tables`);
    }

    // 2. Get columns for each table
    console.log('📋 Fetching columns details...');
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_schema', 'public')
      .order('table_name', { ascending: true })
      .order('ordinal_position', { ascending: true });

    // Organize columns by table
    if (columns) {
      columns.forEach(col => {
        if (!schemaInfo.tables[col.table_name]) {
          schemaInfo.tables[col.table_name] = {
            name: col.table_name,
            columns: [],
            indexes: [],
            constraints: []
          };
        }
        
        schemaInfo.tables[col.table_name].columns.push({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          default: col.column_default,
          max_length: col.character_maximum_length,
          numeric_precision: col.numeric_precision,
          numeric_scale: col.numeric_scale
        });
      });
    }

    // 3. Get indexes
    console.log('🔍 Fetching indexes...');
    const indexQuery = `
      SELECT 
        t.relname as table_name,
        i.relname as index_name,
        a.attname as column_name,
        ix.indisprimary as is_primary,
        ix.indisunique as is_unique
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relkind = 'r'
      AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ORDER BY t.relname, i.relname;
    `;

    // 4. Get foreign keys
    console.log('🔗 Fetching foreign keys...');
    const fkQuery = `
      SELECT
        tc.table_name as source_table,
        kcu.column_name as source_column,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public';
    `;

    // 5. Get RLS policies
    console.log('🛡️ Fetching RLS policies...');
    const policiesQuery = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `;

    // 6. Get functions
    console.log('⚡ Fetching functions...');
    const functionsQuery = `
      SELECT 
        p.proname as function_name,
        pg_get_function_result(p.oid) as return_type,
        pg_get_function_arguments(p.oid) as arguments,
        p.prosrc as source_code,
        l.lanname as language
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      JOIN pg_language l ON p.prolang = l.oid
      WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      ORDER BY p.proname;
    `;

    // 7. Get triggers
    console.log('🎯 Fetching triggers...');
    const triggersQuery = `
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement,
        action_orientation,
        action_timing,
        created
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name;
    `;

    // Execute all queries (Note: These would need to be executed via a database function or direct connection)
    console.log('\n⚠️  Note: To get complete schema details, you need to:');
    console.log('1. Create database functions to execute these queries');
    console.log('2. Or use a direct PostgreSQL connection');
    console.log('3. Or use Supabase CLI: supabase db dump --schema public\n');

    // Save the current schema information we have
    const outputPath = path.join(process.cwd(), 'supabase-schema-index.json');
    await fs.writeFile(outputPath, JSON.stringify(schemaInfo, null, 2));
    
    console.log(`✅ Schema index saved to: ${outputPath}`);
    
    // Also create a markdown report
    let markdownReport = `# Supabase Schema Index\n\n`;
    markdownReport += `Generated: ${schemaInfo.timestamp}\n\n`;
    markdownReport += `## Tables\n\n`;
    
    for (const [tableName, tableInfo] of Object.entries(schemaInfo.tables)) {
      markdownReport += `### ${tableName}\n\n`;
      markdownReport += `| Column | Type | Nullable | Default |\n`;
      markdownReport += `|--------|------|----------|----------|\n`;
      
      tableInfo.columns.forEach(col => {
        markdownReport += `| ${col.name} | ${col.type} | ${col.nullable ? 'Yes' : 'No'} | ${col.default || '-'} |\n`;
      });
      
      markdownReport += `\n`;
    }
    
    const mdPath = path.join(process.cwd(), 'supabase-schema-index.md');
    await fs.writeFile(mdPath, markdownReport);
    console.log(`✅ Markdown report saved to: ${mdPath}`);

    // Create SQL queries file for manual execution
    const sqlQueries = `-- Supabase Schema Inspection Queries
-- Run these queries in your Supabase SQL editor to get complete schema information

-- 1. Foreign Keys
${fkQuery}

-- 2. RLS Policies
${policiesQuery}

-- 3. Functions
${functionsQuery}

-- 4. Triggers
${triggersQuery}

-- 5. Indexes
${indexQuery}
`;

    const sqlPath = path.join(process.cwd(), 'supabase-schema-queries.sql');
    await fs.writeFile(sqlPath, sqlQueries);
    console.log(`✅ SQL queries saved to: ${sqlPath}`);
    console.log('\n📝 Run these queries in your Supabase SQL editor for complete details!');

  } catch (error) {
    console.error('❌ Error indexing schema:', error);
  }
}

// Run the indexer
indexSupabaseSchema();