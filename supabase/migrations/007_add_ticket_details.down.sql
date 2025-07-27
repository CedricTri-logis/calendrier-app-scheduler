-- Migration 007 Rollback: Remove description and estimated_duration from tickets table

-- Drop the index first
DROP INDEX IF EXISTS idx_tickets_description;

-- Remove the columns
ALTER TABLE tickets 
DROP COLUMN IF EXISTS description;

ALTER TABLE tickets 
DROP COLUMN IF EXISTS estimated_duration;