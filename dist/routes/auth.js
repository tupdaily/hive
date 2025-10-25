"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
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
const createAuthRoutes = (authService) => {
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
    return router;
};
exports.createAuthRoutes = createAuthRoutes;
//# sourceMappingURL=auth.js.map