import { Database } from '../database/connection';
import { Agent } from '../types';
export declare class AIAgent {
    private agent;
    private db;
    private client;
    constructor(agent: Agent, db: Database);
    query(query: string): Promise<string>;
    getAgent(): Agent;
}
//# sourceMappingURL=agent.d.ts.map