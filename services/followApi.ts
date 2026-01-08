import { FollowUser, UserRole } from '@/constants/followData';
import { API_CONFIG } from './apiConfig';

interface ApiFollowingResponse {
  FollowId: string;
  FollowerId: string;
  FollowingId: string;
  FollowingType: string;
  CreatedAt: string;
  EntityAccountId: string;
  EntityType: string;
  EntityId: string;
  AccountId: string;
  UserName: string;
  Avatar: string;
  Role: string;
  IsFollowingByViewer?: number; // 1 if viewer is following this user, 0 otherwise
}

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export class FollowApiService {
  private readonly token: string | null;

  constructor(token: string | null = null) {
    this.token = token;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const existingHeaders = options.headers as Record<string, string> | undefined;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(existingHeaders || {}),
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('Follow API Error:', error);
      throw error;
    }
  }

  // Transform API response to FollowUser
  private transformToFollowUser(item: ApiFollowingResponse, currentUserId?: string, isFollowingList: boolean = false): FollowUser {
    // Map Role from API to UserRole enum
    let role: UserRole = UserRole.CUSTOMER;
    if (item.Role === 'DJ') {
      role = UserRole.DJ;
    } else if (item.Role === 'DANCER') {
      role = UserRole.DANCER;
    } else if (item.Role === 'customer') {
      role = UserRole.CUSTOMER;
    }

    // Determine isFollowing status
    // For following list: all are following (true)
    // For followers list: use IsFollowingByViewer from API (1/true = following, 0/false/null = not following)
    // Handle number, boolean, and null/undefined types
    // Note: For followers list, we also check follow status separately in useFollow hook
    // This is a fallback in case backend returns IsFollowingByViewer
    let isFollowing: boolean;
    if (isFollowingList) {
      // In following list, all users are being followed
      isFollowing = true;
    } else {
      // In followers list, check IsFollowingByViewer from API
      // Backend returns: 1 if viewer is following, 0 if not, or null/undefined if not authenticated
      const followingValue = item.IsFollowingByViewer;
      isFollowing = !!(followingValue === 1 || followingValue === true || followingValue === '1');
    }

    return {
      id: item.FollowId,
      userId: item.EntityAccountId,
      name: item.UserName || 'Người dùng',
      username: `@${item.UserName?.toLowerCase().replaceAll(/\s+/g, '') || 'user'}`,
      avatar: item.Avatar || 'https://i.pravatar.cc/150?img=10',
      bio: '', // API không trả về bio, có thể thêm sau
      role,
      isFollowing,
      isFollower: !isFollowingList, // Trong followers list, tất cả đều là follower
      mutualFollowers: undefined, // Có thể thêm sau nếu API hỗ trợ
    };
  }

  // Lấy danh sách followers
  async getFollowers(entityAccountId: string): Promise<FollowUser[]> {
    const response = await this.makeRequest<ApiFollowingResponse[]>(
      `/follow/followers/${entityAccountId}`
    );

    if (response.status === 'success' && response.data) {
      return response.data.map(item => this.transformToFollowUser(item, entityAccountId, false));
    }

    return [];
  }

  // Lấy danh sách following
  async getFollowing(entityAccountId: string): Promise<FollowUser[]> {
    const response = await this.makeRequest<ApiFollowingResponse[]>(
      `/follow/following/${entityAccountId}`
    );

    if (response.status === 'success' && response.data) {
      return response.data.map(item => this.transformToFollowUser(item, entityAccountId, true));
    }

    return [];
  }

  // Follow user
  async followUser(followerId: string, followingId: string, followingType: string = 'USER'): Promise<boolean> {
    try {
      console.log('[FollowApi] Following user:', { followerId, followingId, followingType });
      const response = await this.makeRequest<any>('/follow/follow', {
        method: 'POST',
        body: JSON.stringify({
          followerId,
          followingId,
          followingType,
        }),
      });
      console.log('[FollowApi] Follow response:', response);
      return response.status === 'success';
    } catch (error) {
      console.error('[FollowApi] Error following user:', error);
      return false;
    }
  }

  // Unfollow user
  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest<any>('/follow/unfollow', {
        method: 'POST',
        body: JSON.stringify({
          followerId,
          followingId,
        }),
      });
      return response.status === 'success';
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  }

  // Remove follower (có thể không có endpoint riêng, dùng unfollow)
  async removeFollower(entityAccountId: string, followerId: string): Promise<boolean> {
    // Nếu không có endpoint riêng, có thể dùng unfollow
    return this.unfollowUser(followerId, entityAccountId);
  }

  // Check if follower is following followingId
  async checkFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ isFollowing: boolean }>(
        `/follow/check?followerId=${followerId}&followingId=${followingId}`
      );
      return response.data?.isFollowing || false;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }
}

// Export singleton instance factory
export const createFollowService = (token: string | null = null) => {
  return new FollowApiService(token);
};