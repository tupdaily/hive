import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth/auth';
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
    body: any;
    params: any;
    headers: any;
}
export declare const authenticateToken: (authService: AuthService) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare const requireAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requireEmployee: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=auth.d.ts.map