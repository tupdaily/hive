import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { join } from 'path';
import { User, Agent, Project, ProjectMember, MemoryBlock } from '../types';

export class Database {
  private db: sqlite3.Database;
  private initialized: boolean = false;

  constructor(databasePath: string) {
    this.db = new sqlite3.Database(databasePath);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    // Create tables directly
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'employee')) NOT NULL DEFAULT 'employee',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    const createAgentsTable = `
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        personality TEXT NOT NULL,
        work_preferences TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    
    const createProjectsTable = `
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT CHECK(status IN ('active', 'completed', 'paused')) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    const createProjectMembersTable = `
      CREATE TABLE IF NOT EXISTS project_members (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        role TEXT CHECK(role IN ('lead', 'member')) DEFAULT 'member',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
        UNIQUE(project_id, agent_id)
      )
    `;
    
    const createMemoryBlocksTable = `
      CREATE TABLE IF NOT EXISTS memory_blocks (
        id TEXT PRIMARY KEY,
        type TEXT CHECK(type IN ('shared', 'individual')) NOT NULL,
        agent_id TEXT,
        content TEXT NOT NULL,
        metadata TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      )
    `;
    
    const tables = [createUsersTable, createAgentsTable, createProjectsTable, createProjectMembersTable, createMemoryBlocksTable];
    let completed = 0;
    
    tables.forEach((table, index) => {
      this.db.run(table, (err) => {
        if (err) {
          console.error(`Error creating table ${index + 1}:`, err);
        }
        completed++;
        if (completed === tables.length) {
          this.initialized = true;
          console.log('Database initialized successfully');
        }
      });
    });
  }

  private async waitForInitialization(): Promise<void> {
    while (!this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise(async (resolve, reject) => {
      await this.waitForInitialization();
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  private get(sql: string, params: any[] = []): Promise<any> {
    return new Promise(async (resolve, reject) => {
      await this.waitForInitialization();
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  private all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      await this.waitForInitialization();
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // User operations
  async createUser(user: Omit<User, 'createdAt' | 'updatedAt'> & { passwordHash: string }): Promise<void> {
    await this.run(
      'INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.email, user.name, user.passwordHash, user.role]
    );
  }

  async getUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    const user = await this.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.password_hash,
      role: user.role,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at)
    };
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await this.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at)
    };
  }

  async getAllUsers(): Promise<User[]> {
    const users = await this.all('SELECT * FROM users ORDER BY created_at DESC');
    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at)
    }));
  }

  // Agent operations
  async createAgent(agent: Omit<Agent, 'createdAt' | 'updatedAt'>): Promise<void> {
    await this.run(
      'INSERT INTO agents (id, user_id, name, personality, work_preferences, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [agent.id, agent.userId, agent.name, agent.personality, JSON.stringify(agent.workPreferences), agent.isActive]
    );
  }

  async getAgentById(id: string): Promise<Agent | null> {
    const agent = await this.get('SELECT * FROM agents WHERE id = ?', [id]);
    if (!agent) return null;
    
    return {
      id: agent.id,
      userId: agent.user_id,
      name: agent.name,
      personality: agent.personality,
      workPreferences: JSON.parse(agent.work_preferences),
      isActive: Boolean(agent.is_active),
      createdAt: new Date(agent.created_at),
      updatedAt: new Date(agent.updated_at)
    };
  }

  async getAgentsByUserId(userId: string): Promise<Agent[]> {
    const agents = await this.all('SELECT * FROM agents WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return agents.map(agent => ({
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
    const agents = await this.all('SELECT * FROM agents ORDER BY created_at DESC');
    return agents.map(agent => ({
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
    const fields = [];
    const values = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.personality !== undefined) {
      fields.push('personality = ?');
      values.push(updates.personality);
    }
    if (updates.workPreferences !== undefined) {
      fields.push('work_preferences = ?');
      values.push(JSON.stringify(updates.workPreferences));
    }
    if (updates.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.isActive);
    }
    
    if (fields.length === 0) return;
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await this.run(`UPDATE agents SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  // Project operations
  async createProject(project: Omit<Project, 'createdAt' | 'updatedAt'>): Promise<void> {
    await this.run(
      'INSERT INTO projects (id, name, description, status) VALUES (?, ?, ?, ?)',
      [project.id, project.name, project.description, project.status]
    );
  }

  async getProjectById(id: string): Promise<Project | null> {
    const project = await this.get('SELECT * FROM projects WHERE id = ?', [id]);
    if (!project) return null;
    
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at)
    };
  }

  async getAllProjects(): Promise<Project[]> {
    const projects = await this.all('SELECT * FROM projects ORDER BY created_at DESC');
    return projects.map(project => ({
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
    await this.run(
      'INSERT INTO project_members (id, project_id, agent_id, role) VALUES (?, ?, ?, ?)',
      [member.id, member.projectId, member.agentId, member.role]
    );
  }

  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const members = await this.all('SELECT * FROM project_members WHERE project_id = ?', [projectId]);
    return members.map(member => ({
      id: member.id,
      projectId: member.project_id,
      agentId: member.agent_id,
      role: member.role,
      joinedAt: new Date(member.joined_at)
    }));
  }

  async removeProjectMember(projectId: string, agentId: string): Promise<void> {
    await this.run('DELETE FROM project_members WHERE project_id = ? AND agent_id = ?', [projectId, agentId]);
  }

  // Memory block operations
  async createMemoryBlock(memory: Omit<MemoryBlock, 'createdAt' | 'updatedAt'>): Promise<void> {
    await this.run(
      'INSERT INTO memory_blocks (id, type, agent_id, content, metadata) VALUES (?, ?, ?, ?, ?)',
      [memory.id, memory.type, memory.agentId || null, memory.content, JSON.stringify(memory.metadata)]
    );
  }

  async getSharedMemoryBlocks(): Promise<MemoryBlock[]> {
    const blocks = await this.all('SELECT * FROM memory_blocks WHERE type = "shared" ORDER BY created_at DESC');
    return blocks.map(block => ({
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
    const blocks = await this.all('SELECT * FROM memory_blocks WHERE agent_id = ? ORDER BY created_at DESC', [agentId]);
    return blocks.map(block => ({
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
    const blocks = await this.all('SELECT * FROM memory_blocks ORDER BY created_at DESC');
    return blocks.map(block => ({
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
    this.db.close();
  }
}