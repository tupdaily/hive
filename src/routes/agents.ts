import { Router, Response } from 'express';
import { AgentManager } from '../ai/agentManager';
import { AuthenticatedRequest, authenticateToken, requireEmployee } from '../middleware/auth';
import { z } from 'zod';

const createAgentSchema = z.object({
  name: z.string().min(1),
  personality: z.string().min(1),
  workPreferences: z.array(z.string()).min(1)
});

const updateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  personality: z.string().min(1).optional(),
  workPreferences: z.array(z.string()).min(1).optional(),
  isActive: z.boolean().optional()
});

const querySchema = z.object({
  query: z.string().min(1),
  context: z.object({
    projectId: z.string().optional(),
    agentId: z.string().optional()
  }).optional()
});

export const createAgentRoutes = (agentManager: AgentManager, authService: any) => {
  const router = Router();

  // Apply authentication to all routes
  router.use(authenticateToken(authService));
  router.use(requireEmployee);

  // Create a new agent
  router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, personality, workPreferences } = createAgentSchema.parse(req.body);
      
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const agent = await agentManager.createAgent(req.user.userId, {
        name,
        personality,
        workPreferences
      });

      res.status(201).json({
        message: 'Agent created successfully',
        agent: agent
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create agent' });
    }
  });

  // Get user's agents
  router.get('/my-agents', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const agents = await agentManager.getAgentsByUser(req.user.userId);
      
      res.json({
        agents: agents.map(agent => agent.getAgent())
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch agents' });
    }
  });

  // Get all agents (admin only)
  router.get('/all', async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const agents = await agentManager.getAllAgents();
      
      res.json({
        agents: agents.map(agent => agent.getAgent())
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch agents' });
    }
  });

  // Get specific agent
  router.get('/:agentId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { agentId } = req.params;
      
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const agent = await agentManager.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Check if user owns the agent or is admin
      const agentData = agent.getAgent();
      if (agentData.userId !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        agent: agentData
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch agent' });
    }
  });

  // Update agent
  router.put('/:agentId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { agentId } = req.params;
      const updates = updateAgentSchema.parse(req.body);
      
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Check if user owns the agent or is admin
      const existingAgent = await agentManager.getAgent(agentId);
      if (!existingAgent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const agentData = existingAgent.getAgent();
      if (agentData.userId !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedAgent = await agentManager.updateAgent(agentId, updates);
      if (!updatedAgent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      res.json({
        message: 'Agent updated successfully',
        agent: updatedAgent.getAgent()
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update agent' });
    }
  });

  // Delete agent
  router.delete('/:agentId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { agentId } = req.params;
      
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Check if user owns the agent or is admin
      const existingAgent = await agentManager.getAgent(agentId);
      if (!existingAgent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const agentData = existingAgent.getAgent();
      if (agentData.userId !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      await agentManager.deleteAgent(agentId);

      res.json({
        message: 'Agent deleted successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete agent' });
    }
  });

  // Query agent
  router.post('/:agentId/query', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { agentId } = req.params;
      const { query, context } = querySchema.parse(req.body);
      
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const agent = await agentManager.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Check if user owns the agent or is admin
      const agentData = agent.getAgent();
      if (agentData.userId !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const response = await agent.query({
        userId: req.user.userId,
        query,
        context
      });

      res.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      
      res.status(500).json({ error: error instanceof Error ? error.message : 'Query failed' });
    }
  });

  return router;
};
