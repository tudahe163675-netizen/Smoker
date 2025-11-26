import { AuthState, Role } from '@/constants/authData';
import { fetchUserEntities, loginApi, upgradeRoleApi } from '@/services/authApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

export const useAuth = () => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userEmail: undefined,
    role: undefined,
    token: undefined,
    currentId: undefined,
    avatar: undefined,
    type: undefined,
    EntityAccountId: undefined,
  });

  // Load state login nếu user nhớ đăng nhập
  useEffect(() => {
    const loadAuthState = async () => {
      const savedEmail = await AsyncStorage.getItem('userEmail');
      const savedToken = await AsyncStorage.getItem('token');
      const savedRole = await AsyncStorage.getItem('role') as Role | null;
      const savedCurrentId = await AsyncStorage.getItem('currentId');
      const savedAvatar = await AsyncStorage.getItem('avatar');
      const savedType = await AsyncStorage.getItem('type');
      const savedEntityAccountId = await AsyncStorage.getItem('EntityAccountId');

      if (savedEmail && savedToken) {
        setAuthState({
          isAuthenticated: true,
          userEmail: savedEmail,
          token: savedToken,
          currentId: savedCurrentId || undefined,
          avatar: savedAvatar || undefined,
          type: savedType || undefined,
          EntityAccountId: savedEntityAccountId || undefined,
          role: savedRole || Role.CUSTOMER,
        });
      }
    };
    loadAuthState();
  }, []);


  const login = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const res = await loginApi(email, password);

      if (!res.token) {
        Alert.alert('Đăng nhập thất bại', res.message ?? 'Tên đăng nhập hoặc mật khẩu không đúng');
        return;
      }

      const token = res.token;
      const currentId = res.user.id;
      const role: Role = res.user?.role || Role.CUSTOMER;

      const entities = await fetchUserEntities(currentId, token);
      const mainEntity = entities[0];

      const avatar = mainEntity.avatar;
      const type = mainEntity.type;
      const EntityAccountId = mainEntity.EntityAccountId;

      const newAuth: AuthState = {
        isAuthenticated: true,
        userEmail: res.user.email,
        role,
        token,
        currentId,
        avatar,
        type,
        EntityAccountId,
      };

      setAuthState(newAuth);

      if (rememberMe) {
        await AsyncStorage.setItem('userEmail', res.user.email);
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('role', role);
        await AsyncStorage.setItem('currentId', currentId);
        if (avatar) await AsyncStorage.setItem('avatar', avatar);
        if (type) await AsyncStorage.setItem('type', type);
        if (EntityAccountId) await AsyncStorage.setItem('EntityAccountId', EntityAccountId);
      }

      router.replace('/(tabs)');

    } catch (error) {
      console.log(error);

      Alert.alert('Lỗi', 'Không thể kết nối đến server');
    }
  };

  const upgradeRole = async (newRole: Role) => {
    if (!authState.userEmail) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
      return;
    }
    try {
      const response = await upgradeRoleApi(authState.userEmail, newRole);
      if (response.success) {
        setAuthState((prev) => ({
          ...prev,
          role: response.data.newRole,
        }));
        await AsyncStorage.setItem('role', response.data.newRole);
        Alert.alert('Thành công', 'Vai trò đã được nâng cấp');
        router.replace('/(tabs)');
      } else {
        Alert.alert('Thất bại', response.message ?? 'Có lỗi xảy ra');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kết nối server');
    }
  };


  const logout = async () => {
    await AsyncStorage.multiRemove(['userEmail', 'token', 'role']);
    setAuthState({
      isAuthenticated: false,
      userEmail: undefined,
      role: undefined,
      token: undefined,
      currentId: undefined,
      type: undefined,
      avatar: undefined,
      EntityAccountId: undefined,
    });
    router.replace('/auth/login');
  };

  // hooks/useAuth.ts

const updateAuthState = async (
  updates: Partial<AuthState>,
  options?: { persist?: boolean }
) => {
  const shouldPersist = options?.persist ?? true;

  setAuthState((prev) => {
    const newState = { ...prev, ...updates };

    // Tự động lưu vào AsyncStorage nếu cần
    if (shouldPersist) {
      const savePromises = [];

      if (updates.userEmail !== undefined)
        savePromises.push(AsyncStorage.setItem('userEmail', updates.userEmail || ''));
      if (updates.token !== undefined)
        savePromises.push(AsyncStorage.setItem('token', updates.token || ''));
      if (updates.role !== undefined)
        savePromises.push(AsyncStorage.setItem('role', updates.role || Role.CUSTOMER));
      if (updates.currentId !== undefined)
        savePromises.push(AsyncStorage.setItem('currentId', updates.currentId || ''));
      if (updates.avatar !== undefined) {
        if (updates.avatar) {
          savePromises.push(AsyncStorage.setItem('avatar', updates.avatar));
        } else {
          savePromises.push(AsyncStorage.removeItem('avatar'));
        }
      }
      if (updates.type !== undefined) {
        if (updates.type) {
          savePromises.push(AsyncStorage.setItem('type', updates.type));
        } else {
          savePromises.push(AsyncStorage.removeItem('type'));
        }
      }
      if (updates.EntityAccountId !== undefined) {
        if (updates.EntityAccountId) {
          savePromises.push(AsyncStorage.setItem('EntityAccountId', updates.EntityAccountId));
        } else {
          savePromises.push(AsyncStorage.removeItem('EntityAccountId'));
        }
      }

      // Thực hiện lưu bất đồng bộ (không cần await ở đây vì không block UI)
      Promise.all(savePromises).catch((err) => console.warn('Lưu AsyncStorage thất bại:', err));
    }

    return newState;
  });
};

  return { authState, login, logout, upgradeRole, updateAuthState };
};