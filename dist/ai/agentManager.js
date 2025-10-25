"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentManager = void 0;
const agent_1 = require("./agent");
class AgentManager {
    db;
    agents = new Map();
    constructor(db) {
        this.db = db;
    }
    async initializeAgents() {
        const agents = await this.db.getAllAgents();
        for (const agent of agents) {
            if (agent.isActive) {
                const aiAgent = new agent_1.AIAgent(agent, this.db);
                this.agents.set(agent.id, aiAgent);
            }
        }
    }
    async createAgent(userId, agentData) {
        const agent = {
            id: this.generateId(),
            userId,
            name: agentData.name,
            personality: agentData.personality,
            workPreferences: agentData.workPreferences,
            isActive: true
        };
        await this.db.createAgent(agent);
        const aiAgent = new agent_1.AIAgent(agent, this.db);
        this.agents.set(agent.id, aiAgent);
        return aiAgent;
    }
    async getAgent(agentId) {
        if (this.agents.has(agentId)) {
            return this.agents.get(agentId);
        }
        const agent = await this.db.getAgentById(agentId);
        if (!agent || !agent.isActive) {
            return null;
        }
        const aiAgent = new agent_1.AIAgent(agent, this.db);
        this.agents.set(agentId, aiAgent);
        return aiAgent;
    }
    async getAgentsByUser(userId) {
        const agents = await this.db.getAgentsByUserId(userId);
        const aiAgents = [];
        for (const agent of agents) {
            if (agent.isActive) {
                let aiAgent = this.agents.get(agent.id);
                if (!aiAgent) {
                    aiAgent = new agent_1.AIAgent(agent, this.db);
                    this.agents.set(agent.id, aiAgent);
                }
                aiAgents.push(aiAgent);
            }
        }
        return aiAgents;
    }
    async getAllAgents() {
        const agents = await this.db.getAllAgents();
        const aiAgents = [];
        for (const agent of agents) {
            if (agent.isActive) {
                let aiAgent = this.agents.get(agent.id);
                if (!aiAgent) {
                    aiAgent = new agent_1.AIAgent(agent, this.db);
                    this.agents.set(agent.id, aiAgent);
                }
                aiAgents.push(aiAgent);
            }
        }
        return aiAgents;
    }
    async updateAgent(agentId, updates) {
        await this.db.updateAgent(agentId, updates);
        if (updates.isActive === false) {
            this.agents.delete(agentId);
            return null;
        }
        const agent = await this.db.getAgentById(agentId);
        if (!agent)
            return null;
        const aiAgent = new agent_1.AIAgent(agent, this.db);
        this.agents.set(agentId, aiAgent);
        return aiAgent;
    }
    async deleteAgent(agentId) {
        await this.db.updateAgent(agentId, { isActive: false });
        this.agents.delete(agentId);
    }
    generateId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
}
exports.AgentManager = AgentManager;
//# sourceMappingURL=agentManager.js.map