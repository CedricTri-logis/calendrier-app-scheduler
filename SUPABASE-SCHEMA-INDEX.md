# 📊 Supabase Schema Indexing Guide

This guide explains how to get a complete index of your Supabase database schema including all tables, relations, RLS policies, functions, and triggers.

## 🚀 Quick Start

### Method 1: Using SQL Functions (Recommended)

1. **Create the inspection functions** in your Supabase SQL editor:
   ```sql
   -- Copy the content from scripts/create-schema-functions.sql
   -- and run it in your Supabase SQL editor
   ```

2. **Run the inspection query**:
   ```sql
   SELECT * FROM get_complete_schema_info();
   ```

3. **Export the results** as JSON or CSV from the Supabase dashboard

### Method 2: Using Node.js Script

1. **Ensure your environment variables are set**:
   ```bash
   # In .env.local
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Run the indexing script**:
   ```bash
   node scripts/index-supabase-schema.js
   ```

### Method 3: Using Supabase CLI

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Dump the schema**:
   ```bash
   supabase db dump --schema public > supabase/complete-schema.sql
   ```

## 📋 What Gets Indexed

### 1. **Tables & Columns**
- Table names and types
- Column names, data types, nullable status
- Default values and constraints
- Character limits and numeric precision

### 2. **Foreign Keys**
- Source and target tables/columns
- Constraint names
- ON UPDATE and ON DELETE rules
- Referential integrity details

### 3. **RLS Policies**
- Policy names and tables
- Commands (SELECT, INSERT, UPDATE, DELETE)
- USING expressions (row visibility)
- WITH CHECK expressions (data validation)
- Roles and permissions

### 4. **Functions**
- Function names and arguments
- Return types
- Source code
- Language (plpgsql, sql, etc.)
- Trigger functions

### 5. **Triggers**
- Trigger names and tables
- Timing (BEFORE, AFTER, INSTEAD OF)
- Events (INSERT, UPDATE, DELETE, TRUNCATE)
- Trigger functions
- Conditions and definitions

### 6. **Indexes**
- Index names and types
- Indexed columns
- Unique and primary key constraints
- Index definitions

### 7. **Table Sizes**
- Total table size
- Data size vs index size
- Row counts

## 🔍 Example Queries

### Get all foreign key relationships:
```sql
SELECT 
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
AND tc.table_schema = 'public';
```

### Get all RLS policies with their logic:
```sql
SELECT 
  tablename,
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Get all functions with source code:
```sql
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as returns,
  prosrc as source_code
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace;
```

### Get all triggers with their conditions:
```sql
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation as event,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

## 📁 Output Files

After running the indexing process, you'll get:

1. **`supabase-schema-index.json`** - Complete schema in JSON format
2. **`supabase-schema-index.md`** - Human-readable markdown report
3. **`supabase-schema-queries.sql`** - SQL queries for manual inspection

## 🛠️ Automating Schema Documentation

You can automate schema documentation by:

1. **Creating a GitHub Action** that runs the indexing script
2. **Setting up a cron job** in Supabase to periodically export schema
3. **Using database migrations** to track schema changes

## 🔐 Security Considerations

- Use service role key only in secure environments
- Never commit service role keys to version control
- Consider creating read-only database functions for schema inspection
- Regularly audit your RLS policies and permissions

## 📚 Current Schema Overview

Based on your current project, here's what we know:

### Tables:
- **`tickets`** - Main table for calendar tickets
  - `id` (SERIAL PRIMARY KEY)
  - `title` (VARCHAR 255)
  - `color` (VARCHAR 7) 
  - `date` (DATE, nullable)
  - `hour` (INTEGER, -1 for all day)
  - `technician` (VARCHAR 100)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

### Indexes:
- `idx_tickets_date` on date column
- `idx_tickets_technician` on technician column

### Triggers:
- `update_tickets_updated_at` - Updates the updated_at timestamp

### RLS Policy:
- "Allow all operations on tickets" - Currently allows all operations (should be restricted in production)

## 🎯 Next Steps

1. Run the complete schema inspection
2. Review and document all relationships
3. Audit RLS policies for security
4. Create a schema diagram
5. Set up automated documentation updates