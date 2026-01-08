import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();

  const onLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    // Gọi hàm login từ hook
    login(email, password, rememberMe);
  };

  const onGoRegister = () => {
    router.push('/auth/register');
  };

  const onGoForgotPassword = () => {
    router.push('/auth/forgotPassword');
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="transparent" 
        translucent 
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logo.jpeg')}
              style={styles.reactLogo}
              contentFit="contain"
            />
            <Text style={styles.brandText}>SMOKER</Text>
          </View>

          <View>
            <TextInput
              placeholder="Email"
              style={styles.input}
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Mật khẩu"
                style={styles.passwordInput}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
            </View>

            {/* Checkbox nhớ đăng nhập */}
            <View style={styles.rememberContainer}>
              <View style={styles.checkboxWrapper}>
                <Checkbox
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  color={rememberMe ? '#2563eb' : undefined}
                  disabled={isLoading}
                />
                <Text style={styles.rememberText}>Nhớ đăng nhập</Text>
              </View>

              <TouchableOpacity 
                onPress={onGoForgotPassword} 
                disabled={isLoading}
              >
                <Text style={styles.forgotText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={onLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={onGoRegister} disabled={isLoading}>
              <Text style={styles.registerText}>
                Bạn chưa có tài khoản? <Text style={styles.registerLink}>Đăng ký</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  reactLogo: {
    width: '100%',
    height: 180,
  },
  brandText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#111827',
    textTransform: 'uppercase',
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    fontSize: 15,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    paddingRight: 45,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    fontSize: 15,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  rememberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    marginLeft: 8,
    color: '#374151',
    fontSize: 14,
  },
  forgotText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#93bbf5',
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  registerText: {
    textAlign: 'center',
    color: '#374151',
  },
  registerLink: {
    color: '#2563eb',
    fontWeight: '600',
  },
});