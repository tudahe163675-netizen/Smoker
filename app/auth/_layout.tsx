import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false ,
          title: 'Đăng Nhập'
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ title: 'Đăng Ký' }} 
      />
      <Stack.Screen 
        name="role" 
        options={{ title: 'Lựa chọn mục đích' }} 
      />
    </Stack>
  );
}
