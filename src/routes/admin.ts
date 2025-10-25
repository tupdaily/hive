import { Router, Response } from 'express';
import { Database } from '../database/connection';
import { AgentManager } from '../ai/agentManager';
import { AuthenticatedRequest, authenticateToken, requireAdmin } from '../middleware/auth';
import { z } from 'zod';
import { AdminStats } from '../types';

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'paused']).optional()
});

const addProjectMemberSchema = z.object({
  agentId: z.string(),
  role: z.enum(['lead', 'member']).optional()
});

const createMemoryBlockSchema = z.object({
  content: z.string().min(1),
  type: z.enum(['shared', 'individual']),
  agentId: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export const createAdminRoutes = (db: Database, agentManager: AgentManager, authService: any) => {
  const router = Router();

  // Apply authentication and admin requirement to all routes
  router.use(authenticateToken(authService));
  router.use(requireAdmin);

  // Get admin dashboard stats
  router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const [users, agents, projects, memoryBlocks] = await Promise.all([
        db.getAllUsers(),
        db.getAllAgents(),
        db.getAllProjects(),
        db.getAllMemoryBlocks()
      ]);

      const stats: AdminStats = {
        totalUsers: users.length,
        totalAgents: agents.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        totalMemoryBlocks: memoryBlocks.length
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Get all users
  router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await db.getAllUsers();
      res.json({ users });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Get all agents
  router.get('/agents', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const agents = await agentManager.getAllAgents();
      res.json({
        agents: agents.map(agent => agent.getAgent())
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch agents' });
    }
  });

  // Get all projects
  router.get('/projects', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projects = await db.getAllProjects();
      res.json({ projects });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  // Create project
  router.post('/projects', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, description, status } = createProjectSchema.parse(req.body);
      
      const project = {
        id: generateId(),
        name,
        description: description || '',
        status: status || 'active'
      };

      await db.createProject(project);
      
      res.status(201).json({
        message: 'Project created successfully',
        project
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create project' });
    }
  });

  // Add member to project
  router.post('/projects/:projectId/members', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId } = req.params;
      const { agentId, role } = addProjectMemberSchema.parse(req.body);
      
      // Check if project exists
      const project = await db.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Check if agent exists
      const agent = await agentManager.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const member = {
        id: generateId(),
        projectId,
        agentId,
        role: role || 'member'
      };

      await db.addProjectMember(member);
      
      res.status(201).json({
        message: 'Member added to project successfully',
        member
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to add member to project' });
    }
  });

  // Remove member from project
  router.delete('/projects/:projectId/members/:agentId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId, agentId } = req.params;
      
      await db.removeProjectMember(projectId, agentId);
      
      res.json({
        message: 'Member removed from project successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove member from project' });
    }
  });

  // Get project members
  router.get('/projects/:projectId/members', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId } = req.params;
      
      const members = await db.getProjectMembers(projectId);
      
      res.json({ members });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch project members' });
    }
  });

  // Create memory block
  router.post('/memory-blocks', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { content, type, agentId, metadata } = createMemoryBlockSchema.parse(req.body);
      
      if (type === 'individual' && !agentId) {
        return res.status(400).json({ error: 'Agent ID required for individual memory blocks' });
      }

      if (type === 'individual') {
        const agent = await agentManager.getAgent(agentId!);
        if (!agent) {
          return res.status(404).json({ error: 'Agent not found' });
        }
      }

      const memoryBlock = {
        id: generateId(),
        type,
        agentId: type === 'individual' ? agentId : undefined,
        content,
        metadata: metadata || {}
      };

      await db.createMemoryBlock(memoryBlock);
      
      res.status(201).json({
        message: 'Memory block created successfully',
        memoryBlock
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create memory block' });
    }
  });

  // Get all memory blocks
  router.get('/memory-blocks', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const memoryBlocks = await db.getAllMemoryBlocks();
      res.json({ memoryBlocks });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch memory blocks' });
    }
  });

  // Get shared memory blocks
  router.get('/memory-blocks/shared', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const memoryBlocks = await db.getSharedMemoryBlocks();
      res.json({ memoryBlocks });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch shared memory blocks' });
    }
  });

  return router;
};

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
