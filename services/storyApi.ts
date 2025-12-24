import { CreateStoryData, StoryData, StoryViewersResponse } from "@/types/storyType";
import { API_CONFIG } from "./apiConfig";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class StoryApiService {
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
          'Content-Type': 'application/json',
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

  /**
   * Lấy danh sách stories
   */
  async getStories(
    entityAccountId: string,
    page: number = 1,
    limit: number = 10,
    excludeViewed: boolean = true
  ): Promise<ApiResponse<StoryData[]>> {
    return this.makeRequest<StoryData[]>(
      `/stories?entityAccountId=${entityAccountId}&page=${page}&limit=${limit}&excludeViewed=${excludeViewed}`
    );
  }

  /**
   * Tạo story mới
   */
  async createStory(storyData: CreateStoryData): Promise<ApiResponse<StoryData>> {
    const formData = new FormData();

    if (storyData.content) {
      formData.append('content', storyData.content);
    }

    if (storyData.songId) {
      formData.append('songId', storyData.songId);
    }

    if (storyData.expiredAt) {
      formData.append('expiredAt', storyData.expiredAt);
    }
    if (storyData.status){
        formData.append('status', storyData.status);
    }

    if (storyData.image) {
      formData.append('images', storyData.image);
    }

    if (storyData.entityAccountId) {
        formData.append('entityAccountId', storyData.entityAccountId);
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/stories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Create story failed');
      }

      return data;
    } catch (error) {
      console.error('Create Story Error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Đánh dấu story đã xem
   */
  async markStoryAsViewed(
    storyId: string,
    entityAccountId: string
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/stories/${storyId}/view`, {
      method: 'POST',
      body: JSON.stringify({ entityAccountId }),
    });
  }

  /**
   * Đánh dấu nhiều stories đã xem
   */
  async markMultipleStoriesAsViewed(
    storyIds: string[],
    entityAccountId: string
  ): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/stories/view', {
      method: 'POST',
      body: JSON.stringify({ storyIds, entityAccountId }),
    });
  }

  /**
   * Lấy danh sách story đã xem
   */
  async getViewedStoryIds(entityAccountId: string): Promise<ApiResponse<string[]>> {
    return this.makeRequest<string[]>(`/stories/viewed?entityAccountId=${entityAccountId}`);
  }

  /**
   * Lấy danh sách người xem story
   */
  async getStoryViewers(storyId: string): Promise<ApiResponse<StoryViewersResponse>> {
    return this.makeRequest<StoryViewersResponse>(`/stories/${storyId}/viewers`);
  }

  /**
   * Like story
   */
  async likeStory(
    storyId: string,
    entityAccountId: string
  ): Promise<ApiResponse<{ liked: boolean }>> {
    return this.makeRequest<{ liked: boolean }>(`/stories/${storyId}/like`, {
      method: 'POST',
      body: JSON.stringify({
        typeRole: 'Account',
        entityAccountId,
      }),
    });
  }

  /**
   * Unlike story
   */
  async unlikeStory(
    storyId: string,
    entityAccountId: string
  ): Promise<ApiResponse<{ liked: boolean }>> {
    return this.makeRequest<{ liked: boolean }>(`/stories/${storyId}/like`, {
      method: 'DELETE',
      body: JSON.stringify({
        typeRole: 'Account',
        entityAccountId,
      }),
    });
  }

  /**
   * Lấy chi tiết story
   */
  async getStoryDetail(storyId: string): Promise<ApiResponse<StoryData>> {
    return this.makeRequest<StoryData>(`/stories/${storyId}`);
  }

  /**
   * Xóa story
   */
  async deleteStory(storyId: string): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/stories/${storyId}`, {
      method: 'DELETE',
    });
  }
}