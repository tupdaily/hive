import { Database } from '../database/connection';
import { AIAgent } from './agent';
import { Agent, User } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { LettaClient } from '@letta-ai/letta-client';
export class AgentManager {
  private db: Database;
  private agents: Map<string, AIAgent> = new Map();0
  private client: LettaClient;

  constructor(db: Database) {
    this.db = db;
    this.client = new LettaClient({
      token: process.env.LETTA_API_KEY || 'mock-key-for-development'
    });
  }

  

  async createAgent(userId: string, agentData: {
    name: string;
    personality: string;
    description: string; // What the user wants the agent to do
  }) {
    // Get user to check if they have a memory block
    const user = await this.db.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let userMemoryBlockId = user.memoryBlockId;

    // Create user memory block if it doesn't exist
    if (!userMemoryBlockId) {
      const userMemoryBlock = await this.client.blocks.create({
        label: user.email || user.id,
        value: `User: ${user.name} (${user.email})\nDescription: ${user.description}`
      });
      userMemoryBlockId = userMemoryBlock.id;
      
      // Update user with memory block ID
      await this.db.updateUserMemoryBlock(userId, userMemoryBlockId);
    } else {
      // For now, we'll create a new memory block and update the user's reference
      // In a production app, you might want to implement block updates
      const newUserMemoryBlock = await this.client.blocks.create({
        label: user.email || user.id,
        value: `User: ${user.name} (${user.email})\nDescription: ${user.description || 'No description provided'}`
      });
      userMemoryBlockId = newUserMemoryBlock.id;
      
      // Update user with new memory block ID
      await this.db.updateUserMemoryBlock(userId, userMemoryBlockId);
    }

    // Create agent in database first
    const agentId = uuidv4();
    await this.db.createAgent({
      id: agentId,
      userId,
      name: agentData.name,
      personality: agentData.personality,
      workPreferences: [], // No longer needed
      isActive: true
    });

    // Create agent in Letta with persona and user memory block
    const agent = await this.client.agents.create({
      model: "anthropic/claude-3-5-sonnet-20241022",
      embedding: "openai/text-embedding-3-small",
      
      memoryBlocks: [{ 
        label: "persona", 
        value: `I am an agent that helps with the company's needs with the following personality: ${agentData.personality}. My role is to: ${agentData.description}`
      }],
      blockIds: [userMemoryBlockId] // Attach user's memory block
    });

    return agent;
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