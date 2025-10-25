# Supabase Setup Instructions

This application has been migrated from SQLite to Supabase. Follow these steps to set up your Supabase database.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization and enter project details:
   - Name: `hive-ai-team` (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Choose the closest region to your users
4. Click "Create new project"
5. Wait for the project to be set up (this may take a few minutes)

## 2. Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)
   - **service_role** key (starts with `eyJ`)

## 3. Set Up Environment Variables

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Update your `.env` file with your Supabase credentials:
   ```env
   # Supabase Database
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   
   # JWT Secret - Use a long, random, secure string for production
   JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
   
   # Server
   PORT=3001
   NODE_ENV=development
   
   # Claude AI Configuration
   ANTHROPIC_API_KEY=your-anthropic-api-key-here
   ```

## 4. Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `src/database/supabase-schema.sql`
4. Click "Run" to execute the SQL and create all tables

## 5. Install Dependencies

```bash
npm install
```

## 6. Start the Application

```bash
npm run dev
```

## Database Schema

The following tables will be created:

- **users**: User accounts with authentication and memory block references
- **agents**: AI agents belonging to users
- **projects**: Project management
- **project_members**: Many-to-many relationship between projects and agents
- **memory_blocks**: Shared and individual memory storage

### Key Changes in the New Memory System:

1. **User Memory Blocks**: Each user now has a dedicated memory block stored in Supabase with their user ID/email as the label
2. **Agent Creation**: When creating an agent, users provide a description of what they want the agent to do
3. **Simplified Agent Queries**: Agents now only have a simple query method that uses Letta's message API
4. **Persona Integration**: Agent personas now include the user's description of what they want the agent to do

## Security Notes

- The `service_role` key has full access to your database - keep it secure
- The `anon` key is safe to use in client-side code
- Row Level Security (RLS) is available but not enabled by default
- Consider enabling RLS for production use

## Migration from SQLite

If you have existing data in SQLite:

1. Export your data from the SQLite database
2. Transform the data to match the new UUID format
3. Import the data into Supabase using the SQL editor or API

## Troubleshooting

- Ensure all environment variables are set correctly
- Check that the Supabase project is active and not paused
- Verify that the database tables were created successfully
- Check the Supabase logs for any connection issues
