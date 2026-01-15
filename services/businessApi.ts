import { API_CONFIG } from "./apiConfig";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export interface UpdateBusinessRequestData {
  userName?: string;
  bio?: string;
  phone?: string;
  address?: string;  // JSON string format
  gender?: string;
  pricePerHours?: number | string;
  pricePerSession?: number | string;
}

export class BusinessApiService {
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
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
          ...(options.headers || {}),
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update business account (DJ/Dancer) profile
   * @param entityAccountId - The entityAccountId of the business account
   * @param data - Update data
   */
  async updateBusiness(
    entityAccountId: string,
    data: UpdateBusinessRequestData
  ): Promise<ApiResponse<any>> {
    // Convert pricePerHours and pricePerSession to numbers if they are strings
    const payload: any = { ...data };
    if (payload.pricePerHours !== undefined) {
      payload.pricePerHours = typeof payload.pricePerHours === 'string' 
        ? parseFloat(payload.pricePerHours) || 0 
        : payload.pricePerHours;
    }
    if (payload.pricePerSession !== undefined) {
      payload.pricePerSession = typeof payload.pricePerSession === 'string'
        ? parseFloat(payload.pricePerSession) || 0
        : payload.pricePerSession;
    }

    // Remove empty fields
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
        delete payload[key];
      }
    });

    return this.makeRequest<any>(`/business/${entityAccountId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Get business account by ID
   */
  async getBusinessById(businessId: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/business/${businessId}`);
  }

  /**
   * Get all businesses by account ID
   */
  async getBusinessesByAccountId(accountId: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/business/all-businesses/${accountId}`);
  }
}



