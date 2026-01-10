import { useAuth } from '@/hooks/useAuth';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      } else {
        // Nếu chưa đăng nhập, chuyển đến trang login
        router.replace('/auth/login');
      }
    };

    checkAuthAndRedirect();
  }, [authState.isAuthenticated, router]);

  // Hiển thị logo trong khi kiểm tra
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/13.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </View>
    </View>
  );
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

