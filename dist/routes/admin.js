"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminRoutes = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const createProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['active', 'completed', 'paused']).optional()
});
const addProjectMemberSchema = zod_1.z.object({
    agentId: zod_1.z.string(),
    role: zod_1.z.enum(['lead', 'member']).optional()
});
const createMemoryBlockSchema = zod_1.z.object({
    content: zod_1.z.string().min(1),
    type: zod_1.z.enum(['shared', 'individual']),
    agentId: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
const createAdminRoutes = (db, agentManager, authService) => {
    const router = (0, express_1.Router)();
    router.use((0, auth_1.authenticateToken)(authService));
    router.use(auth_1.requireAdmin);
    router.get('/stats', async (req, res) => {
        try {
            const [users, agents, projects, memoryBlocks] = await Promise.all([
                db.getAllUsers(),
                db.getAllAgents(),
                db.getAllProjects(),
                db.getAllMemoryBlocks()
            ]);
            const stats = {
                totalUsers: users.length,
                totalAgents: agents.length,
                activeProjects: projects.filter(p => p.status === 'active').length,
                totalMemoryBlocks: memoryBlocks.length
            };
            res.json(stats);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch stats' });
        }
    });
    router.get('/users', async (req, res) => {
        try {
            const users = await db.getAllUsers();
            res.json({ users });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    });
    router.get('/agents', async (req, res) => {
        try {
            const agents = await agentManager.getAllAgents();
            res.json({
                agents: agents.map(agent => agent.getAgent())
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch agents' });
        }
    });
    router.get('/projects', async (req, res) => {
        try {
            const projects = await db.getAllProjects();
            res.json({ projects });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch projects' });
        }
    });
    router.post('/projects', async (req, res) => {
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
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create project' });
        }
    });
    router.post('/projects/:projectId/members', async (req, res) => {
        try {
            const { projectId } = req.params;
            const { agentId, role } = addProjectMemberSchema.parse(req.body);
            const project = await db.getProjectById(projectId);
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }
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
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to add member to project' });
        }
    });
    router.delete('/projects/:projectId/members/:agentId', async (req, res) => {
        try {
            const { projectId, agentId } = req.params;
            await db.removeProjectMember(projectId, agentId);
            res.json({
                message: 'Member removed from project successfully'
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to remove member from project' });
        }
    });
    router.get('/projects/:projectId/members', async (req, res) => {
        try {
            const { projectId } = req.params;
            const members = await db.getProjectMembers(projectId);
            res.json({ members });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch project members' });
        }
    });
    router.post('/memory-blocks', async (req, res) => {
        try {
            const { content, type, agentId, metadata } = createMemoryBlockSchema.parse(req.body);
            if (type === 'individual' && !agentId) {
                return res.status(400).json({ error: 'Agent ID required for individual memory blocks' });
            }
            if (type === 'individual') {
                const agent = await agentManager.getAgent(agentId);
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
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create memory block' });
        }
    });
    router.get('/memory-blocks', async (req, res) => {
        try {
            const memoryBlocks = await db.getAllMemoryBlocks();
            res.json({ memoryBlocks });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch memory blocks' });
        }
    });
    router.get('/memory-blocks/shared', async (req, res) => {
        try {
            const memoryBlocks = await db.getSharedMemoryBlocks();
            res.json({ memoryBlocks });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch shared memory blocks' });
        }
    });
    return router;
};
exports.createAdminRoutes = createAdminRoutes;
function generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
//# sourceMappingURL=admin.js.map