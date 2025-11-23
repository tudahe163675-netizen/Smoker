import { ProfileApiService } from '@/services/profileApi';
import { UploadFile, UserProfileData } from '@/types/profileType';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './useAuth';

type FieldValue = string | UploadFile;

export const useProfile = (userId: string) => {
  const [profile, setProfile] = useState<UserProfileData>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { authState } = useAuth();
  const token = authState.token;
  const profileApi = new ProfileApiService(token!!);

  const fetchProfile = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await profileApi.getUserProfile();

      if (response.data) {
        setProfile(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Cập nhật các trường text
  const updateProfileField = async (field: string, value: string): Promise<boolean> => {
    try {
      const updates: any = {};

      // Map field names từ UI sang API
      const fieldMapping: { [key: string]: string } = {
        'name': 'userName',
        'bio': 'bio',
        'phone': 'phone',
      };

      const apiField = fieldMapping[field] || field;
      updates[apiField] = value;

      const response = await profileApi.updateProfile(updates);

      if (response.data) {
        setProfile(response.data);
        return true;
      } else {
        Alert.alert('Cảnh báo', 'Cập nhật offline. Thay đổi sẽ được đồng bộ khi có kết nối.');
        return false;
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      Alert.alert('Cảnh báo', 'Cập nhật offline. Thay đổi sẽ được đồng bộ khi có kết nối.');
      return false;
    }
  };

  // Cập nhật avatar hoặc cover image
  const updateProfileImage = async (type: 'avatar' | 'coverImage', imageUri: string): Promise<boolean> => {
    try {
      const uploadFile: UploadFile = {
        uri: imageUri,
        name: `${type}_${Date.now()}.jpg`,
        type: 'image/jpeg',
      };

      const updates: any = {};

      // Map type sang field name
      if (type === 'avatar') {
        updates.avatar = uploadFile;
      } else {
        updates.background = uploadFile; // API dùng 'background' cho cover image
      }

      const response = await profileApi.updateProfile(updates);

      if (response.data) {
        setProfile(response.data);
        return true;
      } else {
        Alert.alert('Cảnh báo', 'Cập nhật ảnh offline. Ảnh sẽ được tải lên khi có kết nối.');
        return false;
      }
    } catch (err) {
      console.error('Error updating image:', err);
      Alert.alert('Cảnh báo', 'Cập nhật ảnh offline. Ảnh sẽ được tải lên khi có kết nối.');
      return false;
    }
  };

  const refreshBalance = async (): Promise<void> => {
    // Implement nếu cần
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