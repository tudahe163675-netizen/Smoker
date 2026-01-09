import { BaseApiService, ApiResponse } from './BaseApiService';
import { API_CONFIG } from './apiConfig';

export interface Wallet {
  id?: string;
  balance: number;
  lockedBalance: number;
  hasPin: boolean;
  isLocked?: boolean;
  lockedUntil?: string;
}

export interface Transaction {
  id: string;
  type: 'booking_income' | 'refund' | 'withdraw' | 'withdraw_reject' | 'system_adjust';
  amount: number;
  balanceAfter: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'completed';
  description?: string;
  createdAt: string;
}

export interface WithdrawRequest {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'completed';
  bankName: string;
  accountNumber: string;
  accountHolderName?: string;
  requestedAt: string;
}

export interface GetTransactionsParams {
  limit?: number;
  offset?: number;
  type?: string;
  status?: string;
}

export interface GetWithdrawRequestsParams {
  limit?: number;
  offset?: number;
  status?: string;
}

class WalletApiService extends BaseApiService {
  constructor(token: string) {
    super(token);
  }

  async getWallet(): Promise<ApiResponse<Wallet>> {
    const response = await this.makeRequest<Wallet>('/wallet', {
      method: 'GET',
    });
    
    // Handle response format từ web: có thể là { status: 'success', data: ... }
    if (response.success && response.data) {
      return response;
    }
    
    // Fallback: nếu response trực tiếp là wallet object
    return {
      success: true,
      data: response.data as Wallet,
      message: 'Success',
    };
  }

  async getTransactions(params?: GetTransactionsParams): Promise<ApiResponse<{ transactions: Transaction[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/wallet/transactions?${queryString}` : '/wallet/transactions';

    const response = await this.makeRequest<{ transactions: Transaction[] } | { data: { transactions: Transaction[] } }>(endpoint, {
      method: 'GET',
    });
    
    // Handle response format: { status: 'success', data: { transactions: [...] } }
    if (response.success) {
      if (response.data && 'transactions' in response.data) {
        return {
          success: true,
          data: response.data as { transactions: Transaction[] },
          message: response.message,
        };
      }
      if (response.data && 'data' in response.data && 'transactions' in (response.data as any).data) {
        return {
          success: true,
          data: (response.data as any).data,
          message: response.message,
        };
      }
    }
    
    return response as ApiResponse<{ transactions: Transaction[] }>;
  }

  async createWithdrawRequest(
    amount: number,
    bankInfoId: string,
    pin: string
  ): Promise<ApiResponse<WithdrawRequest>> {
    return this.makeRequest<WithdrawRequest>('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, bankInfoId, pin }),
    });
  }

  async getWithdrawRequests(params?: GetWithdrawRequestsParams): Promise<ApiResponse<{ requests: WithdrawRequest[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/wallet/withdraw-requests?${queryString}` : '/wallet/withdraw-requests';

    const response = await this.makeRequest<{ requests: WithdrawRequest[] } | { data: { requests: WithdrawRequest[] } }>(endpoint, {
      method: 'GET',
    });
    
    // Handle response format: { status: 'success', data: { requests: [...] } }
    if (response.success) {
      if (response.data && 'requests' in response.data) {
        return {
          success: true,
          data: response.data as { requests: WithdrawRequest[] },
          message: response.message,
        };
      }
      if (response.data && 'data' in response.data && 'requests' in (response.data as any).data) {
        return {
          success: true,
          data: (response.data as any).data,
          message: response.message,
        };
      }
    }
    
    return response as ApiResponse<{ requests: WithdrawRequest[] }>;
  }

  async setPin(pin: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>('/wallet/set-pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  }

  async verifyPin(pin: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>('/wallet/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  }
}

export const createWalletApi = (token: string) => new WalletApiService(token);

