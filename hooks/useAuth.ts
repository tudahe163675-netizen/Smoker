import { AuthState, Role } from '@/constants/authData';
import { loginApi, upgradeRoleApi } from '@/services/authApi'; // Cập nhật đường dẫn nếu cần
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
  });

  useEffect(() => {
    const loadAuthState = async () => {
      const savedEmail = await AsyncStorage.getItem('userEmail');
      const savedToken = await AsyncStorage.getItem('token');
      const savedRole = await AsyncStorage.getItem('role') as Role | null;
      if (savedEmail && savedToken && savedRole) {
        setAuthState({
          isAuthenticated: true,
          userEmail: savedEmail,
          token: savedToken,
          role: savedRole,
        });
      } else if (savedEmail && savedToken) {
        setAuthState({
          isAuthenticated: true,
          userEmail: savedEmail,
          token: savedToken,
          role: Role.USER, // Default to user role
        });
      }
    };
    loadAuthState();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const response = await loginApi(email, password);
      if (response.success) {
        const { token, role } = response.data;
        setAuthState({
          isAuthenticated: true,
          userEmail: email,
          role,
          token,
        });
        if (rememberMe) {
          await AsyncStorage.setItem('userEmail', email);
          await AsyncStorage.setItem('token', token);
          await AsyncStorage.setItem('role', role);
        }
        router.replace('/(tabs)');
      } else {
        Alert.alert('Đăng nhập thất bại', response.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng nhập');
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
        const { newRole: updatedRole } = response.data;
        setAuthState((prev) => ({
          ...prev,
          role: updatedRole,
        }));
        // Lưu role mới vào AsyncStorage
        await AsyncStorage.setItem('role', updatedRole);
        Alert.alert('Thành công', 'Vai trò đã được nâng cấp!');
        // Có thể điều hướng hoặc refresh
        router.replace('/(tabs)');
      } else {
        Alert.alert('Nâng cấp thất bại', response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi nâng cấp');
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['userEmail', 'token', 'role']);
    setAuthState({ isAuthenticated: false, userEmail: undefined, role: undefined, token: undefined });
    router.replace('/auth/login');
  };

  return { authState, login, logout, upgradeRole };
};