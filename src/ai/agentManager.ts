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

  getClient(): LettaClient {
    return this.client;
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

    // MCP tools temporarily disabled - will add Gmail integration later
    let mcpTools: any[] = [];

    // Create user memory block if it doesn't exist
    if (!userMemoryBlockId) {
      const userMemoryBlock = await this.client.blocks.create({
        label: "human",
        value: `User: ${user.name} (${user.email})\nDescription: ${user.description}`,
        limit: 4000,
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
      limit: 4000,
      description: "Stores details about your current persona, guiding how you behave and respond. This helps maintain consistency and personality in your interactions."
    }, {
      label: "archival_policies",
      value: `
When to insert into archival:
- User preferences and important facts about the user
- Technical specifications and reference information
- Significant decisions or outcomes from conversations
- Significant progress is made towards one or more tasks in one of the projects the user is a member of
- Significant events like meetings are arranged
- To summarize user contributions each day

When NOT to insert:
- Temporary conversational context
- Information already stored
- Trivial details or pleasantries

Search strategies:
- Use natural language questions for best results
- Include tags when filtering by category
- Try semantic variations if first search doesn't find what you need

Tagging:
- Use tags to categorize information for easier retrieval
- Tags should be specific and descriptive
- Tags should be added to the information when it is inserted into archival memory
- When users make significant progress on a task in a project, add the project name and user's name as tags to the information
      `,
      limit: 4000,
      description: "Defines policies for when and how to store information in archival memory, ensuring important information is preserved while avoiding clutter."
    }, {
      label: "archival_tracking",
      value: `
Query patterns: 
Recent searches: 
Success rate: 
Frequently searched topics: []
Common patterns: 
Improvements needed: 
      `,
      limit: 4000,
      description: "Tracks archival memory usage patterns, search success rates, and identifies areas for improvement in memory management."
    }];

    const blockIds = [userMemoryBlockId];

    if (projectMemoryBlockId) {
      blockIds.push(projectMemoryBlockId);
    }

    // Create agent in Letta with persona memory block
    try {
      const createPayload: any = {
        name: agentData.name,
        model: "openai/gpt-4.1",
        embedding: "openai/text-embedding-3-small",
        memoryBlocks: memoryBlocks
      };

      const lettaAgent = await this.client.agents.create(createPayload);

      // Update database agent with Letta agent ID
      await this.db.updateAgent(agentId, {
        lettaAgentId: lettaAgent.id
      });

      // Attach memory blocks to the agent
      console.log('Attaching memory blocks to agent:', lettaAgent.id, 'blocks:', blockIds);
      for (const blockId of blockIds) {
        await this.client.agents.blocks.attach(lettaAgent.id, blockId);
        console.log('Attached block:', blockId);
      }

      // Return the database agent, not the Letta agent
      const updatedAgent = await this.db.getAgentById(agentId);
      return updatedAgent;
    } catch (error) {
      console.error('Error creating Letta agent:', error);
      // If Letta agent creation fails, we still have the database agent
      // Return the database agent
      const databaseAgent = await this.db.getAgentById(agentId);
      return databaseAgent;
    }
  }

  async createProjectWithSharedMemory(projectData: {
    name: string;
    description: string;
    status: 'active' | 'completed' | 'paused';
  }): Promise<Project> {
    // Create a Letta memory block for the project
    const projectMemoryBlock = await this.client.blocks.create({
      label: projectData.name + " Shared Overview",
      value: `
      Project Name: ${projectData.name}\n
      Description: ${projectData.description}\n
      Status: ${projectData.status}
      `,
      description: "High-level project state visible to all team agents. Tracks overall goals, key milestones, progress, insights, and dependencies."
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

    const aiAgent = new AIAgent(agent);
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
          aiAgent = new AIAgent(agent);
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
          aiAgent = new AIAgent(agent);
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

    const aiAgent = new AIAgent(agent);
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