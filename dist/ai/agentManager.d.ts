import { Database } from '../database/connection';
import { AIAgent } from './agent';
export declare class AgentManager {
    private db;
    private agents;
    constructor(db: Database);
    initializeAgents(): Promise<void>;
    createAgent(userId: string, agentData: {
        name: string;
        personality: string;
        workPreferences: string[];
    }): Promise<AIAgent>;
    getAgent(agentId: string): Promise<AIAgent | null>;
    getAgentsByUser(userId: string): Promise<AIAgent[]>;
    getAllAgents(): Promise<AIAgent[]>;
    updateAgent(agentId: string, updates: any): Promise<AIAgent | null>;
    deleteAgent(agentId: string): Promise<void>;
    private generateId;
}
//# sourceMappingURL=agentManager.d.ts.map