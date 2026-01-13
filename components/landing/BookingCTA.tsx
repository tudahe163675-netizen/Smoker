import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  FadeInUp,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';

const { width } = Dimensions.get('window');

const stats = [
  { number: '10K+', label: 'Khách hàng hài lòng' },
  { number: '500+', label: 'Quán bar đối tác' },
  { number: '99%', label: 'Tỷ lệ thành công' },
];

export function BookingCTA() {
  const router = useRouter();
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSpring(1.05, { damping: 2 }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(34, 211, 238, 0.2)', 'rgba(236, 72, 153, 0.2)', 'rgba(34, 211, 238, 0.2)']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View entering={FadeInUp.duration(800)} style={styles.content}>
        {/* Badge */}
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={16} color={Colors.primary} />
          <Text style={styles.badgeText}>Sẵn sàng bắt đầu?</Text>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Đặt Bàn Ngay Hôm Nay</Text>

        {/* Description */}
        <Text style={styles.description}>
          Khám phá những quán bar tuyệt vời và đặt bàn trong vài phút.{'\n'}
          Trải nghiệm dịch vụ đẳng cấp ngay bây giờ!
        </Text>

        {/* CTA Buttons */}
        <View style={styles.buttonContainer}>
          <Animated.View style={pulseStyle}>
            <TouchableOpacity
              onPress={() => router.push('/auth/register')}
              activeOpacity={0.8}
              style={styles.primaryButton}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.primaryButtonText}>Đặt Bàn Ngay</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.8}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Khám Phá Bar</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <Animated.View
              key={index}
              entering={FadeInUp.delay(index * 100).duration(600)}
              style={styles.statItem}
            >
              <Text style={styles.statNumber}>{stat.number}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 211, 238, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.foreground,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 48,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
});

