import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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

  const onLogin = () => {
    // 🔑 Fake logic check login
    if (email === 'test@example.com' && password === '123456') {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Login failed', 'Invalid email or password');
    }
  };

  const onGoRegister = () => {
    router.push('/auth/register');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.reactLogo}
          contentFit="contain"
        />

        <Text style={styles.brandText}>SMOKE</Text>
      </View>

      <View>
        <TextInput
          placeholder="Username"
          style={styles.input}
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Password"
          style={styles.input}
          secureTextEntry
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={onLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onGoRegister}>
          <Text style={styles.registerText}>
            Don’t have an account? <Text style={styles.registerLink}>Register</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
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
  logoContainer: {
    alignItems: 'center', // căn giữa ngang
    marginBottom: 20,
  },
  reactLogo: {
    width: '100%',
    height: 180,     // chiều cao cố định (hoặc tỉ lệ bạn muốn)
  },
  brandText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#111827',
    textTransform: 'uppercase',
    marginTop: 20
  }
});
