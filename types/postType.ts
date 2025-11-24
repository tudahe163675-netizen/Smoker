export interface Like {
  accountId: string;
  TypeRole: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  followers: number;
  following: number;
  posts: number;
}

export interface Comment {
  id: string;
  userId: string;
  user: User;
  content: string;
  likes: number;
  isLiked: boolean;
  createdAt: string;
}

export interface MediaItem {
  _id: string;
  id?: string;
  postId?: string;
  accountId?: string;
  entityAccountId?: string;
  entityId?: string;
  entityType?: string;
  url: string;
  type: 'image' | 'video';
  caption: string;
  comments?: Record<string, any>;
  likes?: Record<string, any>;
  shares?: number;
  createdAt: string;
  updatedAt?: string;
  uploadDate?: string;
  __v?: number;
}

export interface PostData {
  _id: string;
  accountId: string;
  entityAccountId: string;
  entityId: string;
  entityType: string;
  barId: string | null;
  title?: string;
  content: string;
  images?: string | Record<string, { url: string; caption: string }>; // Có thể là string hoặc object
  videos?: Record<string, { url: string; caption: string }>;
  type: string;
  expiredAt: string | null;
  musicId: string | null;
  songId: string | null;
  mediaIds: MediaItem[]; // Array of media objects, không phải string[]
  medias?: MediaItem[]; // Medias array từ API
  trendingScore: number;
  views: number;
  shares: number;
  repostedFromId: string | null;
  status: string;
  trashedAt: string | null;
  trashedBy: string | null;
  audioDuration: number | null;
  audioStartOffset: number | null;
  createdAt: string;
  updatedAt: string;
  __v: number;

  // Author info
  authorName: string;
  authorAvatar: string;
  authorEntityName: string;
  authorEntityAvatar: string;
  authorEntityType: string;
  authorEntityId: string;
  authorEntityAccountId: string;

  // Likes & comments
  likes: Record<string, Like>;
  comments: Record<string, Comment>;
}

export interface CreatePostData {
  content: string;
  files?: { uri: string; type: 'image' | 'video' }[];
  images?: Record<string, { url: string; caption: string }>;
  videos?: Record<string, { url: string; caption: string }>;
  audios?: Record<string, { url: string; thumbnail: string; artist: string }>;
  musicTitle?: string;
  artistName?: string;
  description?: string;
  hashTag?: string;
  musicPurchaseLink?: string;
  musicBackgroundImage?: string;
  type?: "post" | "story";
  songId?: string;
  musicId?: string;
  entityAccountId?: string;
  entityId?: string;
  entityType?: "Account" | "BusinessAccount" | "BarPage";
}

export interface CreateCommentData {
  content: string;
  parentId?: string;
}