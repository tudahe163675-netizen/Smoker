import { CreateCommentData, CreatePostData, Post, User } from "@/constants/feedData";
import { CommentData } from "@/types/commentType";
import { PostData } from "@/types/postType";
import { API_CONFIG } from "./apiConfig";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export class FeedApiService {
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

  async getCurrentUserId(): Promise<ApiResponse<string>> {
    try {
      const response = await this.makeRequest<{ userId: string }>('/auth/current-user');
      if (response.success && response.data) {
        return { success: true, data: response.data.userId, message: 'Lấy user ID thành công' };
      }
      return { success: false, message: 'Không thể lấy user ID', error: 'No user ID found' };
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getFeedPosts(page: number = 1, limit: number = 10): Promise<ApiResponse<Post[]>> {
    return this.makeRequest<Post[]>(`/posts?page=${page}&limit=${limit}`);
  }

  async createPost(postData: CreatePostData): Promise<ApiResponse<Post>> {
    return this.makeRequest<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async likePost(postId: string): Promise<ApiResponse<{ liked: boolean; }>> {
    return this.makeRequest<{ liked: boolean; }>(`/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async getPostDetails(postId: string): Promise<ApiResponse<PostData>> {
    return this.makeRequest<PostData>(`/posts/${postId}`);
  }

  async updatePost(postId: string, postData: { content: string }): Promise<ApiResponse<Post>> {
    return this.makeRequest<Post>(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  }

  async deletePost(postId: string): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async getPostComments(postId: string): Promise<ApiResponse<Comment[]>> {
    return this.makeRequest<Comment[]>(`/posts/${postId}/comments`);
  }

  async createComment(commentData: CreateCommentData, postId: string): Promise<ApiResponse<CommentData>> {
    return this.makeRequest<CommentData>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  async likeComment(commentId: string): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
    return this.makeRequest<{ liked: boolean; likesCount: number }>(`/comments/${commentId}/like`, {
      method: 'POST',
    });
  }

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