/**
 * WebSocket Service für Real-time Chat
 */

import { apiConfig } from '../config/api.config';
import { Debate, DebateMessage } from '../types';

type MessageCallback = (message: DebateMessage) => void;
type DebateUpdateCallback = (debate: Debate) => void;
type ErrorCallback = (error: Error) => void;
type ConnectionCallback = () => void;
type TypingCallback = (data: { userId: string; userName: string; isTyping: boolean }) => void;

/**
 * WebSocket Service Class
 */
class WebSocketService {
  private ws: WebSocket | null = null;
  private accessToken: string | null = null;
  private currentDebateId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  
  // Callbacks
  private messageCallbacks: MessageCallback[] = [];
  private debateUpdateCallbacks: DebateUpdateCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private connectCallbacks: ConnectionCallback[] = [];
  private disconnectCallbacks: ConnectionCallback[] = [];
  private typingCallbacks: TypingCallback[] = [];

  /**
   * Set access token for authentication
   */
  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    try {
      const wsUrl = this.accessToken
        ? `${apiConfig.wsUrl}?token=${this.accessToken}`
        : apiConfig.wsUrl;

      console.log('[WebSocket] Connecting to:', wsUrl.substring(0, 50) + '...');
      console.log('[WebSocket] Base URL from config:', apiConfig.wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocket] ✓ Connected');
        this.reconnectAttempts = 0;
        
        // Rejoin current debate if any
        if (this.currentDebateId) {
          this.joinDebate(this.currentDebateId);
        }
        
        this.connectCallbacks.forEach(cb => cb());
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket] Message received:', data.type);

          switch (data.type) {
            case apiConfig.wsEvents.messageReceived:
              // New message received
              const message: DebateMessage = data.payload;
              this.messageCallbacks.forEach(cb => cb(message));
              break;

            case 'debate:updated':
              // Debate structure updated (positions, slots, etc.)
              const debate: Debate = data.payload;
              console.log('[WebSocket] Debate updated:', debate.id);
              this.debateUpdateCallbacks.forEach(cb => cb(debate));
              break;

            case 'debate:typing:update':
              // Typing indicator update
              const typingData: { userId: string; userName: string; isTyping: boolean } = data.payload;
              this.typingCallbacks.forEach(cb => cb(typingData));
              break;

            case apiConfig.wsEvents.error:
              console.error('[WebSocket] Server error:', data.payload);
              this.errorCallbacks.forEach(cb => cb(new Error(data.payload.message)));
              break;

            default:
              console.log('[WebSocket] Unknown event type:', data.type);
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.errorCallbacks.forEach(cb => cb(new Error('WebSocket error')));
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] ✗ Disconnected');
        this.disconnectCallbacks.forEach(cb => cb());
        this.attemptReconnect();
      };

    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      this.errorCallbacks.forEach(cb => cb(error as Error));
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      console.log('[WebSocket] Disconnecting...');
      
      // Leave current debate before disconnecting
      if (this.currentDebateId) {
        this.leaveDebate(this.currentDebateId);
      }
      
      this.ws.close();
      this.ws = null;
      this.currentDebateId = null;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Send message through WebSocket
   */
  private send(event: string, payload: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] Not connected');
      return;
    }

    const message = {
      type: event,
      payload,
      timestamp: new Date().toISOString(),
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Join a debate room
   */
  joinDebate(debateId: string) {
    console.log(`[WebSocket] Joining debate: ${debateId}`);
    this.currentDebateId = debateId;
    this.send(apiConfig.wsEvents.joinDebate, { debateId });
  }

  /**
   * Leave a debate room
   */
  leaveDebate(debateId: string) {
    console.log(`[WebSocket] Leaving debate: ${debateId}`);
    this.send(apiConfig.wsEvents.leaveDebate, { debateId });
    
    if (this.currentDebateId === debateId) {
      this.currentDebateId = null;
    }
  }

  /**
   * Send a message (optimistic, actual save is via API)
   */
  sendMessage(debateId: string, message: DebateMessage) {
    this.send(apiConfig.wsEvents.newMessage, {
      debateId,
      message,
    });
  }

  /**
   * Send typing indicator
   */
  sendTyping(debateId: string, isTyping: boolean) {
    this.send('debate:typing', {
      debateId,
      isTyping,
    });
  }

  // ==================== Event Listeners ====================

  /**
   * Register callback for new messages
   */
  onMessage(callback: MessageCallback) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Register callback for errors
   */
  onError(callback: ErrorCallback) {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Register callback for connection
   */
  onConnect(callback: ConnectionCallback) {
    this.connectCallbacks.push(callback);
    return () => {
      this.connectCallbacks = this.connectCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Register callback for disconnection
   */
  onDisconnect(callback: ConnectionCallback) {
    this.disconnectCallbacks.push(callback);
    return () => {
      this.disconnectCallbacks = this.disconnectCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Register callback for typing indicators
   */
  onTyping(callback: TypingCallback) {
    this.typingCallbacks.push(callback);
    return () => {
      this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Register callback for debate updates
   */
  onDebateUpdate(callback: DebateUpdateCallback) {
    this.debateUpdateCallbacks.push(callback);
    return () => {
      this.debateUpdateCallbacks = this.debateUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Get connection state
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current debate ID
   */
  getCurrentDebateId(): string | null {
    return this.currentDebateId;
  }
}

// Export singleton instance
export const websocket = new WebSocketService();

