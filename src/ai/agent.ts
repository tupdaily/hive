import { Database } from '../database/connection';
import { Agent, MemoryBlock, QueryRequest, QueryResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';

export class AIAgent {
  private agent: Agent;
  private db: Database;
  private claude: Anthropic;

  constructor(agent: Agent, db: Database) {
    this.agent = agent;
    this.db = db;
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || 'mock-key-for-development'
    });
  }

  async query(request: QueryRequest): Promise<QueryResponse> {
    // Get relevant memory blocks
    const sharedMemory = await this.db.getSharedMemoryBlocks();
    const agentMemory = await this.db.getAgentMemoryBlocks(this.agent.id);
    
    // Combine all relevant memory
    const allMemory = [...sharedMemory, ...agentMemory];
    
    // Create context for the AI
    const context = this.buildContext(allMemory, request);
    
    // Generate response using Letta AI
    const response = await this.generateResponse(request.query, context);
    
    // Store the interaction in memory
    await this.storeInteraction(request.query, response, request.userId);
    
    return {
      response: response,
      sources: this.extractSources(allMemory),
      agentId: this.agent.id,
      timestamp: new Date()
    };
  }

  private buildContext(memoryBlocks: MemoryBlock[], request: QueryRequest): string {
    let context = `Agent: ${this.agent.name}\n`;
    context += `Personality: ${this.agent.personality}\n`;
    context += `Work Preferences: ${this.agent.workPreferences.join(', ')}\n\n`;
    
    context += `Company-wide Information:\n`;
    const sharedBlocks = memoryBlocks.filter(block => block.type === 'shared');
    sharedBlocks.forEach(block => {
      context += `- ${block.content}\n`;
    });
    
    context += `\nPersonal Knowledge:\n`;
    const personalBlocks = memoryBlocks.filter(block => block.type === 'individual');
    personalBlocks.forEach(block => {
      context += `- ${block.content}\n`;
    });
    
    if (request.context?.projectId) {
      context += `\nCurrent Project Context: Project ID ${request.context.projectId}\n`;
    }
    
    return context;
  }

  private async generateResponse(query: string, context: string): Promise<string> {
    try {
      // Use Claude for AI responses
      const message = await this.claude.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 500,
        temperature: 0.7,
        system: `You are an AI assistant for a company team. Based on the following context, answer the user's question helpfully and professionally.

Context:
${context}

Please provide a helpful response based on the available information. If you don't have enough information, say so and suggest what additional information might be helpful.`,
        messages: [
          {
            role: "user",
            content: query
          }
        ]
      });

      return message.content[0]?.type === 'text' ? message.content[0].text : 'I apologize, but I could not generate a response at this time.';
    } catch (error) {
      console.error('Claude API error:', error);
      // Fallback to mock response if Claude fails
      return this.generateMockResponse(query, context);
    }
  }

  private generateMockResponse(query: string, context: string): string {
    // Simple mock responses based on common query patterns
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('project') || lowerQuery.includes('work')) {
      return `Based on the available information, I can see several projects in progress. ${this.agent.name} typically works on ${this.agent.workPreferences.join(' and ')}. Would you like me to provide more specific details about any particular project?`;
    }
    
    if (lowerQuery.includes('team') || lowerQuery.includes('colleague')) {
      return `I can help you find information about team members and their work. The shared knowledge base contains information about various team members and their current projects. What specific information are you looking for about your colleagues?`;
    }
    
    if (lowerQuery.includes('skill') || lowerQuery.includes('expertise')) {
      return `Based on my knowledge, I can see information about various team members' skills and expertise areas. ${this.agent.name} specializes in ${this.agent.workPreferences.join(', ')}. Would you like to know about specific skills or expertise areas?`;
    }
    
    return `I understand you're asking about "${query}". Based on the available information in our shared knowledge base and my personal knowledge, I'd be happy to help. Could you provide more specific details about what you're looking for?`;
  }

  private extractSources(memoryBlocks: MemoryBlock[]): string[] {
    return memoryBlocks.map(block => 
      block.type === 'shared' 
        ? `Shared Knowledge: ${block.content.substring(0, 100)}...`
        : `Personal Knowledge: ${block.content.substring(0, 100)}...`
    );
  }

  private async storeInteraction(query: string, response: string, userId: string): Promise<void> {
    const memoryBlock: Omit<MemoryBlock, 'createdAt' | 'updatedAt'> = {
      id: uuidv4(),
      type: 'individual',
      agentId: this.agent.id,
      content: `Q: ${query}\nA: ${response}`,
      metadata: {
        userId,
        timestamp: new Date().toISOString(),
        type: 'interaction'
      }
    };
    
    await this.db.createMemoryBlock(memoryBlock);
  }

  async addToSharedMemory(content: string, metadata: Record<string, any> = {}): Promise<void> {
    const memoryBlock: Omit<MemoryBlock, 'createdAt' | 'updatedAt'> = {
      id: uuidv4(),
      type: 'shared',
      content,
      metadata: {
        ...metadata,
        addedBy: this.agent.id,
        timestamp: new Date().toISOString()
      }
    };
    
    await this.db.createMemoryBlock(memoryBlock);
  }

  async addToPersonalMemory(content: string, metadata: Record<string, any> = {}): Promise<void> {
    const memoryBlock: Omit<MemoryBlock, 'createdAt' | 'updatedAt'> = {
      id: uuidv4(),
      type: 'individual',
      agentId: this.agent.id,
      content,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    };
    
    await this.db.createMemoryBlock(memoryBlock);
  }

  getAgent(): Agent {
    return this.agent;
  }
}
