import { Database } from '../database/connection';
import { Agent, QueryRequest, QueryResponse } from '../types';
export declare class AIAgent {
    private agent;
    private db;
    private openai;
    constructor(agent: Agent, db: Database);
    query(request: QueryRequest): Promise<QueryResponse>;
    private buildContext;
    private generateResponse;
    private generateMockResponse;
    private extractSources;
    private storeInteraction;
    addToSharedMemory(content: string, metadata?: Record<string, any>): Promise<void>;
    addToPersonalMemory(content: string, metadata?: Record<string, any>): Promise<void>;
    getAgent(): Agent;
}
//# sourceMappingURL=agent.d.ts.map