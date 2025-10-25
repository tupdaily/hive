import { Database } from '../database/connection';
import { AIAgent } from './agent';
export declare class AgentManager {
    private db;
    private agents;
    0: any;
    private client;
    constructor(db: Database);
    createAgent(userId: string, agentData: {
        name: string;
        personality: string;
        workPreferences: string[];
    }): Promise<import("@letta-ai/letta-client/api").AgentState>;
    getAgent(agentId: string): Promise<AIAgent | null>;
    getAgentsByUser(userId: string): Promise<AIAgent[]>;
    getAllAgents(): Promise<AIAgent[]>;
    updateAgent(agentId: string, updates: any): Promise<AIAgent | null>;
    deleteAgent(agentId: string): Promise<void>;
    private generateId;
}
//# sourceMappingURL=agentManager.d.ts.map