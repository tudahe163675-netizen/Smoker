import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LandingScreen from './landing';
import { StyleSheet } from 'react-native';

export default function IndexScreen() {
  const router = useRouter();
  const { authState } = useAuth();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Đợi một chút để đảm bảo auth state đã được load từ AsyncStorage
      // (useAuth hook có useEffect load từ AsyncStorage)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Kiểm tra token trong AsyncStorage để xác nhận
      const token = await AsyncStorage.getItem('token');
      const isAuthenticated = authState.isAuthenticated || !!token;

      if (isAuthenticated) {
        // Nếu đã đăng nhập, chuyển đến trang chính
        router.replace('/(tabs)');
      }
      // Nếu chưa đăng nhập, hiển thị landing page (không redirect)
    };

    checkAuthAndRedirect();
  }, [authState.isAuthenticated, router]);

  // Hiển thị landing page nếu chưa đăng nhập
  if (!authState.isAuthenticated) {
    return <LandingScreen />;
  }

  // Nếu đã đăng nhập, component sẽ redirect trong useEffect
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 300,
    height: 300,
  },
});

