
import { API_CONFIG } from "./apiConfig";

// Define types for message API
export type MessageType = "text" | "image" | "video" | string;

export interface GetMessagesParams {
  before?: string;
  limit?: number;
  offset?: number;
  [key: string]: any;
}

export interface SendMessageExtra {
  [key: string]: any;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export class MessageApiService {
  private token: string;

  constructor(token: string) {
    this.token = token;
    //console.log('MessageApiService initialized with token:', token ? `Token length: ${token.length}, starts with: ${token.substring(0, 10)}...` : 'No token');
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      //console.log('Making API request to:', endpoint);
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      //console.log('API response status:', response.status, 'data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getConversations(entityAccountId?: string): Promise<any> {
    const params = entityAccountId ? `?entityAccountId=${encodeURIComponent(entityAccountId)}` : "";
    const response = await this.makeRequest<any>(`/messages/conversations${params}`);
    return response.success ? response.data || [] : [];
  }

  async getMessages(conversationId: string, params: GetMessagesParams = {}): Promise<any> {
    const query = Object.keys(params).length > 0
      ? "?" + new URLSearchParams(params as Record<string, string>).toString()
      : "";
    const response = await this.makeRequest<any>(`/messages/messages/${conversationId}${query}`);
    return response.success ? response : { success: false, data: [] };
  }

  async sendMessage(
    conversationId: string,
    content: string,
    messageType: MessageType = "text",
    senderEntityAccountId: string | null = null,
    entityType: string | null = null,
    entityId: string | null = null,
    extra: SendMessageExtra = {}
  ): Promise<any> {
    const body = JSON.stringify({
      conversationId,
      content,
      messageType,
      senderEntityAccountId,
      entityType,
      entityId,
      ...extra,
    });
    const response = await this.makeRequest<any>(`/messages/message`, { method: "POST", body });
    return response.success ? response.data : null;
  }

  async markMessagesRead(conversationId: string, entityAccountId: string, lastMessageId: string | null = null): Promise<any> {
    const body = JSON.stringify({ conversationId, entityAccountId, lastMessageId });
    const response = await this.makeRequest<any>(`/messages/messages/read`, { method: "POST", body });
    return response;
  }

  async createOrGetConversation(participant1Id: string, participant2Id: string): Promise<any> {
    const body = JSON.stringify({ participant1Id, participant2Id });
    const response = await this.makeRequest<any>(`/messages/conversation`, { method: "POST", body });
    return response.success ? response.data : null;
  }

  async getUnreadCount(entityAccountId: string): Promise<number> {
    const params = entityAccountId ? `?entityAccountId=${encodeURIComponent(entityAccountId)}` : '';
    const response = await this.makeRequest<any>(`/messages/unread-count${params}`);
    if (response.success && response.data && typeof response.data.totalUnreadCount === 'number') {
      return response.data.totalUnreadCount;
    }
    return 0;
  }
}