import { Comment, CreateCommentData, mockComments, mockPosts, Post } from '@/constants/feedData';
import { useCallback, useEffect, useState } from 'react';
import { feedApi } from '../services/feedApi';

export const usePostDetails = (postId: string) => {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPostDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [postResponse, commentsResponse] = await Promise.all([
        feedApi.getPostDetails(postId),
        feedApi.getPostComments(postId)
      ]);
      
      if (postResponse.success && postResponse.data) {
        setPost(postResponse.data);
      } else {
        // Fallback to mock data
        const mockPost = mockPosts.find(p => p.id === postId);
        if (mockPost) {
          setPost(mockPost);
        } else {
          setError('Không tìm thấy bài viết');
        }
      }

      if (commentsResponse.success && commentsResponse.data) {
        setComments(commentsResponse.data);
      } else {
        // Fallback to mock comments
        setComments(mockComments);
      }
    } catch (err) {
      console.error('Error fetching post details:', err);
      const mockPost = mockPosts.find(p => p.id === postId);
      if (mockPost) {
        setPost(mockPost);
        setComments(mockComments);
      } else {
        setError('Không thể tải bài viết');
      }
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const addComment = async (commentData: CreateCommentData): Promise<boolean> => {
    try {
      const response = await feedApi.createComment(commentData);
      
      if (response.success && response.data) {
        setComments(prev => [response.data!, ...prev]);
        setPost(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
        return true;
      } else {
        // Fallback to local creation
        const newComment: Comment = {
          id: Date.now().toString(),
          userId: '10',
          user: {
            id: '10',
            name: 'Bạn',
            username: '@me',
            avatar: 'https://i.pravatar.cc/100?img=10',
            followers: 1250,
            following: 356,
            posts: 42,
          },
          content: commentData.content,
          createdAt: new Date().toISOString(),
          likes: 0,
          isLiked: false,
        };
        
        setComments(prev => [newComment, ...prev]);
        setPost(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
        return false;
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      return false;
    }
  };

  const likeComment = async (commentId: string): Promise<void> => {
    // Optimistic update
    setComments(prevComments =>
      prevComments.map(comment =>
        comment.id === commentId
          ? {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
          }
          : comment
      )
    );

    try {
      const response = await feedApi.likeComment(commentId);
      
      if (!response.success) {
        // Revert optimistic update
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === commentId
              ? {
                ...comment,
                isLiked: !comment.isLiked,
                likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
              }
              : comment
          )
        );
      }
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  // Thêm function likePost
  const likePost = async (): Promise<void> => {
    if (!post) return;

    // Optimistic update
    setPost(prevPost => {
      if (!prevPost) return prevPost;
      return {
        ...prevPost,
        isLiked: !prevPost.isLiked,
        likes: prevPost.isLiked ? prevPost.likes - 1 : prevPost.likes + 1,
      };
    });

    try {
      const response = await feedApi.likePost(postId);
      
      if (!response.success) {
        // Revert nếu API fail
        setPost(prevPost => {
          if (!prevPost) return prevPost;
          return {
            ...prevPost,
            isLiked: !prevPost.isLiked,
            likes: prevPost.isLiked ? prevPost.likes - 1 : prevPost.likes + 1,
          };
        });
      }
    } catch (err) {
      console.error('Error liking post:', err);
      // Revert nếu có lỗi
      setPost(prevPost => {
        if (!prevPost) return prevPost;
        return {
          ...prevPost,
          isLiked: !prevPost.isLiked,
          likes: prevPost.isLiked ? prevPost.likes - 1 : prevPost.likes + 1,
        };
      });
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
    fetchPostDetails,
    addComment,
    likeComment,
    likePost, // Export function
  };
};