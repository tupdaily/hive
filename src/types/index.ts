export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  description?: string;
  memoryBlockId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  personality: string;
  workPreferences: string[];
  lettaAgentId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  memoryBlockId?: string; // Add this line
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  agentId: string;
  role: 'lead' | 'member';
  joinedAt: Date;
}

export interface MemoryBlock {
  id: string;
  type: 'shared' | 'individual';
  agentId?: string; // Only for individual memory blocks
  content: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueryRequest {
  userId: string;
  query: string;
  context?: {
    projectId?: string;
    agentId?: string;
  };
}

export interface QueryResponse {
  response: string;
  sources: string[];
  agentId: string;
  timestamp: Date;
}

export interface AdminStats {
  totalUsers: number;
  totalAgents: number;
  activeProjects: number;
  totalMemoryBlocks: number;
}
