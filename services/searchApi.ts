import { API_CONFIG } from './apiConfig';

export interface SearchUser {
  id: string;
  name: string;
  avatar: string | null;
  type: string;
  isFollowing?: boolean;
  raw?: any;
}

export interface SearchPost {
  id: string;
  _id?: string;
  [key: string]: any;
}

export interface SearchResult {
  users: SearchUser[];
  bars: SearchUser[];
  djs: SearchUser[];
  dancers: SearchUser[];
  posts: SearchPost[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export class SearchApiService {
  private token: string | null;

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
      console.error('Search API Error:', error);
      throw error;
    }
  }

  private normalizeUser(item: any): SearchUser {
    return {
      id: item.EntityAccountId || item.id || item.AccountId || '',
      name: item.name || item.BarName || item.userName || item.email || 'Unknown',
      avatar: item.avatar || item.Avatar || null,
      type: item.type || 'Unknown',
      raw: item,
    };
  }

  async searchAll(query: string, limit: number = 5): Promise<SearchResult> {
    if (!query || !String(query).trim()) {
      return {
        users: [],
        bars: [],
        djs: [],
        dancers: [],
        posts: [],
      };
    }

    try {
      const response = await this.makeRequest<SearchResult>(
        `/search/all?q=${encodeURIComponent(query.trim())}&limit=${limit}`
      );

      if (response.success && response.data) {
        const data = response.data;
        
        // Normalize users
        const normalizeArray = (arr: any[] = []) => 
          arr.map(item => this.normalizeUser(item)).filter(item => item.id);

        // Ensure posts is an array
        let postsArray: SearchPost[] = [];
        if (Array.isArray(data.posts)) {
          postsArray = data.posts;
        } else if (data.posts && typeof data.posts === 'object') {
          postsArray = Object.values(data.posts);
        }

        return {
          users: normalizeArray(data.users),
          bars: normalizeArray(data.bars),
          djs: normalizeArray(data.djs),
          dancers: normalizeArray(data.dancers),
          posts: postsArray,
        };
      }

      return {
        users: [],
        bars: [],
        djs: [],
        dancers: [],
        posts: [],
      };
    } catch (error) {
      console.error('Error searching:', error);
      return {
        users: [],
        bars: [],
        djs: [],
        dancers: [],
        posts: [],
      };
    }
  }
}

export const createSearchService = (token: string | null = null) => {
  return new SearchApiService(token);
};

