-- Migration: Add memory_block_id column to projects table and fix project_members table
-- Run this in your Supabase SQL editor

-- Add memory_block_id column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS memory_block_id TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN projects.memory_block_id IS 'Letta AI memory block ID for project-specific memory';

-- Fix project_members table to use user_id instead of agent_id
-- First, drop the existing foreign key constraint
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_agent_id_fkey;

-- Drop the existing unique constraint
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_project_id_agent_id_key;

-- Add user_id column if it doesn't exist
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add foreign key constraint for user_id
ALTER TABLE project_members ADD CONSTRAINT project_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add unique constraint for project_id and user_id
ALTER TABLE project_members ADD CONSTRAINT project_members_project_id_user_id_key 
    UNIQUE (project_id, user_id);

-- Drop the old agent_id column (optional - you can keep it if you want)
-- ALTER TABLE project_members DROP COLUMN IF EXISTS agent_id;
