import { Post } from "@/constants/feedData";
import { FeedApiService } from "@/services/feedApi";
import { ProfileApiService } from '@/services/profileApi';
import { UploadFile, UserProfileData } from '@/types/profileType';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './useAuth';
import { Role } from "@/constants/authData";

type FieldValue = string | UploadFile;

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfileData>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const { authState, updateAuthState } = useAuth();
  const token = authState.token;
  const profileApi = new ProfileApiService(token!!);
  const feedApi = new FeedApiService(token!!);

  const fetchProfile = useCallback(async () => {
    if (!token) return;


    setLoading(true);
    setError(null);

    try {
      const userId = authState.EntityAccountId!;
      const [postsResponse, followersResponse, followingResponse] = await Promise.all([
        feedApi.getUserPosts(userId),
        feedApi.getFollowers(userId),
        feedApi.getFollowing(userId)
      ]);
      if (followingResponse?.data) {
        setFollowing(followingResponse.data);
      }
      if (followersResponse?.data) {
        setFollowers(followersResponse.data);
      }
      // Use /profile/{id} to get full profile (includes DJ/Dancer pricing)
      const response = await feedApi.getViewInformation(userId);

      if (response.data) {
        const data = response.data;

        const mappedProfile: UserProfileData = {
          id: (data as any).entityAccountId || (data as any).entityId || (data as any).id || userId,
          entityAccountId: (data as any).entityAccountId || (data as any).entityId || (data as any).id || userId,
          targetId: (data as any).targetId || (data as any).targetID || undefined,
          type: (data as any).type || (data as any).Type || undefined,
          email: (data as any).email || (data as any)?.contact?.email || '',
          userName: (data as any).userName || (data as any).name || '',
          role: ((data as any).role || 'USER') as Role,
          avatar: (data as any).avatar || '',
          background: (data as any).background || '',
          coverImage: '',
          phone: (data as any).phone || (data as any)?.contact?.phone || (data as any)?.phoneNumber || '',
          address: (data as any).address || (data as any)?.contact?.address || '',
          provinceId: (data as any).provinceId || (data as any)?.addressData?.provinceId || undefined,
          districtId: (data as any).districtId || (data as any)?.addressData?.districtId || undefined,
          wardId: (data as any).wardId || (data as any)?.addressData?.wardId || undefined,
          addressDetail: (data as any).addressDetail || (data as any)?.addressData?.detail || undefined,
          addressObject: (data as any).addressObject || (data as any).addressData || undefined,
          addressData: null,
          bio: (data as any).bio || '',
          gender: (data as any).gender ?? null,
          pricePerHours: (data as any).pricePerHours ?? (data as any).PricePerHours ?? (data as any)?.BusinessAccount?.pricePerHours ?? (data as any)?.businessAccount?.pricePerHours ?? null,
          pricePerSession: (data as any).pricePerSession ?? (data as any).PricePerSession ?? (data as any)?.BusinessAccount?.pricePerSession ?? (data as any)?.businessAccount?.pricePerSession ?? null,
          status: 'active',
          createdAt: '',
        };

        setProfile(mappedProfile);
      } else {
        setError(response.message);
      }
      if (postsResponse.data) {
        setPosts(postsResponse.data);
      }
    } catch (err) {
      setError('Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  }, [token, authState.EntityAccountId]);

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
        if (type === 'avatar') {
          updateAuthState({
            avatar: response.data.avatar,
          });
        }
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

  const setFullProfile = (newProfile: UserProfileData) => {
    setLoading(false)

    setProfile(prev => ({
      ...prev,
      ...newProfile,
    }));
    setLoading(true)
  };


  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    posts,
    followers,
    following,
    loading,
    error,
    fetchProfile,
    updateProfileField,
    updateProfileImage,
    refreshBalance,
    setFullProfile
  };
};