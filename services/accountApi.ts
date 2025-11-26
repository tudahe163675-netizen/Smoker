import { Account, AccountListResponse, CreateAccountRequestData, SwitchAccountRequestData } from "@/types/accountType";
import { API_CONFIG } from "./apiConfig";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export class AccountApiService {
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
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
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
      console.error('API Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all accounts of the current user
   */
  async getAccounts(): Promise<ApiResponse<AccountListResponse>> {
    return this.makeRequest<AccountListResponse>('/user/accounts');
  }

  /**
   * Get a specific account by ID
   */
  async getAccountById(accountId: string): Promise<ApiResponse<Account>> {
    return this.makeRequest<Account>(`/user/accounts/${accountId}`);
  }

  /**
   * Create a new account (DJ or Bar)
   */
  async createAccount(accountData: CreateAccountRequestData): Promise<ApiResponse<Account>> {
    const formData = new FormData();

    // Add type
    formData.append('type', accountData.type);
    formData.append('name', accountData.name);
    formData.append('email', accountData.email);

    // Add optional fields
    if (accountData.phone) formData.append('phone', accountData.phone);
    
    // Add avatar if provided
    if (accountData.avatar) {
      formData.append('avatar', {
        uri: accountData.avatar.uri,
        name: accountData.avatar.name,
        type: accountData.avatar.type,
      } as any);
    }

    // DJ specific fields
    if (accountData.type === 'dj') {
      if (accountData.djName) formData.append('djName', accountData.djName);
      if (accountData.genre) formData.append('genre', JSON.stringify(accountData.genre));
    }

    // Bar specific fields
    if (accountData.type === 'bar') {
      if (accountData.barName) formData.append('barName', accountData.barName);
      if (accountData.address) formData.append('address', accountData.address);
      if (accountData.description) formData.append('description', accountData.description);
    }

    return this.makeRequest<Account>('/user/accounts', {
      method: 'POST',
      body: formData,
      headers: {
        // Remove Content-Type to let browser set it with boundary for FormData
      } as any,
    });
  }

  /**
   * Switch to another account
   */
  async switchAccount(data: SwitchAccountRequestData): Promise<ApiResponse<Account>> {
    return this.makeRequest<Account>('/user/accounts/switch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete an account
   */
  async deleteAccount(accountId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/user/accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get current active account
   */
  async getCurrentAccount(): Promise<ApiResponse<Account>> {
    return this.makeRequest<Account>('/user/accounts/current');
  }
}