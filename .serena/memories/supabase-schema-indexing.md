# Supabase Schema Indexing

## Overview
The project has comprehensive tools for indexing Supabase database schema including tables, foreign keys, RLS policies, functions, and triggers.

## Key Files
- `scripts/simple-schema-index.js` - Quick guide with SQL queries and Supabase links
- `scripts/create-schema-functions.sql` - Advanced PostgreSQL functions for complete schema inspection
- `scripts/index-supabase-schema.js` - Node.js script for automated indexing (requires setup)
- `SUPABASE-SCHEMA-INDEX.md` - Complete documentation on schema indexing methods

## Quick Access
Run `node scripts/simple-schema-index.js` to get:
- Direct links to Supabase SQL editor
- Ready-to-use SQL queries for schema inspection
- Instructions for exporting complete schema details

## Current Schema
- **Main table**: `tickets` with columns: id, title, color, date, hour, technician, created_at, updated_at
- **Indexes**: idx_tickets_date, idx_tickets_technician
- **Triggers**: update_tickets_updated_at (auto-updates timestamp)
- **RLS**: "Allow all operations on tickets" policy (should be restricted in production)

## Supabase URL
https://fmuxjttjlxvrkueaacvy.supabase.co