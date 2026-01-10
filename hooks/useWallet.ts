import { useState, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthProvider';
import { createWalletApi } from '@/services/walletApi';
import type {
  Wallet,
  Transaction,
  WithdrawRequest,
  GetTransactionsParams,
  GetWithdrawRequestsParams,
} from '@/services/walletApi';

export const useWallet = () => {
  const { authState } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWallet = useCallback(async (): Promise<Wallet | null> => {
    if (!authState.token) {
      setError('Chưa đăng nhập');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const walletApi = createWalletApi(authState.token);
      const response = await walletApi.getWallet();

      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.message || 'Không thể tải thông tin ví');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  const getTransactions = useCallback(
    async (params?: GetTransactionsParams): Promise<Transaction[]> => {
      if (!authState.token) {
        setError('Chưa đăng nhập');
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        const walletApi = createWalletApi(authState.token);
        const response = await walletApi.getTransactions(params);

        if (response.success && response.data) {
          return response.data.transactions || [];
        } else {
          setError(response.message || 'Không thể tải lịch sử giao dịch');
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
    [authState.token]
  );

  const createWithdrawRequest = useCallback(
    async (amount: number, bankInfoId: string, pin: string): Promise<WithdrawRequest | null> => {
      if (!authState.token) {
        setError('Chưa đăng nhập');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const walletApi = createWalletApi(authState.token);
        const response = await walletApi.createWithdrawRequest(amount, bankInfoId, pin);

        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.message || 'Tạo yêu cầu rút tiền thất bại');
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

  const getWithdrawRequests = useCallback(
    async (params?: GetWithdrawRequestsParams): Promise<WithdrawRequest[]> => {
      if (!authState.token) {
        setError('Chưa đăng nhập');
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        const walletApi = createWalletApi(authState.token);
        const response = await walletApi.getWithdrawRequests(params);

      if (response.success && response.data) {
        const requests = response.data.requests || [];
        // Normalize field names to ensure accountHolderName is available
        return requests.map((req: any) => ({
          ...req,
          accountHolderName: req.accountHolderName || req.AccountHolderName || req.account_holder_name,
        }));
      } else {
        setError(response.message || 'Không thể tải yêu cầu rút tiền');
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
    [authState.token]
  );

  const setPin = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!authState.token) {
        setError('Chưa đăng nhập');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const walletApi = createWalletApi(authState.token);
        const response = await walletApi.setPin(pin);

        if (response.success) {
          return true;
        } else {
          setError(response.message || 'Thiết lập PIN thất bại');
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

  const verifyPin = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!authState.token) {
        setError('Chưa đăng nhập');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const walletApi = createWalletApi(authState.token);
        const response = await walletApi.verifyPin(pin);

        if (response.success) {
          return true;
        } else {
          setError(response.message || 'PIN không đúng');
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
    getWallet,
    getTransactions,
    createWithdrawRequest,
    getWithdrawRequests,
    setPin,
    verifyPin,
    loading,
    error,
  };
};

