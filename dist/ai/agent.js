"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAgent = void 0;
const uuid_1 = require("uuid");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
class AIAgent {
    agent;
    db;
    claude;
    constructor(agent, db) {
        this.agent = agent;
        this.db = db;
        this.claude = new sdk_1.default({
            apiKey: process.env.ANTHROPIC_API_KEY || 'mock-key-for-development'
        });
    }
    async query(request) {
        const sharedMemory = await this.db.getSharedMemoryBlocks();
        const agentMemory = await this.db.getAgentMemoryBlocks(this.agent.id);
        const allMemory = [...sharedMemory, ...agentMemory];
        const context = this.buildContext(allMemory, request);
        const response = await this.generateResponse(request.query, context);
        await this.storeInteraction(request.query, response, request.userId);
        return {
            response: response,
            sources: this.extractSources(allMemory),
            agentId: this.agent.id,
            timestamp: new Date()
        };
    }
    buildContext(memoryBlocks, request) {
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
    async generateResponse(query, context) {
        try {
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
        }
        catch (error) {
            console.error('Claude API error:', error);
            return this.generateMockResponse(query, context);
        }
    }
    generateMockResponse(query, context) {
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
    extractSources(memoryBlocks) {
        return memoryBlocks.map(block => block.type === 'shared'
            ? `Shared Knowledge: ${block.content.substring(0, 100)}...`
            : `Personal Knowledge: ${block.content.substring(0, 100)}...`);
    }
    async storeInteraction(query, response, userId) {
        const memoryBlock = {
            id: (0, uuid_1.v4)(),
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
    async addToSharedMemory(content, metadata = {}) {
        const memoryBlock = {
            id: (0, uuid_1.v4)(),
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
    async addToPersonalMemory(content, metadata = {}) {
        const memoryBlock = {
            id: (0, uuid_1.v4)(),
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
    getAgent() {
        return this.agent;
    }
}
exports.AIAgent = AIAgent;
//# sourceMappingURL=agent.js.map