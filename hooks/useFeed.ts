// hooks/useFeed.ts
import { CreatePostData, mockPosts, Post } from '@/constants/feedData';
import { feedApi } from '@/services/feedApi';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export const useFeed = () => {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await feedApi.getFeedPosts(pageNum);
      
      if (response.success && response.data) {
        if (refresh || pageNum === 1) {
          setPosts(response.data);
        } else {
          setPosts(prev => [...prev, ...response.data!]);
        }
        setPage(pageNum);
        setHasMore(response.data.length === 10); // Assuming 10 is the limit
      } else {
        // Fallback to mock data
        console.warn('Failed to fetch posts, using mock data:', response.message);
        if (refresh || pageNum === 1) {
          setPosts(mockPosts);
        }
        setError(response.message);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      if (refresh || pageNum === 1) {
        setPosts(mockPosts); // Fallback to mock data
      }
      setError('Không thể tải bài viết');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const createPost = async (postData: CreatePostData): Promise<boolean> => {
    try {
      const response = await feedApi.createPost(postData);
      
      if (response.success && response.data) {
        setPosts(prev => [response.data!, ...prev]);
        return true;
      } else {
        // Fallback to local creation
        const newPost: Post = {
          id: Date.now().toString(),
          userId: '10', // Current user ID
          user: {
            id: '10',
            name: 'Bạn',
            username: '@me',
            avatar: 'https://i.pravatar.cc/100?img=10',
            followers: 1250,
            following: 356,
            posts: 42,
          },
          content: postData.content,
          images: postData.images,
          likes: 0,
          isLiked: false,
          comments: [],
          commentsCount: 0,
          shares: 0,
          createdAt: new Date().toISOString(),
          location: postData.location,
        };
        
        setPosts(prev => [newPost, ...prev]);
        Alert.alert('Cảnh báo', 'Bài viết được lưu offline. Sẽ đồng bộ khi có kết nối.');
        return false;
      }
    } catch (err) {
      console.error('Error creating post:', err);
      Alert.alert('Lỗi', 'Không thể tạo bài viết');
      return false;
    }
  };

  const likePost = async (postId: string): Promise<void> => {
    // Optimistic update
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
          : post
      )
    );

    try {
      const response = await feedApi.likePost(postId);
      
      if (!response.success) {
        // Revert optimistic update
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1
              }
              : post
          )
        );
      }
    } catch (err) {
      console.error('Error liking post:', err);
      // Revert optimistic update
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1
            }
            : post
        )
      );
    }
  };

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPosts(page + 1, false);
    }
  }, [loading, hasMore, page, fetchPosts]);

  const refresh = useCallback(() => {
    fetchPosts(1, true);
  }, [fetchPosts]);

  useEffect(() => {
    fetchPosts(1, false);
  }, [fetchPosts]);

  return {
    posts,
    loading,
    refreshing,
    error,
    hasMore,
    fetchPosts,
    createPost,
    likePost,
    loadMore,
    refresh,
  };
};