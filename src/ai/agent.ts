import { Database } from '../database/connection';
import { Agent } from '../types';
import { LettaClient } from '@letta-ai/letta-client';

export class AIAgent {
  private agent: Agent;
  private client: LettaClient;

  constructor(agent: Agent) {
    this.agent = agent;
    this.client = new LettaClient({
      token: process.env.LETTA_API_KEY || 'mock-key-for-development'
    });
  }

  async query(query: string): Promise<string> {
    try {
      const response = await this.client.agents.messages.create(
        this.agent.id, 
        {
          messages: [
            {
              role: "user",
              content: query
            }
          ]
        }
      );

      const message = response.messages?.[0];
      if (message && 'content' in message) {
        const content = message.content;
        if (typeof content === 'string') {
          return content || 'I apologize, but I could not generate a response at this time.';
        } else if (Array.isArray(content)) {
          // Handle array content by joining text elements
          const textContent = content
            .filter(item => item.type === 'text')
            .map(item => 'text' in item ? item.text : '')
            .join(' ');
          return textContent || 'I apologize, but I could not generate a response at this time.';
        }
      }
      return 'I apologize, but I could not generate a response at this time.';
    } catch (error) {
      console.error('Letta API error:', error);
      return 'I apologize, but I encountered an error while processing your request.';
    }
  }

  getAgent(): Agent {
    return this.agent;
  }
}