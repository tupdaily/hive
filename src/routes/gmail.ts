import { Router, Request, Response } from 'express';
import { GmailService } from '../services/gmail';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const gmailService = new GmailService();

// Store user tokens temporarily (in production, use a database)
const userTokens = new Map<string, { accessToken: string; refreshToken?: string }>();

// Start Gmail OAuth flow
router.get('/auth/google/start', (req: Request, res: Response) => {
  const userId = req.query.user_id as string;
  if (!userId) {
    return res.status(400).json({ error: 'Missing user_id' });
  }
  
  const authUrl = gmailService.generateAuthUrl(userId);
  res.redirect(authUrl);
});

// Handle OAuth callback
router.get('/auth/google/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const userId = req.query.state as string;
  
  if (!code || !userId) {
    return res.status(400).json({ error: 'Bad OAuth response' });
  }

  try {
    const tokens = await gmailService.getTokensFromCode(code);
    userTokens.set(userId, {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token
    });
    
    res.json({ 
      success: true, 
      message: 'Gmail connected successfully!' 
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Failed to complete OAuth flow' });
  }
});

// Check Gmail connection status
router.get('/status', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const isConnected = userTokens.has(userId);
  res.json({ connected: isConnected });
});

// Search emails
router.post('/search', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { query, maxResults = 10 } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  const tokens = userTokens.get(userId);
  if (!tokens) {
    return res.status(400).json({ error: 'Gmail not connected. Please connect your Gmail account first.' });
  }

  try {
    gmailService.setUserCredentials(tokens.accessToken, tokens.refreshToken);
    const emails = await gmailService.searchEmails(query, maxResults);
    res.json({ emails });
  } catch (error) {
    console.error('Gmail search error:', error);
    res.status(500).json({ error: 'Failed to search emails' });
  }
});

// Get email details
router.get('/email/:messageId', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { messageId } = req.params;
  const tokens = userTokens.get(userId);
  if (!tokens) {
    return res.status(400).json({ error: 'Gmail not connected' });
  }

  try {
    gmailService.setUserCredentials(tokens.accessToken, tokens.refreshToken);
    const email = await gmailService.getEmailDetails(messageId);
    res.json({ email });
  } catch (error) {
    console.error('Gmail email details error:', error);
    res.status(500).json({ error: 'Failed to get email details' });
  }
});

// Get labels
router.get('/labels', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const tokens = userTokens.get(userId);
  if (!tokens) {
    return res.status(400).json({ error: 'Gmail not connected' });
  }

  try {
    gmailService.setUserCredentials(tokens.accessToken, tokens.refreshToken);
    const labels = await gmailService.getLabels();
    res.json({ labels });
  } catch (error) {
    console.error('Gmail labels error:', error);
    res.status(500).json({ error: 'Failed to get labels' });
  }
});

export default router;
