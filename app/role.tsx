import { Role } from '@/constants/authData';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SelectRoleScreen() {
  const router = useRouter();
  const { upgradeRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const roles = [
    { key: Role.DJ, label: 'Nâng cấp thành DJ chuyên nghiệp', price: 199000 },
    { key: Role.DANCER, label: 'Nâng cấp thành Dancer xuất sắc', price: 149000 },
    { key: Role.BAR_OWNER, label: 'Nâng cấp thành Chủ quán bar VIP', price: 299000 },
  ];

  const onConfirm = (role: Role, price: number) => {
    setSelectedRole(role);
    Alert.alert(
      'Xác nhận nâng cấp',
      `Bạn muốn nâng cấp lên vai trò "${role.toLowerCase().replace('_', ' ')}" với giá ${new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(price)}?\nNhận ngay lợi ích độc quyền và đãi ngộ đặc biệt!`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Nâng cấp',
          onPress: () => {
            upgradeRole(role);
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Nút Back */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color="#1e293b" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image source={require('@/assets/images/logo.jpeg')} style={styles.logo} contentFit="contain" />
          <Text style={styles.brandText}>SMOKER</Text>
        </View>

        <Text style={styles.title}>
          Nâng cấp tài khoản - Mở khóa tiềm năng của bạn!
        </Text>
        <Text style={styles.subtitle}>
          Khám phá lợi ích độc quyền và đãi ngộ hấp dẫn khi nâng cấp vai trò.
        </Text>

        <View style={styles.rolesBox}>
          {roles.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.roleBtn}
              onPress={() => onConfirm(item.key, item.price)}
              activeOpacity={0.8}
            >
              <View>
                <Text style={styles.roleLabel}>{item.label}</Text>
                <Text style={styles.rolePrice}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                </Text>
              </View>
              <Ionicons name="sparkles" size={24} color="#4e33eaff" />
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
    backgroundColor: '#f1f5f9', // Màu nền nhẹ nhàng
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
    paddingHorizontal: 24,
    paddingTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 12,
    borderRadius: 20, // Bo góc logo
  },
  brandText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1f2024ff',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: '#ddd',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: '#ddd',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  rolesBox: {
    gap: 20,
    width: '100%',
  },
  roleBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#4e33eaff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    backgroundImage: 'linear-gradient(to right, #eef2ff, #ffffff)', // Gradient nền
  },
  roleLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
  rolePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4e33eaff',
    marginTop: 4,
  },
});