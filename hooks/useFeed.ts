import { FeedApiService } from '@/services/feedApi';
import { CreatePostData, PostData } from '@/types/postType';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './useAuth';

export const useFeed = () => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
        setHasMore(response.data.length === 10);
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
      setUploadProgress(10); // Bắt đầu
      
      // Bước 1: Upload media nếu có
      let uploadedMediaMap: Array<{ url: string; type: 'image' | 'video' }> = [];
      
      if (postData.files && postData.files.length > 0) {
        setUploadProgress(30);
        
        const uploadResponse = await feedApi.uploadPostMedia(postData.files);
        
        if (uploadResponse.success && uploadResponse.data) {
          // Map đúng file với URL đã upload dựa trên index
          uploadedMediaMap = postData.files.map((file, index) => ({
            url: uploadResponse.data![index]?.secure_url || uploadResponse.data![index]?.url || '',
            type: file.type
          }));
          setUploadProgress(60);
        } else {
          Alert.alert('Lỗi', uploadResponse.message || 'Không thể tải lên media');
          setUploading(false);
          setUploadProgress(0);
          return false;
        }
      } else {
        setUploadProgress(60);
      }

      // Bước 2: Tạo object cho API theo đúng format
      const createPostPayload: any = {
        content: postData.content,
        type: "post" as const,
        status: 'public',
        entityAccountId: authState.EntityAccountId,
      };

      // Thêm images nếu có ảnh
      const imageMedias = uploadedMediaMap.filter(item => item.type === 'image' && item.url);
      if (imageMedias.length > 0) {
        createPostPayload.images = imageMedias.reduce((acc, item, idx) => {
          acc[`img_${idx + 1}`] = { url: item.url, caption: '' };
          return acc;
        }, {} as Record<string, { url: string; caption: string }>);
      }

      // Thêm videos nếu có video
      const videoMedias = uploadedMediaMap.filter(item => item.type === 'video' && item.url);
      if (videoMedias.length > 0) {
        createPostPayload.videos = videoMedias.reduce((acc, item, idx) => {
          acc[`video_${idx + 1}`] = { url: item.url, caption: '' };
          return acc;
        }, {} as Record<string, { url: string; caption: string }>);
      }

      // Bước 3: Tạo bài viết
      setUploadProgress(80);
      
      const response = await feedApi.createPost(createPostPayload);
      
      if (response.success && response.data) {
        setUploadProgress(100);
        
        // ✅ API trả về { post: {...}, medias: [...] }
        const newPost = response.data.post || response.data;
        
        // ✅ Đảm bảo có id (nếu API trả về _id, map sang id)
        if (!newPost.id && newPost._id) {
          newPost.id = newPost._id;
        }
        
        // ✅ GÁN MEDIAS ARRAY TRỰC TIẾP
        if (response.data.medias && response.data.medias.length > 0) {
          newPost.medias = response.data.medias;
          newPost.mediaIds = response.data.medias; // Đảm bảo mediaIds cũng có
        } else {
          // Nếu không có medias từ response, tạo từ payload
          const tempMedias: any[] = [];
          
          if (createPostPayload.images) {
            Object.entries(createPostPayload.images).forEach(([key, value]: [string, any]) => {
              tempMedias.push({
                _id: `temp-${Date.now()}-${key}`,
                url: value.url,
                type: 'image',
                caption: value.caption || '',
                createdAt: new Date().toISOString(),
              });
            });
          }
          
          if (createPostPayload.videos) {
            Object.entries(createPostPayload.videos).forEach(([key, value]: [string, any]) => {
              tempMedias.push({
                _id: `temp-${Date.now()}-${key}`,
                url: value.url,
                type: 'video',
                caption: value.caption || '',
                createdAt: new Date().toISOString(),
              });
            });
          }
          
          newPost.medias = tempMedias;
          newPost.mediaIds = tempMedias;
        }
        
        // Đảm bảo có các field cần thiết
        if (!newPost.likes) newPost.likes = {};
        if (!newPost.comments) newPost.comments = {};
        
        // Đảm bảo có stats nếu chưa có
        if (!newPost.stats) {
          newPost.stats = {
            likeCount: 0,
            commentCount: 0,
            shareCount: 0,
            viewCount: 0,
            isLikedByMe: false
          };
        }
        
        // ✅ Thêm vào đầu danh sách posts
        setPosts(prev => [newPost, ...prev]);
        
        setUploading(false);
        setUploadProgress(0);
        return true;
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể tạo bài viết');
        setUploading(false);
        setUploadProgress(0);
        return false;
      }
    } catch (err) {
      console.error('Error creating post:', err);
      Alert.alert('Lỗi', 'Không thể tạo bài viết');
      setUploading(false);
      setUploadProgress(0);
      return false;
    }
  };

  const refresh = useCallback(() => {
    fetchPosts(1, true);
  }, [fetchPosts]);

  const likePost = useCallback(async (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        const postIdMatch = (post.id ?? post._id) === postId;
        if (!postIdMatch) return post;

        const currentIsLiked = post.stats?.isLikedByMe ?? (!!authState.currentId && !!Object.values(post.likes || {}).find(
          like => like.accountId === authState.currentId
        ));

        const updatedLikes = { ...post.likes };
        if (currentIsLiked) {
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

        return {
          ...post,
          stats: post.stats ? {
            ...post.stats,
            likeCount: currentIsLiked 
              ? Math.max(0, (post.stats.likeCount || 0) - 1)
              : (post.stats.likeCount || 0) + 1,
            isLikedByMe: !currentIsLiked
          } : {
            likeCount: currentIsLiked ? 0 : 1,
            commentCount: 0,
            shareCount: 0,
            viewCount: 0,
            isLikedByMe: !currentIsLiked
          },
          likes: updatedLikes
        };
      })
    );

    try {
      const response = await feedApi.likePost(postId);

      if (!response.success) {
        refresh();
      }
    } catch (err) {
      console.error('Error liking post:', err);
      refresh();
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
    uploadProgress, // ✅ Export progress
    fetchPosts,
    createPost,
    likePost,
    loadMore,
    refresh,
  };
};