"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const connection_1 = require("./database/connection");
const auth_1 = require("./auth/auth");
const agentManager_1 = require("./ai/agentManager");
const auth_2 = require("./routes/auth");
const agents_1 = require("./routes/agents");
const admin_1 = require("./routes/admin");
dotenv_1.default.config();
class App {
    app;
    db;
    authService;
    agentManager;
    constructor() {
        this.app = (0, express_1.default)();
        this.db = new connection_1.Database(process.env.DATABASE_URL || './data/hive.db');
        this.authService = new auth_1.AuthService(this.db, process.env.JWT_SECRET || 'fallback-secret');
        this.agentManager = new agentManager_1.AgentManager(this.db);
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        this.app.use((0, helmet_1.default)());
        this.app.use((0, cors_1.default)({
            origin: process.env.NODE_ENV === 'production' ? false : true,
            credentials: true
        }));
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true }));
        this.app.use(express_1.default.static('src/public'));
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }
    setupRoutes() {
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });
        this.app.use('/api/auth', (0, auth_2.createAuthRoutes)(this.authService));
        this.app.use('/api/agents', (0, agents_1.createAgentRoutes)(this.agentManager, this.authService));
        this.app.use('/api/admin', (0, admin_1.createAdminRoutes)(this.db, this.agentManager, this.authService));
        this.app.get('/', (req, res) => {
            res.sendFile('index.html', { root: 'src/public' });
        });
        this.app.use('*', (req, res) => {
            res.status(404).json({ error: 'Route not found' });
        });
        this.app.use((err, req, res, next) => {
            console.error('Error:', err);
            res.status(500).json({ error: 'Internal server error' });
        });
    }
    async initialize() {
        try {
            await this.agentManager.initializeAgents();
            console.log('Application initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize application:', error);
            throw error;
        }
    }
    getApp() {
        return this.app;
    }
    async close() {
        this.db.close();
    }
}
exports.App = App;
//# sourceMappingURL=app.js.map