import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="login" 
      />
      <Stack.Screen 
        name="register" 
        options={{ title: 'Đăng Ký' }} 
      />
      <Stack.Screen
        name="completeProfile"
        options={{ title: 'Hoàn thiện hồ sơ' }}
      />
    </Stack>
  );
}
