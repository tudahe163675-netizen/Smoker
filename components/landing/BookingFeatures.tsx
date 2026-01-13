import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';


const features = [
  {
    icon: 'calendar-outline',
    title: 'Đặt bàn nhanh chóng',
    description: 'Chọn ngày giờ phù hợp chỉ trong vài giây',
    colors: [Colors.primary, '#06b6d4'],
  },
  {
    icon: 'time-outline',
    title: 'Xác nhận tức thì',
    description: 'Nhận xác nhận đặt bàn ngay lập tức',
    colors: [Colors.secondary, '#ec4899'],
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Bảo mật thông tin',
    description: 'Thông tin của bạn được bảo vệ an toàn',
    colors: ['#10b981', '#059669'],
  },
  {
    icon: 'star-outline',
    title: 'Đánh giá thực tế',
    description: 'Xem đánh giá từ khách hàng đã sử dụng dịch vụ',
    colors: ['#f59e0b', '#d97706'],
  },
  {
    icon: 'flash-outline',
    title: 'Thông báo thông minh',
    description: 'Nhận thông báo nhắc nhở trước giờ đặt bàn',
    colors: ['#8b5cf6', '#7c3aed'],
  },
  {
    icon: 'people-outline',
    title: 'Quản lý nhóm',
    description: 'Dễ dàng đặt bàn cho nhóm bạn bè',
    colors: ['#3b82f6', '#2563eb'],
  },
  {
    icon: 'card-outline',
    title: 'Thanh toán linh hoạt',
    description: 'Nhiều phương thức thanh toán an toàn',
    colors: ['#14b8a6', '#0d9488'],
  },
  {
    icon: 'notifications-outline',
    title: 'Nhắc nhở tự động',
    description: 'Hệ thống tự động nhắc nhở bạn về lịch đặt bàn',
    colors: ['#ef4444', '#dc2626'],
  },
];

interface FeatureItemProps {
  feature: typeof features[0];
  index: number;
}

function FeatureItem({ feature, index }: FeatureItemProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(index * 50, withTiming(1, { duration: 400 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.listItem, animatedStyle]}>
      <LinearGradient
        colors={feature.colors}
        style={styles.listIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={feature.icon as any} size={24} color="#ffffff" />
      </LinearGradient>

      <View style={styles.listContent}>
        <Text style={styles.listTitle}>{feature.title}</Text>
        <Text style={styles.listDescription}>{feature.description}</Text>
      </View>
    </Animated.View>
  );
}

export function BookingFeatures() {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
        <Text style={styles.title}>Tại Sao Chọn Chúng Tôi?</Text>
        <Text style={styles.subtitle}>
          Trải nghiệm dịch vụ đặt bàn bar hiện đại với những tính năng độc đáo
        </Text>
      </Animated.View>

      {/* Features List */}
      <View style={styles.listContainer}>
        {features.map((feature, index) => (
          <FeatureItem key={index} feature={feature} index={index} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.mutedForeground,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  listContainer: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 16,
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  listIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 4,
  },
  listDescription: {
    fontSize: 14,
    color: Colors.mutedForeground,
    lineHeight: 20,
  },
});

