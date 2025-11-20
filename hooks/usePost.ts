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

  const fetchPostDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const postResponse = await feedApi.getPostDetails(postId);

      if (postResponse.success && postResponse.data) {
        setPost(postResponse.data);
      } else {
        setError('Không tìm thấy bài viết');
      }

      if (postResponse.success && postResponse.data?.comments) {
        const commentList = Object.values(postResponse.data.comments);
        setComments(commentList);
      }
    } catch (err) {
      console.error('Error fetching post details:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

const addComment = async (content: string) => {
  if (!post || !authState.currentId) return false;
  console.log('post.entityId>>>', post.entityId);
  console.log('post.post.entityType>>>', post.entityType);

  const commentData: CreateCommentData = {
    content,
    accountId: authState.currentId!!,
    entityAccountId: authState.EntityAccountId!!,
    entityId: post.entityId,
    entityType: post.entityType,
  };

  try {
    const response = await feedApi.createComment(commentData, post._id);

    if (response.success && response.data) {
      // Lấy comment mới nhất từ post.comments
      const commentsMap = response.data.comments;
      const newCommentId = Object.keys(commentsMap).pop(); // lấy comment cuối cùng
      const newComment = commentsMap![newCommentId!];

      // Cập nhật post.comments
      setPost(prevPost => prevPost ? {
        ...prevPost,
        comments: {
          ...prevPost.comments,
          [newComment._id]: newComment
        }
      } : null);

      return true;
    }
    return false;
  } catch (err) {
    console.error('Error adding comment:', err);
    return false;
  }
};


  const likeComment = async (commentId: string)=> {
    // setComments(prevComments =>
    //   prevComments.map(comment =>
    //     comment.id === commentId
    //       ? {
    //         ...comment,
    //         isLiked: !comment.isLiked,
    //         likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
    //       }
    //       : comment
    //   )
    // );

    // try {
    //   const response = await feedApi.likeComment(commentId);

    //   if (!response.success) {
    //     // Revert optimistic update
    //     setComments(prevComments =>
    //       prevComments.map(comment =>
    //         comment.id === commentId
    //           ? {
    //             ...comment,
    //             isLiked: !comment.isLiked,
    //             likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
    //           }
    //           : comment
    //       )
    //     );
    //   }
    // } catch (err) {
    //   console.error('Error liking comment:', err);
    // }
  };

const likePost = useCallback(async () => {
  if (!post) return;

  const currentUserId = authState.currentId;
  if (!currentUserId) return;

  // Tính trạng thái đã like hay chưa
  const isLiked = !!Object.values(post.likes || {}).find(
    like => like.accountId === currentUserId
  );

  // Optimistic update: cập nhật UI ngay
  setPost(prevPost => {
    if (!prevPost) return prevPost;

    const updatedLikes = { ...prevPost.likes };
    if (isLiked) {
      // unlike
      for (const key in updatedLikes) {
        if (updatedLikes[key].accountId === currentUserId) {
          delete updatedLikes[key];
        }
      }
    } else {
      // like
      const newKey = Math.random().toString(36).substring(2, 15); // key tạm thời
      updatedLikes[newKey] = {
        accountId: currentUserId,
        TypeRole: 'Account',
      };
    }

    return { ...prevPost, likes: updatedLikes };
  });

  // Gọi API
  try {
    const response = await feedApi.likePost(postId);
    if (!response.success) {
      // revert nếu API fail
      fetchPostDetails();
    }
  } catch (err) {
    console.error('Error liking post:', err);
    fetchPostDetails(); // revert
  }
}, [post, authState.currentId, feedApi, fetchPostDetails, postId]);

  const updatePost = async (postId: string, data: { content: string }): Promise<boolean> => {
    try {
      const response = await feedApi.updatePost(postId, data);

      if (response.success && response.data) {
        setPost(prevPost => prevPost ? { ...prevPost, content: response.data!.content } : null);
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
  };
};