import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../database/connection';
import { User } from '../types';

export class AuthService {
  private db: Database;
  private jwtSecret: string;

  constructor(db: Database, jwtSecret: string) {
    this.db = db;
    this.jwtSecret = jwtSecret;
  }

  async register(email: string, password: string, name: string, role: 'admin' | 'employee' = 'employee'): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = await this.db.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Create user
    const user: Omit<User, 'createdAt' | 'updatedAt'> = {
      id: this.generateId(),
      email,
      name,
      role
    };

    await this.db.createUser({ ...user, passwordHash });
    
    // Generate JWT token
    const token = this.generateToken(user.id, user.role);
    
    return {
      user: {
        ...user,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      token
    };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = await this.db.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.role);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      token
    };
  }

  async verifyToken(token: string): Promise<{ userId: string; role: string } | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string; role: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    return await this.db.getUserById(userId);
  }

  private generateToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  private generateId(): string {
    return uuidv4();
  }
}
