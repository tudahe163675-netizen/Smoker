import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SelectRoleScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    { key: 'customer', label: 'Khách hàng' },
    { key: 'dj', label: 'DJ' },
    { key: 'dance', label: 'Dance' },
    { key: 'owner', label: 'Chủ quán bar' },
  ];

  const onConfirm = (role: string) => {
    setSelectedRole(role);
    Alert.alert('Thành công', `Bạn đã chọn: ${role}`);
    router.replace('/(tabs)'); // vào app chính
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.brandText}>SMOKER</Text>
      </View>

      <Text style={styles.question}>Bạn muốn đăng ký với tư cách thành viên gì?</Text>

      <View style={styles.rolesBox}>
        {roles.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.roleBtn}
            onPress={() => onConfirm(item.label)}
          >
            <Text style={styles.roleText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  backBtn: {
    marginBottom: 10,
  },
  backText: {
    color: '#2563eb',
    fontSize: 14,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  brandText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textTransform: 'uppercase',
  },
  question: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#374151',
  },
  rolesBox: {
    gap: 12,
  },
  roleBtn: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});
