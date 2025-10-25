"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().min(1),
    role: zod_1.z.enum(['admin', 'employee']).optional()
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1)
});
const questionnaireSchema = zod_1.z.object({
    description: zod_1.z.string().min(10, 'Please provide at least 10 characters describing your role and what you\'re working on')
});
const createAuthRoutes = (authService, db) => {
    const router = (0, express_1.Router)();
    router.post('/register', async (req, res) => {
        try {
            const { email, password, name, role } = registerSchema.parse(req.body);
            const result = await authService.register(email, password, name, role);
            res.status(201).json({
                message: 'User registered successfully',
                user: result.user,
                token: result.token
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
        }
    });
    router.post('/login', async (req, res) => {
        try {
            const { email, password } = loginSchema.parse(req.body);
            const result = await authService.login(email, password);
            res.json({
                message: 'Login successful',
                user: result.user,
                token: result.token
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(401).json({ error: error instanceof Error ? error.message : 'Login failed' });
        }
    });
    router.post('/questionnaire', (0, auth_1.authenticateToken)(authService), async (req, res) => {
        try {
            const { description } = questionnaireSchema.parse(req.body);
            if (!req.user) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            await db.updateUserDescription(req.user.userId, description);
            res.json({
                message: 'Questionnaire submitted successfully',
                description: description
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: 'Invalid input', details: error.errors });
            }
            res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to submit questionnaire' });
        }
    });
    router.get('/profile', (0, auth_1.authenticateToken)(authService), async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const user = await db.getUserById(req.user.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    description: user.description,
                    hasDescription: !!user.description
                }
            });
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get profile' });
        }
    });
    return router;
};
exports.createAuthRoutes = createAuthRoutes;
//# sourceMappingURL=auth.js.map