import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateToken, requireEmployee, requireAdmin } from '../middleware/auth';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  status: z.string().min(1),
  tasks: z.string().min(1)
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
      const { name, description, status, tasks } = createProjectSchema.parse(req.body);

      // Create a shared memory block in Letta for this project
      let memoryBlockId = null;
      try {
        console.log('Creating Letta memory block for project:', name);
        const lettaClient = agentManager.getClient();
        const memoryBlock = await lettaClient.blocks.create({
          label: name,
          value: `Project Name: ${name}\nDescription/Goals: ${description}\nTimeline/Milestones (updated daily): ${status}\nRequired Subtasks: ${tasks}\nKey Insights: `,
          limit: 4000,
          description: "Stores key information about the project, current progress, overall goal, how it fits into the rest of the organization, what tasks remain, who's working on what, with a focus on information that changes dynamically (tasking, individuals working on the project)"
        });
        memoryBlockId = memoryBlock.id;
        console.log('Successfully created Letta memory block:', memoryBlockId);
      } catch (lettaError) {
        console.error('Failed to create Letta memory block:', lettaError);
        console.error('Letta error details:', JSON.stringify(lettaError, null, 2));
        // Continue without memory block - project will be created but without Letta integration
      }

      const project = await db.createProject({
        name,
        description,
        memoryBlockId
      });

      // Project created without auto-assignment - users must be manually assigned through Admin Console

      res.status(201).json({
        message: 'Project created successfully',
        project: {
          ...project,
          memoryBlockCreated: !!memoryBlockId
        }
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

      // Add project memory block to user's agent
      try {
        console.log('SQL querying DB')
        const userAgent = await db.getAgentByUserId(userId);
        const project = await db.getProjectById(projectId);
        
        if (userAgent?.lettaAgentId && project?.memoryBlockId) {
          const user = await db.getUserById(userId);
          const memoryBlocks = [];
          
          // Always include user's human memory block
          if (user?.memoryBlockId) {
            memoryBlocks.push(user.memoryBlockId);
          }
          
          // Add the new project memory block
          memoryBlocks.push(project.memoryBlockId);
          
          // Add the new project memory block to agent
          const lettaClient = agentManager.getClient();
          await lettaClient.agents.blocks.attach(userAgent.lettaAgentId, project.memoryBlockId);
        }
      } catch (memoryError) {
        console.error('Failed to update agent memory blocks:', memoryError);
        // Continue - user is assigned even if memory update fails
      }

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

      // Remove project memory block from user's agent
      try {
        const userAgent = await db.getAgentByUserId(userId);
        const project = await db.getProjectById(projectId);
        
        if (userAgent?.lettaAgentId && project?.memoryBlockId) {
          const user = await db.getUserById(userId);
          const memoryBlocks = [];
          
          // Always include user's human memory block
          if (user?.memoryBlockId) {
            memoryBlocks.push(user.memoryBlockId);
          }
          
          // Get all remaining project memory blocks (excluding the removed one)
          const userProjects = await db.getProjectsByUserId(userId);
          for (const userProject of userProjects) {
            if (userProject.memoryBlockId && userProject.id !== projectId) {
              memoryBlocks.push(userProject.memoryBlockId);
            }
          }
          
          // Remove project memory block from agent
          const lettaClient = agentManager.getClient();
          await lettaClient.agents.blocks.detach(userAgent.lettaAgentId, project.memoryBlockId);
        }
      } catch (memoryError) {
        console.error('Failed to update agent memory blocks:', memoryError);
        // Continue - user is removed even if memory update fails
      }

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
      const userMemoryBlockId = user?.memoryBlockId;

      // Get current agent memory blocks
      const lettaClient = agentManager.getClient();
      console.log('Attempting to retrieve agent:', userAgent.lettaAgentId);
      let currentAgent;
      let currentMemoryBlocks = [];
      try {
        currentAgent = await lettaClient.agents.blocks.list(userAgent.lettaAgentId);
        currentMemoryBlocks = currentAgent?.memoryBlocks || [];
        console.log('Successfully retrieved agent, memory blocks:', currentMemoryBlocks);
      } catch (retrieveError) {
        console.error('Failed to retrieve agent:', retrieveError);
        // Continue with empty memory blocks
      }
      
      // User memory blocks should already be attached during agent creation
      
      // Get all user's assigned projects
      const userProjects = await db.getProjectsByUserId(req.user.userId);
      console.log('User projects:', userProjects);
      
      // Determine which blocks to attach/detach
      const blocksToAttach = [];
      const blocksToDetach = [];
      
      // Find blocks to attach (selected projects not currently attached)
      for (const projectId of projectIds) {
        const project = userProjects.find(p => p.id === projectId);
        console.log('Checking project for attach:', {
          projectId,
          project: project ? { id: project.id, name: project.name, memoryBlockId: project.memory_block_id } : null,
          hasMemoryBlock: !!project?.memory_block_id,
          alreadyAttached: currentMemoryBlocks.includes(project?.memory_block_id),
          willAttach: project?.memory_block_id && !currentMemoryBlocks.includes(project.memory_block_id)
        });
        if (project?.memory_block_id && !currentMemoryBlocks.includes(project.memory_block_id)) {
          blocksToAttach.push(project.memory_block_id);
        }
      }
      
      // Find blocks to detach (currently attached project blocks not in selected list)
      for (const memoryBlockId of currentMemoryBlocks) {
        // Skip user's human memory block
        if (memoryBlockId === userMemoryBlockId) continue;
        
        // Check if this is a project memory block that should be detached
        const project = userProjects.find(p => p.memory_block_id === memoryBlockId);
        if (project && !projectIds.includes(project.id)) {
          blocksToDetach.push(memoryBlockId);
        }
      }
      
      // Perform attach/detach operations
      console.log('Memory block operations:', {
        agentId: userAgent.lettaAgentId,
        blocksToAttach,
        blocksToDetach,
        currentMemoryBlocks,
        selectedProjectIds: projectIds,
        userMemoryBlockId,
        userProjects: userProjects.map(p => ({ id: p.id, name: p.name, memoryBlockId: p.memory_block_id }))
      });
      
      for (const blockId of blocksToAttach) {
        console.log('Attaching memory block:', blockId);
        try {
          await lettaClient.agents.blocks.attach(userAgent.lettaAgentId, blockId);
          console.log('Successfully attached block:', blockId);
        } catch (attachError) {
          console.error('Failed to attach block:', blockId, attachError);
        }
      }
      
      for (const blockId of blocksToDetach) {
        console.log('Detaching memory block:', blockId);
        try {
          await lettaClient.agents.blocks.detach(userAgent.lettaAgentId, blockId);
          console.log('Successfully detached block:', blockId);
        } catch (detachError) {
          console.error('Failed to detach block:', blockId, detachError);
        }
      }

      res.json({ message: 'Agent memory blocks updated successfully' });
    } catch (error) {
      console.error('Error updating agent memory blocks:', error);
      res.status(500).json({ error: 'Failed to update agent memory blocks' });
    }
  });

  // Get agent's current memory blocks
  router.get('/agent-memory-blocks', requireEmployee, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get user's agent
      const userAgent = await db.getAgentByUserId(req.user.userId);
      if (!userAgent || !userAgent.lettaAgentId) {
        return res.status(404).json({ error: 'User agent not found or not initialized' });
      }

      // Get agent's memory blocks from Letta
      const lettaClient = agentManager.getClient();
      const agent = await lettaClient.agents.retrieve(userAgent.lettaAgentId);
      
      res.json({ 
        memoryBlocks: agent?.memoryBlocks || [],
        message: 'Agent memory blocks retrieved successfully' 
      });
    } catch (error) {
      console.error('Error getting agent memory blocks:', error);
      res.status(500).json({ error: 'Failed to get agent memory blocks' });
    }
  });

  return router;
};

