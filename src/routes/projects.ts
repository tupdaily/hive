import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateToken, requireEmployee, requireAdmin } from '../middleware/auth';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1)
});

const assignUserSchema = z.object({
  userId: z.string().min(1),
  projectId: z.string().min(1)
});

export const createProjectRoutes = (db: any, authService: any, agentManager: any) => {
  const router = Router();

  // Apply authentication to all routes
  router.use(authenticateToken(authService));

  // Get user's assigned projects
  router.get('/my-projects', requireEmployee, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const projects = await db.getProjectsByUserId(req.user.userId);
      res.json({ projects });
    } catch (error) {
      console.error('Error fetching user projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  // Get all projects (admin only)
  router.get('/all', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projects = await db.getAllProjects();
      res.json({ projects });
    } catch (error) {
      console.error('Error fetching all projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  // Create a new project (admin only)
  router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, description } = createProjectSchema.parse(req.body);

      // Create a shared memory block in Letta for this project
      let memoryBlockId = null;
      try {
        const lettaClient = agentManager.getClient();
        const memoryBlock = await lettaClient.blocks.create({
          label: `Project: ${name}`,
          value: `Project: ${name}\nDescription: ${description || 'No description provided'}`,
          metadata: {
            type: 'shared',
            project: name
          }
        });
        memoryBlockId = memoryBlock.id;
      } catch (lettaError) {
        console.error('Failed to create Letta memory block:', lettaError);
        // Continue without memory block - project will be created but without Letta integration
      }

      const project = await db.createProject({
        name,
        description,
        memoryBlockId
      });

      // Auto-assign all users to this project (optional - you can remove this if you want manual assignment)
      try {
        const users = await db.getAllUsers();
        for (const user of users) {
          try {
            await db.addUserToProject(user.id, project.id);
          } catch (assignError) {
            console.error(`Failed to assign user ${user.email} to project:`, assignError);
            // Continue with other users
          }
        }
      } catch (usersError) {
        console.error('Failed to fetch users for auto-assignment:', usersError);
        // Continue - project is created even if auto-assignment fails
      }

      res.status(201).json({
        message: 'Project created successfully',
        project
      });
    } catch (error) {
      console.error('Error creating project:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }

      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create project' });
    }
  });

  // Assign user to project (admin only)
  router.post('/assign-user', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, projectId } = assignUserSchema.parse(req.body);

      await db.addUserToProject(userId, projectId);

      res.json({ message: 'User assigned to project successfully' });
    } catch (error) {
      console.error('Error assigning user to project:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }

      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to assign user to project' });
    }
  });

  // Remove user from project (admin only)
  router.delete('/remove-user', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId, projectId } = assignUserSchema.parse(req.body);

      await db.removeUserFromProject(userId, projectId);

      res.json({ message: 'User removed from project successfully' });
    } catch (error) {
      console.error('Error removing user from project:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }

      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to remove user from project' });
    }
  });

  // Get all users (admin only)
  router.get('/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await db.getAllUsers();
      res.json({ users });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Update agent memory blocks with selected projects
  router.post('/update-agent-memory', requireEmployee, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { projectIds } = req.body; // Array of selected project IDs

      // Get user's agent
      const userAgent = await db.getAgentByUserId(req.user.userId);
      if (!userAgent || !userAgent.lettaAgentId) {
        return res.status(404).json({ error: 'User agent not found or not initialized' });
      }

      // Get user's human memory block
      const user = await db.getUserById(req.user.userId);
      const memoryBlocks = [];
      
      if (user?.memoryBlockId) {
        memoryBlocks.push(user.memoryBlockId);
      }

      // Add selected project memory blocks
      for (const projectId of projectIds) {
        const project = await db.getProjectById(projectId);
        if (project?.memoryBlockId) {
          memoryBlocks.push(project.memoryBlockId);
        }
      }

      // Update agent with user's human memory block + selected project memory blocks
      const lettaClient = agentManager.getClient();
      await lettaClient.agents.update(userAgent.lettaAgentId, {
        memoryBlocks: memoryBlocks
      });

      res.json({ message: 'Agent memory blocks updated successfully' });
    } catch (error) {
      console.error('Error updating agent memory blocks:', error);
      res.status(500).json({ error: 'Failed to update agent memory blocks' });
    }
  });

  return router;
};
