-- Migration: Add letta_agent_id column to agents table
-- Run this in your Supabase SQL Editor

ALTER TABLE agents ADD COLUMN IF NOT EXISTS letta_agent_id TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'agents' 
AND column_name = 'letta_agent_id';
