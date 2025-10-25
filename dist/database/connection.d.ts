import { User, Agent, Project, ProjectMember, MemoryBlock } from '../types';
export declare class Database {
    private supabase;
    private initialized;
    constructor(supabaseUrl: string, supabaseKey: string);
    private initializeDatabase;
    private waitForInitialization;
    createUser(user: Omit<User, 'createdAt' | 'updatedAt'> & {
        passwordHash: string;
    }): Promise<void>;
    getUserByEmail(email: string): Promise<(User & {
        passwordHash: string;
    }) | null>;
    getUserById(id: string): Promise<User | null>;
    getAllUsers(): Promise<User[]>;
    updateUserMemoryBlock(userId: string, memoryBlockId: string): Promise<void>;
    updateUserDescription(userId: string, description: string): Promise<void>;
    createAgent(agent: Omit<Agent, 'createdAt' | 'updatedAt'>): Promise<void>;
    getAgentById(id: string): Promise<Agent | null>;
    getAgentsByUserId(userId: string): Promise<Agent[]>;
    getAllAgents(): Promise<Agent[]>;
    updateAgent(id: string, updates: any): Promise<void>;
    createProject(project: Omit<Project, 'createdAt' | 'updatedAt'>): Promise<void>;
    getProjectById(id: string): Promise<Project | null>;
    getAllProjects(): Promise<Project[]>;
    addProjectMember(member: Omit<ProjectMember, 'joinedAt'>): Promise<void>;
    getProjectMembers(projectId: string): Promise<ProjectMember[]>;
    removeProjectMember(projectId: string, agentId: string): Promise<void>;
    createMemoryBlock(memory: Omit<MemoryBlock, 'createdAt' | 'updatedAt'>): Promise<void>;
    getSharedMemoryBlocks(): Promise<MemoryBlock[]>;
    getAgentMemoryBlocks(agentId: string): Promise<MemoryBlock[]>;
    getAllMemoryBlocks(): Promise<MemoryBlock[]>;
    close(): void;
}
//# sourceMappingURL=connection.d.ts.map