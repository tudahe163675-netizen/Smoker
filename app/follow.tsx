import { FollowUser, UserRole } from '@/constants/followData';
import { FollowType, useFollow } from '@/hooks/useFollow';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Tách SearchBar thành component riêng và memo
const SearchBar = React.memo(({ 
  searchQuery, 
  onSearchChange 
}: { 
  searchQuery: string; 
  onSearchChange: (text: string) => void;
}) => {
  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#9ca3af" />
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm theo tên, username..."
        placeholderTextColor="#9ca3af"
        value={searchQuery}
        onChangeText={onSearchChange}
      />
      {searchQuery !== '' && (
        <TouchableOpacity onPress={() => onSearchChange('')}>
          <Ionicons name="close-circle" size={20} color="#9ca3af" />
        </TouchableOpacity>
      )}
    </View>
  );
});

// Tách TabNavigation thành component riêng và memo
const TabNavigation = React.memo(({ 
  activeTab, 
  onTabChange 
}: { 
  activeTab: FollowType; 
  onTabChange: (tab: FollowType) => void;
}) => {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
        onPress={() => onTabChange('followers')}
      >
        <Ionicons 
          name="people" 
          size={18} 
          color={activeTab === 'followers' ? '#2563eb' : '#9ca3af'}
          style={{ marginRight: 6 }}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'followers' && styles.activeTabText,
          ]}
        >
          Người theo dõi
        </Text>
        {activeTab === 'followers' && (
          <View style={styles.tabIndicator} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'following' && styles.activeTab]}
        onPress={() => onTabChange('following')}
      >
        <Ionicons 
          name="person-add" 
          size={18} 
          color={activeTab === 'following' ? '#2563eb' : '#9ca3af'}
          style={{ marginRight: 6 }}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'following' && styles.activeTabText,
          ]}
        >
          Đang theo dõi
        </Text>
        {activeTab === 'following' && (
          <View style={styles.tabIndicator} />
        )}
      </TouchableOpacity>
    </View>
  );
});

