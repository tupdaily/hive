"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthService {
    db;
    jwtSecret;
    constructor(db, jwtSecret) {
        this.db = db;
        this.jwtSecret = jwtSecret;
    }
    async register(email, password, name, role = 'employee') {
        const existingUser = await this.db.getUserByEmail(email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const user = {
            id: this.generateId(),
            email,
            name,
            role
        };
        await this.db.createUser({ ...user, passwordHash });
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
    async login(email, password) {
        const user = await this.db.getUserByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
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
    async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret);
            return decoded;
        }
        catch (error) {
            return null;
        }
    }
    async getUserById(userId) {
        return await this.db.getUserById(userId);
    }
    generateToken(userId, role) {
        return jsonwebtoken_1.default.sign({ userId, role }, this.jwtSecret, { expiresIn: '7d' });
    }
    generateId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.js.map