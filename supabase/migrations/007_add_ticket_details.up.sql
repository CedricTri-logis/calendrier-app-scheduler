-- Migration 007: Add description and estimated_duration to tickets table
-- Created for ticket details modal functionality

-- Add description column (text, nullable)
ALTER TABLE tickets 
ADD COLUMN description TEXT;

-- Add estimated_duration column (integer, nullable, in minutes)
ALTER TABLE tickets 
ADD COLUMN estimated_duration INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN tickets.description IS 'Optional description of the ticket work to be done';
COMMENT ON COLUMN tickets.estimated_duration IS 'Estimated duration in minutes for the ticket work';

-- Create index for potentially searching by description
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_description 
ON tickets USING gin(to_tsvector('french', description)) 
WHERE description IS NOT NULL;

-- Update the updated_at timestamp when these fields change
-- Note: This assumes there's already an updated_at trigger on the tickets table