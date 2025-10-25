import { Database } from '../database/connection';
import { AIAgent } from './agent';
import { Agent, User } from '../types';

export class AgentManager {
  private db: Database;
  private agents: Map<string, AIAgent> = new Map();

  constructor(db: Database) {
    this.db = db;
  }

  async initializeAgents(): Promise<void> {
    const agents = await this.db.getAllAgents();
    
    for (const agent of agents) {
      if (agent.isActive) {
        const aiAgent = new AIAgent(agent, this.db);
        this.agents.set(agent.id, aiAgent);
      }
    }
  }

  async createAgent(userId: string, agentData: {
    name: string;
    personality: string;
    workPreferences: string[];
  }): Promise<AIAgent> {
    const agent: Omit<Agent, 'createdAt' | 'updatedAt'> = {
      id: this.generateId(),
      userId,
      name: agentData.name,
      personality: agentData.personality,
      workPreferences: agentData.workPreferences,
      isActive: true
    };

    await this.db.createAgent(agent);
    
    const aiAgent = new AIAgent(agent as Agent, this.db);
    this.agents.set(agent.id, aiAgent);
    
    return aiAgent;
  }

  async getAgent(agentId: string): Promise<AIAgent | null> {
    if (this.agents.has(agentId)) {
      return this.agents.get(agentId)!;
    }

    const agent = await this.db.getAgentById(agentId);
    if (!agent || !agent.isActive) {
      return null;
    }

    const aiAgent = new AIAgent(agent, this.db);
    this.agents.set(agentId, aiAgent);
    return aiAgent;
  }

  async getAgentsByUser(userId: string): Promise<AIAgent[]> {
    const agents = await this.db.getAgentsByUserId(userId);
    const aiAgents: AIAgent[] = [];

    for (const agent of agents) {
      if (agent.isActive) {
        let aiAgent = this.agents.get(agent.id);
        if (!aiAgent) {
          aiAgent = new AIAgent(agent, this.db);
          this.agents.set(agent.id, aiAgent);
        }
        aiAgents.push(aiAgent);
      }
    }

    return aiAgents;
  }

  async getAllAgents(): Promise<AIAgent[]> {
    const agents = await this.db.getAllAgents();
    const aiAgents: AIAgent[] = [];

    for (const agent of agents) {
      if (agent.isActive) {
        let aiAgent = this.agents.get(agent.id);
        if (!aiAgent) {
          aiAgent = new AIAgent(agent, this.db);
          this.agents.set(agent.id, aiAgent);
        }
        aiAgents.push(aiAgent);
      }
    }

    return aiAgents;
  }

  async updateAgent(agentId: string, updates: any): Promise<AIAgent | null> {
    await this.db.updateAgent(agentId, updates);
    
    // Remove from cache if deactivated
    if (updates.isActive === false) {
      this.agents.delete(agentId);
      return null;
    }

    // Update cache
    const agent = await this.db.getAgentById(agentId);
    if (!agent) return null;

    const aiAgent = new AIAgent(agent, this.db);
    this.agents.set(agentId, aiAgent);
    
    return aiAgent;
  }

  async deleteAgent(agentId: string): Promise<void> {
    await this.db.updateAgent(agentId, { isActive: false });
    this.agents.delete(agentId);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}