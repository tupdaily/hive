"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentManager = void 0;
const agent_1 = require("./agent");
const uuid_1 = require("uuid");
const letta_client_1 = require("@letta-ai/letta-client");
class AgentManager {
    db;
    agents = new Map();
    0;
    client;
    constructor(db) {
        this.db = db;
        this.client = new letta_client_1.LettaClient({
            token: process.env.LETTA_API_KEY || 'mock-key-for-development'
        });
    }
    async createAgent(userId, agentData) {
        const agentId = (0, uuid_1.v4)();
        await this.db.createAgent({
            id: agentId,
            userId,
            name: agentData.name,
            personality: agentData.personality,
            workPreferences: agentData.workPreferences,
            isActive: true
        });
        const agent = await this.client.agents.create({
            model: "anthropic/claude-3-5-sonnet-20241022",
            embedding: "openai/text-embedding-3-small",
            memoryBlocks: [{
                    label: "persona",
                    value: "I am an agent that helps with the company's needs with the following personality: " + agentData.personality
                },
                {
                    label: "work_preferences",
                    value: agentData.workPreferences.join(", ")
                }]
        });
        return agent;
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