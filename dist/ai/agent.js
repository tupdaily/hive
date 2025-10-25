"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAgent = void 0;
const letta_client_1 = require("@letta-ai/letta-client");
class AIAgent {
    agent;
    db;
    client;
    constructor(agent, db) {
        this.agent = agent;
        this.db = db;
        this.client = new letta_client_1.LettaClient({
            token: process.env.LETTA_API_KEY || 'mock-key-for-development'
        });
    }
    async query(query) {
        try {
            const response = await this.client.agents.messages.create(this.agent.id, {
                messages: [
                    {
                        role: "user",
                        content: query
                    }
                ]
            });
            const message = response.messages?.[0];
            if (message && 'content' in message) {
                const content = message.content;
                if (typeof content === 'string') {
                    return content || 'I apologize, but I could not generate a response at this time.';
                }
                else if (Array.isArray(content)) {
                    const textContent = content
                        .filter(item => item.type === 'text')
                        .map(item => 'text' in item ? item.text : '')
                        .join(' ');
                    return textContent || 'I apologize, but I could not generate a response at this time.';
                }
            }
            return 'I apologize, but I could not generate a response at this time.';
        }
        catch (error) {
            console.error('Letta API error:', error);
            return 'I apologize, but I encountered an error while processing your request.';
        }
    }
    getAgent() {
        return this.agent;
    }
}
exports.AIAgent = AIAgent;
//# sourceMappingURL=agent.js.map