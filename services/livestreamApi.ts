import { BaseApiService, ApiResponse } from './BaseApiService';

export interface Livestream {
  id: string;
  hostId: string;
  hostName?: string;
  hostAvatar?: string;
  title: string;
  description?: string;
  channelName: string;
  viewerToken?: string;
  status: 'live' | 'ended' | 'scheduled';
  viewerCount: number;
  startedAt?: string;
  endedAt?: string;
  pinnedComment?: string;
  thumbnail?: string;
}

export interface ScheduledLivestream {
  id: string;
  hostId: string;
  hostName?: string;
  hostAvatar?: string;
  title: string;
  description?: string;
  scheduledStartTime: string;
  status: 'scheduled' | 'active' | 'cancelled';
  settings?: {
    allowComments?: boolean;
    allowLikes?: boolean;
    isPublic?: boolean;
  };
}

export interface CreateLivestreamData {
  title: string;
  description?: string;
  pinnedComment?: string;
}

export interface CreateScheduledLivestreamData {
  title: string;
  description?: string;
  scheduledStartTime: string;
  settings?: {
    allowComments?: boolean;
    allowLikes?: boolean;
    isPublic?: boolean;
  };
}

class LivestreamApiService extends BaseApiService {
  constructor(token: string) {
    super(token);
  }

  async startLivestream(data: CreateLivestreamData): Promise<ApiResponse<Livestream>> {
    return this.makeRequest<Livestream>('/livestream/start', {
      method: 'POST',
      body: JSON.stringify({
        title: data.title,
        description: data.description || '',
        pinnedComment: data.pinnedComment || null,
      }),
    });
  }

  async endLivestream(livestreamId: string): Promise<ApiResponse<Livestream>> {
    return this.makeRequest<Livestream>(`/livestream/${livestreamId}/end`, {
      method: 'POST',
    });
  }

  async getLivestream(livestreamId: string): Promise<ApiResponse<Livestream>> {
    return this.makeRequest<Livestream>(`/livestream/${livestreamId}`, {
      method: 'GET',
    });
  }

  async getStreamByChannel(channelName: string): Promise<ApiResponse<Livestream>> {
    return this.makeRequest<Livestream>(`/livestream/channel/${channelName}`, {
      method: 'GET',
    });
  }

  async getActiveLivestreams(): Promise<ApiResponse<Livestream[]>> {
    const response = await this.makeRequest<{ data?: Livestream[] } | Livestream[]>('/livestream/active', {
      method: 'GET',
    });

    // Handle different response formats
    if (response.success) {
      if (Array.isArray(response.data)) {
        return { ...response, data: response.data };
      }
      if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
        return { ...response, data: response.data.data };
      }
    }

    return { ...response, data: [] };
  }

  async incrementViewCount(livestreamId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>(`/livestream/${livestreamId}/view`, {
      method: 'POST',
    });
  }

  async getLivestreamsByHost(hostId: string, limit: number = 20): Promise<ApiResponse<Livestream[]>> {
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit.toString());

    return this.makeRequest<Livestream[]>(`/livestream/host/${hostId}?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  async createScheduledLivestream(
    data: CreateScheduledLivestreamData
  ): Promise<ApiResponse<ScheduledLivestream>> {
    return this.makeRequest<ScheduledLivestream>('/livestream/schedule', {
      method: 'POST',
      body: JSON.stringify({
        title: data.title,
        description: data.description || '',
        scheduledStartTime: data.scheduledStartTime,
        settings: data.settings || {},
      }),
    });
  }

  async getScheduledLivestreams(): Promise<ApiResponse<ScheduledLivestream[]>> {
    const response = await this.makeRequest<{ data?: ScheduledLivestream[] } | ScheduledLivestream[]>(
      '/livestream/scheduled',
      {
        method: 'GET',
      }
    );

    // Handle different response formats
    if (response.success) {
      if (Array.isArray(response.data)) {
        return { ...response, data: response.data };
      }
      if (response.data && 'data' in response.data && Array.isArray(response.data.data)) {
        return { ...response, data: response.data.data };
      }
    }

    return { ...response, data: [] };
  }

  async cancelScheduledLivestream(livestreamId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>(`/livestream/scheduled/${livestreamId}`, {
      method: 'DELETE',
    });
  }

  async activateScheduledLivestream(livestreamId: string): Promise<ApiResponse<Livestream>> {
    return this.makeRequest<Livestream>(`/livestream/scheduled/${livestreamId}/activate`, {
      method: 'POST',
    });
  }
}

export const createLivestreamApi = (token: string) => new LivestreamApiService(token);

