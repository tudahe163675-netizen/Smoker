export interface StoryData {
  _id: string;
  entityAccountId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  images?: string;
  videos?: string;
  songId?: {
    _id: string;
    title: string;
    artistName: string;
  };
  songFilename?: string;
  audioUrl?: string;
  mediaIds?: Array<{
    _id: string;
    url: string;
    type: 'image' | 'video';
    caption?: string;
    createdAt: string;
  }>;
  likes?: {
    [key: string]: {
      accountId: string;
      entityAccountId: string;
      TypeRole: string;
    };
  };
  viewed: boolean;
  isOwner?: boolean; // Thêm field để xác định story của mình
  expiredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoryData {
  content?: string;
  songId?: string;
  expiredAt?: string;
  image?: string
  entityAccountId: string;
  status: string;
}

export interface StoryViewer {
  entityAccountId: string;
  name: string;
  avatar: string;
  viewedAt: string;
}

export interface StoryViewersResponse {
  data: StoryViewer[];
  totalLikes: number;
  totalViews: number;
}