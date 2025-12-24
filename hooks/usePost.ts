import { CreateCommentData } from '@/constants/feedData';
import { FeedApiService } from '@/services/feedApi';
import { CommentData } from '@/types/commentType';
import { PostData } from '@/types/postType';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export const usePostDetails = (postId: string) => {
  const [post, setPost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { authState } = useAuth();

  const token = authState.token;

  const feedApi = new FeedApiService(token!!);

  const fetchPostDetails = useCallback(async (silent: boolean = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const postResponse = await feedApi.getPostDetails(postId);

      if (postResponse.success && postResponse.data) {
        setPost(postResponse.data);
        
        // Backend trả về comments là array trong DTO
        setComments(postResponse.data.comments || []);
      } else {
        setError('Không tìm thấy bài viết');
      }
    } catch (err) {
      console.error('Error fetching post details:', err);
      setError('Đã xảy ra lỗi khi tải bài viết');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [postId, token]);

  const addComment = async (content: string) => {
    if (!post || !authState.currentId) return false;

    const commentData: CreateCommentData = {
      content,
      accountId: authState.currentId!!,
      entityAccountId: authState.EntityAccountId!!,
      entityId: post.author?.entityId ?? post.entityId,
      entityType: post.author?.entityType ?? post.entityType,
    };

    try {
      const response = await feedApi.createComment(commentData, post.id ?? post._id);

      if (response.success && response.data) {
        setTimeout(() => {
          fetchPostDetails(true); // silent = true
        }, 100);

        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      return false;
    }
  };

  const likeComment = async (commentId: string) => {
    if (!post || !authState.currentId) return;

    const postId = post.id || post._id;
    if (!postId) return;

    // Optimistic update
    setComments(prevComments => {
      return prevComments.map(comment => {
        if ((comment.id || comment._id) === commentId) {
          const currentIsLiked = comment.stats?.isLikedByMe ?? false;
          return {
            ...comment,
            stats: {
              ...comment.stats,
              likeCount: currentIsLiked 
                ? Math.max(0, (comment.stats?.likeCount || 0) - 1)
                : (comment.stats?.likeCount || 0) + 1,
              isLikedByMe: !currentIsLiked,
              replyCount: comment.stats?.replyCount || 0,
            }
          };
        }
        return comment;
      });
    });

    try {
      const response = await feedApi.likeComment(postId, commentId);
      if (!response.success) {
        fetchPostDetails(true);
      }
    } catch (err) {
      console.error('Error liking comment:', err);
      fetchPostDetails(true);
    }
  };

  const addReply = async (commentId: string, replyId: string | undefined, content: string) => {
    if (!post || !authState.currentId || !authState.EntityAccountId) return false;

    const postId = post.id || post._id;
    if (!postId) return false;

    const replyData = {
      content,
      accountId: authState.currentId,
      entityAccountId: authState.EntityAccountId,
      entityId: post.author?.entityId || post.entityId,
      entityType: post.author?.entityType || post.entityType,
    };

    try {
      let response;
      if (replyId) {
        response = await feedApi.addReplyToReply(postId, commentId, replyId, replyData);
      } else {
        response = await feedApi.addReply(postId, commentId, replyData);
      }

      if (response.success) {
        setTimeout(() => {
          fetchPostDetails(true);
        }, 100);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error adding reply:', err);
      return false;
    }
  };

  const likeReply = async (commentId: string, replyId: string) => {
    if (!post || !authState.currentId) return;

    const postId = post.id || post._id;
    if (!postId) return;

    // Optimistic update
    setComments(prevComments => {
      return prevComments.map(comment => {
        if ((comment.id || comment._id) === commentId) {
          const updatedReplies = comment.replies.map(reply => {
            if (reply.id === replyId) {
              const currentIsLiked = reply.stats.isLikedByMe;
              return {
                ...reply,
                stats: {
                  likeCount: currentIsLiked 
                    ? Math.max(0, reply.stats.likeCount - 1)
                    : reply.stats.likeCount + 1,
                  isLikedByMe: !currentIsLiked,
                }
              };
            }
            return reply;
          });

          return {
            ...comment,
            replies: updatedReplies,
          };
        }
        return comment;
      });
    });

    try {
      const response = await feedApi.likeReply(postId, commentId, replyId);
      if (!response.success) {
        fetchPostDetails(true);
      }
    } catch (err) {
      console.error('Error liking reply:', err);
      fetchPostDetails(true);
    }
  };

  const updateReply = async (commentId: string, replyId: string, content: string): Promise<boolean> => {
    if (!post) return false;

    const postId = post.id || post._id;
    if (!postId) return false;

    try {
      const response = await feedApi.updateReply(postId, commentId, replyId, { content });
      if (response.success) {
        fetchPostDetails(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating reply:', err);
      return false;
    }
  };

  const deleteReply = async (commentId: string, replyId: string): Promise<boolean> => {
    if (!post) return false;

    const postId = post.id || post._id;
    if (!postId) return false;

    try {
      const response = await feedApi.deleteReply(postId, commentId, replyId);
      if (response.success) {
        fetchPostDetails(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting reply:', err);
      return false;
    }
  };

  const likePost = useCallback(async () => {
    if (!post) return;

    const currentUserId = authState.currentId;
    if (!currentUserId) return;

    // Tính trạng thái đã like hay chưa
    const currentIsLiked = post.stats?.isLikedByMe ?? !!Object.values(post.likes || {}).find(
      like => like.accountId === currentUserId
    );

    // Optimistic update: cập nhật UI ngay
    setPost(prevPost => {
      if (!prevPost) return prevPost;

      const updatedLikes = { ...prevPost.likes };
      if (currentIsLiked) {
        // unlike
        for (const key in updatedLikes) {
          if (updatedLikes[key].accountId === currentUserId) {
            delete updatedLikes[key];
          }
        }
      } else {
        // like
        const newKey = Math.random().toString(36).substring(2, 15);
        updatedLikes[newKey] = {
          accountId: currentUserId,
          TypeRole: 'Account',
        };
      }

      return {
        ...prevPost,
        stats: prevPost.stats ? {
          ...prevPost.stats,
          likeCount: currentIsLiked 
            ? Math.max(0, (prevPost.stats.likeCount || 0) - 1)
            : (prevPost.stats.likeCount || 0) + 1,
          isLikedByMe: !currentIsLiked
        } : {
          likeCount: currentIsLiked ? 0 : 1,
          commentCount: prevPost.stats?.commentCount ?? 0,
          shareCount: prevPost.stats?.shareCount ?? 0,
          viewCount: prevPost.stats?.viewCount ?? 0,
          isLikedByMe: !currentIsLiked
        },
        likes: updatedLikes
      };
    });

    // Gọi API
    try {
      const response = await feedApi.likePost(postId);
      if (!response.success) {
        // revert nếu API fail
        fetchPostDetails(true); // silent fetch
      }
    } catch (err) {
      console.error('Error liking post:', err);
      fetchPostDetails(true); // silent fetch
    }
  }, [post, authState.currentId, feedApi, fetchPostDetails, postId]);

  const updatePost = async (postId: string, data: { content: string }): Promise<boolean> => {
    try {
      const response = await feedApi.updatePost(postId, data);

      if (response.success && response.data) {
        setPost(prevPost => {
          if (!prevPost) return null;
          const updated = { ...prevPost, content: response.data!.content };
          // Ensure stats are preserved
          if (prevPost.stats) {
            updated.stats = prevPost.stats;
          }
          return updated;
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating post:', err);
      return false;
    }
  };

  const deletePost = async (postId: string): Promise<boolean> => {
    try {
      const response = await feedApi.deletePost(postId);

      if (response.success) {
        setPost(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting post:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [fetchPostDetails]);

  return {
    post,
    comments,
    loading,
    error,
    currentUserId,
    fetchPostDetails,
    addComment,
    likeComment,
    likePost,
    updatePost,
    deletePost,
    addReply,
    likeReply,
    updateReply,
    deleteReply,
  };
};