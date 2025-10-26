import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

export class GmailService {
  private oauth2Client: any;
  private gmail: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  // Set credentials for a specific user
  setUserCredentials(accessToken: string, refreshToken?: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  // Generate OAuth URL
  generateAuthUrl(userId: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      state: userId
    });
  }

  // Exchange code for tokens
  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  // Search emails
  async searchEmails(query: string, maxResults: number = 10) {
    if (!this.gmail) throw new Error('Gmail client not initialized');
    
    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults
    });

    const messages = response.data.messages || [];
    const detailedMessages = await Promise.all(
      messages.map(async (msg: any) => {
        const message = await this.gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'Date']
        });
        
        return {
          id: msg.id,
          snippet: message.data.snippet,
          headers: message.data.payload?.headers || []
        };
      })
    );

    return detailedMessages;
  }

  // Get email details
  async getEmailDetails(messageId: string) {
    if (!this.gmail) throw new Error('Gmail client not initialized');
    
    const message = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    return message.data;
  }

  // List labels
  async getLabels() {
    if (!this.gmail) throw new Error('Gmail client not initialized');
    
    const response = await this.gmail.users.labels.list({ userId: 'me' });
    return response.data.labels || [];
  }
}
