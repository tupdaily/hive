import { Database } from '../database/connection';
import { AIAgent } from './agent';
import { Agent, User } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { LettaClient } from '@letta-ai/letta-client';
import { Project } from '../types';

export class AgentManager {
  private db: Database;
  private agents: Map<string, AIAgent> = new Map();0
  private client: LettaClient;

  constructor(db: Database) {
    this.db = db;
    console.log("LETTA_API_KEY being used by AgentManager:", process.env.LETTA_API_KEY);
    this.client = new LettaClient({
      token: process.env.LETTA_API_KEY || 'mock-key-for-development'
    });
  }

  

  async createAgent(userId: string, agentData: {
    name: string;
    personality: string;
    description: string; // What the user wants the agent to do
    projectId?: string; // Optional project ID to link to a shared memory block
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
        value: `User: ${user.name} (${user.email})\nDescription: ${user.description}`,
        description: "Stores key details about the person you are conversing with, allowing for more personalized and friend-like conversation."
      });
      userMemoryBlockId = userMemoryBlock.id;
      
      // Update user with memory block ID
      await this.db.updateUserMemoryBlock(userId, userMemoryBlockId);
    }

    // Handle project memory block if projectId is provided
    let projectMemoryBlockId: string | undefined;
    if (agentData.projectId) {
      const project = await this.db.getProjectById(agentData.projectId);
      if (!project) {
        throw new Error('Project not found');
      }
      projectMemoryBlockId = project.memoryBlockId;
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

    // Prepare memory blocks for Letta agent creation
    const memoryBlocks = [{
      label: "persona", 
      value: `I am an agent that helps with the company's needs with the following personality: ${agentData.personality}. My role is to: ${agentData.description}`,
      description: "Stores details about your current persona, guiding how you behave and respond. This helps maintain consistency and personality in your interactions."
    }];

    const blockIds = [userMemoryBlockId];

    if (projectMemoryBlockId) {
      blockIds.push(projectMemoryBlockId);
    }

    // Create agent in Letta with persona, human, and optionally project memory block
    const agent = await this.client.agents.create({
      model: "openai/gpt-4.1",
      embedding: "openai/text-embedding-3-small",
      memoryBlocks: memoryBlocks,
      blockIds: blockIds // Attach human and optionally project's memory block
    });

    return agent;
  }

  async createProjectWithSharedMemory(projectData: {
    name: string;
    description: string;
    status: 'active' | 'completed' | 'paused';
  }): Promise<Project> {
    // Create a Letta memory block for the project
    const projectMemoryBlock = await this.client.blocks.create({
      label: projectData.name,
      value: `Project Name: ${projectData.name}\nDescription: ${projectData.description}\nStatus: ${projectData.status}`,
      description: "Stores project context and progress. This memory block is shared across all agents working on this project."
    });

    // Create project in database with the new memory block ID
    const projectId = uuidv4();
    const newProject: Project = {
      id: projectId,
      name: projectData.name,
      description: projectData.description,
      status: projectData.status,
      memoryBlockId: projectMemoryBlock.id,
      createdAt: new Date(), // These will be overwritten by DB, but good for typing
      updatedAt: new Date()  // These will be overwritten by DB, but good for typing
    };
    await this.db.createProject(newProject);
    return newProject;
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