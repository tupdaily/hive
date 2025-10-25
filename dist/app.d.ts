import express from 'express';
export declare class App {
    private app;
    private db;
    private authService;
    private agentManager;
    constructor();
    private setupMiddleware;
    private setupRoutes;
    initialize(): Promise<void>;
    getApp(): express.Application;
    close(): Promise<void>;
}
//# sourceMappingURL=app.d.ts.map