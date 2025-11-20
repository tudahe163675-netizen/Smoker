import { Notification } from '@/constants/notiData';

const API_BASE_URL = 'https://your-api-domain.com/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

class NotificationApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error: NotificationApiService>>>', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async getAuthToken(): Promise<string> {
    // TODO: Get token from secure storage or auth context
    return 'your-auth-token-here';
  }

  // Lấy danh sách notifications
  async getNotifications(page: number = 1, limit: number = 10): Promise<ApiResponse<Notification[]>> {
    return this.makeRequest<Notification[]>(`/notifications?page=${page}&limit=${limit}`);
  }

  // Tạo notification mới
  async createNotification(
    notification: Omit<Notification, 'id'>
  ): Promise<ApiResponse<Notification>> {
    return this.makeRequest<Notification>('/notifications', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }

  // Đánh dấu một notification đã đọc
  async markAsRead(id: string): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/notifications/${id}/read`, {
      method: 'PATCH',
      body: JSON.stringify({ isRead: true }),
    });
  }

  // Đánh dấu tất cả notifications đã đọc
  async markAllAsRead(): Promise<ApiResponse<null>> {
    return this.makeRequest<null>('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  // Xóa tất cả notifications
  async clearNotifications(): Promise<ApiResponse<null>> {
    return this.makeRequest<null>('/notifications', {
      method: 'DELETE',
    });
  }
}

export const notificationApi = new NotificationApiService();