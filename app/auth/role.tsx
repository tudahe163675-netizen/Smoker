import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  StatusBar,
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
    { key: 'dance', label: 'Dancer' },
    { key: 'owner', label: 'Chủ quán bar' },
  ];

  const onConfirm = (role: string) => {
    setSelectedRole(role);
    Alert.alert('Thành công', `Bạn đã chọn vai trò: ${role}`, [
      {
        text: 'OK',
        onPress: () => router.replace('/(tabs)'),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="transparent" 
        translucent 
      />
      
      {/* Nút Back */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo.jpeg')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.brandText}>SMOKER</Text>
        </View>

        <Text style={styles.question}>
          Bạn muốn đăng ký với vai trò nào?
        </Text>

        <View style={styles.rolesBox}>
          {roles.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.roleBtn}
              onPress={() => onConfirm(item.label)}
              activeOpacity={0.8}
            >
              <Text style={styles.roleText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 52,
    left: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  brandText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  question: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
    color: '#374151',
    fontWeight: '600',
  },
  rolesBox: {
    gap: 12,
    marginBottom: 24,
  },
  roleBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});