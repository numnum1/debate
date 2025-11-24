/**
 * API Service für Backend-Kommunikation mit Keycloak-Authentifizierung
 */

import { apiConfig } from '../config/api.config';
import { Debate, DebateMessage, Position, Slot, User, AiModelInfo } from '../types';

/**
 * API Response Types
 */
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

interface ApiError {
  message: string;
  status: number;
  details?: any;
}

/**
 * API Service Class
 */
class ApiService {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshTokenCallback: (() => Promise<string | null>) | null = null;

  constructor() {
    this.baseUrl = apiConfig.baseUrl;
  }

  /**
   * Set access token for authenticated requests
   */
  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  /**
   * Set callback for token refresh
   */
  setRefreshTokenCallback(callback: () => Promise<string | null>) {
    this.refreshTokenCallback = callback;
  }

  /**
   * Get headers with authentication
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  /**
   * Generic request handler with error handling and automatic token refresh
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      console.log(`[API] ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
        signal: AbortSignal.timeout(apiConfig.timeout),
      });

      if (!response.ok) {
        // Bei 401 (Unauthorized) Token erneuern und erneut versuchen
        if (response.status === 401 && retryCount === 0 && this.refreshTokenCallback) {
          console.log('[API] Token abgelaufen, versuche zu erneuern...');
          
          const newToken = await this.refreshTokenCallback();
          
          if (newToken) {
            this.accessToken = newToken;
            console.log('[API] Token erneuert, wiederhole Request...');
            // Request mit neuem Token wiederholen
            return this.request<T>(endpoint, options, retryCount + 1);
          }
        }

        const error: ApiError = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };

        try {
          const errorData = await response.json();
          error.details = errorData;
          error.message = errorData.message || error.message;
        } catch (e) {
          // Response has no JSON body
        }

        console.error('[API] Error:', error);
        throw error;
      }

      const data = await response.json();
      console.log(`[API] ✓ Success`);
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw {
          message: 'Request timeout - Backend nicht erreichbar',
          status: 0,
          details: error,
        } as ApiError;
      }

      if (error.status) {
        throw error as ApiError;
      }

      throw {
        message: 'Netzwerkfehler - Backend nicht erreichbar',
        status: 0,
        details: error,
      } as ApiError;
    }
  }

  /**
   * GET request
   */
  private async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  private async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  private async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  private async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ==================== Debate Endpoints ====================

  /**
   * Get all debates for current user
   */
  async getDebates(): Promise<Debate[]> {
    const response = await this.get<ApiResponse<Debate[]>>(
      apiConfig.endpoints.debates
    );
    return response.data;
  }

  /**
   * Get all public debates
   */
  async getPublicDebates(): Promise<Debate[]> {
    const response = await this.get<ApiResponse<Debate[]>>(
      `${apiConfig.endpoints.debates}/public`
    );
    return response.data;
  }

  /**
   * Get single debate by ID with messages
   */
  async getDebate(id: string): Promise<Debate> {
    const response = await this.get<ApiResponse<Debate>>(
      apiConfig.endpoints.debateById(id)
    );
    return response.data;
  }

  /**
   * Create new debate
   */
  async createDebate(debate: Omit<Debate, 'id' | 'createdAt'>): Promise<Debate> {
    const response = await this.post<ApiResponse<Debate>>(
      apiConfig.endpoints.debates,
      debate
    );
    return response.data;
  }

  /**
   * Update debate
   */
  async updateDebate(id: string, updates: Partial<Debate>): Promise<Debate> {
    const response = await this.put<ApiResponse<Debate>>(
      apiConfig.endpoints.debateById(id),
      updates
    );
    return response.data;
  }

  /**
   * Delete debate
   */
  async deleteDebate(id: string): Promise<void> {
    await this.delete<ApiResponse<void>>(
      apiConfig.endpoints.debateById(id)
    );
  }

  /**
   * Close and archive debate (only owner can do this)
   */
  async closeDebate(id: string): Promise<Debate> {
    const response = await this.post<ApiResponse<Debate>>(
      `${apiConfig.endpoints.debateById(id)}/close`,
      {}
    );
    return response.data;
  }

  // ==================== Message Endpoints ====================

  /**
   * Send message to debate
   */
  async sendMessage(
    debateId: string,
    message: Omit<DebateMessage, 'id' | 'timestamp'>
  ): Promise<DebateMessage> {
    const response = await this.post<ApiResponse<DebateMessage>>(
      apiConfig.endpoints.debateMessages(debateId),
      message
    );
    return response.data;
  }

  /**
   * Get messages for debate
   */
  async getMessages(debateId: string): Promise<DebateMessage[]> {
    const response = await this.get<ApiResponse<DebateMessage[]>>(
      apiConfig.endpoints.debateMessages(debateId)
    );
    return response.data;
  }

  // ==================== Position Endpoints ====================

  /**
   * Add position to debate
   */
  async addPosition(
    debateId: string,
    position: Omit<Position, 'id'>
  ): Promise<Position> {
    const response = await this.post<ApiResponse<Position>>(
      apiConfig.endpoints.positions(debateId),
      position
    );
    return response.data;
  }

  /**
   * Update position
   */
  async updatePosition(
    debateId: string,
    positionId: string,
    updates: Partial<Position>
  ): Promise<Position> {
    const response = await this.put<ApiResponse<Position>>(
      `${apiConfig.endpoints.positions(debateId)}/${positionId}`,
      updates
    );
    return response.data;
  }

  /**
   * Remove position
   */
  async removePosition(debateId: string, positionId: string): Promise<void> {
    await this.delete<ApiResponse<void>>(
      `${apiConfig.endpoints.positions(debateId)}/${positionId}`
    );
  }

  // ==================== Slot Endpoints ====================

  /**
   * Add slot to position
   */
  async addSlot(
    debateId: string,
    positionId: string,
    slot: Omit<Slot, 'id'>
  ): Promise<Slot> {
    const response = await this.post<ApiResponse<Slot>>(
      apiConfig.endpoints.slots(debateId, positionId),
      slot
    );
    return response.data;
  }

  /**
   * Update slot
   */
  async updateSlot(
    debateId: string,
    positionId: string,
    slotId: string,
    updates: Partial<Slot>
  ): Promise<Slot> {
    const response = await this.put<ApiResponse<Slot>>(
      `${apiConfig.endpoints.slots(debateId, positionId)}/${slotId}`,
      updates
    );
    return response.data;
  }

  /**
   * Remove slot
   */
  async removeSlot(
    debateId: string,
    positionId: string,
    slotId: string
  ): Promise<void> {
    await this.delete<ApiResponse<void>>(
      `${apiConfig.endpoints.slots(debateId, positionId)}/${slotId}`
    );
  }

  // ==================== User Endpoints ====================

  /**
   * Search users by name
   */
  async searchUsers(query: string): Promise<User[]> {
    const response = await this.get<ApiResponse<User[]>>(
      `/api/users/search?query=${encodeURIComponent(query)}`
    );
    return response.data;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    const response = await this.get<ApiResponse<User>>('/api/users/me');
    return response.data;
  }

  /**
   * Sync users from Keycloak
   */
  async syncUsersFromKeycloak(): Promise<number> {
    const response = await this.post<ApiResponse<number>>('/api/users/sync', {});
    return response.data;
  }

  // ==================== AI Model Endpoints ====================

  /**
   * Get available AI models
   */
  async getAvailableAiModels(): Promise<AiModelInfo[]> {
    const response = await this.get<ApiResponse<AiModelInfo[]>>(
      '/api/ai/models'
    );
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiService();
export type { ApiError };

