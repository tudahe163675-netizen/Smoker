import { StoryApiService } from '@/services/storyApi';
import { CreateStoryData, StoryData } from '@/types/storyType';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './useAuth';

export const useStory = () => {
  const [stories, setStories] = useState<StoryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { authState } = useAuth();

  const token = authState.token;
  const entityAccountId = authState.EntityAccountId;
  const storyApi = new StoryApiService(token!!);

  /**
   * Lấy danh sách stories
   */
  const fetchStories = useCallback(async (refresh: boolean = false) => {
    if (!entityAccountId) {
      console.warn('EntityAccountId is missing');
      return;
    }

    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Không exclude viewed stories để user có thể xem lại
      const response = await storyApi.getStories(entityAccountId, 1, 50, false);
      
      if (response.success && response.data) {
        // Đánh dấu story nào là của mình
        const storiesWithOwner = response.data.map(story => ({
          ...story,
          isOwner: story.entityAccountId === entityAccountId
        }));
        
        setStories(storiesWithOwner);
      } else {
        console.warn('Failed to fetch stories:', response.message);
        setError(response.message);
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError('Không thể tải stories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authState.EntityAccountId]);

  /**
   * Tạo story mới
   */
  const createStory = async (storyData: CreateStoryData): Promise<boolean> => {
    try {
      setUploading(true);
      setUploadProgress(30);
      
      const response = await storyApi.createStory(storyData);
      
      if (response.success && response.data) {
        setUploadProgress(100);
        
        // Reset uploading state
        setUploading(false);
        setUploadProgress(0);
        
        await fetchStories(true);
        
        return true;
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể tạo story');
        setUploading(false);
        setUploadProgress(0);
        return false;
      }
    } catch (err) {
      console.error('Error creating story:', err);
      Alert.alert('Lỗi', 'Không thể tạo story');
      setUploading(false);
      setUploadProgress(0);
      return false;
    }
  };

  /**
   * Like/Unlike story
   */
  const likeStory = useCallback(async (storyId: string) => {
    if (!entityAccountId) return;

    // Optimistic update
    setStories(prevStories =>
      prevStories.map(story => {
        if (story._id !== storyId) return story;

        const isLiked = !!Object.values(story.likes || {}).find(
          like => like.entityAccountId === entityAccountId
        );

        const updatedLikes = { ...story.likes };
        if (isLiked) {
          for (const key in updatedLikes) {
            if (updatedLikes[key].entityAccountId === entityAccountId) {
              delete updatedLikes[key];
            }
          }
        } else {
          const newKey = Math.random().toString(36).substring(2, 15);
          updatedLikes[newKey] = {
            accountId: entityAccountId,
            entityAccountId: entityAccountId,
            TypeRole: 'Account',
          };
        }

        return { ...story, likes: updatedLikes };
      })
    );

    try {
      const story = stories.find(s => s._id === storyId);
      const isLiked = !!story && !!Object.values(story.likes || {}).find(
        like => like.entityAccountId === entityAccountId
      );

      const response = isLiked
        ? await storyApi.unlikeStory(storyId, entityAccountId)
        : await storyApi.likeStory(storyId, entityAccountId);

      if (!response.success) {
        // Revert on error
        fetchStories(true);
      }
    } catch (err) {
      console.error('Error liking story:', err);
      fetchStories(true);
    }
  }, [entityAccountId, stories, storyApi, fetchStories]);

  /**
   * Đánh dấu story đã xem
   */
  const markAsViewed = useCallback(async (storyId: string) => {
    if (!entityAccountId) return;

    try {
      await storyApi.markStoryAsViewed(storyId, entityAccountId);
      
      // Update local state
      setStories(prevStories =>
        prevStories.map(story =>
          story._id === storyId ? { ...story, viewed: true } : story
        )
      );
    } catch (err) {
      console.error('Error marking story as viewed:', err);
    }
  }, [entityAccountId, storyApi]);

  /**
   * Xóa story
   */
  const deleteStory = useCallback(async (storyId: string): Promise<boolean> => {
    try {
      const response = await storyApi.deleteStory(storyId);
      
      if (response.success) {
        setStories(prev => prev.filter(s => s._id !== storyId));
        return true;
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể xóa story');
        return false;
      }
    } catch (err) {
      console.error('Error deleting story:', err);
      Alert.alert('Lỗi', 'Không thể xóa story');
      return false;
    }
  }, [storyApi]);

  /**
   * Refresh stories
   */
  const refresh = useCallback(() => {
    fetchStories(true);
  }, [fetchStories]);

  useEffect(() => {
    if (entityAccountId) {
      fetchStories(false);
    }
  }, [entityAccountId, fetchStories]);

  return {
    stories,
    loading,
    refreshing,
    error,
    uploading,
    uploadProgress,
    createStory,
    likeStory,
    markAsViewed,
    deleteStory,
    refresh,
  };
};