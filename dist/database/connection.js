"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const uuid_1 = require("uuid");
class Database {
    supabase;
    initialized = false;
    constructor(supabaseUrl, supabaseKey) {
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
        this.initializeDatabase();
    }
    async initializeDatabase() {
        this.initialized = true;
        console.log('Database initialized successfully');
    }
    async waitForInitialization() {
        while (!this.initialized) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    async createUser(user) {
        await this.waitForInitialization();
        const { error } = await this.supabase
            .from('users')
            .insert({
            id: user.id || (0, uuid_1.v4)(),
            email: user.email,
            name: user.name,
            password_hash: user.passwordHash,
            role: user.role
        });
        if (error)
            throw error;
    }
    async getUserByEmail(email) {
        await this.waitForInitialization();
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (error || !data)
            return null;
        return {
            id: data.id,
            email: data.email,
            name: data.name,
            passwordHash: data.password_hash,
            role: data.role,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
        };
    }
    async getUserById(id) {
        await this.waitForInitialization();
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data)
            return null;
        return {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
        };
    }
    async getAllUsers() {
        await this.waitForInitialization();
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at)
        }));
    }
    async createAgent(agent) {
        await this.waitForInitialization();
        const { error } = await this.supabase
            .from('agents')
            .insert({
            id: agent.id || (0, uuid_1.v4)(),
            user_id: agent.userId,
            name: agent.name,
            personality: agent.personality,
            work_preferences: JSON.stringify(agent.workPreferences),
            is_active: agent.isActive
        });
        if (error)
            throw error;
    }
    async getAgentById(id) {
        await this.waitForInitialization();
        const { data, error } = await this.supabase
            .from('agents')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data)
            return null;
        return {
            id: data.id,
            userId: data.user_id,
            name: data.name,
            personality: data.personality,
            workPreferences: JSON.parse(data.work_preferences),
            isActive: Boolean(data.is_active),
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
        };
    }
    async getAgentsByUserId(userId) {
        await this.waitForInitialization();
        const { data, error } = await this.supabase
            .from('agents')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data.map(agent => ({
            id: agent.id,
            userId: agent.user_id,
            name: agent.name,
            personality: agent.personality,
            workPreferences: JSON.parse(agent.work_preferences),
            isActive: Boolean(agent.is_active),
            createdAt: new Date(agent.created_at),
            updatedAt: new Date(agent.updated_at)
        }));
    }
    async getAllAgents() {
        await this.waitForInitialization();
        const { data, error } = await this.supabase
            .from('agents')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data.map(agent => ({
            id: agent.id,
            userId: agent.user_id,
            name: agent.name,
            personality: agent.personality,
            workPreferences: JSON.parse(agent.work_preferences),
            isActive: Boolean(agent.is_active),
            createdAt: new Date(agent.created_at),
            updatedAt: new Date(agent.updated_at)
        }));
    }
    async updateAgent(id, updates) {
        await this.waitForInitialization();
        const updateData = {};
        if (updates.name !== undefined)
            updateData.name = updates.name;
        if (updates.personality !== undefined)
            updateData.personality = updates.personality;
        if (updates.workPreferences !== undefined)
            updateData.work_preferences = JSON.stringify(updates.workPreferences);
        if (updates.isActive !== undefined)
            updateData.is_active = updates.isActive;
        if (Object.keys(updateData).length === 0)
            return;
        updateData.updated_at = new Date().toISOString();
        const { error } = await this.supabase
            .from('agents')
            .update(updateData)
            .eq('id', id);
        if (error)
            throw error;
    }
    async createProject(project) {
        await this.waitForInitialization();
        const { error } = await this.supabase
            .from('projects')
            .insert({
            id: project.id || (0, uuid_1.v4)(),
            name: project.name,
            description: project.description,
            status: project.status
        });
        if (error)
            throw error;
    }
    async getProjectById(id) {
        await this.waitForInitialization();
        const { data, error } = await this.supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data)
            return null;
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            status: data.status,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
        };
    }
    async getAllProjects() {
        await this.waitForInitialization();
        const { data, error } = await this.supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data.map(project => ({
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            createdAt: new Date(project.created_at),
            updatedAt: new Date(project.updated_at)
        }));
    }
    async addProjectMember(member) {
        await this.waitForInitialization();
        const { error } = await this.supabase
            .from('project_members')
            .insert({
            id: member.id || (0, uuid_1.v4)(),
            project_id: member.projectId,
            agent_id: member.agentId,
            role: member.role
        });
        if (error)
            throw error;
    }
    async getProjectMembers(projectId) {
        await this.waitForInitialization();
        const { data, error } = await this.supabase
            .from('project_members')
            .select('*')
            .eq('project_id', projectId);
        if (error)
            throw error;
        return data.map(member => ({
            id: member.id,
            projectId: member.project_id,
            agentId: member.agent_id,
            role: member.role,
            joinedAt: new Date(member.joined_at)
        }));
    }
    async removeProjectMember(projectId, agentId) {
        await this.waitForInitialization();
        const { error } = await this.supabase
            .from('project_members')
            .delete()
            .eq('project_id', projectId)
            .eq('agent_id', agentId);
        if (error)
            throw error;
    }
    async createMemoryBlock(memory) {
        await this.waitForInitialization();
        const { error } = await this.supabase
            .from('memory_blocks')
            .insert({
            id: memory.id || (0, uuid_1.v4)(),
            type: memory.type,
            agent_id: memory.agentId || null,
            content: memory.content,
            metadata: JSON.stringify(memory.metadata)
        });
        if (error)
            throw error;
    }
    async getSharedMemoryBlocks() {
        await this.waitForInitialization();
        const { data, error } = await this.supabase
            .from('memory_blocks')
            .select('*')
            .eq('type', 'shared')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data.map(block => ({
            id: block.id,
            type: block.type,
            agentId: block.agent_id,
            content: block.content,
            metadata: JSON.parse(block.metadata),
            createdAt: new Date(block.created_at),
            updatedAt: new Date(block.updated_at)
        }));
    }
    async getAgentMemoryBlocks(agentId) {
        await this.waitForInitialization();
        const { data, error } = await this.supabase
            .from('memory_blocks')
            .select('*')
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data.map(block => ({
            id: block.id,
            type: block.type,
            agentId: block.agent_id,
            content: block.content,
            metadata: JSON.parse(block.metadata),
            createdAt: new Date(block.created_at),
            updatedAt: new Date(block.updated_at)
        }));
    }
    async getAllMemoryBlocks() {
        await this.waitForInitialization();
        const { data, error } = await this.supabase
            .from('memory_blocks')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data.map(block => ({
            id: block.id,
            type: block.type,
            agentId: block.agent_id,
            content: block.content,
            metadata: JSON.parse(block.metadata),
            createdAt: new Date(block.created_at),
            updatedAt: new Date(block.updated_at)
        }));
    }
    close() {
        this.initialized = false;
    }
}
exports.Database = Database;
//# sourceMappingURL=connection.js.map