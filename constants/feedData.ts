import { CommentData } from "@/types/commentType";

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  coverImage?: string;
  bio?: string;
  followers: number;
  following: number;
  posts: number;
  isFollowing?: boolean;
  website?: string;
  tiktok?: string;
  facebook?: string;
  instagram?: string;
}

export interface Like {
  accountId: string;
  TypeRole: string;
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
  _id: string;
  // userId: string;
  // user: User;
  content: string;
  images: string;
  likes: Record<string, Like>;
  // isLiked: boolean;
  comments: Record<string, CommentData>;
  // commentsCount: number;
  // shares: number;
  createdAt: string;
  // location?: string;
  authorAvatar: string;
  accountId: string;
  authorName: string
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