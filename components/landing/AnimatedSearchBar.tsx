import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';

const { width } = Dimensions.get('window');

export function AnimatedSearchBar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const scale = useSharedValue(1);
  const borderColor = useSharedValue(Colors.border);

  useEffect(() => {
    if (isFocused) {
      scale.value = withTiming(1.02, { duration: 200 });
      borderColor.value = withTiming(Colors.primary, { duration: 200 });
    } else {
      scale.value = withTiming(1, { duration: 200 });
      borderColor.value = withTiming(Colors.border, { duration: 200 });
    }
  }, [isFocused]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: borderColor.value,
  }));

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
        <Text style={styles.title}>Tìm Kiếm Quán Bar Yêu Thích</Text>
        <Text style={styles.subtitle}>
          Khám phá hàng trăm quán bar tuyệt vời trong thành phố
        </Text>
      </Animated.View>

      <Animated.View style={[styles.searchContainer, animatedContainerStyle]}>
        <Ionicons
          name="search"
          size={20}
          color={isFocused ? Colors.primary : Colors.mutedForeground}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Tìm kiếm quán bar, DJ, sự kiện..."
          placeholderTextColor={Colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          onPress={handleSearch}
          disabled={!searchQuery.trim()}
          style={[
            styles.searchButton,
            !searchQuery.trim() && styles.searchButtonDisabled,
          ]}
        >
          <LinearGradient
            colors={searchQuery.trim() ? [Colors.primary, Colors.secondary] : [Colors.mutedForeground, Colors.mutedForeground]}
            style={styles.searchButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.searchButtonText}>Tìm</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Quick Filters */}
      {isFocused && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={styles.filtersContainer}
        >
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="location-outline" size={16} color={Colors.primary} />
            <Text style={styles.filterText}>Gần đây</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="calendar-outline" size={16} color={Colors.secondary} />
            <Text style={styles.filterText}>Hôm nay</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.foreground,
    paddingVertical: 16,
  },
  searchButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.foreground,
  },
});

