import Checkbox from 'expo-checkbox';
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

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);

  const onRegister = () => {
    if (!agree) {
      Alert.alert('Error', 'You must agree with the terms and conditions');
      return;
    }
    router.push('/auth/role');
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
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          placeholder="Phone number"
          style={styles.input}
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
          value={confirm}
          onChangeText={setConfirm}
        />

        {/* Checkbox terms */}
        <View style={styles.checkboxContainer}>
          <Checkbox
            value={agree}
            onValueChange={setAgree}
            color={agree ? '#2563eb' : undefined}
          />
          <Text style={styles.checkboxText}>
            I have read and agree with the terms and conditions
          </Text>

        </View>

        <TouchableOpacity
          style={[styles.button, !agree && { backgroundColor: '#9ca3af' }]}
          onPress={onRegister}
          disabled={!agree}
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginLink}>Login</Text>
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
  loginText: {
    textAlign: 'center',
    color: '#374151',
  },
  loginLink: {
    color: '#2563eb',
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxText: {
    marginLeft: 8,
    color: '#374151',
    fontSize: 14,
  },
});
