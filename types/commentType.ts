export interface CommentLike {
  [likeId: string]: {
    accountId: string;
    TypeRole: string;
  };
}

export interface CommentReply {
  [replyId: string]: CommentData;
}

export interface ReplyData {
  id: string;
  content: string;
  author: {
    entityAccountId: string | null;
    entityId: string | null;
    entityType: string | null;
    name: string;
    avatar: string | null;
  };
  stats: {
    likeCount: number;
    isLikedByMe: boolean;
  };
  replyToId?: string;
  createdAt: string;
}

export interface CommentData {
  _id?: string;
  id?: string;
  accountId?: string;
  entityAccountId?: string;
  entityId?: string;
  entityType?: string;
  content: string;
  likes?: CommentLike;
  replies: ReplyData[];
  images?: string;
  typeRole?: string;
  createdAt: string;
  updatedAt?: string;
  author: {
    entityAccountId: string | null;
    entityId: string | null;
    entityType: string | null;
    name: string;
    avatar: string | null;
  };
  stats?: {
    likeCount: number;
    replyCount: number;
    isLikedByMe: boolean;
  };
}

// Nếu muốn map theo comment _id:
export type CommentsMap = Record<string, CommentData>;
