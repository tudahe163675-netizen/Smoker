import { useState, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthProvider';
import { createRefundApi } from '@/services/refundApi';
import type { RefundRequest, GetRefundRequestsParams, CreateRefundRequestData } from '@/services/refundApi';

export const useRefund = () => {
  const { authState } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRefundRequests = useCallback(
    async (params?: GetRefundRequestsParams): Promise<RefundRequest[]> => {
      if (!authState.token) {
        setError('Chưa đăng nhập');
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        const refundApi = createRefundApi(authState.token);
        // Filter theo accountId của user hiện tại nếu không phải admin
        const requestParams = {
          ...params,
          accountId: authState.currentId,
        };
        const response = await refundApi.getRefundRequests(requestParams);

        if (response.success && response.data) {
          return Array.isArray(response.data) ? response.data : [];
        } else {
          setError(response.message || 'Không thể tải yêu cầu hoàn tiền');
          return [];
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
        setError(errorMessage);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [authState.token, authState.currentId]
  );

  const getRefundRequestDetail = useCallback(
    async (bookedScheduleId: string): Promise<RefundRequest | null> => {
      if (!authState.token) {
        setError('Chưa đăng nhập');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const refundApi = createRefundApi(authState.token);
        const response = await refundApi.getRefundRequestDetail(bookedScheduleId);

        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.message || 'Không thể tải chi tiết yêu cầu hoàn tiền');
          return null;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authState.token]
  );

  const createRefundRequest = useCallback(
    async (data: CreateRefundRequestData): Promise<RefundRequest | null> => {
      if (!authState.token) {
        setError('Chưa đăng nhập');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const refundApi = createRefundApi(authState.token);
        const response = await refundApi.createRefundRequest(data);

        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.message || 'Tạo yêu cầu hoàn tiền thất bại');
          return null;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [authState.token]
  );

  const updateRefundStatus = useCallback(
    async (
      bookedScheduleId: string,
      refundStatus: 'pending' | 'approved' | 'rejected' | 'completed'
    ): Promise<boolean> => {
      if (!authState.token) {
        setError('Chưa đăng nhập');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const refundApi = createRefundApi(authState.token);
        const response = await refundApi.updateRefundStatus(bookedScheduleId, refundStatus);

        if (response.success) {
          return true;
        } else {
          setError(response.message || 'Cập nhật trạng thái thất bại');
          return false;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [authState.token]
  );

  return {
    getRefundRequests,
    getRefundRequestDetail,
    createRefundRequest,
    updateRefundStatus,
    loading,
    error,
  };
};

