"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireEmployee = exports.requireAdmin = exports.authenticateToken = void 0;
const authenticateToken = (authService) => {
    return async (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }
        const decoded = await authService.verifyToken(token);
        if (!decoded) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = decoded;
        next();
    };
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireEmployee = (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'employee')) {
        return res.status(403).json({ error: 'Employee access required' });
    }
    next();
};
exports.requireEmployee = requireEmployee;
//# sourceMappingURL=auth.js.map