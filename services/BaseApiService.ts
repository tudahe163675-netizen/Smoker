import { API_CONFIG } from "./apiConfig";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

export class BaseApiService {
  protected token: string;

  constructor(token: string) {
    this.token = token;
  }

  protected async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const { headers = {}, ...restOptions } = options;
      
      // Không set Content-Type mặc định nếu body là FormData
      const isFormData = options.body instanceof FormData;
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        headers: {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          Authorization: `Bearer ${this.token}`,
          ...headers,
        },
        ...restOptions,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "API request failed");
      }

      // Handle response format giống web: có thể là { status: 'success', data: ... } hoặc trực tiếp data
      // Nếu response có status và data, trả về format chuẩn
      if (data.status === 'success' && data.data !== undefined) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Success',
        };
      }
      
      // Nếu response trực tiếp là data (không có wrapper)
      return {
        success: true,
        data: data.data || data,
        message: data.message || 'Success',
      };
    } catch (error) {
      console.error("API Error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}