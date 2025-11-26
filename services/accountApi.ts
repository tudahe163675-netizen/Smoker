import { Account, AccountType, CreateAccountRequestData, Role, SwitchAccountRequestData } from "@/types/accountType";
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
      // Check if body is FormData
      const isFormData = options.body instanceof FormData;
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.token}`,
        ...(!isFormData && { 'Content-Type': 'application/json' }), // Only add Content-Type if NOT FormData
        ...(options.headers as Record<string, string>),
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message || 'Success',
      };
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
   * Transform API response to match UI expectations
   */
  private transformAccount(account: Account): Account {
    const roleToType: Record<Role, AccountType> = {
      [Role.CUSTOMER]: 'personal',
      [Role.DJ]: 'dj',
      [Role.BAR_OWNER]: 'bar',
      [Role.DANCER]: 'dancer',
    };

    const roleLabels: Record<Role, string> = {
      [Role.CUSTOMER]: 'Cá nhân',
      [Role.DJ]: 'DJ',
      [Role.BAR_OWNER]: 'Quán Bar',
      [Role.DANCER]: 'Vũ công',
    };

    return {
      ...account,
      id: account.BussinessAccountId,
      name: account.UserName,
      type: roleToType[account.Role],
      typeLabel: roleLabels[account.Role],
      isActive: account.Status === 'active',
    };
  }

  /**
   * Get all business accounts of the current user
   */
  async getAccounts(accountId: string): Promise<ApiResponse<Account[]>> {
    const response = await this.makeRequest<Account[]>(
      `/business/all-businesses/${accountId}`
    );

    if (response.success && response.data) {
      // Transform accounts to match UI expectations
      const transformedAccounts = response.data.map(acc => this.transformAccount(acc));
      return {
        ...response,
        data: transformedAccounts,
      };
    }

    return response;
  }

  /**
   * Get a specific account by ID
   */
  async getAccountById(businessAccountId: string): Promise<ApiResponse<Account>> {
    const response = await this.makeRequest<Account>(
      `/business/${businessAccountId}`
    );

    if (response.success && response.data) {
      return {
        ...response,
        data: this.transformAccount(response.data),
      };
    }

    return response;
  }

  /**
   * Create a new account (DJ, Bar, or Dancer)
   */
  async createAccount(accountData: CreateAccountRequestData): Promise<ApiResponse<Account>> {
    const formData = new FormData();

    // Map AccountType to Role
    const typeToRole: Record<AccountType, string> = {
      'personal': Role.CUSTOMER,
      'dj': Role.DJ,
      'bar': Role.BAR_OWNER,
      'dancer': Role.DANCER,
    };

    // Add required fields
    formData.append('Role', typeToRole[accountData.type]);
    formData.append('UserName', accountData.name);
    formData.append('Phone', accountData.phone || '');
    
    // Add optional fields
    if (accountData.gender) formData.append('Gender', accountData.gender);
    if (accountData.address) formData.append('Address', accountData.address);
    if (accountData.bio) formData.append('Bio', accountData.bio);
    
    // Add avatar if provided
    if (accountData.avatar) {
      formData.append('Avatar', {
        uri: accountData.avatar.uri,
        name: accountData.avatar.name,
        type: accountData.avatar.type,
      } as any);
    }

    // Add background if provided
    if (accountData.background) {
      formData.append('Background', {
        uri: accountData.background.uri,
        name: accountData.background.name,
        type: accountData.background.type,
      } as any);
    }

    // DJ/Dancer specific fields
    if (accountData.type === 'dj' || accountData.type === 'dancer') {
      if (accountData.pricePerHours) {
        formData.append('PricePerHours', accountData.pricePerHours.toString());
      }
      if (accountData.pricePerSession) {
        formData.append('PricePerSession', accountData.pricePerSession.toString());
      }
    }

    const response = await this.makeRequest<Account>('/business/create', {
      method: 'POST',
      body: formData,
      // No need to pass headers - makeRequest will handle it
    });

    if (response.success && response.data) {
      return {
        ...response,
        data: this.transformAccount(response.data),
      };
    }

    return response;
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
  async deleteAccount(businessAccountId: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/business/${businessAccountId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get current active account
   */
  async getCurrentAccount(): Promise<ApiResponse<Account>> {
    const response = await this.makeRequest<Account>('/user/accounts/current');
    
    if (response.success && response.data) {
      return {
        ...response,
        data: this.transformAccount(response.data),
      };
    }

    return response;
  }

  /**
   * Register as DJ business
   */
  async registerDJ(data: {
    ownerAccountId: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    bio?: string;
    gender?: string;
    pricePerHours?: number;
    pricePerSession?: number;
  }): Promise<ApiResponse<Account>> {
    // Build request data matching API format
    const requestData: any = {
      accountId: data.ownerAccountId,
      userName: data.name,
      phone: data.phone,
      address: data.address,
    };

    // Add optional fields only if they have values
    if (data.bio) requestData.bio = data.bio;
    if (data.gender) requestData.gender = data.gender;
    if (data.pricePerHours) requestData.pricePerHours = data.pricePerHours;
    if (data.pricePerSession) requestData.pricePerSession = data.pricePerSession;

    console.log('DJ Registration Request:', requestData);

    const response = await this.makeRequest<Account>('/business/register-dj', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    if (response.success && response.data) {
      return {
        ...response,
        data: this.transformAccount(response.data),
      };
    }

    return response;
  }

  /**
   * Register as Dancer business
   */
  async registerDancer(data: {
    ownerAccountId: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    bio?: string;
    gender?: string;
    pricePerHours?: number;
    pricePerSession?: number;
  }): Promise<ApiResponse<Account>> {
    // Build request data matching API format
    const requestData: any = {
      accountId: data.ownerAccountId,
      userName: data.name,
      phone: data.phone,
      address: data.address,
    };

    // Add optional fields only if they have values
    if (data.bio) requestData.bio = data.bio;
    if (data.gender) requestData.gender = data.gender;
    if (data.pricePerHours) requestData.pricePerHours = data.pricePerHours;
    if (data.pricePerSession) requestData.pricePerSession = data.pricePerSession;

    console.log('Dancer Registration Request:', requestData);

    const response = await this.makeRequest<Account>('/business/register-dancer', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    if (response.success && response.data) {
      return {
        ...response,
        data: this.transformAccount(response.data),
      };
    }

    return response;
  }

  /**
   * Upload avatar/background for business account
   */
  async uploadBusinessImages(
    businessId: string,
    data: {
      userName?: string;
      phone?: string;
      address?: string;
      bio?: string;
      gender?: string;
      pricePerHours?: number;
      pricePerSession?: number;
      addressData?: any;
      avatar?: {
        uri: string;
        name: string;
        type: string;
      };
      background?: {
        uri: string;
        name: string;
        type: string;
      };
    }
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();
    
    // Required field
    formData.append('entityId', businessId);

    // Optional text fields - only append if provided
    if (data.userName) formData.append('userName', data.userName);
    if (data.phone) formData.append('phone', data.phone);
    if (data.address) formData.append('address', data.address);
    if (data.bio) formData.append('bio', data.bio);
    if (data.gender) formData.append('gender', data.gender);
    if (data.pricePerHours) formData.append('pricePerHours', data.pricePerHours.toString());
    if (data.pricePerSession) formData.append('pricePerSession', data.pricePerSession.toString());
    if (data.addressData) formData.append('addressData', JSON.stringify(data.addressData));

    // Files
    if (data.avatar) {
      formData.append('avatar', {
        uri: data.avatar.uri,
        name: data.avatar.name,
        type: data.avatar.type,
      } as any);
    }

    if (data.background) {
      formData.append('background', {
        uri: data.background.uri,
        name: data.background.name,
        type: data.background.type,
      } as any);
    }

    console.log('Upload Business Images - entityId:', businessId);

    // makeRequest will automatically handle FormData and preserve Authorization
    return this.makeRequest<any>('/business/upload', {
      method: 'POST',
      body: formData,
      // No need to pass headers - makeRequest will handle it correctly
    });
  }
}