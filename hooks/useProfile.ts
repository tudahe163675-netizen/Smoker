import { mockUserProfile, UserProfile } from '@/constants/profileData';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { profileApi } from '../services/profileApi';

export const useProfile = (userId: string) => {
  const [profile, setProfile] = useState<UserProfile>(mockUserProfile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await profileApi.getUserProfile(userId);
      
      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        // Fallback to mock data if API fails
        console.warn('Failed to fetch profile, using mock data:', response.message);
        setProfile(mockUserProfile);
        setError(response.message);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(mockUserProfile); // Fallback to mock data
      setError('Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateProfileField = async (field: string, value: string): Promise<boolean> => {
    try {
      const response = await profileApi.updateProfile(userId, { field, value });
      
      if (response.success && response.data) {
        setProfile(response.data);
        return true;
      } else {
        // Fallback to local update if API fails
        setProfile(prev => ({ ...prev, [field]: value }));
        Alert.alert('Cảnh báo', 'Cập nhật offline. Thay đổi sẽ được đồng bộ khi có kết nối.');
        return false;
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      // Still update locally for better UX
      setProfile(prev => ({ ...prev, [field]: value }));
      Alert.alert('Cảnh báo', 'Cập nhật offline. Thay đổi sẽ được đồng bộ khi có kết nối.');
      return false;
    }
  };

  const updateProfileImage = async (type: 'avatar' | 'cover', imageUri: string): Promise<boolean> => {
    try {
      const response = await profileApi.updateProfileImage(userId, type, imageUri);
      
      if (response.success && response.data) {
        setProfile(prev => ({
          ...prev,
          [type === 'avatar' ? 'avatar' : 'coverImage']: response.data!.imageUrl,
        }));
        return true;
      } else {
        // Fallback to local update with original URI
        setProfile(prev => ({
          ...prev,
          [type === 'avatar' ? 'avatar' : 'coverImage']: imageUri,
        }));
        Alert.alert('Cảnh báo', 'Cập nhật ảnh offline. Ảnh sẽ được tải lên khi có kết nối.');
        return false;
      }
    } catch (err) {
      console.error('Error updating image:', err);
      // Still update locally for better UX
      setProfile(prev => ({
        ...prev,
        [type === 'avatar' ? 'avatar' : 'coverImage']: imageUri,
      }));
      Alert.alert('Cảnh báo', 'Cập nhật ảnh offline. Ảnh sẽ được tải lên khi có kết nối.');
      return false;
    }
  };

  const refreshBalance = async (): Promise<void> => {
    try {
      const response = await profileApi.getUserBalance(userId);
      
      if (response.success && response.data) {
        setProfile(prev => ({
          ...prev,
          balance: response.data!.balance,
        }));
      }
    } catch (err) {
      console.error('Error refreshing balance:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfileField,
    updateProfileImage,
    refreshBalance,
  };
};
