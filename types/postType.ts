import { CommentData } from "./commentType";

export interface Like {
  accountId: string;
  TypeRole: string; // ví dụ: 'Account'
}

export interface PostData {
  _id: string;
  accountId: string;
  entityAccountId: string;
  entityId: string;
  entityType: string; // "Account" hoặc các loại khác
  barId: string | null;
  content: string;
  images: string; // nếu nhiều ảnh, có thể đổi thành string[]
  type: string; // "post"
  expiredAt: string | null;
  musicId: string | null;
  songId: string | null;
  mediaIds: string[];
  trendingScore: number;
  views: number;
  shares: number;
  repostedFromId: string | null;
  status: string; // "active"
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
  comments: Record<string, CommentData>;
}
