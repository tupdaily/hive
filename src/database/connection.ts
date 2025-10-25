import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { User, Agent, Project, ProjectMember, MemoryBlock } from '../types';

export class Database {
  private supabase: SupabaseClient;
  private initialized: boolean = false;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    // Supabase tables will be created via SQL migrations
    // For now, we'll just mark as initialized
    this.initialized = true;
    console.log('Database initialized successfully');
  }

  private async waitForInitialization(): Promise<void> {
    while (!this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // User operations
  async createUser(user: Omit<User, 'createdAt' | 'updatedAt'> & { passwordHash: string }): Promise<void> {
    await this.waitForInitialization();
    const { error } = await this.supabase
      .from('users')
      .insert({
        id: user.id || uuidv4(),
        email: user.email,
        name: user.name,
        password_hash: user.passwordHash,
        role: user.role
      });
    
    if (error) throw error;
  }

  async getUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    await this.waitForInitialization();
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      passwordHash: data.password_hash,
      role: data.role,
      description: data.description,
      memoryBlockId: data.memory_block_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async getUserById(id: string): Promise<User | null> {
    await this.waitForInitialization();
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      description: data.description,
      memoryBlockId: data.memory_block_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async getAllUsers(): Promise<User[]> {
    await this.waitForInitialization();
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      description: user.description,
      memoryBlockId: user.memory_block_id,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at)
    }));
  }

  async updateUserMemoryBlock(userId: string, memoryBlockId: string): Promise<void> {
    await this.waitForInitialization();
    const { error } = await this.supabase
      .from('users')
      .update({ 
        memory_block_id: memoryBlockId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
  }

  async updateUserDescription(userId: string, description: string): Promise<void> {
    await this.waitForInitialization();
    const { error } = await this.supabase
      .from('users')
      .update({ 
        description: description,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
  }

  // Agent operations
  async createAgent(agent: Omit<Agent, 'createdAt' | 'updatedAt'>): Promise<void> {
    await this.waitForInitialization();
    const { error } = await this.supabase
      .from('agents')
      .insert({
        id: agent.id || uuidv4(),
        user_id: agent.userId,
        name: agent.name,
        personality: agent.personality,
        work_preferences: JSON.stringify(agent.workPreferences),
        is_active: agent.isActive
      });
    
    if (error) throw error;
  }

  async getAgentById(id: string): Promise<Agent | null> {
    await this.waitForInitialization();
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      personality: data.personality,
      workPreferences: JSON.parse(data.work_preferences),
      isActive: Boolean(data.is_active),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async getAgentsByUserId(userId: string): Promise<Agent[]> {
    await this.waitForInitialization();
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(agent => ({
      id: agent.id,
      userId: agent.user_id,
      name: agent.name,
      personality: agent.personality,
      workPreferences: JSON.parse(agent.work_preferences),
      isActive: Boolean(agent.is_active),
      createdAt: new Date(agent.created_at),
      updatedAt: new Date(agent.updated_at)
    }));
  }

  async getAllAgents(): Promise<Agent[]> {
    await this.waitForInitialization();
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(agent => ({
      id: agent.id,
      userId: agent.user_id,
      name: agent.name,
      personality: agent.personality,
      workPreferences: JSON.parse(agent.work_preferences),
      isActive: Boolean(agent.is_active),
      createdAt: new Date(agent.created_at),
      updatedAt: new Date(agent.updated_at)
    }));
  }

  async updateAgent(id: string, updates: any): Promise<void> {
    await this.waitForInitialization();
    
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.personality !== undefined) updateData.personality = updates.personality;
    if (updates.workPreferences !== undefined) updateData.work_preferences = JSON.stringify(updates.workPreferences);
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    
    if (Object.keys(updateData).length === 0) return;
    
    updateData.updated_at = new Date().toISOString();
    
    const { error } = await this.supabase
      .from('agents')
      .update(updateData)
      .eq('id', id);
    
    if (error) throw error;
  }

  // Project operations
  async createProject(project: Omit<Project, 'createdAt' | 'updatedAt'>): Promise<void> {
    await this.waitForInitialization();
    const { error } = await this.supabase
      .from('projects')
      .insert({
        id: project.id || uuidv4(),
        name: project.name,
        description: project.description,
        status: project.status
      });
    
    if (error) throw error;
  }

  async getProjectById(id: string): Promise<Project | null> {
    await this.waitForInitialization();
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async getAllProjects(): Promise<Project[]> {
    await this.waitForInitialization();
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at)
    }));
  }

  // Project member operations
  async addProjectMember(member: Omit<ProjectMember, 'joinedAt'>): Promise<void> {
    await this.waitForInitialization();
    const { error } = await this.supabase
      .from('project_members')
      .insert({
        id: member.id || uuidv4(),
        project_id: member.projectId,
        agent_id: member.agentId,
        role: member.role
      });
    
    if (error) throw error;
  }

  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    await this.waitForInitialization();
    const { data, error } = await this.supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId);
    
    if (error) throw error;
    
    return data.map(member => ({
      id: member.id,
      projectId: member.project_id,
      agentId: member.agent_id,
      role: member.role,
      joinedAt: new Date(member.joined_at)
    }));
  }

  async removeProjectMember(projectId: string, agentId: string): Promise<void> {
    await this.waitForInitialization();
    const { error } = await this.supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('agent_id', agentId);
    
    if (error) throw error;
  }

  // Memory block operations
  async createMemoryBlock(memory: Omit<MemoryBlock, 'createdAt' | 'updatedAt'>): Promise<void> {
    await this.waitForInitialization();
    const { error } = await this.supabase
      .from('memory_blocks')
      .insert({
        id: memory.id || uuidv4(),
        type: memory.type,
        agent_id: memory.agentId || null,
        content: memory.content,
        metadata: JSON.stringify(memory.metadata)
      });
    
    if (error) throw error;
  }

  async getSharedMemoryBlocks(): Promise<MemoryBlock[]> {
    await this.waitForInitialization();
    const { data, error } = await this.supabase
      .from('memory_blocks')
      .select('*')
      .eq('type', 'shared')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(block => ({
      id: block.id,
      type: block.type,
      agentId: block.agent_id,
      content: block.content,
      metadata: JSON.parse(block.metadata),
      createdAt: new Date(block.created_at),
      updatedAt: new Date(block.updated_at)
    }));
  }

  async getAgentMemoryBlocks(agentId: string): Promise<MemoryBlock[]> {
    await this.waitForInitialization();
    const { data, error } = await this.supabase
      .from('memory_blocks')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(block => ({
      id: block.id,
      type: block.type,
      agentId: block.agent_id,
      content: block.content,
      metadata: JSON.parse(block.metadata),
      createdAt: new Date(block.created_at),
      updatedAt: new Date(block.updated_at)
    }));
  }

  async getAllMemoryBlocks(): Promise<MemoryBlock[]> {
    await this.waitForInitialization();
    const { data, error } = await this.supabase
      .from('memory_blocks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(block => ({
      id: block.id,
      type: block.type,
      agentId: block.agent_id,
      content: block.content,
      metadata: JSON.parse(block.metadata),
      createdAt: new Date(block.created_at),
      updatedAt: new Date(block.updated_at)
    }));
  }

  close(): void {
    // Supabase client doesn't need explicit closing
    // but we can mark as not initialized
    this.initialized = false;
  }
}