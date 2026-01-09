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
    const response = await this.makeRequest<BankInfo | BankInfo[] | { data: BankInfo | BankInfo[] }>(`/bank-info/account/${accountId}`, {
      method: 'GET',
    });
    
    // Handle response format từ web: có thể là { status: 'success', data: ... } hoặc trực tiếp data
    if (response.success) {
      // Nếu data là object có status và data bên trong (nested)
      if (response.data && typeof response.data === 'object' && 'status' in response.data && 'data' in response.data) {
        const nestedData = (response.data as any).data;
        return {
          success: true,
          data: nestedData,
          message: response.message,
        };
      }
      // Nếu data trực tiếp là BankInfo hoặc array
      return {
        success: true,
        data: response.data as BankInfo | BankInfo[],
        message: response.message,
      };
    }
    
    return response;
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

