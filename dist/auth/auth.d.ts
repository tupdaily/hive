import { Database } from '../database/connection';
import { User } from '../types';
export declare class AuthService {
    private db;
    private jwtSecret;
    constructor(db: Database, jwtSecret: string);
    register(email: string, password: string, name: string, role?: 'admin' | 'employee'): Promise<{
        user: User;
        token: string;
    }>;
    login(email: string, password: string): Promise<{
        user: User;
        token: string;
    }>;
    verifyToken(token: string): Promise<{
        userId: string;
        role: string;
    } | null>;
    getUserById(userId: string): Promise<User | null>;
    private generateToken;
    private generateId;
}
//# sourceMappingURL=auth.d.ts.map