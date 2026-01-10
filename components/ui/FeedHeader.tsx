import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';

interface FeedHeaderProps {
  onSearchPress?: () => void;
  onMessagesPress?: () => void;
  unreadMessageCount?: number;
}

export default function FeedHeader({
  onSearchPress,
  onMessagesPress,
  unreadMessageCount = 0,
}: FeedHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {/* Logo - giống web */}
        <TouchableOpacity
          style={styles.logoContainer}
          onPress={() => router.push('/(tabs)')}
        >
          <Image
            source={require('@/assets/images/13.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Search Bar - giống web */}
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={onSearchPress}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={20} color={Colors.mutedForeground} />
            <Text style={styles.searchPlaceholder}>Tìm kiếm...</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Icons - chỉ giữ lại Messages, vì Home/Profile đã có ở bottom tab */}
        <View style={styles.navIcons}>
          {/* Messages */}
          <TouchableOpacity
            style={styles.navIcon}
            onPress={onMessagesPress}
          >
            <Ionicons name="chatbubble-outline" size={24} color={Colors.mutedForeground} />
            {unreadMessageCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    flexShrink: 0,
  },
  logo: {
    height: 48,
    width: 'auto',
    aspectRatio: 2.5, // Giữ tỷ lệ logo
  },
  searchContainer: {
    flex: 1,
    maxWidth: 400,
    marginHorizontal: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.muted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  navIcons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    backgroundColor: Colors.danger,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.card,
    zIndex: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 1,
  },
});


