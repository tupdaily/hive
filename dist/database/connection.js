"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const fs_1 = require("fs");
const path_1 = require("path");
class Database {
    db;
    constructor(databasePath) {
        this.db = new sqlite3_1.default.Database(databasePath);
        this.initializeDatabase();
    }
    async initializeDatabase() {
        const schema = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, 'schema.sql'), 'utf-8');
        await this.run(schema);
    }
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err)
                    reject(err);
                else
                    resolve(this);
            });
        });
    }
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
    }
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    }
    async createUser(user) {
        await this.run('INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)', [user.id, user.email, user.name, user.passwordHash, user.role]);
    }
    async getUserByEmail(email) {
        const user = await this.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user)
            return null;
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            passwordHash: user.password_hash,
            role: user.role,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at)
        };
    }
    async getUserById(id) {
        const user = await this.get('SELECT * FROM users WHERE id = ?', [id]);
        if (!user)
            return null;
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at)
        };
    }
    async getAllUsers() {
        const users = await this.all('SELECT * FROM users ORDER BY created_at DESC');
        return users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at)
        }));
    }
    async createAgent(agent) {
        await this.run('INSERT INTO agents (id, user_id, name, personality, work_preferences, is_active) VALUES (?, ?, ?, ?, ?, ?)', [agent.id, agent.userId, agent.name, agent.personality, JSON.stringify(agent.workPreferences), agent.isActive]);
    }
    async getAgentById(id) {
        const agent = await this.get('SELECT * FROM agents WHERE id = ?', [id]);
        if (!agent)
            return null;
        return {
            id: agent.id,
            userId: agent.user_id,
            name: agent.name,
            personality: agent.personality,
            workPreferences: JSON.parse(agent.work_preferences),
            isActive: Boolean(agent.is_active),
            createdAt: new Date(agent.created_at),
            updatedAt: new Date(agent.updated_at)
        };
    }
    async getAgentsByUserId(userId) {
        const agents = await this.all('SELECT * FROM agents WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        return agents.map(agent => ({
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
        const agents = await this.all('SELECT * FROM agents ORDER BY created_at DESC');
        return agents.map(agent => ({
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
        const fields = [];
        const values = [];
        if (updates.name !== undefined) {
            fields.push('name = ?');
            values.push(updates.name);
        }
        if (updates.personality !== undefined) {
            fields.push('personality = ?');
            values.push(updates.personality);
        }
        if (updates.workPreferences !== undefined) {
            fields.push('work_preferences = ?');
            values.push(JSON.stringify(updates.workPreferences));
        }
        if (updates.isActive !== undefined) {
            fields.push('is_active = ?');
            values.push(updates.isActive);
        }
        if (fields.length === 0)
            return;
        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        await this.run(`UPDATE agents SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    async createProject(project) {
        await this.run('INSERT INTO projects (id, name, description, status) VALUES (?, ?, ?, ?)', [project.id, project.name, project.description, project.status]);
    }
    async getProjectById(id) {
        const project = await this.get('SELECT * FROM projects WHERE id = ?', [id]);
        if (!project)
            return null;
        return {
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            createdAt: new Date(project.created_at),
            updatedAt: new Date(project.updated_at)
        };
    }
    async getAllProjects() {
        const projects = await this.all('SELECT * FROM projects ORDER BY created_at DESC');
        return projects.map(project => ({
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            createdAt: new Date(project.created_at),
            updatedAt: new Date(project.updated_at)
        }));
    }
    async addProjectMember(member) {
        await this.run('INSERT INTO project_members (id, project_id, agent_id, role) VALUES (?, ?, ?, ?)', [member.id, member.projectId, member.agentId, member.role]);
    }
    async getProjectMembers(projectId) {
        const members = await this.all('SELECT * FROM project_members WHERE project_id = ?', [projectId]);
        return members.map(member => ({
            id: member.id,
            projectId: member.project_id,
            agentId: member.agent_id,
            role: member.role,
            joinedAt: new Date(member.joined_at)
        }));
    }
    async removeProjectMember(projectId, agentId) {
        await this.run('DELETE FROM project_members WHERE project_id = ? AND agent_id = ?', [projectId, agentId]);
    }
    async createMemoryBlock(memory) {
        await this.run('INSERT INTO memory_blocks (id, type, agent_id, content, metadata) VALUES (?, ?, ?, ?, ?)', [memory.id, memory.type, memory.agentId || null, memory.content, JSON.stringify(memory.metadata)]);
    }
    async getSharedMemoryBlocks() {
        const blocks = await this.all('SELECT * FROM memory_blocks WHERE type = "shared" ORDER BY created_at DESC');
        return blocks.map(block => ({
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
        const blocks = await this.all('SELECT * FROM memory_blocks WHERE agent_id = ? ORDER BY created_at DESC', [agentId]);
        return blocks.map(block => ({
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
        const blocks = await this.all('SELECT * FROM memory_blocks ORDER BY created_at DESC');
        return blocks.map(block => ({
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
        this.db.close();
    }
}
exports.Database = Database;
//# sourceMappingURL=connection.js.map