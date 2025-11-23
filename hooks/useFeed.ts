import { CreatePostData, Post } from '@/constants/feedData';
import { FeedApiService } from '@/services/feedApi';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './useAuth';

export const useFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { authState } = useAuth();

  const token = authState.token;

  const feedApi = new FeedApiService(token!!);

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
        console.warn('Failed to fetch posts:', response.message);
        setError(response.message);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Không thể tải bài viết');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const createPost = async (postData: CreatePostData): Promise<boolean> => {
    try {
      setUploading(true);
      
      // Bước 1: Upload media nếu có
      let uploadedMediaUrls: string[] = [];
      
      if (postData.files && postData.files.length > 0) {
        console.log('Uploading media files...');
        const uploadResponse = await feedApi.uploadPostMedia(postData.files);
        
        if (uploadResponse.success && uploadResponse.data) {
          uploadedMediaUrls = uploadResponse.data.map(item => item.secure_url || item.url);
          console.log('Media uploaded successfully:', uploadedMediaUrls);
        } else {
          Alert.alert('Lỗi', 'Không thể tải lên media');
          setUploading(false);
          return false;
        }
      }

      // Bước 2: Tạo object cho API theo đúng format
      const createPostPayload: any = {
        title: postData.content.substring(0, 50) || "Bài viết mới", // Lấy 50 ký tự đầu làm title
        content: postData.content,
        type: "post" as const,
        entityType: "Account" as const,
        entityAccountId: authState.currentId, // ID của user hiện tại
      };

      // Thêm images nếu có ảnh - phải là OBJECT không phải string
      if (uploadedMediaUrls.length > 0 && postData.files?.some(f => f.type === 'image')) {
        const imageUrls = uploadedMediaUrls.filter((_, idx) => postData.files![idx].type === 'image');
        createPostPayload.images = imageUrls.reduce((acc, url, idx) => {
          acc[`img_${idx + 1}`] = { url, caption: '' };
          return acc;
        }, {} as Record<string, { url: string; caption: string }>);
      }

      // Thêm videos nếu có video
      if (uploadedMediaUrls.length > 0 && postData.files?.some(f => f.type === 'video')) {
        const videoUrls = uploadedMediaUrls.filter((_, idx) => postData.files![idx].type === 'video');
        createPostPayload.videos = videoUrls.reduce((acc, url, idx) => {
          acc[`video_${idx + 1}`] = { url, caption: '' };
          return acc;
        }, {} as Record<string, { url: string; caption: string }>);
      }

      // Bước 3: Tạo bài viết
      console.log('Creating post with payload:', createPostPayload);
      const response = await feedApi.createPost(createPostPayload);
      
      if (response.success && response.data) {
        // API trả về { post: {...}, medias: [...] }
        // Cần merge medias vào post để hiển thị đúng
        const newPost = response.data.post || response.data;
        
        // Nếu có medias array, convert sang format images/videos
        if (response.data.medias && response.data.medias.length > 0) {
          const imageMedias = response.data.medias.filter((m: any) => m.type === 'image');
          const videoMedias = response.data.medias.filter((m: any) => m.type === 'video');
          
          if (imageMedias.length > 0) {
            newPost.images = imageMedias.reduce((acc: any, media: any, idx: number) => {
              acc[`img_${idx + 1}`] = { url: media.url, caption: media.caption || '' };
              return acc;
            }, {});
          }
          
          if (videoMedias.length > 0) {
            newPost.videos = videoMedias.reduce((acc: any, media: any, idx: number) => {
              acc[`video_${idx + 1}`] = { url: media.url, caption: media.caption || '' };
              return acc;
            }, {});
          }
        }
        
        // Cập nhật danh sách bài viết ngay lập tức
        setPosts(prev => [newPost, ...prev]);
        setUploading(false);
        return true;
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể tạo bài viết');
        setUploading(false);
        return false;
      }
    } catch (err) {
      console.error('Error creating post:', err);
      Alert.alert('Lỗi', 'Không thể tạo bài viết');
      setUploading(false);
      return false;
    }
  };

  const refresh = useCallback(() => {
    fetchPosts(1, true);
  }, [fetchPosts]);

  const likePost = useCallback(async (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        const isLiked = !!authState.currentId && !!Object.values(post.likes || {}).find(
          like => like.accountId === authState.currentId
        );

        const updatedLikes = { ...post.likes };
        if (isLiked) {
          // unlike
          for (const key in updatedLikes) {
            if (updatedLikes[key].accountId === authState.currentId) {
              delete updatedLikes[key];
            }
          }
        } else {
          // like
          const newKey = Math.random().toString(36).substring(2, 15);
          updatedLikes[newKey] = {
            accountId: authState.currentId!,
            TypeRole: 'Account',
          };
        }

        return post._id === postId ? { ...post, likes: updatedLikes } : post;
      })
    );

    try {
      const response = await feedApi.likePost(postId);

      if (!response.success) {
        refresh();
      }
    } catch (err) {
      console.error('Error liking post:', err);
      refresh(); // revert
    }
  }, [authState.currentId, feedApi, refresh]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPosts(page + 1, false);
    }
  }, [loading, hasMore, page, fetchPosts]);

  useEffect(() => {
    fetchPosts(1, false);
  }, [fetchPosts]);

  return {
    posts,
    loading,
    refreshing,
    error,
    hasMore,
    uploading,
    fetchPosts,
    createPost,
    likePost,
    loadMore,
    refresh,
  };
};