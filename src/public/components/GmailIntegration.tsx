import React, { useState, useEffect } from 'react';

interface GmailIntegrationProps {
  userId: string;
  token: string;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

export const GmailIntegration: React.FC<GmailIntegrationProps> = ({ 
  userId, 
  token, 
  onSuccess, 
  onError 
}) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
  }, [userId, token]);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/gmail/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (error) {
      console.error('Error checking Gmail connection status:', error);
      setIsConnected(false);
    }
  };

  const handleConnect = () => {
    setIsConnecting(true);
    // Redirect to Google OAuth
    window.location.href = `/api/gmail/auth/google/start?user_id=${userId}`;
  };

  const handleDisconnect = async () => {
    try {
      // For now, just update local state
      // In a real app, you'd call an API to disconnect
      setIsConnected(false);
      onSuccess('Gmail disconnected successfully');
    } catch (error) {
      onError('Error disconnecting Gmail account');
    }
  };

  if (isConnected === null) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {isConnected ? (
        <>
          <div className="flex items-center space-x-1 text-green-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium">Gmail</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {isConnecting ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
          ) : (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          )}
          <span>{isConnecting ? 'Connecting...' : 'Gmail'}</span>
        </button>
      )}
    </div>
  );
};
