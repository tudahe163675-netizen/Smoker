import { useState, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthProvider';
import { createLivestreamApi } from '@/services/livestreamApi';
import type {
  Livestream,
  ScheduledLivestream,
  CreateLivestreamData,
  CreateScheduledLivestreamData,
} from '@/services/livestreamApi';

export const useLivestream = () => {
  const { authState } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getActiveLivestreams = useCallback(async (): Promise<Livestream[]> => {
    if (!authState.token) {
      setError('Chưa đăng nhập');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const livestreamApi = createLivestreamApi(authState.token);
      const response = await livestreamApi.getActiveLivestreams();

      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.message || 'Không thể tải danh sách livestream');
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  const startLivestream = useCallback(
    async (data: CreateLivestreamData): Promise<Livestream | null> => {
      if (!authState.token) {
        setError('Chưa đăng nhập');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const livestreamApi = createLivestreamApi(authState.token);
        const response = await livestreamApi.startLivestream(data);

        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.message || 'Bắt đầu livestream thất bại');
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

  const endLivestream = useCallback(
    async (livestreamId: string): Promise<boolean> => {
      if (!authState.token) {
        setError('Chưa đăng nhập');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const livestreamApi = createLivestreamApi(authState.token);
        const response = await livestreamApi.endLivestream(livestreamId);

        if (response.success) {
          return true;
        } else {
          setError(response.message || 'Kết thúc livestream thất bại');
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

  const getLivestream = useCallback(
    async (livestreamId: string): Promise<Livestream | null> => {
      if (!authState.token) {
        setError('Chưa đăng nhập');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const livestreamApi = createLivestreamApi(authState.token);
        const response = await livestreamApi.getLivestream(livestreamId);

        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.message || 'Không thể tải thông tin livestream');
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

  const incrementViewCount = useCallback(
    async (livestreamId: string): Promise<boolean> => {
      if (!authState.token) {
        return false;
      }

      try {
        const livestreamApi = createLivestreamApi(authState.token);
        const response = await livestreamApi.incrementViewCount(livestreamId);
        return response.success;
      } catch (err) {
        return false;
      }
    },
    [authState.token]
  );

  const createScheduledLivestream = useCallback(
    async (data: CreateScheduledLivestreamData): Promise<ScheduledLivestream | null> => {
      if (!authState.token) {
        setError('Chưa đăng nhập');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const livestreamApi = createLivestreamApi(authState.token);
        const response = await livestreamApi.createScheduledLivestream(data);

        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.message || 'Tạo scheduled livestream thất bại');
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

  const getScheduledLivestreams = useCallback(async (): Promise<ScheduledLivestream[]> => {
    if (!authState.token) {
      setError('Chưa đăng nhập');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const livestreamApi = createLivestreamApi(authState.token);
      const response = await livestreamApi.getScheduledLivestreams();

      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.message || 'Không thể tải scheduled livestreams');
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  const cancelScheduledLivestream = useCallback(
    async (livestreamId: string): Promise<boolean> => {
      if (!authState.token) {
        setError('Chưa đăng nhập');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const livestreamApi = createLivestreamApi(authState.token);
        const response = await livestreamApi.cancelScheduledLivestream(livestreamId);

        if (response.success) {
          return true;
        } else {
          setError(response.message || 'Hủy scheduled livestream thất bại');
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

  const activateScheduledLivestream = useCallback(
    async (livestreamId: string): Promise<Livestream | null> => {
      if (!authState.token) {
        setError('Chưa đăng nhập');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const livestreamApi = createLivestreamApi(authState.token);
        const response = await livestreamApi.activateScheduledLivestream(livestreamId);

        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.message || 'Kích hoạt scheduled livestream thất bại');
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

  return {
    getActiveLivestreams,
    startLivestream,
    endLivestream,
    getLivestream,
    incrementViewCount,
    createScheduledLivestream,
    getScheduledLivestreams,
    cancelScheduledLivestream,
    activateScheduledLivestream,
    loading,
    error,
  };
};

