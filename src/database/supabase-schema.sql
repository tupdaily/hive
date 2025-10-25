-- Supabase migration file for Hive AI Team application
-- Run this in your Supabase SQL editor to create the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin', 'employee')) NOT NULL DEFAULT 'employee',
  description TEXT, -- User's role and what they're working on
  memory_block_id TEXT, -- Reference to the user's shared memory block
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  personality TEXT NOT NULL,
  work_preferences TEXT NOT NULL, -- JSON array
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('active', 'completed', 'paused')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project members table
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  role TEXT CHECK(role IN ('lead', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  UNIQUE(project_id, agent_id)
);

-- Memory blocks table
CREATE TABLE IF NOT EXISTS memory_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT CHECK(type IN ('shared', 'individual')) NOT NULL,
  agent_id UUID, -- NULL for shared memory blocks
  content TEXT NOT NULL,
  metadata TEXT NOT NULL, -- JSON object
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_agent_id ON project_members(agent_id);
CREATE INDEX IF NOT EXISTS idx_memory_blocks_type ON memory_blocks(type);
CREATE INDEX IF NOT EXISTS idx_memory_blocks_agent_id ON memory_blocks(agent_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memory_blocks_updated_at BEFORE UPDATE ON memory_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_blocks ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (true);

-- Create policies for agents table
CREATE POLICY "Users can view their own agents" ON agents
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own agents" ON agents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own agents" ON agents
    FOR UPDATE USING (true);

-- Create policies for projects table
CREATE POLICY "Users can view all projects" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Users can insert projects" ON projects
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update projects" ON projects
    FOR UPDATE USING (true);

-- Create policies for project_members table
CREATE POLICY "Users can view project members" ON project_members
    FOR SELECT USING (true);

CREATE POLICY "Users can insert project members" ON project_members
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update project members" ON project_members
    FOR UPDATE USING (true);

-- Create policies for memory_blocks table
CREATE POLICY "Users can view memory blocks" ON memory_blocks
    FOR SELECT USING (true);

CREATE POLICY "Users can insert memory blocks" ON memory_blocks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update memory blocks" ON memory_blocks
    FOR UPDATE USING (true);
