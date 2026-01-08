import { BaseApiService, ApiResponse } from './BaseApiService';

export interface BankInfo {
  BankInfoId: string;
  AccountId: string;
  BankName: string;
  AccountNumber: string;
  AccountHolderName?: string;
}

class BankInfoApiService extends BaseApiService {
  constructor(token: string) {
    super(token);
  }

  async getByAccountId(accountId: string): Promise<ApiResponse<BankInfo | BankInfo[]>> {
    return this.makeRequest<BankInfo | BankInfo[]>(`/bank-info/account/${accountId}`, {
      method: 'GET',
    });
  }

  async getById(bankInfoId: string): Promise<ApiResponse<BankInfo>> {
    return this.makeRequest<BankInfo>(`/bank-info/${bankInfoId}`, {
      method: 'GET',
    });
  }

  async create(payload: {
    AccountId: string;
    BankName: string;
    AccountNumber: string;
    AccountHolderName?: string;
  }): Promise<ApiResponse<BankInfo>> {
    return this.makeRequest<BankInfo>('/bank-info', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async update(bankInfoId: string, payload: Partial<BankInfo>): Promise<ApiResponse<BankInfo>> {
    return this.makeRequest<BankInfo>(`/bank-info/${bankInfoId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async delete(bankInfoId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/bank-info/${bankInfoId}`, {
      method: 'DELETE',
    });
  }
}

export const createBankInfoApi = (token: string) => new BankInfoApiService(token);

