import { AuthState, Role } from '@/constants/authData';
import { useAuthContext } from '@/contexts/AuthProvider';
import { fetchUserEntities, loginApi, upgradeRoleApi } from '@/services/authApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

export const useAuth = () => {
  const router = useRouter();
  const { authState, setAuthState } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

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
      const saveEntities = await AsyncStorage.getItem('entities');

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
          entities: saveEntities ? JSON.parse(saveEntities) : [],
        });
      }
    };
    loadAuthState();
  }, []);


  const login = async (email: string, password: string, rememberMe: boolean) => {
    setIsLoading(true);
    try {
      const res = await loginApi(email, password);

      // Kiểm tra nếu có lỗi từ API
      // Backend trả về token trực tiếp khi thành công, không có field success
      // Nếu có status 401 hoặc không có token thì là lỗi
      if (res.status === 401 || !res.token) {
        const errorMessage = res.message || res.error || 'Email hoặc mật khẩu không đúng';
        Alert.alert('Đăng nhập thất bại', errorMessage);
        console.log('Login failed:', res);
        return;
      }

      const token = res.token;
      const currentId = res.user.id;
      const role = res.user?.role;

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
        entities,
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
        await AsyncStorage.setItem('entities', JSON.stringify(entities));
      }

      if (res.needProfile){
        router.replace('/auth/completeProfile');
        return;
      }
      router.replace('/(tabs)');

    } catch (error) {
      console.log(error);
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeRole = async (newRole: Role) => {
    if (!authState.userEmail) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
      return;
    }
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEntities = async () => {
    setIsLoading(true);
    try {
      const token = authState.token;
      const currentId = authState.currentId;

      if (!token || !currentId) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin đăng nhập");
        return;
      }

      const entities = await fetchUserEntities(currentId, token);

      if (!entities || entities.length === 0) {
        Alert.alert("Lỗi", "Không tìm thấy tài khoản liên kết");
        return;
      }

      setAuthState(prev => ({
        ...prev,
        entities,
      }));

      await AsyncStorage.setItem("entities", JSON.stringify(entities));

    } catch (error) {
      console.log("fetchEntities error:", error);
      Alert.alert("Lỗi", "Không thể kết nối đến server");
    } finally {
      setIsLoading(false);
    }
  };


  const logout = async () => {
    // Xóa tất cả các keys liên quan đến authentication
    await AsyncStorage.multiRemove([
      'userEmail',
      'token',
      'role',
      'currentId',
      'avatar',
      'type',
      'EntityAccountId'
    ]);
    setAuthState({
      isAuthenticated: false,
      userEmail: undefined,
      role: undefined,
      token: undefined,
      currentId: undefined,
      type: undefined,
      avatar: undefined,
      EntityAccountId: undefined,
      entities: [],
    });
    router.replace('/auth/login');
  };

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

  return { authState, login, logout, upgradeRole, updateAuthState, isLoading, fetchEntities };
};