import { Router, Request, Response } from 'express';
import { AuthService } from '../auth/auth';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['admin', 'employee']).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const questionnaireSchema = z.object({
  description: z.string().min(10, 'Please provide at least 10 characters describing your role and what you\'re working on')
});

export const createAuthRoutes = (authService: AuthService, db: any) => {
  const router = Router();

  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { email, password, name, role } = registerSchema.parse(req.body);
      
      const result = await authService.register(email, password, name, role);
      
      res.status(201).json({
        message: 'User registered successfully',
        user: result.user,
        token: result.token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      
      res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
    }
  });

  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const result = await authService.login(email, password);
      
      res.json({
        message: 'Login successful',
        user: result.user,
        token: result.token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      
      res.status(401).json({ error: error instanceof Error ? error.message : 'Login failed' });
    }
  });

  // Submit questionnaire
  router.post('/questionnaire', authenticateToken(authService), async (req: AuthenticatedRequest, res: Response) => {
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to submit questionnaire' });
    }
  });

  // Get user profile (including description)
  router.get('/profile', authenticateToken(authService), async (req: AuthenticatedRequest, res: Response) => {
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
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to get profile' });
    }
  });

  return router;
};
