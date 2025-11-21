import { UpdateProfileRequestData, UserProfileData } from "@/types/profileType";
import { API_CONFIG } from "./apiConfig";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export class ProfileApiService {
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

  async getUserProfile(): Promise<ApiResponse<UserProfileData>> {
    return this.makeRequest<UserProfileData>('/user/me');
  }

  async updateProfile(updates: UpdateProfileRequestData): Promise<ApiResponse<UserProfileData>> {
    const formData = new FormData();

    // Thêm avatar nếu có
    if (updates.avatar) {
      formData.append("avatar", {
        uri: updates.avatar.uri,
        name: updates.avatar.name,
        type: updates.avatar.type,
      } as any);
    }

    // Thêm background (cover image) nếu có
    if (updates.background) {
      formData.append("background", {
        uri: updates.background.uri,
        name: updates.background.name,
        type: updates.background.type,
      } as any);
    }

    // Thêm các trường text
    if (updates.userName) formData.append("userName", updates.userName);
    if (updates.phone) formData.append("phone", updates.phone);
    if (updates.bio) formData.append("bio", updates.bio);

    return this.makeRequest<UserProfileData>(`/user/profile`, {
      method: "PUT",
      body: formData,
      // Không cần set Content-Type cho FormData, fetch sẽ tự động set
    });
  }
}