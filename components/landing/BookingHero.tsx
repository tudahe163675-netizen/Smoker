import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface BookingHeroProps {
  onScroll?: (offsetY: number) => void;
}

export function BookingHero({ onScroll }: BookingHeroProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Animation values
  const floatingY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Floating animation
    floatingY.value = withRepeat(
      withTiming(-20, { duration: 3000 }),
      -1,
      true
    );

    // Fade in animation
    opacity.value = withTiming(1, { duration: 800 });
    scale.value = withSpring(1, { damping: 15 });
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingY.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Particle animations
  const particles = Array.from({ length: 15 }, (_, i) => {
    const particleX = useSharedValue(Math.random() * width);
    const particleY = useSharedValue(Math.random() * height);
    const particleOpacity = useSharedValue(0.3);

    useEffect(() => {
      particleY.value = withRepeat(
        withTiming(particleY.value - 100, { duration: 3000 + Math.random() * 2000 }),
        -1,
        false
      );
      particleOpacity.value = withRepeat(
        withTiming(0.6, { duration: 2000 }),
        -1,
        true
      );
    }, []);

    const particleStyle = useAnimatedStyle(() => ({
      position: 'absolute',
      left: particleX.value,
      top: particleY.value,
      opacity: particleOpacity.value,
    }));

    return { key: i, style: particleStyle };
  });

  const features = [
    { icon: 'calendar-outline', text: 'Chọn ngày giờ', color: Colors.primary },
    { icon: 'people-outline', text: 'Số lượng khách', color: Colors.secondary },
    { icon: 'time-outline', text: 'Xác nhận nhanh', color: Colors.primary },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Animated Background Gradient */}
      <LinearGradient
        colors={['#1f2937', '#374151', '#1f2937']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating Particles */}
      {particles.map((particle) => (
        <Animated.View
          key={particle.key}
          style={[
            particle.style,
            {
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.primary,
            },
          ]}
        />
      ))}

      {/* Main Content */}
      <Animated.View style={[styles.content, containerStyle]}>
        {/* Badge */}
        <Animated.View style={[styles.badge, floatingStyle]}>
          <Ionicons name="sparkles" size={16} color={Colors.primary} />
          <Text style={styles.badgeText}>Đặt bàn nhanh chóng - Ưu tiên hàng đầu</Text>
        </Animated.View>

        {/* Main Heading */}
        <Text style={styles.heading}>
          Đặt Bàn Bar{'\n'}
          <Text style={styles.headingSub}>Dễ Dàng Hơn Bao Giờ Hết</Text>
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          Khám phá và đặt bàn tại những quán bar hàng đầu.{'\n'}
          Trải nghiệm dịch vụ đẳng cấp với chỉ vài cú click.
        </Text>

        {/* Feature Icons */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <Animated.View
              key={index}
              style={[
                styles.featureItem,
                floatingStyle,
                { animationDelay: index * 200 },
              ]}
            >
              <View style={[styles.featureIcon, { backgroundColor: feature.color === Colors.primary ? 'rgba(34, 211, 238, 0.2)' : 'rgba(236, 72, 153, 0.2)' }]}>
                <Ionicons name={feature.icon as any} size={32} color={feature.color} />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </Animated.View>
          ))}
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
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
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              // Scroll to search section
              onScroll?.(height);
            }}
            activeOpacity={0.8}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Khám Phá Bar</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Scroll Indicator */}
      <Animated.View style={[styles.scrollIndicator, floatingStyle]}>
        <View style={styles.scrollIndicatorContainer}>
          <Animated.View style={[styles.scrollIndicatorDot, floatingStyle]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
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
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 44,
  },
  headingSub: {
    color: '#ffffff',
  },
  description: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  featureText: {
    fontSize: 12,
    color: '#d1d5db',
    fontWeight: '500',
  },
  ctaContainer: {
    width: '100%',
    gap: 12,
    paddingHorizontal: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: 32,
    alignItems: 'center',
  },
  scrollIndicatorContainer: {
    width: 24,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'flex-start',
    paddingTop: 8,
    alignItems: 'center',
  },
  scrollIndicatorDot: {
    width: 4,
    height: 12,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});

