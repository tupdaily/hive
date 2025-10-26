import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateToken, requireEmployee, requireAdmin } from '../middleware/auth';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  memoryBlockId: z.string().optional()
});

const assignUserSchema = z.object({
  userId: z.string().min(1),
  projectId: z.string().min(1)
});

export const createProjectRoutes = (db: any) => {
  const router = Router();

  // Apply authentication to all routes
  router.use(authenticateToken(db));

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
      const { name, description, memoryBlockId } = createProjectSchema.parse(req.body);

      const project = await db.createProject({
        name,
        description,
        memoryBlockId: memoryBlockId || null
      });

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

  return router;
};
