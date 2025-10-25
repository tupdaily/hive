"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const createAgentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    personality: zod_1.z.string().min(1),
    workPreferences: zod_1.z.array(zod_1.z.string()).min(1)
});
const updateAgentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    personality: zod_1.z.string().min(1).optional(),
    workPreferences: zod_1.z.array(zod_1.z.string()).min(1).optional(),
    isActive: zod_1.z.boolean().optional()
});
const querySchema = zod_1.z.object({
    query: zod_1.z.string().min(1),
    context: zod_1.z.object({
        projectId: zod_1.z.string().optional(),
        agentId: zod_1.z.string().optional()
    }).optional()
});
const createAgentRoutes = (agentManager, authService) => {
    const router = (0, express_1.Router)();
    router.use((0, auth_1.authenticateToken)(authService));
    router.use(auth_1.requireEmployee);
    router.post('/', async (req, res) => {
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
                agent: agent.getAgent()
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create agent' });
        }
    });
    router.get('/my-agents', async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const agents = await agentManager.getAgentsByUser(req.user.userId);
            res.json({
                agents: agents.map(agent => agent.getAgent())
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch agents' });
        }
    });
    router.get('/all', async (req, res) => {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
            }
            const agents = await agentManager.getAllAgents();
            res.json({
                agents: agents.map(agent => agent.getAgent())
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch agents' });
        }
    });
    router.get('/:agentId', async (req, res) => {
        try {
            const { agentId } = req.params;
            if (!req.user) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const agent = await agentManager.getAgent(agentId);
            if (!agent) {
                return res.status(404).json({ error: 'Agent not found' });
            }
            const agentData = agent.getAgent();
            if (agentData.userId !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }
            res.json({
                agent: agentData
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch agent' });
        }
    });
    router.put('/:agentId', async (req, res) => {
        try {
            const { agentId } = req.params;
            const updates = updateAgentSchema.parse(req.body);
            if (!req.user) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
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
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update agent' });
        }
    });
    router.delete('/:agentId', async (req, res) => {
        try {
            const { agentId } = req.params;
            if (!req.user) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
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
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to delete agent' });
        }
    });
    router.post('/:agentId/query', async (req, res) => {
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
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(500).json({ error: error instanceof Error ? error.message : 'Query failed' });
        }
    });
    return router;
};
exports.createAgentRoutes = createAgentRoutes;
//# sourceMappingURL=agents.js.map