export default function FollowScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { authState } = useAuth();
  const initialTab = (params.type as FollowType) || 'followers';
  const userId = (params.userId as string) || '1';

  const [activeTab, setActiveTab] = useState<FollowType>(initialTab);

  const followersData = useFollow(userId, 'followers');
  const followingData = useFollow(userId, 'following');

  const currentData = activeTab === 'followers' ? followersData : followingData;

  // Get role badge config
  const getRoleBadge = useCallback((role: UserRole) => {
    switch (role) {
      case UserRole.DJ:
        return { 
          bg: '#8b5cf6', 
          text: 'DJ',
          icon: 'musical-notes' as const
        };
      case UserRole.DANCER:
        return { 
          bg: '#ec4899', 
          text: 'Dancer',
          icon: 'body' as const
        };
      case UserRole.CUSTOMER:
        return { 
          bg: '#10b981', 
          text: 'Khách',
          icon: 'person' as const
        };
      default:
        return { 
          bg: '#6b7280', 
          text: 'User',
          icon: 'person' as const
        };
    }
  }, []);

  const handleUserPress = useCallback((user: FollowUser) => {
    const targetUserId = user.userId || user.id;
    
    // Check if this is current user's own profile
    if (authState.EntityAccountId && 
        String(authState.EntityAccountId).toLowerCase() === String(targetUserId).toLowerCase()) {
      router.push('/(tabs)/profile');
    } else {
      router.push({
        pathname: '/user',
        params: { id: targetUserId }
      });
    }
  }, [router, authState.EntityAccountId]);

  const handleFollowPress = useCallback((user: FollowUser) => {
    const targetUserId = user.userId || user.id;
    if (user.isFollowing) {
      Alert.alert(
        'Bỏ theo dõi',
        `Bạn có chắc muốn bỏ theo dõi ${user.name}?\n\n⚠️ Bạn sẽ không còn thấy bài viết của họ nữa.`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Bỏ theo dõi',
            style: 'destructive',
            onPress: () => currentData.handleUnfollow(targetUserId),
          },
        ]
      );
    } else {
      currentData.handleFollow(targetUserId);
    }
  }, [currentData]);


  const renderUserItem = useCallback(({ item }: { item: FollowUser }) => {
    const isLoading = currentData.actionLoading === item.userId || currentData.actionLoading === item.id;
    const roleBadge = getRoleBadge(item.role);
    
    // Check if this is current user's own profile
    const isOwnProfile = authState.EntityAccountId && 
      (String(authState.EntityAccountId).toLowerCase() === String(item.userId || item.id).toLowerCase());

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <View style={[styles.roleIndicator, { backgroundColor: roleBadge.bg }]}>
            <Ionicons name={roleBadge.icon} size={12} color="#fff" />
          </View>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
              <Text style={styles.roleBadgeText}>{roleBadge.text}</Text>
            </View>
          </View>
          <Text style={styles.userUsername} numberOfLines={1}>
            {item.username}
          </Text>
          {item.bio && (
            <Text style={styles.userBio} numberOfLines={2}>
              {item.bio}
            </Text>
          )}
          {item.mutualFollowers && item.mutualFollowers > 0 && (
            <View style={styles.mutualContainer}>
              <Ionicons name="people" size={12} color="#9ca3af" />
              <Text style={styles.mutualText}>
                {item.mutualFollowers} người theo dõi chung
              </Text>
            </View>
          )}
        </View>

        {!isOwnProfile && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.followButton,
                item.isFollowing && styles.followingButton,
              ]}
              onPress={() => handleFollowPress(item)}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={item.isFollowing ? '#6b7280' : '#fff'} />
              ) : (
                <>
                  <Ionicons 
                    name={item.isFollowing ? 'checkmark-circle' : 'add-circle'} 
                    size={16} 
                    color={item.isFollowing ? '#6b7280' : '#fff'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.followButtonText,
                      item.isFollowing && styles.followingButtonText,
                    ]}
                  >
                    {item.isFollowing ? 'Đang follow' : 'Follow'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [activeTab, currentData.actionLoading, currentData.handleFollow, currentData.handleUnfollow, handleUserPress, handleFollowPress, getRoleBadge, authState.EntityAccountId]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons
          name={activeTab === 'followers' ? 'people-outline' : 'person-add-outline'}
          size={80}
          color="#d1d5db"
        />
      </View>
      <Text style={styles.emptyTitle}>
        {activeTab === 'followers'
          ? 'Chưa có người theo dõi'
          : 'Chưa theo dõi ai'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'followers'
          ? 'Khi có người theo dõi bạn, họ sẽ hiển thị ở đây'
          : 'Khám phá và theo dõi DJ, dancer yêu thích của bạn'}
      </Text>
    </View>
  ), [activeTab]);

  // Memoize header để tránh re-create
  const ListHeaderComponent = useMemo(() => (
    <View style={styles.headerContainer}>
      <SearchBar 
        searchQuery={currentData.searchQuery}
        onSearchChange={currentData.handleSearch}
      />
      <TabNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </View>
  ), [currentData.searchQuery, currentData.handleSearch, activeTab]);

  if (currentData.loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Theo dõi</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Theo dõi</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        ListHeaderComponent={ListHeaderComponent}
        data={currentData.users}
        renderItem={renderUserItem}
        keyExtractor={item => item.id || item.userId}
        contentContainerStyle={[
          styles.listContent,
          currentData.users.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={currentData.refreshing}
            onRefresh={currentData.onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  activeTab: {
    // Active state
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9ca3af',
  },
  activeTabText: {
    color: '#2563eb',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#2563eb',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  listContent: {
    paddingBottom: 20,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    marginBottom: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#f3f4f6',
  },
  roleIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  userUsername: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  userBio: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
    marginBottom: 4,
  },
  mutualContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  mutualText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    minWidth: 110,
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  followingButton: {
    backgroundColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  followingButtonText: {
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});