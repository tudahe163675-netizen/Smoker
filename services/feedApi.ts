import { CreateCommentData, CreatePostData, Post, User } from "@/constants/feedData";

const API_BASE_URL = 'https://your-api-domain.com/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

class FeedApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
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
    return 'your-auth-token-here';
  }

  // Feed APIs
  async getFeedPosts(page: number = 1, limit: number = 10): Promise<ApiResponse<Post[]>> {
    return this.makeRequest<Post[]>(`/feed?page=${page}&limit=${limit}`);
  }

  async createPost(postData: CreatePostData): Promise<ApiResponse<Post>> {
    return this.makeRequest<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async likePost(postId: string): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
    return this.makeRequest<{ liked: boolean; likesCount: number }>(`/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async getPostDetails(postId: string): Promise<ApiResponse<Post>> {
    return this.makeRequest<Post>(`/posts/${postId}`);
  }

  async getPostComments(postId: string): Promise<ApiResponse<Comment[]>> {
    return this.makeRequest<Comment[]>(`/posts/${postId}/comments`);
  }

  async createComment(commentData: CreateCommentData): Promise<ApiResponse<Comment>> {
    return this.makeRequest<Comment>('/comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  async likeComment(commentId: string): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
    return this.makeRequest<{ liked: boolean; likesCount: number }>(`/comments/${commentId}/like`, {
      method: 'POST',
    });
  }

  // User APIs
  async getUserProfile(userId: string): Promise<ApiResponse<User>> {
    return this.makeRequest<User>(`/users/${userId}`);
  }

  async getUserPosts(userId: string, page: number = 1): Promise<ApiResponse<Post[]>> {
    return this.makeRequest<Post[]>(`/users/${userId}/posts?page=${page}`);
  }

  async followUser(userId: string): Promise<ApiResponse<{ isFollowing: boolean }>> {
    return this.makeRequest<{ isFollowing: boolean }>(`/users/${userId}/follow`, {
      method: 'POST',
    });
  }

  // Upload image
  async uploadImage(imageUri: string): Promise<ApiResponse<{ imageUrl: string }>> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `image_${Date.now()}.jpg`,
    } as any);

    return this.makeRequest<{ imageUrl: string }>('/upload/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }
}

export const feedApi = new FeedApiService();