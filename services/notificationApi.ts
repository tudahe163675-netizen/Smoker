import { Notification } from '@/constants/notiData';
import { API_CONFIG } from './apiConfig';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message: string;
    error?: string;
}

export class NotificationApiService {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }
    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.token}`,
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

    // Lấy danh sách notifications
    async getNotifications(accountId: string, page: number = 1, limit: number = 10): Promise<ApiResponse<Notification[]>> {
        return this.makeRequest<Notification[]>(`/notifications?entityAccountId=${accountId}&page=${page}&limit=${limit}`, {});
    }

    // Tạo notification mới
    async createNotification(
        notification: Omit<Notification, '_id'>
    ): Promise<ApiResponse<Notification>> {
        return this.makeRequest<Notification>('/notifications', {
            method: 'POST',
            body: JSON.stringify(notification),
        });
    }

    // Đánh dấu một notification đã đọc
    async markAsRead(id: string, accountId: string): Promise<ApiResponse<null>> {
        return this.makeRequest<null>(`/notifications/${id}/read?entityAccountId=${accountId}`, {
            method: 'PUT'
        });
    }

    // Đánh dấu tất cả notifications đã đọc
    async markAllAsRead(accountId: string): Promise<ApiResponse<null>> {
        return this.makeRequest<null>(`/notifications/read-all?entityAccountId=${accountId}`, {
            method: 'PUT',
        });
    }

    // Xóa tất cả notifications
    async clearNotifications(): Promise<ApiResponse<null>> {
        return this.makeRequest<null>('/notifications', {
            method: 'DELETE',
        });
    }
}