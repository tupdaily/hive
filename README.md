# Hive AI Team

A collaborative AI application where teams can have individual AI agents with shared and personal memory blocks, built with Letta and TypeScript.

## Features

### 🤖 AI Agent System
- **Individual Agents**: Each team member gets their own AI agent with unique personality and work preferences
- **Shared Memory**: Company-wide knowledge base accessible to all agents
- **Personal Memory**: Individual memory blocks storing agent-specific knowledge and interactions
- **Smart Queries**: Agents can answer questions about projects, team members, and company information

### 👥 Team Management
- **User Authentication**: Secure login/registration system with JWT tokens
- **Role-Based Access**: Admin and employee roles with different permissions
- **Agent Creation**: Users can create and customize their AI agents
- **Project Management**: Admins can create projects and assign agents to them

### 🎛️ Admin Console
- **Dashboard**: Overview of users, agents, projects, and memory blocks
- **User Management**: View and manage all team members
- **Agent Management**: Monitor and manage all AI agents
- **Memory Management**: Add and manage shared knowledge blocks
- **Project Management**: Create projects and assign team members

### 🌐 Web Interface
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Real-time Queries**: Interactive chat interface with AI agents
- **Agent Management**: Easy creation and management of personal agents
- **Admin Panel**: Comprehensive admin interface for team management

## Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **AI Integration**: Claude AI (Anthropic)
- **Database**: SQLite with custom ORM
- **Authentication**: JWT with bcrypt password hashing
- **Frontend**: Vanilla JavaScript with Tailwind CSS
- **Validation**: Zod for request validation

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hive
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   DATABASE_URL=./data/hive.db
   JWT_SECRET=your-super-secret-jwt-key-here
   PORT=3001
   NODE_ENV=development
   ANTHROPIC_API_KEY=your-anthropic-api-key-here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3001`

### First Time Setup

1. **Register an admin account**
   - Go to the registration form
   - Select "Admin" role
   - Create your account

2. **Create your first agent**
   - Login with your admin account
   - Click "Create Agent"
   - Define the agent's personality and work preferences

3. **Add shared knowledge**
   - Use the admin panel to add company-wide information
   - This knowledge will be available to all agents

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Agents
- `GET /api/agents/my-agents` - Get user's agents
- `POST /api/agents` - Create new agent
- `GET /api/agents/:id` - Get specific agent
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent
- `POST /api/agents/:id/query` - Query agent

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/agents` - Get all agents
- `GET /api/admin/projects` - Get all projects
- `POST /api/admin/projects` - Create project
- `POST /api/admin/memory-blocks` - Create memory block

## Database Schema

### Users
- `id` - Unique identifier
- `email` - User email (unique)
- `name` - User display name
- `password_hash` - Hashed password
- `role` - 'admin' or 'employee'

### Agents
- `id` - Unique identifier
- `user_id` - Owner user ID
- `name` - Agent name
- `personality` - Agent personality description
- `work_preferences` - JSON array of work preferences
- `is_active` - Boolean active status

### Projects
- `id` - Unique identifier
- `name` - Project name
- `description` - Project description
- `status` - 'active', 'completed', or 'paused'

### Memory Blocks
- `id` - Unique identifier
- `type` - 'shared' or 'individual'
- `agent_id` - Agent ID (for individual blocks)
- `content` - Memory content
- `metadata` - JSON metadata

## Development

### Project Structure
```
src/
├── ai/                 # AI agent system
│   ├── agent.ts       # Individual AI agent
│   └── agentManager.ts # Agent management
├── auth/              # Authentication system
│   └── auth.ts        # Auth service
├── database/          # Database layer
│   ├── connection.ts  # Database connection
│   └── schema.sql     # Database schema
├── middleware/        # Express middleware
│   └── auth.ts        # Auth middleware
├── routes/            # API routes
│   ├── auth.ts        # Auth routes
│   ├── agents.ts      # Agent routes
│   └── admin.ts       # Admin routes
├── types/             # TypeScript types
│   └── index.ts       # Type definitions
├── public/            # Frontend files
│   ├── index.html     # Main HTML
│   └── app.js         # Frontend JavaScript
├── app.ts             # Express app setup
└── index.ts           # Application entry point
```

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Adding New Features

1. **New API Endpoints**
   - Add routes in `src/routes/`
   - Update types in `src/types/index.ts`
   - Add database methods in `src/database/connection.ts`

2. **New AI Features**
   - Extend `src/ai/agent.ts` for new agent capabilities
   - Update `src/ai/agentManager.ts` for management features

3. **Frontend Updates**
   - Modify `src/public/index.html` for UI changes
   - Update `src/public/app.js` for functionality

## Configuration

### Environment Variables
- `DATABASE_URL` - SQLite database file path
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `ANTHROPIC_API_KEY` - Anthropic Claude API key

### Database
The application uses SQLite for simplicity. For production, consider migrating to PostgreSQL or MySQL by updating the database connection in `src/database/connection.ts`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions or issues, please open an issue on GitHub or contact the development team.