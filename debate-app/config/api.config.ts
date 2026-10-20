/**
 * API Konfiguration für Backend-Kommunikation
 */

export const apiConfig = {
  // Backend Base URL
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:1933',
  
  // WebSocket URL (für Real-time Chat)
  // Note: WebSocket läuft unter dem context-path /api
  wsUrl: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:1933/api/ws',
  
  // API Endpoints
  endpoints: {
    debates: '/api/debates',
    debateById: (id: string) => `/api/debates/${id}`,
    debateMessages: (id: string) => `/api/debates/${id}/messages`,
    positions: (debateId: string) => `/api/debates/${debateId}/positions`,
    slots: (debateId: string, positionId: string) => `/api/debates/${debateId}/positions/${positionId}/slots`,
  },
  
  // WebSocket Events
  wsEvents: {
    connect: 'connect',
    disconnect: 'disconnect',
    joinDebate: 'debate:join',
    leaveDebate: 'debate:leave',
    newMessage: 'debate:message',
    messageReceived: 'debate:message:received',
    error: 'error',
  },
  
  // Timeout Settings
  timeout: 30000, // 30 seconds
  
  // Retry Settings
  retry: {
    maxAttempts: 3,
    delay: 1000, // 1 second
  },
};

