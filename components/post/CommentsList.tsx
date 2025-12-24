import { CommentData, ReplyData } from '@/types/commentType';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {formatTime} from "@/utils/extension";

interface CommentsListProps {
  comments: CommentData[];
  onUserPress: (userId: string) => void;
  onLikeComment: (commentId: string) => void;
  onReply?: (commentId: string, replyId?: string, authorName?: string) => void;
  onLikeReply?: (commentId: string, replyId: string) => void;
}

export const CommentsList: React.FC<CommentsListProps> = ({
  comments,
  onUserPress,
  onLikeComment,
  onReply,
  onLikeReply,
}) => {

  const ReplyItem = ({ reply, commentId }: { reply: ReplyData, commentId: string }) => {
    const replyAuthor = reply.author || { name: 'Người dùng', avatar: null, entityAccountId: null };
    
    return (
      <View style={styles.replyItem}>
        <TouchableOpacity onPress={() => replyAuthor.entityAccountId && onUserPress(replyAuthor.entityAccountId)}>
          <Image 
            source={{ uri: replyAuthor.avatar || 'https://i.pravatar.cc/100?img=10' }} 
            style={styles.replyAvatar} 
          />
        </TouchableOpacity>

        <View style={styles.replyContent}>
          <View style={styles.replyBubble}>
            <TouchableOpacity onPress={() => replyAuthor.entityAccountId && onUserPress(replyAuthor.entityAccountId)}>
              <Text style={styles.replyUserName}>{replyAuthor.name}</Text>
            </TouchableOpacity>
            {reply.replyToId ? (
              <Text style={styles.replyToText}>Trả lời {replyAuthor.name}</Text>
            ) : null}
            <Text style={styles.replyText}>{reply.content || ''}</Text>
          </View>

        <View style={styles.replyActions}>
          <Text style={styles.replyTime}>{formatTime(reply.createdAt)}</Text>

          <TouchableOpacity
            style={styles.replyLikeBtn}
            onPress={() => onLikeReply && onLikeReply(commentId, reply.id)}
          >
            <Ionicons
              name={reply.stats.isLikedByMe ? "heart" : "heart-outline"}
              size={14}
              color={reply.stats.isLikedByMe ? "#ef4444" : "#6b7280"}
            />

            {reply.stats.likeCount > 0 ? (
              <Text style={styles.replyLikeText}>
                {reply.stats.likeCount}
              </Text>
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.replyReplyBtn}
            onPress={() => onReply && onReply(commentId, reply.id, replyAuthor.name)}
          >
            <Text style={styles.replyReplyText}>Trả lời</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
    );
  };

  const CommentItem = ({ comment }: { comment: CommentData }) => {
    const commentId = comment.id || comment._id || '';
    const likeCount = comment.stats?.likeCount ?? 0;
    const isLiked = comment.stats?.isLikedByMe ?? false;
    const replyCount = comment.stats?.replyCount ?? 0;
    const commentAuthor = comment.author || { name: 'Người dùng', avatar: null, entityAccountId: null };

    return (
      <View style={styles.commentItem}>
        <TouchableOpacity onPress={() => commentAuthor.entityAccountId && onUserPress(commentAuthor.entityAccountId)}>
          <Image 
            source={{ uri: commentAuthor.avatar || 'https://i.pravatar.cc/100?img=10' }} 
            style={styles.commentAvatar} 
          />
        </TouchableOpacity>

        <View style={styles.commentContent}>
          <View style={styles.commentBubble}>
            <TouchableOpacity onPress={() => commentAuthor.entityAccountId && onUserPress(commentAuthor.entityAccountId)}>
              <Text style={styles.commentUserName}>{commentAuthor.name}</Text>
            </TouchableOpacity>
            <Text style={styles.commentText}>{comment.content || ''}</Text>
          </View>

          <View style={styles.commentActions}>
            <Text style={styles.commentTime}>{formatTime(comment.createdAt)}</Text>

            <TouchableOpacity
              style={styles.commentLikeBtn}
              onPress={() => onLikeComment(commentId)}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={14}
                color={isLiked ? "#ef4444" : "#6b7280"}
              />

              {likeCount > 0 ? (
                <Text style={styles.commentLikeText}>
                  {likeCount}
                </Text>
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.commentReplyBtn}
              onPress={() => onReply && onReply(commentId, undefined, commentAuthor.name)}
            >
              <Text style={styles.commentReplyText}>Trả lời</Text>
            </TouchableOpacity>
          </View>

          {comment.replies && comment.replies.length > 0 ? (
            <View style={styles.repliesContainer}>
              {comment.replies.map((reply) => (
                <ReplyItem key={reply.id} reply={reply} commentId={commentId} />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.commentsSection}>
      <Text style={styles.commentsSectionTitle}>
        Bình luận ({comments.length})
      </Text>

      {comments.map((comment) => {
        const commentId = comment.id || comment._id || '';
        return (
          <CommentItem key={commentId} comment={comment} />
        );
      })}

      {comments.length === 0 && (
        <View style={styles.noCommentsContainer}>
          <Ionicons name="chatbubble-outline" size={48} color="#d1d5db" />
          <Text style={styles.noCommentsText}>Chưa có bình luận nào</Text>
          <Text style={styles.noCommentsSubtext}>Hãy là người đầu tiên bình luận!</Text>
        </View>
      )}
    </View>
  );
};

export const styles = StyleSheet.create({
  commentsSection: {
    backgroundColor: '#fff',
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  commentTime: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 16,
  },
  commentLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  commentLikeText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  commentReplyBtn: {
    paddingVertical: 2,
  },
  commentReplyText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noCommentsText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    fontWeight: '500',
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  repliesContainer: {
    marginTop: 8,
    paddingLeft: 24,
  },
  replyItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  replyContent: {
    flex: 1,
  },
  replyBubble: {
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 4,
  },
  replyUserName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  replyToText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  replyTime: {
    fontSize: 11,
    color: '#6b7280',
    marginRight: 12,
  },
  replyLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  replyLikeText: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 4,
  },
  replyReplyBtn: {
    paddingVertical: 2,
  },
  replyReplyText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
});
