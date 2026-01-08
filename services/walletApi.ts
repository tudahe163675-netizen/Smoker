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
    return this.makeRequest<Wallet>('/wallet', {
      method: 'GET',
    });
  }

  async getTransactions(params?: GetTransactionsParams): Promise<ApiResponse<{ transactions: Transaction[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/wallet/transactions?${queryString}` : '/wallet/transactions';

    return this.makeRequest<{ transactions: Transaction[] }>(endpoint, {
      method: 'GET',
    });
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

    return this.makeRequest<{ requests: WithdrawRequest[] }>(endpoint, {
      method: 'GET',
    });
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

