import { UserProfile } from "@/constants/profileData";

const API_BASE_URL = 'https://your-api-domain.com/api'; // Replace with your actual API URL

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

interface UpdateProfileRequest {
  field: string;
  value: string;
}

class ProfileApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // TODO: Add authentication token from storage/context
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

  private async getAuthToken(): Promise<string> {
    // TODO: Get token from secure storage or auth context
    // Example: await SecureStore.getItemAsync('auth_token');
    return 'your-auth-token-here';
  }

  async getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>(`/profile/${userId}`);
  }

  async updateProfile(
    userId: string, 
    updates: UpdateProfileRequest
  ): Promise<ApiResponse<UserProfile>> {
    return this.makeRequest<UserProfile>(`/profile/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async updateProfileImage(
    userId: string, 
    type: 'avatar' | 'cover',
    imageUri: string
  ): Promise<ApiResponse<{ imageUrl: string }>> {
    const formData = new FormData();
    
    // Convert image URI to blob for upload
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `${type}_${Date.now()}.jpg`,
    } as any);
    
    formData.append('type', type);

    return this.makeRequest<{ imageUrl: string }>(`/profile/${userId}/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }

  async getUserBalance(userId: string): Promise<ApiResponse<{ balance: number }>> {
    return this.makeRequest<{ balance: number }>(`/profile/${userId}/balance`);
  }
}

export const profileApi = new ProfileApiService();