import { Notification } from '@/constants/notiData';
import { useAuth } from "@/hooks/useAuth";
import { NotificationApiService } from "@/services/notificationApi";
import { useCallback, useEffect, useState } from 'react';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { authState } = useAuth();
  const accountId = authState.EntityAccountId;
  const token = authState.token;

  const notificationApi = new NotificationApiService(token!!);
  // Lấy notifications từ API
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await notificationApi.getNotifications(accountId!!);
      if (response.success && response.data) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter((n) => !(n.status === "Read")).length);
      } else {
        setError(response.message || 'Không thể tải thông báo');
      }
    } catch (err) {
      setError('Không thể tải thông báo');
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  // Thêm notification mới
  const addNotification = useCallback(
    async (notification: Omit<Notification, '_id' | 'time' | 'isRead'>) => {
      try {
        const response = await notificationApi.createNotification({
          ...notification,
          isRead: false,
          time: new Date().toISOString(),
        });
        if (response.success) {
          await fetchNotifications(); // Làm mới danh sách sau khi thêm
        } else {
          setError(response.message || 'Không thể thêm thông báo');
        }
      } catch (err) {
        setError('Không thể thêm thông báo');
        console.error('Error adding notification:', err);
      }
    },
    [fetchNotifications]
  );

  // Đánh dấu notification đã đọc
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        const response = await notificationApi.markAsRead(id, accountId!!);
        if (response.success) {
          await fetchNotifications(); // Làm mới danh sách sau khi cập nhật
        } else {
          setError(response.message || 'Không thể đánh dấu đã đọc');
        }
      } catch (err) {
        setError('Không thể đánh dấu đã đọc');
        console.error('Error marking notification as read:', err);
      }
    },
    [fetchNotifications]
  );

  // Đánh dấu tất cả notifications đã đọc
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationApi.markAllAsRead(accountId!!);
      if (response.success) {
        await fetchNotifications(); // Làm mới danh sách sau khi cập nhật
      } else {
        setError(response.message || 'Không thể đánh dấu tất cả đã đọc');
      }
    } catch (err) {
      setError('Không thể đánh dấu tất cả đã đọc');
      console.error('Error marking all notifications as read:', err);
    }
  }, [fetchNotifications]);

  // Xóa tất cả notifications
  const clearNotifications = useCallback(async () => {
    try {
      const response = await notificationApi.clearNotifications();
      if (response.success) {
        await fetchNotifications(); // Làm mới danh sách sau khi xóa
      } else {
        setError(response.message || 'Không thể xóa thông báo');
      }
    } catch (err) {
      setError('Không thể xóa thông báo');
      console.error('Error clearing notifications:', err);
    }
  }, [fetchNotifications]);

  useEffect(() => {
    if (!accountId || !token) return;
    fetchNotifications();
  }, [fetchNotifications, token, accountId]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    refresh: fetchNotifications,
  };
};