import { CreateCommentData, Post } from '@/constants/feedData';
import { FeedApiService } from '@/services/feedApi';
import { CommentData } from '@/types/commentType';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export const usePostDetails = (postId: string) => {
  const [post, setPost] = useState<Post | null>(null);
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

  const addComment = async (commentData: CreateCommentData) => {
    try {
      const response = await feedApi.createComment(commentData);

      // if (response.success && response.data) {
      //   setComments(prev => [response.data!, ...prev]);
      //   setPost(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
      //   return true;
      // } else {
      //   // Fallback to local creation
      //   const newComment: Comment = {
      //     id: Date.now().toString(),
      //     userId: currentUserId || '10',
      //     user: {
      //       id: currentUserId || '10',
      //       name: 'Bạn',
      //       username: '@me',
      //       avatar: 'https://i.pravatar.cc/100?img=10',
      //       followers: 1250,
      //       following: 356,
      //       posts: 42,
      //     },
      //     content: commentData.content,
      //     createdAt: new Date().toISOString(),
      //     likes: 0,
      //     isLiked: false,
      //   };

      //   setComments(prev => [newComment, ...prev]);
      //   setPost(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
      //   return false;
      // }
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

  const likePost = async () => {
    // if (!post) return;

    // setPost(prevPost => {
    //   if (!prevPost) return prevPost;
    //   return {
    //     ...prevPost,
    //     isLiked: !prevPost.isLiked,
    //     likes: prevPost.isLiked ? prevPost.likes - 1 : prevPost.likes + 1,
    //   };
    // });

    // try {
    //   const response = await feedApi.likePost(postId);

    //   if (!response.success) {
    //     setPost(prevPost => {
    //       if (!prevPost) return prevPost;
    //       return {
    //         ...prevPost,
    //         isLiked: !prevPost.isLiked,
    //         likes: prevPost.isLiked ? prevPost.likes - 1 : prevPost.likes + 1,
    //       };
    //     });
    //   }
    // } catch (err) {
    //   console.error('Error liking post:', err);
    //   setPost(prevPost => {
    //     if (!prevPost) return prevPost;
    //     return {
    //       ...prevPost,
    //       isLiked: !prevPost.isLiked,
    //       likes: prevPost.isLiked ? prevPost.likes - 1 : prevPost.likes + 1,
    //     };
    //   });
    // }
  };

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