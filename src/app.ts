import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Database } from './database/connection';
import { AuthService } from './auth/auth';
import { AgentManager } from './ai/agentManager';
import { createAuthRoutes } from './routes/auth';
import { createAgentRoutes } from './routes/agents';
import { createAdminRoutes } from './routes/admin';
import { createProjectRoutes } from './routes/projects';

// Load environment variables
dotenv.config();

export class App {
  private app: express.Application;
  private db: Database;
  private authService: AuthService;
  private agentManager: AgentManager;

  constructor() {
    this.app = express();
    
    // Initialize Supabase database
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY');
    }
    
    this.db = new Database(supabaseUrl, supabaseKey);
    this.authService = new AuthService(this.db, process.env.JWT_SECRET || 'fallback-secret');
    this.agentManager = new AgentManager(this.db);
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' ? false : true,
      credentials: true
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Serve static files
    this.app.use(express.static('src/public'));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // API routes
    this.app.use('/api/auth', createAuthRoutes(this.authService, this.db, this.agentManager));
    this.app.use('/api/agents', createAgentRoutes(this.agentManager, this.authService));
    this.app.use('/api/admin', createAdminRoutes(this.db, this.agentManager, this.authService));
    this.app.use('/api/projects', createProjectRoutes(this.db, this.authService, this.agentManager));

    // Serve the main app
    this.app.get('/', (req, res) => {
      res.sendFile('index.html', { root: 'src/public' });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    // Error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  async initialize(): Promise<void> {
    try {
      // Initialize any required services here
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      throw error;
    }
  }

  getApp(): express.Application {
    return this.app;
  }

  async close(): Promise<void> {
    this.db.close();
  }
}
