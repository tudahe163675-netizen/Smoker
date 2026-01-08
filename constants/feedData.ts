import { CommentData } from "@/types/commentType";
import { AnonymousIdentityMap, Author, Like, MediaItem, OriginalPost, PostStats, TopComment } from "@/types/postType";

export interface User {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  coverImage?: string;
  bio?: string;
  followers: number;
  following: number;
  posts: number;
  isFollowing?: boolean;
  role?: string;
  website?: string;
  tiktok?: string;
  facebook?: string;
  instagram?: string;
  entityAccountId: string;
  type: string;
  targetId?: string;
  background?: string;
}

export interface Comment {
  id: string;
  userId: string;
  user: User;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

export interface Post {
  // Primary ID (new format)
  id?: string;
  // Legacy ID (backward compatibility)
  _id?: string;

  content: string;
  images?: string;

  // Stats (new format)
  stats?: PostStats;
  // Legacy likes & comments (backward compatibility)
  likes?: Record<string, Like>;
  comments?: Record<string, CommentData>;

  createdAt: string;

  // Author info (new format)
  author?: Author;
  // Legacy author info (backward compatibility)
  authorAvatar?: string;
  accountId?: string;
  authorName?: string;

  // Media
  mediaIds?: MediaItem[];
  medias?: MediaItem[];

  // Top comments (new format)
  topComments?: TopComment[];

  // Original post for reposts
  originalPost?: OriginalPost;

  // Anonymous identity map
  anonymousIdentityMap?: AnonymousIdentityMap;
}

export interface CreatePostData {
  content: string;
  images: string[];
  location?: string;
}

export interface CreateCommentData {
  accountId: string;
  content: string;
  entityAccountId: string;
  entityId: string;
  entityType: string;
}

export interface UserPost {
  id: string;
  name: string;
  avatar: string;
  role: string;
  type: string;
  EntityAccountId: string;
}