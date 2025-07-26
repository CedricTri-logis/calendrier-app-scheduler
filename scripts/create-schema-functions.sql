-- Create functions to inspect the complete database schema
-- Run this in your Supabase SQL editor to create the inspection functions

-- Function to get complete table information
CREATE OR REPLACE FUNCTION get_complete_schema_info()
RETURNS TABLE (
  info_type text,
  details jsonb
) AS $$
BEGIN
  -- Tables and Columns
  RETURN QUERY
  SELECT 
    'tables'::text,
    jsonb_agg(
      jsonb_build_object(
        'table_name', t.table_name,
        'columns', t.columns,
        'row_count', t.row_count
      )
    )
  FROM (
    SELECT 
      c.table_name,
      jsonb_agg(
        jsonb_build_object(
          'column_name', c.column_name,
          'data_type', c.data_type,
          'is_nullable', c.is_nullable,
          'column_default', c.column_default,
          'character_maximum_length', c.character_maximum_length
        ) ORDER BY c.ordinal_position
      ) as columns,
      (SELECT COUNT(*) FROM information_schema.tables it WHERE it.table_name = c.table_name)::text as row_count
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    GROUP BY c.table_name
  ) t;

  -- Foreign Keys
  RETURN QUERY
  SELECT 
    'foreign_keys'::text,
    jsonb_agg(
      jsonb_build_object(
        'constraint_name', tc.constraint_name,
        'source_table', tc.table_name,
        'source_column', kcu.column_name,
        'target_table', ccu.table_name,
        'target_column', ccu.column_name,
        'on_update', rc.update_rule,
        'on_delete', rc.delete_rule
      )
    )
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  JOIN information_schema.referential_constraints rc
    ON rc.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

  -- RLS Policies
  RETURN QUERY
  SELECT 
    'policies'::text,
    jsonb_agg(
      jsonb_build_object(
        'table_name', tablename,
        'policy_name', policyname,
        'command', cmd,
        'permissive', permissive,
        'roles', roles,
        'using_expression', qual,
        'check_expression', with_check
      )
    )
  FROM pg_policies
  WHERE schemaname = 'public';

  -- Functions
  RETURN QUERY
  SELECT 
    'functions'::text,
    jsonb_agg(
      jsonb_build_object(
        'function_name', p.proname,
        'return_type', pg_get_function_result(p.oid),
        'arguments', pg_get_function_arguments(p.oid),
        'language', l.lanname,
        'source_code', p.prosrc,
        'is_trigger', p.prorettype = 'trigger'::regtype
      )
    )
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  JOIN pg_language l ON p.prolang = l.oid
  WHERE n.nspname = 'public'
  AND p.prokind = 'f';

  -- Triggers
  RETURN QUERY
  SELECT 
    'triggers'::text,
    jsonb_agg(
      jsonb_build_object(
        'trigger_name', t.tgname,
        'table_name', c.relname,
        'enabled', t.tgenabled,
        'timing', CASE 
          WHEN t.tgtype & 2 = 2 THEN 'BEFORE'
          WHEN t.tgtype & 64 = 64 THEN 'INSTEAD OF'
          ELSE 'AFTER'
        END,
        'events', ARRAY[
          CASE WHEN t.tgtype & 4 = 4 THEN 'INSERT' END,
          CASE WHEN t.tgtype & 8 = 8 THEN 'DELETE' END,
          CASE WHEN t.tgtype & 16 = 16 THEN 'UPDATE' END,
          CASE WHEN t.tgtype & 32 = 32 THEN 'TRUNCATE' END
        ],
        'function_name', p.proname,
        'definition', pg_get_triggerdef(t.oid)
      )
    )
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  JOIN pg_proc p ON t.tgfoid = p.oid
  WHERE n.nspname = 'public'
  AND NOT t.tgisinternal;

  -- Indexes
  RETURN QUERY
  SELECT 
    'indexes'::text,
    jsonb_agg(
      jsonb_build_object(
        'index_name', i.relname,
        'table_name', t.relname,
        'is_unique', ix.indisunique,
        'is_primary', ix.indisprimary,
        'columns', ARRAY(
          SELECT a.attname
          FROM pg_attribute a
          WHERE a.attrelid = t.oid
          AND a.attnum = ANY(ix.indkey)
          ORDER BY array_position(ix.indkey, a.attnum)
        ),
        'definition', pg_get_indexdef(i.oid)
      )
    )
  FROM pg_class t
  JOIN pg_index ix ON t.oid = ix.indrelid
  JOIN pg_class i ON i.oid = ix.indexrelid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE t.relkind = 'r'
  AND n.nspname = 'public';

  -- Table sizes
  RETURN QUERY
  SELECT 
    'table_sizes'::text,
    jsonb_agg(
      jsonb_build_object(
        'table_name', relname,
        'total_size', pg_size_pretty(pg_total_relation_size(c.oid)),
        'table_size', pg_size_pretty(pg_relation_size(c.oid)),
        'indexes_size', pg_size_pretty(pg_total_relation_size(c.oid) - pg_relation_size(c.oid))
      )
    )
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'
  AND n.nspname = 'public';

END;
$$ LANGUAGE plpgsql;

-- Function to get RLS status for all tables
CREATE OR REPLACE FUNCTION get_rls_status()
RETURNS TABLE (
  table_name text,
  rls_enabled boolean,
  force_rls boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.relname::text,
    c.relrowsecurity,
    c.relforcerowsecurity
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'
  AND n.nspname = 'public';
END;
$$ LANGUAGE plpgsql;

-- Usage:
-- SELECT * FROM get_complete_schema_info();
-- SELECT * FROM get_rls_status();